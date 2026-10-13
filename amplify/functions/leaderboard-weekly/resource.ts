import { defineFunction } from '@aws-amplify/backend';

/**
 * Closes the finished week: ranks every group, moves the top learners up a
 * league and the bottom ones down. It runs every day but only does work once
 * per week (a marker row makes it safe to re-run), so a missed run is simply
 * picked up the next day.
 */
export const leaderboardWeekly = defineFunction({
  name: 'leaderboard-weekly',
  entry: './handler.ts',
  resourceGroupName: 'data',
  schedule: 'every day',
  timeoutSeconds: 300,
});