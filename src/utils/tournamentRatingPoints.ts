/** Club rating points for a single completed tournament (matches DB calculate_player_rating tiers). */
export function ratingPointsFromFinalRank(finalRank: number): number {
  if (finalRank < 1) return 0;
  let pts = 5; // participation
  if (finalRank <= 6) pts += 5;
  if (finalRank <= 4) pts += 5;
  if (finalRank === 2) pts += 5;
  if (finalRank === 1) pts += 10;
  return pts;
}
