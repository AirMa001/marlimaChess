import { NextResponse } from 'next/server';
import { generatePairings } from '@/services/pairingService'; // update path

export async function POST(req: Request) {
  try {
    const { tournamentId, currentRound } = await req.json();

    if (!tournamentId || !currentRound) {
      return NextResponse.json({ error: "Missing tournament data" }, { status: 400 });
    }

    // Call your shiny new service function!
    const matches = await generatePairings(tournamentId, currentRound);

    return NextResponse.json({ success: true, pairings: matches });

  } catch (error) {
    console.error("❌ [API/Pairings] Error:", error);
    return NextResponse.json({ error: "Failed to generate pairings" }, { status: 500 });
  }
}