import { writeFileSync } from 'node:fs';

/**
 * XP curve: XP required to complete the current level and reach the next one.
 * Example: at level 5, xpToNextLevel = 500.
 */
export function xpRequiredForLevel(level) {
  return 100 * Math.max(1, level);
}

/**
 * @typedef {Object} Quest
 * @property {string} id
 * @property {string} title
 * @property {string} skillTag
 * @property {number} totalItems
 * @property {number} completedItems
 * @property {number} xpReward
 */

/**
 * @typedef {Object} StudentProfile
 * @property {number} currentXP
 * @property {number} level
 * @property {number} xpToNextLevel
 * @property {number} streakDays
 * @property {Quest[]} quests
 */

/**
 * @param {Partial<{ level: number, currentXP: number, streakDays: number, quests: Quest[] }>} initial
 */
export function createProfile(initial = {}) {
  const level = initial.level ?? 1;
  const currentXP = initial.currentXP ?? 0;
  return {
    level,
    currentXP,
    streakDays: initial.streakDays ?? 0,
    quests: Array.isArray(initial.quests) ? initial.quests.map(normalizeQuest) : [],
  };
}

function normalizeQuest(q) {
  return {
    id: q.id,
    title: q.title,
    skillTag: q.skillTag,
    totalItems: Math.max(0, q.totalItems | 0),
    completedItems: Math.min(Math.max(0, q.completedItems | 0), Math.max(0, q.totalItems | 0)),
    xpReward: Math.max(0, q.xpReward | 0),
  };
}

/**
 * Serialize internal state to the API/student-profile JSON shape.
 * @param {ReturnType<typeof createProfile>} state
 * @returns {StudentProfile}
 */
export function toProfileJSON(state) {
  return {
    currentXP: state.currentXP,
    level: state.level,
    xpToNextLevel: xpRequiredForLevel(state.level),
    streakDays: state.streakDays,
    quests: state.quests.map((q) => ({ ...q })),
  };
}

/**
 * Add XP and apply level-ups until XP is insufficient for the next level.
 * @param {ReturnType<typeof createProfile>} state
 * @param {number} amount
 */
export function addXP(state, amount) {
  let n = Math.max(0, amount);
  state.currentXP += n;
  let need = xpRequiredForLevel(state.level);
  while (state.currentXP >= need) {
    state.currentXP -= need;
    state.level += 1;
    need = xpRequiredForLevel(state.level);
  }
}

/**
 * @param {ReturnType<typeof createProfile>} state
 * @param {number} days
 */
export function setStreak(state, days) {
  state.streakDays = Math.max(0, days | 0);
}

/**
 * Increment streak by 1 after a daily check-in.
 * @param {ReturnType<typeof createProfile>} state
 */
export function bumpStreak(state) {
  state.streakDays += 1;
}

/**
 * @param {ReturnType<typeof createProfile>} state
 * @param {Omit<Quest, 'completedItems'> & { completedItems?: number }} quest
 */
export function addQuest(state, quest) {
  state.quests.push(
    normalizeQuest({
      ...quest,
      completedItems: quest.completedItems ?? 0,
    })
  );
}

/**
 * Advance quest progress and grant quest XP once on completion.
 * @param {ReturnType<typeof createProfile>} state
 * @param {string} questId
 * @param {number} delta
 */
export function addQuestProgress(state, questId, delta = 1) {
  const q = state.quests.find((x) => x.id === questId);
  if (!q) return;
  const prevDone = q.completedItems;
  q.completedItems = Math.min(q.totalItems, q.completedItems + Math.max(0, delta));
  if (prevDone < q.totalItems && q.completedItems >= q.totalItems) {
    addXP(state, q.xpReward);
  }
}

/**
 * Apply a batch update from lesson/gameplay events and return the API payload.
 * @param {ReturnType<typeof createProfile>} state
 * @param {Partial<{
 *   xpGained: number,
 *   streakDays: number,
 *   streakIncrement: boolean,
 *   quests: Array<Omit<Quest, 'completedItems'> & { completedItems?: number }>,
 *   questProgress: Array<{ questId: string, delta?: number }>
 * }>} update
 * @returns {StudentProfile}
 */
export function recordProfileUpdate(state, update = {}) {
  if (Array.isArray(update.quests)) {
    for (const quest of update.quests) {
      addQuest(state, quest);
    }
  }

  if (Array.isArray(update.questProgress)) {
    for (const progress of update.questProgress) {
      addQuestProgress(state, progress.questId, progress.delta ?? 1);
    }
  }

  if (typeof update.xpGained === 'number') {
    addXP(state, update.xpGained);
  }

  if (typeof update.streakDays === 'number') {
    setStreak(state, update.streakDays);
  } else if (update.streakIncrement) {
    bumpStreak(state);
  }

  return toProfileJSON(state);
}

/**
 * Send the current profile JSON to a backend endpoint.
 * @param {ReturnType<typeof createProfile>} state
 * @param {{
 *   endpoint: string,
 *   method?: 'POST' | 'PUT' | 'PATCH',
 *   headers?: Record<string, string>,
 *   fetchImpl?: typeof fetch
 * }} options
 */
export async function syncProfileToBackend(state, options) {
  const fetchImpl = options?.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch is not available in this Node runtime.');
  }

  if (!options?.endpoint) {
    throw new Error('A backend endpoint is required.');
  }

  const payload = toProfileJSON(state);
  const response = await fetchImpl(options.endpoint, {
    method: options.method ?? 'POST',
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Backend sync failed (${response.status}): ${errorBody}`);
  }

  return payload;
}

/**
 * Write profile JSON to disk as UTF-8.
 * @param {ReturnType<typeof createProfile>} state
 * @param {string} filePath
 */
export function writeProfileFile(state, filePath) {
  const json = JSON.stringify(toProfileJSON(state), null, 2);
  writeFileSync(filePath, json, 'utf8');
}
