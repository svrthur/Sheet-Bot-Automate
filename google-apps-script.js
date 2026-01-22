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
  
  // Карта колонок по первой строке (номера ТК)
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

  for (var rowStr in campaignData) {
    var tks = campaignData[rowStr];
    var rowIndex = parseInt(rowStr.trim());
    
    if (!isNaN(rowIndex) && rowIndex > 0) {
      for (var j = 0; j < tks.length; j++) {
        var tkNum = String(tks[j]).trim();
        var colIndex = tkColMap[tkNum];
        
        if (colIndex) {
          // Закрашиваем ячейку в строке по номеру и в колонке по ТК
          sheet.getRange(rowIndex, colIndex).setBackground("#00ff00");
        }
      }
    }
  }
}
