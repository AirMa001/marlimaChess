import { Player, RegistrationStatus } from '../types';
import { sendApprovalSMS } from './smsService';
import { 
    getPlayersAction, 
    savePlayerAction, 
    updatePlayerStatusAction, 
    deletePlayerAction, 
    getMatchesAction, 
    getTournamentAction 
} from '@/app/actions';

export const getPlayers = async (tournamentId: number = 1): Promise<Player[]> => {
  return await getPlayersAction(tournamentId) as any;
};

export const getMatches = async (tournamentId: number = 1) => {
  return await getMatchesAction(tournamentId);
};

export const savePlayer = async (player: Player): Promise<Player | null> => {
  try {
    const saved = await savePlayerAction(player);
    return saved as unknown as Player; 
  } catch (error) {
    return null;
  }
};

export const updatePlayerStatus = async (id: string, status: RegistrationStatus): Promise<Player[]> => {
  return await updatePlayerStatusAction(id, status) as any;
};

export const deletePlayer = async (id: string): Promise<Player[]> => {
  return await deletePlayerAction(id) as any;
};

export { sendApprovalSMS, getTournamentAction };