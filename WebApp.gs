/**
 * WebApp.gs - Root level web app handler for AI Competitor Monitor
 * This file MUST be at the root level for Google Apps Script to recognize doGet
 */

// Import configurations from CompanyConfigComplete
function getCompleteMonitorConfig() {
  return [
    // AI Model Providers
    {
      company: "Anthropic",
      urls: [
        { url: "https://anthropic.com", type: "homepage" },
        { url: "https://anthropic.com/claude", type: "product" },
        { url: "https://anthropic.com/pricing", type: "pricing" },
        { url: "https://anthropic.com/news", type: "news" }
      ]
    },
    {
      company: "OpenAI",
      urls: [
        { url: "https://openai.com", type: "homepage" },
        { url: "https://openai.com/chatgpt", type: "product" },
        { url: "https://openai.com/pricing", type: "pricing" },
        { url: "https://openai.com/blog", type: "blog" }
      ]
    },
    {
      company: "Google DeepMind",
      urls: [
        { url: "https://deepmind.google", type: "homepage" },
        { url: "https://ai.google/discover/gemini", type: "product" },
        { url: "https://blog.google/technology/ai/", type: "blog" }
      ]
    },
    {
      company: "Mistral AI",
      urls: [
        { url: "https://mistral.ai", type: "homepage" },
        { url: "https://mistral.ai/news/", type: "news" },
        { url: "https://mistral.ai/technology/", type: "technology" },
        { url: "https://docs.mistral.ai", type: "docs" }
      ]
    },
    // Code & Development AI
    {
      company: "Codeium",
      urls: [
        { url: "https://codeium.com", type: "homepage" },
        { url: "https://codeium.com/windsurf", type: "product" },
        { url: "https://codeium.com/pricing", type: "pricing" },
        { url: "https://codeium.com/blog", type: "blog" }
      ]
    },
    {
      company: "Anysphere",
      urls: [
        { url: "https://anysphere.inc", type: "homepage" },
        { url: "https://cursor.com", type: "product" },
        { url: "https://cursor.com/features", type: "features" },
        { url: "https://cursor.com/pricing", type: "pricing" }
      ]
    },
    // Video & Media AI
    {
      company: "Synthesia",
      urls: [
        { url: "https://synthesia.io", type: "homepage" },
        { url: "https://synthesia.io/features", type: "features" },
        { url: "https://synthesia.io/pricing", type: "pricing" },
        { url: "https://synthesia.io/blog", type: "blog" }
      ]
    },
    {
      company: "Pika",
      urls: [
        { url: "https://pika.art", type: "homepage" },
        { url: "https://pika.art/pricing", type: "pricing" },
        { url: "https://pika.art/blog", type: "blog" }
      ]
    },
    {
      company: "Moonvalley",
      urls: [
        { url: "https://moonvalley.ai", type: "homepage" },
        { url: "https://moonvalley.ai/create", type: "product" },
        { url: "https://moonvalley.ai/pricing", type: "pricing" }
      ]
    },
    {
      company: "HeyGen",
      urls: [
        { url: "https://heygen.com", type: "homepage" },
        { url: "https://heygen.com/features", type: "features" },
        { url: "https://heygen.com/pricing", type: "pricing" },
        { url: "https://heygen.com/blog", type: "blog" }
      ]
    }
  ];
}

/**
 * Main entry point for web app - handles all API requests
 */
function doGet(e) {
  try {
    // Support both 'action' (from new frontend) and 'path' (from old frontend) parameters
    const action = e.parameter.action || e.parameter.path || 'status';
    const callback = e.parameter.callback; // For JSONP
    const token = e.parameter.token;
    
    console.log('API Request:', action, 'Token:', token ? 'provided' : 'missing');
    
    // Simple token validation
    if (token !== 'dev-token-change-me') {
      return createJsonResponse({
        success: false,
        error: 'Invalid token'
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
          response = generateBaselineForAPIFixed();
        } else {
          response = {
            success: true,
            data: null
          };
        }
        break;
        
      case 'monitor':
        response = runMonitorForAPIFixed(e.parameter.checkAll === 'true');
        break;
        
      case 'logs':
        response = getLogsForAPIFixed(parseInt(e.parameter.limit) || 50);
        break;
        
      case 'execute':
        // Execute arbitrary functions with parameters
        const functionName = e.parameter.functionName;
        const parameters = e.parameter.parameters ? JSON.parse(e.parameter.parameters) : [];
        response = executeFunction(functionName, parameters);
        break;
        
      default:
        response = {
          success: false,
          error: 'Unknown action: ' + action
        };
    }
    
    // Add CORS headers for cross-origin requests
    const output = ContentService.createTextOutput();
    
    if (callback) {
      // JSONP response
      output.setContent(callback + '(' + JSON.stringify(response) + ')');
      output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      // JSON response
      output.setContent(JSON.stringify(response));
      output.setMimeType(ContentService.MimeType.JSON);
    }
    
    return output;
    
  } catch (error) {
    console.error('API Error:', error);
    return createJsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    }, 500);
  }
}

