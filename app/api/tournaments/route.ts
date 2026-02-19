import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const tournaments = await prisma.tournament.findMany({
      where: status === 'active' ? {
        status: { in: ["UPCOMING", "ONGOING", "IN_PROGRESS"] },
      } : {},
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
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("❌ [API/Tournaments] Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}
