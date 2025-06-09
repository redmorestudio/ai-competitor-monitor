# Configuration Guide

This guide covers all configuration options for the AI Competitor Intelligence Monitor.

## 🏢 Company Configuration

### Default Companies

The system comes pre-configured with 16 companies across two categories:

#### AI Technology (6 companies)
```javascript
{
  company: "Mistral AI",
  category: "AI/LLM",
  urls: [
    "https://mistral.ai",
    "https://mistral.ai/news/",
    "https://mistral.ai/technology/"
  ]
}
```

#### Social Marketing (10 companies)
```javascript
{
  company: "Sprout Social",
  category: "Social Media Management",
  urls: [
    "https://sproutsocial.com",
    "https://sproutsocial.com/features",
    "https://sproutsocial.com/insights",
    "https://sproutsocial.com/pricing"
  ]
}
```

### Adding Custom Companies

1. Open `SocialMarketingConfig.gs` or create a new config file
2. Add your companies to the configuration array:

```javascript
const CUSTOM_COMPANIES = [
  {
    company: "OpenAI",
    category: "AI/Research",
    description: "Leading AI research organization",
    urls: [
      "https://openai.com",
      "https://openai.com/blog",
      "https://openai.com/research",
      "https://openai.com/pricing"
    ]
  },
  {
    company: "Anthropic",
    category: "AI/Safety",
    description: "AI safety and research company",
    urls: [
      "https://anthropic.com",
      "https://anthropic.com/news",
      "https://anthropic.com/research"
    ]
  }
];
```

3. Apply the configuration:

```javascript
function applyCustomConfig() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('monitorConfig', JSON.stringify(CUSTOM_COMPANIES));
  return { success: true, companies: CUSTOM_COMPANIES.length };
}
```

### URL Selection Best Practices

Choose URLs that:
- Update frequently (blogs, news, product pages)
- Contain competitive intelligence (pricing, features, announcements)
- Are publicly accessible (no login required)
- Load quickly and reliably

Avoid URLs that:
- Require authentication
- Have heavy JavaScript rendering
- Change constantly (timestamps, random content)
- Are behind paywalls

## ⏰ Schedule Configuration

### Default Schedule

```
Daily Monitoring: 9:00 AM PST
Daily Email: 9:15 AM PST
Priority Check: 3:00 PM PST
Weekly Summary: Mondays 8:00 AM PST
```

### Modifying Schedules

Edit the trigger functions in `DailyMonitoring.gs`:

```javascript
function setupDailyMonitoring() {
  // Clear existing triggers
  clearMonitoringTriggers();
  
  // Daily morning run (change hour as needed)
  ScriptApp.newTrigger('runDailyMonitoringWithEmail')
    .timeBased()
    .atHour(6)  // 6 AM instead of 9 AM
    .everyDays(1)
    .inTimezone('America/Los_Angeles')
    .create();
    
  // Afternoon priority check
  ScriptApp.newTrigger('runPriorityCheck')
    .timeBased()
    .atHour(14)  // 2 PM instead of 3 PM
    .everyDays(1)
    .inTimezone('America/Los_Angeles')
    .create();
    
  // Weekly summary (change day if needed)
  ScriptApp.newTrigger('generateWeeklySummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .inTimezone('America/Los_Angeles')
    .create();
}
```

### Timezone Configuration

Change timezone in `appsscript.json`:

```json
{
  "timeZone": "America/New_York",  // Change from Los_Angeles
  ...
}
```

## 📧 Email Configuration

### Email Recipients

Set primary recipient:

```javascript
function setEmailRecipient(email) {
  PropertiesService.getScriptProperties()
    .setProperty('ownerEmail', email);
}
```

### Email Templates

Customize email appearance in `DailyDigestEmail.gs`:

```javascript
// Change email branding
const htmlBody = `
  <div class="header" style="background-color: #YOUR_COLOR;">
    <h1>Your Company Intelligence Report</h1>
    <p>Competitive Insights - ${today}</p>
  </div>
  ...
`;
```

### Email Frequency

Control when emails are sent:

```javascript
// Only send if significant changes
function shouldSendEmail(results) {
  return results.significantChanges > 0 || 
         results.errors > 0 ||
         new Date().getDay() === 1; // Always on Mondays
}
```

## 🤖 AI Configuration

### Claude API Settings

Configure Claude model and parameters:

```javascript
const CLAUDE_CONFIG = {
  model: 'claude-3-haiku-20240307',  // or claude-3-sonnet-20240229
  max_tokens: 1000,
  temperature: 0.3,  // Lower = more focused
  system: "You are a competitive intelligence analyst..."
};
```

### Analysis Prompts

Customize AI analysis in `ClaudeIntegration.gs`:

```javascript
function createAnalysisPrompt(company, changes) {
  return `Analyze these changes for ${company}:
    
    ${changes}
    
    Provide:
    1. Executive summary (2-3 sentences)
    2. Strategic implications
    3. Recommended actions
    4. Threat level (1-10)
    
    Focus on: pricing changes, new features, market positioning`;
}
```

