/**
 * Estate Autopilots — Graphic Designer Lead Automation
 * Google Apps Script for capturing Graphic Designer applications into a dedicated Google Sheet
 * 
 * Instructions:
 * 1. Open your dedicated Google Sheet for Graphic Designer applications.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this script.
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select type: 'Web app'.
 * 6. Set Description: "Graphic Designer Lead Collector".
 * 7. Set 'Execute as': "Me".
 * 8. Set 'Who has access': "Anyone".
 * 9. Click 'Deploy', authorize permissions, and copy the Web App URL.
 * 10. Paste the Web App URL into FORM_ENDPOINT in graphic-designer.html (around line 821).
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for other instances to finish
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    // Uses the 'Graphic Designer' tab if it exists, otherwise writes to the active first tab
    var sheet = doc.getSheetByName("Graphic Designer") || doc.getActiveSheet();

    // Check if header row exists, create if empty
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      var headers = [
        "Timestamp",
        "Full Name",
        "WhatsApp Number",
        "Email",
        "Design Qualification",
        "Years Experience",
        "Portfolio Link",
        "Task Submission Link",
        "Current Role & Company",
        "Notice Period",
        "Daily Tools",
        "Q1 - Design Restraint",
        "Q2 - Weekly Creatives Volume",
        "Current Salary (Monthly)",
        "Expected Salary (Monthly)",
        "UTM Source",
        "UTM Campaign",
        "UTM Content",
        "Ad ID",
        "Page URL"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#021f2d")
        .setFontColor("#fbc701");
      sheet.setFrozenRows(1);
    }

    var p = (e && e.parameter) ? e.parameter : {};
    var params = (e && e.parameters) ? e.parameters : {};
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+05:30", "yyyy-MM-dd HH:mm:ss");

    // Handle multiple tool selections if checkboxes are passed
    var toolsSelected = params.tools ? (Array.isArray(params.tools) ? params.tools.join(', ') : params.tools) : (p.tools || '');

    var newRow = [
      timestamp,
      p.name || '',
      p.phone || '',
      p.email || '',
      p.degree || '',
      p.experience || '',
      p.portfolio || '',
      p.task_link || '',
      p.current_role || '',
      p.notice || '',
      toolsSelected,
      p.q_restraint || '',
      p.q_volume || '',
      p.current_ctc || '',
      p.expected_ctc || '',
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
      "message": "Google Apps Script Web App for Estate Autopilots Graphic Designer lead collection is live."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
