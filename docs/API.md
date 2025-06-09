# API Reference

The AI Monitor provides a RESTful API for all operations. All endpoints use GET requests with parameters in the URL.

## Base URL

```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## Authentication

All requests require a `token` parameter:

```
?token=your-secure-token
```

Default token: `dev-token-change-me` (change this in production!)

## Core Endpoints

### System Status

Check if the system is operational.

```http
GET /?action=status&token=YOUR_TOKEN
```

**Response:**
```json
{
  "timestamp": "2025-06-09T15:00:00.000Z",
  "success": true,
  "system": "AI Competitor Monitor",
  "version": "2.0",
  "health": "operational",
  "configuration": {
    "monitorsConfigured": 16,
    "sheetsConnected": true,
    "triggersActive": true
  }
}
```

### Generate Baseline

Create initial snapshot of all monitored websites.

```http
GET /?action=baseline&token=YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Baseline generation started",
  "companiesProcessed": 16,
  "urlsChecked": 58,
  "duration": "3.5 minutes"
}
```

### Monitor Changes

Run monitoring check for all companies.

```http
GET /?action=monitor&token=YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "companies": [
    {
      "company": "Mistral AI",
      "urlsChecked": 3,
      "changes": 1,
      "errors": 0
    }
  ],
  "totalChanges": 3,
  "significantChanges": 1
}
```

### Execute Function

Call any exposed function directly.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=FUNCTION_NAME&parameters=[]
```

**Parameters:**
- `functionName`: Name of function to execute
- `parameters`: JSON array of parameters

**Example - Create Monitor Sheet:**
```http
GET /?action=execute&token=YOUR_TOKEN&functionName=createMonitorSheet&parameters=[]
```

## Configuration Endpoints

### Get Configuration

Retrieve current monitoring configuration.

```http
GET /?action=config&token=YOUR_TOKEN
```

**Response:**
```json
{
  "companies": [
    {
      "company": "Mistral AI",
      "category": "AI/LLM",
      "urls": ["https://mistral.ai", "..."]
    }
  ],
  "totalCompanies": 16,
  "totalUrls": 58
}
```

### Update Configuration

Apply new monitoring configuration.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=applyEnhancedMonitorConfig&parameters=[]
```

## Monitoring Functions

### Get Monitor Data

Retrieve recent monitoring results.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=getMonitorData&parameters=[]
```

### Get POC Status

Get proof-of-concept system status.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=getPOCStatus&parameters=[]
```

**Response:**
```json
{
  "title": "AI Competitor Monitor - Proof of Concept",
  "status": "Operational",
  "capabilities": {
    "monitoring": "16 AI companies",
    "changeDetection": "Content hash comparison",
    "intelligence": "Claude AI analysis"
  },
  "currentlyMonitoring": [...]
}
```

## Email Functions

### Get Email Preferences

Check email configuration.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=getEmailPreferences&parameters=[]
```

**Response:**
```json
{
  "emailNotifications": true,
  "dailyDigest": true,
  "recipient": "user@example.com",
  "schedule": {
    "daily": "9:00 AM PST",
    "weekly": "Mondays at 8:00 AM PST"
  }
}
```

### Enable Daily Emails

Turn on daily digest emails.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=setDailyDigestEmails&parameters=[true]
```

### Send Test Email

Trigger a test email (requires trigger).

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=testEmailViaTrigger&parameters=[]
```

## Scheduling Functions

### Setup Daily Monitoring

Configure automated daily runs.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=setupDailyMonitoring&parameters=[]
```

**Response:**
```json
{
  "success": true,
  "triggers": {
    "daily": "runDailyMonitoring @ 9:00 AM",
    "priority": "runPriorityCheck @ 3:00 PM",
    "weekly": "generateWeeklySummary @ Mondays 8:00 AM"
  }
}
```

### Clear Triggers

Remove all scheduled triggers.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=clearMonitoringTriggers&parameters=[]
```

## AI Analysis Functions

### Baseline with Claude

Generate baseline with AI analysis.

```http
GET /?action=baselineWithClaude&token=YOUR_TOKEN
```

### Analyze All Companies

Run Claude analysis on all companies.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=analyzeAllCompaniesWithClaude&parameters=[]
```

## Sheet Management

### Get Sheet URL

Retrieve Google Sheets dashboard URL.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=getSheetUrl&parameters=[]
```

**Response:**
```json
{
  "url": "https://docs.google.com/spreadsheets/d/SHEET_ID/edit"
}
```

### Create Monitor Sheet

Create new Google Sheet for data storage.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=createMonitorSheet&parameters=[]
```

## System Management

### Get Available Functions

List all available API functions.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=getAvailableFunctions&parameters=[]
```

### Get Recent Logs

Retrieve system activity logs.

```http
GET /?action=logs&token=YOUR_TOKEN&limit=50
```

### Check Claude Status

Verify Claude AI integration.

```http
GET /?action=execute&token=YOUR_TOKEN&functionName=checkClaudeStatus&parameters=[]
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "stack": "Stack trace (in development)",
  "help": "Helpful suggestion"
}
```

Common error codes:
- `401`: Invalid token
- `404`: Function not found
- `429`: Rate limit exceeded
- `500`: Internal server error

## Rate Limiting

The API implements rate limiting:
- 100 requests per hour
- 1000 requests per day
- 2 second delay between requests recommended

## Examples

### Complete Setup Flow

```bash
# 1. Create monitor sheet
curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=createMonitorSheet&parameters=[]"

# 2. Apply configuration
curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=applyEnhancedMonitorConfig&parameters=[]"

# 3. Set up monitoring
curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=setupDailyMonitoring&parameters=[]"

# 4. Enable emails
curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=setDailyDigestEmails&parameters=[true]"

# 5. Generate baseline
curl -L "YOUR_URL?action=baseline&token=YOUR_TOKEN"
```

### Daily Operations

```bash
# Check status
curl -L "YOUR_URL?action=status&token=YOUR_TOKEN"

# Run manual monitoring
curl -L "YOUR_URL?action=monitor&token=YOUR_TOKEN"

# Get recent changes
curl -L "YOUR_URL?action=logs&token=YOUR_TOKEN&limit=10"
```

## Response Formats

All responses are JSON with consistent structure:

### Success Response
```json
{
  "timestamp": "ISO 8601 timestamp",
  "success": true,
  "data": { ... },
  "executionTime": 1234
}
```

### Error Response
```json
{
  "timestamp": "ISO 8601 timestamp",
  "success": false,
  "error": "Error description",
  "help": "Suggested resolution"
}
```

## Security Recommendations

1. **Change Default Token**: Replace `dev-token-change-me`
2. **Use HTTPS**: Always (automatic with Google Apps Script)
3. **Limit Access**: Configure Web App permissions
4. **Monitor Usage**: Check logs regularly
5. **Rotate Token**: Change periodically

## SDK Example

Simple JavaScript wrapper:

```javascript
class AIMonitorClient {
  constructor(url, token) {
    this.baseUrl = url;
    this.token = token;
  }
  
  async request(action, params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.append('token', this.token);
    url.searchParams.append('action', action);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url);
    return response.json();
  }
  
  status() {
    return this.request('status');
  }
  
  monitor() {
    return this.request('monitor');
  }
  
  execute(functionName, parameters = []) {
    return this.request('execute', {
      functionName,
      parameters: JSON.stringify(parameters)
    });
  }
}

// Usage
const client = new AIMonitorClient('YOUR_URL', 'YOUR_TOKEN');
const status = await client.status();
```

---

For additional endpoints or custom functionality, check the source code or use `getAvailableFunctions()` to discover all options.