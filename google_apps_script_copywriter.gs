/**
 * Estate Autopilots — Copywriter Application Lead Automation
 * Google Apps Script for capturing Copywriter applications into a dedicated Google Sheet
 * 
 * Instructions:
 * 1. Open your target Google Sheet for Copywriter applications.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this script.
 * 4. Click 'Deploy' > 'New deployment' (or 'Manage deployments' > Edit > New Version).
 * 5. Select type: 'Web app'.
 * 6. Set Description: "Copywriter Lead Collector".
 * 7. Set 'Execute as': "Me".
 * 8. Set 'Who has access': "Anyone".
 * 9. Click 'Deploy', authorize permissions, and copy the Web App URL.
 * 10. Paste the Web App URL into the form action in copywriter.html.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName("Copywriter") || doc.getActiveSheet();

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      var headers = [
        "Timestamp",
        "Full Name",
        "WhatsApp / Phone",
        "In Office (Kothrud)",
        "Languages",
        "Current Role",
        "Experience Backgrounds",
        "Proof of Work / Link",
        "Currently Reading",
        "Notice Period",
        "Role",
        "Stage",
        "UTM Source",
        "UTM Campaign",
        "UTM Content",
        "Ad ID"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#021f2d")
        .setFontColor("#fbc701");
      sheet.setFrozenRows(1);
    }

    var p = (e && e.parameter) ? e.parameter : {};
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+05:30", "yyyy-MM-dd HH:mm:ss");

    var newRow = [
      timestamp,
      p.name || '',
      p.phone || '',
      p.in_office || '',
      p.languages || '',
      p.current_role || '',
      p.experience || '',
      p.proof_of_work || p.portfolio_link || '',
      p.reading || '',
      p.notice_period || '',
      p.role || 'Copywriter',
      p.stage || 'Step 1 — Details',
      p.utm_source || '',
      p.utm_campaign || '',
      p.utm_content || '',
      p.ad_id || ''
    ];

    sheet.appendRow(newRow);

    return ContentService.createTextOutput(JSON.stringify({ result: "success", row: sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "active", service: "Estate Autopilots Copywriter Collector" }))
    .setMimeType(ContentService.MimeType.JSON);
}
