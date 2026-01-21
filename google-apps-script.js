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
