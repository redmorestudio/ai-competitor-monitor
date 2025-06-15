/**
 * Complete AI Competitor Monitor Configuration
 * All 16 companies with multiple URLs per company
 * Covers: homepage, product pages, pricing, blog, news, docs
 */

const COMPLETE_MONITOR_CONFIG = [
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
  },
  
  // Image Generation AI
  {
    company: "Ideogram",
    urls: [
      { url: "https://ideogram.ai", type: "homepage" },
      { url: "https://ideogram.ai/features", type: "features" },
      { url: "https://ideogram.ai/about", type: "about" }
    ]
  },
  {
    company: "Midjourney",
    urls: [
      { url: "https://midjourney.com", type: "homepage" },
      { url: "https://docs.midjourney.com", type: "docs" }
    ]
  },
  
  // Enterprise & Security AI
  {
    company: "Articul8",
    urls: [
      { url: "https://articul8.ai", type: "homepage" },
      { url: "https://articul8.ai/platform", type: "platform" },
      { url: "https://articul8.ai/solutions", type: "solutions" }
    ]
  },
  {
    company: "Prompt Security",
    urls: [
      { url: "https://promptsecurity.io", type: "homepage" },
      { url: "https://promptsecurity.io/platform", type: "platform" },
      { url: "https://promptsecurity.io/resources", type: "resources" }
    ]
  },
  
  // AI Infrastructure
  {
    company: "Modular",
    urls: [
      { url: "https://modular.com", type: "homepage" },
      { url: "https://modular.com/mojo", type: "product" },
      { url: "https://modular.com/blog", type: "blog" }
    ]
  },
  {
    company: "LangChain",
    urls: [
      { url: "https://langchain.com", type: "homepage" },
      { url: "https://langchain.com/langsmith", type: "product" },
      { url: "https://blog.langchain.dev", type: "blog" },
      { url: "https://docs.langchain.com", type: "docs" }
    ]
  }
];

/**
 * Get monitor configurations with multi-URL support
 */
function getMonitorConfigurationsMultiUrl() {
  const props = PropertiesService.getScriptProperties();
  const storedConfig = props.getProperty('monitorConfigMultiUrl');
  
  if (storedConfig) {
    return JSON.parse(storedConfig);
  }
  
  // Return default configuration
  return COMPLETE_MONITOR_CONFIG;
}

/**
 * Update to multi-URL configuration
 */
function updateToMultiUrlConfig() {
  const props = PropertiesService.getScriptProperties();
  
  // Store the new configuration
  props.setProperty('monitorConfigMultiUrl', JSON.stringify(COMPLETE_MONITOR_CONFIG));
  
  // Calculate statistics
  const totalUrls = COMPLETE_MONITOR_CONFIG.reduce((sum, company) => 
    sum + company.urls.length, 0
  );
  
  const urlTypes = {};
  COMPLETE_MONITOR_CONFIG.forEach(company => {
    company.urls.forEach(urlObj => {
      urlTypes[urlObj.type] = (urlTypes[urlObj.type] || 0) + 1;
    });
  });
  
  // Log the update
  logActivity('config_update', {
    action: 'multi_url_configuration',
    companies: COMPLETE_MONITOR_CONFIG.length,
    totalUrls: totalUrls,
    urlTypes: urlTypes,
    timestamp: new Date().toISOString()
  });
  
  // Update the main monitor function to use multi-URL config
  props.setProperty('USE_MULTI_URL', 'true');
  
  return {
    success: true,
    message: 'Multi-URL configuration activated',
    stats: {
      companies: COMPLETE_MONITOR_CONFIG.length,
      totalUrls: totalUrls,
      avgUrlsPerCompany: (totalUrls / COMPLETE_MONITOR_CONFIG.length).toFixed(1),
      urlTypeBreakdown: urlTypes
    }
  };
}

/**
 * Convert existing single-URL data to multi-URL format
 */
