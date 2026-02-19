import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const awards = await prisma.award.findMany({
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(awards);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch awards" }, { status: 500 });
  }
}
