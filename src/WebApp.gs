/**
 * AI Monitor Web App - Closed Loop Debug System
 * Provides HTTP endpoints for Claude to control everything remotely
 * Enhanced version with execute in GET for CORS compatibility
 */

// Authentication token (set in script properties)
const AUTH_TOKEN = PropertiesService.getScriptProperties().getProperty('CLAUDE_AUTH_TOKEN') || 'dev-token-change-me';

/**
 * Handle GET requests (now handles all operations to avoid CORS issues)
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const action = params.action || 'status';
    
    // Log all requests
    console.log('GET Request:', action, JSON.stringify(params));
    
    // Verify authentication
    if (params.token !== AUTH_TOKEN) {
      return createJsonResponse({
        success: false,
        error: 'Invalid authentication token',
        help: 'Include ?token=YOUR_TOKEN in the URL'
      }, 401);
    }
    
    // Parse data parameter if present (for complex operations)
    let data = {};
    if (params.data) {
      try {
        data = JSON.parse(params.data);
      } catch (err) {
        // If not JSON, treat as simple string
        data = params.data;
      }
    }
    
    // Route to appropriate handler
    switch(action) {
      case 'status':
        return handleStatus();
        
      case 'logs':
        return handleGetLogs(params);
        
      case 'sheets':
        return handleGetSheetData(params);
        
      case 'config':
        // Handle both GET and update via params
        if (params.section && params.value) {
          return handleUpdateConfig({
            section: params.section,
            value: JSON.parse(params.value)
          });
        }
        return handleGetConfig();
        
      case 'execute':
        // Handle function execution via GET
        if (params.functionName) {
          return handleExecute({
            functionName: params.functionName,
            parameters: params.parameters ? JSON.parse(params.parameters) : []
          });
        } else if (data.functionName) {
          return handleExecute(data);
        } else {
          return createJsonResponse({
            success: false,
            error: 'functionName is required',
            example: '?action=execute&functionName=createMonitorSheet&parameters=[]'
          }, 400);
        }
        
      case 'baseline':
        return handleGenerateBaseline({
          options: params.options ? JSON.parse(params.options) : data.options || {}
        });
        
      case 'monitor':
        return handleMonitor({
          company: params.company || data.company,
          checkAll: params.checkAll === 'true' || data.checkAll,
          options: params.options ? JSON.parse(params.options) : data.options || {}
        });
        
      case 'update':
        return handleUpdateCode({
          functionName: params.functionName || data.functionName,
          code: params.code || data.code
        });
        
      case 'help':
        return handleHelp();
        
      case 'baselineWithClaude':
        return handleBaselineWithClaude(data);
        
      default:
        return createJsonResponse({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['status', 'logs', 'sheets', 'config', 'execute', 'baseline', 'monitor', 'update', 'help', 'baselineWithClaude']
        }, 400);
    }
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const params = e.parameter;
    const postData = JSON.parse(e.postData.contents);
    const action = params.action || postData.action || 'execute';
    
    // Log all requests
    console.log('POST Request:', action, JSON.stringify(postData));
    
    // Verify authentication
    if (params.token !== AUTH_TOKEN && postData.token !== AUTH_TOKEN) {
      return createJsonResponse({
        success: false,
        error: 'Invalid authentication token'
      }, 401);
    }
    
    // Route to appropriate handler
    switch(action) {
      case 'execute':
        return handleExecute(postData);
      case 'baseline':
        return handleGenerateBaseline(postData);
      case 'monitor':
        return handleMonitor(postData);
      case 'update':
        return handleUpdateCode(postData);
      case 'config':
        return handleUpdateConfig(postData);
      default:
        return createJsonResponse({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['execute', 'baseline', 'monitor', 'update', 'config']
        }, 400);
    }
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Create standardized JSON response
 */
function createJsonResponse(data, statusCode = 200) {
  const response = {
    timestamp: new Date().toISOString(),
    success: statusCode < 400,
    ...data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle errors with detailed information
 */
function handleError(error) {
  console.error('Error:', error.toString(), error.stack);
  
  return createJsonResponse({
    success: false,
    error: error.toString(),
    stack: error.stack,
    type: error.name,
    help: getErrorHelp(error),
    timestamp: new Date().toISOString()
  }, 500);
}

/**
 * Get context-aware error help
 */
function getErrorHelp(error) {
  const errorString = error.toString().toLowerCase();
  
  if (errorString.includes('permission')) {
    return 'Check script permissions and sharing settings';
  }
  if (errorString.includes('not found')) {
    return 'Verify the function or resource exists';
  }
  if (errorString.includes('timeout')) {
    return 'Operation took too long - try with smaller data set';
  }
  if (errorString.includes('quota')) {
    return 'Google Apps Script quota exceeded - wait and retry';
  }
  
  return 'Check logs for more details';
}

/**
 * Get comprehensive system status
 */
function handleStatus() {
  const status = {
    system: 'AI Competitor Monitor',
    version: '2.0',
    health: 'operational',
    endpoints: {
      base: ScriptApp.getService().getUrl(),
      example: `${ScriptApp.getService().getUrl()}?token=YOUR_TOKEN&action=status`
    },
    components: checkComponents(),
    lastRun: getLastRunInfo(),
    configuration: {
      monitorsConfigured: getMonitorCount(),
      sheetsConnected: checkSheetsConnection(),
      triggersActive: checkTriggers()
    },
    debug: {
      projectId: Session.getActiveUser().getEmail(),
      timezone: Session.getScriptTimeZone(),
      executionApi: checkExecutionApi()
    }
  };
  
  return createJsonResponse(status);
}

/**
 * Check system components
 */
function checkComponents() {
  const components = {};
  
  // Check for required functions
  const requiredFunctions = [
    'generateBaseline',
    'monitorChanges',
    'getMonitorData',
    'createMonitorSheet'
  ];
  
  requiredFunctions.forEach(func => {
    components[func] = typeof this[func] === 'function' ? 'ready' : 'missing';
  });
  
  return components;
}

/**
 * Get last run information
 */
function getLastRunInfo() {
  try {
    const props = PropertiesService.getScriptProperties();
    return {
      baseline: props.getProperty('lastBaselineRun') || 'never',
      monitor: props.getProperty('lastMonitorRun') || 'never',
      errors: props.getProperty('lastError') || 'none'
    };
  } catch (e) {
    return { error: e.toString() };
  }
}