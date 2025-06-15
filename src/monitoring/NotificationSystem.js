/**
 * Notification and Reporting Functions
 * Handles alerts and summary reports
 */

/**
 * Send notification for significant changes
 */
function notifySignificantChanges(results) {
  const ss = getOrCreateMonitorSheet();
  const url = ss.getUrl();
  
  // For POC, we'll just log to a notifications sheet
  // In production, this could send emails, Slack messages, etc.
  let notificationSheet = ss.getSheetByName('Notifications');
  
  if (!notificationSheet) {
    notificationSheet = ss.insertSheet('Notifications');
    const headers = [
      'Timestamp',
      'Type',
      'Companies',
      'Changes',
      'Significant',
      'Summary'
    ];
    notificationSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    notificationSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  // Get companies with significant changes
  const companiesWithChanges = results.companies
    .filter(c => c.changes > 0)
    .map(c => c.company);
  
  const summary = `${results.significantChanges} significant changes detected across ${companiesWithChanges.length} companies: ${companiesWithChanges.join(', ')}`;
  
  const row = [
    new Date().toISOString(),
    'significant_changes',
    companiesWithChanges.join(', '),
    results.totalChanges,
    results.significantChanges,
    summary
  ];
  
  notificationSheet.appendRow(row);
  
  // Color the row for visibility
  const lastRow = notificationSheet.getLastRow();
  notificationSheet.getRange(lastRow, 1, 1, headers.length)
    .setBackground('#fff3cd')
    .setBorder(true, true, true, true, false, false);
  
  console.log('Notification logged:', summary);
  
  // Optional: Send email notification
  if (shouldSendEmail()) {
    sendChangeNotificationEmail(results, companiesWithChanges);
  }
}

/**
 * Send email notification (optional)
 */
function sendChangeNotificationEmail(results, companiesWithChanges) {
  const recipient = Session.getActiveUser().getEmail();
  const subject = `AI Monitor Alert: ${results.significantChanges} Significant Changes Detected`;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #0066cc;">AI Competitor Monitor Alert</h2>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">Summary</h3>
        <p><strong>${results.significantChanges}</strong> significant changes detected across <strong>${companiesWithChanges.length}</strong> companies.</p>
      </div>
      
      <h3>Companies with Changes:</h3>
      <ul>
        ${companiesWithChanges.map(company => `<li>${company}</li>`).join('')}
      </ul>
      
      <h3>Statistics:</h3>
      <ul>
        <li>Total URLs checked: ${results.companies.reduce((sum, c) => sum + c.urlsChecked, 0)}</li>
        <li>Total changes detected: ${results.totalChanges}</li>
        <li>Significant changes (relevance ≥ 6): ${results.significantChanges}</li>
      </ul>
      
      <p style="margin-top: 20px;">
        <a href="${getOrCreateMonitorSheet().getUrl()}" 
           style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Details in Google Sheets
        </a>
      </p>
      
      <hr style="margin-top: 30px;">
      <p style="font-size: 12px; color: #666;">
        This is an automated notification from the AI Competitor Monitor POC.<br>
        Monitoring ${results.companies.length} companies across AI and Social Marketing sectors.
      </p>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
    console.log('Email notification sent to:', recipient);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

/**
 * Send weekly summary email
 */
function sendWeeklySummaryEmail(summary) {
  const recipient = Session.getActiveUser().getEmail();
  const subject = 'AI Monitor Weekly Summary Report';
  
  const companiesWithChanges = Array.from(summary.stats.companiesWithChanges);
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #0066cc;">Weekly Competitive Intelligence Summary</h2>
      
      <p style="color: #666;">
        ${new Date(summary.period.start).toLocaleDateString()} - ${new Date(summary.period.end).toLocaleDateString()}
      </p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0;">Key Metrics</h3>
        <table style="width: 100%;">
          <tr>
            <td><strong>Monitoring Runs:</strong></td>
            <td>${summary.stats.totalRuns}</td>
          </tr>
          <tr>
            <td><strong>Total Changes:</strong></td>
            <td>${summary.stats.totalChanges}</td>
          </tr>
          <tr>
            <td><strong>Significant Changes:</strong></td>
            <td>${summary.stats.significantChanges}</td>
          </tr>
          <tr>
            <td><strong>Active Companies:</strong></td>
            <td>${companiesWithChanges.length} of 16</td>
          </tr>
        </table>
      </div>
      
      ${companiesWithChanges.length > 0 ? `
        <h3>Companies with Activity:</h3>
        <ul>
          ${companiesWithChanges.map(company => `<li>${company}</li>`).join('')}
        </ul>
      ` : ''}
      
      ${summary.insights.length > 0 ? `
        <h3>Key Insights:</h3>
        <ul>
          ${summary.insights.map(insight => `<li>${insight}</li>`).join('')}
        </ul>
      ` : ''}
      
      ${summary.recommendations.length > 0 ? `
        <h3>Recommendations:</h3>
        <ul>
          ${summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      ` : ''}
      
      <p style="margin-top: 20px;">
        <a href="${getOrCreateMonitorSheet().getUrl()}" 
           style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Full Report
        </a>
      </p>
      
      <hr style="margin-top: 30px;">
      <p style="font-size: 12px; color: #666;">
        Weekly summary generated by AI Competitor Monitor POC
      </p>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      htmlBody: htmlBody
    });
    console.log('Weekly summary sent to:', recipient);
  } catch (error) {
    console.error('Failed to send weekly summary:', error);
  }
}

