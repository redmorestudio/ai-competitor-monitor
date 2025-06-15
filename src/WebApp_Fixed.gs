/**
 * AI Monitor Web App - Fixed Version
 * Provides both HTML interface and API endpoints
 */

// Authentication token (set in script properties)
const AUTH_TOKEN = PropertiesService.getScriptProperties().getProperty('CLAUDE_AUTH_TOKEN') || 'dev-token-change-me';

/**
 * Serve HTML interface or handle API requests
 */
function doGet(e) {
  try {
    const params = e.parameter;
    
    // If no parameters, serve the HTML interface
    if (!params.action && !params.token) {
      return serveHtmlInterface();
    }
    
    const action = params.action || 'status';
    
    // Log all requests
    console.log('GET Request:', action, JSON.stringify(params));
    
    // Verify authentication for API calls
    if (params.token !== AUTH_TOKEN) {
      return createJsonResponse({
        success: false,
        error: 'Invalid authentication token',
        help: 'Include ?token=YOUR_TOKEN in the URL'
      }, 401);
    }
    
    // Route to appropriate handler
    switch(action) {
      case 'status':
        return handleStatus();
        
      case 'config':
        return handleGetConfig();
        
      case 'baseline':
        return handleGenerateBaseline({});
        
      case 'monitor':
        return handleMonitor({
          checkAll: params.checkAll === 'true'
        });
        
      case 'logs':
        return handleGetLogs(params);
        
      case 'execute':
        if (params.functionName) {
          return handleExecute({
            functionName: params.functionName,
            parameters: params.parameters ? JSON.parse(params.parameters) : []
          });
        } else {
          return createJsonResponse({
            success: false,
            error: 'functionName is required'
          }, 400);
        }
        
      default:
        return createJsonResponse({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['status', 'config', 'baseline', 'monitor', 'logs', 'execute']
        }, 400);
    }
    
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Serve the HTML interface
 */
function serveHtmlInterface() {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>AI Competitor Monitor</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #eee;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 40px 0;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-bottom: 2px solid #0f4c75;
        }
        h1 {
            color: #3bb4f1;
            font-size: 2.5em;
            margin: 0;
        }
        .subtitle {
            color: #888;
            margin-top: 10px;
        }
        .auth-section {
            background: #16213e;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #0f4c75;
        }
        .auth-section h2 {
            margin-top: 0;
        }
        input[type="password"] {
            background: #1a1a2e;
            border: 1px solid #0f4c75;
            color: #eee;
            padding: 10px;
            border-radius: 4px;
            width: 200px;
            margin-right: 10px;
        }
        button {
            background: #3bb4f1;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s;
        }
        button:hover {
            background: #2a9fd8;
        }
        .controls {
            display: flex;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .status-card {
            background: #16213e;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #0f4c75;
            text-align: center;
        }
        .status-value {
            font-size: 2em;
            color: #3bb4f1;
            margin: 10px 0;
        }
        .status-label {
            color: #888;
            text-transform: uppercase;
            font-size: 0.9em;
        }
        .error {
            background: #c0392b;
            color: white;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .success {
            background: #27ae60;
            color: white;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .log-area {
            background: #0f0f23;
            border: 1px solid #0f4c75;
            border-radius: 4px;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
            margin: 20px 0;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Competitor Monitor</h1>
        <p class="subtitle">Real-time Intelligence on AI Industry Changes</p>
    </div>
    
    <div class="container">
        <div class="auth-section">
            <h2>Authentication</h2>
            <p>Enter your API token to access the monitoring system:</p>
            <input type="password" id="apiToken" placeholder="Enter API token" value="dev-token-change-me">
            <button onclick="saveToken()">Save Token</button>
        </div>
        
        <div class="controls">
            <button onclick="checkStatus()">Check Status</button>
            <button onclick="generateBaseline()">Generate Baseline</button>
            <button onclick="runMonitorCheck()">Run Monitor Check</button>
            <button onclick="getConfiguration()">Get Configuration</button>
            <button onclick="viewLogs()">View Logs</button>
        </div>
        
        <h2>System Status</h2>
        <div class="status-grid">
            <div class="status-card">
                <div class="status-value" id="systemStatus">checking...</div>
                <div class="status-label">STATUS</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="companyCount">0</div>
                <div class="status-label">COMPANIES</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="urlCount">0</div>
                <div class="status-label">URLS TRACKED</div>
            </div>
            <div class="status-card">
                <div class="status-value" id="lastCheck">Never</div>
                <div class="status-label">LAST CHECK</div>
            </div>
        </div>
        
        <div id="messageArea"></div>
        
        <div class="log-area hidden" id="logArea"></div>
    </div>
    
    <script>
        const API_BASE = window.location.href.split('?')[0];
        let apiToken = 'dev-token-change-me';
        
        function saveToken() {
            apiToken = document.getElementById('apiToken').value;
            showMessage('Token saved', 'success');
            checkStatus();
        }
        
        function showMessage(message, type = 'error') {
            const messageArea = document.getElementById('messageArea');
            messageArea.innerHTML = '<div class="' + type + '">' + message + '</div>';
            if (type === 'success') {
                setTimeout(function() { messageArea.innerHTML = ''; }, 3000);
            }
        }
        
        async function makeRequest(action, params = {}) {
            try {
                const url = new URL(API_BASE);
                url.searchParams.append('token', apiToken);
                url.searchParams.append('action', action);
                Object.keys(params).forEach(function(key) {
                    url.searchParams.append(key, typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]);
                });
                
                const response = await fetch(url.toString());
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Request failed');
                }
                
                return data;
            } catch (error) {
                showMessage('Error: ' + error.message);
                throw error;
            }
        }
        
        async function checkStatus() {
            try {
                const data = await makeRequest('status');
                document.getElementById('systemStatus').textContent = data.health || 'operational';
                
                if (data.configuration) {
                    document.getElementById('companyCount').textContent = data.configuration.monitorsConfigured || 0;
                }
                
                if (data.lastRun && data.lastRun.monitor !== 'never') {
                    const date = new Date(data.lastRun.monitor);
                    document.getElementById('lastCheck').textContent = date.toLocaleString();
                }
                
                showMessage('Status check completed', 'success');
                getConfiguration();
            } catch (error) {
                document.getElementById('systemStatus').textContent = 'error';
            }
        }
        
        async function generateBaseline() {
            try {
                showMessage('Generating baseline... this may take a few minutes', 'success');
                const data = await makeRequest('baseline');
                showMessage('Baseline generated: ' + (data.companies || 0) + ' companies processed', 'success');
                checkStatus();
            } catch (error) {
                showMessage('Baseline generation failed: ' + error.message);
            }
        }
        
        async function runMonitorCheck() {
            try {
                showMessage('Running monitor check... this may take a few minutes', 'success');
                const data = await makeRequest('monitor', { checkAll: true });
                showMessage('Monitor check completed: ' + (data.relevantChanges || 0) + ' changes detected', 'success');
                checkStatus();
            } catch (error) {
                showMessage('Monitor check failed: ' + error.message);
            }
        }
        
        async function getConfiguration() {
            try {
                const data = await makeRequest('config');
                if (data.monitors) {
                    const totalUrls = data.monitors.reduce(function(sum, m) {
                        return sum + (m.urls ? m.urls.length : 0);
                    }, 0);
                    document.getElementById('urlCount').textContent = totalUrls;
                    document.getElementById('companyCount').textContent = data.monitors.length;
                }
            } catch (error) {
                console.error('Config error:', error);
            }
        }
        
        async function viewLogs() {
            try {
                const data = await makeRequest('logs', { limit: 50 });
                const logArea = document.getElementById('logArea');
                logArea.classList.remove('hidden');
                
                if (data.logs && data.logs.length > 0) {
                    logArea.innerHTML = data.logs.map(function(log) {
                        return '[' + log.timestamp + '] ' + log.type + ': ' + log.message;
                    }).join('\\n');
                } else {
                    logArea.innerHTML = 'No logs available';
                }
            } catch (error) {
                showMessage('Failed to load logs: ' + error.message);
            }
        }
        
        // Initial load
        checkStatus();
    </script>
</body>
</html>`;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('AI Competitor Monitor')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
    timestamp: new Date().toISOString()
  }, 500);
}

/**
 * Get comprehensive system status
 */
function handleStatus() {
  try {
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
      }
    };
    
    return createJsonResponse(status);
  } catch (error) {
    return handleError(error);
  }
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

/**
 * Handle baseline generation
 */
function handleGenerateBaseline(data) {
  try {
    // Apply configuration if not already done
    const currentConfig = PropertiesService.getScriptProperties().getProperty('monitorConfig');
    if (!currentConfig || currentConfig === '[]') {
      applyEnhancedMonitorConfig();
    }
    
    const result = generateBaseline();
    PropertiesService.getScriptProperties().setProperty('lastBaselineRun', new Date().toISOString());
    return createJsonResponse(result);
  } catch (error) {
    PropertiesService.getScriptProperties().setProperty('lastError', error.toString());
    return handleError(error);
  }
}

/**
 * Handle monitoring
 */
function handleMonitor(data) {
  try {
    const result = data.checkAll ? monitorAllChanges() : monitorCompanyChanges(data.company);
    PropertiesService.getScriptProperties().setProperty('lastMonitorRun', new Date().toISOString());
    return createJsonResponse(result);
  } catch (error) {
    PropertiesService.getScriptProperties().setProperty('lastError', error.toString());
    return handleError(error);
  }
}

/**
 * Handle configuration retrieval
 */
function handleGetConfig() {
  try {
    // Ensure configuration exists
    const currentConfig = PropertiesService.getScriptProperties().getProperty('monitorConfig');
    if (!currentConfig || currentConfig === '[]') {
      applyEnhancedMonitorConfig();
    }
    
    const config = getMonitorData();
    return createJsonResponse({
      success: true,
      ...config
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle log retrieval
 */
function handleGetLogs(params) {
  try {
    const limit = parseInt(params.limit) || 100;
    const props = PropertiesService.getScriptProperties();
    const keys = props.getKeys();
    
    const logs = [];
    keys.forEach(key => {
      if (key.startsWith('log_')) {
        try {
          const log = JSON.parse(props.getProperty(key));
          logs.push(log);
        } catch (e) {
          // Skip invalid logs
        }
      }
    });
    
    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return createJsonResponse({
      success: true,
      logs: logs.slice(0, limit),
      total: logs.length
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle function execution
 */
function handleExecute(data) {
  try {
    const { functionName, parameters = [] } = data;
    
    if (!functionName) {
      throw new Error('functionName is required');
    }
    
    const func = this[functionName];
    if (typeof func !== 'function') {
      throw new Error(`Function '${functionName}' not found`);
    }
    
    const result = func.apply(this, parameters);
    
    return createJsonResponse({
      success: true,
      functionName,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return handleError(error);
  }
}
