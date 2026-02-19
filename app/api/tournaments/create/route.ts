import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, description, startDate, totalRounds, timeControl, location, image } = await req.json();

    if (!name || !startDate) {
      return NextResponse.json({ message: "Name and start date are required" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        image,
        startDate: new Date(startDate),
        totalRounds: parseInt(totalRounds.toString()) || 5,
        timeControl: timeControl || "10+5",
        location: location || "Physical Venue",
        status: "UPCOMING",
        currentRound: 1,
        // @ts-ignore
        organizerId: session.user.id
      }
    });

    return NextResponse.json(tournament, { status: 201 });

  } catch (error) {
    console.error("Tournament Creation Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
