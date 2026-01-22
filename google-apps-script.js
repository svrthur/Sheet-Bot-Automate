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
  
  // РК в колонке A (индекс 0)
  var rkRowMap = {};
  for (var i = 0; i < data.length; i++) {
    var rkInSheet = String(data[i][0]).trim();
    if (rkInSheet) {
      rkRowMap[rkInSheet] = i + 1;
    }
  }
  
  // Номера ТК в первой строке (индекс 0)
  var headers = data[0]; 
  var tkColMap = {};
  for (var col = 17; col <= 195; col++) { // Колонки R (17) до GN (195)
    var tkNum = String(headers[col]).trim();
    if (tkNum) {
      tkColMap[tkNum] = col + 1;
    }
  }

  for (var rk in campaignData) {
    var tks = campaignData[rk];
    var rowIndex = rkRowMap[rk];
    
    if (rowIndex) {
      for (var j = 0; j < tks.length; j++) {
        var tkNumToFind = String(tks[j]).trim();
        var colIndex = tkColMap[tkNumToFind];
        
        if (colIndex) {
          sheet.getRange(rowIndex, colIndex).setBackground("#00ff00");
        }
      }
    }
  }
}
