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

export const handler: Schema["generateOutline"]["functionHandler"] = async (
  event
) => {
  const { topic, personalizationProfile } = event.arguments;

  const outline = await callClaudeForOutline(topic, personalizationProfile);

  const { data: course } = await client.models.Course.create({
    title: outline.title,
    topic,
    description: outline.description,
    personalizationProfile,
    status: "GENERATING",
  });

  if (!course) throw new Error("Failed to create course");

  for (const phase of outline.phases as OutlinePhase[]) {
    const { data: phaseRecord } = await client.models.Phase.create({
      courseId: course.id,
      order: phase.order,
      title: phase.title,
      locked: phase.order !== 1,
    });

    if (!phaseRecord) continue;

    for (const lesson of phase.lessons) {
      await client.models.Lesson.create({
        courseId: course.id,
        phaseId: phaseRecord.id,
        order: lesson.order,
        title: lesson.title,
        hook: lesson.hook,
        status: "PENDING",
      });
    }
  }

  const { data: updated } = await client.models.Course.update({
    id: course.id,
    status: "READY",
  });

  return updated ?? course;
};

interface OutlinePhase {
  order: number;
  title: string;
  lessons: {
    order: number;
    title: string;
    hook: string;
  }[];
}

async function callClaudeForOutline(topic: string, profile: unknown) {
  const systemPrompt = `
You are an expert curriculum designer.

Return ONLY valid JSON.

{
  "title": "...",
  "description": "...",
  "phases":[
    {
      "order":1,
      "title":"...",
      "lessons":[
        {
          "order":1,
          "title":"...",
          "hook":"..."
        }
      ]
    }
  ]
}`;

  const userMessage = profile
    ? `Topic: ${topic}\nProfile: ${JSON.stringify(profile)}`
    : `Topic: ${topic}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
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