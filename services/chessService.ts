import { ChessPlatform, PlayerStats } from '../types';

export const fetchChessRating = async (platform: ChessPlatform, username: string): Promise<number | null> => {
  try {
    if (platform === ChessPlatform.CHESS_COM) {
      const response = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
      if (!response.ok) return null;
      const data = await response.json();
      // Prioritize Blitz, then Rapid, then Bullet
      return data.chess_rapid?.last?.rating || data.chess_bullet?.last?.rating || data.chess_blitz?.last?.rating || null;
    } 
    
    if (platform === ChessPlatform.LICHESS) {
      const response = await fetch(`https://lichess.org/api/user/${username}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.perfs?.rapid?.rating || data.perfs?.bullet?.rating ||  data.perfs?.blitz?.rating || null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching chess stats:", error);
    return null;
  }
};
