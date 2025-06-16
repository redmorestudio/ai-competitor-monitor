/**
 * AI Competitor Monitor - Main Integration
 * Version: 3.0
 * 
 * This is the main entry point that integrates all intelligent features:
 * - Full content storage with diff capability
 * - AI-powered relevance scoring (1-10 scale)
 * - Configurable change thresholds (global, company, page-level)
 * - Intelligent categorization and filtering
 * - Complete web interface with configuration management
 */

// Configuration for intelligent monitoring
// Using MONITOR_CONFIG from WebApp.gs

/**
 * Get the appropriate change threshold for a URL
 */
function getThresholdForUrl(company, url) {
  // Check page-specific thresholds first
  for (const [pattern, threshold] of Object.entries(MONITOR_CONFIG.thresholds.page)) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(url)) {
        return threshold;
      }
    } else if (url.includes(pattern)) {
      return threshold;
    }
  }
  
  // Check company-specific threshold
  if (MONITOR_CONFIG.thresholds.company[company]) {
    return MONITOR_CONFIG.thresholds.company[company];
  }
  
  // Return global default
  return MONITOR_CONFIG.thresholds.global;
}

/**
 * Main function to process intelligent monitoring with all features
 */
function processIntelligentMonitor(monitor) {
  const results = {
    company: monitor.company,
    urls: [],
    timestamp: new Date().toISOString(),
    hasSignificantChanges: false,
    summary: {}
  };
  
  for (const url of monitor.urls) {
    try {
      // 1. Fetch current content
      const currentContent = fetchPageContent(url);
      
      // 2. Get previous content for comparison
      const previousContent = getPreviousContent(url);
      
      // 3. Calculate change magnitude
      const changeMagnitude = calculateChangeMagnitude(previousContent, currentContent);
      
      // 4. Get AI relevance score if content changed
      let aiScore = 0;
      let aiAnalysis = null;
      if (changeMagnitude > 0) {
        aiAnalysis = getAIRelevanceScore(previousContent, currentContent, monitor.company);
        aiScore = aiAnalysis.score;
      }
      
      // 5. Determine if change is significant
      const threshold = getThresholdForUrl(monitor.company, url);
      const isSignificant = (
        changeMagnitude >= threshold ||
        aiScore >= MONITOR_CONFIG.aiThresholds.alertThreshold ||
        containsCriticalKeywords(currentContent.extracted)
      );
      
      // 6. Store the result
      const urlResult = {
        url: url,
        status: currentContent.success ? 'success' : 'error',
        previousHash: previousContent?.hash || null,
        currentHash: currentContent.hash,
        changeMagnitude: changeMagnitude,
        changeThreshold: threshold,
        aiScore: aiScore,
        aiAnalysis: aiAnalysis,
        isSignificant: isSignificant,
        extracted: currentContent.extracted,
        error: currentContent.error
      };
      
      results.urls.push(urlResult);
      
      if (isSignificant) {
        results.hasSignificantChanges = true;
      }
      
      // 7. Store full content for future comparisons
      storePageContent(url, currentContent);
      
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      results.urls.push({
        url: url,
        status: 'error',
        error: error.toString()
      });
    }
  }
  
  // Generate summary
  results.summary = generateMonitorSummary(results);
  
  return results;
}

/**
 * Fetch page content with intelligent extraction
 */
function fetchPageContent(url) {
  try {
    // Fetch the page
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    
    const html = response.getContentText();
    const statusCode = response.getResponseCode();
    
    if (statusCode !== 200) {
      return {
        success: false,
        error: `HTTP ${statusCode}`,
        hash: null
      };
    }
    
    // Extract content intelligently
    const extracted = extractContentIntelligently(html, url);
    
    // Calculate content hash
    const contentHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      extracted.fullText
    ).map(byte => (byte & 0xFF).toString(16).padStart(2, '0')).join('');
    
    return {
      success: true,
      hash: contentHash,
      extracted: extracted,
      fullHtml: html,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      hash: null
    };
  }
}

