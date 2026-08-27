/**
 * Google Apps Script for Estate Autopilots Recruitment Leads
 * Handles both Graphic Designer and Copywriter form submissions.
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Click Extensions > Apps Script
 * 3. Delete any default code in Code.gs, paste this entire script, and save.
 * 4. Click 'Deploy' > 'New deployment'
 * 5. Select type: 'Web app'
 * 6. Set:
 *    - Description: "Estate Autopilots Leads Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 7. Click Deploy, Authorize access, and COPY the Web App URL.
 * 8. Replace YOUR_FORM_ENDPOINT in index.html and copywriter.html with this Web App URL.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = e.parameter;
    var role = data.role || data.job_role || "General Lead";
    
    // Determine target sheet tab based on role
    var sheetName = "All Leads";
    if (role.toLowerCase().indexOf("graphic") !== -1) {
      sheetName = "Graphic Designer";
    } else if (role.toLowerCase().indexOf("copywriter") !== -1) {
      sheetName = "Copywriter";
    }

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      setupHeaders(sheet, sheetName);
    } else if (sheet.getLastRow() === 0) {
      setupHeaders(sheet, sheetName);
    }

    var timestamp = new Date();

    if (sheetName === "Graphic Designer") {
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
        role
      ]);
    } else if (sheetName === "Copywriter") {
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
        role
      ]);
    } else {
      // Fallback: append all parameters as JSON string
      sheet.appendRow([timestamp, JSON.stringify(data), role]);
    }

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
    .createTextOutput(JSON.stringify({ status: "Estate Autopilots Lead Webhook is active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupHeaders(sheet, type) {
  var headers = [];
  if (type === "Graphic Designer") {
    headers = [
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
  } else if (type === "Copywriter") {
    headers = [
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
  } else {
    headers = ["Timestamp", "Data", "Role"];
  }

  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#021F2D").setFontColor("#FBC701");
  sheet.setFrozenRows(1);
}
