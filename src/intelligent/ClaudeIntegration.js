/**
 * Claude Integration for AI Monitor
 * Add this to your Google Apps Script to enhance monitoring with AI
 */

// ============ CLAUDE ENHANCEMENT FOR MONITORING ============

// Use the existing INTELLIGENT_CONFIG from IntelligentMonitor.gs

/**
 * Enhanced processMonitorEnhanced with Claude AI
 * This replaces the existing processMonitorEnhanced function
 */
function processMonitorEnhanced(monitor) {
  const results = {
    company: monitor.company,
    urls: [],
    changes: [],
    errors: []
  };
  
  // Get Claude API key
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  const useClaudeAnalysis = !!apiKey;
  
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
      
      if (!baseline) {
        // First time seeing this URL
        storeBaseline(monitor.company, url, extraction);
        results.urls.push({
          url: url,
          status: 'baseline_created',
          contentLength: extraction.contentLength
        });
      } else {
        // Compare with baseline
        if (baseline.contentHash !== extraction.contentHash) {
          // Content changed!
          const oldContent = baseline.content || '';
          const newContent = extraction.content;
          
          // Basic relevance score
          let relevanceScore = calculateRelevanceScore(oldContent, newContent, url);
          let claudeInsights = null;
          
          // Enhance with Claude if available
          if (useClaudeAnalysis && relevanceScore >= 4) {
            try {
              claudeInsights = analyzeChangeWithClaude(
                oldContent,
                newContent,
                url,
                monitor.company
              );
              
              // Update relevance based on Claude's analysis
              if (claudeInsights.significanceScore) {
                relevanceScore = Math.max(relevanceScore, claudeInsights.significanceScore);
              }
            } catch (error) {
              console.error('Claude analysis failed:', error);
              // Continue with basic analysis
            }
          }
          
          // Extract keywords that changed
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
            claudeInsights: claudeInsights,
            detectedAt: new Date().toISOString()
          };
          
          results.changes.push(change);
          
          // Update baseline
          storeBaseline(monitor.company, url, extraction);
          
          // Store enhanced change with Claude insights
          storeDetectedChanges(change);
          
          results.urls.push({
            url: url,
            status: 'changed',
            relevanceScore: relevanceScore,
            alert: relevanceScore >= INTELLIGENT_CONFIG.relevanceThreshold,
            claudeAnalysis: claudeInsights ? claudeInsights.summary : null
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

/**
 * Analyze changes with Claude
 */
function analyzeChangeWithClaude(oldContent, newContent, url, company) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  
  if (!apiKey) {
    return null;
  }
  
  // Prepare content snippets
  const oldSnippet = oldContent.substring(0, 2000);
  const newSnippet = newContent.substring(0, 2000);
  
  const prompt = `You are analyzing website changes for competitive intelligence.

Company: ${company}
URL: ${url}

OLD CONTENT (excerpt):
${oldSnippet}

NEW CONTENT (excerpt):
${newSnippet}

Analyze what changed and why it matters. Provide a JSON response with:
{
  "summary": "2-3 sentence summary of key changes",
  "keyChanges": ["change 1", "change 2"],
  "competitiveIntel": ["insight 1", "insight 2"],
  "significanceScore": 1-10,
  "recommendations": ["action 1", "action 2"]
}`;

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
        max_tokens: 800,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      const analysis = JSON.parse(result.content[0].text);
      
      // Log successful Claude analysis
      logActivity('Claude analysis completed', 'success', {
        company: company,
        url: url
      });
      
      return analysis;
    } else {
      console.error('Claude API error:', response.getContentText());
      return null;
    }
    
  } catch (error) {
    console.error('Claude analysis error:', error);
    return null;
  }
}

/**
 * Enhanced monitoring summary with Claude insights
 */
function generateEnhancedSummary(changes) {
  const summary = generateChangeSummary(changes);
  
  // Add Claude insights if available
  const claudeChanges = changes.filter(c => c.claudeInsights);
  
  if (claudeChanges.length > 0) {
    summary.aiInsights = {
      totalAnalyzed: claudeChanges.length,
      topFindings: claudeChanges
        .filter(c => c.claudeInsights.significanceScore >= 7)
        .map(c => ({
          company: c.company,
          insight: c.claudeInsights.summary,
          score: c.claudeInsights.significanceScore
        }))
        .slice(0, 5),
      recommendations: claudeChanges
        .flatMap(c => c.claudeInsights.recommendations || [])
        .filter((r, i, arr) => arr.indexOf(r) === i) // unique
        .slice(0, 10)
    };
  }
  
  return summary;
}

/**
 * Test Claude integration
 */
function testClaudeIntegration() {
  const monitors = getMonitorConfigurations();
  const testMonitor = monitors[0]; // Test with Mistral AI
  
  console.log('Testing Claude integration with:', testMonitor.company);
  
  const result = processMonitorEnhanced(testMonitor);
  
  return {
    company: testMonitor.company,
    urlsChecked: result.urls.length,
    changesFound: result.changes.length,
    claudeAnalyses: result.changes.filter(c => c.claudeInsights).length,
    sample: result.changes[0] || 'No changes detected'
  };
}

/**
 * Run full monitoring with Claude
 */
function monitorAllWithClaude() {
  const startTime = new Date();
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  
  console.log('Starting enhanced monitoring with Claude:', !!apiKey);
  
  // Run standard monitoring (which now includes Claude)
  const results = monitorAllChanges();
  
  // Add enhanced summary if we have changes
  if (results.changes && results.changes.length > 0) {
    results.enhancedSummary = generateEnhancedSummary(results.changes);
  }
  
  const endTime = new Date();
  results.processingTime = (endTime - startTime) / 1000;
  results.claudeEnabled = !!apiKey;
  
  return results;
}

// ============ HELPER TO CHECK CLAUDE STATUS ============

/**
 * Check Claude integration status
 */
function checkClaudeStatus() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  
  return {
    apiKeySet: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    expectedKeyLength: 108, // Anthropic keys are typically 108 chars
    status: apiKey && apiKey.length === 108 ? 'Ready' : 'Check API key',
    recommendation: !apiKey ? 'Run setupClaudeNow()' : 'Claude is configured'
  };
}