import React from 'react';
import { getApprovedPlayersAction, getMatchesAction, getTournamentAction } from '@/app/actions';
import ParticipantsClient from '@/components/ParticipantsClient';

export const dynamic = 'force-dynamic';

export default async function Participants({ searchParams }: { searchParams: Promise<{ tournamentId?: string }> }) {
    const { tournamentId } = await searchParams;
    const tid = tournamentId ? parseInt(tournamentId) : 1;

    const [players, matches, tournament] = await Promise.all([
        getApprovedPlayersAction(tid),
        getMatchesAction(tid),
        getTournamentAction(tid)
    ]);

    if (!tournament) return <div>Tournament not found</div>;

    return (
        <ParticipantsClient 
            initialPlayers={players as any} 
            initialMatches={matches as any} 
            tournamentStatus={tournament.status} 
        />
    );
}
