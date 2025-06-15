/**
 * Daily Email Digest System
 * Sends comprehensive daily summaries of monitoring activity
 */

// Get owner email from properties
function getOwnerEmail() {
  return PropertiesService.getScriptProperties().getProperty('ownerEmail') || 'seth@redmore.studio';
}

/**
 * Send daily digest email after monitoring run
 */
function sendDailyDigestEmail(monitoringResults) {
  const recipient = getOwnerEmail();
  const today = new Date().toLocaleDateString();
  const subject = `AI Monitor Daily Digest - ${today}`;
  
  // Get additional context
  const sheet = getOrCreateMonitorSheet();
  const sheetUrl = sheet.getUrl();
  
  // Separate companies by changes
  const companiesWithChanges = monitoringResults.companies
    .filter(c => c.changes > 0)
    .sort((a, b) => b.changes - a.changes);
    
  const companiesNoChanges = monitoringResults.companies
    .filter(c => c.changes === 0 && c.errors === 0);
    
  const companiesWithErrors = monitoringResults.companies
    .filter(c => c.errors > 0);
  
  // Get any Claude insights from today
  const claudeInsights = getClaudeInsightsForToday();
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
        .summary-box { background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #0066cc; }
        .section { margin: 20px 0; }
        .section h2 { color: #0066cc; font-size: 18px; margin-bottom: 10px; }
        .company-card { background-color: #fff; border: 1px solid #e0e0e0; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .company-card.changed { border-left: 4px solid #28a745; }
        .company-card.error { border-left: 4px solid #dc3545; }
        .company-name { font-weight: bold; color: #333; }
        .company-meta { font-size: 12px; color: #666; margin-top: 5px; }
        .insight-box { background-color: #e7f5ff; border-left: 4px solid #0066cc; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .insight-box h3 { margin: 0 0 10px 0; color: #0066cc; font-size: 16px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
        .stat-card { background-color: #fff; border: 1px solid #e0e0e0; padding: 15px; text-align: center; border-radius: 5px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #0066cc; }
        .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
        .cta-button { display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
        .no-changes { color: #666; font-style: italic; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 AI Competitor Monitor</h1>
          <p>Daily Intelligence Digest - ${today}</p>
        </div>
        
        <div class="summary-box">
          <strong>Executive Summary:</strong> Monitored ${monitoringResults.companies.length} companies across AI and Social Marketing sectors. 
          ${monitoringResults.totalChanges > 0 
            ? `Detected <strong>${monitoringResults.totalChanges} changes</strong> with ${monitoringResults.significantChanges} requiring strategic attention.`
            : 'No significant changes detected today.'}
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${monitoringResults.companies.length}</div>
            <div class="stat-label">Companies Monitored</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${monitoringResults.totalChanges}</div>
            <div class="stat-label">Changes Detected</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${monitoringResults.significantChanges}</div>
            <div class="stat-label">High Priority</div>
          </div>
        </div>
        
        ${companiesWithChanges.length > 0 ? `
          <div class="section">
            <h2>🔄 Companies with Changes (${companiesWithChanges.length})</h2>
            ${companiesWithChanges.map(company => `
              <div class="company-card changed">
                <div class="company-name">${company.company}</div>
                <div class="company-meta">
                  ${company.category} • ${company.changes} change${company.changes > 1 ? 's' : ''} detected
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${claudeInsights.length > 0 ? `
          <div class="section">
            <h2>🧠 AI Insights</h2>
            ${claudeInsights.map(insight => `
              <div class="insight-box">
                <h3>${insight.company}</h3>
                <p>${insight.summary}</p>
                ${insight.recommendations ? `
                  <strong>Recommendations:</strong>
                  <ul>
                    ${insight.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="section">
          <h2>✅ Stable Companies (${companiesNoChanges.length})</h2>
          ${companiesNoChanges.length > 0 
            ? `<p class="no-changes">No changes detected for: ${companiesNoChanges.map(c => c.company).join(', ')}</p>`
            : '<p class="no-changes">All monitored companies showed some activity today.</p>'}
        </div>
        
        ${companiesWithErrors.length > 0 ? `
          <div class="section">
            <h2>⚠️ Monitoring Issues (${companiesWithErrors.length})</h2>
            ${companiesWithErrors.map(company => `
              <div class="company-card error">
                <div class="company-name">${company.company}</div>
                <div class="company-meta">${company.errors} error${company.errors > 1 ? 's' : ''} - may need attention</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div style="text-align: center;">
          <a href="${sheetUrl}" class="cta-button">View Detailed Report</a>
        </div>
        
        <div class="footer">
          <p><strong>Coverage:</strong> 6 AI Technology + 10 Social Marketing companies</p>
          <p><strong>Next Run:</strong> Tomorrow at 9:00 AM PST</p>
          <p><strong>Priority Check:</strong> Today at 3:00 PM PST</p>
          <hr style="margin: 10px 0;">
          <p>
            This automated digest is sent daily after the morning monitoring run.<br>
            <a href="${sheetUrl}">Google Sheets Dashboard</a> • 
            <a href="mailto:${recipient}?subject=Unsubscribe from AI Monitor">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Send the email
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
    
    console.log(`Daily digest sent to ${recipient}`);
    logEmailSent('daily_digest', recipient, monitoringResults.totalChanges);
    
  } catch (error) {
    console.error('Failed to send daily digest:', error);
    logError('email_failed', { type: 'daily_digest', error: error.toString() });
  }
}

/**
 * Get Claude insights from today's monitoring
 */
function getClaudeInsightsForToday() {
  const ss = getOrCreateMonitorSheet();
  const claudeSheet = ss.getSheetByName('Claude Analysis');
  
  if (!claudeSheet || claudeSheet.getLastRow() <= 1) {
    return [];
  }
  
  const today = new Date().toDateString();
  const data = claudeSheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find date column
  const dateCol = headers.indexOf('Analysis Date');
  const companyCol = headers.indexOf('Company');
  const summaryCol = headers.indexOf('Summary');
  const recommendationsCol = headers.indexOf('Recommendations');
  
  const todaysInsights = [];
  
  for (let i = 1; i < data.length; i++) {
    const rowDate = new Date(data[i][dateCol]).toDateString();
    if (rowDate === today) {
      todaysInsights.push({
        company: data[i][companyCol],
        summary: data[i][summaryCol],
        recommendations: data[i][recommendationsCol] ? 
          data[i][recommendationsCol].split(';').map(r => r.trim()) : []
      });
    }
  }
  
  return todaysInsights;
}

/**
 * Log email sent
 */
function logEmailSent(type, recipient, changeCount) {
  const ss = getOrCreateMonitorSheet();
  let emailLog = ss.getSheetByName('Email Log');
  
  if (!emailLog) {
    emailLog = ss.insertSheet('Email Log');
    const headers = ['Timestamp', 'Type', 'Recipient', 'Changes', 'Status'];
    emailLog.getRange(1, 1, 1, headers.length).setValues([headers]);
    emailLog.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  emailLog.appendRow([
    new Date().toISOString(),
    type,
    recipient,
    changeCount,
    'sent'
  ]);
}

/**
 * Enhanced daily monitoring with email digest
 */
function runDailyMonitoringWithEmail() {
  // Run the standard monitoring
  const results = runDailyMonitoring();
  
  // Check if email is enabled
  const emailEnabled = PropertiesService.getScriptProperties()
    .getProperty('emailNotifications') === 'true';
    
  const dailyDigestEnabled = PropertiesService.getScriptProperties()
    .getProperty('dailyDigestEnabled') !== 'false'; // Default to true
  
  // Send daily digest if enabled
  if (emailEnabled && dailyDigestEnabled) {
    sendDailyDigestEmail(results);
  }
  
  return results;
}

/**
 * Enable/disable daily digest emails
 */
function setDailyDigestEmails(enabled) {
  PropertiesService.getScriptProperties()
    .setProperty('dailyDigestEnabled', enabled ? 'true' : 'false');
    
  // Make sure email notifications are also enabled
  if (enabled) {
    PropertiesService.getScriptProperties()
      .setProperty('emailNotifications', 'true');
  }
  
  return {
    success: true,
    dailyDigest: enabled,
    message: enabled ? 
      'Daily digest emails enabled. You will receive a summary after each morning run.' :
      'Daily digest emails disabled.'
  };
}

/**
 * Test daily digest email
 */
function testDailyDigestEmail() {
  // Create sample data
  const sampleResults = {
    timestamp: new Date().toISOString(),
    companies: [
      { company: 'Mistral AI', category: 'AI/LLM', urlsChecked: 3, changes: 2, errors: 0 },
      { company: 'Codeium', category: 'AI/Dev Tools', urlsChecked: 3, changes: 0, errors: 0 },
      { company: 'Sprout Social', category: 'Social Media Management', urlsChecked: 4, changes: 1, errors: 0 },
      { company: 'Synthesia', category: 'AI/Video', urlsChecked: 3, changes: 0, errors: 0 },
      { company: 'Brandwatch', category: 'Social Listening', urlsChecked: 4, changes: 0, errors: 1 }
    ],
    totalChanges: 3,
    significantChanges: 1,
    errors: [{ company: 'Brandwatch', error: 'Timeout on blog page' }]
  };
  
  sendDailyDigestEmail(sampleResults);
  
  return {
    success: true,
    message: 'Test email sent to ' + getOwnerEmail()
  };
}

/**
 * Get email preferences
 */
function getEmailPreferences() {
  const props = PropertiesService.getScriptProperties();
  
  return {
    emailNotifications: props.getProperty('emailNotifications') === 'true',
    dailyDigest: props.getProperty('dailyDigestEnabled') !== 'false',
    recipient: getOwnerEmail(),
    schedule: {
      daily: '9:00 AM PST (after monitoring run)',
      weekly: 'Mondays at 8:00 AM PST'
    }
  };
}

/**
 * Update the main trigger to use email version
 */
function updateDailyMonitoringTrigger() {
  // Remove existing daily trigger
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runDailyMonitoring') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger with email
  ScriptApp.newTrigger('runDailyMonitoringWithEmail')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone('America/Los_Angeles')
    .create();
    
  return {
    success: true,
    message: 'Daily monitoring updated to include email digest'
  };
}