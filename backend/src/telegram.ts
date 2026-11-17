import { config } from './config.js';

export async function sendTelegram(text: string): Promise<void> {
  if (!config.telegramToken || !config.telegramChatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${config.telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: config.telegramChatId, text }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error('telegram send failed', err);
  }
}
