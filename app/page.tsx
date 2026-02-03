import React from 'react';
import { getApprovedPlayersAction, getCachedAnalysis } from '@/app/actions';
import HomeClient from '@/components/HomeClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch approved players on the server
  const players = await getApprovedPlayersAction();
  
  return <HomeClient />;
}