/**
 * Extract content intelligently using CSS selectors
 */
function extractContentIntelligently(html, url) {
  // Get appropriate selectors
  let contentSelector = MONITOR_CONFIG.contentSelectors.default;
  let excludeSelector = MONITOR_CONFIG.contentSelectors.exclude;
  
  // Check for site-specific selectors
  for (const [domain, selector] of Object.entries(MONITOR_CONFIG.contentSelectors.specific)) {
    if (url.includes(domain)) {
      contentSelector = selector;
      break;
    }
  }
  
  // Use the CSS selector intelligence from our existing code
  const extraction = extractWithSelectors(html, contentSelector, excludeSelector);
  
  return {
    title: extraction.title || extractTitle(html),
    description: extraction.description || extractMetaDescription(html),
    mainContent: extraction.mainContent,
    fullText: extraction.fullText,
    keywords: extractKeywords(extraction.fullText),
    length: extraction.fullText.length,
    wordCount: extraction.fullText.split(/\s+/).length
  };
}

/**
 * Calculate change magnitude between two contents
 */
function calculateChangeMagnitude(previous, current) {
  if (!previous || !previous.extracted) {
    return 100; // New content is 100% change
  }
  
  const prevText = previous.extracted.fullText || '';
  const currText = current.extracted.fullText || '';
  
  // Use Levenshtein distance for accurate change calculation
  const distance = levenshteinDistance(prevText, currText);
  const maxLength = Math.max(prevText.length, currText.length);
  
  if (maxLength === 0) return 0;
  
  // Calculate percentage change
  const changePercent = (distance / maxLength) * 100;
  
  return Math.round(changePercent * 100) / 100; // Round to 2 decimal places
}

/**
 * Get AI relevance score for a change
 */
function getAIRelevanceScore(previous, current, company) {
  try {
    // Use Claude integration if available
    if (typeof analyzeChangeWithClaude === 'function') {
      return analyzeChangeWithClaude(previous, current, company);
    }
    
    // Fallback to rule-based scoring
    return calculateRuleBasedScore(previous, current, company);
    
  } catch (error) {
    console.error('Error getting AI score:', error);
    return {
      score: 5, // Default middle score
      reasoning: 'AI analysis unavailable',
      error: error.toString()
    };
  }
}

/**
 * Rule-based relevance scoring (fallback when AI unavailable)
 */
function calculateRuleBasedScore(previous, current, company) {
  let score = 5; // Start with neutral score
  const reasons = [];
  
  // Check for critical keywords
  const criticalFound = MONITOR_CONFIG.aiThresholds.criticalKeywords.filter(
    keyword => current.extracted.fullText.toLowerCase().includes(keyword)
  );
  
  if (criticalFound.length > 0) {
    score += 3;
    reasons.push(`Critical keywords found: ${criticalFound.join(', ')}`);
  }
  
  // Check magnitude of change
  const magnitude = calculateChangeMagnitude(previous, current);
  if (magnitude > 50) {
    score += 2;
    reasons.push(`Large change detected: ${magnitude}%`);
  } else if (magnitude > 25) {
    score += 1;
    reasons.push(`Moderate change detected: ${magnitude}%`);
  }
  
  // Check for structural changes
  if (current.extracted.wordCount > previous.extracted.wordCount * 1.5) {
    score += 1;
    reasons.push('Significant content addition');
  } else if (current.extracted.wordCount < previous.extracted.wordCount * 0.5) {
    score += 1;
    reasons.push('Significant content removal');
  }
  
  // Cap at 10
  score = Math.min(score, 10);
  
  return {
    score: score,
    reasoning: reasons.join('; '),
    method: 'rule-based'
  };
}

/**
 * Check if content contains critical keywords
 */
function containsCriticalKeywords(extracted) {
  const text = (extracted.fullText || '').toLowerCase();
  return MONITOR_CONFIG.aiThresholds.criticalKeywords.some(
    keyword => text.includes(keyword)
  );
}

