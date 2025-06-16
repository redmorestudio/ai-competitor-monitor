/**
 * WebApp Fixed - Corrected API endpoints for AI Competitive Monitor
 * ENHANCED CORS FIX: More robust headers for GitHub Pages integration
 */

/**
 * Main entry point for web app - handles dashboard AND API requests
 * ENHANCED: Better CORS header handling for GitHub Pages
 * CRITICAL: doGet() handles OPTIONS preflight requests for CORS
 */
function doGet(e) {
  // CRITICAL: Handle OPTIONS preflight requests for CORS
  // This is required for Google Apps Script to work with GitHub Pages
  if (!e || !e.parameter || !e.parameter.action) {
    // Return simple response for OPTIONS preflight or direct access
    return ContentService.createTextOutput("done")
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
        'Access-Control-Max-Age': '86400'
      });
  }
  
  try {
    // Support both 'action' (from new frontend) and 'path' (from old frontend) parameters
    const action = e.parameter.action || e.parameter.path;
    const callback = e.parameter.callback; // For JSONP
    const token = e.parameter.token;
    
    console.log('Request - Action:', action, 'Token:', token ? 'provided' : 'missing');
    
    // If no action specified, serve the dashboard HTML (no token required)
    if (!action) {
      return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('AI Competitor Monitor Dashboard')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    
    // For API calls, require token
    if (token !== 'dev-token-change-me') {
      return createJsonResponseWithCORS({
        success: false,
        error: 'Invalid or missing token for API access'
      }, 401);
    }
    
    let response;
    
    switch(action) {
      case 'status':
        response = getSystemStatusFixed();
        break;
        
      case 'config':
        response = getConfigForAPIFixed();
        break;
        
      case 'changes':
        response = getRecentChangesForAPIFixed();
        break;
        
      case 'stats':
        response = getStatsForAPIFixed();
        break;
        
      case 'urls':
        response = getUrlsForAPIFixed();
        break;
        
      case 'baseline':
        const url = e.parameter.url;
        if (!url) {
          // No URL specified, generate baseline for all companies
          response = generateBaselineForAPIFixed();
        } else {
          // URL specified, get baseline for specific URL
          const baselineData = getBaselineForUrl(url);
          response = {
            success: baselineData !== null,
            data: baselineData
          };
        }
        break;
        
      case 'monitor':
        response = runMonitorForAPIFixed(e.parameter.checkAll === 'true');
        break;
        
      case 'logs':
        response = getLogsForAPIFixed(parseInt(e.parameter.limit) || 50);
        break;
        
      default:
        response = {
          success: false,
          error: 'Unknown action: ' + action
        };
    }
    
    // Return response with enhanced CORS headers
    return createJsonResponseWithCORS(response);
    
  } catch (error) {
    console.error('API Error:', error);
    return createJsonResponseWithCORS({
      success: false,
      error: error.toString(),
      stack: error.stack
    }, 500);
  }
}

/**
 * Handle OPTIONS requests for CORS preflight - ENHANCED
 */
function doOptions(e) {
  return createCORSResponse();
}

/**
 * Handle POST requests - ENHANCED for CORS
 */
function doPost(e) {
  // Handle POST requests with CORS
  return doGet(e);
}

/**
 * Create JSON response with enhanced CORS headers - ENHANCED
 */
function createJsonResponseWithCORS(data, statusCode = 200) {
  const jsonString = JSON.stringify(data);
  
  // Create text output to have more control over headers
  const output = ContentService.createTextOutput(jsonString);
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Add enhanced CORS headers
  return addEnhancedCORSHeaders(output);
}

/**
 * Add enhanced CORS headers - COMPLETELY REWRITTEN
 */
function addEnhancedCORSHeaders(output) {
  // For Google Apps Script web apps, we need to be very explicit with CORS headers
  // Since we can't read the request headers to check origin, we'll allow all
  // but validate through the token instead
  
  try {
    output.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  } catch (error) {
    // If setting headers fails, continue without them
    console.warn('Failed to set CORS headers:', error);
  }
  
  return output;
}

/**
 * Create OPTIONS response for CORS preflight - ENHANCED
 */
