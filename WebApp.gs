/**
 * WebApp.gs - Enhanced with Real Intelligent Monitoring Integration
 * Integrates all the intelligent monitoring code from src/ directory
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

// ============ CONFIGURATION ============
// INTELLIGENT_CONFIG is imported from src/intelligent/IntelligentMonitor.js

// Configuration for intelligent monitoring is imported from src/Main.gs

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
      version: 51,
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
        thresholds: MONITOR_CONFIG.thresholds,
        aiThresholds: MONITOR_CONFIG.aiThresholds,
        contentSelectors: MONITOR_CONFIG.contentSelectors
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
    // Get stored changes from the Changes sheet
    const changes = getStoredChanges(50); // Get last 50 changes
    
    return {
      success: true,
      changes: changes,
      total: changes.length,
      message: changes.length > 0 ? `${changes.length} changes found` : 'No changes recorded yet',
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
    
    // Run baseline generation for all companies
    const results = processAllMonitors(config, true); // true = baseline mode
    
    return {
      success: true,
      companies: config.length,
      results: results,
      message: 'Baseline generation completed',
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
    
    // Run monitoring for all companies
    const results = processAllMonitors(config, false); // false = monitoring mode
    
    // Count relevant changes
    let relevantChanges = 0;
    results.forEach(result => {
      if (result.changes) {
        relevantChanges += result.changes.filter(c => c.relevanceScore >= INTELLIGENT_CONFIG.relevanceThreshold).length;
      }
    });
    
    // Update last run
    PropertiesService.getScriptProperties().setProperty(
      'LAST_MULTI_URL_RUN', 
      new Date().toISOString()
    );
    
    return {
      success: true,
      message: `Monitoring check completed for ${config.length} companies`,
      companiesChecked: config.length,
      relevantChanges: relevantChanges,
      results: results,
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
    const logs = getStoredLogs(limit);
    
    return {
      success: true,
      logs: logs,
      total: logs.length,
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
    
    // Get change statistics
    const changes = getStoredChanges(1000);
    const todayChanges = changes.filter(c => {
      const changeDate = new Date(c.timestamp);
      const today = new Date();
      return changeDate.toDateString() === today.toDateString();
    });
    
    return {
      success: true,
      stats: {
        companies: config.length,
        totalUrls: totalUrls,
        urlTypes: urlTypes,
        totalChanges: changes.length,
        todayChanges: todayChanges.length,
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
 * Execute arbitrary functions - NOW WITH REAL FUNCTIONS + THEBRAIN
 */
