export type CharacterId = 'chicken' | 'hamster' | 'bear' | 'wolf';

export interface CharacterEvolutionStage {
  level: number;
  name: string;
  emoji: string;
  description: string;
  dialogue: string[];
}

export interface CharacterConfig {
  id: CharacterId;
  baseName: string;
  accentColor: string; // Tailwind class
  bgColor: string;     // Tailwind bg class
  borderColor: string; // Tailwind border class
  rewardCoupon: {
    title: string;
    description: string;
    funnyQuote: string;
    giftIconTerms: string;
  };
  stages: {
    [key: number]: CharacterEvolutionStage;
  };
}

export type TimerModeId = 'highschool' | 'suneung_korean' | 'suneung_math' | 'suneung_english' | 'demo_10s' | 'demo_30s' | 'custom';

export interface TimerMode {
  id: TimerModeId;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  label: string;
}

export interface StudySessionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  durationSeconds: number;
  characterId: CharacterId;
  level: number;
  completed: boolean;
  timestamp: number;
}

export interface UserProgress {
  selectedCharacterId: CharacterId;
  levels: { [key in CharacterId]: number };
  expPoints: { [key in CharacterId]: number }; // Exp points from 0 to 100 for current level
  totalFocusSeconds: number;
  cheatingDetectedCount: number;
  claimedCoupons: CharacterId[]; // Characters whose coupons are unlocked and claimed
  dailyHistory: StudySessionRecord[];
}
