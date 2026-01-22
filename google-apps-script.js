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
  
  // Карта строк по колонке A (РК)
  // Используем trim() и принудительное приведение к строке для надежности
  var rkRowMap = {};
  for (var i = 0; i < data.length; i++) {
    var rkValue = String(data[i][0]).trim();
    if (rkValue) {
      rkRowMap[rkValue] = i + 1;
    }
  }
  
  // Карта колонок по первой строке в диапазоне R (17) - GN (195)
  var headers = data[0]; 
  var tkColMap = {};
  for (var col = 17; col <= 195; col++) {
    var tkValue = String(headers[col]).trim();
    if (tkValue) {
      // Сохраняем как строку для сравнения с данными из Excel
      tkColMap[tkValue] = col + 1;
    }
  }

  for (var rk in campaignData) {
    var tks = campaignData[rk];
    var rowIndex = rkRowMap[String(rk).trim()];
    
    if (rowIndex) {
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
