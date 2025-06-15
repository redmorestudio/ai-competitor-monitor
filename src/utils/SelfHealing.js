/**
 * Update code dynamically via API
 */
function handleUpdateCode(data) {
  const { filename, content, backup = true } = data;
  
  if (!filename || !content) {
    return createJsonResponse({
      success: false,
      error: 'Both filename and content are required',
      example: {
        action: 'update',
        filename: 'Code.gs',
        content: '// Your code here',
        backup: true
      }
    }, 400);
  }
  
  try {
    // Create backup if requested
    if (backup) {
      createCodeBackup(filename);
    }
    
    // This is a placeholder - actual code update would require
    // using the Apps Script API or clasp
    const updateResult = {
      filename,
      status: 'simulated',
      message: 'Code update simulation - would update via clasp or API',
      backup: backup ? 'created' : 'skipped',
      timestamp: new Date().toISOString()
    };
    
    // Log the update
    logActivity('code_update', {
      filename,
      size: content.length,
      backup
    });
    
    return createJsonResponse({
      success: true,
      action: 'update',
      result: updateResult,
      next: 'Deploy via clasp push or Apps Script API'
    });
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      action: 'update',
      error: error.toString(),
      help: 'Code updates require Apps Script API or clasp integration'
    }, 500);
  }
}

/**
 * Self-healing error recovery system
 */
function enableSelfHealing() {
  // Set up error recovery mechanisms
  const healingConfig = {
    retryFailedOperations: true,
    maxRetries: 3,
    retryDelay: 1000,
    autoRecover: true,
    notifyOnFailure: true
  };
  
  PropertiesService.getScriptProperties().setProperty(
    'selfHealingConfig',
    JSON.stringify(healingConfig)
  );
  
  return healingConfig;
}

/**
 * Wrap functions with self-healing capability
 */
function withSelfHealing(functionName, func, context = this) {
  return function(...args) {
    const config = JSON.parse(
      PropertiesService.getScriptProperties().getProperty('selfHealingConfig') || '{}'
    );
    
    let lastError;
    let attempts = 0;
    
    while (attempts < (config.maxRetries || 3)) {
      attempts++;
      
      try {
        // Attempt to execute
        const result = func.apply(context, args);
        
        // Success - clear any error state
        if (attempts > 1) {
          logActivity('self_healing_success', {
            functionName,
            attempts,
            recovered: true
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Log the error
        logActivity('self_healing_attempt', {
          functionName,
          attempt: attempts,
          error: error.toString()
        });
        
        // Check if we should retry
        if (attempts < config.maxRetries && shouldRetry(error)) {
          // Wait before retry with exponential backoff
          Utilities.sleep(config.retryDelay * attempts);
          continue;
        }
        
        // Give up
        break;
      }
    }
    
    // All attempts failed
    logActivity('self_healing_failed', {
      functionName,
      attempts,
      finalError: lastError.toString()
    });
    
    throw lastError;
  };
}

/**
 * Determine if error is retryable
 */
function shouldRetry(error) {
  const errorString = error.toString().toLowerCase();
  
  // Retry on temporary errors
  const retryableErrors = [
    'timeout',
    'temporary',
    'quota',
    'rate limit',
    'service unavailable',
    '503',
    '429',
    'lock'
  ];
  
  return retryableErrors.some(term => errorString.includes(term));
}

/**
 * Get current configuration
 */
function handleGetConfig() {
  try {
    const props = PropertiesService.getScriptProperties();
    const config = {
      monitors: JSON.parse(props.getProperty('monitorConfig') || '[]'),
      settings: {
        selfHealing: JSON.parse(props.getProperty('selfHealingConfig') || '{}'),
        notifications: JSON.parse(props.getProperty('notificationConfig') || '{}'),
        schedule: JSON.parse(props.getProperty('scheduleConfig') || '{}')
      },
      auth: {
        tokenSet: !!props.getProperty('CLAUDE_AUTH_TOKEN'),
        webhooks: JSON.parse(props.getProperty('webhooks') || '[]')
      },
      system: {
        version: '2.0',
        lastDeploy: props.getProperty('lastDeploy') || 'unknown',
        environment: 'production'
      }
    };
    
    return createJsonResponse({
      success: true,
      config,
      editable: [
        'monitors',
        'settings.selfHealing',
        'settings.notifications',
        'settings.schedule'
      ]
    });
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    }, 500);
  }
}

/**
 * Update configuration
 */
function handleUpdateConfig(data) {
  const { section, value } = data;
  
  if (!section || value === undefined) {
    return createJsonResponse({
      success: false,
      error: 'Both section and value are required',
      example: {
        action: 'config',
        section: 'monitors',
        value: [{ company: 'Example', urls: ['https://example.com'] }]
      }
    }, 400);
  }
  
  try {
    const props = PropertiesService.getScriptProperties();
    
    // Validate section
    const validSections = [
      'monitorConfig',
      'selfHealingConfig',
      'notificationConfig',
      'scheduleConfig',
      'CLAUDE_AUTH_TOKEN'
    ];
    
    if (!validSections.includes(section)) {
      return createJsonResponse({
        success: false,
        error: `Invalid section: ${section}`,
        validSections
      }, 400);
    }
    
    // Update configuration
    if (typeof value === 'object') {
      props.setProperty(section, JSON.stringify(value));
    } else {
      props.setProperty(section, value.toString());
    }
    
    // Log the change
    logActivity('config_update', {
      section,
      timestamp: new Date().toISOString()
    });
    
    return createJsonResponse({
      success: true,
      action: 'config_update',
      section,
      updated: true,
      message: `Configuration section '${section}' updated successfully`
    });
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    }, 500);
  }
}