### Rate Limiting

Protect against API overuse:

```javascript
const RATE_LIMIT = {
  maxCallsPerDay: 100,
  maxCallsPerHour: 20,
  delayBetweenCalls: 2000  // milliseconds
};
```

## 🔧 System Configuration

### API Security

Change the default API token:

```javascript
// In WebApp.gs
const API_TOKEN = 'your-secure-token-here';  // Change from dev-token-change-me

function isAuthorized(token) {
  return token === API_TOKEN;
}
```

### Web App Access

Restrict access in deployment settings:
- **Execute as**: Me (your account)
- **Who has access**: Only myself / Anyone in organization

### Resource Limits

Configure monitoring limits:

```javascript
const SYSTEM_LIMITS = {
  maxCompanies: 50,
  maxUrlsPerCompany: 10,
  maxRetries: 3,
  timeout: 30000,  // 30 seconds
  maxEmailsPerDay: 10
};
```

## 📊 Google Sheets Configuration

### Sheet Structure

Customize sheet tabs and columns:

```javascript
function setupSheetStructure() {
  const ss = getOrCreateMonitorSheet();
  
  // Add custom tab
  const customSheet = ss.insertSheet('Custom Analysis');
  customSheet.getRange(1, 1, 1, 5).setValues([[
    'Date', 'Company', 'Insight', 'Priority', 'Action'
  ]]);
}
```

### Data Retention

Configure how long to keep data:

```javascript
function cleanOldData() {
  const retentionDays = 90;  // Keep 90 days of data
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  // Clean old entries
  // ... implementation
}
```

## 🎯 Advanced Configuration

### Custom Extractors

Create specialized content extractors:

```javascript
function extractPricingData(html, company) {
  // Custom logic for specific companies
  if (company === 'Competitor X') {
    const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
    const prices = html.match(priceRegex);
    return { prices: prices || [] };
  }
  return null;
}
```

### Webhook Integration

Send data to external systems:

```javascript
function sendToWebhook(data) {
  const webhookUrl = 'https://your-system.com/webhook';
  
  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      source: 'ai-monitor',
      timestamp: new Date().toISOString(),
      data: data
    })
  });
}
```

### Custom Alerts

Create specific alert conditions:

```javascript
function checkAlertConditions(change) {
  // Alert on pricing changes
  if (change.content.includes('pricing') || 
      change.content.includes('price')) {
    sendUrgentAlert('Pricing change detected', change);
  }
  
  // Alert on specific competitors
  if (change.company === 'Main Competitor' && 
      change.relevanceScore > 8) {
    sendUrgentAlert('High priority competitor update', change);
  }
}
```

## 💾 Backup Configuration

### Automatic Backups

Set up regular configuration backups:

```javascript
function backupConfiguration() {
  const config = {
    companies: JSON.parse(PropertiesService.getScriptProperties()
      .getProperty('monitorConfig')),
    settings: {
      email: PropertiesService.getScriptProperties()
        .getProperty('ownerEmail'),
      schedule: getScheduleConfig()
    }
  };
  
  // Save to sheet
  const backupSheet = ss.getSheetByName('Config Backup') || 
                      ss.insertSheet('Config Backup');
  backupSheet.appendRow([
    new Date().toISOString(),
    JSON.stringify(config)
  ]);
}
```

## 🔍 Monitoring Configuration

### Change Detection Sensitivity

Adjust how sensitive the system is to changes:

```javascript
const CHANGE_DETECTION = {
  minChangeLength: 50,      // Minimum characters for a change
  ignoreThreshold: 0.95,    // Similarity threshold to ignore
  significanceThreshold: 6  // Score needed for alerts (1-10)
};
```

### Content Filtering

Filter out unwanted content:

```javascript
const CONTENT_FILTERS = {
  // Ignore these patterns
  ignorePatterns: [
    /last updated:/i,
    /copyright \d{4}/i,
    /\d{1,2}:\d{2} [AP]M/  // Times
  ],
  
  // Focus on these keywords
  importantKeywords: [
    'announcement', 'launch', 'new', 'update',
    'pricing', 'feature', 'partnership'
  ]
};
```

## 📝 Configuration Best Practices

1. **Start Small**: Begin with 5-10 companies, then expand
2. **Test First**: Run manual tests before enabling automation
3. **Monitor Usage**: Keep an eye on API calls and email sends
4. **Regular Reviews**: Review and update configurations monthly
5. **Document Changes**: Keep notes on why configurations were changed

## 🚀 Quick Configuration Commands

```bash
# Check current configuration
curl -L "YOUR_URL?action=config&token=YOUR_TOKEN"

# Update configuration
curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=applyCustomConfig&parameters=[]"

# Test configuration
curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=testMonitorUrls&parameters=[]"
```

---

Remember: Good configuration is key to getting valuable competitive intelligence. Take time to customize the system for your specific needs.