/**
 * GOOGLE APPS SCRIPT — GRAPHIC DESIGNER HIRING (index.html)
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new) for Graphic Designer Leads.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all existing code in Code.gs with this script and save.
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select Type: 'Web app'.
 * 6. Set:
 *    - Description: "Graphic Designer Leads Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 7. Click Deploy, Authorize access, and copy the Web App URL.
 * 8. In index.html, replace the form action with your Web App URL.
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
        "Experience",
        "Portfolio Link",
        "Degree",
        "College / Institute",
        "Tools Used",
        "Current Role & Company",
        "Notice Period",
        "Current CTC",
        "Expected CTC",
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
      data.experience || "",
      data.portfolio || "",
      data.degree || "",
      data.college || "",
      data.tools || "",
      data.current_role || "",
      data.notice || "",
      data.current_ctc || "",
      data.expected_ctc || "",
      data.utm_source || "",
      data.utm_campaign || "",
      data.utm_content || "",
      data.role || "Graphic Designer — Estate Autopilots"
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
    .createTextOutput(JSON.stringify({ status: "Graphic Designer Lead Webhook is active" }))
    .setMimeType(ContentService.MimeType.JSON);
}
