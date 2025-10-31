export type Level = 'Noob' | 'Level 3' | 'Level 2' | 'Level 1' | 'Top Player';

export const calculateLevel = (points: number): Level => {
  if (points >= 181) return 'Top Player';
  if (points >= 121) return 'Level 1';
  if (points >= 71) return 'Level 2';
  if (points >= 31) return 'Level 3';
  return 'Noob';
};

export const getPointsForWin = (opponentLevel: Level): number => {
  const pointsMap: Record<Level, number> = {
    'Noob': 1,
    'Level 3': 3,
    'Level 2': 5,
    'Level 1': 7,
    'Top Player': 10,
  };
  return pointsMap[opponentLevel];
};

export const getPointsForLoss = (opponentLevel: Level): number => {
  return opponentLevel === 'Top Player' ? 2 : 0;
};

export const calculateRatingPoints = (
  isWinner: boolean,
  opponentLevel: Level
): number => {
  return isWinner
    ? getPointsForWin(opponentLevel)
    : getPointsForLoss(opponentLevel);
};

export const getLevelColor = (level: Level): string => {
  const colorMap: Record<Level, string> = {
    'Noob': 'text-gray-400',
    'Level 3': 'text-green-400',
    'Level 2': 'text-blue-400',
    'Level 1': 'text-purple-400',
    'Top Player': 'text-yellow-400',
  };
  return colorMap[level];
};

export const getLevelBadgeColor = (level: Level): string => {
  const colorMap: Record<Level, string> = {
    'Noob': 'bg-gray-600',
    'Level 3': 'bg-green-600',
    'Level 2': 'bg-blue-600',
    'Level 1': 'bg-purple-600',
    'Top Player': 'bg-yellow-600',
  };
  return colorMap[level];
};

