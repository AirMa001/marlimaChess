import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const studies = await prisma.study.findMany({
      include: {
        author: {
          select: { name: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(studies);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch archives" }, { status: 500 });
  }
}