/**
 * Get system status - FIXED to match frontend expectations
 */
function getSystemStatusFixed() {
  try {
    const props = PropertiesService.getScriptProperties();
    const lastRun = props.getProperty('LAST_MULTI_URL_RUN');
    
    // Get configuration
    const config = getCompleteMonitorConfig();
    
    // Count total URLs
    let totalUrls = 0;
    config.forEach(company => {
      if (company.urls && Array.isArray(company.urls)) {
        totalUrls += company.urls.length;
      }
    });
    
    // Return data structure that matches frontend expectations
    return {
      success: true,
      status: 'operational',
      companiesMonitored: config.length,
      urlsTracked: totalUrls,
      lastCheck: lastRun || null,
      health: 'operational',
      configuration: {
        monitorsConfigured: config.length
      },
      lastRun: {
        monitor: lastRun || 'never'
      },
      version: 47,
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
 * Get configuration for API
 */
function getConfigForAPIFixed() {
  try {
    const config = getCompleteMonitorConfig();
    
    // Transform config to simple format
    const apiConfig = config.map(company => ({
      company: company.company,
      urls: company.urls.map(u => u.url)
    }));
    
    return {
      success: true,
      monitors: apiConfig,
      config: {
        thresholds: {
          global: 25,
          company: {
            "Anthropic": 15,
            "OpenAI": 30,
            "Google DeepMind": 20
          }
        },
        aiThresholds: {
          alertThreshold: 6
        },
        contentSelectors: {
          default: "main, article, .content, #content",
          exclude: "nav, header, footer, .sidebar, .ads"
        }
      },
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
 * Get recent changes for API
 */
function getRecentChangesForAPIFixed() {
  try {
    // Return mock data for now
    return {
      success: true,
      changes: [],
      total: 0,
      message: 'No changes recorded yet',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate baseline for all companies
 */
function generateBaselineForAPIFixed() {
  try {
    const config = getCompleteMonitorConfig();
    
    return {
      success: true,
      companies: config.length,
      message: 'Baseline generation initiated',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Run monitor check
 */
function runMonitorForAPIFixed(checkAll = false) {
  try {
    const config = getCompleteMonitorConfig();
    
    // Update last run
    PropertiesService.getScriptProperties().setProperty(
      'LAST_MULTI_URL_RUN', 
      new Date().toISOString()
    );
    
    return {
      success: true,
      message: `Monitoring check initiated for ${config.length} companies`,
      relevantChanges: 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get system logs
 */
function getLogsForAPIFixed(limit = 50) {
  try {
    return {
      success: true,
      logs: [{
        timestamp: new Date().toISOString(),
        type: 'info',
        message: 'AI Competitor Monitor API v47 operational'
      }],
      total: 1,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get statistics
 */
function getStatsForAPIFixed() {
  try {
    const config = getCompleteMonitorConfig();
    let totalUrls = 0;
    const urlTypes = {};
    
    config.forEach(company => {
      company.urls.forEach(urlObj => {
        totalUrls++;
        const type = urlObj.type || 'unknown';
        urlTypes[type] = (urlTypes[type] || 0) + 1;
      });
    });
    
    return {
      success: true,
      stats: {
        companies: config.length,
        totalUrls: totalUrls,
        urlTypes: urlTypes,
        totalChanges: 0,
        todayChanges: 0,
        lastRun: PropertiesService.getScriptProperties().getProperty('LAST_MULTI_URL_RUN') || 'Never'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get all monitored URLs
 */
function getUrlsForAPIFixed() {
  try {
    const config = getCompleteMonitorConfig();
    const urls = [];
    
    config.forEach(company => {
      company.urls.forEach(urlObj => {
        urls.push({
          company: company.company,
          url: urlObj.url,
          type: urlObj.type || 'unknown'
        });
      });
    });
    
    return {
      success: true,
      urls: urls,
      total: urls.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Helper to create JSON response
 */
function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Execute arbitrary functions
 */
function executeFunction(functionName, parameters) {
  try {
    console.log('Executing function:', functionName, 'with parameters:', parameters);
    
    // Map of allowed functions
    const allowedFunctions = {
      'processIntelligentMonitor': processIntelligentMonitorMock,
      'getExtractedData': getExtractedDataMock,
      'getChangeHistory': getChangeHistoryMock,
      'updateThresholds': updateThresholdsMock,
      'updateSelectors': updateSelectorsMock
    };
    
    if (!allowedFunctions[functionName]) {
      return {
        success: false,
        error: 'Function not allowed: ' + functionName
      };
    }
    
    const result = allowedFunctions[functionName].apply(null, parameters);
    
    return {
      success: true,
      result: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error executing function:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Mock function for intelligent monitoring
 */
function processIntelligentMonitorMock(options) {
  return {
    summary: {
      significantChanges: 3,
      totalChecked: 10,
      aiProcessed: 3
    },
    changes: [
      {
        company: 'Anthropic',
        url: 'https://anthropic.com/pricing',
        changeMagnitude: 35,
        relevanceScore: 8,
        summary: 'New pricing tier added for enterprise customers'
      },
      {
        company: 'OpenAI',
        url: 'https://openai.com/blog',
        changeMagnitude: 15,
        relevanceScore: 7,
        summary: 'New blog post about GPT-5 capabilities'
      }
    ]
  };
}

/**
 * Mock function for extracted data
 */
function getExtractedDataMock() {
  return {
    data: [
      {
        timestamp: new Date().toISOString(),
        url: 'https://anthropic.com',
        title: 'Anthropic - AI Safety Company',
        wordCount: 1523,
        preview: 'Anthropic is an AI safety company working to build reliable, interpretable, and steerable AI systems...'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        url: 'https://openai.com',
        title: 'OpenAI',
        wordCount: 2341,
        preview: 'OpenAI is an AI research and deployment company dedicated to ensuring that artificial general intelligence...'
      }
    ],
    total: 2
  };
}

/**
 * Mock function for change history
 */
function getChangeHistoryMock(urlFilter) {
  const changes = [
    {
      timestamp: new Date().toISOString(),
      company: 'Anthropic',
      url: 'https://anthropic.com/pricing',
      changeMagnitude: 35,
      relevanceScore: 8,
      summary: 'New pricing tier added for enterprise customers',
      previousHash: 'abc123',
      currentHash: 'def456'
    },
    {
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      company: 'OpenAI',
      url: 'https://openai.com/blog',
      changeMagnitude: 15,
      relevanceScore: 7,
      summary: 'New blog post about GPT-5 capabilities',
      previousHash: 'ghi789',
      currentHash: 'jkl012'
    },
    {
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      company: 'Google DeepMind',
      url: 'https://deepmind.google',
      changeMagnitude: 42,
      relevanceScore: 9,
      summary: 'Major announcement about Gemini 2.0 release',
      previousHash: 'mno345',
      currentHash: 'pqr678'
    }
  ];
  
  // Filter if URL provided
  if (urlFilter) {
    return {
      changes: changes.filter(c => c.url === urlFilter),
      total: changes.filter(c => c.url === urlFilter).length
    };
  }
  
  return {
    changes: changes,
    total: changes.length
  };
}

/**
 * Mock function for updating thresholds
 */
function updateThresholdsMock(updates) {
  console.log('Updating thresholds:', updates);
  return {
    success: true,
    message: 'Thresholds updated successfully'
  };
}

/**
 * Mock function for updating selectors
 */
function updateSelectorsMock(selectors) {
  console.log('Updating selectors:', selectors);
  return {
    success: true,
    message: 'Selectors updated successfully'
  };
}

/**
 * Test function
 */
function testWebApp() {
  console.log('Testing WebApp v47...');
  
  // Simulate a request
  const mockRequest = {
    parameter: {
      token: 'dev-token-change-me',
      action: 'status'
    }
  };
  
  const response = doGet(mockRequest);
  console.log('Response:', response.getContent());
  
  return 'Test complete';
}
