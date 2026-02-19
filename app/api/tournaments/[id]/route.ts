import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournamentId = parseInt(id);

    const [tournament, matches] = await Promise.all([
      prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          players: {
            orderBy: [
              { rank: 'asc' }, 
              { score: 'desc' },
              { rating: 'desc' }
            ],
            include: {
              user: { select: { name: true, image: true, gamesPlayed: true, siteRating: true } }
            }
          },
          organizer: {
            select: { name: true }
          }
        }
      }),
      prisma.match.findMany({
        where: {
          OR: [
            { whitePlayer: { tournamentId } },
            { blackPlayer: { tournamentId } }
          ]
        },
        include: {
          whitePlayer: { select: { id: true, fullName: true } },
          blackPlayer: { select: { id: true, fullName: true } }
        },
        orderBy: [
          { round: 'desc' },
          { table: 'asc' }
        ]
      })
    ]);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    return NextResponse.json({ ...tournament, matches });

  } catch (error) {
    console.error("Tournament Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 });
  }
}