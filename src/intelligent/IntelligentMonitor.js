/**
 * Intelligent Monitor with Claude LLM Integration
 * Enhanced content extraction and analysis using Claude AI
 */

// ============ CONFIGURATION ============
const INTELLIGENT_CONFIG = {
  maxContentLength: 50000,
  relevanceThreshold: 6,
  crawlDelay: 2000,
  retryAttempts: 3,
  
  keywords: {
    high: ['price', 'pricing', 'launch', 'new', 'release', 'announce', 'available', 'introducing'],
    medium: ['feature', 'update', 'improve', 'enhance', 'api', 'model', 'performance', 'capability'],
    low: ['fix', 'patch', 'minor', 'small', 'tweak', 'adjust']
  },
  
  pageWeights: {
    'homepage': 0.8,
    'index': 0.8,
    'home': 0.8,
    'news': 1.2,
    'blog': 1.2,
    'updates': 1.2,
    'technology': 1.5,
    'features': 1.5,
    'products': 1.5,
    'pricing': 2.0,
    'announcement': 2.0
  }
};

// ============ LLM CONFIGURATION ============
const LLM_CONFIG = {
  provider: 'anthropic',
  model: 'claude-3-haiku-20240307',
  maxTokens: 2000,
  temperature: 0.3,
  apiKeyProperty: 'CLAUDE_API_KEY'
};

// ============ API KEY MANAGEMENT ============
function setApiKey(apiKey) {
  PropertiesService.getScriptProperties().setProperty('CLAUDE_API_KEY', apiKey);
  logActivity('API key updated', 'success');
  return { success: true, message: 'API key set successfully' };
}

function updateConfig(config) {
  const props = PropertiesService.getScriptProperties();
  Object.keys(config).forEach(key => {
    props.setProperty(key, typeof config[key] === 'string' ? config[key] : JSON.stringify(config[key]));
  });
  return { success: true, updated: Object.keys(config) };
}

function testLLMConnection() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) return { success: false, error: 'No API key set' };
  
  try {
    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    
    return { 
      success: response.getResponseCode() === 200, 
      message: 'Claude connection successful' 
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function getLLMStats() {
  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('CLAUDE_API_KEY');
  const llmEnabled = props.getProperty('LLM_ENABLED') === 'true';
  const callCount = parseInt(props.getProperty('LLM_CALL_COUNT') || '0');
  const lastCall = props.getProperty('LLM_LAST_CALL');
  
  return {
    configured: !!apiKey,
    enabled: llmEnabled,
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    totalCalls: callCount,
    lastCall: lastCall || 'never',
    estimatedCost: '$' + (callCount * 0.03).toFixed(2)
  };
}

// ============ LLM ANALYSIS FUNCTIONS ============

/**
 * Analyze content with Claude for intelligent insights
 */
function analyzeContentWithLLM(content, previousContent, url, company) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty(LLM_CONFIG.apiKeyProperty);
    
    if (!apiKey) {
      console.warn('LLM API key not set, falling back to basic analysis');
      return analyzeContent(content);
    }
    
    // Track API calls
    incrementLLMCallCount();
    
    // Prepare the prompt
    const prompt = createAnalysisPrompt(content, previousContent, url, company);
    
    // Call Claude
    const response = callClaude(prompt, apiKey);
    
    // Parse and enhance the response
    const llmAnalysis = JSON.parse(response.content[0].text);
    
    // Combine with basic NLP for redundancy
    const basicAnalysis = analyzeContent(content);
    
    return {
      ...basicAnalysis,
      ...llmAnalysis,
      analysisType: 'claude-enhanced',
      model: LLM_CONFIG.model
    };
    
  } catch (error) {
    console.error('LLM analysis failed:', error);
    return analyzeContent(content);
  }
}

/**
 * Create analysis prompt for Claude
 */
