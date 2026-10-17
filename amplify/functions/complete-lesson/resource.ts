import { defineFunction } from "@aws-amplify/backend";

/**
 * Finishes a lesson on the server: grades the learner's practice answers
 * against the stored questions, decides the XP, and writes the UserProgress
 * row. The browser can no longer create UserProgress itself, so XP (which
 * feeds streaks, badges and the weekly leaderboard) cannot be made up.
 *
 * resourceGroupName: "data" keeps it in the data stack, like the other
 * functions that read and write models.
 */
export const completeLesson = defineFunction({
  name: "complete-lesson",
  entry: "./handler.ts",
  resourceGroupName: "data",
  timeoutSeconds: 20,
});