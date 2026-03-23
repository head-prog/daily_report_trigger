import { Trigger, eventTrigger } from "@trigger.dev/sdk";
import axios from "axios";
import Anthropic from "@anthropic-ai/sdk";
import nodemailer from "nodemailer";

// Environment variables
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = "appoiVoPb5XOkLoZ5";
const AIRTABLE_TABLE_ID = "tblaakOsOWUS2Tv2S";
const GOTENBERG_URL = "http://167.99.53.92/forms/chromium/convert/html";
const GOTENBERG_AUTH = process.env.GOTENBERG_AUTH || "BoulderPDF_9c2bA7_ChangeMe_2026";
const COMPRESS_URL = "http://167.99.53.92:3001";
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const OUTLOOK_USER = process.env.OUTLOOK_USER;
const OUTLOOK_PASSWORD = process.env.OUTLOOK_PASSWORD;

// Initialize clients
const anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });

interface ReportRecord {
  id: string;
  fields: {
    Date: string;
    "Project Code": string | string[];
    "Project Name": string | string[];
    "Email To": string;
    "Email Addressed To": string;
    "Email CC": string;
    Weather: string;
    Manpower: string;
    "Work in Progress": string;
    "Work Completed Today": string;
    "Work Planned Tomorrow": string;
    Deliveries: string;
    "Issues / Delays": string;
    "Inspection Today/Upcoming with Status": string;
    Notes: string;
    RFIs: string;
    "Change Orders": string;
    "Requests & Notices ": string;
    "Report Status"?: string;
    "Generate Daily Report"?: boolean;
    Photos?: Array<{ url: string; filename: string; thumbnails?: { large?: { url: string } } }>;
    Receipts?: Array<any>;
  };
}

interface NormalizedReport {
  recordId: string;
  reportDate: string;
  reportDateShort: string;
  projectName: string;
  projectCode: string;
  emailTo: string;
  emailAddressedTo: string;
  emailCC: string;
  weather: string;
  manpower: string;
  workInProgress: string;
  workCompletedToday: string;
  workPlannedTomorrow: string;
  deliveries: string;
  issuesDelays: string;
  inspections: string;
  notes: string;
  rfis: string;
  changeOrders: string;
  requestsNotices: string;
  receiptsCount: number;
  photos: Array<{ url: string; filename: string }>;
  totalPhotos: number;
  _noRecords: boolean;
}

