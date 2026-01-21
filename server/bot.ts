import { Telegraf } from 'telegraf';
import * as xlsx from 'xlsx';
import { storage } from './storage';
import axios from 'axios';

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

      for (const row of data) {
        const rkVal = row['PK'] || row['RK'] || row['РК'];
        const tkVal = row['TK'] || row['ТК'];

        if (rkVal) lastRK = String(rkVal).trim();
        if (lastRK && tkVal) {
          if (!campaigns[lastRK]) campaigns[lastRK] = [];
          campaigns[lastRK].push(String(tkVal));
        }
      }

      // Log the results so they appear on the dashboard
      await storage.createLog({
        level: 'success',
        message: `Файл ${fileName} обработан`,
        details: { campaigns }
      });

      ctx.reply(`Обработано кампаний: ${Object.keys(campaigns).length}. Данные доступны в панели управления.`);

    } catch (error: any) {
      ctx.reply('Ошибка при обработке файла.');
      await storage.createLog({
        level: 'error',
        message: `Ошибка файла ${fileName}`,
        details: { error: error.message }
      });
    }
  });

  bot.launch();
}
