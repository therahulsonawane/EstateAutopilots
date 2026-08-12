/**
 * Estate Autopilots — Growth Strategist Lead Automation
 * Google Apps Script for capturing form submissions into Google Sheets
 * 
 * Instructions:
 * 1. Open your target Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this script.
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select type: 'Web app'.
 * 6. Set Description: "Growth Strategist Lead Collector".
 * 7. Set 'Execute as': "Me".
 * 8. Set 'Who has access': "Anyone".
 * 9. Click 'Deploy', authorize permissions, and copy the Web App URL.
 * 10. Paste the Web App URL into growth-strategist.html.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for other instances to finish
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    // Target the 'Growth Strategist' tab if present, fallback to active sheet
    var sheet = doc.getSheetByName("Growth Strategist") || doc.getActiveSheet();

    // Check if header row exists
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      var headers = [
        "Timestamp",
        "Full Name",
        "Phone / WhatsApp",
        "Email",
        "Years Experience",
        "Current Role & Company",
        "Portfolio / CV Link",
        "Task Doc Link",
        "Q3 - Senior Feedback Response",
        "Q4 - Anything Else",
        "UTM Source",
        "UTM Campaign",
        "UTM Content",
        "Ad ID",
        "Page URL"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#021f2d").setFontColor("#fbc701");
      sheet.setFrozenRows(1);
    }

    var p = e.parameter || {};
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+05:30", "yyyy-MM-dd HH:mm:ss");

    var newRow = [
      timestamp,
      p.name || '',
      p.phone || '',
      p.email || '',
      p.experience || '',
      p.current || '',
      p.link || '',
      p.doclink || '',
      p.q3 || '',
      p.q4 || '',
      p.utm_source || '',
      p.utm_campaign || '',
      p.utm_content || '',
      p.ad_id || '',
      p.page_url || ''
    ];

    sheet.appendRow(newRow);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      "status": "active",
      "message": "Google Apps Script Web App for Estate Autopilots Growth Strategist lead collection is live."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
