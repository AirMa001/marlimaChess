import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchFullChessStats } from '@/services/chessService';
import { ChessPlatform } from '@/types';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { chessUsername: true, platform: true }
    });

    if (!user || !user.chessUsername || !user.platform) {
      return NextResponse.json({ message: "Chess profile not linked" }, { status: 404 });
    }

    const stats = await fetchFullChessStats(user.platform as ChessPlatform, user.chessUsername);
    
    return NextResponse.json(stats);

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch external stats" }, { status: 500 });
  }
}
