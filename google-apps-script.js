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
  
  // Создаем карту для поиска строк. 
  // На скриншоте РК в колонке A (индекс 0).
  var rkRowMap = {};
  for (var i = 0; i < data.length; i++) {
    var rkValue = String(data[i][0]).trim();
    if (rkValue) {
      rkRowMap[rkValue] = i + 1;
    }
  }
  
  // Создаем карту для поиска колонок по первой строке (номера ТК).
  var headers = data[0]; 
  var tkColMap = {};
  for (var col = 0; col < headers.length; col++) {
    var tkValue = String(headers[col]).trim();
    if (tkValue) {
      tkColMap[tkValue] = col + 1;
    }
  }

  for (var rk in campaignData) {
    var tks = campaignData[rk];
    var rowIndex = rkRowMap[rk];
    
    if (rowIndex) {
      for (var j = 0; j < tks.length; j++) {
        var tkNum = String(tks[j]).trim();
        var colIndex = tkColMap[tkNum];
        
        if (colIndex) {
          // Закрашиваем ячейку
          sheet.getRange(rowIndex, colIndex).setBackground("#00ff00");
        }
      }
    }
  }
}
