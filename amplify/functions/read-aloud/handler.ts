declare const process: {
  env: Record<string, string | undefined>;
};

import { createHash } from "node:crypto";
import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import {
  PollyClient,
  SynthesizeSpeechCommand,
  type Engine,
  type LanguageCode,
  type VoiceId,
} from "@aws-sdk/client-polly";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { assertNoErrors, getErrorMessage } from "../shared/common";
import { readLessonContent } from "../shared/lesson-content";
import { buildSpeech } from "../shared/speech";
import {
  READ_ALOUD_DAILY_CHARACTERS,
  findVoice,
  istDayKey,
  nextIstMidnight,
  sampleText,
  type ReadAloudVoice,
} from "../shared/voices";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  process.env as Parameters<typeof getAmplifyDataClientConfig>[0],
);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

/**
 * Generative voices only exist in some AWS regions. us-east-1 always has them,
 * so Polly is called there no matter where the rest of the app runs. Set
 * POLLY_REGION on the function to change it.
 */
const POLLY_REGION = process.env.POLLY_REGION || "us-east-1";
const polly = new PollyClient({ region: POLLY_REGION });
const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

type Handler = Schema["readAloud"]["functionHandler"];

/** How long the link we hand back stays valid. */
const URL_TTL_SECONDS = 3600;

/** Polly accepts at most 3000 billable characters per request. */
const POLLY_REQUEST_LIMIT = 2800;

/** One screen is never this long; the cap just bounds the worst case. */
const MAX_CHARACTERS = 8000;

/**
 * "neural" is the default: natural enough for lessons and about half the price
 * of "generative". Set POLLY_ENGINE=generative on the function for the most
 * expressive voices. The engine is part of the cache key, so switching is safe.
 */
const PREFERRED_ENGINE: Engine = process.env.POLLY_ENGINE === "generative" ? "generative" : "neural";

/** Bump to ignore every cached file (for example after changing how text is built). */
const CACHE_VERSION = "v1";

const PARTS = new Set(["prediction", "card", "review", "sample"]);

const USAGE_TABLE = process.env.READ_ALOUD_USAGE_TABLE_NAME;
const USAGE_ROW_TTL_SECONDS = 14 * 24 * 3600;

export const handler: Handler = async (event, context) => {
  const requestId = context.awsRequestId;
  const bucket = process.env.READ_ALOUD_BUCKET;

  if (!bucket) throw new Error("READ_ALOUD_NOT_CONFIGURED");

  const identity = event.identity as { sub?: string } | null | undefined;
  const sub = identity?.sub?.trim();

  if (!sub) throw new Error("READ_ALOUD_IDENTITY_MISSING");

  const { part, voiceId } = event.arguments;
  const voice = findVoice(voiceId);

  if (!voice) throw new Error("READ_ALOUD_VOICE_INVALID");
  if (!PARTS.has(part)) throw new Error("READ_ALOUD_PART_INVALID");

  // The text always comes from the learner's own lesson (or a fixed sample), never
  // from the request, so nobody can use this function to read arbitrary text.
  const text = limit(
    part === "sample"
      ? sampleText(voice.id)
      : await loadLessonText(
          event.arguments.lessonId,
          sub,
          part as "prediction" | "card" | "review",
          event.arguments.cardIndex ?? 0,
        ),
  );

  if (!text) throw new Error("READ_ALOUD_NOTHING_TO_READ");

  const hash = createHash("sha256").update(`${PREFERRED_ENGINE}|${voice.id}|${text}`).digest("hex");
  const key = `audio/${CACHE_VERSION}/${voice.id}/${hash}.mp3`;

  const cached = await exists(bucket, key);
  const day = istDayKey();
  // Voice previews are tiny, fixed and cached for everyone, so they never use up the allowance.
  const counted = part !== "sample";
  let used: number | undefined;

  if (!cached) {
    // Only NEW speech costs money, so only new speech is checked and counted.
    // Anything already heard (or already made for this lesson) plays for free, always.
    if (counted) {
      used = await readUsage(sub, day);

      if (used >= READ_ALOUD_DAILY_CHARACTERS) {
        console.log(JSON.stringify({ event: "read_aloud_limit", requestId, part, voice: voice.id, used }));

        return {
          status: "limit",
          cached: false,
          characters: text.length,
          usedCharacters: used,
          limitCharacters: READ_ALOUD_DAILY_CHARACTERS,
          resetsAt: nextIstMidnight(),
        };
      }
    }

    try {
      const audio = await synthesize(text, voice);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: audio,
          ContentType: "audio/mpeg",
          CacheControl: "private, max-age=86400",
        }),
      );
    } catch (error) {
      console.error("Read aloud synthesis failed", { requestId, voice: voice.id, error: getErrorMessage(error) });
      throw new Error("READ_ALOUD_SYNTHESIS_FAILED");
    }

    if (counted) {
      await addUsage(sub, day, text.length);
      used = (used ?? 0) + text.length;
    }
  }

  // One line per request: CloudWatch can sum "billedCharacters" to show real spend.
  console.log(
    JSON.stringify({
      event: "read_aloud",
      requestId,
      part,
      voice: voice.id,
      engine: PREFERRED_ENGINE,
      characters: text.length,
      cached,
      billedCharacters: cached ? 0 : text.length,
    }),
  );

  const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: URL_TTL_SECONDS,
  });

  return {
    status: "ok",
    url,
    cached,
    characters: text.length,
    usedCharacters: used,
    limitCharacters: READ_ALOUD_DAILY_CHARACTERS,
  };
};

// ─── Lesson text ─────────────────────────────────────────────────────────────

