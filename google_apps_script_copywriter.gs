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

    // Default standard headers if sheet is completely empty
    var defaultHeaders = [
      "Timestamp",
      "Full Name",
      "WhatsApp / Phone",
      "Email",
      "City / Location",
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

    if (lastRow === 0 || lastCol === 0) {
      sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
      sheet.getRange(1, 1, 1, defaultHeaders.length)
        .setFontWeight("bold")
        .setBackground("#021f2d")
        .setFontColor("#fbc701");
      sheet.setFrozenRows(1);
      lastCol = defaultHeaders.length;
      lastRow = 1;
    }

    var p = (e && e.parameter) ? e.parameter : {};
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+05:30", "yyyy-MM-dd HH:mm:ss");

    var data = {
      timestamp: timestamp,
      name: p.name || '',
      phone: p.phone || '',
      email: p.email || '',
      city: p.city || p.location || '',
      in_office: p.in_office || '',
      languages: p.languages || '',
      current_role: p.current_role || p.current || '',
      experience: p.experience || '',
      proof_of_work: p.proof_of_work || p.portfolio_link || p.proof || '',
      reading: p.reading || '',
      notice_period: p.notice_period || p.notice || '',
      role: p.role || 'Copywriter',
      stage: p.stage || 'Step 1 — Details',
      utm_source: p.utm_source || '',
      utm_campaign: p.utm_campaign || '',
      utm_content: p.utm_content || '',
      ad_id: p.ad_id || ''
    };

    // Read the current headers from row 1 of the sheet
    var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var newRow = [];

    for (var i = 0; i < currentHeaders.length; i++) {
      var h = String(currentHeaders[i] || '').toLowerCase().trim();
      if (!h) {
        newRow.push('');
      } else if (h.indexOf('time') !== -1 || h.indexOf('date') !== -1) {
        newRow.push(data.timestamp);
      } else if (h.indexOf('name') !== -1) {
        newRow.push(data.name);
      } else if (h.indexOf('whatsapp') !== -1 || h.indexOf('phone') !== -1 || h.indexOf('mobile') !== -1) {
        newRow.push(data.phone);
      } else if (h.indexOf('email') !== -1 || h.indexOf('mail') !== -1) {
        newRow.push(data.email);
      } else if (h.indexOf('city') !== -1 || h.indexOf('location') !== -1) {
        newRow.push(data.city);
      } else if (h.indexOf('office') !== -1 || h.indexOf('kothrud') !== -1) {
        newRow.push(data.in_office);
      } else if (h.indexOf('lang') !== -1) {
        newRow.push(data.languages);
      } else if (h.indexOf('current') !== -1 || h.indexOf('doing') !== -1) {
        newRow.push(data.current_role);
      } else if (h.indexOf('exp') !== -1 || h.indexOf('background') !== -1) {
        newRow.push(data.experience);
      } else if (h.indexOf('proof') !== -1 || h.indexOf('portfolio') !== -1 || (h.indexOf('work') !== -1 && h.indexOf('office') === -1) || h.indexOf('link') !== -1) {
        newRow.push(data.proof_of_work);
      } else if (h.indexOf('read') !== -1 || h.indexOf('book') !== -1) {
        newRow.push(data.reading);
      } else if (h.indexOf('notice') !== -1) {
        newRow.push(data.notice_period);
      } else if (h.indexOf('stage') !== -1) {
        newRow.push(data.stage);
      } else if (h.indexOf('role') !== -1) {
        newRow.push(data.role);
      } else if (h.indexOf('utm_source') !== -1 || h === 'source') {
        newRow.push(data.utm_source);
      } else if (h.indexOf('utm_campaign') !== -1 || h === 'campaign') {
        newRow.push(data.utm_campaign);
      } else if (h.indexOf('utm_content') !== -1 || h === 'content') {
        newRow.push(data.utm_content);
      } else if (h.indexOf('ad_id') !== -1 || h.indexOf('ad id') !== -1) {
        newRow.push(data.ad_id);
      } else {
        newRow.push(p[currentHeaders[i]] || '');
      }
    }

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
