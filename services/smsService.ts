import { Player } from '../types';

const BASE_URL = 'https://api.textbee.dev/api/v1';

export const sendSMS = async (to: string, message: string): Promise<boolean> => {
  const apiKey = process.env.NEXT_PUBLIC_TEXTBEE_API_KEY;
  const deviceId = process.env.NEXT_PUBLIC_TEXTBEE_DEVICE_ID;

  if (!apiKey || !deviceId) {
    console.error("TextBee credentials missing in .env.local");
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/gateway/devices/${deviceId}/sendSMS`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [to],
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("TextBee API Error:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Network Error sending SMS:", error);
    return false;
  }
};

export const sendApprovalSMS = async (player: Player): Promise<boolean> => {
  const message = `Hello ${player.fullName}, your registration for the UNN Chess Rapid Tournament is APPROVED! Get ready to play. Check the participants list for your bracket.`;
  return await sendSMS(player.phoneNumber, message);
};

export const sendMatchNotificationSMS = async (player: Player, opponentName: string, color: string, round: number): Promise<boolean> => {
  const message = `UNN Chess: Round ${round} is live! You are playing ${color} against ${opponentName}. Good luck!`;
  return await sendSMS(player.phoneNumber, message);
};