function migrateToMultiUrl() {
  const sheet = getOrCreateMonitorSheet();
  if (!sheet.success) return { success: false, error: 'Sheet not found' };
  
  const ss = sheet.spreadsheet;
  
  // Create new Multi-URL sheet if it doesn't exist
  let multiUrlSheet = ss.getSheetByName('MultiUrlConfig');
  if (!multiUrlSheet) {
    multiUrlSheet = ss.insertSheet('MultiUrlConfig');
    
    // Set headers
    const headers = ['Company', 'URL', 'Type', 'Active', 'Last Checked', 'Status'];
    multiUrlSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    multiUrlSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    multiUrlSheet.setFrozenRows(1);
  }
  
  // Populate with multi-URL data
  const rows = [];
  COMPLETE_MONITOR_CONFIG.forEach(company => {
    company.urls.forEach(urlObj => {
      rows.push([
        company.company,
        urlObj.url,
        urlObj.type,
        'TRUE', // Active
        '', // Last Checked
        'Ready' // Status
      ]);
    });
  });
  
  if (rows.length > 0) {
    multiUrlSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
  
  return {
    success: true,
    message: 'Migration complete',
    rowsCreated: rows.length,
    sheetUrl: ss.getUrl()
  };
}

/**
 * Test multi-URL monitoring for a specific company
 */
function testMultiUrlMonitoring(companyName) {
  const config = COMPLETE_MONITOR_CONFIG.find(c => c.company === companyName);
  
  if (!config) {
    return { success: false, error: 'Company not found' };
  }
  
  const results = {
    company: companyName,
    urls: [],
    totalTime: 0
  };
  
  config.urls.forEach(urlObj => {
    const startTime = new Date().getTime();
    
    try {
      const response = UrlFetchApp.fetch(urlObj.url, {
        muteHttpExceptions: true,
        followRedirects: true,
        validateHttpsCertificates: false
      });
      
      const endTime = new Date().getTime();
      const responseTime = endTime - startTime;
      
      results.urls.push({
        url: urlObj.url,
        type: urlObj.type,
        status: response.getResponseCode(),
        success: response.getResponseCode() === 200,
        responseTime: responseTime,
        contentLength: response.getContentText().length
      });
      
      results.totalTime += responseTime;
      
      Utilities.sleep(1000); // Respectful crawling
      
    } catch (error) {
      results.urls.push({
        url: urlObj.url,
        type: urlObj.type,
        status: 'error',
        success: false,
        error: error.toString()
      });
    }
  });
  
  results.avgResponseTime = (results.totalTime / config.urls.length).toFixed(0);
  results.successRate = (results.urls.filter(u => u.success).length / results.urls.length * 100).toFixed(1) + '%';
  
  return results;
}

/**
 * Get configuration for dashboard
 */
function getMultiUrlConfigForDashboard() {
  const config = getMonitorConfigurationsMultiUrl();
  
  // Transform for dashboard display
  return config.map(company => ({
    company: company.company,
    urlCount: company.urls.length,
    urls: (company.urls || []).filter(u => u && u.url).map(u => ({
      url: u.url,
      type: u.type || 'unknown',
      shortUrl: u.url && typeof u.url === 'string' ? u.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : 'Invalid URL'
    }))
  }));
}

/**
 * Monitor a company with all its URLs
 */
function monitorCompanyMultiUrl(companyName) {
  const config = COMPLETE_MONITOR_CONFIG.find(c => c.company === companyName);
  if (!config) return null;
  
  // Convert to monitor format expected by processMonitorUnified
  const monitor = {
    company: config.company,
    urls: config.urls.map(u => u.url) // Extract just the URLs
  };
  
  return processMonitorUnified(monitor);
}

/**
 * Get URL type distribution
 */
function getUrlTypeStats() {
  const types = {};
  let total = 0;
  
  COMPLETE_MONITOR_CONFIG.forEach(company => {
    company.urls.forEach(urlObj => {
      types[urlObj.type] = (types[urlObj.type] || 0) + 1;
      total++;
    });
  });
  
  return {
    total: total,
    types: types,
    distribution: Object.entries(types).map(([type, count]) => ({
      type: type,
      count: count,
      percentage: (count / total * 100).toFixed(1) + '%'
    }))
  };
}

/**
 * Add missing logActivity function stub
 */
function logActivity(type, data) {
  console.log(`Activity [${type}]:`, data);
  // This would normally log to a sheet or monitoring system
  return true;
}

/**
 * Add missing processMonitorUnified function stub
 */
function processMonitorUnified(monitor) {
  console.log('Processing monitor:', monitor.company);
  // This would normally do the actual monitoring
  return {
    company: monitor.company,
    success: true,
    message: 'Monitoring complete'
  };
}