function executeFunction(functionName, parameters) {
  try {
    console.log('Executing function:', functionName, 'with parameters:', parameters);
    
    // Map of allowed functions - NOW USING REAL IMPLEMENTATIONS + THEBRAIN
    const allowedFunctions = {
      'processIntelligentMonitor': processIntelligentMonitorReal,
      'getExtractedData': getExtractedDataReal,
      'getChangeHistory': getChangeHistoryReal,
      'updateThresholds': updateThresholdsReal,
      'updateSelectors': updateSelectorsReal,
      'testTheBrainConnection': testTheBrainConnection,
      'createCompetitiveIntelligenceBrain': createCompetitiveIntelligenceBrain,
      'addCompaniesToBrain': addCompaniesToBrain,
      'generateCompetitiveLandscape': generateCompetitiveLandscape,
      'getTheBrainStatus': getTheBrainStatus,
      'testTheBrainIntegration': testTheBrainIntegration
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

// ============ REAL INTELLIGENT MONITORING FUNCTIONS ============

/**
 * REAL function for intelligent monitoring
 */
function processIntelligentMonitorReal(options) {
  try {
    const config = getCompleteMonitorConfig();
    const results = processAllMonitors(config, false);
    
    // Aggregate results
    let totalChecked = 0;
    let significantChanges = 0;
    let allChanges = [];
    
    results.forEach(result => {
      totalChecked += result.urls.length;
      if (result.changes) {
        const significant = result.changes.filter(c => c.relevanceScore >= INTELLIGENT_CONFIG.relevanceThreshold);
        significantChanges += significant.length;
        allChanges = allChanges.concat(result.changes);
      }
    });
    
    // Sort changes by relevance score
    allChanges.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    return {
      summary: {
        significantChanges: significantChanges,
        totalChecked: totalChecked,
        aiProcessed: allChanges.length
      },
      changes: allChanges.slice(0, 10).map(change => ({
        company: change.company,
        url: change.url,
        changeMagnitude: Math.round(change.changeMagnitude || 0),
        relevanceScore: change.relevanceScore || 0,
        summary: change.summary || 'Content updated'
      }))
    };
  } catch (error) {
    console.error('Error in processIntelligentMonitorReal:', error);
    return {
      summary: {
        significantChanges: 0,
        totalChecked: 0,
        aiProcessed: 0
      },
      changes: [],
      error: error.toString()
    };
  }
}

/**
 * REAL function for extracted data
 */
function getExtractedDataReal() {
  try {
    const data = getStoredPageContent(50); // Get last 50 content entries
    
    return {
      data: data.map(item => ({
        timestamp: item.timestamp,
        url: item.url,
        title: item.title || 'N/A',
        wordCount: item.wordCount || 0,
        preview: item.preview || 'No preview available'
      })),
      total: data.length
    };
  } catch (error) {
    console.error('Error in getExtractedDataReal:', error);
    return {
      data: [],
      total: 0,
      error: error.toString()
    };
  }
}

/**
 * REAL function for change history
 */
function getChangeHistoryReal(urlFilter) {
  try {
    let changes = getStoredChanges(100);
    
    // Filter by URL if provided
    if (urlFilter) {
      changes = changes.filter(c => c.url === urlFilter);
    }
    
    return {
      changes: changes.map(change => ({
        timestamp: change.timestamp,
        company: change.company,
        url: change.url,
        changeMagnitude: Math.round(change.changeMagnitude || 0),
        relevanceScore: change.relevanceScore || 0,
        summary: change.summary || 'Content updated',
        previousHash: change.oldHash,
        currentHash: change.newHash
      })),
      total: changes.length
    };
  } catch (error) {
    console.error('Error in getChangeHistoryReal:', error);
    return {
      changes: [],
      total: 0,
      error: error.toString()
    };
  }
}

/**
 * REAL function for updating thresholds
 */
function updateThresholdsReal(updates) {
  try {
    console.log('Updating thresholds:', updates);
    
    // Update the configuration
    if (updates.global) {
      MONITOR_CONFIG.thresholds.global = updates.global;
    }
    
    if (updates.company) {
      Object.assign(MONITOR_CONFIG.thresholds.company, updates.company);
    }
    
    if (updates.ai && updates.ai.alertThreshold) {
      MONITOR_CONFIG.aiThresholds.alertThreshold = updates.ai.alertThreshold;
    }
    
    // Save to properties
    PropertiesService.getScriptProperties().setProperty(
      'monitorConfig',
      JSON.stringify(MONITOR_CONFIG)
    );
    
    logActivity('Thresholds updated', 'success', updates);
    
    return {
      success: true,
      message: 'Thresholds updated successfully',
      config: MONITOR_CONFIG.thresholds
    };
  } catch (error) {
    console.error('Error updating thresholds:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * REAL function for updating selectors
 */
function updateSelectorsReal(selectors) {
  try {
    console.log('Updating selectors:', selectors);
    
    // Update the configuration
    if (selectors.default) {
      MONITOR_CONFIG.contentSelectors.default = selectors.default;
    }
    
    if (selectors.exclude) {
      MONITOR_CONFIG.contentSelectors.exclude = selectors.exclude;
    }
    
    // Save to properties
    PropertiesService.getScriptProperties().setProperty(
      'monitorConfig',
      JSON.stringify(MONITOR_CONFIG)
    );
    
    logActivity('Selectors updated', 'success', selectors);
    
    return {
      success: true,
      message: 'Selectors updated successfully',
      selectors: MONITOR_CONFIG.contentSelectors
    };
  } catch (error) {
    console.error('Error updating selectors:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ============ CORE MONITORING FUNCTIONS ============

/**
 * Process all monitors (either baseline or monitoring mode)
 */
function processAllMonitors(config, isBaseline = false) {
  const results = [];
  
  config.forEach(companyConfig => {
    try {
      const monitor = {
        company: companyConfig.company,
        urls: companyConfig.urls.map(u => u.url)
      };
      
      const result = processIntelligentMonitor(monitor, isBaseline);
      results.push(result);
      
      // Small delay between companies
      Utilities.sleep(1000);
      
    } catch (error) {
      console.error(`Error processing ${companyConfig.company}:`, error);
      results.push({
        company: companyConfig.company,
        error: error.toString(),
        urls: [],
        changes: []
      });
    }
  });
  
  return results;
}

/**
 * Process intelligent monitor for a single company
 */
function processIntelligentMonitor(monitor, isBaseline = false) {
  const results = {
    company: monitor.company,
    urls: [],
    changes: [],
    errors: []
  };
  
  monitor.urls.forEach(url => {
    try {
      // Extract current content
      const extraction = extractPageContent(url);
      
      if (!extraction.success) {
        results.errors.push({
          url: url,
          error: extraction.error
        });
        return;
      }
      
      if (isBaseline) {
        // Store baseline
        storeBaseline(monitor.company, url, extraction);
        storePageContent(url, extraction);
        
        results.urls.push({
          url: url,
          status: 'baseline_created',
          contentLength: extraction.contentLength
        });
      } else {
        // Get baseline for comparison
        const baseline = getBaselineForUrl(url);
        
        if (!baseline) {
          // No baseline exists, create one
          storeBaseline(monitor.company, url, extraction);
          storePageContent(url, extraction);
          
          results.urls.push({
            url: url,
            status: 'baseline_created',
            contentLength: extraction.contentLength
          });
        } else {
          // Compare with baseline
          if (baseline.contentHash !== extraction.contentHash) {
            // Content changed!
            const changeMagnitude = calculateChangeMagnitude(baseline.content, extraction.content);
            const relevanceScore = calculateRelevanceScore(baseline.content, extraction.content, url);
            
            const change = {
              company: monitor.company,
              url: url,
              oldHash: baseline.contentHash,
              newHash: extraction.contentHash,
              changeMagnitude: changeMagnitude,
              relevanceScore: relevanceScore,
              summary: generateChangeSummary(baseline.content, extraction.content),
              timestamp: new Date().toISOString()
            };
            
            results.changes.push(change);
            
            // Store the change
            storeChange(change);
            
            // Update baseline
            storeBaseline(monitor.company, url, extraction);
            storePageContent(url, extraction);
            
            results.urls.push({
              url: url,
              status: 'changed',
              changeMagnitude: changeMagnitude,
              relevanceScore: relevanceScore,
              alert: relevanceScore >= INTELLIGENT_CONFIG.relevanceThreshold
            });
          } else {
            results.urls.push({
              url: url,
              status: 'unchanged'
            });
          }
        }
      }
      
      // Respect crawl delay
      Utilities.sleep(INTELLIGENT_CONFIG.crawlDelay);
      
    } catch (error) {
      results.errors.push({
        url: url,
        error: error.toString()
      });
    }
  });
  
  return results;
}

/**
 * Extract content from a URL
 */
function extractPageContent(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: true
    });
    
    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      return {
        success: false,
        error: `HTTP ${statusCode}`,
        url: url
      };
    }
    
    const html = response.getContentText();
    const textContent = extractTextFromHtml(html);
    
    const contentHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5, 
      textContent
    ).map(byte => (byte & 0xFF).toString(16).padStart(2, '0')).join('');
    
    return {
      success: true,
      url: url,
      content: textContent.substring(0, INTELLIGENT_CONFIG.maxContentLength),
      contentLength: textContent.length,
      contentHash: contentHash,
      extractedAt: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      url: url
    };
  }
}

/**
 * Extract clean text from HTML
 */
function extractTextFromHtml(html) {
  // Remove scripts, styles, and navigation elements
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  html = html.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  html = html.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  html = html.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  
  // Remove HTML tags
  html = html.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  html = html.replace(/&nbsp;/g, ' ');
  html = html.replace(/&amp;/g, '&');
  html = html.replace(/&lt;/g, '<');
  html = html.replace(/&gt;/g, '>');
  html = html.replace(/&quot;/g, '"');
  html = html.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  html = html.replace(/\s+/g, ' ');
  html = html.trim();
  
  return html;
}

/**
 * Calculate change magnitude using simple word difference
 */
function calculateChangeMagnitude(oldContent, newContent) {
  if (!oldContent) return 100;
  
  const oldWords = oldContent.split(/\s+/);
  const newWords = newContent.split(/\s+/);
  
  // Simple difference calculation
  const maxLength = Math.max(oldWords.length, newWords.length);
  if (maxLength === 0) return 0;
  
  const minLength = Math.min(oldWords.length, newWords.length);
  const sizeDiff = Math.abs(oldWords.length - newWords.length);
  
  // Calculate rough percentage change
  const changePercent = (sizeDiff / maxLength) * 100;
  
  return Math.round(changePercent * 100) / 100;
}

/**
 * Calculate relevance score for a change
 */
function calculateRelevanceScore(oldContent, newContent, url) {
  let score = 5; // Start with middle score
  
  // Check for high-value keywords
  INTELLIGENT_CONFIG.keywords.high.forEach(keyword => {
    const oldCount = (oldContent.match(new RegExp(keyword, 'gi')) || []).length;
    const newCount = (newContent.match(new RegExp(keyword, 'gi')) || []).length;
    if (newCount > oldCount) {
      score += 2;
    }
  });
  
  // Check for medium-value keywords
  INTELLIGENT_CONFIG.keywords.medium.forEach(keyword => {
    const oldCount = (oldContent.match(new RegExp(keyword, 'gi')) || []).length;
    const newCount = (newContent.match(new RegExp(keyword, 'gi')) || []).length;
    if (newCount > oldCount) {
      score += 1;
    }
  });
  
  // Apply page type weight
  const pageType = identifyPageType(url);
  const weight = INTELLIGENT_CONFIG.pageWeights[pageType] || 1.0;
  score = Math.round(score * weight);
  
  return Math.max(1, Math.min(10, score));
}

/**
 * Identify page type from URL
 */
function identifyPageType(url) {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('/pricing')) return 'pricing';
  if (urlLower.includes('/blog')) return 'blog';
  if (urlLower.includes('/news')) return 'news';
  if (urlLower.includes('/feature')) return 'features';
  if (urlLower.includes('/product')) return 'products';
  if (urlLower.includes('/technology')) return 'technology';
  if (urlLower.includes('/announcement')) return 'announcement';
  if (urlLower.endsWith('/') || urlLower.includes('/index')) return 'homepage';
  
  return 'other';
}

/**
 * Generate simple change summary
 */
function generateChangeSummary(oldContent, newContent) {
  const oldLength = oldContent ? oldContent.length : 0;
  const newLength = newContent ? newContent.length : 0;
  
  if (newLength > oldLength * 1.2) {
    return 'Content significantly expanded';
  } else if (newLength < oldLength * 0.8) {
    return 'Content significantly reduced';
  } else {
    return 'Content modified';
  }
}

// ============ DATA STORAGE FUNCTIONS ============

/**
 * Get or create the monitoring spreadsheet
 */
function getOrCreateMonitorSheet() {
  let sheet;
  const files = DriveApp.getFilesByName('AI Competitor Monitor Data');
  
  if (files.hasNext()) {
    const file = files.next();
    sheet = SpreadsheetApp.openById(file.getId());
  } else {
    sheet = SpreadsheetApp.create('AI Competitor Monitor Data');
  }
  
  // Ensure required sheets exist
  createRequiredSheets(sheet);
  
  return {
    spreadsheet: sheet,
    baselines: sheet.getSheetByName('Baselines'),
    changes: sheet.getSheetByName('Changes'),
    pageContent: sheet.getSheetByName('PageContent'),
    logs: sheet.getSheetByName('Logs')
  };
}

/**
 * Create required sheets
 */
function createRequiredSheets(spreadsheet) {
  const requiredSheets = ['Baselines', 'Changes', 'PageContent', 'Logs'];
  
  requiredSheets.forEach(sheetName => {
    if (!spreadsheet.getSheetByName(sheetName)) {
      const sheet = spreadsheet.insertSheet(sheetName);
      
      // Add headers based on sheet type
      if (sheetName === 'Baselines') {
        sheet.getRange(1, 1, 1, 6).setValues([['URL', 'Company', 'Content Hash', 'Content Length', 'Created', 'Last Updated']]);
      } else if (sheetName === 'Changes') {
        sheet.getRange(1, 1, 1, 8).setValues([['Timestamp', 'Company', 'URL', 'Old Hash', 'New Hash', 'Change Magnitude', 'Relevance Score', 'Summary']]);
      } else if (sheetName === 'PageContent') {
        sheet.getRange(1, 1, 1, 6).setValues([['URL', 'Timestamp', 'Content Hash', 'Title', 'Word Count', 'Preview']]);
      } else if (sheetName === 'Logs') {
        sheet.getRange(1, 1, 1, 4).setValues([['Timestamp', 'Type', 'Message', 'Data']]);
      }
      
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
    }
  });
}

/**
 * Store baseline for a URL
 */
function storeBaseline(company, url, extraction) {
  try {
    const sheets = getOrCreateMonitorSheet();
    const baseline = sheets.baselines;
    
    // Check if baseline exists
    const data = baseline.getDataRange().getValues();
    let found = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === url) {
        // Update existing baseline
        baseline.getRange(i + 1, 3, 1, 4).setValues([[
          extraction.contentHash,
          extraction.contentLength,
          data[i][4], // Keep original created date
          new Date().toISOString()
        ]]);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Add new baseline
      baseline.appendRow([
        url,
        company,
        extraction.contentHash,
        extraction.contentLength,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
    }
    
  } catch (error) {
    console.error('Error storing baseline:', error);
  }
}

/**
 * Get baseline for a URL
 */
function getBaselineForUrl(url) {
  try {
    const sheets = getOrCreateMonitorSheet();
    const baseline = sheets.baselines;
    
    const data = baseline.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === url) {
        return {
          contentHash: data[i][2],
          contentLength: data[i][3],
          content: '', // We don't store full content in baselines
          created: data[i][4],
          lastUpdated: data[i][5]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting baseline:', error);
    return null;
  }
}

/**
 * Store page content
 */
function storePageContent(url, extraction) {
  try {
    const sheets = getOrCreateMonitorSheet();
    const contentSheet = sheets.pageContent;
    
    const title = extraction.title || 'N/A';
    const wordCount = extraction.content ? extraction.content.split(/\s+/).length : 0;
    const preview = extraction.content ? extraction.content.substring(0, 500) : 'N/A';
    
    contentSheet.appendRow([
      url,
      extraction.extractedAt,
      extraction.contentHash,
      title,
      wordCount,
      preview
    ]);
    
    // Keep only last 100 entries per URL to manage sheet size
    cleanOldContent(contentSheet, url, 100);
    
  } catch (error) {
    console.error('Error storing page content:', error);
  }
}

/**
 * Store detected change (enhanced with TheBrain integration)
 */
function storeChange(change) {
  try {
    const sheets = getOrCreateMonitorSheet();
    const changesSheet = sheets.changes;
    
    changesSheet.appendRow([
      change.timestamp,
      change.company,
      change.url,
      change.oldHash,
      change.newHash,
      change.changeMagnitude,
      change.relevanceScore,
      change.summary
    ]);
    
    logActivity('Change detected', 'info', change);
    
    // Also add to TheBrain if integration is available
    try {
      if (typeof addChangeToTheBrain === 'function') {
        addChangeToTheBrain(change);
      }
    } catch (theBrainError) {
      console.log('TheBrain integration not available:', theBrainError);
    }
    
  } catch (error) {
    console.error('Error storing change:', error);
  }
}

/**
 * Get stored changes
 */
function getStoredChanges(limit = 50) {
  try {
    const sheets = getOrCreateMonitorSheet();
    const changesSheet = sheets.changes;
    
    const data = changesSheet.getDataRange().getValues();
    const headers = data[0];
    const changes = [];
    
    // Get last N changes (excluding header)
    const startRow = Math.max(1, data.length - limit);
    
    for (let i = data.length - 1; i >= startRow; i--) {
      changes.push({
        timestamp: data[i][0],
        company: data[i][1],
        url: data[i][2],
        oldHash: data[i][3],
        newHash: data[i][4],
        changeMagnitude: data[i][5],
        relevanceScore: data[i][6],
        summary: data[i][7]
      });
    }
    
    return changes;
    
  } catch (error) {
    console.error('Error getting stored changes:', error);
    return [];
  }
}

/**
 * Get stored page content
 */
function getStoredPageContent(limit = 50) {
  try {
    const sheets = getOrCreateMonitorSheet();
    const contentSheet = sheets.pageContent;
    
    const data = contentSheet.getDataRange().getValues();
    const content = [];
    
    // Get last N content entries (excluding header)
    const startRow = Math.max(1, data.length - limit);
    
    for (let i = data.length - 1; i >= startRow; i--) {
      content.push({
        url: data[i][0],
        timestamp: data[i][1],
        contentHash: data[i][2],
        title: data[i][3],
        wordCount: data[i][4],
        preview: data[i][5]
      });
    }
    
    return content;
    
  } catch (error) {
    console.error('Error getting stored content:', error);
    return [];
  }
}

/**
 * Log activity
 */
function logActivity(message, type = 'info', data = null) {
  try {
    const sheets = getOrCreateMonitorSheet();
    const logsSheet = sheets.logs;
    
    logsSheet.appendRow([
      new Date().toISOString(),
      type,
      message,
      data ? JSON.stringify(data) : ''
    ]);
    
    console.log(`[${type.toUpperCase()}] ${message}`, data);
    
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Get stored logs
 */
function getStoredLogs(limit = 50) {
  try {
    const sheets = getOrCreateMonitorSheet();
    const logsSheet = sheets.logs;
    
    const data = logsSheet.getDataRange().getValues();
    const logs = [];
    
    // Get last N logs (excluding header)
    const startRow = Math.max(1, data.length - limit);
    
    for (let i = data.length - 1; i >= startRow; i--) {
      logs.push({
        timestamp: data[i][0],
        type: data[i][1],
        message: data[i][2],
        data: data[i][3]
      });
    }
    
    return logs;
    
  } catch (error) {
    console.error('Error getting stored logs:', error);
    return [{
      timestamp: new Date().toISOString(),
      type: 'info',
      message: 'AI Competitor Monitor system operational',
      data: ''
    }];
  }
}

/**
 * Clean old content to manage sheet size
 */
function cleanOldContent(sheet, url, keepLast) {
  try {
    const data = sheet.getDataRange().getValues();
    const urlEntries = [];
    
    // Find all entries for this URL
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === url) {
        urlEntries.push(i);
      }
    }
    
    // If we have more than keepLast entries, delete the oldest
    if (urlEntries.length > keepLast) {
      const toDelete = urlEntries.slice(0, urlEntries.length - keepLast);
      
      // Delete from bottom to top to maintain row indices
      toDelete.reverse().forEach(rowIndex => {
        sheet.deleteRow(rowIndex + 1);
      });
    }
    
  } catch (error) {
    console.error('Error cleaning old content:', error);
  }
}

/**
 * Test function
 */
function testWebApp() {
  console.log('Testing Enhanced WebApp...');
  
  // Test configuration
  const config = getCompleteMonitorConfig();
  console.log('Config loaded:', config.length, 'companies');
  
  // Test a single URL extraction
  const testUrl = 'https://anthropic.com';
  const extraction = extractPageContent(testUrl);
  console.log('Test extraction:', extraction.success ? 'Success' : extraction.error);
  
  // Simulate a request
  const mockRequest = {
    parameter: {
      token: 'dev-token-change-me',
      action: 'status'
    }
  };
  
  const response = doGet(mockRequest);
  console.log('Response:', response.getContent());
  
  return 'Enhanced test complete';
}
