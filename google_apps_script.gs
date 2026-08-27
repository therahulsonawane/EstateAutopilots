/**
 * GOOGLE APPS SCRIPT — UNIVERSAL LEADS WEBHOOK FOR ESTATE AUTOPILOTS
 * Handles Graphic Designer, Copywriter, and Growth Strategist lead submissions.
 * 
 * Setup Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Click Extensions > Apps Script
 * 3. Delete any code in Code.gs, paste this entire file, and click Save (Floppy icon).
 * 4. Click 'Deploy' > 'New deployment'
 * 5. Select type: 'Web app' (click the gear icon next to 'Select type' if needed)
 * 6. Set the following EXACT settings:
 *    - Description: "Estate Autopilots Leads Webhook v2"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone"  <-- CRITICAL: Must be "Anyone", NOT "Only myself"
 * 7. Click Deploy, Authorize access, and COPY the Web App URL.
 * 8. In index.html, copywriter.html, and growth-strategist.html, ensure the form action
 *    or FORM_ENDPOINT matches this Web App URL.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = parseRequestData(e);
    var role = (data.role || data.job_role || data["form-name"] || "").toLowerCase();

    // Determine target sheet tab
    var sheetName = "All Leads";
    if (role.indexOf("graphic") !== -1 || data.tools || data.degree) {
      sheetName = "Graphic Designer";
    } else if (role.indexOf("copywriter") !== -1 || data.in_office || data.languages || data.proof_of_work) {
      sheetName = "Copywriter";
    } else if (role.indexOf("growth") !== -1 || role.indexOf("strategist") !== -1 || data.doclink) {
      sheetName = "Growth Strategist";
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
        data.current_role || data.current || "",
        data.notice || data.notice_period || "",
        data.current_ctc || "",
        data.expected_ctc || "",
        data.utm_source || "",
        data.utm_campaign || "",
        data.utm_content || "",
        data.ad_id || "",
        data.role || "Graphic Designer — Estate Autopilots"
      ]);
    } else if (sheetName === "Copywriter") {
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
    } else if (sheetName === "Growth Strategist") {
      sheet.appendRow([
        timestamp,
        data.name || "",
        data.phone || "",
        data.email || "",
        data.experience || "",
        data.current || data.current_role || "",
        data.link || data.portfolio || "",
        data.doclink || "",
        data.q3 || "",
        data.q4 || "",
        data.utm_source || "",
        data.utm_campaign || "",
        data.utm_content || "",
        data.ad_id || "",
        data.page_url || "",
        data.role || "Growth Strategist — Estate Autopilots"
      ]);
    } else {
      // General Fallback
      sheet.appendRow([timestamp, JSON.stringify(data), data.role || "General Lead"]);
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
    .createTextOutput(JSON.stringify({
      status: "active",
      message: "Estate Autopilots Universal Leads Webhook is live."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Robustly parses request parameters from URLSearchParams, JSON, or e.parameter
 */
function parseRequestData(e) {
  var data = {};
  if (!e) return data;

  // 1. Check e.parameter
  if (e.parameter && Object.keys(e.parameter).length > 0) {
    for (var key in e.parameter) {
      data[key] = e.parameter[key];
    }
  }

  // 2. Check e.postData
  if (e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    // Try JSON
    try {
      var json = JSON.parse(raw);
      for (var k in json) {
        data[k] = json[k];
      }
      return data;
    } catch (err) {}

    // Try urlencoded
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
      "Current Salary",
      "Expected Salary",
      "UTM Source",
      "UTM Campaign",
      "UTM Content",
      "Ad ID",
      "Role"
    ];
  } else if (type === "Copywriter") {
    headers = [
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
  } else if (type === "Growth Strategist") {
    headers = [
      "Timestamp",
      "Full Name",
      "Phone / WhatsApp",
      "Email",
      "Experience (Years Running Ads)",
      "Current Role & Company",
      "Portfolio / LinkedIn / CV",
      "Task Google Doc Link",
      "Senior Pushback (Q3)",
      "Additional Notes (Q4)",
      "UTM Source",
      "UTM Campaign",
      "UTM Content",
      "Ad ID",
      "Page URL",
      "Role"
    ];
  } else {
    headers = ["Timestamp", "Raw Data", "Role"];
  }

  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#021F2D")
    .setFontColor("#FBC701");
  sheet.setFrozenRows(1);
}
