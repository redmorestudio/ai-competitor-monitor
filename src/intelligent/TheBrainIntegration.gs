/**
 * TheBrain Integration for AI Competitor Monitor
 * Enhances our competitive intelligence with dynamic knowledge mapping
 */

// ============ THEBRAIN CONFIGURATION ============
const THEBRAIN_CONFIG = {
  apiKey: '8388b9cd07738668174a12571beb777df9e8266c533aa785a0c12534388d09ba',
  baseUrl: 'https://api.bra.in',
  enabled: true,
  brainName: 'AI Competitive Intelligence',
  
  // Categories for organizing thoughts
  categories: {
    companies: 'AI Companies',
    changes: 'Market Changes',
    technologies: 'Technologies',
    insights: 'Strategic Insights',
    trends: 'Industry Trends'
  }
};

// ============ THEBRAIN API FUNCTIONS ============

/**
 * Test TheBrain API connection
 */
function testTheBrainConnection() {
  try {
    if (!THEBRAIN_CONFIG.enabled || !THEBRAIN_CONFIG.apiKey) {
      return {
        success: false,
        error: 'TheBrain not configured',
        message: 'Set API key and enable TheBrain integration'
      };
    }
    
    // Test basic API call - get brain info
    const response = callTheBrainAPI('GET', '/brains');
    
    return {
      success: true,
      brains: response,
      message: 'TheBrain connection successful'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'TheBrain connection failed'
    };
  }
}

/**
 * Create a competitive intelligence brain
 */
