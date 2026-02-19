import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { fetchChessRating } from '@/services/chessService';
import { ChessPlatform } from '@/types';

export async function POST(req: Request) {
  try {
    const { name, email, password, phoneNumber, chessUsername, platform, otp } = await req.json();

    if (!email || !password || !phoneNumber || !chessUsername || !platform || !otp) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify OTP
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: otp
        }
      }
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json({ message: "Invalid or expired verification code" }, { status: 400 });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
    }

    // 3. Verify Chess Rating (Server-side validation)
    const rating = await fetchChessRating(platform as ChessPlatform, chessUsername);
    if (rating === null) {
      return NextResponse.json({ 
        message: `Could not verify chess profile for ${chessUsername} on ${platform}.` 
      }, { status: 400 });
    }

    // 4. Hash Password
    const hashedPassword = await hash(password, 12);

    // 5. Create User & Cleanup Token
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phoneNumber,
          chessUsername,
          platform,
          externalRating: rating,
          siteRating: 1500,
          gamesPlayed: 0
        },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: otp
          }
        }
      })
    ]);

    return NextResponse.json({ 
      message: "User created successfully", 
      user: { id: user.id, email: user.email, name: user.name } 
    }, { status: 201 });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}