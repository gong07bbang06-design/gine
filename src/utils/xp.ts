export function getRequiredXpForNextLevel(currentLevel: number): number {
  switch (currentLevel) {
    case 0: return 30;  // Level 0 -> 1: very easy, great for instant onboarding
    case 1: return 60;  // Level 1 -> 2: moderate challenge
    case 2: return 100; // Level 2 -> 3: standard requirement
    case 3: return 150; // Level 3 -> 4: serious concentration needed
    case 4: return 220; // Level 4 -> 5: grandmaster level!
    default: return 100;
  }
}

export function calculateXpPercentage(currentXp: number, currentLevel: number): number {
  if (currentLevel >= 5) return 100;
  const reqXp = getRequiredXpForNextLevel(currentLevel);
  return Math.min(100, Math.floor((currentXp / reqXp) * 100));
}
