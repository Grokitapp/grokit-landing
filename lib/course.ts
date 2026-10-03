import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

const client = generateClient<Schema>();

export async function createCourseFromPrompt(
  topic: string,
  personalizationProfile?: unknown,
) {
  const { data, errors } =
    await client.mutations.generateOutline({
      topic,
      personalizationProfile:
        personalizationProfile as never,
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  if (!data) {
    throw new Error(
      'No course returned from generateOutline',
    );
  }

  return data;
}

export async function listCourses() {
  const { data, errors } =
    await client.models.Course.list();

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return [...(data ?? [])].sort((a, b) => {
    const aDate = a.updatedAt
      ? new Date(a.updatedAt).getTime()
      : 0;

    const bDate = b.updatedAt
      ? new Date(b.updatedAt).getTime()
      : 0;

    return bDate - aDate;
  });
}

export async function getCourse(
  courseId: string,
) {
  const { data, errors } =
    await client.models.Course.get({
      id: courseId,
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data;
}

export async function listPhasesForCourse(
  courseId: string,
) {
  const { data, errors } =
    await client.models.Phase.list({
      filter: {
        courseId: {
          eq: courseId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return [...(data ?? [])].sort(
    (a, b) => a.order - b.order,
  );
}

export async function listLessonsForPhase(
  phaseId: string,
) {
  const { data, errors } =
    await client.models.Lesson.list({
      filter: {
        phaseId: {
          eq: phaseId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return [...(data ?? [])].sort(
    (a, b) => a.order - b.order,
  );
}

export async function listLessonsForCourse(
  courseId: string,
) {
  const { data, errors } =
    await client.models.Lesson.list({
      filter: {
        courseId: {
          eq: courseId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return [...(data ?? [])].sort(
    (a, b) => a.order - b.order,
  );
}

export async function generateLessonContent(
  lessonId: string,
) {
  const { data, errors } =
    await client.mutations.generateLesson({
      lessonId,
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  if (!data) {
    throw new Error(
      'No lesson returned from generateLesson',
    );
  }

  return data;
}

export async function listProgressForCourse(
  courseId: string,
) {
  const { data, errors } =
    await client.models.UserProgress.list({
      filter: {
        courseId: {
          eq: courseId,
        },
      },
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data ?? [];
}

export async function markLessonComplete(
  courseId: string,
  lessonId: string,
  xp = 10,
) {
  const { data, errors } =
    await client.models.UserProgress.create({
      courseId,
      lessonId,
      completedAt: new Date().toISOString(),
      xp,
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data;
}

export async function unlockPhase(
  phaseId: string,
) {
  const { data, errors } =
    await client.models.Phase.update({
      id: phaseId,
      locked: false,
    });

  if (errors?.length) {
    throw new Error(errors[0].message);
  }

  return data;
}