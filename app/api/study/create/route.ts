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

    const { title, description, type, content, mediaUrl } = await req.json();

    if (!title || !type) {
      return NextResponse.json({ message: "Title and type are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) throw new Error("User not found");

    const study = await prisma.study.create({
      data: {
        title,
        description,
        type,
        content,
        mediaUrl,
        authorId: user.id
      }
    });

    return NextResponse.json(study, { status: 201 });

  } catch (error) {
    console.error("Study Creation Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
