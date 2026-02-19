import React from 'react';
import Link from "next/link";
import { 
  Calendar, 
  Trophy, 
  ExternalLink, 
  ArrowRight, 
  Swords, 
  Newspaper, 
  ChevronRight 
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChessNews } from "@/services/newsService";
import HomeClient from "@/components/HomeClient";

// Force dynamic because we want the latest tournament status
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 1 minute

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  // Parallel Fetching on the Server (Fastest)
  const [tournaments, news] = await Promise.all([
    prisma.tournament.findMany({
      where: {
        status: "UPCOMING",
      },
      include: {
        players: { select: { id: true } },
        organizer: { select: { name: true } }
      },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    getChessNews(),
  ]);

  return (
    <HomeClient 
      initialTournaments={JSON.parse(JSON.stringify(tournaments))} 
      initialNews={news.slice(0, 5)} 
      isLoggedIn={!!session} 
    />
  );
}