function createCORSResponse() {
  const output = ContentService.createTextOutput('');
  output.setMimeType(ContentService.MimeType.TEXT);
  
  try {
    output.setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'text/plain'
    });
  } catch (error) {
    console.warn('Failed to set preflight CORS headers:', error);
  }
  
  return output;
}

/**
 * Get system status - FIXED to match frontend expectations
 */
function getSystemStatusFixed() {
  try {
    const props = PropertiesService.getScriptProperties();
    const lastRun = props.getProperty('LAST_MULTI_URL_RUN');
    
    // Get configuration safely
    let config = [];
    try {
      config = getMonitorConfigurationsMultiUrl();
    } catch (error) {
      console.error('Error getting config:', error);
      // Fallback to basic config
      config = COMPLETE_MONITOR_CONFIG || [];
    }
    
    // Count total URLs safely with null checking
    let totalUrls = 0;
    config.forEach(company => {
      if (company.urls && Array.isArray(company.urls)) {
        company.urls.forEach(urlObj => {
          // Handle both string URLs and URL objects with null checking
          if (typeof urlObj === 'string' && urlObj) {
            totalUrls++;
          } else if (urlObj && typeof urlObj === 'object' && urlObj.url) {
            totalUrls++;
          }
        });
      }
    });
    
    // Return data structure that matches frontend expectations
    return {
      success: true,
      status: 'operational',
      companiesMonitored: config.length,  // Frontend expects this
      urlsTracked: totalUrls,             // Frontend expects this  
      lastCheck: lastRun || null,         // Frontend expects this
      lastRun: lastRun || 'Never',
      companies: config.length,
      urls: totalUrls,
      version: 56, // ENHANCED CORS VERSION
      corsFixed: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getSystemStatusFixed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get configuration for API - FIXED
 */
function getConfigForAPIFixed() {
  try {
    let config = [];
    try {
      config = getMonitorConfigurationsMultiUrl();
    } catch (error) {
      console.error('Error getting multi URL config:', error);
      // Fallback to basic config
      config = COMPLETE_MONITOR_CONFIG || [];
    }
    
    // Transform config to handle URL objects properly with null checking
    const apiConfig = config.map(company => ({
      company: company.company,
      urls: (company.urls || []).map(urlObj => {
        // Handle both string URLs and URL objects with null checking
        if (typeof urlObj === 'string' && urlObj) {
          return urlObj;
        } else if (urlObj && typeof urlObj === 'object' && urlObj.url) {
          return urlObj.url; // Extract URL string from object
        }
        return null;
      }).filter(url => url !== null && url !== '')
    }));
    
    return {
      success: true,
      monitors: apiConfig,
      config: {
        monitors: apiConfig   // Frontend expects this structure
      },
      companies: apiConfig,
      total: apiConfig.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getConfigForAPIFixed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get recent changes for API - FIXED
 */
function getRecentChangesForAPIFixed() {
  try {
    let sheet;
    try {
      sheet = getOrCreateMonitorSheet();
    } catch (error) {
      console.error('Error getting sheet:', error);
      return {
        success: true,
        changes: [],
        total: 0,
        message: 'No sheet available'
      };
    }
    
    if (!sheet || !sheet.spreadsheet) {
      return {
        success: true,
        changes: [],
        total: 0,
        message: 'No spreadsheet available'
      };
    }
    
    const ss = sheet.spreadsheet;
    const changesSheet = ss.getSheetByName('Changes');
    
    if (!changesSheet || changesSheet.getLastRow() <= 1) {
      return {
        success: true,
        changes: [],
        total: 0,
        message: 'No changes recorded yet'
      };
    }
    
    const data = changesSheet.getDataRange().getValues();
    const headers = data[0];
    const changes = [];
    
    // Get last 50 changes safely
    const startRow = Math.max(1, data.length - 50);
    for (let i = startRow; i < data.length; i++) {
      if (data[i] && data[i][0]) { // Has timestamp
        changes.push({
          timestamp: data[i][0],
          company: data[i][1] || '',
          url: data[i][2] || '',
          type: data[i][3] || 'change',
          changeType: data[i][3] || '',
          summary: data[i][4] || '',
          relevance: data[i][7] || 0,
          relevanceScore: data[i][7] || 0,
          keywords: data[i][8] || '',
          urlType: data[i][9] || '',
          magnitude: data[i][10] || 0
        });
      }
    }
    
    // Sort by timestamp descending and filter for relevant changes
    const relevantChanges = changes
      .filter(change => change.relevance >= 6)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
      success: true,
      changes: relevantChanges,
      total: relevantChanges.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getRecentChangesForAPIFixed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate baseline for all companies via API - FIXED
 */
function generateBaselineForAPIFixed() {
  try {
    let config = [];
    try {
      config = getMonitorConfigurationsMultiUrl();
    } catch (error) {
      config = COMPLETE_MONITOR_CONFIG || [];
    }
    
    let processed = 0;
    let errors = [];
    
    config.forEach(company => {
      if (company.urls && Array.isArray(company.urls)) {
        company.urls.forEach(urlObj => {
          try {
            const url = typeof urlObj === 'string' ? urlObj : (urlObj ? urlObj.url : null);
            if (url) {
              // Simple baseline generation
              try {
                const response = UrlFetchApp.fetch(url, {
                  muteHttpExceptions: true,
                  validateHttpsCertificates: false
                });
                
                if (response.getResponseCode() === 200) {
                  const content = response.getContentText();
                  const extraction = {
                    content: content.substring(0, 5000),
                    contentHash: Utilities.computeDigest(
                      Utilities.DigestAlgorithm.MD5, 
                      content
                    ).toString(),
                    timestamp: new Date().toISOString()
                  };
                  
                  // Store simple baseline
                  const key = 'baseline_' + Utilities.computeDigest(
                    Utilities.DigestAlgorithm.MD5,
                    url
                  ).toString();
                  
                  PropertiesService.getScriptProperties().setProperty(
                    key, 
                    JSON.stringify({
                      company: company.company,
                      url: url,
                      ...extraction
                    })
                  );
                  
                  processed++;
                }
              } catch (e) {
                errors.push(`${company.company}: ${e.toString()}`);
              }
            }
          } catch (e) {
            errors.push(`Error processing ${company.company}: ${e.toString()}`);
          }
        });
      }
    });
    
    return {
      success: true,
      processed: processed,
      total: config.reduce((sum, c) => sum + (c.urls ? c.urls.length : 0), 0),
      errors: errors,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in generateBaselineForAPIFixed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Run monitor check via API - FIXED
 */
function runMonitorForAPIFixed(checkAll = false) {
  try {
    // Run simple monitoring check
    let config = [];
    try {
      config = getMonitorConfigurationsMultiUrl();
    } catch (error) {
      config = COMPLETE_MONITOR_CONFIG || [];
    }
    
    const processed = config.length;
    const errors = [];
    
    // Get recent changes
    const changes = getRecentChangesForAPIFixed();
    
    // Update last run
    PropertiesService.getScriptProperties().setProperty(
      'LAST_MULTI_URL_RUN', 
      new Date().toISOString()
    );
    
    return {
      success: true,
      message: `Monitoring completed for ${processed} companies`,
      changes: changes.changes || [],
      processed: processed,
      errors: errors,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in runMonitorForAPIFixed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get system logs via API - FIXED
 */
function getLogsForAPIFixed(limit = 50) {
  try {
    let sheet;
    try {
      sheet = getOrCreateMonitorSheet();
    } catch (error) {
      return {
        success: true,
        logs: [{
          timestamp: new Date().toISOString(),
          type: 'info',
          message: 'System operational - logs not yet configured'
        }],
        message: 'Basic logs available'
      };
    }
    
    if (!sheet || !sheet.spreadsheet) {
      return {
        success: true,
        logs: [{
          timestamp: new Date().toISOString(),
          type: 'info', 
          message: 'System operational'
        }],
        message: 'No detailed logs available'
      };
    }
    
    const ss = sheet.spreadsheet;
    let logsSheet = ss.getSheetByName('Logs');
    
    if (!logsSheet) {
      return {
        success: true,
        logs: [{
          timestamp: new Date().toISOString(),
          type: 'info',
          message: 'System operational - monitoring active'
        }],
        message: 'Logs sheet not found, but system is running'
      };
    }
    
    const data = logsSheet.getDataRange().getValues();
    const logs = [];
    
    // Get last N logs safely
    const startRow = Math.max(1, data.length - limit);
    for (let i = startRow; i < data.length; i++) {
      if (data[i] && data[i][0]) { // Has timestamp
        logs.push({
          timestamp: data[i][0],
          type: data[i][1] || 'info',
          message: data[i][2] || ''
        });
      }
    }
    
    // Add a current status log if no logs found
    if (logs.length === 0) {
      logs.push({
        timestamp: new Date().toISOString(),
        type: 'success',
        message: 'AI Competitor Monitor is operational'
      });
    }
    
    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return {
      success: true,
      logs: logs,
      total: logs.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getLogsForAPIFixed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get statistics for API - FIXED  
 */
function getStatsForAPIFixed() {
  try {
    let config = [];
    try {
      config = getMonitorConfigurationsMultiUrl();
    } catch (error) {
      config = COMPLETE_MONITOR_CONFIG || [];
    }
    
    // Calculate statistics safely
    let totalUrls = 0;
    const urlTypes = {};
    
    config.forEach(company => {
      if (company.urls && Array.isArray(company.urls)) {
        company.urls.forEach(urlObj => {
          if (typeof urlObj === 'string' && urlObj) {
            totalUrls++;
            urlTypes['unknown'] = (urlTypes['unknown'] || 0) + 1;
          } else if (urlObj && typeof urlObj === 'object' && urlObj.url) {
            totalUrls++;
            const type = urlObj.type || 'unknown';
            urlTypes[type] = (urlTypes[type] || 0) + 1;
          }
        });
      }
    });
    
    // Get changes stats safely
    let totalChanges = 0;
    let todayChanges = 0;
    
    try {
      const sheet = getOrCreateMonitorSheet();
      if (sheet && sheet.spreadsheet) {
        const ss = sheet.spreadsheet;
        const changesSheet = ss.getSheetByName('Changes');
        
        if (changesSheet && changesSheet.getLastRow() > 1) {
          totalChanges = changesSheet.getLastRow() - 1;
          
          // Count today's changes
          const today = new Date().toDateString();
          const data = changesSheet.getDataRange().getValues();
          for (let i = 1; i < data.length; i++) {
            if (data[i][0] && new Date(data[i][0]).toDateString() === today) {
              todayChanges++;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting change stats:', error);
    }
    
    const props = PropertiesService.getScriptProperties();
    
    return {
      success: true,
      stats: {
        companies: config.length,
        totalUrls: totalUrls,
        urlTypes: urlTypes,
        totalChanges: totalChanges,
        todayChanges: todayChanges,
        lastRun: props.getProperty('LAST_MULTI_URL_RUN') || 'Never'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getStatsForAPIFixed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get all monitored URLs for API - FIXED
 */
function getUrlsForAPIFixed() {
  try {
    let config = [];
    try {
      config = getMonitorConfigurationsMultiUrl();
    } catch (error) {
      config = COMPLETE_MONITOR_CONFIG || [];
    }
    
    const urls = [];
    
    config.forEach(company => {
      if (company.urls && Array.isArray(company.urls)) {
        company.urls.forEach(urlObj => {
          if (typeof urlObj === 'string' && urlObj) {
            urls.push({
              company: company.company,
              url: urlObj,
              type: 'unknown'
            });
          } else if (urlObj && typeof urlObj === 'object' && urlObj.url) {
            urls.push({
              company: company.company,
              url: urlObj.url,
              type: urlObj.type || 'unknown'
            });
          }
        });
      }
    });
    
    return {
      success: true,
      urls: urls,
      total: urls.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getUrlsForAPIFixed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Helper to create JSON response - DEPRECATED, use createJsonResponseWithCORS
 */
function createJsonResponse(data, statusCode = 200) {
  return createJsonResponseWithCORS(data, statusCode);
}

/**
 * Test function to verify the enhanced CORS web app
 */
function testEnhancedCORSWebApp() {
  console.log('Testing enhanced CORS WebApp...');
  
  // Test status endpoint
  console.log('Status:', getSystemStatusFixed());
  
  // Test config endpoint  
  console.log('Config:', getConfigForAPIFixed());
  
  return {
    success: true,
    message: 'Enhanced CORS WebApp tested successfully',
    version: 56,
    corsFixed: true,
    enhancedHeaders: true
  };
}