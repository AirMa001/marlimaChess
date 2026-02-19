// @ts-ignore
import { Glicko2, Player, Match } from 'glicko2.ts';

// Standard chess.com/lichess configuration
const settings = {
  tau: 0.5, // System constant (0.3 to 1.2). Lower = more stable ratings.
  rating: 1500, // default rating
  rd: 350, // Default rating deviation
  vol: 0.06, // Default volatility
};

export interface GlickoStats {
  rating: number;
  rd: number;
  vol: number;
}

// Global Glicko2 ranking manager instance
export const rankingManager = new Glicko2(settings);

// Function to create a Glicko2 Player object from stats
export const makeGlickoPlayer = (stats: GlickoStats): Player => {
  return rankingManager.makePlayer(stats.rating, stats.rd, stats.vol);
};

// Function to update multiple player ratings based on a list of matches
export const updatePlayerRatings = (matches: [Player, Player, number][]) => {
  // Pass the collected matches to the ranking manager to update all players involved
  rankingManager.updateRatings(matches);
};
