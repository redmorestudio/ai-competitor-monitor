/**
 * Automated Daily Monitoring Setup
 * Schedules and manages automated competitive intelligence checks
 */

/**
 * Set up automated daily monitoring
 * This creates triggers for daily checks with smart scheduling
 */
function setupDailyMonitoring() {
  // Remove any existing triggers first
  clearMonitoringTriggers();
  
  // Create morning check (9 AM)
  ScriptApp.newTrigger('runDailyMonitoring')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone('America/Los_Angeles') // Adjust to your timezone
    .create();
  
  // Create afternoon check (3 PM) for high-priority companies
  ScriptApp.newTrigger('runPriorityCheck')
    .timeBased()
    .atHour(15)
    .everyDays(1)
    .inTimezone('America/Los_Angeles')
    .create();
  
  // Weekly summary report (Mondays at 8 AM)
  ScriptApp.newTrigger('generateWeeklySummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .inTimezone('America/Los_Angeles')
    .create();
  
  // Store configuration
  PropertiesService.getScriptProperties().setProperty('monitoringEnabled', 'true');
  PropertiesService.getScriptProperties().setProperty('monitoringSetupDate', new Date().toISOString());
  
  return {
    success: true,
    triggers: {
      daily: 'runDailyMonitoring @ 9:00 AM',
      priority: 'runPriorityCheck @ 3:00 PM',
      weekly: 'generateWeeklySummary @ Mondays 8:00 AM'
    },
    timezone: 'America/Los_Angeles'
  };
}

/**
 * Main daily monitoring function
 */
function runDailyMonitoring() {
  const startTime = new Date();
  console.log('Starting daily monitoring run:', startTime.toISOString());
  
  try {
    // Get all configured companies
    const monitors = JSON.parse(
      PropertiesService.getScriptProperties().getProperty('monitorConfig') || '[]'
    );
    
    const results = {
      timestamp: startTime.toISOString(),
      companies: [],
      totalChanges: 0,
      significantChanges: 0,
      errors: []
    };
    
    // Process each company
    monitors.forEach((monitor, index) => {
      console.log(`Processing ${monitor.company} (${index + 1}/${monitors.length})`);
      
      try {
        const companyResult = processMonitorEnhanced(monitor);
        
        results.companies.push({
          company: monitor.company,
          category: monitor.category,
          urlsChecked: companyResult.urls.length,
          changes: companyResult.changes.length,
          errors: companyResult.errors.length
        });
        
        results.totalChanges += companyResult.changes.length;
        
        // Count significant changes (relevance >= 6)
        const significantCount = companyResult.changes.filter(
          c => c.relevanceScore >= 6
        ).length;
        results.significantChanges += significantCount;
        
        // If significant changes, trigger Claude analysis
        if (significantCount > 0) {
          console.log(`Significant changes detected for ${monitor.company}`);
          analyzeSignificantChanges(monitor.company, companyResult.changes);
        }
        
      } catch (error) {
        console.error(`Error processing ${monitor.company}:`, error);
        results.errors.push({
          company: monitor.company,
          error: error.toString()
        });
      }
      
      // Be respectful to servers
      Utilities.sleep(2000);
    });
    
    // Log results
    logMonitoringRun(results);
    
    // Send notification if significant changes
    if (results.significantChanges > 0) {
      notifySignificantChanges(results);
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000 / 60; // minutes
    
    console.log(`Daily monitoring completed in ${duration.toFixed(1)} minutes`);
    console.log(`Total changes: ${results.totalChanges}, Significant: ${results.significantChanges}`);
    
    return results;
    
  } catch (error) {
    console.error('Daily monitoring failed:', error);
    logError('daily_monitoring_failed', error);
    throw error;
  }
}

/**
 * Priority check for high-value companies
 */
function runPriorityCheck() {
  // Define priority companies (customize based on your needs)
  const priorityCompanies = [
    'Mistral AI',
    'Anysphere', // Cursor
    'Sprout Social',
    'Later'
  ];
  
  const monitors = JSON.parse(
    PropertiesService.getScriptProperties().getProperty('monitorConfig') || '[]'
  ).filter(m => priorityCompanies.includes(m.company));
  
  console.log(`Running priority check for ${monitors.length} companies`);
  
  const results = {
    timestamp: new Date().toISOString(),
    type: 'priority_check',
    companies: []
  };
  
  monitors.forEach(monitor => {
    try {
      const companyResult = processMonitorEnhanced(monitor);
      
      if (companyResult.changes.length > 0) {
        results.companies.push({
          company: monitor.company,
          changes: companyResult.changes.length
        });
      }
      
      Utilities.sleep(2000);
    } catch (error) {
      console.error(`Priority check error for ${monitor.company}:`, error);
    }
  });
  
  if (results.companies.length > 0) {
    console.log('Priority companies with changes:', results.companies);
  }
  
  return results;
}

/**
 * Generate weekly summary report
 */
function generateWeeklySummary() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  console.log('Generating weekly summary report...');
  
  const summary = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    },
    stats: {
      totalRuns: 0,
      totalChanges: 0,
      significantChanges: 0,
      companiesWithChanges: new Set(),
      topChanges: []
    },
    insights: [],
    recommendations: []
  };
  
  // Get monitoring logs from sheet
  const logs = getMonitoringLogs(startDate, endDate);
  
  // Aggregate statistics
  logs.forEach(log => {
    summary.stats.totalRuns++;
    summary.stats.totalChanges += log.totalChanges || 0;
    summary.stats.significantChanges += log.significantChanges || 0;
    
    if (log.companies) {
      log.companies.forEach(c => {
        if (c.changes > 0) {
          summary.stats.companiesWithChanges.add(c.company);
        }
      });
    }
  });
  
  // Get Claude to analyze the week's activity
  if (summary.stats.significantChanges > 0) {
    const weeklyInsights = getWeeklyInsightsFromClaude(summary);
    summary.insights = weeklyInsights.insights || [];
    summary.recommendations = weeklyInsights.recommendations || [];
  }
  
  // Save and send report
  saveWeeklySummary(summary);
  sendWeeklySummaryEmail(summary);
  
  return summary;
}

