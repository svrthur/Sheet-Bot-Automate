// 1. Вставьте этот код в Apps Script
// 2. Разверните как ВЕБ-ПРИЛОЖЕНИЕ (Deploy -> New Deployment -> Web App)
// 3. Выберите "Execute as: Me" и "Who has access: Anyone"
// 4. Скопируйте полученный URL и вставьте его в server/bot.ts в переменную APPS_SCRIPT_URL

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === 'highlight') {
      highlightCampaigns(requestData.data);
      return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function highlightCampaigns(campaignData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  for (var rk in campaignData) {
    var tks = campaignData[rk];
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() == rk) {
        for (var col = 17; col <= 195; col++) {
          if (tks.indexOf(String(data[i][col]).trim()) !== -1) {
            sheet.getRange(i + 1, col + 1).setBackground("#00ff00");
          }
        }
      }
    }
  }
}
