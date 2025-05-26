import type { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import nodemailer from 'nodemailer';

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: 'Invalid JSON' }),
    };
  }

  const { name, message } = body;
  const allowedNames = ['cutie', 'dragon', 'cld'];

  if (!allowedNames.includes(name.trim().toLowerCase())) {
    return {
      statusCode: 403,
      body: JSON.stringify({ success: false, error: 'Unauthorized name' }),
    };
  }

  const {
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_RECEIVER,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
  } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_RECEIVER || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ Missing required environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Missing configuration' }),
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_RECEIVER,
    subject: `A messege from ${name}`,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);

    const telegramText = `<b>New message from ${name}</b>\n\n${message}`;
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramText,
        parse_mode: 'HTML',
      }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('❌ Error sending email or telegram:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false }),
    };
  }
};
