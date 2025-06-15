/**
 * Fixed Email Functions with proper email configuration
 * Email: seth@redmore.studio
 */

// Store the owner email in properties
function setOwnerEmail() {
  PropertiesService.getScriptProperties().setProperty('ownerEmail', 'seth@redmore.studio');
  return { success: true, email: 'seth@redmore.studio' };
}

// Get owner email from properties
function getOwnerEmail() {
  return PropertiesService.getScriptProperties().getProperty('ownerEmail') || 'seth@redmore.studio';
}

// Fixed test email function
function sendTestEmailDirect() {
  const recipient = getOwnerEmail();
  const today = new Date().toLocaleDateString();
  const subject = `AI Monitor Test Email - ${today}`;
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/18sv6UITXpNu0oMDjMkuQCBHjLYwjWNm21OmLNNwDQlM/edit';
  
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
        .company-name { font-weight: bold; color: #333; }
        .company-meta { font-size: 12px; color: #666; margin-top: 5px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0; }
        .stat-card { background-color: #fff; border: 1px solid #e0e0e0; padding: 15px; text-align: center; border-radius: 5px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #0066cc; }
        .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
        .cta-button { display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 AI Competitor Monitor - Test Email</h1>
          <p>Testing Daily Intelligence Digest - ${today}</p>
        </div>
        
        <div class="summary-box">
          <strong>🎉 Success!</strong> Your AI Monitor email system is working perfectly. 
          This is what your daily digest emails will look like starting tomorrow at 9:15 AM PST.
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">16</div>
            <div class="stat-label">Companies Monitored</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">58</div>
            <div class="stat-label">URLs Tracked</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">Daily</div>
            <div class="stat-label">Email Frequency</div>
          </div>
        </div>
        
        <div class="section">
          <h2>📊 Sample Monitoring Results</h2>
          <div class="company-card changed">
            <div class="company-name">Mistral AI</div>
            <div class="company-meta">AI/LLM • 2 changes detected • New model announcement</div>
          </div>
          <div class="company-card changed">
            <div class="company-name">Sprout Social</div>
            <div class="company-meta">Social Media Management • 1 change detected • Pricing update</div>
          </div>
          <div class="company-card">
            <div class="company-name">Codeium</div>
            <div class="company-meta">AI/Dev Tools • No changes • Stable</div>
          </div>
        </div>
        
        <div class="section">
          <h2>🧠 What You'll Receive Daily</h2>
          <ul>
            <li><strong>Executive Summary</strong> - Key metrics and highlights at a glance</li>
            <li><strong>Change Detection</strong> - Companies with significant updates</li>
            <li><strong>AI Insights</strong> - Claude's analysis of competitive implications</li>
            <li><strong>Direct Links</strong> - Quick access to detailed reports</li>
            <li><strong>Strategic Recommendations</strong> - When important patterns emerge</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${sheetUrl}" class="cta-button">View Your Dashboard</a>
        </div>
        
        <div class="footer">
          <p><strong>Email Schedule:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li>📅 <strong>Daily Digest:</strong> 9:15 AM PST (after monitoring run)</li>
            <li>📊 <strong>Weekly Summary:</strong> Mondays at 8:00 AM PST</li>
            <li>🚨 <strong>Priority Alerts:</strong> Real-time for significant changes</li>
          </ul>
          <p><strong>Coverage:</strong> 6 AI Technology + 10 Social Marketing companies</p>
          <hr style="margin: 10px 0;">
          <p style="color: #28a745;">
            ✅ Email will be sent to: ${recipient}<br>
            Automated monitoring begins tomorrow morning.
          </p>
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
    
    return {
      success: true,
      message: 'Test email sent successfully!',
      recipient: recipient,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to send test email',
      recipient: recipient
    };
  }
}

// Update the daily digest email function to use fixed email
function sendDailyDigestEmailFixed(monitoringResults) {
  const recipient = getOwnerEmail();
  const today = new Date().toLocaleDateString();
  const subject = `AI Monitor Daily Digest - ${today}`;
  
  // Get sheet URL
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/18sv6UITXpNu0oMDjMkuQCBHjLYwjWNm21OmLNNwDQlM/edit';
  
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
            Sent to: ${recipient}
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
    logActivity('email_failed', { type: 'daily_digest', error: error.toString() });
  }
}

// Test the email configuration
function testEmailConfig() {
  setOwnerEmail();
  const email = getOwnerEmail();
  return {
    success: true,
    configuredEmail: email,
    message: `Email system configured for ${email}`
  };
}
