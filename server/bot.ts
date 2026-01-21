import { Telegraf } from 'telegraf';
import { google } from 'googleapis';
import * as xlsx from 'xlsx';
import { storage } from './storage';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const SPREADSHEET_ID = '17VeQQWTGotofrpNbUHDhUFhCc3qjLdwoesTxDDfJ7h4';

export async function setupBot() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Bot will not start.");
    await storage.createLog({
      level: 'error',
      message: 'TELEGRAM_BOT_TOKEN is missing. Bot failed to start.',
    });
    return;
  }

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  bot.start((ctx) => {
    ctx.reply('Welcome! Send me an Excel file with RK and TK columns, and I will update the Google Sheet.');
    storage.createLog({
      level: 'info',
      message: 'Bot started by user',
      details: { userId: ctx.from.id, username: ctx.from.username }
    });
  });

  bot.on('document', async (ctx) => {
    const doc = ctx.message.document;
    const fileName = doc.file_name || 'unknown.xlsx';
    
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return ctx.reply('Please send a valid Excel file (.xlsx or .xls).');
    }

    try {
      await ctx.reply('Processing file...');
      const fileLink = await ctx.telegram.getFileLink(doc.file_id);
      
      const response = await axios({
        url: fileLink.href,
        method: 'GET',
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(response.data);
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet) as any[];

      // Parse Data
      const campaigns = new Map<string, Set<string | number>>();
      let lastRK = '';

      // The user's screenshot shows merged cells or empty cells for RK
      // We need to iterate and fill down RK
      // But sheet_to_json might not give us row-by-row perfectly if headers are complex
      // Let's assume standard parsing: Row 1 is header.
      // Keys: "RK", "TK" (based on screenshot)

      for (const row of data) {
        // Access safely, handle case sensitivity or spaces
        const rkVal = row['PK'] || row['RK'] || row['РК']; // Cyrillic РК
        const tkVal = row['TK'] || row['ТК']; // Cyrillic ТК

        if (rkVal) {
          lastRK = String(rkVal).trim();
        }

        if (lastRK && tkVal) {
          if (!campaigns.has(lastRK)) {
            campaigns.set(lastRK, new Set());
          }
          campaigns.get(lastRK)!.add(tkVal);
        }
      }

      await updateGoogleSheet(campaigns);
      
      ctx.reply(`Successfully processed ${campaigns.size} campaigns.`);
      storage.createLog({
        level: 'success',
        message: `Processed file ${fileName}`,
        details: { campaigns: campaigns.size }
      });

    } catch (error: any) {
      console.error('Error processing file:', error);
      ctx.reply('An error occurred while processing the file.');
      storage.createLog({
        level: 'error',
        message: `Error processing file ${fileName}`,
        details: { error: error.message }
      });
    }
  });

  bot.launch().catch(err => {
    console.error("Bot launch error:", err);
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  console.log("Bot started!");
}

async function updateGoogleSheet(campaigns: Map<string, Set<string | number>>) {
  // Auth
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client as any });

  // 1. Get all RKs from the sheet (Column A?)
  // We need to find the Row Index for each RK in the map.
  // Assuming 'РК' is in Column A.
  
  const getResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'A:A', // Read entire column A
  });

  const rows = getResponse.data.values;
  if (!rows) return;

  const requests: any[] = [];

  // Map sheet rows to RKs
  for (let i = 0; i < rows.length; i++) {
    const rowRK = String(rows[i][0]).trim();
    if (campaigns.has(rowRK)) {
      const tksToHighlight = campaigns.get(rowRK)!;
      const rowIndex = i; // 0-based index

      // Now we need to check columns R (index 17) to GN (index ~195) in THIS row
      // We need to fetch the values for this row in that range to know which cells match
      // Optimisation: We can batch get or just get the whole sheet? 
      // Getting whole sheet might be too big? 
      // Let's get the specific row range: R{i+1}:GN{i+1}
      
      const range = `R${rowIndex + 1}:GN${rowIndex + 1}`;
      const rowValuesResp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: range, 
      });

      const cellValues = rowValuesResp.data.values ? rowValuesResp.data.values[0] : [];
      
      // Iterate through cells in the range
      for (let j = 0; j < cellValues.length; j++) {
        const cellValue = cellValues[j];
        // Check if this cell value matches any of the TKs
        // Loose comparison (string vs number)
        let match = false;
        for (const tk of tksToHighlight) {
            if (String(tk) == String(cellValue)) {
                match = true;
                break;
            }
        }

        if (match) {
          // Highlight this cell
          // GridRange: 
          // sheetId: 0 (assuming first sheet)
          // startRowIndex: rowIndex, endRowIndex: rowIndex + 1
          // startColumnIndex: 17 + j, endColumnIndex: 17 + j + 1
          
          requests.push({
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: rowIndex,
                endRowIndex: rowIndex + 1,
                startColumnIndex: 17 + j,
                endColumnIndex: 17 + j + 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.0, green: 1.0, blue: 0.0 } // Green
                }
              },
              fields: 'userEnteredFormat.backgroundColor'
            }
          });
        }
      }
    }
  }

  if (requests.length > 0) {
    // Batch update
    // Limit requests per batch if necessary, but standard limit is high.
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests
      }
    });
  }
}
