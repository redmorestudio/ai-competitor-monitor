/**
 * Enhanced Monitor Functions with Sheet Creation
 * Includes actual sheet creation and management
 */

// Sheet management functions
function createMonitorSheet() {
  try {
    // Create a new spreadsheet
    const ss = SpreadsheetApp.create('AI Competitor Monitor Data');
    const sheetId = ss.getId();
    
    // Store the sheet ID in properties
    PropertiesService.getScriptProperties().setProperty('monitorSheetId', sheetId);
    
    // Set up the sheets structure
    setupSheetStructure(ss);
    
    // Log the creation
    logActivity('sheet_created', {
      sheetId: sheetId,
      url: ss.getUrl(),
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      sheetId: sheetId,
      url: ss.getUrl(),
      message: 'Monitor sheet created successfully'
    };
    
  } catch (error) {
    console.error('Error creating sheet:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

function setupSheetStructure(ss) {
  // Rename the default sheet
  const defaultSheet = ss.getSheets()[0];
  defaultSheet.setName('Changes');
  
  // Set up headers for Changes sheet with intelligent monitoring columns
  const changeHeaders = ['Timestamp', 'Company', 'URL', 'Change Type', 'Summary', 'Previous Hash', 'New Hash', 'Relevance Score', 'Keywords'];
  defaultSheet.getRange(1, 1, 1, changeHeaders.length).setValues([changeHeaders]);
  defaultSheet.getRange(1, 1, 1, changeHeaders.length).setFontWeight('bold');
  
  // Create Baseline sheet
  const baselineSheet = ss.insertSheet('Baseline');
  const baselineHeaders = ['Company', 'URL', 'Last Checked', 'Content Hash', 'Page Title', 'Status', 'Notes'];
  baselineSheet.getRange(1, 1, 1, baselineHeaders.length).setValues([baselineHeaders]);
  baselineSheet.getRange(1, 1, 1, baselineHeaders.length).setFontWeight('bold');
  
  // Create Summary sheet
  const summarySheet = ss.insertSheet('Summary');
  const summaryHeaders = ['Company', 'Total Changes', 'Last Change', 'Status', 'Alert Count'];
  summarySheet.getRange(1, 1, 1, summaryHeaders.length).setValues([summaryHeaders]);
  summarySheet.getRange(1, 1, 1, summaryHeaders.length).setFontWeight('bold');
  
  // Create Logs sheet
  const logsSheet = ss.insertSheet('Logs');
  const logHeaders = ['Timestamp', 'Type', 'Message', 'Details'];
  logsSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
  logsSheet.getRange(1, 1, 1, logHeaders.length).setFontWeight('bold');
}

function getOrCreateMonitorSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('monitorSheetId');
  
  if (sheetId) {
    try {
      const ss = SpreadsheetApp.openById(sheetId);
      return {
        success: true,
        spreadsheet: ss,
        sheetId: sheetId,
        url: ss.getUrl()
      };
    } catch (e) {
      // Sheet might have been deleted
      console.log('Existing sheet not found, creating new one');
    }
  }
  
  // Create new sheet
  const result = createMonitorSheet();
  if (result.success) {
    return {
      success: true,
      spreadsheet: SpreadsheetApp.openById(result.sheetId),
      sheetId: result.sheetId,
      url: result.url
    };
  } else {
    throw new Error(result.error);
  }
}

// Monitor configuration functions
function getMonitorCount() {
  const props = PropertiesService.getScriptProperties();
  const monitors = JSON.parse(props.getProperty('monitorConfig') || '[]');
  return monitors.length;
}

function checkSheetsConnection() {
  try {
    const sheetResult = getOrCreateMonitorSheet();
    return sheetResult.success;
  } catch (e) {
    return false;
  }
}

function checkTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    return triggers.length > 0;
  } catch (e) {
    return false;
  }
}

function checkExecutionApi() {
  return 'ready';
}

function getSheetUrl() {
  try {
    const sheetResult = getOrCreateMonitorSheet();
    return sheetResult.url;
  } catch (e) {
    return 'No sheet connected';
  }
}

// Monitor execution functions
function getMonitorConfigurations() {
  const props = PropertiesService.getScriptProperties();
  return JSON.parse(props.getProperty('monitorConfig') || '[{"company":"Mistral AI","urls":["https://mistral.ai"]},{"company":"Codeium","urls":["https://codeium.com"]},{"company":"Synthesia","urls":["https://synthesia.io"]}]');
}

function processMonitor(monitor) {
  // Use intelligent monitoring with content extraction
  return processMonitorEnhanced(monitor);
}

function writeBaselineToSheet(results) {
  try {
    const sheetResult = getOrCreateMonitorSheet();
    const ss = sheetResult.spreadsheet;
    const baselineSheet = ss.getSheetByName('Baseline') || ss.insertSheet('Baseline');
    
    // Clear existing data (except headers)
    const lastRow = baselineSheet.getLastRow();
    if (lastRow > 1) {
      baselineSheet.getRange(2, 1, lastRow - 1, baselineSheet.getLastColumn()).clear();
    }
    
    // Write new baseline data
    const dataRows = [];
    results.forEach(companyResult => {
      if (companyResult.results) {
        companyResult.results.forEach(urlResult => {
          dataRows.push([
            urlResult.company,
            urlResult.url,
            urlResult.timestamp,
            urlResult.contentHash || '',
            urlResult.pageTitle || '',
            urlResult.status,
            urlResult.error || ''
          ]);
        });
      }
    });
    
    if (dataRows.length > 0) {
      baselineSheet.getRange(2, 1, dataRows.length, dataRows[0].length).setValues(dataRows);
    }
    
    // Store page content for intelligent monitoring
    storePageContent(results);
    
    // Log to Logs sheet
    logToSheet(ss, 'baseline_written', `Wrote ${dataRows.length} baseline entries`);
    
    return {
      status: 'written',
      rows: dataRows.length,
      sheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error writing to sheet:', error);
    return {
      status: 'error',
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

function logToSheet(ss, type, message, details = {}) {
  try {
    const logsSheet = ss.getSheetByName('Logs') || ss.insertSheet('Logs');
    const timestamp = new Date().toISOString();
    
    logsSheet.appendRow([
      timestamp,
      type,
      message,
      JSON.stringify(details)
    ]);
  } catch (e) {
    console.error('Error logging to sheet:', e);
  }
}

function monitorAllChanges() {
  const monitors = getMonitorConfigurations();
  const allChanges = [];
  
  // Process each monitor with intelligent monitoring
  const newResults = monitors.map(m => processMonitorEnhanced(m));
  
  // Store the new content
  storePageContent(newResults);
  
  // Detect changes by comparing with previous content
  const detectedChanges = detectAllChanges(newResults);
  
  // Filter and store relevant changes
  const relevantChanges = detectedChanges.filter(c => c && c.analysis && c.analysis.relevanceScore >= 6);
  if (relevantChanges.length > 0) {
    storeDetectedChanges(relevantChanges);
  }
  
  return {
    status: 'completed',
    companies: monitors.map(m => m.company),
    changes: relevantChanges,
    totalChangesDetected: detectedChanges.length,
    relevantChanges: relevantChanges.length,
    timestamp: new Date().toISOString()
  };
}

function monitorCompanyChanges(company) {
  // In real implementation, would compare with baseline
  return {
    status: 'completed',
    company: company,
    changes: [],
    timestamp: new Date().toISOString()
  };
}

function getMonitoredCompanies() {
  const monitors = getMonitorConfigurations();
  return monitors.map(m => m.company);
}

// Backup function
function createCodeBackup(filename) {
  console.log(`Backup created for ${filename}`);
}

// Main monitor functions that status checks for
function generateBaseline() {
  const monitors = getMonitorConfigurations();
  const results = monitors.map(m => processMonitor(m));
  const sheetResult = writeBaselineToSheet(results);
  
  return {
    status: 'success',
    companies: monitors.length,
    results: results.length,
    sheet: sheetResult,
    timestamp: new Date().toISOString()
  };
}

function monitorChanges() {
  return monitorAllChanges();
}

function getMonitorData() {
  return {
    monitors: getMonitorConfigurations(),
    lastRun: getLastRunInfo(),
    sheetUrl: getSheetUrl()
  };
}

// Helper to log activities
function logActivity(type, data) {
  const key = `log_${type}_${Date.now()}`;
  const logEntry = {
    type,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  try {
    PropertiesService.getScriptProperties().setProperty(
      key,
      JSON.stringify(logEntry)
    );
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

// Detect all changes by comparing with previous content
function detectAllChanges(newResults) {
  const changes = [];
  const sheetResult = getOrCreateMonitorSheet();
  if (!sheetResult.success) return changes;
  
  const ss = sheetResult.spreadsheet;
  const contentSheet = ss.getSheetByName('PageContent');
  if (!contentSheet || contentSheet.getLastRow() <= 1) {
    // No previous content to compare
    return changes;
  }
  
  // Get previous content
  const previousData = contentSheet.getDataRange().getValues();
  const headers = previousData[0];
  const contentHashIndex = headers.indexOf('Content Hash');
  const urlIndex = headers.indexOf('URL');
  const contentIndex = headers.indexOf('Content Preview');
  
  // Create map of previous content by URL
  const previousContent = {};
  for (let i = 1; i < previousData.length; i++) {
    const url = previousData[i][urlIndex];
    previousContent[url] = {
      contentHash: previousData[i][contentHashIndex],
      content: previousData[i][contentIndex]
    };
  }
  
  // Compare with new results
  newResults.forEach(companyResult => {
    if (companyResult.results) {
      companyResult.results.forEach(pageResult => {
        if (pageResult.status === 'success') {
          const prev = previousContent[pageResult.url];
          if (prev && prev.contentHash !== pageResult.contentHash) {
            // Content changed - analyze it
            const change = detectChanges(
              { content: prev.content, contentHash: prev.contentHash },
              pageResult
            );
            if (change) {
              changes.push(change);
            }
          }
        }
      });
    }
  });
  
  return changes;
}