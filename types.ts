export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum ChessPlatform {
  CHESS_COM = 'Chess.com',
  LICHESS = 'Lichess'
}

export interface PlayerStats {
  rating: number;
  platform: ChessPlatform;
  username: string;
}

export interface Player {
  id: string;
  fullName: string;
  department: string;
  phoneNumber: string;
  chessUsername: string;
  platform: ChessPlatform;
  rating: number;
  status: RegistrationStatus;
  paymentReference?: string; // Generated ID for tracking
  paymentReceipt?: string; // Base64 Data URL of the screenshot
  registeredAt: string;
  
  // Tournament Stats
  rank?: number | null;
  score?: number;
}

export interface Match {
  id: string;
  round: number;
  table?: number;
  whitePlayerId: string;
  blackPlayerId: string;
  result?: string | null; // "1-0", "0-1", "1/2-1/2"
  createdAt: string;
  
  // Relations (optional for UI)
  whitePlayer?: Player;
  blackPlayer?: Player;
}

export interface TournamentAnalysis {
  summary: string;
  topContenders: string[];
  averageRating: number;
}
