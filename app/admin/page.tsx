import React from 'react';
import { getPlayersAction } from '@/app/actions';
import AdminRegistrationsClient from '@/components/AdminRegistrationsClient';

export default async function AdminRegistrations() {
  const players = await getPlayersAction();

  return <AdminRegistrationsClient initialPlayers={players} />;
}