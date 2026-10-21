// Save/load system using localStorage

export interface QuizAttempt {
  questionId: string;
  answer: string;
  correct: boolean | null; // null for open-ended
  timestamp: number;
}

export interface SaveData {
  version: number;
  playerX: number;
  playerY: number;
  discoveredObjects: string[];
  quizAttempts: QuizAttempt[];
  openEndedAnswers: Record<string, string>; // questionId -> answer text
  reviewQueue: string[]; // questionIds needing review
  playTimeMs: number;
  settings: {
    soundEnabled: boolean;
    showRemainingObjects: boolean;
  };
}

const SAVE_KEY = 'little_robot_save';
const SAVE_VERSION = 1;

export function getDefaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    playerX: 0,
    playerY: 0,
    discoveredObjects: [],
    quizAttempts: [],
    openEndedAnswers: {},
    reviewQueue: [],
    playTimeMs: 0,
    settings: {
      soundEnabled: true,
      showRemainingObjects: false,
    },
  };
}

export function loadGame(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return getDefaultSave();
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) return getDefaultSave();
    return data;
  } catch {
    return getDefaultSave();
  }
}

export function saveGame(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}
