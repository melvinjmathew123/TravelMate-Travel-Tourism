import nodemailer from "nodemailer";

let transporter = null;

// Initialize transporter
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    console.log(`[Mailer] Initialized SMTP transport with host: ${host}`);
  } else {
    // Development fallback: ethereal / console logger
    transporter = {
      sendMail: async (options) => {
        console.log("-----------------------------------------");
        console.log(`✉️ [Mailer Dev Preview]`);
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Text Preview: ${options.text || "HTML email sent"}`);
        console.log("-----------------------------------------");
        return { messageId: `dev-mock-${Date.now()}` };
      }
    };
    console.log("[Mailer] SMTP credentials not set in .env. Using development preview logger.");
  }

  return transporter;
}

const FROM_EMAIL = process.env.EMAIL_FROM || '"TravelMate" <no-reply@travelmate.com>';

// Helper: base email layout wrapper
function emailLayout(contentHtml) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9f7; margin: 0; padding: 30px 15px; color: #1e2d24; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #0d1f16 0%, #1a5c42 100%); padding: 32px 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; letter-spacing: 0.5px; font-weight: 700; }
        .header span { display: inline-block; margin-top: 6px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #e8a838; font-weight: 700; }
        .content { padding: 36px 30px; line-height: 1.6; }
        .content h2 { color: #0d1f16; font-size: 20px; margin-top: 0; }
        .card { background: #f0f7f3; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #1a5c42; }
        .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .card-row:last-child { margin-bottom: 0; }
        .label { font-weight: 600; color: #5a7566; }
        .val { font-weight: 700; color: #0d1f16; }
        .btn { display: inline-block; background: #1a5c42; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; margin-top: 16px; }
        .footer { background: #fafcfa; border-top: 1px solid #e2ede6; padding: 20px 30px; text-align: center; font-size: 12px; color: #7f998b; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>✈ TravelMate</h1>
          <span>EXTRAORDINARY JOURNEYS</span>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} TravelMate Inc. All rights reserved.</p>
          <p>You received this email because you hold an account with TravelMate.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 1. Welcome Email
export async function sendWelcomeEmail(user) {
  try {
    const client = await getTransporter();
    const content = `
      <h2>Welcome aboard, ${user.name}! 🌍</h2>
      <p>Thank you for joining TravelMate. You are now part of a global community of wanderers discovering handpicked luxury stays, scenic expeditions, and bespoke itineraries.</p>
      <p>Here is what you can do right now:</p>
      <ul>
        <li>Explore over <strong>120+ curated destinations</strong> worldwide</li>
        <li>Book fully guided packages with 24/7 concierge assistance</li>
        <li>Manage and track your bookings in one seamless dashboard</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a class="btn" href="${process.env.CLIENT_URL || "http://localhost:5173"}/packages">Browse Packages →</a>
      </div>
      <p>Have questions? Reply directly to this email and our travel concierge team will assist you.</p>
    `;

    await client.sendMail({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Welcome to TravelMate, ${user.name}! ✈️`,
      html: emailLayout(content),
      text: `Welcome to TravelMate, ${user.name}! Explore curated destinations at ${process.env.CLIENT_URL || "http://localhost:5173"}`
    });
    console.log(`[Mailer] Welcome email sent to ${user.email}`);
  } catch (err) {
    console.error(`[Mailer] Error sending welcome email to ${user.email}:`, err.message);
  }
}

