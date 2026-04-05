import { writeFileSync } from 'node:fs';

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} studentId
 * @property {string} displayName
 * @property {number} totalXP
 * @property {number} weeklyXP
 * @property {string} weekKey
 * @property {string | null} lastEarnedAt
 */

/**
 * Normalize a date-like value into a Date instance.
 * @param {Date | string | number | undefined} value
 */
function asDate(value = new Date()) {
  return value instanceof Date ? new Date(value) : new Date(value);
}

/**
 * Return the local start of the week as a Date.
 * Defaults to Monday to align with school-week pacing.
 * @param {Date | string | number} value
 * @param {0 | 1} weekStartsOn
 */
export function getWeekStart(value = new Date(), weekStartsOn = 1) {
  const date = asDate(value);
  date.setHours(0, 0, 0, 0);
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

/**
 * Stable string key for the current leaderboard week.
 * @param {Date | string | number} value
 * @param {0 | 1} weekStartsOn
 */
export function getWeekKey(value = new Date(), weekStartsOn = 1) {
  const weekStart = getWeekStart(value, weekStartsOn);
  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, '0');
  const day = String(weekStart.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @param {Partial<LeaderboardEntry> & { studentId: string, displayName: string }} initial
 * @param {Date | string | number} now
 */
export function createLeaderboardEntry(initial, now = new Date()) {
  return {
    studentId: initial.studentId,
    displayName: initial.displayName,
    totalXP: Math.max(0, initial.totalXP ?? 0),
    weeklyXP: Math.max(0, initial.weeklyXP ?? 0),
    weekKey: initial.weekKey ?? getWeekKey(now),
    lastEarnedAt: initial.lastEarnedAt ?? null,
  };
}

/**
 * Reset a student's weekly score if they are from an older leaderboard week.
 * @param {LeaderboardEntry} entry
 * @param {Date | string | number} now
 * @param {0 | 1} weekStartsOn
 */
export function resetWeeklyXPIfNeeded(entry, now = new Date(), weekStartsOn = 1) {
  const currentWeekKey = getWeekKey(now, weekStartsOn);
  if (entry.weekKey !== currentWeekKey) {
    entry.weekKey = currentWeekKey;
    entry.weeklyXP = 0;
  }
  return entry;
}

/**
 * Record XP earned by a student, updating both lifetime XP and this week's XP.
 * If the week has changed, the weekly leaderboard score is reset first.
 * @param {LeaderboardEntry} entry
 * @param {number} amount
 * @param {Date | string | number} earnedAt
 * @param {0 | 1} weekStartsOn
 */
export function recordWeeklyXPGain(entry, amount, earnedAt = new Date(), weekStartsOn = 1) {
  const xp = Math.max(0, amount | 0);
  const eventDate = asDate(earnedAt);
  const eventWeekKey = getWeekKey(eventDate, weekStartsOn);

  if (entry.weekKey !== eventWeekKey) {
    entry.weekKey = eventWeekKey;
    entry.weeklyXP = 0;
  }

  entry.totalXP += xp;
  entry.weeklyXP += xp;
  entry.lastEarnedAt = eventDate.toISOString();
  return entry;
}

/**
 * Build the current weekly leaderboard.
 * Ranking is based on weekly XP only, so students are rewarded for current effort
 * rather than a large historical XP lead from earlier weeks.
 *
 * Ties are broken by most recent activity, then alphabetically for stability.
 * @param {LeaderboardEntry[]} entries
 * @param {Date | string | number} now
 * @param {0 | 1} weekStartsOn
 */
export function buildWeeklyLeaderboard(entries, now = new Date(), weekStartsOn = 1) {
  const normalized = entries.map((entry) =>
    resetWeeklyXPIfNeeded({ ...entry }, now, weekStartsOn)
  );

  const sorted = normalized.sort((a, b) => {
    if (b.weeklyXP !== a.weeklyXP) {
      return b.weeklyXP - a.weeklyXP;
    }

    const aLast = a.lastEarnedAt ? Date.parse(a.lastEarnedAt) : 0;
    const bLast = b.lastEarnedAt ? Date.parse(b.lastEarnedAt) : 0;
    if (bLast !== aLast) {
      return bLast - aLast;
    }

    return a.displayName.localeCompare(b.displayName);
  });

  let previousXP = null;
  let previousRank = 0;

  return sorted.map((entry, index) => {
    const rank = previousXP === entry.weeklyXP ? previousRank : index + 1;
    previousXP = entry.weeklyXP;
    previousRank = rank;

    return {
      rank,
      studentId: entry.studentId,
      displayName: entry.displayName,
      weeklyXP: entry.weeklyXP,
      totalXP: entry.totalXP,
      weekKey: entry.weekKey,
      lastEarnedAt: entry.lastEarnedAt,
    };
  });
}

/**
 * Serialize leaderboard results to disk.
 * @param {LeaderboardEntry[]} entries
 * @param {string} filePath
 * @param {Date | string | number} now
 * @param {0 | 1} weekStartsOn
 */
export function writeLeaderboardFile(entries, filePath, now = new Date(), weekStartsOn = 1) {
  const leaderboard = buildWeeklyLeaderboard(entries, now, weekStartsOn);
  writeFileSync(filePath, JSON.stringify(leaderboard, null, 2), 'utf8');
}
