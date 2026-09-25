// Avisos por Telegram con el bot existente (@claudionormativo_bot), solo para Lucas.
// Si faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no hace nada: así el preview, los tests y
// el desarrollo local nunca mandan mensajes.
import { logger } from "./logger";

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

// Para parse_mode HTML de Telegram alcanza con escapar &, < y >
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegram(text: string, opts: { silent?: boolean } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      disable_notification: opts.silent ?? false,
    }),
  });
  if (!res.ok) {
    // No se loguea el body completo por si trae datos del chat
    logger.error(`[Telegram] sendMessage respondió ${res.status}`);
    return false;
  }
  return true;
}
