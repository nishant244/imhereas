import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 🛠 Telegram message sender — credentials are validated inside the function
async function sendTelegramMessage(text: string) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ Missing Telegram credentials in environment variables');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  });
}

export async function POST(req: Request) {
  const { name, email, message } = await req.json();
  const allowedNames = ['cutie', 'dragon', 'cld']; // ✅ Only these names are allowed

  if (!allowedNames.includes(name.trim().toLowerCase())) {
    return NextResponse.json({ success: false, error: 'Unauthorized name' }, { status: 403 });
  }

  // 🛡 Ensure all email credentials are set
  const { EMAIL_USER, EMAIL_PASS, EMAIL_RECEIVER } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_RECEIVER) {
    console.error('❌ Missing email configuration in environment variables');
    return NextResponse.json({ success: false, error: 'Missing email configuration' }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: EMAIL_RECEIVER,
    subject: `Contact form submission from ${name}`,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    const telegramText = `<b>New message from ${name}</b>\n\n${message}`;
    await sendTelegramMessage(telegramText);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
