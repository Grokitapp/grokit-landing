declare const process: {
  env: Record<string, string | undefined>;
};

import type { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(
    process.env as Parameters<typeof getAmplifyDataClientConfig>[0]
  );

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

export const handler: Schema["generateLesson"]["functionHandler"] = async (
  event
) => {
  const { lessonId } = event.arguments;

  const { data: lesson } = await client.models.Lesson.get({ id: lessonId });

  if (!lesson) throw new Error("Lesson not found");

  if (lesson.status === "READY") return lesson;

  await client.models.Lesson.update({
    id: lessonId,
    status: "GENERATING",
  });

  const { data: course } = await client.models.Course.get({
    id: lesson.courseId,
  });

  const content = await callClaudeForLesson({
    courseTitle: course?.title ?? "",
    courseTopic: course?.topic ?? "",
    lessonTitle: lesson.title,
    hook: lesson.hook ?? "",
  });

  const { data: updated } = await client.models.Lesson.update({
    id: lessonId,
    coreContent: content.coreContent,
    keyTerms: content.keyTerms,
    quiz: content.quiz,
    status: "READY",
  });

  return updated;
};

async function callClaudeForLesson(input: {
  courseTitle: string;
  courseTopic: string;
  lessonTitle: string;
  hook: string;
}) {
  const systemPrompt = `
You write engaging online course lessons.

Return ONLY valid JSON.

{
  "coreContent":"...",
  "keyTerms":[
    {
      "term":"",
      "definition":""
    }
  ],
  "quiz":[
    {
      "question":"",
      "options":["","","",""],
      "correctIndex":0
    }
  ]
}`;

  const userMessage = `Course: ${input.courseTitle}
Topic: ${input.courseTopic}
Lesson: ${input.lessonTitle}
Hook: ${input.hook}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();

  const text =
    json.content.find((b: { type: string }) => b.type === "text")?.text ?? "{}";

  return JSON.parse(text.replace(/```json|```/g, "").trim());
}