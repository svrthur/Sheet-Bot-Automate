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
  // Использование SpreadsheetApp.openByUrl() более надежно в Web App
  // ЗАМЕНИТЕ ссылку ниже на ссылку вашей таблицы, если SpreadsheetApp.getActiveSpreadsheet() возвращает null
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss) {
    // Если скрипт запущен как веб-приложение от имени "Меня", 
    // иногда getActiveSpreadsheet() может возвращать null.
    // В этом случае можно попробовать открыть по ID (он есть в ссылке таблицы)
    // var ss = SpreadsheetApp.openById("ID_ВАШЕЙ_ТАБЛИЦЫ");
    throw new Error("Не удалось получить доступ к таблице. Убедитесь, что скрипт привязан к таблице или используйте openById.");
  }

  var sheet = ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  
  var headers = data[0]; 
  var tkColMap = {};
  for (var col = 0; col < headers.length; col++) {
    var val = headers[col];
    if (val !== null && val !== undefined) {
      var tkValue = String(val).trim();
      if (tkValue) {
        tkColMap[tkValue] = col + 1;
      }
    }
  }

  for (var rowKey in campaignData) {
    var tks = campaignData[rowKey];
    var rowIndex = parseInt(rowKey.replace(/\D/g, ''));
    
    if (!isNaN(rowIndex) && rowIndex > 0) {
      for (var j = 0; j < tks.length; j++) {
        var tkNum = String(tks[j]).trim();
        var colIndex = tkColMap[tkNum];
        
        if (colIndex) {
          sheet.getRange(rowIndex, colIndex).setBackground("#00ff00");
        }
      }
    }
  }
}
