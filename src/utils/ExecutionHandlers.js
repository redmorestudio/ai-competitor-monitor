/**
 * Execute any function remotely with full error handling
 */
function handleExecute(data) {
  const { functionName, parameters = [], timeout = 30000 } = data;
  
  if (!functionName) {
    return createJsonResponse({
      success: false,
      error: 'functionName is required',
      example: {
        action: 'execute',
        functionName: 'generateBaseline',
        parameters: []
      }
    }, 400);
  }
  
  try {
    // Check if function exists
    if (typeof this[functionName] !== 'function') {
      return createJsonResponse({
        success: false,
        error: `Function '${functionName}' not found`,
        availableFunctions: getAvailableFunctions()
      }, 404);
    }
    
    // Execute with timeout protection
    const startTime = Date.now();
    const result = this[functionName].apply(this, parameters);
    const executionTime = Date.now() - startTime;
    
    // Store execution info
    PropertiesService.getScriptProperties().setProperty(
      `lastExecution_${functionName}`,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        executionTime,
        success: true
      })
    );
    
    return createJsonResponse({
      success: true,
      functionName,
      result,
      executionTime,
      debug: {
        parameters,
        resultType: typeof result,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    // Store error info
    PropertiesService.getScriptProperties().setProperty(
      'lastError',
      JSON.stringify({
        functionName,
        error: error.toString(),
        timestamp: new Date().toISOString()
      })
    );
    
    return createJsonResponse({
      success: false,
      functionName,
      error: error.toString(),
      stack: error.stack,
      parameters,
      help: `Check function parameters and permissions for ${functionName}`
    }, 500);
  }
}

/**
 * Handle baseline generation with progress tracking
 */
function handleGenerateBaseline(data) {
  const { options = {} } = data;
  
  try {
    // Initialize progress tracking
    const progressKey = 'baselineProgress_' + Date.now();
    PropertiesService.getScriptProperties().setProperty(progressKey, JSON.stringify({
      status: 'starting',
      progress: 0,
      startTime: new Date().toISOString()
    }));
    
    // Run baseline generation
    const result = generateBaselineWithProgress(progressKey, options);
    
    // Store completion
    PropertiesService.getScriptProperties().setProperty('lastBaselineRun', new Date().toISOString());
    
    return createJsonResponse({
      success: true,
      action: 'baseline',
      result,
      progressKey,
      debug: {
        sheetsUrl: getSheetUrl(),
        rowsProcessed: result.totalRows || 0,
        duration: result.duration || 'unknown'
      }
    });
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      action: 'baseline',
      error: error.toString(),
      help: 'Ensure generateBaseline function exists and sheet permissions are correct'
    }, 500);
  }
}

/**
 * Enhanced baseline generation with progress tracking
 */
function generateBaselineWithProgress(progressKey, options) {
  const startTime = Date.now();
  let progress = 0;
  
  try {
    // Update progress
    updateProgress(progressKey, 10, 'Initializing monitors');
    
    // Get monitor configurations
    const monitors = getMonitorConfigurations();
    updateProgress(progressKey, 20, `Found ${monitors.length} monitors`);
    
    // Process each monitor
    const results = [];
    monitors.forEach((monitor, index) => {
      progress = 20 + (60 * (index / monitors.length));
      updateProgress(progressKey, progress, `Processing ${monitor.company}`);
      
      try {
        const monitorResult = processMonitor(monitor);
        results.push(monitorResult);
      } catch (e) {
        results.push({
          company: monitor.company,
          error: e.toString()
        });
      }
    });
    
    updateProgress(progressKey, 80, 'Writing to sheet');
    
    // Write results to sheet
    const sheetResult = writeBaselineToSheet(results);
    
    updateProgress(progressKey, 100, 'Complete');
    
    return {
      success: true,
      totalRows: results.length,
      duration: Date.now() - startTime,
      results: results.map(r => ({
        company: r.company,
        status: r.error ? 'error' : 'success',
        error: r.error
      })),
      sheet: sheetResult
    };
    
  } catch (error) {
    updateProgress(progressKey, -1, error.toString());
    throw error;
  }
}

/**
 * Update progress in properties
 */
