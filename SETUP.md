# AI Monitor Setup Guide

This guide will walk you through setting up your own AI Competitor Intelligence Monitor from scratch. Total setup time: approximately 30 minutes.

## 📋 Prerequisites

Before starting, ensure you have:

1. **Google Account** - For Google Apps Script and Sheets
2. **Claude API Key** - Get one from [Anthropic Console](https://console.anthropic.com/)
3. **Node.js** - For using `clasp` (Google Apps Script CLI)
   ```bash
   # Check if installed
   node --version
   npm --version
   ```

## 🚀 Step-by-Step Setup

### Step 1: Install Google Apps Script CLI (clasp)

```bash
# Install clasp globally
npm install -g @google/clasp

# Login to Google
clasp login
```

This will open a browser window. Authorize clasp to access your Google Account.

### Step 2: Create a New Google Apps Script Project

```bash
# Create project directory
mkdir ~/ai-monitor
cd ~/ai-monitor

# Create new Apps Script project
clasp create --title "AI Competitor Monitor" --type webapp

# This creates:
# - .clasp.json (project config)
# - appsscript.json (manifest)
```

### Step 3: Copy Project Files

Copy all `.gs` files from this repository to your project directory:

```bash
# From the cloned repository
cp src/*.gs ~/ai-monitor/

# Essential files you need:
# - WebApp.gs          (API endpoints)
# - DailyDigestEmail.gs (Email system)
# - SocialMarketingConfig.gs (Company list)
# - IntelligentMonitor.gs (Core monitoring)
# - ClaudeIntegration.gs (AI analysis)
# ... and others
```

### Step 4: Configure appsscript.json

Replace your `appsscript.json` with:

```json
{
  "timeZone": "America/Los_Angeles",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/script.send_mail"
  ]
}
```

### Step 5: Push Files to Google Apps Script

```bash
# Push all files to Google
clasp push

# Open in browser to verify
clasp open
```

### Step 6: Set Up Claude API Key

1. In the Script Editor, create a new file called `SetupKeys.gs`
2. Add this function:

```javascript
function setupClaudeKey() {
  const CLAUDE_API_KEY = 'YOUR_CLAUDE_API_KEY_HERE'; // Replace this!
  PropertiesService.getScriptProperties().setProperty('CLAUDE_API_KEY', CLAUDE_API_KEY);
  console.log('Claude API key configured successfully');
}
```

3. Run `setupClaudeKey` once to store your API key
4. Delete the `SetupKeys.gs` file for security

### Step 7: Deploy as Web App

1. In the Script Editor, click **Deploy** → **New Deployment**
2. Choose settings:
   - **Type**: Web app
   - **Execute as**: Me
   - **Who has access**: Anyone
3. Click **Deploy**
4. Copy the Web App URL (save this!)

### Step 8: Create Google Sheet

Run this command using your Web App URL:

```bash
curl -L "YOUR_WEB_APP_URL?action=execute&token=dev-token-change-me&functionName=createMonitorSheet&parameters=[]"
```

This creates a Google Sheet with tabs for:
- Changes (detected updates)
- Baseline (current state)
- Summary (statistics)
- Logs (system activity)

### Step 9: Configure Email Recipient

1. In Script Editor, create a temporary function:

```javascript
function configureEmail() {
  PropertiesService.getScriptProperties().setProperty('ownerEmail', 'your-email@example.com');
  console.log('Email configured for: your-email@example.com');
}
```

2. Run `configureEmail` once
3. Delete the function

### Step 10: Apply Company Configuration

Configure the companies you want to monitor:

```bash
# Apply default 16-company configuration
curl -L "YOUR_WEB_APP_URL?action=execute&token=dev-token-change-me&functionName=applyEnhancedMonitorConfig&parameters=[]"
```

Or customize in `SocialMarketingConfig.gs` before deploying.

### Step 11: Set Up Automated Monitoring

Enable daily monitoring and email reports:

```bash
# Set up daily triggers
curl -L "YOUR_WEB_APP_URL?action=execute&token=dev-token-change-me&functionName=setupDailyMonitoring&parameters=[]"

# Enable email reports
curl -L "YOUR_WEB_APP_URL?action=execute&token=dev-token-change-me&functionName=setDailyDigestEmails&parameters=%5Btrue%5D"
```

### Step 12: Test Email System

Send a test email to verify configuration:

1. In Script Editor, run the `sendTestEmailDirect` function
2. Check your email inbox
3. If prompted, authorize email permissions

### Step 13: Generate Initial Baseline

Create the initial snapshot of all monitored sites:

```bash
curl -L "YOUR_WEB_APP_URL?action=baseline&token=dev-token-change-me"
```

This takes 3-5 minutes to check all companies.

## ✅ Verification Checklist

Run these commands to verify everything is working:

```bash
# Check system status
curl -L "YOUR_WEB_APP_URL?action=status&token=dev-token-change-me"

# Should show:
# - monitorsConfigured: 16
# - sheetsConnected: true
# - triggersActive: true

# Check email configuration
curl -L "YOUR_WEB_APP_URL?action=execute&token=dev-token-change-me&functionName=getEmailPreferences&parameters=[]"

# Should show your email and enabled status
```

## 📅 What Happens Next

Once setup is complete:

- **Tomorrow 9:00 AM**: First automated monitoring run
- **Tomorrow 9:15 AM**: First daily digest email
- **Ongoing**: Daily monitoring and reporting

## 🎨 Customization Options

### Change Monitoring Schedule

Edit trigger times in `DailyMonitoring.gs`:

```javascript
// Change from 9 AM to 7 AM
ScriptApp.newTrigger('runDailyMonitoringWithEmail')
  .timeBased()
  .atHour(7)  // Changed from 9
  .everyDays(1)
  .create();
```

### Add/Remove Companies

Edit `ENHANCED_MONITOR_CONFIG` in `SocialMarketingConfig.gs`:

```javascript
const ENHANCED_MONITOR_CONFIG = [
  {
    company: "Your Company",
    category: "Your Category",
    urls: [
      "https://example.com",
      "https://example.com/blog",
      "https://example.com/pricing"
    ]
  }
  // Add more companies
];
```

### Modify Email Template

Customize the HTML in `DailyDigestEmail.gs` to match your brand.

## 🔒 Security Best Practices

1. **Change the API Token**: Replace `dev-token-change-me` with a secure token
2. **Restrict Web App Access**: Consider limiting to your domain
3. **Rotate API Keys**: Periodically update your Claude API key
4. **Monitor Usage**: Check Claude API usage regularly

## 🆘 Troubleshooting

### Email Not Sending
- Ensure email permissions are authorized
- Check email quota limits (Gmail has daily limits)
- Verify recipient email in properties

### No Changes Detected
- Normal for stable websites
- Check if URLs are accessible
- Verify baseline was generated

### API Errors
- Check Claude API key is valid
- Monitor API rate limits
- Verify internet connectivity

## 📞 Need Help?

- Check [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- Review error logs in Google Sheet
- Open an issue on GitHub

---

Congratulations! Your AI Competitor Intelligence Monitor is now operational. 🎉