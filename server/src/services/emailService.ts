import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getEffectiveFromEmail(): string {
  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
  // Resend strictly forbids sending FROM public domains like gmail.com / yahoo.com.
  // If env contains a public domain or is unset, use the verified lordesportz.com domain.
  if (
    envFrom &&
    !envFrom.toLowerCase().includes("@gmail.") &&
    !envFrom.toLowerCase().includes("@yahoo.") &&
    !envFrom.toLowerCase().includes("@outlook.") &&
    !envFrom.toLowerCase().includes("@hotmail.")
  ) {
    return envFrom;
  }
  return "LORD ESPORTZ <noreply@lordesportz.com>";
}

export interface SendOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send Password Reset OTP Email via Resend
 */
export async function sendPasswordResetOtpEmail(
  toEmail: string,
  otp: string,
  recipientName: string = "Athlete"
): Promise<SendOtpResult> {
  const resend = getResendClient();
  const fromEmail = getEffectiveFromEmail();
  const replyTo = process.env.REPLY_TO_EMAIL || "lordesportz75@gmail.com";

  console.log(`\n======================================================`);
  console.log(`🔑 [AUTH OTP] Password Reset Code for: ${toEmail}`);
  console.log(`🔑 [AUTH OTP] Sender: ${fromEmail} | Reply-To: ${replyTo}`);
  console.log(`🔑 [AUTH OTP] Verification OTP: [ ${otp} ] (Valid for 10 minutes)`);
  console.log(`======================================================\n`);

  if (!resend) {
    const errMsg = "Resend API key is not configured. Please add RESEND_API_KEY to your server environment variables.";
    console.error(`❌ [Resend] ${errMsg}`);
    return {
      success: false,
      error: errMsg,
    };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>LORD ESPORTZ — Password Reset Code</title>
  <style>
    body { margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; }
    .container { max-width: 580px; margin: 0 auto; background-color: #0C0C10; border: 1px solid #22222A; border-radius: 16px; overflow: hidden; }
    .header { padding: 32px 24px; text-align: center; background: linear-gradient(180deg, #181820 0%, #0C0C10 100%); border-bottom: 1px solid #FFBE32/20; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(255, 190, 50, 0.15); border: 1px solid #FFBE32; border-radius: 20px; color: #FFBE32; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
    .title { margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: 1px; text-transform: uppercase; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 16px; font-weight: 600; color: #E5E7EB; margin-bottom: 16px; }
    .desc { font-size: 14px; color: #9CA3AF; margin-bottom: 24px; }
    .otp-box { background: #14141C; border: 2px dashed #FFBE32; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #FFBE32; margin: 0; }
    .otp-expiry { font-size: 12px; color: #9CA3AF; margin-top: 8px; }
    .security-note { font-size: 12px; color: #6B7280; background: #08080A; border-radius: 8px; padding: 14px; margin-top: 24px; border-left: 3px solid #FFBE32; }
    .footer { padding: 24px; text-align: center; font-size: 11px; color: #4B5563; border-top: 1px solid #181820; }
  </style>
</head>
<body>
  <div style="padding: 40px 16px;">
    <div class="container">
      <div class="header">
        <span class="badge">SECURITY VERIFICATION</span>
        <h1 class="title">LORD ESPORTZ</h1>
        <p style="color: #9CA3AF; font-size: 12px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px;">Athlete Passport Verification</p>
      </div>
      
      <div class="content">
        <p class="greeting">Greetings ${recipientName},</p>
        <p class="desc">
          You requested to reset your password for the <strong>LORD ESPORTZ Portal</strong>. Use the 6-digit verification code below to authorize your password change.
        </p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">⏳ Code expires in <strong>10 minutes</strong></div>
        </div>
        
        <div class="security-note">
          <strong>Security Advisory:</strong> If you did not initiate this password reset request, please disregard this email. Your athlete credentials remain secure.
        </div>
      </div>
      
      <div class="footer">
        © ${new Date().getFullYear()} LORD ESPORTZ CLAN. All Rights Reserved.<br>
        Premier Indian Esports Tournaments & Pro Gaming Organization.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      replyTo: replyTo,
      to: [toEmail],
      subject: `[${otp}] Your LORD ESPORTZ Password Reset Code`,
      html: htmlContent,
    });

    if (error) {
      console.error("❌ [Resend] Email delivery failed:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log(`✅ [Resend] Password reset email successfully dispatched to ${toEmail} (ID: ${data?.id})`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: any) {
    console.error("❌ [Resend] Exception sending email:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

export interface WelcomeEmailData {
  email: string;
  fullName?: string | null;
  username?: string | null;
  ign?: string | null;
  primaryGame?: string | null;
  gamingExperience?: string | null;
  device?: string | null;
  discord?: string | null;
}

/**
 * Send High-Impact Welcome Email via Resend on Athlete Registration
 */
export async function sendWelcomeEmail(
  user: WelcomeEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = getResendClient();
  const fromEmail = getEffectiveFromEmail();
  const replyTo = process.env.REPLY_TO_EMAIL || "lordesportz75@gmail.com";
  const clientUrl = process.env.CLIENT_URL || "https://lordz-esports.lordesportz75.workers.dev";
  const logoUrl = "https://lordz-esports.lordesportz75.workers.dev/lordz-logo.png";

  const athleteUsername = user.username?.trim() || user.email.split("@")[0];
  const athleteName = user.fullName || user.ign || athleteUsername || "Athlete";
  const athleteIgn = user.ign || athleteUsername.toUpperCase();
  const primaryGame = user.primaryGame || "FREE FIRE MAX";
  const gamingExp = user.gamingExperience || "1-2 Years (Semi-Pro)";
  const device = user.device || "Mobile Device";

  console.log(`\n======================================================`);
  console.log(`🎮 [WELCOME EMAIL] Sending welcome email to: ${user.email} (${athleteIgn})`);
  console.log(`======================================================\n`);

  if (!resend) {
    console.warn("⚠️ [Resend] RESEND_API_KEY is not configured in server/.env. Skipped remote dispatch.");
    return { success: true };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LORD ESPORTZ Clan</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF; -webkit-font-smoothing: antialiased;">
  <div style="padding: 40px 16px; background-color: #050507;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #0C0C10; border: 1px solid #22222E; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);">
      
      <!-- HEADER WITH OFFICIAL LOGO & GLOW -->
      <tr>
        <td style="padding: 40px 24px 30px; text-align: center; background: linear-gradient(180deg, #161622 0%, #0C0C10 100%); border-bottom: 2px solid rgba(255, 190, 50, 0.25);">
          <!-- Logo Image -->
          <div style="display: inline-block; margin-bottom: 18px;">
            <img src="${logoUrl}" alt="LORD ESPORTZ" width="90" height="90" style="display: block; width: 90px; height: 90px; border-radius: 20px; border: 2px solid #FFBE32; box-shadow: 0 0 30px rgba(255, 190, 50, 0.5); object-fit: contain; background-color: #070709;" />
          </div>
          
          <div style="margin-bottom: 10px;">
            <span style="display: inline-block; padding: 5px 16px; background: rgba(255, 190, 50, 0.15); border: 1px solid #FFBE32; border-radius: 24px; color: #FFBE32; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
              ⚡ OFFICIAL ATHLETE ONBOARDING
            </span>
          </div>

          <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
            WELCOME TO LORD ESPORTZ
          </h1>
          <p style="margin: 8px 0 0 0; color: #9CA3AF; font-size: 13px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase;">
            Compete • Dominate • Build Your Legacy
          </p>
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td style="padding: 32px 30px 20px;">
          <!-- Salutation -->
          <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #FFFFFF;">
            Greetings <span style="color: #FFBE32;">${athleteName}</span>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.7; color: #D1D5DB;">
            Welcome to the frontlines of Indian competitive esports! Your official <strong>LORD ESPORTZ Athlete Passport</strong> has been verified and registered on our portal. You now have unrestricted access to our national tournament brackets, live scrims, verified stats, and official clan operations.
          </p>

          <!-- ATHLETE PASSPORT CREDENTIAL CARD -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 28px; background: linear-gradient(135deg, #14141E 0%, #0A0A0E 100%); border: 1.5px solid #FFBE32; border-radius: 16px; box-shadow: 0 4px 20px rgba(255, 190, 50, 0.15);">
            <tr>
              <td style="padding: 16px 20px; border-bottom: 1px solid rgba(255, 190, 50, 0.2);">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left">
                      <span style="font-size: 11px; font-weight: 900; color: #FFBE32; letter-spacing: 2px; text-transform: uppercase;">
                        ⚡ ATHLETE PASSPORT CREDENTIALS
                      </span>
                    </td>
                    <td align="right">
                      <span style="display: inline-block; padding: 3px 10px; background: rgba(34, 197, 94, 0.15); border: 1px solid #22C55E; border-radius: 12px; font-size: 10px; font-weight: 800; color: #4ADE80; letter-spacing: 1px; text-transform: uppercase;">
                        ● ACTIVE PRO
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding: 7px 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; font-family: monospace;">In-Game Name (IGN):</td>
                    <td align="right" style="padding: 7px 0; font-size: 15px; font-weight: 900; color: #FFFFFF; font-family: monospace; letter-spacing: 1px;">${athleteIgn}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; font-family: monospace;">Clan Username:</td>
                    <td align="right" style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #FFBE32; font-family: monospace;">@${athleteUsername}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; font-family: monospace;">Primary Title:</td>
                    <td align="right" style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #E5E7EB; font-family: monospace;">${primaryGame}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; font-family: monospace;">Experience Tier:</td>
                    <td align="right" style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #E5E7EB; font-family: monospace;">${gamingExp}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; font-family: monospace;">Combat Device:</td>
                    <td align="right" style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #E5E7EB; font-family: monospace;">${device}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- WHAT YOU UNLOCKED (PERKS GRID) -->
          <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase;">
            YOUR ATHLETE PRIVILEGES INCLUDE:
          </h3>

          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
            <tr>
              <td width="50%" valign="top" style="padding: 0 8px 12px 0;">
                <div style="background-color: #111118; border: 1px solid #1F1F2C; border-radius: 12px; padding: 16px; min-height: 90px;">
                  <div style="font-size: 20px; margin-bottom: 6px;">🏆</div>
                  <div style="font-size: 13px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">Tournaments & Cash</div>
                  <div style="font-size: 11px; line-height: 1.5; color: #9CA3AF;">Register squad for cash cups and official seasonal leaderboards.</div>
                </div>
              </td>
              <td width="50%" valign="top" style="padding: 0 0 12px 8px;">
                <div style="background-color: #111118; border: 1px solid #1F1F2C; border-radius: 12px; padding: 16px; min-height: 90px;">
                  <div style="font-size: 20px; margin-bottom: 6px;">🔑</div>
                  <div style="font-size: 13px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">Live Room ID & Pass</div>
                  <div style="font-size: 11px; line-height: 1.5; color: #9CA3AF;">Get match credentials published right on your screen before game drop.</div>
                </div>
              </td>
            </tr>
            <tr>
              <td width="50%" valign="top" style="padding: 0 8px 0 0;">
                <div style="background-color: #111118; border: 1px solid #1F1F2C; border-radius: 12px; padding: 16px; min-height: 90px;">
                  <div style="font-size: 20px; margin-bottom: 6px;">👕</div>
                  <div style="font-size: 13px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">Custom Clan Merch</div>
                  <div style="font-size: 11px; line-height: 1.5; color: #9CA3AF;">Order authentic jerseys with your custom IGN & number sublimated.</div>
                </div>
              </td>
              <td width="50%" valign="top" style="padding: 0 0 0 8px;">
                <div style="background-color: #111118; border: 1px solid #1F1F2C; border-radius: 12px; padding: 16px; min-height: 90px;">
                  <div style="font-size: 20px; margin-bottom: 6px;">🛡️</div>
                  <div style="font-size: 13px; font-weight: 800; color: #FFFFFF; margin-bottom: 4px;">Verified Tier Scrims</div>
                  <div style="font-size: 11px; line-height: 1.5; color: #9CA3AF;">Compete in high-stakes daily scrims with anti-cheat verifications.</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- CALL TO ACTION BUTTON -->
          <div style="text-align: center; margin: 34px 0 28px 0;">
            <a href="${clientUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #FFBE32 0%, #FFA000 100%); color: #000000; font-size: 13px; font-weight: 900; text-decoration: none; border-radius: 12px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 6px 25px rgba(255, 190, 50, 0.45);">
              ENTER TOURNAMENT ARENA →
            </a>
          </div>

          <!-- COMMUNITY CALLOUT -->
          <div style="background-color: #08080C; border-left: 3px solid #FFBE32; border-radius: 8px; padding: 14px 18px; margin-top: 10px;">
            <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
              <strong style="color: #FFFFFF;">Need Squad Assistance or Have Questions?</strong> Connect with our clan coordinators on our official portal or email <a href="mailto:lordesportz75@gmail.com" style="color: #FFBE32; text-decoration: none;">lordesportz75@gmail.com</a>.
            </p>
          </div>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="padding: 28px 24px; text-align: center; font-size: 11px; color: #6B7280; border-top: 1px solid #1C1C24; line-height: 1.7;">
          <p style="margin: 0 0 6px 0; font-weight: 700; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase;">
            © ${new Date().getFullYear()} LORD ESPORTZ CLAN. ALL RIGHTS RESERVED.
          </p>
          <p style="margin: 0; color: #4B5563;">
            Chennai, Tamil Nadu, India • Premier Indian Esports Tournaments & Pro Gaming Organization.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      replyTo: replyTo,
      to: [user.email],
      subject: `🏆 Welcome to LORD ESPORTZ Clan, ${athleteIgn}! Your Athlete Passport is Active`,
      html: htmlContent,
    });

    if (error) {
      console.warn("⚠️ [Resend] Welcome email delivery warning:", error.message);
      return {
        success: true,
        error: error.message,
      };
    }

    console.log(`✅ [Resend] Welcome email successfully dispatched to ${user.email} (ID: ${data?.id})`);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: any) {
    console.error("❌ [Resend] Exception sending welcome email:", err.message);
    return {
      success: true,
      error: err.message,
    };
  }
}

export interface RoomCredentialsEmailData {
  leaderEmail: string;
  leaderName: string;
  teamName: string;
  tournamentTitle: string;
  roundName: string;
  roomId: string;
  roomPassword: string;
  map?: string;
  roomTime?: string;
  slotNumber?: number | string;
  customNotes?: string;
}

/**
 * Send Custom Match Room Credentials to Team Leader via Resend
 */
export async function sendRoomCredentialsEmail(
  data: RoomCredentialsEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = getResendClient();
  const fromEmail = getEffectiveFromEmail();
  const replyTo = process.env.REPLY_TO_EMAIL || "lordesportz75@gmail.com";

  console.log(`\n======================================================`);
  console.log(`🎮 [ROOM CREDENTIALS EMAIL] Sending credentials to: ${data.leaderEmail}`);
  console.log(`🎮 [ROOM CREDENTIALS EMAIL] Team: ${data.teamName} | Leader: ${data.leaderName}`);
  console.log(`🎮 [ROOM CREDENTIALS EMAIL] Tournament: ${data.tournamentTitle} (${data.roundName})`);
  console.log(`🎮 [ROOM CREDENTIALS EMAIL] Room ID: ${data.roomId} | Password: ${data.roomPassword}`);
  console.log(`======================================================\n`);

  if (!resend) {
    console.warn("⚠️ [Resend] Resend API key is not configured. Email logged to console.");
    return { success: true };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Match Room Credentials — ${data.tournamentTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #050508; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <div style="background-color: #050508; padding: 40px 16px;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0C0C12; border: 1px solid #262635; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
      <!-- HEADER -->
      <tr>
        <td style="padding: 36px 32px 24px 32px; background: linear-gradient(180deg, #181824 0%, #0C0C12 100%); text-align: center; border-bottom: 2px solid #FFBE32;">
          <div style="display: inline-block; padding: 6px 14px; border-radius: 30px; background: rgba(255, 190, 50, 0.15); border: 1px solid rgba(255, 190, 50, 0.4); margin-bottom: 16px;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #FFBE32; text-transform: uppercase;">OFFICIAL MATCH ROOM DISPATCH</span>
          </div>
          <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; color: #FFFFFF; text-transform: uppercase;">
            ROOM CREDENTIALS ARE LIVE! 🎮
          </h1>
          <p style="margin: 0; font-size: 14px; color: #9CA3AF;">
            ${data.tournamentTitle} • <strong style="color: #FFBE32;">${data.roundName}</strong>
          </p>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding: 32px;">
          <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #D1D5DB;">
            Greetings Captain <strong style="color: #FFFFFF;">${data.leaderName}</strong>,
          </p>
          <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9CA3AF;">
            The custom match lobby for squad <strong style="color: #FFBE32;">${data.teamName}</strong> is now open. Below are your official Free Fire custom room credentials. Please ensure your squad is joined and seated before the match timer expires.
          </p>

          <!-- CREDENTIALS BOX -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(255, 190, 50, 0.1) 0%, rgba(20, 20, 30, 0.8) 100%); border: 2px solid #FFBE32; border-radius: 16px; margin: 0 0 24px 0; overflow: hidden;">
            <tr>
              <td style="padding: 20px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #9CA3AF; text-transform: uppercase; margin-bottom: 6px;">ASSIGNED SQUAD SLOT</div>
                <div style="font-size: 18px; font-weight: 900; color: #22C55E;">SLOT #${data.slotNumber || 1}</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="padding-right: 12px; vertical-align: top;">
                      <div style="background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 700; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 8px;">ROOM ID</span>
                        <span style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #FFFFFF; font-family: monospace;">${data.roomId}</span>
                      </div>
                    </td>
                    <td width="50%" style="padding-left: 12px; vertical-align: top;">
                      <div style="background: rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 700; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 8px;">PASSWORD</span>
                        <span style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #FFBE32; font-family: monospace;">${data.roomPassword}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 24px; background: rgba(0, 0, 0, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.08);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size: 12px; color: #9CA3AF; font-family: monospace;">
                      MAP: <strong style="color: #FFBE32; text-transform: uppercase;">${data.map || "BERMUDA"}</strong>
                    </td>
                    <td align="right" style="font-size: 12px; color: #9CA3AF; font-family: monospace;">
                      TIME: <strong style="color: #FFFFFF;">${data.roomTime || "AS SCHEDULED"}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          ${data.customNotes ? `
          <div style="background: rgba(255, 255, 255, 0.04); border-left: 3px solid #FFBE32; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 12px; color: #E5E7EB; line-height: 1.6;">
              📌 <strong style="color: #FFBE32;">Special Instructions:</strong> ${data.customNotes}
            </p>
          </div>
          ` : ""}

          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 28px;">
            <p style="margin: 0; font-size: 12px; color: #FCA5A5; line-height: 1.6;">
              ⚠️ <strong>Strict Competitive Rules:</strong> Only enter your assigned <strong>Slot #${data.slotNumber || 1}</strong>. Entering any other team's slot will result in immediate kick and possible squad disqualification. Do NOT leak or share room credentials outside your roster.
            </p>
          </div>

          <!-- CTA BUTTON -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <a href="https://lordesportz.com/my-tournaments" target="_blank" style="display: inline-block; background-color: #FFBE32; color: #000000; font-size: 13px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; padding: 16px 36px; border-radius: 12px; box-shadow: 0 4px 20px rgba(255, 190, 50, 0.4);">
                  VIEW ON ATHLETE DASHBOARD →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="padding: 24px; text-align: center; font-size: 11px; color: #6B7280; border-top: 1px solid #1C1C24;">
          <p style="margin: 0 0 4px 0; font-weight: 700; color: #9CA3AF; text-transform: uppercase;">
            © ${new Date().getFullYear()} LORD ESPORTZ. ALL RIGHTS RESERVED.
          </p>
          <p style="margin: 0; color: #4B5563;">
            Official Match Room Dispatch for competitive registered athletes.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  try {
    const { data: resendData, error } = await resend.emails.send({
      from: fromEmail,
      replyTo: replyTo,
      to: [data.leaderEmail],
      subject: `🎮 Room Credentials Live: ${data.tournamentTitle} - ${data.roundName} (Room ID: ${data.roomId})`,
      html: htmlContent,
    });

    if (error) {
      console.warn(`⚠️ [Resend] Room credentials email warning (${data.leaderEmail}):`, error.message);
      return { success: true, error: error.message };
    }

    console.log(`✅ [Resend] Room credentials email dispatched to ${data.leaderEmail} (ID: ${resendData?.id})`);
    return { success: true, messageId: resendData?.id };
  } catch (err: any) {
    console.error(`❌ [Resend] Exception sending room credentials email to ${data.leaderEmail}:`, err.message);
    return { success: true, error: err.message };
  }
}