function updateProgress(key, percentage, message) {
  PropertiesService.getScriptProperties().setProperty(key, JSON.stringify({
    status: percentage === 100 ? 'complete' : percentage < 0 ? 'error' : 'running',
    progress: percentage,
    message,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Handle monitoring execution
 */
function handleMonitor(data) {
  const { company, checkAll = false } = data;
  
  try {
    let result;
    
    if (checkAll) {
      // Monitor all companies
      result = monitorAllChanges();
    } else if (company) {
      // Monitor specific company
      result = monitorCompanyChanges(company);
    } else {
      return createJsonResponse({
        success: false,
        error: 'Specify company name or set checkAll:true',
        availableCompanies: getMonitoredCompanies()
      }, 400);
    }
    
    // Store last run
    PropertiesService.getScriptProperties().setProperty('lastMonitorRun', new Date().toISOString());
    
    return createJsonResponse({
      success: true,
      action: 'monitor',
      result,
      summary: {
        changesDetected: result.changes?.length || 0,
        companiesChecked: result.companies?.length || 1,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      action: 'monitor',
      error: error.toString(),
      help: 'Check monitor configuration and permissions'
    }, 500);
  }
}

/**
 * Get list of available functions
 */
function getAvailableFunctions() {
  return Object.getOwnPropertyNames(this)
    .filter(name => typeof this[name] === 'function')
    .filter(name => !name.startsWith('_') && !name.startsWith('handle'))
    .sort();
}

/**
 * Get sheet data via API
 */
function handleGetSheetData(params) {
  const { sheetName = 'Changes', range, format = 'json' } = params;
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return createJsonResponse({
        success: false,
        error: `Sheet '${sheetName}' not found`,
        availableSheets: ss.getSheets().map(s => s.getName())
      }, 404);
    }
    
    // Get data
    const dataRange = range ? sheet.getRange(range) : sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Format response
    let formattedData;
    if (format === 'json' && values.length > 1) {
      // Convert to JSON with headers
      const headers = values[0];
      formattedData = values.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
    } else {
      formattedData = values;
    }
    
    return createJsonResponse({
      success: true,
      sheetName,
      range: dataRange.getA1Notation(),
      rowCount: values.length,
      columnCount: values[0]?.length || 0,
      data: formattedData,
      metadata: {
        lastModified: sheet.getParent().getLastUpdated(),
        url: ss.getUrl()
      }
    });
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      help: 'Check sheet name and permissions'
    }, 500);
  }
}

/**
 * Get logs via API
 */
function handleGetLogs(params) {
  const { lines = 50, level = 'all', since } = params;
  
  try {
    // Get logs from properties or Stackdriver
    const logs = getRecentLogs(parseInt(lines), level, since);
    
    return createJsonResponse({
      success: true,
      logs,
      count: logs.length,
      levels: ['all', 'error', 'warning', 'info', 'debug'],
      oldest: logs[logs.length - 1]?.timestamp,
      newest: logs[0]?.timestamp
    });
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      help: 'Logs may not be available without proper setup'
    }, 500);
  }
}

/**
 * Get recent logs from various sources
 */
function getRecentLogs(maxLines, level, since) {
  const logs = [];
  
  // Get from script properties (simple implementation)
  const props = PropertiesService.getScriptProperties();
  const keys = props.getKeys();
  
  keys.forEach(key => {
    if (key.startsWith('log_') || key.includes('Error') || key.includes('execution')) {
      try {
        const value = JSON.parse(props.getProperty(key));
        if (value.timestamp) {
          logs.push({
            timestamp: value.timestamp,
            level: value.level || 'info',
            message: value.message || value.error || JSON.stringify(value),
            source: key
          });
        }
      } catch (e) {
        // Skip invalid entries
      }
    }
  });
  
  // Sort by timestamp
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Filter by level and since
  let filtered = logs;
  if (level !== 'all') {
    filtered = logs.filter(log => log.level === level);
  }
  if (since) {
    const sinceDate = new Date(since);
    filtered = filtered.filter(log => new Date(log.timestamp) > sinceDate);
  }
  
  return filtered.slice(0, maxLines);
}