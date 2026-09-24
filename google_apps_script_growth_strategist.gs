/**
 * GOOGLE APPS SCRIPT - GROWTH STRATEGIST HIRING (growth-strategist/index.html)
 *
 * Target sheet tab: "New Growth Strategist"
 *
 * Setup Instructions:
 * 1. Open the Google Sheet that contains the "New Growth Strategist" tab.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all existing code in Code.gs with this script and click Save (floppy icon).
 * 4. Click 'Deploy' > 'New deployment'.
 * 5. Select Type: 'Web app' (click the gear icon next to 'Select type' if needed).
 * 6. Set:
 *    - Description: "Growth Strategist Leads Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"  <-- MUST be "Anyone", NOT "Only myself"
 * 7. Click Deploy, Authorize access, and COPY the Web App URL.
 * 8. In growth-strategist/script.js, replace the FORM_ENDPOINT value with your Web App URL.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var SHEET_NAME = "New Growth Strategist";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Create the tab if it does not exist yet
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Auto-setup headers if the sheet is blank
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Timestamp",
        "Full Name",
        "WhatsApp Number",
        "Email",
        "City",
        "Current / Most Recent Role",
        "Performance Marketing Experience",
        "Real Estate Campaign Experience",
        "Monthly Ad Budget Managed",
        "Current CTC",
        "Expected CTC",
        "Notice Period",
        "LinkedIn / Portfolio",
        "UTM Source",
        "UTM Campaign",
        "UTM Content",
        "Ad ID",
        "Page URL",
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
      data["full-name"]   || data.name         || "",
      data["whatsapp"]    || data.phone         || "",
      data.email                                || "",
      data.city                                 || "",
      data["current-role"] || data.current_role || data.current || "",
      data.experience                           || "",
      data["real-estate-experience"]            || "",
      data["monthly-ad-budget"]                 || "",
      data["current-ctc"]  || data.current_ctc  || "",
      data["expected-ctc"] || data.expected_ctc || "",
      data["notice-period"] || data.notice_period || data.notice || "",
      data.portfolio                            || "",
      data.utm_source                           || "",
      data.utm_campaign                         || "",
      data.utm_content                          || "",
      data.ad_id                                || "",
      data.page_url                             || "",
      "Growth Strategist -- Estate Autopilots"
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
      message: "Growth Strategist Lead Webhook is active -- Estate Autopilots"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Robustly parses request parameters from URLSearchParams, JSON, or e.parameter.
 */
function parseRequestData(e) {
  var data = {};
  if (!e) return data;

  // 1. Read e.parameter (GET params / standard form POST)
  if (e.parameter && Object.keys(e.parameter).length > 0) {
    for (var key in e.parameter) {
      data[key] = e.parameter[key];
    }
  }

  // 2. Read e.postData (raw body -- JSON or URL-encoded)
  if (e.postData && e.postData.contents) {
    var raw = e.postData.contents;

    // Try JSON first
    try {
      var json = JSON.parse(raw);
      for (var k in json) {
        data[k] = json[k];
      }
      return data;
    } catch (err) {}

    // Fall back to URL-encoded
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