import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { phoneNumber, platform, chessUsername, rating } = await req.json();

    if (!phoneNumber || !platform || !chessUsername || !rating) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        phoneNumber,
        platform,
        chessUsername,
        externalRating: rating,
        siteRating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        gamesPlayed: 0
      }
    });

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser });

  } catch (error) {
    console.error("Profile Completion Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