/**
 * Provide comprehensive API documentation
 */
function handleHelp() {
  const baseUrl = ScriptApp.getService().getUrl();
  
  const help = {
    title: 'AI Monitor Web App API',
    version: '2.0',
    description: 'Closed-loop debug system for AI Competitor Monitor',
    authentication: {
      method: 'Token in query parameter',
      parameter: 'token',
      example: `${baseUrl}?token=YOUR_TOKEN&action=status`
    },
    endpoints: {
      GET: {
        status: {
          description: 'Get system status and health check',
          example: `${baseUrl}?token=YOUR_TOKEN&action=status`
        },
        logs: {
          description: 'Retrieve system logs',
          parameters: {
            lines: 'Number of log lines (default: 50)',
            level: 'Log level filter: all|error|warning|info|debug',
            since: 'ISO timestamp to get logs after'
          },
          example: `${baseUrl}?token=YOUR_TOKEN&action=logs&lines=100&level=error`
        },
        sheets: {
          description: 'Get Google Sheets data',
          parameters: {
            sheetName: 'Name of sheet (default: Changes)',
            range: 'A1 notation range (optional)',
            format: 'Response format: json|raw'
          },
          example: `${baseUrl}?token=YOUR_TOKEN&action=sheets&sheetName=Changes&format=json`
        },
        config: {
          description: 'Get current configuration',
          example: `${baseUrl}?token=YOUR_TOKEN&action=config`
        }
      },
      POST: {
        execute: {
          description: 'Execute any function remotely',
          body: {
            action: 'execute',
            functionName: 'Function to execute',
            parameters: 'Array of parameters',
            timeout: 'Execution timeout in ms'
          },
          example: {
            url: baseUrl,
            body: {
              token: 'YOUR_TOKEN',
              action: 'execute',
              functionName: 'generateBaseline',
              parameters: []
            }
          }
        },
        baseline: {
          description: 'Generate baseline intelligence report',
          body: {
            action: 'baseline',
            options: 'Generation options (optional)'
          }
        },
        monitor: {
          description: 'Run change monitoring',
          body: {
            action: 'monitor',
            company: 'Specific company name (optional)',
            checkAll: 'Monitor all companies (boolean)'
          }
        },
        config: {
          description: 'Update configuration',
          body: {
            action: 'config',
            section: 'Configuration section name',
            value: 'New configuration value'
          }
        }
      }
    },
    debugging: {
      tips: [
        'Always check /status first to verify system health',
        'Use /logs to see recent errors and activity',
        'Enable self-healing for automatic error recovery',
        'Check /config to verify current settings',
        'Use progress tracking for long-running operations'
      ],
      commonIssues: {
        'Invalid token': 'Set CLAUDE_AUTH_TOKEN in script properties',
        'Function not found': 'Check available functions in /status response',
        'Permission denied': 'Verify script sharing and OAuth scopes',
        'Timeout errors': 'Break large operations into smaller chunks'
      }
    },
    examples: {
      fullWorkflow: [
        '1. Check status: GET ?token=TOKEN&action=status',
        '2. Generate baseline: POST {action:"baseline", token:"TOKEN"}',
        '3. Check progress: GET ?token=TOKEN&action=logs&lines=10',
        '4. Get results: GET ?token=TOKEN&action=sheets&sheetName=Changes',
        '5. Monitor changes: POST {action:"monitor", checkAll:true, token:"TOKEN"}'
      ]
    }
  };
  
  return createJsonResponse({
    success: true,
    help,
    quickStart: `Start with: ${baseUrl}?token=YOUR_TOKEN&action=status`
  });
}

/**
 * Activity logging helper
 */
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
    
    // Clean old logs (keep last 100)
    cleanOldLogs(100);
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

/**
 * Clean old log entries
 */
function cleanOldLogs(keepCount) {
  const props = PropertiesService.getScriptProperties();
  const keys = props.getKeys();
  const logKeys = keys.filter(k => k.startsWith('log_')).sort().reverse();
  
  if (logKeys.length > keepCount) {
    const toDelete = logKeys.slice(keepCount);
    toDelete.forEach(key => props.deleteProperty(key));
  }
}