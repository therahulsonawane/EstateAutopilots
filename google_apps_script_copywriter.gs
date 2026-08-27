/**
 * GOOGLE APPS SCRIPT — COPYWRITER HIRING (copywriter.html)
 * 
 * Setup Instructions:
 * 1. Open Google Sheets (https://sheets.new) for Copywriter Leads.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all existing code in Code.gs with this script and save.
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select Type: 'Web app'.
 * 6. Set:
 *    - Description: "Copywriter Leads Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"  <-- MUST be "Anyone"
 * 7. Click Deploy, Authorize access, and copy the Web App URL.
 * 8. In copywriter.html, replace the form action with your Web App URL.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // Auto setup headers if sheet is blank
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp",
        "Full Name",
        "WhatsApp Number",
        "In-Office (Kothrud)",
        "Writing Languages",
        "Current Role / What Doing Now",
        "Research & Writing Experience",
        "Proof of Work / Portfolio",
        "Recent Reads",
        "Notice Period",
        "UTM Source",
        "UTM Campaign",
        "UTM Content",
        "Ad ID",
        "Stage",
        "Role"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#021F2D")
        .setFontColor("#FBC701");
      sheet.setFrozenRows(1);
    }

    var data = parseRequestData(e);
    var timestamp = new Date();

    sheet.appendRow([
      timestamp,
      data.name || "",
      data.phone || "",
      data.in_office || "",
      data.languages || [data.marathi, data.hindi, data.english].filter(Boolean).join(", "),
      data.current_role || data.current || "",
      data.experience || data.background || "",
      data.proof_of_work || data.portfolio || data.writing_sample || data.notes || "",
      data.reading || "",
      data.notice_period || data.notice || "",
      data.utm_source || "",
      data.utm_campaign || "",
      data.utm_content || "",
      data.ad_id || "",
      data.stage || "Step 1 — details",
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
    .createTextOutput(JSON.stringify({
      status: "active",
      message: "Copywriter Lead Webhook is active"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseRequestData(e) {
  var data = {};
  if (!e) return data;

  if (e.parameter && Object.keys(e.parameter).length > 0) {
    for (var key in e.parameter) {
      data[key] = e.parameter[key];
    }
  }

  if (e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    try {
      var json = JSON.parse(raw);
      for (var k in json) {
        data[k] = json[k];
      }
      return data;
    } catch (err) {}

    if (typeof raw === "string" && raw.indexOf("=") !== -1) {
      var pairs = raw.split("&");
      for (var i = 0; i < pairs.length; i++) {
        var p = pairs[i].split("=");
        if (p.length === 2) {
          var paramKey = decodeURIComponent(p[0].replace(/\+/g, " "));
          var paramVal = decodeURIComponent(p[1].replace(/\+/g, " "));
          data[paramKey] = paramVal;
        }
      }
    }
  }

  return data;
}
