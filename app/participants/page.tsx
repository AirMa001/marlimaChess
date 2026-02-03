import React from 'react';
import { getApprovedPlayersAction, getMatchesAction, getTournamentAction } from '@/app/actions';
import ParticipantsClient from '@/components/ParticipantsClient';

export const dynamic = 'force-dynamic';

export default async function Participants() {
    const [players, matches, tournament] = await Promise.all([
        getApprovedPlayersAction(),
        getMatchesAction(),
        getTournamentAction()
    ]);

    return (
        <ParticipantsClient 
            initialPlayers={players} 
            initialMatches={matches} 
            tournamentStatus={tournament.status} 
        />
    );
}
