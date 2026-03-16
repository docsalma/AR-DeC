// ─── Bloom's Taxonomy Levels ───────────────────────────────────────────────
export type BloomsLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

// ─── Student Levels ────────────────────────────────────────────────────────
export type StudentLevel = 'beginner' | 'explorer' | 'scholar' | 'master';

// ─── Badge Categories ──────────────────────────────────────────────────────
export type BadgeCategory = 'explorer' | 'scholar' | 'streak' | 'subject';

// ─── AR Overlay Types ──────────────────────────────────────────────────────
export type AROverlayType = 'text' | '3d' | 'interactive';

// ─── Quiz Question Types ───────────────────────────────────────────────────
export type QuizQuestionType = 'mcq' | 'truefalse' | 'fillin';

// ─── Core Models ───────────────────────────────────────────────────────────

export interface Explanation {
  definition: string;
  examples: string[];
  relatedConcepts: string[];
  bloomsLevel: BloomsLevel;
  source: 'cache' | 'api' | 'local';
}

export interface ScannedWord {
  id: string;
  text: string;
  context: string;
  timestamp: number;
  masteryLevel: number; // 0.0 – 1.0 (BKT probability)
  explanations: Explanation[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  condition: string;
  earnedAt: number | null; // timestamp, null = locked
}

export interface StudentProfile {
  id: string;
  name: string;
  points: number;
  level: StudentLevel;
  streakDays: number;
  lastActiveDate: string; // ISO date string
  badges: Badge[];
  vocabularyHistory: string[]; // word IDs
}

export interface GamificationState {
  points: number;
  level: StudentLevel;
  streak: number;
  dailyGoal: number;
  dailyProgress: number;
  badges: Badge[];
  comboMultiplier: number;
  scanCount: number;
  quizCorrectCount: number;
}

export interface AROverlayData {
  type: AROverlayType;
  content: string;
  position: { x: number; y: number; z: number };
  animation: 'fadeIn' | 'scaleUp' | 'slideIn' | 'none';
}

export interface QuizQuestion {
  id: string;
  word: string;
  type: QuizQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

// ─── Points Configuration ──────────────────────────────────────────────────
export const POINTS = {
  SCAN: 5,
  READ: 3,
  QUIZ_CORRECT: 10,
  DAILY_STREAK: 20,
} as const;

export const LEVEL_THRESHOLDS: Record<StudentLevel, number> = {
  beginner: 0,
  explorer: 100,
  scholar: 500,
  master: 2000,
};
