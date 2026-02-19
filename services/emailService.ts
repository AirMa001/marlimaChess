import nodemailer from 'nodemailer';

export async function sendOTPEmail(email: string, otp: string) {
  
  // 1. Configure the "Postman" (Gmail)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'unnchess1@gmail.com', // Your real Gmail
      pass: process.env.GMAIL_APP_PASSWORD   // The 16-letter App Password from Google
    }
  });

  try {
    console.log(`Attempting to send OTP to ${email} via Gmail...`);

    // 2. Send the Email
    const info = await transporter.sendMail({
      from: '"Marlima Chess" <unnchess1@gmail.com>', // Shows up as "Marlima Chess"
      to: email, // ✅ This now works for ANY email address
      subject: `Start your game! Your code is ${otp}`,
      
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Marlima Chess Verification</title>
        </head>
        <body style="background-color: #f6f9fc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px 0;">
          
          <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e1e1e1;">
            
            <div style="background-color: #1a1a1a; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">♟️ MARLIMA CHESS</h1>
            </div>

            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #333333; margin-top: 0; font-size: 20px;">Verify your identity</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                Welcome to Marlima Chess. Enter the code below to complete your registration and prepare for your first tournament.
              </p>

              <div style="background-color: #f8fafc; border: 2px dashed #ea580c; border-radius: 8px; padding: 20px; margin: 0 auto 30px auto; width: fit-content;">
                <span style="font-size: 32px; font-weight: 800; color: #ea580c; letter-spacing: 8px; display: block;">${otp}</span>
              </div>

              <p style="color: #999999; font-size: 14px; margin-bottom: 0;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
            </div>

            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="color: #aaaaaa; font-size: 12px; margin: 0;">
                Secure Login System • Nsukka, Nigeria<br>
                If you didn't request this code, you can safely ignore this email.
              </p>
            </div>

          </div>
        </body>
        </html>
      `
    });

    console.log("✅ Email sent successfully via Gmail!", info.messageId);
    return { success: true };

  } catch (error: any) {
    console.error("❌ Gmail Error:", error.message);
    return { success: false, error: error.message };
  }
}