/**
 * Store page content for future comparisons
 */
function storePageContent(url, content) {
  try {
    const ss = getOrCreateMonitorSheet().spreadsheet;
    let contentSheet = ss.getSheetByName('PageContent');
    
    if (!contentSheet) {
      contentSheet = ss.insertSheet('PageContent');
      const headers = [
        'URL', 'Timestamp', 'Content Hash', 'Title', 'Description',
        'Word Count', 'Content Preview', 'Full Content ID'
      ];
      contentSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      contentSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Store full content in Google Drive if too large
    let fullContentId = null;
    if (content.fullHtml && content.fullHtml.length > 50000) {
      fullContentId = storeInDrive(url, content.fullHtml);
    }
    
    // Add new content entry
    contentSheet.appendRow([
      url,
      content.timestamp,
      content.hash,
      content.extracted.title,
      content.extracted.description,
      content.extracted.wordCount,
      content.extracted.fullText.substring(0, 500) + '...',
      fullContentId
    ]);
    
    // Keep only last 30 days of content
    cleanOldContent(contentSheet, 30);
    
  } catch (error) {
    console.error('Error storing content:', error);
  }
}

/**
 * Get previous content for a URL
 */
function getPreviousContent(url) {
  try {
    const ss = getOrCreateMonitorSheet().spreadsheet;
    const contentSheet = ss.getSheetByName('PageContent');
    
    if (!contentSheet) return null;
    
    const data = contentSheet.getDataRange().getValues();
    const headers = data[0];
    const urlIndex = headers.indexOf('URL');
    const hashIndex = headers.indexOf('Content Hash');
    const contentIndex = headers.indexOf('Content Preview');
    
    // Find most recent entry for this URL
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][urlIndex] === url) {
        return {
          hash: data[i][hashIndex],
          extracted: {
            fullText: data[i][contentIndex]
          }
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting previous content:', error);
    return null;
  }
}

/**
 * Generate summary of monitoring results
 */
function generateMonitorSummary(results) {
  const significantChanges = results.urls.filter(u => u.isSignificant);
  const errors = results.urls.filter(u => u.status === 'error');
  
  return {
    totalUrls: results.urls.length,
    successfulChecks: results.urls.filter(u => u.status === 'success').length,
    errors: errors.length,
    changesDetected: results.urls.filter(u => u.changeMagnitude > 0).length,
    significantChanges: significantChanges.length,
    highestAiScore: Math.max(...results.urls.map(u => u.aiScore || 0)),
    averageChangeMagnitude: results.urls.reduce((sum, u) => sum + (u.changeMagnitude || 0), 0) / results.urls.length
  };
}

/**
 * Update monitor configuration
 */
function updateMonitorConfig(updates) {
  // Merge updates with existing config
  if (updates.thresholds) {
    Object.assign(MONITOR_CONFIG.thresholds, updates.thresholds);
  }
  
  if (updates.aiThresholds) {
    Object.assign(MONITOR_CONFIG.aiThresholds, updates.aiThresholds);
  }
  
  if (updates.contentSelectors) {
    Object.assign(MONITOR_CONFIG.contentSelectors, updates.contentSelectors);
  }
  
  // Save to properties
  PropertiesService.getScriptProperties().setProperty(
    'monitorConfig',
    JSON.stringify(MONITOR_CONFIG)
  );
  
  return {
    success: true,
    config: MONITOR_CONFIG
  };
}

/**
 * Get current monitor configuration
 */
function getMonitorConfig() {
  return MONITOR_CONFIG;
}

// Initialize configuration from saved properties
function initializeConfig() {
  try {
    const saved = PropertiesService.getScriptProperties().getProperty('monitorConfig');
    if (saved) {
      const savedConfig = JSON.parse(saved);
      Object.assign(MONITOR_CONFIG, savedConfig);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
}