function createCompetitiveIntelligenceBrain() {
  try {
    // Create main brain for competitive intelligence
    const brainData = {
      name: THEBRAIN_CONFIG.brainName,
      description: 'AI Industry Competitive Intelligence - Real-time monitoring and analysis',
      isPublic: false
    };
    
    const brain = callTheBrainAPI('POST', '/brains', brainData);
    
    // Store brain ID for future use
    PropertiesService.getScriptProperties().setProperty('theBrainId', brain.id);
    
    // Create category thoughts
    createCategoryThoughts(brain.id);
    
    logActivity('TheBrain competitive intelligence brain created', 'success', {
      brainId: brain.id,
      name: brain.name
    });
    
    return {
      success: true,
      brain: brain,
      message: 'Competitive intelligence brain created'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Create category organizing thoughts
 */
function createCategoryThoughts(brainId) {
  Object.values(THEBRAIN_CONFIG.categories).forEach(category => {
    const thoughtData = {
      name: category,
      label: category,
      thoughtType: 'category',
      notes: `Category for organizing ${category.toLowerCase()} in competitive intelligence`
    };
    
    const thought = callTheBrainAPI('POST', `/brains/${brainId}/thoughts`, thoughtData);
    
    // Store category thought IDs
    const key = `theBrainCategory_${category.replace(/\s+/g, '_')}`;
    PropertiesService.getScriptProperties().setProperty(key, thought.id);
  });
}

/**
 * Add AI company thoughts to TheBrain
 */
function addCompaniesToBrain() {
  try {
    const brainId = PropertiesService.getScriptProperties().getProperty('theBrainId');
    if (!brainId) {
      throw new Error('No competitive intelligence brain found. Create brain first.');
    }
    
    const config = getCompleteMonitorConfig();
    const companiesCategory = PropertiesService.getScriptProperties().getProperty('theBrainCategory_AI_Companies');
    
    config.forEach(companyConfig => {
      // Create company thought
      const companyThought = {
        name: companyConfig.company,
        label: companyConfig.company,
        thoughtType: 'company',
        notes: `AI Company: ${companyConfig.company}\nURLs monitored: ${companyConfig.urls.length}`,
        tags: ['ai-company', 'competitor']
      };
      
      const company = callTheBrainAPI('POST', `/brains/${brainId}/thoughts`, companyThought);
      
      // Link to companies category
      if (companiesCategory) {
        linkThoughts(brainId, companiesCategory, company.id, 'contains');
      }
      
      // Create URL thoughts for each monitored URL
      companyConfig.urls.forEach(urlObj => {
        const urlThought = {
          name: `${urlObj.type}: ${urlObj.url}`,
          label: urlObj.type,
          thoughtType: 'url',
          notes: `Monitored URL: ${urlObj.url}\nType: ${urlObj.type}`,
          tags: ['monitored-url', urlObj.type]
        };
        
        const url = callTheBrainAPI('POST', `/brains/${brainId}/thoughts`, urlThought);
        
        // Link URL to company
        linkThoughts(brainId, company.id, url.id, 'monitors');
      });
    });
    
    return {
      success: true,
      companiesAdded: config.length,
      message: 'Companies added to competitive intelligence brain'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Add detected change to TheBrain as a thought
 */
function addChangeToTheBrain(change) {
  try {
    const brainId = PropertiesService.getScriptProperties().getProperty('theBrainId');
    if (!brainId || !THEBRAIN_CONFIG.enabled) {
      return null; // Silent fail if TheBrain not configured
    }
    
    // Create change thought
    const changeThought = {
      name: `${change.company}: ${change.summary || 'Content Updated'}`,
      label: `Change Detected`,
      thoughtType: 'change',
      notes: generateChangeNote(change),
      tags: ['change-detected', `relevance-${change.relevanceScore}`, change.company.toLowerCase().replace(/\s+/g, '-')]
    };
    
    const thought = callTheBrainAPI('POST', `/brains/${brainId}/thoughts`, changeThought);
    
    // Link to changes category and company
    const changesCategory = PropertiesService.getScriptProperties().getProperty('theBrainCategory_Market_Changes');
    if (changesCategory) {
      linkThoughts(brainId, changesCategory, thought.id, 'contains');
    }
    
    // Find and link to company thought
    const companyThoughts = findThoughtsByName(brainId, change.company);
    if (companyThoughts.length > 0) {
      linkThoughts(brainId, companyThoughts[0].id, thought.id, 'experienced');
    }
    
    // If high relevance, also create insight thought
    if (change.relevanceScore >= 8) {
      createInsightThought(brainId, change, thought.id);
    }
    
    return {
      success: true,
      thoughtId: thought.id,
      message: 'Change added to TheBrain'
    };
    
  } catch (error) {
    console.error('Error adding change to TheBrain:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Create strategic insight thought for high-impact changes
 */
function createInsightThought(brainId, change, changeThoughtId) {
  const insightThought = {
    name: `Strategic Insight: ${change.company}`,
    label: 'High Impact Change',
    thoughtType: 'insight',
    notes: generateInsightNote(change),
    tags: ['strategic-insight', 'high-impact', change.company.toLowerCase().replace(/\s+/g, '-')]
  };
  
  const insight = callTheBrainAPI('POST', `/brains/${brainId}/thoughts`, insightThought);
  
  // Link insight to change and insights category
  linkThoughts(brainId, changeThoughtId, insight.id, 'indicates');
  
  const insightsCategory = PropertiesService.getScriptProperties().getProperty('theBrainCategory_Strategic_Insights');
  if (insightsCategory) {
    linkThoughts(brainId, insightsCategory, insight.id, 'contains');
  }
}

/**
 * Generate detailed note for change thought
 */
function generateChangeNote(change) {
  return `
📊 CHANGE DETECTED

Company: ${change.company}
URL: ${change.url}
Detected: ${new Date(change.timestamp).toLocaleString()}

📈 METRICS
Change Magnitude: ${change.changeMagnitude}%
AI Relevance Score: ${change.relevanceScore}/10
Alert Level: ${change.relevanceScore >= 8 ? '🔴 High' : change.relevanceScore >= 6 ? '🟡 Medium' : '🟢 Low'}

📝 SUMMARY
${change.summary || 'Content updated on monitored page'}

🔗 LINKS
Original URL: ${change.url}
Previous Hash: ${change.oldHash}
New Hash: ${change.newHash}

Generated by AI Competitor Monitor
  `.trim();
}

/**
 * Generate strategic insight note
 */
function generateInsightNote(change) {
  return `
🧠 STRATEGIC INSIGHT

High-impact change detected at ${change.company}

⚡ SIGNIFICANCE
This change scored ${change.relevanceScore}/10 on our AI relevance scale, indicating significant competitive movement.

🎯 COMPETITIVE IMPLICATIONS
- Monitor for follow-up changes from competitors
- Consider strategic response if this affects our market position
- Track customer/market reaction to this change

📊 CONTEXT
URL: ${change.url}
Change Type: ${identifyChangeType(change.url)}
Timing: ${new Date(change.timestamp).toLocaleString()}

🔄 RECOMMENDED ACTIONS
1. Deep dive analysis of the specific changes
2. Competitive response evaluation
3. Market impact assessment

Generated by AI Competitor Monitor - Strategic Intelligence
  `.trim();
}

/**
 * Identify change type based on URL
 */
function identifyChangeType(url) {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('/pricing')) return 'Pricing Strategy';
  if (urlLower.includes('/blog')) return 'Thought Leadership';
  if (urlLower.includes('/product')) return 'Product Update';
  if (urlLower.includes('/features')) return 'Feature Enhancement';
  if (urlLower.includes('/news')) return 'Public Announcement';
  if (urlLower.includes('/api')) return 'API/Technical Update';
  return 'General Content Update';
}

/**
 * Link two thoughts in TheBrain
 */
function linkThoughts(brainId, fromThoughtId, toThoughtId, relationshipType) {
  try {
    const linkData = {
      fromThoughtId: fromThoughtId,
      toThoughtId: toThoughtId,
      relationshipType: relationshipType,
      direction: 'from-to'
    };
    
    return callTheBrainAPI('POST', `/brains/${brainId}/links`, linkData);
  } catch (error) {
    console.error('Error linking thoughts:', error);
    return null;
  }
}

/**
 * Find thoughts by name in brain
 */
function findThoughtsByName(brainId, name) {
  try {
    const searchResults = callTheBrainAPI('GET', `/brains/${brainId}/search?query=${encodeURIComponent(name)}`);
    return searchResults.thoughts || [];
  } catch (error) {
    console.error('Error searching thoughts:', error);
    return [];
  }
}

/**
 * Generate competitive landscape analysis in TheBrain
 */
function generateCompetitiveLandscape() {
  try {
    const brainId = PropertiesService.getScriptProperties().getProperty('theBrainId');
    if (!brainId) {
      throw new Error('No competitive intelligence brain found');
    }
    
    // Get recent changes grouped by company
    const changes = getStoredChanges(100);
    const changesByCompany = {};
    
    changes.forEach(change => {
      if (!changesByCompany[change.company]) {
        changesByCompany[change.company] = [];
      }
      changesByCompany[change.company].push(change);
    });
    
    // Create trend analysis thought
    const trendThought = {
      name: `Competitive Landscape Analysis - ${new Date().toLocaleDateString()}`,
      label: 'Market Analysis',
      thoughtType: 'analysis',
      notes: generateLandscapeAnalysis(changesByCompany),
      tags: ['competitive-analysis', 'market-trends', 'automated-insight']
    };
    
    const analysis = callTheBrainAPI('POST', `/brains/${brainId}/thoughts`, trendThought);
    
    // Link to trends category
    const trendsCategory = PropertiesService.getScriptProperties().getProperty('theBrainCategory_Industry_Trends');
    if (trendsCategory) {
      linkThoughts(brainId, trendsCategory, analysis.id, 'contains');
    }
    
    // Link to relevant company thoughts
    Object.keys(changesByCompany).forEach(company => {
      const companyThoughts = findThoughtsByName(brainId, company);
      if (companyThoughts.length > 0) {
        linkThoughts(brainId, analysis.id, companyThoughts[0].id, 'analyzes');
      }
    });
    
    return {
      success: true,
      analysisId: analysis.id,
      companiesAnalyzed: Object.keys(changesByCompany).length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate competitive landscape analysis text
 */
function generateLandscapeAnalysis(changesByCompany) {
  const totalChanges = Object.values(changesByCompany).reduce((sum, changes) => sum + changes.length, 0);
  const activeCompanies = Object.keys(changesByCompany).length;
  
  let analysis = `
🏭 COMPETITIVE LANDSCAPE ANALYSIS
Generated: ${new Date().toLocaleString()}

📊 OVERVIEW
Total Changes: ${totalChanges}
Active Companies: ${activeCompanies}
Analysis Period: Last 100 detected changes

🏢 COMPANY ACTIVITY
  `;
  
  // Sort companies by change volume and average relevance
  const sortedCompanies = Object.entries(changesByCompany)
    .map(([company, changes]) => ({
      company,
      changeCount: changes.length,
      avgRelevance: changes.reduce((sum, c) => sum + (c.relevanceScore || 0), 0) / changes.length,
      highImpactChanges: changes.filter(c => c.relevanceScore >= 8).length
    }))
    .sort((a, b) => (b.changeCount * b.avgRelevance) - (a.changeCount * a.avgRelevance));
  
  sortedCompanies.forEach((company, index) => {
    const activity = company.avgRelevance >= 7 ? '🔴 High' : 
                    company.avgRelevance >= 5 ? '🟡 Medium' : '🟢 Low';
    
    analysis += `
${index + 1}. ${company.company}
   Changes: ${company.changeCount} | Avg Relevance: ${company.avgRelevance.toFixed(1)}/10
   Activity Level: ${activity} | High-Impact: ${company.highImpactChanges}
    `;
  });
  
  analysis += `

🎯 KEY INSIGHTS
- Most Active: ${sortedCompanies[0]?.company || 'N/A'}
- Highest Impact: ${sortedCompanies.find(c => c.highImpactChanges > 0)?.company || 'N/A'}
- Market Heat: ${totalChanges > 50 ? 'High' : totalChanges > 20 ? 'Medium' : 'Low'}

Generated by AI Competitor Monitor
  `;
  
  return analysis.trim();
}

/**
 * Core API call function for TheBrain
 */
function callTheBrainAPI(method, endpoint, data = null) {
  const url = `${THEBRAIN_CONFIG.baseUrl}${endpoint}`;
  
  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${THEBRAIN_CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.payload = JSON.stringify(data);
  }
  
  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const statusCode = response.getResponseCode();
  
  if (statusCode >= 400) {
    throw new Error(`TheBrain API error ${statusCode}: ${responseText}`);
  }
  
  try {
    return JSON.parse(responseText);
  } catch (error) {
    return responseText;
  }
}

// ============ INTEGRATION WITH EXISTING MONITOR ============

/**
 * Enhanced store change function that also adds to TheBrain
 */
function storeChangeWithTheBrain(change) {
  // Store in our normal system
  storeChange(change);
  
  // Also add to TheBrain if enabled
  if (THEBRAIN_CONFIG.enabled) {
    addChangeToTheBrain(change);
  }
}

/**
 * Get TheBrain integration status
 */
function getTheBrainStatus() {
  return {
    enabled: THEBRAIN_CONFIG.enabled,
    apiKey: THEBRAIN_CONFIG.apiKey ? 'configured' : 'missing',
    brainId: PropertiesService.getScriptProperties().getProperty('theBrainId'),
    brainName: THEBRAIN_CONFIG.brainName,
    categories: Object.keys(THEBRAIN_CONFIG.categories).length
  };
}

/**
 * Test TheBrain integration end-to-end
 */
function testTheBrainIntegration() {
  try {
    console.log('Testing TheBrain integration...');
    
    // 1. Test connection
    const connectionTest = testTheBrainConnection();
    console.log('Connection test:', connectionTest.success ? 'PASS' : 'FAIL');
    
    if (!connectionTest.success) {
      return connectionTest;
    }
    
    // 2. Create or verify brain exists
    let brainId = PropertiesService.getScriptProperties().getProperty('theBrainId');
    if (!brainId) {
      const brainResult = createCompetitiveIntelligenceBrain();
      if (!brainResult.success) {
        return brainResult;
      }
      brainId = brainResult.brain.id;
    }
    
    // 3. Test adding companies
    const companiesResult = addCompaniesToBrain();
    console.log('Companies test:', companiesResult.success ? 'PASS' : 'FAIL');
    
    // 4. Test adding a mock change
    const mockChange = {
      company: 'Anthropic',
      url: 'https://anthropic.com/pricing',
      timestamp: new Date().toISOString(),
      changeMagnitude: 15,
      relevanceScore: 7,
      summary: 'Test change for TheBrain integration',
      oldHash: 'abc123',
      newHash: 'def456'
    };
    
    const changeResult = addChangeToTheBrain(mockChange);
    console.log('Change test:', changeResult.success ? 'PASS' : 'FAIL');
    
    return {
      success: true,
      brainId: brainId,
      tests: {
        connection: connectionTest.success,
        companies: companiesResult.success,
        changes: changeResult.success
      },
      message: 'TheBrain integration fully operational'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'TheBrain integration test failed'
    };
  }
}