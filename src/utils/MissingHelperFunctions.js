/**
 * Missing Helper Functions for Monitoring System
 * These functions are called but were not defined
 */

/**
 * Get monitor configurations - wrapper for multi-URL config
 */
function getMonitorConfigurations() {
  return getMonitorConfigurationsMultiUrl();
}

// processMonitorEnhanced is defined in ClaudeIntegration.js

/**
 * Extract page content with intelligent analysis
 */
function extractPageContent(url) {
  try {
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      validateHttpsCertificates: false
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
    
    // Calculate content hash
    const contentHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      textContent
    ).map(byte => (byte & 0xFF).toString(16).padStart(2, '0')).join('');
    
    // Basic intelligence
    const intelligence = {
      keywords: extractKeywords(textContent),
      pageType: identifyPageType(url)
    };
    
    return {
      success: true,
      url: url,
      content: textContent,
      contentLength: textContent.length,
      contentHash: contentHash,
      intelligence: intelligence,
      title: extractTitle(html),
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
 * Extract text from HTML
 */
function extractTextFromHtml(html) {
  // Remove script and style elements
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags
  html = html.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  html = html.replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  html = html.replace(/\s+/g, ' ').trim();
  
  return html;
}

/**
 * Extract title from HTML
 */
function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  // Simple keyword extraction
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were'];
  
  const wordFreq = {};
  words.forEach(word => {
    word = word.replace(/[^a-z0-9]/g, '');
    if (word.length > 3 && !stopWords.includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Get top keywords
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Identify page type from URL
 */
function identifyPageType(url) {
  if (url.includes('/pricing') || url.includes('/plans')) return 'pricing';
  if (url.includes('/blog') || url.includes('/news')) return 'blog';
  if (url.includes('/docs') || url.includes('/documentation')) return 'docs';
  if (url.includes('/features') || url.includes('/product')) return 'product';
  if (url.includes('/about')) return 'about';
  return 'homepage';
}

/**
 * Process a single monitor
 */
function processMonitor(monitor) {
  const results = {
    company: monitor.company,
    results: []
  };
  
  // Handle both old format (array of URLs) and new format (array of URL objects)
  const urls = monitor.urls || [];
  
  urls.forEach(urlItem => {
    const url = typeof urlItem === 'string' ? urlItem : urlItem.url;
    
    try {
      const extraction = extractPageContent(url);
      
      if (extraction.success) {
        // Store baseline
        storeBaseline(monitor.company, url, extraction);
        
        results.results.push({
          company: monitor.company,
          url: url,
          status: 'success',
          contentHash: extraction.contentHash,
          pageTitle: extraction.title,
          timestamp: new Date().toISOString()
        });
      } else {
        results.results.push({
          company: monitor.company,
          url: url,
          status: 'error',
          error: extraction.error,
          timestamp: new Date().toISOString()
        });
      }
      
      // Respect crawl delay
      Utilities.sleep(2000);
      
    } catch (error) {
      results.results.push({
        company: monitor.company,
        url: url,
        status: 'error',
        error: error.toString(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return results;
}

/**
 * Calculate relevance score for changes
 */
function calculateRelevanceScore(oldContent, newContent, url) {
  let score = 5; // Base score
  
  // Check for pricing changes
  if (url.includes('pricing') && (newContent.includes('$') || newContent.includes('price'))) {
    score += 3;
  }
  
  // Check for product/feature changes
  if ((url.includes('product') || url.includes('features')) && 
      (newContent.includes('new') || newContent.includes('launch'))) {
    score += 2;
  }
  
  // Check for significant length changes
  const lengthChange = Math.abs(newContent.length - oldContent.length);
  if (lengthChange > 1000) score += 2;
  if (lengthChange > 5000) score += 1;
  
  return Math.min(10, score);
}

/**
 * Extract keywords that changed
 */
function extractChangeKeywords(oldContent, newContent) {
  const oldKeywords = new Set(extractKeywords(oldContent));
  const newKeywords = new Set(extractKeywords(newContent));
  
  const added = [...newKeywords].filter(k => !oldKeywords.has(k));
  const removed = [...oldKeywords].filter(k => !newKeywords.has(k));
  
  return [...added.slice(0, 5), ...removed.slice(0, 5).map(k => `-${k}`)];
}

/**
 * Store detected changes in sheet
 */
function storeDetectedChanges(change) {
  try {
    const sheetResult = getOrCreateMonitorSheet();
    if (!sheetResult.success) return;
    
    const ss = sheetResult.spreadsheet;
    let changesSheet = ss.getSheetByName('Changes');
    
    if (!changesSheet) {
      changesSheet = ss.insertSheet('Changes');
      const headers = [
        'Timestamp', 'Company', 'URL', 'Change Type', 'Summary',
        'Previous Hash', 'New Hash', 'Relevance Score', 'Keywords'
      ];
      changesSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      changesSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Add change data
    changesSheet.appendRow([
      new Date().toISOString(),
      change.company,
      change.url,
      'content_change',
      change.claudeInsights?.summary || 'Content updated',
      change.oldHash,
      change.newHash,
      change.relevanceScore,
      change.keywords.join(', ')
    ]);
    
  } catch (error) {
    console.error('Error storing changes:', error);
  }
}

/**
 * Detect changes by comparing current and baseline
 */
function detectChanges(baseline, current) {
  if (!baseline || !current) return null;
  
  // Check if content changed
  if (baseline.contentHash === current.contentHash) {
    return null; // No change
  }
  
  // Calculate relevance
  const relevanceScore = calculateRelevanceScore(
    baseline.content || '',
    current.content,
    current.url
  );
  
  // Extract change keywords
  const keywords = extractChangeKeywords(
    baseline.content || '',
    current.content
  );
  
  return {
    company: current.company || baseline.company,
    url: current.url,
    oldHash: baseline.contentHash,
    newHash: current.contentHash,
    relevanceScore: relevanceScore,
    keywords: keywords,
    analysis: {
      relevanceScore: relevanceScore,
      keywords: keywords
    }
  };
}

/**
 * Analyze content for intelligence
 */
function analyzeContent(content) {
  return {
    keywords: extractKeywords(content),
    length: content.length,
    hasNumbers: /\d/.test(content),
    hasPricing: /\$|price|cost|fee/i.test(content),
    hasProduct: /product|feature|launch|new/i.test(content)
  };
}

/**
 * Monitor all changes
 */
function monitorAllChanges() {
  const monitors = getMonitorConfigurations();
  const allChanges = [];
  const results = [];
  
  monitors.forEach(monitor => {
    const monitorResult = processMonitorEnhanced(monitor);
    results.push(monitorResult);
    
    if (monitorResult.changes) {
      allChanges.push(...monitorResult.changes);
    }
  });
  
  return {
    status: 'completed',
    companies: monitors.map(m => m.company),
    changes: allChanges,
    totalChangesDetected: allChanges.length,
    relevantChanges: allChanges.filter(c => c.relevanceScore >= 6).length,
    timestamp: new Date().toISOString()
  };
}

// INTELLIGENT_CONFIG is defined in IntelligentMonitor.js

/**
 * Get or create the monitor spreadsheet
 */
function getOrCreateMonitorSheet() {
  try {
    // Try to get the spreadsheet ID from properties
    const props = PropertiesService.getScriptProperties();
    let spreadsheetId = props.getProperty('MONITOR_SPREADSHEET_ID');
    
    // Use the hardcoded ID if not in properties
    if (!spreadsheetId) {
      spreadsheetId = '1pOZ96O50x6n2SrNf0aGOcZZxS3hvLWh2HW8Xev95Euc';
      props.setProperty('MONITOR_SPREADSHEET_ID', spreadsheetId);
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    return {
      success: true,
      spreadsheet: ss
    };
  } catch (error) {
    console.error('Error getting monitor sheet:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Run complete multi-URL monitoring
 */
function runCompleteMultiUrlMonitoring() {
  try {
    const config = getMonitorConfigurationsMultiUrl();
    let companiesProcessed = 0;
    let errors = [];
    
    config.forEach(company => {
      try {
        const result = monitorCompanyMultiUrl(company.company);
        if (result) {
          companiesProcessed++;
        }
      } catch (e) {
        errors.push(`Error processing ${company.company}: ${e.toString()}`);
      }
    });
    
    // Update last run timestamp
    PropertiesService.getScriptProperties().setProperty(
      'LAST_MULTI_URL_RUN',
      new Date().toISOString()
    );
    
    return {
      success: true,
      message: 'Monitoring completed',
      companiesProcessed: companiesProcessed,
      errors: errors
    };
  } catch (error) {
    return {
      success: false,
      message: 'Monitoring failed',
      error: error.toString()
    };
  }
}

/**
 * Extract main content from text
 */
function extractMainContent(text) {
  // Simple implementation - can be enhanced
  return text.substring(0, 1000); // First 1000 chars as summary
}
