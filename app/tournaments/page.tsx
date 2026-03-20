import React from 'react';
import { prisma } from '@/lib/prisma';
import TournamentsClient from '@/components/TournamentsClient';

// Force dynamic because we want the latest tournament status
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 1 minute

export default async function TournamentsPage() {
  const tournaments = await prisma.tournament.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      image: true,
      timeControl: true,
      description: true,
      players: { select: { id: true } },
      organizer: { select: { name: true } }
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <TournamentsClient initialTournaments={JSON.parse(JSON.stringify(tournaments))} />
  );
}
