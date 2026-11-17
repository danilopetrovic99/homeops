export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgres://homeops:homeops@localhost:5432/homeops',
  checkIntervalMs: Number(process.env.CHECK_INTERVAL_SECONDS ?? 30) * 1000,
  telegramToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? '',
};
