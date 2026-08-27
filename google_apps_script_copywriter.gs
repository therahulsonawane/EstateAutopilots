/**
 * GOOGLE APPS SCRIPT — COPYWRITER HIRING (copywriter.html)
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new) for Copywriter Leads.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all existing code in Code.gs with this script and save.
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select Type: 'Web app'.
 * 6. Set:
 *    - Description: "Copywriter Leads Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 7. Click Deploy, Authorize access, and copy the Web App URL.
 * 8. In copywriter.html, replace the form action with your Web App URL.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // Auto setup headers if sheet is blank
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp",
        "Full Name",
        "WhatsApp Number",
        "Email",
        "Portfolio / Sample Link",
        "Research & Writing Background",
        "Recent Reads",
        "Marathi Proficiency",
        "Hindi Proficiency",
        "English Proficiency",
        "Writing Sample / Notes",
        "UTM Source",
        "UTM Campaign",
        "UTM Content",
        "Role"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#021F2D").setFontColor("#FBC701");
      sheet.setFrozenRows(1);
    }

    var data = e.parameter;
    var timestamp = new Date();

    sheet.appendRow([
      timestamp,
      data.name || "",
      data.phone || "",
      data.email || "",
      data.portfolio || "",
      data.background || data.experience || "",
      data.reading || "",
      data.marathi || "",
      data.hindi || "",
      data.english || "",
      data.writing_sample || data.notes || "",
      data.utm_source || "",
      data.utm_campaign || "",
      data.utm_content || "",
      data.role || "Copywriter — Estate Autopilots"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", status: 200 }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "Copywriter Lead Webhook is active" }))
    .setMimeType(ContentService.MimeType.JSON);
}