// Helper functions
function getYesterdayDate(): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  now.setDate(now.getDate() - 1);
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function formatDateLong(dateStr: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${months[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[1]}/${parts[2]}/${parts[0].substring(2)}`;
}

function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function hasContent(val: any): boolean {
  const s = safeStr(val).trim();
  return s.length > 0 && !["[]", "{}", "null", "undefined", "None", "N/A"].includes(s);
}

function toParagraph(val: any): string {
  if (!hasContent(val)) return "";
  const s = safeStr(val).trim();
  const lines = s.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  return lines.map(l => `<p>${l}</p>`).join("");
}

// Step 1: Fetch Airtable records
async function fetchAirtableRecords(): Promise<ReportRecord[]> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
  });
  return response.data.records;
}

// Step 2: Normalize & Filter records
function normalizeAndFilterRecords(records: ReportRecord[]): NormalizedReport[] {
  const reportDate = getYesterdayDate();
  
  const filtered = records.filter((record) => {
    const fields = record.fields;
    let dateVal = fields.Date || "";
    if (typeof dateVal === "string") {
      dateVal = dateVal.substring(0, 10);
    }
    const isYesterday = dateVal === reportDate;
    const isManualFlag = fields["Generate Daily Report"] === true;
    const reportStatus = fields["Report Status"] || "";
    const projectCode = fields["Project Code"] || "";

    if (reportStatus === "Sent" || reportStatus === "Failed") return false;
    if (Array.isArray(projectCode) && projectCode.length === 0) return false;
    if (!projectCode) return false;

    return isYesterday || isManualFlag;
  });

  if (filtered.length === 0) {
    return [{
      recordId: "",
      reportDate: formatDateLong(reportDate),
      reportDateShort: formatDateShort(reportDate),
      projectName: "N/A",
      projectCode: "",
      emailTo: "uma@boulderconstruction.com",
      emailAddressedTo: "",
      emailCC: "",
      weather: "",
      manpower: "",
      workInProgress: "",
      workCompletedToday: "",
      workPlannedTomorrow: "",
      deliveries: "",
      issuesDelays: "",
      inspections: "",
      notes: "",
      rfis: "",
      changeOrders: "",
      requestsNotices: "",
      receiptsCount: 0,
      photos: [],
      totalPhotos: 0,
      _noRecords: true
    }];
  }

  return filtered.map((item) => {
    const f = item.fields;
    const photos = Array.isArray(f.Photos)
      ? f.Photos.map(p => ({
          url: p?.thumbnails?.large?.url || p?.url || "",
          filename: p?.filename || "photo.jpg"
        }))
      : [];

    const receiptsCount = Array.isArray(f.Receipts) ? f.Receipts.length : 0;

    return {
      recordId: item.id,
      reportDate: formatDateLong(f.Date?.substring(0, 10) || reportDate),
      reportDateShort: formatDateShort(f.Date?.substring(0, 10) || reportDate),
      projectName: Array.isArray(f["Project Name"])
        ? f["Project Name"].join(", ")
        : (f["Project Name"] || ""),
      projectCode: Array.isArray(f["Project Code"])
        ? f["Project Code"][0] || ""
        : (f["Project Code"] || ""),
      emailTo: safeStr(Array.isArray(f["Email To"]) ? f["Email To"][0] : f["Email To"]).trim(),
      emailAddressedTo: safeStr(Array.isArray(f["Email Addressed To"]) ? f["Email Addressed To"][0] : f["Email Addressed To"]).trim(),
      emailCC: Array.isArray(f["Email CC"]) ? f["Email CC"].join(", ") : (f["Email CC"] || ""),
      weather: f.Weather || "",
      manpower: f.Manpower || "",
      workInProgress: f["Work in Progress"] || "",
      workCompletedToday: f["Work Completed Today"] || "",
      workPlannedTomorrow: f["Work Planned Tomorrow"] || "",
      deliveries: f.Deliveries || "",
      issuesDelays: f["Issues / Delays"] || "",
      inspections: f["Inspection Today/Upcoming with Status"] || "",
      notes: f.Notes || "",
      rfis: f.RFIs || "",
      changeOrders: f["Change Orders"] || "",
      requestsNotices: f["Requests & Notices "] || "",
      receiptsCount,
      photos,
      totalPhotos: photos.length,
      _noRecords: false
    };
  });
}

// Step 3: Generate AI summary using Claude
async function generateAISummary(report: NormalizedReport): Promise<string> {
  const prompt = `You are a construction report editor for Boulder Construction. You receive raw daily site report data. Your ONLY job is to write an overall summary.

DO NOT modify, rewrite, or clean up any of the individual field data. Return every field EXACTLY as provided — character for character.

Write a thorough "overallSummary" (3-6 sentences) that:
- Opens with the most significant work accomplished that day
- Mentions key trades active on site and what they progressed
- Notes any inspections, deliveries, or milestones
- Flags any delays or issues if present
- Closes with what's coming next or the overall project trajectory
- Uses professional but approachable tone, past tense for completed work

Return valid JSON with exactly these keys (pass through field values unchanged):
weather, manpower, workInProgress, workCompletedToday, workPlannedTomorrow, deliveries, issuesDelays, inspections, notes, rfis, changeOrders, requestsNotices, overallSummary

Raw data:
Weather: ${report.weather}
Manpower: ${report.manpower}
Work in Progress: ${report.workInProgress}
Work Completed Today: ${report.workCompletedToday}
Work Planned Tomorrow: ${report.workPlannedTomorrow}
Deliveries: ${report.deliveries}
Issues/Delays: ${report.issuesDelays}
Inspections: ${report.inspections}
Notes: ${report.notes}
RFIs: ${report.rfis}
Change Orders: ${report.changeOrders}
Requests & Notices: ${report.requestsNotices}

Output ONLY valid JSON, no markdown fences.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "{}";
  return responseText.replace(/```json/g, "").replace(/```/g, "").trim();
}

// Step 4: Build HTML report
function buildHTML(report: NormalizedReport, polished: any): string {
  const fieldMap = [
    { key: "weather", label: "Weather" },
    { key: "manpower", label: "Manpower" },
    { key: "workCompletedToday", label: "Work Completed Today" },
    { key: "workInProgress", label: "Work in Progress" },
    { key: "workPlannedTomorrow", label: "Work Planned Tomorrow" },
    { key: "deliveries", label: "Deliveries" },
    { key: "inspections", label: "Inspections" },
    { key: "issuesDelays", label: "Issues & Delays" },
    { key: "rfis", label: "RFIs" },
    { key: "changeOrders", label: "Change Orders" },
    { key: "requestsNotices", label: "Requests & Notices" },
    { key: "notes", label: "Notes" }
  ];

  let sections = "";
  for (const f of fieldMap) {
    const val = polished[f.key];
    if (hasContent(val)) {
      sections += `<div class="sec"><div class="label">${f.label}</div>${toParagraph(val)}</div>`;
    }
  }

  if (report.receiptsCount > 0) {
    sections += `<div class="sec"><div class="label">Receipts</div><p>${report.receiptsCount} receipt(s) uploaded</p></div>`;
  }

  let summarySec = "";
  if (hasContent(polished.overallSummary)) {
    summarySec = `<div class="summary"><div class="summary-tag">AI Summary</div>${toParagraph(polished.overallSummary)}</div>`;
  }

  let photoSec = "";
  if (report.photos.length > 0) {
    let cells = "";
    for (const p of report.photos) {
      cells += `<div class="ph"><img src="${p.url}" /><span>${p.filename}</span></div>`;
    }
    photoSec = `<div class="photo-page"><div class="label">Site Photos</div><div class="pgrid">${cells}</div></div>`;
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 40px 52px 48px 52px; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Trebuchet MS", "Lucida Grande", Arial, sans-serif;
    color: #2B3D4F;
    font-size: 10pt;
    line-height: 1.65;
    background: #fff;
  }
  .page { max-width: 720px; margin: 0 auto; padding: 28px 0 20px 0; }
  .hdr { margin-bottom: 32px; }
  .brand { font-size: 10pt; font-weight: 800; color: #D4772C; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; }
  .title { font-size: 22pt; font-weight: 700; color: #2B3D4F; line-height: 1.15; margin-bottom: 4px; }
  .project-date { font-size: 11pt; color: #D4772C; font-weight: 600; margin-bottom: 12px; }
  .accent-bar { width: 40px; height: 3px; background: #D4772C; border-radius: 2px; }
  .sec { margin-bottom: 22px; }
  .label { font-size: 10pt; font-weight: 700; color: #D4772C; margin-bottom: 5px; }
  p { font-size: 10pt; color: #445566; margin: 0 0 5px 0; line-height: 1.65; }
  .summary { margin: 4px 0 26px 0; padding: 14px 18px; background: #FBF6F1; border-left: 3px solid #D4772C; border-radius: 0 6px 6px 0; }
  .summary-tag { font-size: 8pt; font-weight: 700; color: #D4772C; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
  .photo-page { padding-top: 20px; }
  .pgrid { display: flex; flex-wrap: wrap; gap: 8px; }
  .ph { width: calc(50% - 4px); margin-bottom: 4px; }
  .ph img { width: 100%; height: 220px; object-fit: cover; border-radius: 4px; display: block; }
  .ph span { display: block; font-size: 7pt; color: #B8BEC6; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .foot { margin-top: 32px; display: flex; justify-content: space-between; font-size: 7.5pt; color: #C8CCD2; }
</style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div class="brand">Boulder</div>
    <div class="title">Daily Progress Report</div>
    <div class="project-date">${report.projectName} | ${report.reportDate}</div>
    <div class="accent-bar"></div>
  </div>
  ${sections}
  ${summarySec}
  ${photoSec}
  <div class="foot">
    <span>Boulder Construction</span>
    <span>${report.projectName} &middot; ${report.reportDate}</span>
  </div>
</div>
</body>
</html>`;
}

// Step 5: Convert HTML to PDF via Gotenberg
async function convertHTMLToPDF(html: string): Promise<Buffer> {
  const htmlBuffer = Buffer.from(html, "utf-8");
  const formData = new FormData();
  const blob = new Blob([htmlBuffer], { type: "text/html" });
  formData.append("index.html", blob, "index.html");

  const response = await axios.post(GOTENBERG_URL, formData, {
    headers: {
      "X-Auth": GOTENBERG_AUTH,
      ...formData.getHeaders()
    },
    responseType: "arraybuffer"
  });

  return Buffer.from(response.data);
}

// Step 6: Compress PDF
async function compressPDF(pdfBuffer: Buffer): Promise<Buffer> {
  const response = await axios.post(COMPRESS_URL, pdfBuffer, {
    headers: { "Content-Type": "application/pdf" },
    responseType: "arraybuffer"
  });

  return Buffer.from(response.data);
}

// Step 7: Send email via Outlook
async function sendEmail(
  to: string,
  cc: string,
  subject: string,
  htmlBody: string,
  pdfBuffer: Buffer,
  pdfFileName: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: {
      user: OUTLOOK_USER,
      pass: OUTLOOK_PASSWORD
    }
  });

  await transporter.sendMail({
    from: OUTLOOK_USER,
    to,
    cc,
    subject,
    html: htmlBody,
    attachments: [
      {
        filename: pdfFileName,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });
}

// Step 8: Update Airtable status
async function updateAirtableStatus(recordId: string, status: string): Promise<void> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${recordId}`;
  await axios.patch(
    url,
    {
      fields: {
        "Report Status": status,
        "Report Sent At": new Date().toISOString()
      }
    },
    {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    }
  );
}

// Main workflow
export const dailyReportWorkflow = eventTrigger({
  name: "daily-report-workflow",
  title: "Daily Report Workflow",
  description: "Automated daily construction site report generation",
  icon: "📋",
  schema: {
    type: "object" as const,
    properties: {
      trigger: {
        type: "string" as const,
        enum: ["manual", "scheduled"],
        description: "Trigger type: manual or scheduled"
      }
    },
    required: ["trigger"]
  }
});

dailyReportWorkflow.onEvent(async (event) => {
  try {
    console.log(`[${event.trigger}] Starting daily report workflow`);

    // Fetch records from Airtable
    const records = await fetchAirtableRecords();
    console.log(`Fetched ${records.length} records from Airtable`);

    // Normalize & filter
    const normalizedRecords = normalizeAndFilterRecords(records);

    // Check if no records
    if (normalizedRecords[0]._noRecords) {
      console.log("No records found for today");
      // Send alert email
      const transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false,
        auth: { user: OUTLOOK_USER, pass: OUTLOOK_PASSWORD }
      });

      await transporter.sendMail({
        from: OUTLOOK_USER,
        to: "uma@boulderconstruction.com",
        subject: `No Daily Site Report records found – ${normalizedRecords[0].reportDate}`,
        text: "No daily site report records were found for today."
      });
      return;
    }

    // Process each report
    for (const report of normalizedRecords) {
      console.log(`Processing report for ${report.projectName}`);

      // Generate AI summary
      const aiSummaryJson = await generateAISummary(report);
      const polished = JSON.parse(aiSummaryJson);

      // Build HTML
      const html = buildHTML(report, polished);

      // Convert to PDF
      const pdfBuffer = await convertHTMLToPDF(html);

      // Compress PDF
      const compressedPDF = await compressPDF(pdfBuffer);

      // Generate filename
      const dateParts = report.reportDateShort.split("/");
      const fileDate = dateParts.length === 3
        ? `20${dateParts[2]} ${dateParts[0]} ${dateParts[1]}`
        : report.reportDateShort;
      const safeFileName = `${fileDate} - Daily Report - ${report.projectName}`.replace(/[^a-zA-Z0-9\s\-\.]/g, "").trim() + ".pdf";

      // Build email body
      const emailBody = `<div style="font-family: 'Trebuchet MS', 'Lucida Grande', Arial, sans-serif; font-size: 10pt; color: #000000; line-height: 1.6;">
<p style="margin: 0 0 12px 0;">Hi Team,</p>
<p style="margin: 0 0 12px 0;">Please find attached the Daily Progress Report for ${report.projectName}, dated ${report.reportDate}.</p>
<p style="margin: 0 0 20px 0;">Thanks!</p>
<p style="margin: 0;">Uma Patel</p>
<p style="margin: 0;">Boulder Construction</p>
<p style="margin: 0;">T: (214) 471-3657</p>
<p style="margin: 0;"><a href="mailto:uma@boulderconstruction.com">uma@boulderconstruction.com</a></p>
</div>`;

      // Send email
      const subject = `Daily Report – ${report.projectName} ${report.reportDateShort}`;
      await sendEmail(report.emailTo, report.emailCC, subject, emailBody, compressedPDF, safeFileName);
      console.log(`Email sent for ${report.projectName}`);

      // Update Airtable
      await updateAirtableStatus(report.recordId, "Sent");
      console.log(`Updated status to "Sent" for ${report.recordId}`);
    }

    console.log("Workflow completed successfully");
  } catch (error) {
    console.error("Workflow error:", error);
    throw error;
  }
});

// Export for testing
export { dailyReportWorkflow as default };
