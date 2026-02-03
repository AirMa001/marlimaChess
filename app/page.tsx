import React from 'react';
import { getApprovedPlayersAction, getCachedAnalysis } from '@/app/actions';
import HomeClient from '@/components/HomeClient';

export default async function Home() {
  // Fetch approved players on the server
  const players = await getApprovedPlayersAction();
  
  return <HomeClient />;
}