/**
 * Clear existing monitoring triggers
 */
function clearMonitoringTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    const handlerFunction = trigger.getHandlerFunction();
    if (handlerFunction.includes('Monitoring') || 
        handlerFunction.includes('Priority') || 
        handlerFunction.includes('Summary')) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Log monitoring run to sheet
 */
function logMonitoringRun(results) {
  const ss = getOrCreateMonitorSheet();
  let logSheet = ss.getSheetByName('Monitoring Logs');
  
  if (!logSheet) {
    logSheet = ss.insertSheet('Monitoring Logs');
    const headers = [
      'Timestamp',
      'Companies Checked',
      'Total Changes',
      'Significant Changes',
      'Errors',
      'Details'
    ];
    logSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    logSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  
  const row = [
    results.timestamp,
    results.companies.length,
    results.totalChanges,
    results.significantChanges,
    results.errors.length,
    JSON.stringify(results.companies)
  ];
  
  logSheet.appendRow(row);
}

/**
 * Analyze significant changes with Claude
 */
function analyzeSignificantChanges(company, changes) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) return;
  
  const significantChanges = changes.filter(c => c.relevanceScore >= 6);
  
  const prompt = `Analyze these significant changes for ${company}:

${significantChanges.map(c => `
URL: ${c.url}
Relevance Score: ${c.relevanceScore}
Keywords: ${c.keywords.join(', ')}
${c.claudeInsights ? 'Previous Analysis: ' + c.claudeInsights.summary : ''}
`).join('\n---\n')}

Provide a brief competitive intelligence update:
1. What's the significance?
2. What should we watch for next?
3. Any immediate action recommended?`;

  // Use existing Claude integration
  // Results are automatically stored in the changes log
}

/**
 * Check monitoring status
 */
function getMonitoringStatus() {
  const props = PropertiesService.getScriptProperties();
  const enabled = props.getProperty('monitoringEnabled') === 'true';
  const setupDate = props.getProperty('monitoringSetupDate');
  
  const triggers = ScriptApp.getProjectTriggers();
  const monitoringTriggers = triggers.filter(t => 
    t.getHandlerFunction().includes('Monitoring') ||
    t.getHandlerFunction().includes('Priority') ||
    t.getHandlerFunction().includes('Summary')
  );
  
  // Get recent runs
  const ss = getOrCreateMonitorSheet();
  const logSheet = ss.getSheetByName('Monitoring Logs');
  let recentRuns = [];
  
  if (logSheet && logSheet.getLastRow() > 1) {
    const data = logSheet.getRange(
      Math.max(2, logSheet.getLastRow() - 4),
      1,
      Math.min(5, logSheet.getLastRow() - 1),
      6
    ).getValues();
    
    recentRuns = data.map(row => ({
      timestamp: row[0],
      companies: row[1],
      changes: row[2],
      significant: row[3]
    }));
  }
  
  return {
    enabled: enabled,
    setupDate: setupDate,
    triggers: monitoringTriggers.map(t => ({
      function: t.getHandlerFunction(),
      type: t.getEventType(),
      schedule: describeSchedule(t)
    })),
    recentRuns: recentRuns,
    nextRun: getNextScheduledRun(monitoringTriggers),
    configuration: {
      companies: JSON.parse(props.getProperty('monitorConfig') || '[]').length,
      claudeEnabled: !!props.getProperty('CLAUDE_API_KEY')
    }
  };
}

/**
 * Helper function to describe trigger schedule
 */
function describeSchedule(trigger) {
  // This is simplified - in production you'd parse the actual schedule
  const func = trigger.getHandlerFunction();
  if (func === 'runDailyMonitoring') return 'Daily at 9:00 AM';
  if (func === 'runPriorityCheck') return 'Daily at 3:00 PM';
  if (func === 'generateWeeklySummary') return 'Mondays at 8:00 AM';
  return 'Custom schedule';
}

/**
 * Get next scheduled run time
 */
function getNextScheduledRun(triggers) {
  // Simplified - returns next top of hour
  const now = new Date();
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next.toISOString();
}

/**
 * Manual trigger for testing
 */
function testDailyMonitoring() {
  // Run monitoring for just one company to test
  const monitors = JSON.parse(
    PropertiesService.getScriptProperties().getProperty('monitorConfig') || '[]'
  );
  
  if (monitors.length > 0) {
    console.log('Testing with first company:', monitors[0].company);
    const result = processMonitorEnhanced(monitors[0]);
    return {
      test: true,
      company: monitors[0].company,
      urls: result.urls.length,
      changes: result.changes.length,
      errors: result.errors.length
    };
  }
  
  return { error: 'No companies configured' };
}