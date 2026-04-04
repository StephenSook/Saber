import {
  createProfile,
  recordProfileUpdate,
  syncProfileToBackend,
  writeProfileFile,
} from './gamification.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, 'student-profile.json');
const endpoint = process.env.NEXT_PROFILE_ENDPOINT || process.env.SABER_PROFILE_ENDPOINT || '';

const state = createProfile({
  level: 5,
  currentXP: 420,
  streakDays: 7,
  quests: [
    {
      id: 'quest_1',
      title: 'Master Inference Clues',
      skillTag: 'inference',
      totalItems: 10,
      completedItems: 4,
      xpReward: 120,
    },
    {
      id: 'quest_2',
      title: 'Math Vocabulary Sprint',
      skillTag: 'fractions',
      totalItems: 8,
      completedItems: 8,
      xpReward: 90,
    },
  ],
});

const payload = recordProfileUpdate(state, {});
writeProfileFile(state, outPath);
console.log('Wrote', outPath);

if (endpoint) {
  await syncProfileToBackend(state, { endpoint, method: 'POST' });
  console.log('Synced profile payload to', endpoint);
} else {
  console.log('Skipping backend sync because NEXT_PROFILE_ENDPOINT is not set.');
}

console.log(JSON.stringify(payload, null, 2));
