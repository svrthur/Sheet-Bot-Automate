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
  
  var rkRowMap = {};
  for (var i = 0; i < data.length; i++) {
    var val = data[i][0];
    if (val !== null && val !== undefined) {
      var rkValue = String(val).trim();
      if (rkValue) {
        rkRowMap[rkValue] = i + 1;
      }
    }
  }
  
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

  var foundAny = false;
  for (var rk in campaignData) {
    var tks = campaignData[rk];
    var rowIndex = rkRowMap[String(rk).trim()];
    
    if (rowIndex) {
      for (var j = 0; j < tks.length; j++) {
        var tkNum = String(tks[j]).trim();
        var colIndex = tkColMap[tkNum];
        
        if (colIndex) {
          sheet.getRange(rowIndex, colIndex).setBackground("#00ff00");
          foundAny = true;
        }
      }
    }
  }
  
  if (!foundAny) {
    console.error("No matches found for highlighting. RKs: " + Object.keys(campaignData).join(", "));
  }
}
