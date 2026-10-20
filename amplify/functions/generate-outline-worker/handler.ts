declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { assertNoErrors, getErrorMessage } from "../shared/common";
import { consumeUsage, refundUsage } from "../shared/usage";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  process.env as Parameters<typeof getAmplifyDataClientConfig>[0],
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

type Handler = Schema["importJourney"]["functionHandler"];
type LessonRecord = Schema["Lesson"]["type"];

/** Sanity guard, same size as the outline generator's ceiling. */
const MAX_IMPORT_LESSONS = 400;
const WRITE_CHUNK = 15;

interface Page<T> {
  data: T[] | null | undefined;
  errors?: Parameters<typeof assertNoErrors>[0];
  nextToken?: string | null;
}

async function readAll<T>(
  fetchPage: (nextToken: string | null | undefined) => Promise<Page<T>>,
  errorCode: string,
): Promise<T[]> {
  const items: T[] = [];
  let nextToken: string | null | undefined;

  do {
    const page = await fetchPage(nextToken);
    assertNoErrors(page.errors, errorCode);
    items.push(...(page.data ?? []));
    nextToken = page.nextToken;
  } while (nextToken);

  return items;
}

/** JSON fields travel as strings; pass them through unchanged. */
function asJson(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * A lesson is copied with its content only when it is fully finished: card
 * lessons need their practice questions too. Anything else is copied as an
 * empty PENDING lesson and is written the first time the learner opens it.
 */
function isFinished(lesson: LessonRecord): boolean {
  if (lesson.status !== "READY") return false;
  if (!lesson.content) return Boolean(lesson.coreContent); // older article lessons
  return lesson.practiceStatus === "READY" && Boolean(lesson.practice);
}

/**
 * Copies a published journey (zones + lessons) into the caller's account.
 *
 * The browser cannot do this itself: other people's journeys are private to
 * them, and lessons can only be written by functions (so XP can't be faked).
 * Everything the caller receives is a new record they own, with their own
 * progress. The author's personalization answers are never copied.
 */
export const handler: Handler = async (event, context) => {
  const requestId = context.awsRequestId;

  const publicJourneyId = (event.arguments.publicJourneyId ?? "").trim();
  if (!publicJourneyId) throw new Error("PUBLIC_JOURNEY_ID_REQUIRED");

  const identity = event.identity as { sub?: string } | null | undefined;
  const owner = identity?.sub?.trim();
  if (!owner) throw new Error("IMPORT_OWNER_IDENTITY_MISSING");

  /** 1. The listing and the author's journey behind it */
  const listingResult = await client.models.PublicJourney.get({ id: publicJourneyId });
  assertNoErrors(listingResult.errors, "PUBLIC_JOURNEY_LOAD_FAILED");

  const listing = listingResult.data;
  if (!listing) throw new Error("PUBLIC_JOURNEY_NOT_FOUND");

  const sourceResult = await client.models.Course.get({ id: listing.courseId });
  assertNoErrors(sourceResult.errors, "SOURCE_JOURNEY_LOAD_FAILED");

  const source = sourceResult.data;
  if (!source || source.status !== "READY") throw new Error("SOURCE_JOURNEY_UNAVAILABLE");

  // Importing your own journey just opens it.
  if (source.owner === owner) return source;

  const [sourcePhases, sourceLessons] = await Promise.all([
    readAll(
      (nextToken) => source.phases({ limit: 1000, nextToken }),
      "SOURCE_PHASES_LOAD_FAILED",
    ),
    readAll(
      (nextToken) => source.lessons({ limit: 1000, nextToken }),
      "SOURCE_LESSONS_LOAD_FAILED",
    ),
  ]);

  if (sourcePhases.length === 0 || sourceLessons.length === 0) {
    throw new Error("SOURCE_JOURNEY_EMPTY");
  }
  if (sourceLessons.length > MAX_IMPORT_LESSONS) throw new Error("SOURCE_JOURNEY_TOO_LARGE");

  const lessonsByPhase = new Map<string, LessonRecord[]>();
  for (const lesson of sourceLessons) {
    const list = lessonsByPhase.get(lesson.phaseId) ?? [];
    list.push(lesson);
    lessonsByPhase.set(lesson.phaseId, list);
  }

  console.info("Importing journey", {
    requestId,
    publicJourneyId,
    sourceCourseId: source.id,
    zones: sourcePhases.length,
    lessons: sourceLessons.length,
  });

  // An imported journey counts as a new journey for today's allowance. Taken
  // here, after the checks above, so a request that was never going to work
  // costs nothing.
  await consumeUsage(owner, "coursesCreated");

  /** 2. Build the copy (GENERATING until everything is written) */
  const createdLessonIds: string[] = [];
  const createdPhaseIds: string[] = [];
  let courseId: string | undefined;

  try {
    const courseResult = await client.models.Course.create({
      owner,
      title: source.title,
      topic: source.topic,
      description: source.description ?? undefined,
      heroImageUrl: listing.heroImageUrl ?? source.heroImageUrl ?? undefined,
      // personalizationProfile is deliberately NOT copied: it holds the
      // author's private onboarding answers.
      sourceJourneyId: listing.id,
      authorUsername: listing.authorUsername ?? undefined,
      status: "GENERATING",
    });
    assertNoErrors(courseResult.errors, "COURSE_CREATE_FAILED");

    const course = courseResult.data;
    if (!course) throw new Error("COURSE_CREATE_FAILED");
    courseId = course.id;

    const outline: {
      zones: { id: string; title: string; lessons: { id: string; title: string; hook: string }[] }[];
    } = { zones: [] };

    const orderedPhases = [...sourcePhases].sort((a, b) => a.order - b.order);

    for (const [phaseIndex, phase] of orderedPhases.entries()) {
      const phaseResult = await client.models.Phase.create({
        owner,
        courseId: course.id,
        order: phaseIndex + 1,
        title: phase.title,
        locked: phaseIndex !== 0, // fresh progress: only the first zone is open
      });
      assertNoErrors(phaseResult.errors, "PHASE_CREATE_FAILED");

      const newPhase = phaseResult.data;
      if (!newPhase) throw new Error(`PHASE_CREATE_FAILED: ${phase.title}`);
      createdPhaseIds.push(newPhase.id);

      const phaseLessons = [...(lessonsByPhase.get(phase.id) ?? [])].sort((a, b) => a.order - b.order);
      const outlineLessons: { id: string; title: string; hook: string }[] = [];

      for (let start = 0; start < phaseLessons.length; start += WRITE_CHUNK) {
        const chunk = phaseLessons.slice(start, start + WRITE_CHUNK);

        const results = await Promise.allSettled(
          chunk.map(async (lesson, offset) => {
            const finished = isFinished(lesson);

            const created = await client.models.Lesson.create({
              owner,
              courseId: course.id,
              phaseId: newPhase.id,
              order: start + offset + 1,
              title: lesson.title,
              hook: lesson.hook ?? undefined,
              status: finished ? "READY" : "PENDING",
              ...(finished
                ? {
                    coreContent: lesson.coreContent ?? undefined,
                    keyTerms: asJson(lesson.keyTerms),
                    quiz: asJson(lesson.quiz),
                    content: asJson(lesson.content),
                    contentVersion: lesson.contentVersion ?? undefined,
                    practice: asJson(lesson.practice),
                    practiceStatus: lesson.practice ? ("READY" as const) : undefined,
                    // generatedAt is left empty on purpose: the learner did not
                    // generate this lesson, so it must not count against
                    // their daily generation allowance.
                  }
                : {}),
            });
            assertNoErrors(created.errors, "LESSON_CREATE_FAILED");

            if (!created.data) throw new Error(`LESSON_CREATE_FAILED: ${lesson.title}`);
            createdLessonIds.push(created.data.id);

            return { id: created.data.id, title: lesson.title, hook: lesson.hook ?? "" };
          }),
        );

        const failure = results.find((result) => result.status === "rejected");
        if (failure && failure.status === "rejected") throw failure.reason;

        results.forEach((result) => {
          if (result.status === "fulfilled") outlineLessons.push(result.value);
        });
      }

      outline.zones.push({ id: newPhase.id, title: phase.title, lessons: outlineLessons });
    }

    /** 3. Finish: outline with the NEW ids (the lesson writer reads it), READY */
    const finalResult = await client.models.Course.update({
      id: course.id,
      outline: JSON.stringify(outline),
      status: "READY",
      generationError: null,
    });
    assertNoErrors(finalResult.errors, "COURSE_FINALIZE_FAILED");
    if (!finalResult.data) throw new Error("COURSE_FINALIZE_FAILED");

    console.info("Journey imported", { requestId, courseId: course.id, lessons: createdLessonIds.length });

    return finalResult.data;
  } catch (error) {
    console.error("Journey import failed", { requestId, publicJourneyId, error: getErrorMessage(error) });

    // Best-effort cleanup so a failed import leaves nothing half-built.
    await rollback(courseId, createdPhaseIds, createdLessonIds);
    await refundUsage(owner, "coursesCreated");

    throw new Error("IMPORT_FAILED");
  }
};

async function rollback(
  courseId: string | undefined,
  phaseIds: string[],
  lessonIds: string[],
): Promise<void> {
  const removeAll = async (ids: string[], remove: (id: string) => Promise<unknown>) => {
    for (let start = 0; start < ids.length; start += WRITE_CHUNK) {
      await Promise.allSettled(ids.slice(start, start + WRITE_CHUNK).map(remove));
    }
  };

  try {
    await removeAll(lessonIds, (id) => client.models.Lesson.delete({ id }));
    await removeAll(phaseIds, (id) => client.models.Phase.delete({ id }));
    if (courseId) await client.models.Course.delete({ id: courseId });
  } catch (error) {
    console.error("Import rollback failed", { courseId, error: getErrorMessage(error) });
  }
}