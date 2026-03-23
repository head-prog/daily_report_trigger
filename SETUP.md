# triggers.dev Daily Report Workflow - Environment Setup

## Required Environment Variables

```bash
# Airtable
AIRTABLE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Outlook Email
OUTLOOK_USER=uma@boulderconstruction.com
OUTLOOK_PASSWORD=your-outlook-password-or-app-password

# Gotenberg PDF Service (optional, defaults included)
GOTENBERG_AUTH=BoulderPDF_9c2bA7_ChangeMe_2026
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install @trigger.dev/sdk @anthropic-ai/sdk nodemailer axios
   npm install --save-dev typescript
   ```

2. **Configure Environment**
   - Copy the variables above to your `.env` file
   - Get your **Airtable Personal Access Token** from https://airtable.com/account
   - Get your **Claude API Key** from https://console.anthropic.com/
   - Use an **Outlook App Password** (not your main password) if 2FA is enabled

3. **Deploy to triggers.dev**
   ```bash
   npx trigger.dev init
   npx trigger.dev deploy
   ```

4. **Create Triggers**
   - Manual trigger for on-demand execution
   - Scheduled trigger (Daily at 7am EST - configure in triggers.dev dashboard)

## Workflow Flow

1. **Fetch** → Airtable "Daily Site Report" table
2. **Filter** → Records from yesterday OR manually flagged
3. **Normalize** → Extract photos, emails, project info
4. **Check** → If no records, send alert email
5. **Summarize** → Claude generates AI summary
6. **Build** → Create professional HTML report
7. **Convert** → HTML → PDF (Gotenberg)
8. **Compress** → Reduce PDF file size
9. **Email** → Send via Outlook with PDF attachment
10. **Update** → Mark Airtable record as "Sent"

## API Endpoints Used

- **Airtable**: `https://api.airtable.com/v0/`
- **Claude**: `https://api.anthropic.com/`
- **Gotenberg**: `http://167.99.53.92/forms/chromium/convert/html`
- **Compress**: `http://167.99.53.92:3001`
- **Outlook**: `smtp-mail.outlook.com:587`

## Features

✓ Dual triggers (manual + scheduled 7am EST)
✓ AI-powered report summaries
✓ Professional PDF generation with styling
✓ Multi-photo support
✓ Email CC/TO customization per project
✓ Automatic Airtable status updates
✓ Error handling & logging
✓ PDF compression before sending

## Debugging

Enable detailed logging:
```typescript
console.log(`[${event.trigger}] ...`);
console.log(`Fetched ${records.length} records`);
console.log(`Processing report for ${report.projectName}`);
```

Check execution logs in triggers.dev dashboard under "Workflows" → "daily-report-workflow"
