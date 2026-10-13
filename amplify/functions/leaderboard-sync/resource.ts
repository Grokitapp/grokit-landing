import { defineFunction } from '@aws-amplify/backend';

/**
 * Keeps the weekly leaderboard up to date:
 *  - triggered by the UserProgress table stream, it adds XP from each
 *    completed lesson to the learner's weekly entry (so XP can't be faked
 *    from the browser);
 *  - also the handler for the syncLeaderboardIdentity mutation, which copies
 *    the learner's public name and username onto their leaderboard rows.
 *
 * resourceGroupName: 'data' keeps it in the data stack (same reason as
 * change-username). Tables, permissions and the stream trigger are wired in
 * backend.ts.
 */
export const leaderboardSync = defineFunction({
  name: 'leaderboard-sync',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 30,
});