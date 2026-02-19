import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the new Elo rating for a player
 * @param currentRating Current rating of the player
 * @param opponentRating Rating of the opponent
 * @param score Result of the game (1 for win, 0.5 for draw, 0 for loss)
 * @param gamesPlayed Number of games the player has played (to determine K-factor)
 */
export function calculateNewRating(
  currentRating: number,
  opponentRating: number,
  score: number,
  gamesPlayed: number
): number {
  // Higher K-factor for provisional players (first 20 games)
  const K = gamesPlayed < 20 ? 40 : 20;
  
  // Expected score
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
  
  // New rating
  const newRating = Math.round(currentRating + K * (score - expectedScore));
  
  return newRating;
}