import { Telegraf } from 'telegraf';
import * as xlsx from 'xlsx';
import { storage } from './storage';
import axios from 'axios';

// URL вашего развернутого Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwiUcmCLIiK5US9Mvw8LO8SqPVRTsV6QRWnpSBuQDaFobg0t2CT8CYFDjRa0vlSCh4v/exec';

export async function setupBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not set.");
    return;
  }

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  const userState: Record<number, { step: string, row?: string }> = {};

  bot.start((ctx) => {
    ctx.reply('Привет! Введите номер строки (например, 118 или A118), в которой нужно отметить ТК:');
    userState[ctx.from.id] = { step: 'awaiting_row' };
  });

  bot.on('text', async (ctx) => {
    const state = userState[ctx.from.id];
    if (!state) return;

    if (state.step === 'awaiting_row') {
      state.row = ctx.message.text.trim();
      state.step = 'awaiting_tks';
      ctx.reply(`Принято: строка ${state.row}. Теперь введите номера ТК через запятую (например: 203, 227):`);
    } else if (state.step === 'awaiting_tks') {
      const tks = ctx.message.text.split(',').map(s => s.trim()).filter(s => s !== '');
      const row = state.row!;
      
      delete userState[ctx.from.id];

      const campaigns = { [row]: tks };

      if (APPS_SCRIPT_URL !== 'ВАШ_URL_РАЗВЕРТЫВАНИЯ_APPS_SCRIPT') {
        try {
          ctx.reply('Отправляю данные в таблицу...');
          const scriptRes = await axios.post(APPS_SCRIPT_URL, {
            action: 'highlight',
            data: campaigns
          }, {
            headers: { 'Content-Type': 'application/json' },
            maxRedirects: 5
          });
          
          if (scriptRes.data.status === 'success') {
            ctx.reply('Готово! Ячейки в таблице отмечены.');
          } else {
            ctx.reply(`Ошибка от Google: ${scriptRes.data.message || 'неизвестная ошибка'}`);
          }
        } catch (e: any) {
          ctx.reply(`Ошибка при отправке: ${e.message}`);
        }
      }

      await storage.createLog({
        level: 'success',
        message: `Текстовый ввод: строка ${row}, ТК: ${tks.join(', ')}`,
        details: { campaigns }
      });
    }
  });

  bot.on('document', async (ctx) => {
    // Сохраняем поддержку файлов на всякий случай
    ctx.reply('Сейчас я работаю в режиме диалога. Пожалуйста, используйте текстовые команды. Нажмите /start для начала.');
  });

  bot.launch().catch(err => {
    if (err.response?.error_code === 409) {
      console.log('Конфликт сессий (409). Попробуйте перезапустить workflow или подождите.');
    }
  });
}
