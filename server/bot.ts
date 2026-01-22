import { Telegraf } from 'telegraf';
import * as xlsx from 'xlsx';
import { storage } from './storage';
import axios from 'axios';

// URL вашего развернутого Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5hSDc6RyanX7WviVf0emEuLrgIYJlhdxhWhoQlaho79NwYGwnj5yoa7icOW8dmXDP/exec';

export async function setupBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not set.");
    return;
  }

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  bot.start((ctx) => {
    ctx.reply('Бот готов! Пришлите Excel файл для обработки.');
  });

  bot.on('document', async (ctx) => {
    const doc = ctx.message.document;
    const fileName = doc.file_name || 'file.xlsx';
    
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return ctx.reply('Пожалуйста, пришлите файл Excel (.xlsx или .xls).');
    }

    try {
      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      const response = await axios({
        url: fileLink.href,
        method: 'GET',
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data);
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet) as any[];

      const campaigns: Record<string, string[]> = {};
      let lastRK = '';

      // Мы используем raw data для доступа по индексам колонок (A и B)
      const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const rkVal = row[0]; // Колонка A
        const tkVal = row[1]; // Колонка B

        if (rkVal !== undefined && rkVal !== null && String(rkVal).trim() !== '') {
          lastRK = String(rkVal).trim();
        }
        
        if (lastRK && tkVal !== undefined && tkVal !== null && String(tkVal).trim() !== '') {
          if (!campaigns[lastRK]) campaigns[lastRK] = [];
          campaigns[lastRK].push(String(tkVal).trim());
        }
      }

      // Отправка данных в Apps Script (если URL настроен)
      if (APPS_SCRIPT_URL !== 'https://script.google.com/macros/s/AKfycbw5hSDc6RyanX7WviVf0emEuLrgIYJlhdxhWhoQlaho79NwYGwnj5yoa7icOW8dmXDP/exec') {
        try {
          console.log('Sending to Apps Script:', JSON.stringify(campaigns));
          // Apps Script Redirects require following
          const scriptRes = await axios.post(APPS_SCRIPT_URL, {
            action: 'highlight',
            data: campaigns
          }, {
            headers: { 'Content-Type': 'application/json' },
            maxRedirects: 5
          });
          console.log('Apps Script Response:', JSON.stringify(scriptRes.data));
        } catch (e: any) {
          console.error('Ошибка отправки в Apps Script:', e.message);
          if (e.response) {
            console.error('Response data:', JSON.stringify(e.response.data));
          }
        }
      }

      await storage.createLog({
        level: 'success',
        message: `Файл ${fileName} обработан`,
        details: { campaigns }
      });

      ctx.reply(`Обработано кампаний: ${Object.keys(campaigns).length}. Если вы настроили Apps Script URL в боте, таблица обновится.`);

    } catch (error: any) {
      ctx.reply('Ошибка при обработке файла.');
      await storage.createLog({
        level: 'error',
        message: `Ошибка файла ${fileName}`,
        details: { error: error.message }
      });
    }
  });

  bot.launch().catch(err => {
    if (err.response?.error_code === 409) {
      console.log('Конфликт сессий (409). Попробуйте перезапустить workflow или подождите.');
    }
  });
}