async function loadLessonText(
  lessonId: string | null | undefined,
  sub: string,
  part: "prediction" | "card" | "review",
  cardIndex: number,
): Promise<string> {
  const id = lessonId?.trim();

  if (!id) throw new Error("READ_ALOUD_LESSON_REQUIRED");

  const result = await client.models.Lesson.get({ id });
  assertNoErrors(result.errors, "READ_ALOUD_LESSON_LOAD_FAILED");

  const lesson = result.data;

  // The function has elevated data access, so ownership is checked here. The
  // same error is used for "missing" and "not yours".
  if (!lesson || lesson.owner !== sub) throw new Error("LESSON_NOT_FOUND");

  const content = readLessonContent(lesson.content);

  if (!content) throw new Error("READ_ALOUD_LESSON_NOT_READY");

  return buildSpeech(content, part, Number.isInteger(cardIndex) ? cardIndex : 0);
}

/** Keeps the text within the cap, cutting at the end of a sentence when it has to. */
function limit(text: string): string {
  const clean = text.trim();

  if (clean.length <= MAX_CHARACTERS) return clean;

  const cut = clean.slice(0, MAX_CHARACTERS);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));

  return (lastStop > MAX_CHARACTERS / 2 ? cut.slice(0, lastStop + 1) : cut).trim();
}

// ─── Daily allowance ─────────────────────────────────────────────────────────
// If the counter can't be read or written, reading still works: a counting
// hiccup should never stop a learner from listening.

async function readUsage(sub: string, day: string): Promise<number> {
  if (!USAGE_TABLE) return 0;

  try {
    const out = await ddb.send(
      new GetCommand({
        TableName: USAGE_TABLE,
        Key: { userId: sub, day },
        ProjectionExpression: "#c",
        ExpressionAttributeNames: { "#c": "characters" },
      }),
    );

    return Number(out.Item?.characters ?? 0);
  } catch (error) {
    console.error("Read aloud usage read failed", getErrorMessage(error));

    return 0;
  }
}

async function addUsage(sub: string, day: string, characters: number): Promise<void> {
  if (!USAGE_TABLE) return;

  const now = new Date();

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: USAGE_TABLE,
        Key: { userId: sub, day },
        // ADD is atomic, so two requests at once can't lose each other's count.
        UpdateExpression:
          "ADD #c :n SET #o = :sub, #e = :exp, #u = :now, #t = :type, #cr = if_not_exists(#cr, :now)",
        ExpressionAttributeNames: {
          "#c": "characters",
          "#o": "owner",
          "#e": "expiresAt",
          "#u": "updatedAt",
          "#t": "__typename",
          "#cr": "createdAt",
        },
        ExpressionAttributeValues: {
          ":n": characters,
          ":sub": sub,
          ":exp": Math.floor(now.getTime() / 1000) + USAGE_ROW_TTL_SECONDS,
          ":now": now.toISOString(),
          ":type": "ReadAloudUsage",
        },
      }),
    );
  } catch (error) {
    console.error("Read aloud usage write failed", getErrorMessage(error));
  }
}

// ─── S3 ──────────────────────────────────────────────────────────────────────

async function exists(bucket: string, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

    return true;
  } catch (error) {
    const info = error as { name?: string; $metadata?: { httpStatusCode?: number } };

    if (info.name === "NotFound" || info.name === "NoSuchKey" || info.$metadata?.httpStatusCode === 404) {
      return false;
    }

    throw error;
  }
}

// ─── Polly ───────────────────────────────────────────────────────────────────

/** Splits at sentence ends so each Polly request stays under its limit. */
function toRequests(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const parts: string[] = [];
  let current = "";

  for (const piece of sentences) {
    if (current && current.length + piece.length > POLLY_REQUEST_LIMIT) {
      parts.push(current.trim());
      current = "";
    }

    current += piece;
  }

  if (current.trim()) parts.push(current.trim());

  // A single sentence longer than the limit: hard split so Polly never rejects it.
  return parts.flatMap((part) =>
    part.length <= POLLY_REQUEST_LIMIT
      ? [part]
      : (part.match(new RegExp(`.{1,${POLLY_REQUEST_LIMIT}}`, "gs")) ?? [part]),
  );
}

async function synthesizeOnce(text: string, voice: ReadAloudVoice, engine: Engine): Promise<Uint8Array> {
  const output = await polly.send(
    new SynthesizeSpeechCommand({
      Engine: engine,
      OutputFormat: "mp3",
      VoiceId: voice.id as VoiceId,
      LanguageCode: voice.languageCode as LanguageCode,
      Text: text,
      TextType: "text",
    }),
  );

  if (!output.AudioStream) throw new Error("POLLY_EMPTY_AUDIO");

  return output.AudioStream.transformToByteArray();
}

/** Preferred engine first; the same voice on "neural" if generative is unavailable. */
async function synthesize(text: string, voice: ReadAloudVoice): Promise<Buffer> {
  let engine: Engine = PREFERRED_ENGINE;
  const chunks: Uint8Array[] = [];

  for (const request of toRequests(text)) {
    try {
      chunks.push(await synthesizeOnce(request, voice, engine));
    } catch (error) {
      const name = (error as { name?: string }).name ?? "";

      // Only the engine can be wrong here; anything else is a real failure.
      if (engine === "generative" && (name === "EngineNotSupportedException" || name === "InvalidParameterException")) {
        engine = "neural";
        chunks.push(await synthesizeOnce(request, voice, engine));
        continue;
      }

      throw error;
    }
  }

  // MP3 files from the same voice join end to end without a gap or a glitch.
  return Buffer.concat(chunks);
}