import {
  buildWeeklyLeaderboard,
  createLeaderboardEntry,
  recordWeeklyXPGain,
  writeLeaderboardFile,
} from './leaderboard.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, 'weekly-leaderboard.json');
const now = new Date('2026-04-04T12:00:00');

const students = [
  createLeaderboardEntry({
    studentId: 'student_1',
    displayName: 'Ana',
    totalXP: 1200,
    weeklyXP: 600,
    weekKey: '2026-03-23',
    lastEarnedAt: '2026-03-28T15:00:00.000Z',
  }),
  createLeaderboardEntry({
    studentId: 'student_2',
    displayName: 'Mateo',
    totalXP: 700,
  }, now),
  createLeaderboardEntry({
    studentId: 'student_3',
    displayName: 'Sofia',
    totalXP: 950,
  }, now),
];

recordWeeklyXPGain(students[0], 90, '2026-04-01T16:00:00');
recordWeeklyXPGain(students[1], 220, '2026-04-03T09:30:00');
recordWeeklyXPGain(students[2], 150, '2026-04-02T14:45:00');
recordWeeklyXPGain(students[2], 110, '2026-04-04T11:15:00');

const leaderboard = buildWeeklyLeaderboard(students, now);
writeLeaderboardFile(students, outPath, now);

console.log('Wrote', outPath);
console.log(JSON.stringify(leaderboard, null, 2));
