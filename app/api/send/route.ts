import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  throw new Error('Telegram credentials are not set in environment variables.');
}

async function sendTelegramMessage(text: string) {
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
  const allowedNames = ['cutie', 'dragon', 'cld']; // ✅ allowed names, lowercase only

  if (!allowedNames.includes(name.trim().toLowerCase())) {
   return NextResponse.json({ success: false, error: 'Unauthorized name' }, { status: 403 });
  }


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_RECEIVER,
    subject: `Contact form submission from ${name}`,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    const telegramText = `<b>New message from ${name}</b>\n\n${message}`;
    await sendTelegramMessage(telegramText);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