function createAnalysisPrompt(content, previousContent, url, company) {
  const contentPreview = content.substring(0, 4000);
  const previousPreview = previousContent ? previousContent.substring(0, 2000) : 'No previous content';
  
  return `You are an expert competitive intelligence analyst for AI companies. Analyze this webpage content for strategic insights.

Company: ${company}
URL: ${url}
Page Type: ${identifyPageType(url)}

${previousContent ? `
PREVIOUS CONTENT (excerpt):
${previousPreview}

NEW CONTENT (excerpt):
${contentPreview}

Focus on WHAT CHANGED and WHY IT MATTERS.
` : `
CONTENT (excerpt):
${contentPreview}
`}

Provide a JSON response with these fields:
{
  "messagingThemes": ["key", "themes", "max 7"],
  "productFeatures": ["new or notable features mentioned", "max 10"],
  "techClaims": ["technical claims or specifications"],
  "pricingSignals": ["pricing info, tiers, or changes"],
  "competitiveIntel": ["mentions of competitors or comparisons"],
  "strategicInsights": ["what this reveals about company strategy"],
  "dates": ["important dates mentioned"],
  "partnerships": ["partners, integrations, or collaborations mentioned"],
  "personnelChanges": ["new hires, departures, or role changes"],
  "metrics": ["performance metrics, user numbers, growth claims"],
  "sentiment": "positive/negative/neutral",
  "urgency": "high/medium/low",
  "significanceScore": 1-10,
  "keyChanges": ["most important changes if comparing versions"],
  "summary": "2-3 sentence executive summary",
  "recommendations": ["actionable insights for competitors"]
}

Be concise and focus on actionable intelligence.`;
}

/**
 * Call Claude API
 */