// 2. Booking Confirmation Email
export async function sendBookingConfirmationEmail(booking, user, pkg) {
  try {
    const client = await getTransporter();
    const formattedDate = new Date(booking.travelDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const inclusionsHtml = pkg.inclusions && pkg.inclusions.length
      ? `<ul>${pkg.inclusions.map(i => `<li>${i}</li>`).join("")}</ul>`
      : "";

    const content = `
      <h2>🎉 Booking Confirmed!</h2>
      <p>Dear <strong>${user.name}</strong>, your reservation for <strong>${pkg.title}</strong> has been successfully confirmed.</p>
      
      <div class="card">
        <div style="margin-bottom: 12px; font-weight: 700; color: #1a5c42; font-size: 16px;">
          Trip Summary
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #5a7566; font-size: 14px;"><strong>Booking ID:</strong></td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0d1f16;">#${booking._id.toString().slice(-8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5a7566; font-size: 14px;"><strong>Package:</strong></td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0d1f16;">${pkg.title}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5a7566; font-size: 14px;"><strong>Travel Date:</strong></td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0d1f16;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5a7566; font-size: 14px;"><strong>Travellers:</strong></td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0d1f16;">${booking.guests} Guest${booking.guests > 1 ? "s" : ""}</td>
          </tr>
          <tr style="border-top: 1px dashed #c0d8cb;">
            <td style="padding: 10px 0 0; color: #1a5c42; font-size: 15px; font-weight: 700;"><strong>Total Paid:</strong></td>
            <td style="padding: 10px 0 0; text-align: right; font-weight: 800; font-size: 17px; color: #1a5c42;">₹${booking.totalAmount.toLocaleString()}</td>
          </tr>
        </table>
      </div>

      ${inclusionsHtml ? `<h3>Package Inclusions:</h3>${inclusionsHtml}` : ""}

      <div style="text-align: center; margin: 30px 0;">
        <a class="btn" href="${process.env.CLIENT_URL || "http://localhost:5173"}/bookings">View My Bookings →</a>
      </div>

      <p style="font-size: 13px; color: #5a7566;">Please arrive at your pickup location or hotel with a valid government photo ID matching your registration name.</p>
    `;

    await client.sendMail({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Trip Confirmed: ${pkg.title} (Ref #${booking._id.toString().slice(-8).toUpperCase()})`,
      html: emailLayout(content),
      text: `Your trip to ${pkg.title} is confirmed for ${formattedDate}. Total: ₹${booking.totalAmount}. View at ${process.env.CLIENT_URL || "http://localhost:5173"}/bookings`
    });
    console.log(`[Mailer] Booking confirmation email sent to ${user.email}`);
  } catch (err) {
    console.error(`[Mailer] Error sending booking confirmation to ${user.email}:`, err.message);
  }
}

// 3. Booking Cancellation Email
export async function sendBookingCancellationEmail(booking, user, pkg) {
  try {
    const client = await getTransporter();
    const content = `
      <h2>Booking Cancelled</h2>
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Your booking for <strong>${pkg?.title || "your travel package"}</strong> (Ref #${booking._id.toString().slice(-8).toUpperCase()}) has been cancelled as requested.</p>
      <p>If applicable, any eligible refund will be credited back to your original payment method within 5–7 business days.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a class="btn" href="${process.env.CLIENT_URL || "http://localhost:5173"}/packages">Find Another Journey →</a>
      </div>
      <p>If you did not request this cancellation, please contact our support team immediately.</p>
    `;

    await client.sendMail({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Booking Cancelled: #${booking._id.toString().slice(-8).toUpperCase()}`,
      html: emailLayout(content),
      text: `Your booking for ${pkg?.title || "your package"} has been cancelled.`
    });
    console.log(`[Mailer] Cancellation email sent to ${user.email}`);
  } catch (err) {
    console.error(`[Mailer] Error sending cancellation email to ${user.email}:`, err.message);
  }
}

// 4. Registration OTP Email
export async function sendOtpEmail(email, otp, name = "Traveler") {
  try {
    const client = await getTransporter();
    const content = `
      <h2>Verify your email address</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for signing up with TravelMate. To complete your account registration, please enter the one-time verification code below:</p>
      <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; background: #e8f4ed; border: 2px dashed #1a5c42; border-radius: 8px; padding: 14px 36px; font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1a5c42;">
          ${otp}
        </div>
      </div>
      <p style="font-size: 14px; color: #5a7566; text-align: center;">This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
      <p style="font-size: 13px; color: #7f998b; margin-top: 24px;">If you did not request this verification, you can safely ignore this email.</p>
    `;

    await client.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: `Your TravelMate Verification Code: ${otp}`,
      html: emailLayout(content),
      text: `Your TravelMate verification code is: ${otp}. It expires in 10 minutes.`
    });
    console.log(`[Mailer] Verification OTP sent to ${email}: ${otp}`);
  } catch (err) {
    console.error(`[Mailer] Error sending OTP to ${email}:`, err.message);
  }
}
