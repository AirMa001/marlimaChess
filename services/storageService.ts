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

export const getPlayers = async (): Promise<Player[]> => {
  return await getPlayersAction();
};

export const getMatches = async () => {
  return await getMatchesAction();
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
  return await updatePlayerStatusAction(id, status);
};

export const deletePlayer = async (id: string): Promise<Player[]> => {
  return await deletePlayerAction(id);
};

export { sendApprovalSMS, getTournamentAction };