function callClaude(prompt, apiKey) {
  const url = 'https://api.anthropic.com/v1/messages';
  
  const payload = {
    model: LLM_CONFIG.model,
    max_tokens: LLM_CONFIG.maxTokens,
    temperature: LLM_CONFIG.temperature,
    system: "You are a competitive intelligence analyst specializing in AI companies. Provide accurate, actionable insights in JSON format.",
    messages: [{
      role: 'user',
      content: prompt
    }]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Claude API error: ${result.error?.message || 'Unknown error'}`);
  }
  
  return result;
}

/**
 * Enhanced relevance scoring using LLM insights
 */
function calculateRelevanceScoreWithLLM(change, llmAnalysis) {
  // Start with LLM's significance score
  let score = llmAnalysis.significanceScore || 5;
  
  // Boost for urgent changes
  if (llmAnalysis.urgency === 'high') score += 2;
  
  // Boost for competitive intel
  if (llmAnalysis.competitiveIntel && llmAnalysis.competitiveIntel.length > 0) score += 1;
  
  // Boost for pricing changes
  if (llmAnalysis.pricingSignals && llmAnalysis.pricingSignals.length > 0) score += 1;
  
  // Apply page type weight
  const pageType = identifyPageType(change.url);
  const weight = INTELLIGENT_CONFIG.pageWeights[pageType] || 1.0;
  score = Math.round(score * weight);
  
  // Ensure between 1-10
  return Math.max(1, Math.min(10, score));
}

/**
 * Generate intelligent change summary across all companies
 */
function generateIntelligentSummary(changes) {
  if (changes.length === 0) return null;
  
  const apiKey = PropertiesService.getScriptProperties().getProperty(LLM_CONFIG.apiKeyProperty);
  if (!apiKey) return generateChangeSummary(changes);
  
  const prompt = `Analyze these competitive intelligence findings from AI company monitoring:

${changes.map(c => `
Company: ${c.company}
URL: ${c.url}
Relevance: ${c.relevanceScore}/10
Key Changes: ${c.keyChanges?.join(', ') || 'Content updated'}
Insights: ${c.summary || 'N/A'}
`).join('\n---\n')}

Provide an executive briefing with:
1. Most significant developments (top 3)
2. Emerging trends across companies
3. Strategic implications
4. Recommended actions
5. Companies to watch closely

Format as JSON with these fields:
{
  "topDevelopments": ["development 1", "development 2", "development 3"],
  "trends": ["trend 1", "trend 2"],
  "implications": ["implication 1", "implication 2"],
  "recommendations": ["action 1", "action 2"],
  "watchList": ["company 1", "company 2"],
  "briefing": "2-3 paragraph executive summary"
}`;

  try {
    const response = callClaude(prompt, apiKey);
    return JSON.parse(response.content[0].text);
  } catch (error) {
    console.error('Summary generation failed:', error);
    return generateChangeSummary(changes);
  }
}

// ============ PROCESS MONITOR WITH LLM ============

/**
 * Process monitor with LLM intelligence
 */
function processMonitorWithLLM(monitor) {
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
      
      // Get baseline
      const baseline = getBaselineForUrl(url);
      
      // Get previous content from PageContent sheet
      const previousContent = baseline ? getPageContentFromSheet(url) : '';
      
      // Analyze with LLM
      const llmAnalysis = analyzeContentWithLLM(
        extraction.content,
        previousContent,
        url,
        monitor.company
      );
      
      // Enhanced extraction object
      const enhancedExtraction = {
        ...extraction,
        intelligence: llmAnalysis
      };
      
      if (!baseline) {
        // First time seeing this URL
        storeBaseline(monitor.company, url, enhancedExtraction);
        storePageContent(url, extraction.content, llmAnalysis);
        
        results.urls.push({
          url: url,
          status: 'baseline_created',
          contentLength: extraction.contentLength,
          intelligence: llmAnalysis
        });
      } else {
        // Compare with baseline
        if (baseline.contentHash !== extraction.contentHash) {
          // Content changed - use LLM analysis for scoring
          const relevanceScore = calculateRelevanceScoreWithLLM(
            { url: url },
            llmAnalysis
          );
          
          const change = {
            company: monitor.company,
            url: url,
            oldHash: baseline.contentHash,
            newHash: extraction.contentHash,
            relevanceScore: relevanceScore,
            keywords: llmAnalysis.keyChanges || [],
            summary: llmAnalysis.summary,
            intelligence: llmAnalysis,
            detectedAt: new Date().toISOString()
          };
          
          results.changes.push(change);
          
          // Update baseline and content
          storeBaseline(monitor.company, url, enhancedExtraction);
          storePageContent(url, extraction.content, llmAnalysis);
          
          results.urls.push({
            url: url,
            status: 'changed',
            relevanceScore: relevanceScore,
            alert: relevanceScore >= INTELLIGENT_CONFIG.relevanceThreshold,
            summary: llmAnalysis.summary
          });
        } else {
          results.urls.push({
            url: url,
            status: 'unchanged'
          });
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

// ============ HELPER FUNCTIONS ============

/**
 * Get page content from sheet
 */
function getPageContentFromSheet(url) {
  const sheet = getOrCreateMonitorSheet();
  const contentSheet = sheet.getSheetByName(SHEET_CONFIG.tabs.pageContent);
  
  const dataRange = contentSheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === url) {
      return values[i][1];
    }
  }
  
  return '';
}

/**
 * Increment LLM call counter
 */
function incrementLLMCallCount() {
  const props = PropertiesService.getScriptProperties();
  const count = parseInt(props.getProperty('LLM_CALL_COUNT') || '0');
  props.setProperty('LLM_CALL_COUNT', (count + 1).toString());
  props.setProperty('LLM_LAST_CALL', new Date().toISOString());
}

/**
 * Enable LLM intelligence
 */
function enableLLMIntelligence() {
  // Replace the basic processMonitorEnhanced with LLM version
  processMonitorEnhanced = processMonitorWithLLM;
  
  // Set flag
  PropertiesService.getScriptProperties().setProperty('LLM_ENABLED', 'true');
  
  // Check if API key is set
  const apiKey = PropertiesService.getScriptProperties().getProperty(LLM_CONFIG.apiKeyProperty);
  
  return {
    success: true,
    llmEnabled: !!apiKey,
    provider: LLM_CONFIG.provider,
    model: LLM_CONFIG.model,
    message: apiKey ? 'LLM intelligence active' : 'Add API key to enable LLM'
  };
}

/**
 * Test LLM analysis on a single URL
 */
function testLLMAnalysis(url, company) {
  const extraction = extractPageContent(url);
  if (!extraction.success) return extraction;
  
  const llmAnalysis = analyzeContentWithLLM(
    extraction.content,
    '',
    url,
    company
  );
  
  return {
    success: true,
    url: url,
    company: company,
    contentLength: extraction.contentLength,
    intelligence: llmAnalysis
  };
}

// ============ ORIGINAL FUNCTIONS (KEPT FOR COMPATIBILITY) ============

// Include all the original functions from IntelligentMonitor.gs here...
// (extractPageContent, extractTextFromHtml, analyzeContent, etc.)

/**
 * Extract and analyze content from a URL
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
    const intelligence = analyzeContent(textContent);
    
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
      intelligence: intelligence,
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
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  html = html.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
  html = html.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  html = html.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  html = html.replace(/<[^>]+>/g, ' ');
  html = html.replace(/&nbsp;/g, ' ');
  html = html.replace(/&amp;/g, '&');
  html = html.replace(/&lt;/g, '<');
  html = html.replace(/&gt;/g, '>');
  html = html.replace(/&quot;/g, '"');
  html = html.replace(/&#39;/g, "'");
  html = html.replace(/\s+/g, ' ');
  html = html.trim();
  
  return html;
}

/**
 * Basic content analysis
 */
function analyzeContent(content) {
  const intelligence = {
    messagingThemes: [],
    pricingSignals: [],
    productFeatures: [],
    techClaims: [],
    dates: []
  };
  
  const themeKeywords = ['ai', 'ml', 'model', 'api', 'enterprise', 'secure', 'privacy', 
                         'open source', 'platform', 'developer', 'assistant', 'agent'];
  intelligence.messagingThemes = themeKeywords.filter(keyword => 
    content.toLowerCase().includes(keyword)
  );
  
  const pricingPatterns = [
    /\$[\d,]+/g,
    /\d+\s*(?:USD|EUR|GBP)/gi,
    /(?:price|pricing|cost|fee)/gi,
    /(?:free|trial|demo)/gi
  ];
  pricingPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    intelligence.pricingSignals.push(...matches);
  });
  
  const featurePatterns = [
    /(?:\w+\s+)?(?:feature|tool|capability|service|product|model|API)/gi
  ];
  featurePatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    intelligence.productFeatures.push(...matches.slice(0, 10));
  });
  
  const claimPatterns = [
    /state-of-the-art/gi,
    /cutting-edge/gi,
    /revolutionary/gi,
    /breakthrough/gi,
    /industry-leading/gi
  ];
  claimPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    intelligence.techClaims.push(...matches);
  });
  
  const datePatterns = [
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/gi,
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g
  ];
  datePatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    intelligence.dates.push(...matches);
  });
  
  Object.keys(intelligence).forEach(key => {
    intelligence[key] = [...new Set(intelligence[key])];
  });
  
  return intelligence;
}

/**
 * Calculate relevance score for a change
 */
function calculateRelevanceScore(oldContent, newContent, url) {
  let score = 5;
  
  INTELLIGENT_CONFIG.keywords.high.forEach(keyword => {
    const oldCount = (oldContent.match(new RegExp(keyword, 'gi')) || []).length;
    const newCount = (newContent.match(new RegExp(keyword, 'gi')) || []).length;
    if (newCount > oldCount) {
      score += 2;
    }
  });
  
  INTELLIGENT_CONFIG.keywords.medium.forEach(keyword => {
    const oldCount = (oldContent.match(new RegExp(keyword, 'gi')) || []).length;
    const newCount = (newContent.match(new RegExp(keyword, 'gi')) || []).length;
    if (newCount > oldCount) {
      score += 1;
    }
  });
  
  INTELLIGENT_CONFIG.keywords.low.forEach(keyword => {
    if (newContent.toLowerCase().includes(keyword)) {
      score -= 1;
    }
  });
  
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
 * Generate change summary
 */
function generateChangeSummary(changes) {
  const summary = {
    totalChanges: changes.length,
    relevantChanges: changes.filter(c => c.relevanceScore >= INTELLIGENT_CONFIG.relevanceThreshold).length,
    byCompany: {},
    topChanges: []
  };
  
  changes.forEach(change => {
    if (!summary.byCompany[change.company]) {
      summary.byCompany[change.company] = {
        total: 0,
        relevant: 0,
        urls: []
      };
    }
    summary.byCompany[change.company].total++;
    if (change.relevanceScore >= INTELLIGENT_CONFIG.relevanceThreshold) {
      summary.byCompany[change.company].relevant++;
    }
    summary.byCompany[change.company].urls.push(change.url);
  });
  
  summary.topChanges = changes
    .filter(c => c.relevanceScore >= INTELLIGENT_CONFIG.relevanceThreshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5)
    .map(c => ({
      company: c.company,
      url: c.url,
      score: c.relevanceScore,
      keywords: c.keywords
    }));
  
  return summary;
}

/**
 * Process monitor enhanced (original)
 */
function processMonitorEnhanced(monitor) {
  const results = {
    company: monitor.company,
    urls: [],
    changes: [],
    errors: []
  };
  
  monitor.urls.forEach(url => {
    try {
      const extraction = extractPageContent(url);
      
      if (!extraction.success) {
        results.errors.push({
          url: url,
          error: extraction.error
        });
        return;
      }
      
      const baseline = getBaselineForUrl(url);
      
      if (!baseline) {
        storeBaseline(monitor.company, url, extraction);
        results.urls.push({
          url: url,
          status: 'baseline_created',
          contentLength: extraction.contentLength
        });
      } else {
        if (baseline.contentHash !== extraction.contentHash) {
          const oldContent = baseline.content || '';
          const newContent = extraction.content;
          
          const relevanceScore = calculateRelevanceScore(oldContent, newContent, url);
          const keywords = extractChangeKeywords(oldContent, newContent);
          
          const change = {
            company: monitor.company,
            url: url,
            oldHash: baseline.contentHash,
            newHash: extraction.contentHash,
            relevanceScore: relevanceScore,
            keywords: keywords,
            oldIntelligence: baseline.intelligence || {},
            newIntelligence: extraction.intelligence,
            detectedAt: new Date().toISOString()
          };
          
          results.changes.push(change);
          storeBaseline(monitor.company, url, extraction);
          
          results.urls.push({
            url: url,
            status: 'changed',
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
 * Extract keywords that changed
 */
function extractChangeKeywords(oldContent, newContent) {
  const keywords = [];
  
  const allKeywords = [
    ...INTELLIGENT_CONFIG.keywords.high,
    ...INTELLIGENT_CONFIG.keywords.medium
  ];
  
  allKeywords.forEach(keyword => {
    const oldCount = (oldContent.match(new RegExp(keyword, 'gi')) || []).length;
    const newCount = (newContent.match(new RegExp(keyword, 'gi')) || []).length;
    
    if (newCount > oldCount) {
      keywords.push(keyword);
    }
  });
  
  return keywords;
}

/**
 * Test content extraction
 */
function testContentExtraction(url) {
  const result = extractPageContent(url);
  
  if (result.success) {
    return {
      success: true,
      url: url,
      contentLength: result.contentLength,
      contentPreview: result.content.substring(0, 500),
      intelligence: result.intelligence,
      keywords: INTELLIGENT_CONFIG.keywords
    };
  } else {
    return result;
  }
}

/**
 * Test intelligent baseline generation
 */
function testIntelligentBaseline() {
  const monitors = getMonitorConfigurations();
  const results = [];
  
  monitors.slice(0, 1).forEach(monitor => {
    const monitorResult = processMonitorEnhanced(monitor);
    results.push(monitorResult);
  });
  
  return {
    success: true,
    monitorsProcessed: results.length,
    results: results
  };
}