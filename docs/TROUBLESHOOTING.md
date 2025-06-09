# Troubleshooting Guide

This guide helps you resolve common issues with the AI Competitor Intelligence Monitor.

## 🚨 Common Issues

### Email Not Sending

**Symptoms:**
- No daily digest emails received
- Test emails fail
- Permission errors when sending email

**Solutions:**

1. **Check Email Authorization**
   ```javascript
   // Run in Script Editor
   function testEmailAuth() {
     try {
       MailApp.sendEmail({
         to: Session.getEffectiveUser().getEmail(),
         subject: 'Test',
         body: 'Test email'
       });
       console.log('Email authorized');
     } catch(e) {
       console.log('Need authorization:', e);
     }
   }
   ```

2. **Verify Email Configuration**
   ```bash
   curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=getEmailPreferences&parameters=[]"
   ```

3. **Check Gmail Quotas**
   - Free accounts: 500 emails/day
   - Workspace accounts: 1,500 emails/day

4. **Web App Limitation**
   - Emails cannot be sent via URL calls
   - Use triggers or run from Script Editor

### No Changes Detected

**Symptoms:**
- Monitor runs show 0 changes consistently
- Baseline appears static

**Solutions:**

1. **Verify URLs are Accessible**
   ```javascript
   function testUrls() {
     const config = JSON.parse(PropertiesService.getScriptProperties()
       .getProperty('monitorConfig') || '[]');
     
     config.forEach(company => {
       company.urls.forEach(url => {
         try {
           const response = UrlFetchApp.fetch(url, {
             muteHttpExceptions: true
           });
           console.log(`${url}: ${response.getResponseCode()}`);
         } catch(e) {
           console.log(`${url}: FAILED - ${e}`);
         }
       });
     });
   }
   ```

2. **Check Content Extraction**
   - Some sites may use heavy JavaScript
   - Content might be behind authentication
   - Dynamic content may not be captured

3. **Adjust Sensitivity**
   ```javascript
   // Lower threshold for change detection
   const CHANGE_THRESHOLD = 0.90; // Was 0.95
   ```

### API Token Issues

**Symptoms:**
- "Invalid token" errors
- 401 Unauthorized responses

**Solutions:**

1. **Verify Token**
   ```bash
   # Check with correct token
   curl -L "YOUR_URL?action=status&token=dev-token-change-me"
   ```

2. **Update Token**
   ```javascript
   // In WebApp.gs
   const API_TOKEN = 'your-new-secure-token';
   ```

### Claude API Errors

**Symptoms:**
- "Claude API key not found"
- Rate limit errors
- Analysis not working

**Solutions:**

1. **Verify API Key**
   ```javascript
   function checkClaudeKey() {
     const key = PropertiesService.getScriptProperties()
       .getProperty('CLAUDE_API_KEY');
     console.log('Key exists:', !!key);
     console.log('Key length:', key ? key.length : 0);
   }
   ```

2. **Test Claude Connection**
   ```bash
   curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=checkClaudeStatus&parameters=[]"
   ```

3. **Check Rate Limits**
   - Monitor API usage in Anthropic Console
   - Add delays between calls
   - Upgrade API plan if needed

### Google Sheets Issues

**Symptoms:**
- "Sheet not found" errors
- Data not saving
- Cannot create sheets

**Solutions:**

1. **Verify Sheet Connection**
   ```javascript
   function checkSheet() {
     try {
       const sheet = getOrCreateMonitorSheet();
       console.log('Sheet ID:', sheet.getId());
       console.log('Sheet URL:', sheet.getUrl());
     } catch(e) {
       console.log('Sheet error:', e);
     }
   }
   ```

2. **Check Permissions**
   - Ensure script has Sheets access
   - Verify OAuth scopes in manifest

3. **Recreate Sheet**
   ```bash
   curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=createMonitorSheet&parameters=[]"
   ```

### Trigger Not Running

**Symptoms:**
- No automated monitoring
- Emails not sent on schedule

**Solutions:**

1. **Check Trigger Status**
   ```javascript
   function listTriggers() {
     const triggers = ScriptApp.getProjectTriggers();
     triggers.forEach(trigger => {
       console.log(
         trigger.getHandlerFunction(),
         trigger.getTriggerSource(),
         trigger.getEventType()
       );
     });
   }
   ```

2. **Recreate Triggers**
   ```bash
   # Clear and recreate
   curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=clearMonitoringTriggers&parameters=[]"
   curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=setupDailyMonitoring&parameters=[]"
   ```

3. **Check Execution Transcript**
   - View > Executions in Script Editor
   - Look for errors or timeouts

## 🔧 Advanced Troubleshooting

### Memory/Timeout Issues

**Problem:** Script exceeds 6-minute execution limit

**Solution:**
```javascript
// Process in batches
function monitorInBatches() {
  const config = getMonitorConfigurations();
  const batchSize = 5;
  
  for (let i = 0; i < config.length; i += batchSize) {
    const batch = config.slice(i, i + batchSize);
    processBatch(batch);
    Utilities.sleep(2000); // Delay between batches
  }
}
```

