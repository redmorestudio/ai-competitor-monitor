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
  
  if (!claudeSheet) {
    return [];
  }
  
  const data = claudeSheet.getDataRange().getValues();
  const today = new Date();
  const insights = [];
  
  // Look for insights from today
  for (let i = 1; i < data.length; i++) {
    const timestamp = new Date(data[i][12]); // Analysis Date column
    const daysDiff = (today - timestamp) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 1) { // Within last 24 hours
      insights.push({
        company: data[i][0],
        summary: data[i][1],
        recommendations: data[i][11] ? data[i][11].split('; ') : []
      });
    }
  }
  
  return insights;
}

/**
 * Send immediate change alert email
 */
function sendChangeAlertEmail(change) {
  const recipient = getOwnerEmail();
  const subject = `🚨 AI Monitor Alert: ${change.company} - Significant Change Detected`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert-header { background-color: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .alert-header h1 { margin: 0; font-size: 24px; }
        .change-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .change-details { background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
        .cta-button { display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .score { font-size: 20px; font-weight: bold; color: #dc3545; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert-header">
          <h1>🚨 Significant Change Alert</h1>
          <p>High-priority competitive intelligence detected</p>
        </div>
        
        <div class="change-box">
          <h2>Change Summary</h2>
          <p><strong>Company:</strong> ${change.company}</p>
          <p><strong>URL:</strong> <a href="${change.url}">${change.url}</a></p>
          <p><strong>Detected:</strong> ${new Date(change.detectedAt).toLocaleString()}</p>
          <p><strong>Relevance Score:</strong> <span class="score">${change.relevanceScore}/10</span></p>
        </div>
        
        ${change.claudeInsights ? `
          <div class="change-details">
            <h3>🧠 AI Analysis</h3>
            <p><strong>Summary:</strong> ${change.claudeInsights.summary}</p>
            ${change.claudeInsights.keyChanges ? `
              <p><strong>Key Changes:</strong></p>
              <ul>
                ${change.claudeInsights.keyChanges.map(c => `<li>${c}</li>`).join('')}
              </ul>
            ` : ''}
            ${change.claudeInsights.recommendations ? `
              <p><strong>Recommendations:</strong></p>
              <ul>
                ${change.claudeInsights.recommendations.map(r => `<li>${r}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="change-details">
          <h3>Technical Details</h3>
          <p><strong>Keywords:</strong> ${change.keywords.join(', ')}</p>
          <p><strong>Content Hash:</strong> ${change.newHash}</p>
          <p><strong>Previous Hash:</strong> ${change.oldHash}</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${change.url}" class="cta-button">View Changed Page</a>
        </div>
        
        <div class="footer">
          <p>This alert was triggered because the change scored ${change.relevanceScore}/10 on our relevance scale.</p>
          <p>You can adjust alert thresholds in the management interface.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
    
    console.log(`Alert email sent for ${change.company}`);
    logEmailSent('change_alert', recipient, change.relevanceScore);
    
  } catch (error) {
    console.error('Failed to send alert email:', error);
    logError('email_failed', { type: 'change_alert', error: error.toString() });
  }
}

/**
 * Send weekly summary email
 */
function sendWeeklySummaryEmail() {
  const recipient = getOwnerEmail();
  const today = new Date();
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const subject = `AI Monitor Weekly Summary - ${oneWeekAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`;
  
  // Get weekly statistics
  const weeklyStats = getWeeklyStats(oneWeekAgo, today);
  const topChanges = getTopChanges(oneWeekAgo, today, 10);
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; border: 1px solid #e0e0e0; }
        .stat-number { font-size: 28px; font-weight: bold; color: #28a745; }
        .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
        .change-item { background-color: #fff; border: 1px solid #e0e0e0; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .company-name { font-weight: bold; color: #333; }
        .change-score { float: right; background-color: #dc3545; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Weekly Intelligence Summary</h1>
          <p>${oneWeekAgo.toLocaleDateString()} - ${today.toLocaleDateString()}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${weeklyStats.totalChanges}</div>
            <div class="stat-label">Total Changes</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${weeklyStats.significantChanges}</div>
            <div class="stat-label">High Priority</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${weeklyStats.companiesWithChanges}</div>
            <div class="stat-label">Active Companies</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${weeklyStats.avgScore.toFixed(1)}</div>
            <div class="stat-label">Avg Relevance</div>
          </div>
        </div>
        
        <h2>🔥 Top Changes This Week</h2>
        ${topChanges.map(change => `
          <div class="change-item">
            <span class="change-score">${change.score}/10</span>
            <div class="company-name">${change.company}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
              ${new Date(change.timestamp).toLocaleDateString()} • 
              <a href="${change.url}" style="color: #0066cc;">View Change</a>
            </div>
          </div>
        `).join('')}
        
        <div style="margin-top: 30px; padding: 20px; background-color: #e7f5ff; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #0066cc;">📈 Weekly Insights</h3>
          <p>This week showed ${weeklyStats.totalChanges > weeklyStats.lastWeekChanges ? 'increased' : 'decreased'} activity compared to last week.</p>
          <p><strong>Most Active:</strong> ${weeklyStats.mostActiveCompany}</p>
          <p><strong>Trending Topics:</strong> ${weeklyStats.topKeywords.join(', ')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
    
    console.log('Weekly summary email sent');
    logEmailSent('weekly_summary', recipient, weeklyStats.totalChanges);
    
  } catch (error) {
    console.error('Failed to send weekly summary:', error);
    logError('email_failed', { type: 'weekly_summary', error: error.toString() });
  }
}

/**
 * Get weekly statistics
 */
function getWeeklyStats(startDate, endDate) {
  // This would query the changes sheet for statistics
  // Implementation depends on your data structure
  return {
    totalChanges: 0,
    significantChanges: 0,
    companiesWithChanges: 0,
    avgScore: 0,
    lastWeekChanges: 0,
    mostActiveCompany: '',
    topKeywords: []
  };
}

/**
 * Get top changes for period
 */
function getTopChanges(startDate, endDate, limit = 10) {
  // This would query the changes sheet for top changes
  // Implementation depends on your data structure
  return [];
}

/**
 * Log email sent for tracking
 */
function logEmailSent(type, recipient, metric) {
  try {
    const sheet = getOrCreateMonitorSheet();
    let emailLog = sheet.getSheetByName('EmailLog');
    
    if (!emailLog) {
      emailLog = sheet.insertSheet('EmailLog');
      emailLog.getRange(1, 1, 1, 6).setValues([
        ['Timestamp', 'Type', 'Recipient', 'Metric', 'Status', 'Details']
      ]);
    }
    
    emailLog.appendRow([
      new Date().toISOString(),
      type,
      recipient,
      metric,
      'sent',
      ''
    ]);
    
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

/**
 * Log email error for debugging
 */
function logError(type, details) {
  try {
    const sheet = getOrCreateMonitorSheet();
    let errorLog = sheet.getSheetByName('ErrorLog');
    
    if (!errorLog) {
      errorLog = sheet.insertSheet('ErrorLog');
      errorLog.getRange(1, 1, 1, 4).setValues([
        ['Timestamp', 'Type', 'Details', 'Resolved']
      ]);
    }
    
    errorLog.appendRow([
      new Date().toISOString(),
      type,
      JSON.stringify(details),
      'false'
    ]);
    
  } catch (error) {
    console.error('Failed to log error:', error);
  }
}

/**
 * Test email system
 */
function testEmailSystem() {
  const testResults = {
    dailyDigest: false,
    changeAlert: false,
    errors: []
  };
  
  try {
    // Test daily digest with mock data
    const mockResults = {
      companies: [
        { company: 'Test Company', changes: 2, errors: 0, category: 'AI' }
      ],
      totalChanges: 2,
      significantChanges: 1
    };
    
    sendDailyDigestEmail(mockResults);
    testResults.dailyDigest = true;
    
  } catch (error) {
    testResults.errors.push('Daily digest: ' + error.toString());
  }
  
  try {
    // Test change alert with mock data
    const mockChange = {
      company: 'Test Company',
      url: 'https://example.com',
      relevanceScore: 8,
      detectedAt: new Date().toISOString(),
      keywords: ['test', 'monitoring'],
      newHash: 'test123',
      oldHash: 'test456'
    };
    
    sendChangeAlertEmail(mockChange);
    testResults.changeAlert = true;
    
  } catch (error) {
    testResults.errors.push('Change alert: ' + error.toString());
  }
  
  return testResults;
}

/**
 * Configure email settings
 */
function configureEmailSettings(settings) {
  const props = PropertiesService.getScriptProperties();
  
  if (settings.ownerEmail) {
    props.setProperty('ownerEmail', settings.ownerEmail);
  }
  
  if (settings.dailyDigestEnabled !== undefined) {
    props.setProperty('dailyDigestEnabled', settings.dailyDigestEnabled.toString());
  }
  
  if (settings.alertThreshold !== undefined) {
    props.setProperty('emailAlertThreshold', settings.alertThreshold.toString());
  }
  
  return {
    success: true,
    message: 'Email settings updated',
    settings: {
      ownerEmail: props.getProperty('ownerEmail'),
      dailyDigestEnabled: props.getProperty('dailyDigestEnabled') === 'true',
      alertThreshold: parseInt(props.getProperty('emailAlertThreshold')) || 7
    }
  };
}

/**
 * Get email settings
 */
function getEmailSettings() {
  const props = PropertiesService.getScriptProperties();
  
  return {
    ownerEmail: props.getProperty('ownerEmail') || 'seth@redmore.studio',
    dailyDigestEnabled: props.getProperty('dailyDigestEnabled') !== 'false',
    alertThreshold: parseInt(props.getProperty('emailAlertThreshold')) || 7,
    weeklyDigestEnabled: props.getProperty('weeklyDigestEnabled') === 'true'
  };
}
