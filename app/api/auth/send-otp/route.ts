import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail } from '@/services/emailService';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert the token in DB
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: email,
          token: otp
        }
      },
      update: {
        token: otp,
        expires: expires
      },
      create: {
        identifier: email,
        token: otp,
        expires: expires
      }
    });

    // Send the email
    const emailResult = await sendOTPEmail(email, otp);

    if (emailResult.success) {
      return NextResponse.json({ message: "OTP sent successfully" });
    } else {
      // Developer Fallback: Log OTP to console if email fails in local dev
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🚀 [DEV MODE] Email failed to send. Your OTP code is: ${otp}\n`);
        return NextResponse.json({ 
          message: "OTP logged to console (Dev Mode)", 
          devMode: true,
          otp: otp // Only for debugging
        });
      }
      return NextResponse.json({ message: emailResult.error || "Failed to send email" }, { status: 500 });
    }

  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
