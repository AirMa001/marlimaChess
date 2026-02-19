import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tournamentId = parseInt(id);
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true, status: true }
    });

    if (!tournament) {
      return NextResponse.json({ message: "Tournament not found" }, { status: 404 });
    }

    // Check if the current user is the organizer
    // @ts-ignore
    if (tournament.organizerId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden: Only the founder can start this arena" }, { status: 403 });
    }

    if (tournament.status !== "UPCOMING") {
      return NextResponse.json({ message: "Tournament has already been initiated" }, { status: 400 });
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "ONGOING" }
    });

    return NextResponse.json({ message: "Arena Live", tournament: updated });

  } catch (error) {
    console.error("Tournament Start Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
