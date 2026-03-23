{
  "nodes": [
    {
      "parameters": {},
      "id": "db294973-a554-48e8-b94a-19e69ef9f8d6",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [
        -896,
        48
      ]
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "triggerAtHour": 6
            }
          ]
        }
      },
      "id": "6dbe27ec-fee3-4252-939f-d8c689a3c851",
      "name": "Cron Trigger – 7am Daily",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [
        -896,
        272
      ],
      "settings": {
        "timezone": "America/New_York"
      }
    },
    {
      "parameters": {
        "operation": "search",
        "base": {
          "__rl": true,
          "value": "appoiVoPb5XOkLoZ5",
          "mode": "list",
          "cachedResultName": "Boulder",
          "cachedResultUrl": "https://airtable.com/appoiVoPb5XOkLoZ5"
        },
        "table": "Daily Site Report",
        "options": {}
      },
      "id": "02666600-0c05-4db0-aab6-d822232f869f",
      "name": "Airtable – List Records",
      "type": "n8n-nodes-base.airtable",
      "typeVersion": 2.1,
      "position": [
        -592,
        144
      ],
      "credentials": {
        "airtableTokenApi": {
          "id": "OjPu7vaCRW7TVc7s",
          "name": "AirTable --> n8n Personal Access Token API"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// NEW YORK SAFE YESTERDAY DATE\nconst now = new Date(\n  new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })\n);\nnow.setDate(now.getDate() - 1);\nconst reportDate = now.toLocaleDateString('en-CA', {\n  timeZone: 'America/New_York'\n});\n\nconsole.log('Looking for date:', reportDate); // Check this in n8n console\n\nconst airtableItems = $input.all();\n\nconst filtered = airtableItems.filter(item => {\n  const fields = item.json.fields || item.json;\n\n  let dateVal = fields['Date'] || '';\n  if (typeof dateVal === 'string') {\n    dateVal = dateVal.substring(0, 10);\n  }\n\n  const isYesterday = dateVal === reportDate;\n  const isManualFlag = fields['Generate Daily Report'] === true;\n\n  const reportStatus = fields['Report Status'] || '';\n  const projectCode = fields['Project Code'] || '';\n\n  // DEBUG: log each record's decision\n  console.log(`Record date: ${dateVal} | isYesterday: ${isYesterday} | status: ${reportStatus} | projectCode: ${JSON.stringify(projectCode)}`);\n\n  if (reportStatus === 'Sent' || reportStatus === 'Failed') return false;\n  if (Array.isArray(projectCode) && projectCode.length === 0) return false;\n  if (!projectCode) return false;\n\n  return isYesterday || isManualFlag;\n});\n\nfunction formatDateLong(dateStr) {\n  const months = ['January','February','March','April','May','June',\n                  'July','August','September','October','November','December'];\n  const parts = dateStr.split('-');\n  if (parts.length !== 3) return dateStr;\n  return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];\n}\n\nfunction formatDateShort(dateStr) {\n  const parts = dateStr.split('-');\n  if (parts.length !== 3) return dateStr;\n  return parts[1] + '/' + parts[2] + '/' + parts[0].substring(2);\n}\n\nif (filtered.length === 0) {\n  return [{\n    json: {\n      _noRecords: true,\n      reportDate: formatDateLong(reportDate),\n      reportDateShort: formatDateShort(reportDate),\n      adminEmail: 'uma@boulderconstruction.com'\n    }\n  }];\n}\n\nreturn filtered.map(item => {\n  const f = item.json.fields || item.json;\n  const recordId = item.json.id || '';\n\n  let photos = [];\n  const totalPhotos = Array.isArray(f['Photos']) ? f['Photos'].length : 0;\n  if (Array.isArray(f['Photos'])) {\n    photos = f['Photos'].map(p => ({\n      url: p?.thumbnails?.large?.url || p?.url || '',\n      filename: p?.filename || 'photo.jpg'\n    }));\n  }\n\n  const receiptsCount = Array.isArray(f['Receipts']) ? f['Receipts'].length : 0;\n\n  let projectName = Array.isArray(f['Project Name'])\n    ? f['Project Name'].join(', ')\n    : (f['Project Name'] || '');\n\n  let projectCode = Array.isArray(f['Project Code'])\n    ? (f['Project Code'][0] || '')\n    : (f['Project Code'] || '');\n\n  let emailTo = Array.isArray(f['Email To'])\n    ? (f['Email To'][0] || '')\n    : (f['Email To'] || '');\n\n  let emailAddressedTo = Array.isArray(f['Email Addressed To'])\n    ? (f['Email Addressed To'][0] || '')\n    : (f['Email Addressed To'] || '');\n\n  let emailCC = Array.isArray(f['Email CC'])\n    ? f['Email CC'].join(', ')\n    : (f['Email CC'] || '');\n\n  let recDate = f['Date']\n    ? String(f['Date']).substring(0, 10)\n    : reportDate;\n\n  return {\n    json: {\n      recordId,\n      reportDate: formatDateLong(recDate),\n      reportDateShort: formatDateShort(recDate),\n      projectName,\n      projectCode,\n      emailTo: emailTo.trim(),\n      emailAddressedTo: emailAddressedTo.trim(),\n      emailCC: emailCC.trim(),\n      weather: f['Weather'] || '',\n      manpower: f['Manpower'] || '',\n      workInProgress: f['Work in Progress'] || '',\n      workCompletedToday: f['Work Completed Today'] || '',\n      workPlannedTomorrow: f['Work Planned Tomorrow'] || '',\n      deliveries: f['Deliveries'] || '',\n      issuesDelays: f['Issues / Delays'] || '',\n      inspections: f['Inspection Today/Upcoming with Status'] || '',\n      notes: f['Notes'] || '',\n      rfis: f['RFIs'] || '',\n      changeOrders: f['Change Orders'] || '',\n      requestsNotices: f['Requests & Notices '] || '',\n      receiptsCount,\n      photos,\n      totalPhotos,\n      _noRecords: false\n    }\n  };\n});"
      },
      "id": "72fdd174-93ca-4aa0-ba97-7cfe393ac5dd",
      "name": "Code A – Normalize & Filter",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -416,
        144
      ]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "cond-no-records",
              "leftValue": "={{ $json._noRecords }}",
              "rightValue": true,
              "operator": {
                "type": "boolean",
                "operation": "equals",
                "singleValue": true
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "892373f0-efaf-491f-9d9e-0f1e1990f3cf",
      "name": "IF No Records",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        -224,
        144
      ]
    },
    {
      "parameters": {
        "toRecipients": "uma@boulderconstruction.com",
        "subject": "=No Daily Site Report records found – {{ $json.reportDate }}",
        "additionalFields": {}
      },
      "id": "eab4a70f-5f44-42a2-b1c4-1cc82c4e16c7",
      "name": "Outlook – No Records Email",
      "type": "n8n-nodes-base.microsoftOutlook",
      "typeVersion": 2,
      "position": [
        0,
        0
      ],
      "webhookId": "6a91130e-a9ed-487b-9452-d0e4e6855969",
      "credentials": {
        "microsoftOutlookOAuth2Api": {
          "id": "CIxWbJQqckSp2IQf",
          "name": "Uma's Outlook Account"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "const allInputs = $input.all();\nconst allCodeA = $('Code A – Normalize & Filter').all();\n\nreturn allInputs.map((item, index) => {\n  const claudeResp = item.json || {};\n  const batchItem = (allCodeA[index] && allCodeA[index].json) ? allCodeA[index].json : {};\n\n  let polished = {};\n  try {\n    const rawText = claudeResp.content[0].text;\n    polished = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());\n  } catch (e) {\n    polished = {\n      weather: batchItem.weather || '',\n      manpower: batchItem.manpower || '',\n      workInProgress: batchItem.workInProgress || '',\n      workCompletedToday: batchItem.workCompletedToday || '',\n      workPlannedTomorrow: batchItem.workPlannedTomorrow || '',\n      deliveries: batchItem.deliveries || '',\n      issuesDelays: batchItem.issuesDelays || '',\n      inspections: batchItem.inspections || '',\n      notes: batchItem.notes || '',\n      rfis: batchItem.rfis || '',\n      changeOrders: batchItem.changeOrders || '',\n      requestsNotices: batchItem.requestsNotices || '',\n      overallSummary: ''\n    };\n  }\n\n  function safeStr(val) {\n    if (val === null || val === undefined) return '';\n    if (typeof val === 'object') return JSON.stringify(val);\n    return String(val);\n  }\n  function hasContent(val) {\n    var s = safeStr(val).trim();\n    return s.length > 0 && s !== '[]' && s !== '{}' && s !== 'null' && s !== 'undefined' && s !== 'None' && s !== 'N/A';\n  }\n  function toParagraph(val) {\n    if (!hasContent(val)) return '';\n    var s = safeStr(val).trim();\n    var lines = s.split(/\\n/).map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });\n    return lines.map(function(l) { return '<p>' + l + '</p>'; }).join('');\n  }\n\n  var sections = '';\n  var fieldMap = [\n    { key: 'weather', label: 'Weather' },\n    { key: 'manpower', label: 'Manpower' },\n    { key: 'workCompletedToday', label: 'Work Completed Today' },\n    { key: 'workInProgress', label: 'Work in Progress' },\n    { key: 'workPlannedTomorrow', label: 'Work Planned Tomorrow' },\n    { key: 'deliveries', label: 'Deliveries' },\n    { key: 'inspections', label: 'Inspections' },\n    { key: 'issuesDelays', label: 'Issues & Delays' },\n    { key: 'rfis', label: 'RFIs' },\n    { key: 'changeOrders', label: 'Change Orders' },\n    { key: 'requestsNotices', label: 'Requests & Notices' },\n    { key: 'notes', label: 'Notes' }\n  ];\n\n  for (var i = 0; i < fieldMap.length; i++) {\n    var f = fieldMap[i];\n    var val = polished[f.key];\n    if (hasContent(val)) {\n      sections += '<div class=\"sec\"><div class=\"label\">' + f.label + '</div>' + toParagraph(val) + '</div>';\n    }\n  }\n\n  if (batchItem.receiptsCount > 0) {\n    sections += '<div class=\"sec\"><div class=\"label\">Receipts</div><p>' + batchItem.receiptsCount + ' receipt(s) uploaded</p></div>';\n  }\n\n  var SECTION_SUMMARY = '';\n  if (hasContent(polished.overallSummary)) {\n    SECTION_SUMMARY = '<div class=\"summary\"><div class=\"summary-tag\">AI Summary</div>' + toParagraph(polished.overallSummary) + '</div>';\n  }\n\n  // ALL photos — no limit\n  var SECTION_PHOTOS = '';\n  var photos = Array.isArray(batchItem.photos) ? batchItem.photos : [];\n  if (photos.length > 0) {\n    var cells = '';\n    for (var j = 0; j < photos.length; j++) {\n      var p = photos[j];\n      cells += '<div class=\"ph\"><img src=\"' + (p.url || '') + '\" /><span>' + (p.filename || '') + '</span></div>';\n    }\n    SECTION_PHOTOS = '<div class=\"photo-page\"><div class=\"label\">Site Photos</div><div class=\"pgrid\">' + cells + '</div></div>';\n  }\n\n  var projectName = safeStr(batchItem.projectName) || 'Project';\n  var reportDate = safeStr(batchItem.reportDate);\n\n  var html = `<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n<style>\n  @page { size: letter; margin: 40px 52px 48px 52px; }\n  * { box-sizing: border-box; margin: 0; padding: 0; }\n  body {\n    font-family: \"Trebuchet MS\", \"Lucida Grande\", Arial, sans-serif;\n    color: #2B3D4F;\n    font-size: 10pt;\n    line-height: 1.65;\n    background: #fff;\n  }\n  .page {\n    max-width: 720px;\n    margin: 0 auto;\n    padding: 28px 0 20px 0;\n  }\n\n  .hdr { margin-bottom: 32px; }\n  .brand {\n    font-size: 10pt;\n    font-weight: 800;\n    color: #D4772C;\n    letter-spacing: 3px;\n    text-transform: uppercase;\n    margin-bottom: 6px;\n  }\n  .title {\n    font-size: 22pt;\n    font-weight: 700;\n    color: #2B3D4F;\n    line-height: 1.15;\n    margin-bottom: 4px;\n  }\n  .project-date {\n    font-size: 11pt;\n    color: #D4772C;\n    font-weight: 600;\n    margin-bottom: 12px;\n  }\n  .accent-bar {\n    width: 40px;\n    height: 3px;\n    background: #D4772C;\n    border-radius: 2px;\n  }\n\n  .sec { margin-bottom: 22px; }\n  .label {\n    font-size: 10pt;\n    font-weight: 700;\n    color: #D4772C;\n    margin-bottom: 5px;\n  }\n\n  p {\n    font-size: 10pt;\n    color: #445566;\n    margin: 0 0 5px 0;\n    line-height: 1.65;\n  }\n\n  .summary {\n    margin: 4px 0 26px 0;\n    padding: 14px 18px;\n    background: #FBF6F1;\n    border-left: 3px solid #D4772C;\n    border-radius: 0 6px 6px 0;\n  }\n  .summary-tag {\n    font-size: 8pt;\n    font-weight: 700;\n    color: #D4772C;\n    text-transform: uppercase;\n    letter-spacing: 1.5px;\n    margin-bottom: 6px;\n  }\n  .summary p {\n    color: #2B3D4F;\n    font-size: 10pt;\n    margin: 0;\n    line-height: 1.7;\n  }\n\n  .photo-page {\n    \n    padding-top: 20px;\n  }\n  .pgrid {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 8px;\n  }\n  .ph { width: calc(50% - 4px); margin-bottom: 4px; }\n  .ph img {\n    width: 100%;\n    height: 220px;\n    object-fit: cover;\n    border-radius: 4px;\n    display: block;\n  }\n  .ph span {\n    display: block;\n    font-size: 7pt;\n    color: #B8BEC6;\n    margin-top: 3px;\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n  }\n\n  .foot {\n    margin-top: 32px;\n    display: flex;\n    justify-content: space-between;\n    font-size: 7.5pt;\n    color: #C8CCD2;\n  }\n</style>\n</head>\n<body>\n<div class=\"page\">\n\n  <div class=\"hdr\">\n    <div class=\"brand\">Boulder</div>\n    <div class=\"title\">Daily Progress Report</div>\n    <div class=\"project-date\">${projectName} | ${reportDate}</div>\n    <div class=\"accent-bar\"></div>\n  </div>\n\n  ${sections}\n  ${SECTION_SUMMARY}\n  ${SECTION_PHOTOS}\n\n  <div class=\"foot\">\n    <span>Boulder Construction</span>\n    <span>${projectName} &middot; ${reportDate}</span>\n  </div>\n\n</div>\n</body>\n</html>`;\n\n  return {\n    json: {\n      recordId: safeStr(batchItem.recordId),\n      pmName: safeStr(batchItem.emailAddressedTo) || safeStr(batchItem.pmName),\n      pmEmail: safeStr(batchItem.emailTo) || safeStr(batchItem.pmEmail),\n      reportDate: reportDate,\n      reportDateShort: safeStr(batchItem.reportDateShort),\n      projectCode: safeStr(batchItem.projectCode),\n      emailTo: safeStr(batchItem.emailTo),\n      emailAddressedTo: safeStr(batchItem.emailAddressedTo),\n      emailCC: safeStr(batchItem.emailCC),\n      reportDateShort: safeStr(batchItem.reportDateShort),\n      projectName: projectName,\n      projectCode: safeStr(batchItem.projectCode),\n      html: html\n    }\n  };\n});"
      },
      "id": "f69c2b49-f9ad-4704-9ddd-1e897ffeb1ce",
      "name": "Code B – Build HTML",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        224,
        272
      ]
    },
    {
      "parameters": {
        "jsCode": "// Code C – convert HTML to binary for Gotenberg (all items)\nconst items = $input.all();\n\nreturn items.map(item => {\n  const htmlString = item.json.html;\n  const binaryData = Buffer.from(htmlString, 'utf-8');\n\n  return {\n    json: {\n      recordId: item.json.recordId,\n      pmName: item.json.pmName,\n      pmEmail: item.json.pmEmail,\n      reportDate: item.json.reportDate,\n      reportDateShort: item.json.reportDateShort,\n      projectName: item.json.projectName,\n      projectCode: item.json.projectCode,\n      emailTo: item.json.emailTo,\n      emailAddressedTo: item.json.emailAddressedTo,\n      emailCC: item.json.emailCC\n    },\n    binary: {\n      'index.html': {\n        data: binaryData.toString('base64'),\n        mimeType: 'text/html',\n        fileName: 'index.html',\n        fileExtension: 'html'\n      }\n    }\n  };\n});"
      },
      "id": "8c489a49-db68-4a14-9218-3a83b33cd46c",
      "name": "Code C – HTML to Binary",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        448,
        272
      ]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://167.99.53.92/forms/chromium/convert/html",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-Auth",
              "value": "BoulderPDF_9c2bA7_ChangeMe_2026"
            }
          ]
        },
        "sendBody": true,
        "contentType": "multipart-form-data",
        "bodyParameters": {
          "parameters": [
            {
              "parameterType": "formBinaryData",
              "name": "index.html",
              "inputDataFieldName": "index.html"
            }
          ]
        },
        "options": {
          "batching": {
            "batch": {
              "batchSize": 1
            }
          },
          "response": {
            "response": {
              "responseFormat": "file",
              "outputPropertyName": "pdf"
            }
          },
          "timeout": 120000
        }
      },
      "id": "6ec74a6f-477e-43c0-b5d1-b197f4a9ee19",
      "name": "HTTP – Gotenberg PDF",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        672,
        272
      ]
    },
    {
      "parameters": {
        "jsCode": "const items = $input.all();\nconst codeC = $('Code C – HTML to Binary').all();\n\nreturn items.map((item, idx) => {\n  const c = (codeC[idx] && codeC[idx].json) ? codeC[idx].json : {};\n  const recordId = c.recordId || item.json.recordId || '';\n  const projectName = c.projectName || item.json.projectName || 'Project';\n  const reportDate = c.reportDate || item.json.reportDate || 'unknown';\n  const reportDateShort = c.reportDateShort || item.json.reportDateShort || '';\n  const projectCode = c.projectCode || item.json.projectCode || '';\n  const emailTo = c.emailTo || item.json.emailTo || 'uma@boulderconstruction.com';\n  const emailAddressedTo = c.emailAddressedTo || item.json.emailAddressedTo || '';\n  const emailCC = c.emailCC || item.json.emailCC || '';\n\n  // Subject & filename: Daily Report – Candlewood Suites Jackson 02/25/26\n  // Format date as YYYY MM DD for filename sorting\n  const dateParts = reportDateShort.split('/');\n  const fileDate = dateParts.length === 3 ? '20' + dateParts[2] + ' ' + dateParts[0] + ' ' + dateParts[1] : reportDateShort;\n  const reportLabel = `Daily Report \\u2013 ${projectName} ${reportDateShort}`;\n  const fileLabelDate = `${fileDate} - Daily Report - ${projectName}`;\n  const safeFileName = fileLabelDate.replace(/[\\u2013]/g, '-').replace(/[^a-zA-Z0-9\\s\\-\\.]/g, '').trim() + '.pdf';\n\n  const firstName = 'Team';\n\n  const emailBody = `<div style=\"font-family: 'Trebuchet MS', 'Lucida Grande', Arial, sans-serif; font-size: 10pt; color: #000000; line-height: 1.6;\">\n<p style=\"margin: 0 0 12px 0;\">Hi ${firstName},</p>\n\n<p style=\"margin: 0 0 12px 0;\">Please find attached the Daily Progress Report for ${projectName}, dated ${reportDate}.</p>\n\n<p style=\"margin: 0 0 20px 0;\">Thanks!</p>\n\n<p style=\"margin: 0;\">Uma Patel</p>\n<p style=\"margin: 0;\">Boulder Construction</p>\n<p style=\"margin: 0;\">T: (214) 471-3657</p>\n<p style=\"margin: 0;\"><a href=\"mailto:uma@boulderconstruction.com\" style=\"color: #000000;\">uma@boulderconstruction.com</a></p>\n</div>`;\n\n  const pdfBinary = item.binary?.pdf;\n  if (pdfBinary) {\n    pdfBinary.fileName = safeFileName;\n    pdfBinary.fileExtension = 'pdf';\n  }\n\n  return {\n    json: {\n      recordId,\n      reportDate,\n      reportDateShort,\n      projectName,\n      projectCode,\n      pdfFileName: safeFileName,\n      to: emailTo,\n      cc: emailCC,\n      subject: reportLabel,\n      body: emailBody\n    },\n    binary: { pdf: pdfBinary }\n  };\n});"
      },
      "id": "6bfc4b50-c883-494d-b22e-806e5dbf182f",
      "name": "Code – Rename PDF",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        880,
        272
      ]
    },
    {
      "parameters": {},
      "id": "240db767-9e3e-4977-9cc6-72250d53ed05",
      "name": "No Operation (end)",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [
        224,
        0
      ]
    },
    {
      "parameters": {
        "modelId": {
          "__rl": true,
          "value": "claude-haiku-4-5-20251001",
          "mode": "list",
          "cachedResultName": "claude-haiku-4-5-20251001"
        },
        "messages": {
          "values": [
            {
              "content": "=You are a construction report editor for Boulder Construction. You receive raw daily site report data. Your ONLY job is to write an overall summary.\n\nDO NOT modify, rewrite, or clean up any of the individual field data. Return every field EXACTLY as provided — character for character.\n\nWrite a thorough \"overallSummary\" (3-6 sentences) that:\n- Opens with the most significant work accomplished that day\n- Mentions key trades active on site and what they progressed\n- Notes any inspections, deliveries, or milestones\n- Flags any delays or issues if present\n- Closes with what's coming next or the overall project trajectory\n- Uses professional but approachable tone, past tense for completed work\n\nReturn valid JSON with exactly these keys (pass through field values unchanged):\nweather, manpower, workInProgress, workCompletedToday, workPlannedTomorrow, deliveries, issuesDelays, inspections, notes, rfis, changeOrders, requestsNotices, overallSummary\n\nRaw data:\nWeather: {{ $json.weather }}\nManpower: {{ $json.manpower }}\nWork in Progress: {{ $json.workInProgress }}\nWork Completed Today: {{ $json.workCompletedToday }}\nWork Planned Tomorrow: {{ $json.workPlannedTomorrow }}\nDeliveries: {{ $json.deliveries }}\nIssues/Delays: {{ $json.issuesDelays }}\nInspections: {{ $json.inspections }}\nNotes: {{ $json.notes }}\nRFIs: {{ $json.rfis }}\nChange Orders: {{ $json.changeOrders }}\nRequests & Notices: {{ $json.requestsNotices }}\n\nOutput ONLY valid JSON, no markdown fences."
            }
          ]
        },
        "simplify": false,
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.anthropic",
      "typeVersion": 1,
      "position": [
        -96,
        272
      ],
      "id": "9834742f-49a3-4b5f-8420-03855447f64f",
      "name": "Message a model",
      "credentials": {
        "anthropicApi": {
          "id": "YciGcVwNOHMUi9ZN",
          "name": "Uma Anthropic"
        }
      }
    },
    {
      "parameters": {
        "operation": "update",
        "base": {
          "__rl": true,
          "value": "appoiVoPb5XOkLoZ5",
          "mode": "list",
          "cachedResultName": "Boulder",
          "cachedResultUrl": "https://airtable.com/appoiVoPb5XOkLoZ5"
        },
        "table": {
          "__rl": true,
          "value": "tblaakOsOWUS2Tv2S",
          "mode": "list",
          "cachedResultName": "Daily Site Report",
          "cachedResultUrl": "https://airtable.com/appoiVoPb5XOkLoZ5/tblaakOsOWUS2Tv2S"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "id": "={{ $('Code – Restore Filename').item.json.recordId }}",
            "Report Status": "Sent"
          },
          "matchingColumns": [
            "id"
          ],
          "schema": [
            {
              "id": "id",
              "displayName": "id",
              "required": false,
              "defaultMatch": true,
              "display": true,
              "type": "string",
              "readOnly": true,
              "removed": false
            },
            {
              "id": "Date",
              "displayName": "Date",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "dateTime",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Submitted By",
              "displayName": "Submitted By",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "array",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Projects",
              "displayName": "Projects",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "array",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Photos",
              "displayName": "Photos",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "array",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Project Code",
              "displayName": "Project Code",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": true,
              "removed": true
            },
            {
              "id": "Manpower",
              "displayName": "Manpower",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Work in Progress",
              "displayName": "Work in Progress",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Work Completed Today",
              "displayName": "Work Completed Today",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Work Planned Tomorrow",
              "displayName": "Work Planned Tomorrow",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Deliveries",
              "displayName": "Deliveries",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Issues / Delays",
              "displayName": "Issues / Delays",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Inspection Today/Upcoming with Status",
              "displayName": "Inspection Today/Upcoming with Status",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Weather",
              "displayName": "Weather",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Notes",
              "displayName": "Notes",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "RFIs",
              "displayName": "RFIs",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Change Orders",
              "displayName": "Change Orders",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Requests & Notices ",
              "displayName": "Requests & Notices ",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Receipts",
              "displayName": "Receipts",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "array",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Receipts Context",
              "displayName": "Receipts Context",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Include in Weekly Report",
              "displayName": "Include in Weekly Report",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "boolean",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Email To",
              "displayName": "Email To",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": true,
              "removed": true
            },
            {
              "id": "Email Addressed To",
              "displayName": "Email Addressed To",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": true,
              "removed": true
            },
            {
              "id": "Generate Daily Report",
              "displayName": "Generate Daily Report",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "boolean",
              "readOnly": false,
              "removed": true
            },
            {
              "id": "Project Name",
              "displayName": "Project Name",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": true,
              "removed": true
            },
            {
              "id": "Email CC",
              "displayName": "Email CC",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "string",
              "readOnly": true,
              "removed": true
            },
            {
              "id": "Report Status",
              "displayName": "Report Status",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "options",
              "options": [
                {
                  "name": "Pending",
                  "value": "Pending"
                },
                {
                  "name": "Sent",
                  "value": "Sent"
                },
                {
                  "name": "Failed",
                  "value": "Failed"
                },
                {
                  "name": "Skipper",
                  "value": "Skipper"
                }
              ],
              "readOnly": false,
              "removed": false
            },
            {
              "id": "Report Sent At",
              "displayName": "Report Sent At",
              "required": false,
              "defaultMatch": false,
              "canBeUsedToMatch": true,
              "display": true,
              "type": "dateTime",
              "readOnly": false,
              "removed": true
            }
          ],
          "attemptToConvertTypes": false,
          "convertFieldsToString": false
        },
        "options": {}
      },
      "id": "7f9a2816-41f2-4d54-92c8-efc88c011a0e",
      "name": "Airtable – Update Status",
      "type": "n8n-nodes-base.airtable",
      "typeVersion": 2.1,
      "position": [
        1776,
        272
      ],
      "credentials": {
        "airtableTokenApi": {
          "id": "OjPu7vaCRW7TVc7s",
          "name": "AirTable --> n8n Personal Access Token API"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://167.99.53.92:3001",
        "sendBody": true,
        "contentType": "binaryData",
        "inputDataFieldName": "pdf",
        "options": {
          "response": {
            "response": {
              "responseFormat": "file",
              "outputPropertyName": "pdf"
            }
          },
          "timeout": 300000
        }
      },
      "id": "88f22e71-5f82-4ec6-958e-59065ba913c6",
      "name": "HTTP – Compress PDF",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        1104,
        272
      ]
    },
    {
      "parameters": {
        "jsCode": "const items = $input.all();\nconst renameItems = $('Code \\u2013 Rename PDF').all();\n\nreturn items.map((item, index) => {\n  const originalName = renameItems[index]?.binary?.pdf?.fileName || 'report.pdf';\n  if (item.binary?.pdf) {\n    item.binary.pdf.fileName = originalName;\n  }\n  // Pass through json data from Rename PDF node\n  item.json = { ...renameItems[index]?.json, ...item.json };\n  return item;\n});"
      },
      "id": "7fc146be-b49e-4829-a0f4-a51f2f7ea09d",
      "name": "Code – Restore Filename",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1328,
        272
      ]
    },
    {
      "parameters": {
        "toRecipients": "={{ $json.to }}",
        "subject": "={{ $json.subject }}",
        "bodyContent": "={{ $json.body }}",
        "additionalFields": {
          "attachments": {
            "attachments": [
              {
                "binaryPropertyName": "pdf"
              }
            ]
          },
          "ccRecipients": "={{ $json.cc }}",
          "bodyContentType": "html"
        }
      },
      "id": "827989ea-65d5-4927-a4b1-a4ef315c4b4b",
      "name": "Outlook – Send Report Email1",
      "type": "n8n-nodes-base.microsoftOutlook",
      "typeVersion": 2,
      "position": [
        1584,
        272
      ],
      "webhookId": "500ee2cf-0f02-4bdd-b96e-c62aad2151ff",
      "credentials": {
        "microsoftOutlookOAuth2Api": {
          "id": "CIxWbJQqckSp2IQf",
          "name": "Uma's Outlook Account"
        }
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [
        [
          {
            "node": "Airtable – List Records",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Cron Trigger – 7am Daily": {
      "main": [
        [
          {
            "node": "Airtable – List Records",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Airtable – List Records": {
      "main": [
        [
          {
            "node": "Code A – Normalize & Filter",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code A – Normalize & Filter": {
      "main": [
        [
          {
            "node": "IF No Records",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "IF No Records": {
      "main": [
        [
          {
            "node": "Outlook – No Records Email",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Message a model",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Outlook – No Records Email": {
      "main": [
        [
          {
            "node": "No Operation (end)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code B – Build HTML": {
      "main": [
        [
          {
            "node": "Code C – HTML to Binary",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code C – HTML to Binary": {
      "main": [
        [
          {
            "node": "HTTP – Gotenberg PDF",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP – Gotenberg PDF": {
      "main": [
        [
          {
            "node": "Code – Rename PDF",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code – Rename PDF": {
      "main": [
        [
          {
            "node": "HTTP – Compress PDF",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Message a model": {
      "main": [
        [
          {
            "node": "Code B – Build HTML",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP – Compress PDF": {
      "main": [
        [
          {
            "node": "Code – Restore Filename",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code – Restore Filename": {
      "main": [
        [
          {
            "node": "Outlook – Send Report Email1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Outlook – Send Report Email1": {
      "main": [
        [
          {
            "node": "Airtable – Update Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "instanceId": "09a2a8e1a270ed3c2892f076a98e12d69a2b9952b0e5fe2c84fa5b592f445a35"
  }
}