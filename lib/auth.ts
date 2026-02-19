import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          phoneNumber: user.phoneNumber || undefined,
          chessUsername: user.chessUsername || undefined,
          platform: (user.platform as any) || undefined,
          siteRating: user.siteRating,
          gamesPlayed: user.gamesPlayed,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        // Check if user exists in our DB
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        // If not, create them so they have a DB record for our profile logic
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              siteRating: 1500,
              ratingDeviation: 350,
              volatility: 0.06,
              gamesPlayed: 0
            }
          });
        }
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Fetch fresh user data from DB to ensure session stays in sync
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email as string }
        });

        if (dbUser) {
          // @ts-ignore
          session.user.id = dbUser.id;
          // @ts-ignore
          session.user.phoneNumber = dbUser.phoneNumber;
          // @ts-ignore
          session.user.chessUsername = dbUser.chessUsername;
          // @ts-ignore
          session.user.platform = dbUser.platform;
          // @ts-ignore
          session.user.siteRating = dbUser.siteRating;
          // @ts-ignore
          session.user.gamesPlayed = dbUser.gamesPlayed;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      return token;
    },
  },
};