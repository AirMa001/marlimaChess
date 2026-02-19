import { ChessPlatform } from '../types';

export interface FullChessStats {
  bullet?: number;
  blitz?: number;
  rapid?: number;
  classical?: number;
}

export const fetchChessRating = async (platform: ChessPlatform, username: string): Promise<number | null> => {
  const stats = await fetchFullChessStats(platform, username);
  if (!stats) return null;
  return stats.rapid || stats.blitz || stats.bullet || null;
};

export const fetchFullChessStats = async (platform: ChessPlatform, username: string): Promise<FullChessStats | null> => {
  try {
    if (platform === ChessPlatform.CHESS_COM) {
      const response = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        bullet: data.chess_bullet?.last?.rating,
        blitz: data.chess_blitz?.last?.rating,
        rapid: data.chess_rapid?.last?.rating,
        // Chess.com doesn't have a standard "Classical" in the same way, 
        // usually it's "Daily" or "Rapid"
        classical: data.chess_daily?.last?.rating 
      };
    } 
    
    if (platform === ChessPlatform.LICHESS) {
      const response = await fetch(`https://lichess.org/api/user/${username}`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        bullet: data.perfs?.bullet?.rating,
        blitz: data.perfs?.blitz?.rating,
        rapid: data.perfs?.rapid?.rating,
        classical: data.perfs?.classical?.rating
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching chess stats:", error);
    return null;
  }
};