/**
 * Save weekly summary to sheet
 */
function saveWeeklySummary(summary) {
  const ss = getOrCreateMonitorSheet();
  let summarySheet = ss.getSheetByName('Weekly Summaries');
  
  if (!summarySheet) {
    summarySheet = ss.insertSheet('Weekly Summaries');
    const headers = [
      'Week Ending',
      'Total Runs',
      'Total Changes', 
      'Significant Changes',
      'Active Companies',
      'Top Insights',
      'Recommendations'
    ];
    summarySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    summarySheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  const row = [
    new Date(summary.period.end).toLocaleDateString(),
    summary.stats.totalRuns,
    summary.stats.totalChanges,
    summary.stats.significantChanges,
    summary.stats.companiesWithChanges.size,
    summary.insights.join('; '),
    summary.recommendations.join('; ')
  ];
  
  summarySheet.appendRow(row);
}

/**
 * Get monitoring logs for date range
 */
function getMonitoringLogs(startDate, endDate) {
  const ss = getOrCreateMonitorSheet();
  const logSheet = ss.getSheetByName('Monitoring Logs');
  
  if (!logSheet || logSheet.getLastRow() <= 1) {
    return [];
  }
  
  const data = logSheet.getRange(2, 1, logSheet.getLastRow() - 1, 6).getValues();
  
  return data
    .filter(row => {
      const timestamp = new Date(row[0]);
      return timestamp >= startDate && timestamp <= endDate;
    })
    .map(row => ({
      timestamp: row[0],
      companiesChecked: row[1],
      totalChanges: row[2],
      significantChanges: row[3],
      errors: row[4],
      companies: row[5] ? JSON.parse(row[5]) : []
    }));
}

/**
 * Get Claude insights for weekly summary
 */
function getWeeklyInsightsFromClaude(summary) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) {
    return {
      insights: ['Claude analysis not configured'],
      recommendations: ['Enable Claude API for deeper insights']
    };
  }
  
  // This would call Claude to analyze the week's activity
  // For POC, returning sample insights
  return {
    insights: [
      `${summary.stats.companiesWithChanges.size} companies showed activity this week`,
      `${summary.stats.significantChanges} changes warranted detailed analysis`,
      'Monitoring system performed reliably with ' + summary.stats.totalRuns + ' successful runs'
    ],
    recommendations: [
      'Continue monitoring current companies',
      'Consider adding priority checks for highly active companies',
      'Review significant changes for strategic insights'
    ]
  };
}

/**
 * Check if email notifications should be sent
 */
function shouldSendEmail() {
  // For POC, check if email notifications are enabled
  const emailEnabled = PropertiesService.getScriptProperties()
    .getProperty('emailNotifications') === 'true';
  return emailEnabled;
}

/**
 * Enable/disable email notifications
 */
function setEmailNotifications(enabled) {
  PropertiesService.getScriptProperties()
    .setProperty('emailNotifications', enabled ? 'true' : 'false');
  
  return {
    success: true,
    emailNotifications: enabled
  };
}