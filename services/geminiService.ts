import { GoogleGenAI } from "@google/genai";
import { Player, RegistrationStatus } from "../types";

// Initialize Gemini
// This is now strictly server-side
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateTournamentAnalysis = async (players: Player[]): Promise<string> => {
  if (!ai) {
    return "AI analysis is currently unavailable (API key missing).";
  }

  const approvedPlayers = players.filter(p => p.status === RegistrationStatus.APPROVED);
  
  if (approvedPlayers.length === 0) {
    return "No players registered yet. The board is empty!";
  }

  // Create a minimal roster for the prompt to save tokens
  const roster = approvedPlayers.map(p => 
    `- ${p.fullName} (${p.platform}: ${p.chessUsername}, Rating: ${p.rating})`
  ).join("\n");

  const prompt = `
    Here is the roster for the upcoming "Grandmaster Open" chess tournament:
    ${roster}

    Please provide a hype-filled, exciting commentary analysis of the field. 
    1. Highlight the top seeds.
    2. Comment on the rating spread.
    3. Predict the intensity of the matches.
    
    Keep it under 150 words. Use emojis suitable for chess.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep thought for this task
      }
    });
    
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The Grandmaster AI is currently calculating deep lines and cannot provide an analysis right now.";
  }
};