### Bot Detection

**Problem:** Sites blocking automated access

**Solutions:**

1. **Add Headers**
   ```javascript
   const options = {
     headers: {
       'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
       'Accept': 'text/html,application/xhtml+xml',
       'Accept-Language': 'en-US,en;q=0.9'
     },
     followRedirects: true
   };
   ```

2. **Add Delays**
   ```javascript
   Utilities.sleep(Math.random() * 3000 + 2000); // 2-5 second random delay
   ```

3. **Use Proxy Services**
   - Consider ScrapingBee, ProxyMesh
   - Implement in content extraction

### Debugging Functions

**Enable Debug Mode:**
```javascript
// Add to any function
function debugFunction() {
  const DEBUG = true;
  
  if (DEBUG) {
    console.log('Input:', arguments);
    console.time('Execution');
  }
  
  // Your code here
  
  if (DEBUG) {
    console.timeEnd('Execution');
    console.log('Output:', result);
  }
}
```

**Log Everything:**
```javascript
function enhancedLogging(action, data) {
  const sheet = getOrCreateMonitorSheet();
  const debugSheet = sheet.getSheetByName('Debug') || 
                     sheet.insertSheet('Debug');
  
  debugSheet.appendRow([
    new Date().toISOString(),
    action,
    JSON.stringify(data),
    Error().stack // Call stack
  ]);
}
```

## 📊 Performance Optimization

### Slow Monitoring

**Solutions:**

1. **Parallel Processing**
   ```javascript
   function parallelFetch(urls) {
     const requests = urls.map(url => ({
       url: url,
       muteHttpExceptions: true
     }));
     
     return UrlFetchApp.fetchAll(requests);
   }
   ```

2. **Cache Results**
   ```javascript
   const cache = CacheService.getScriptCache();
   const cached = cache.get(url);
   if (cached) return JSON.parse(cached);
   
   // Fetch and cache
   const result = fetchContent(url);
   cache.put(url, JSON.stringify(result), 3600); // 1 hour
   ```

3. **Reduce URL Count**
   - Focus on high-value pages
   - Remove redundant URLs
   - Check less frequently

## 🆘 Emergency Procedures

### System Down

1. **Check Google Status**
   - Visit [Google Workspace Status](https://www.google.com/appsstatus)

2. **Verify Script**
   ```bash
   curl -L "YOUR_URL?action=status&token=YOUR_TOKEN"
   ```

3. **Check Quotas**
   - URL Fetch: 20,000/day
   - Email: 500-1,500/day
   - Triggers: 20/user/script

### Data Recovery

**Backup Data:**
```javascript
function backupData() {
  const ss = getOrCreateMonitorSheet();
  const backup = SpreadsheetApp.create(
    'AI Monitor Backup ' + new Date().toISOString()
  );
  
  ss.getSheets().forEach(sheet => {
    sheet.copyTo(backup);
  });
  
  console.log('Backup created:', backup.getUrl());
}
```

### Reset System

**Complete Reset:**
```javascript
function factoryReset() {
  // Clear all properties
  PropertiesService.getScriptProperties().deleteAllProperties();
  
  // Clear triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  console.log('System reset - reconfigure required');
}
```

## 📞 Getting Help

### Diagnostic Information

Run this function and share the output:

```javascript
function getDiagnostics() {
  return {
    system: {
      timezone: Session.getScriptTimeZone(),
      email: Session.getEffectiveUser().getEmail(),
      locale: Session.getActiveUserLocale()
    },
    quotas: {
      urlFetchQuota: UrlFetchApp.getQuota(),
      emailQuota: MailApp.getRemainingDailyQuota(),
      triggerCount: ScriptApp.getProjectTriggers().length
    },
    configuration: {
      companies: getMonitorConfigurations().length,
      hasApiKey: !!PropertiesService.getScriptProperties()
        .getProperty('CLAUDE_API_KEY'),
      hasSheet: !!PropertiesService.getScriptProperties()
        .getProperty('monitorSheetId')
    },
    lastErrors: getRecentLogs().filter(log => log.type === 'error')
  };
}
```

### Support Resources

1. **GitHub Issues**: Report bugs and request features
2. **Documentation**: Review all guides
3. **Logs**: Check Google Sheets logs tab
4. **Stack Overflow**: Tag with `google-apps-script`

## 🔍 Health Checks

Run these regularly:

```bash
# Daily health check
curl -L "YOUR_URL?action=status&token=YOUR_TOKEN" | jq '.health'

# Weekly validation
curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=validateSystem&parameters=[]"

# Monthly cleanup
curl -L "YOUR_URL?action=execute&token=YOUR_TOKEN&functionName=monthlyMaintenance&parameters=[]"
```

---

Remember: Most issues are configuration-related. Double-check your settings before assuming something is broken.