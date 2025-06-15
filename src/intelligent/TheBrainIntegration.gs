/**
 * TheBrain Integration for AI Competitor Monitor
 * Enhances our competitive intelligence with dynamic knowledge mapping
 * Features flexible brain management: use existing brain or create new one
 */

// ============ THEBRAIN CONFIGURATION ============
const THEBRAIN_CONFIG = {
  apiKey: '8388b9cd07738668174a12571beb777df9e8266c533aa785a0c12534388d09ba',
  baseUrl: 'https://api.bra.in',
  enabled: true,
  defaultBrainName: 'AI Competitive Intelligence',
  
  // Categories for organizing thoughts
  categories: {
    companies: 'AI Companies',
    changes: 'Market Changes',
    technologies: 'Technologies',
    insights: 'Strategic Insights',
    trends: 'Industry Trends'
  }
};

// ============ FLEXIBLE BRAIN ID MANAGEMENT ============

/**
 * Get the configured brain ID - checks multiple sources
 * Priority: 1) Script Properties, 2) Manual override, 3) None (will create new)
 */
function getBrainId() {
  // First check script properties (persistent storage)
  const storedBrainId = PropertiesService.getScriptProperties().getProperty('theBrainId');
  if (storedBrainId) {
    return storedBrainId;
  }
  
  // If you have a specific brain you want to use, you can set it here:
  const manualBrainId = 'ffa43994-e9b6-45f5-b494-203b7c6451b9'; // Your existing brain
  if (manualBrainId) {
    // Store it for future use
    PropertiesService.getScriptProperties().setProperty('theBrainId', manualBrainId);
    return manualBrainId;
  }
  
  // No brain configured - will need to create one
  return null;
}

/**
 * Set the brain ID to use for this integration
 */
function setBrainId(brainId) {
  PropertiesService.getScriptProperties().setProperty('theBrainId', brainId);
  console.log(`TheBrain ID set to: ${brainId}`);
}

/**
 * Clear the configured brain ID (will create new brain on next use)
 */
function clearBrainId() {
  PropertiesService.getScriptProperties().deleteProperty('theBrainId');
  console.log('TheBrain ID cleared - will create new brain on next use');
}

// ============ BRAIN ACCESS & CREATION ============

/**
 * Get or create brain for competitive intelligence
 * Smart logic: use existing if configured, create new if not
 */
function getOrCreateBrain() {
  try {
    // Check if we have a configured brain ID
    const existingBrainId = getBrainId();
    
    if (existingBrainId) {
      // Try to access the existing brain
      console.log(`Attempting to use existing brain: ${existingBrainId}`);
      const verification = verifyBrainAccess(existingBrainId);
      
      if (verification.success) {
        console.log(`✅ Using existing brain: ${verification.brain.name || existingBrainId}`);
        return {
          success: true,
          brainId: existingBrainId,
          brainName: verification.brain.name,
          isNew: false,
          message: `Using existing brain: ${verification.brain.name || existingBrainId}`
        };
      } else {
        console.warn(`⚠️ Cannot access configured brain ${existingBrainId}: ${verification.error}`);
        console.log('Will create a new brain instead...');
        // Clear the invalid brain ID and continue to create new one
        clearBrainId();
      }
    }
    
    // No valid brain configured - create a new one
    console.log('Creating new competitive intelligence brain...');
    const newBrain = createCompetitiveIntelligenceBrain();
    
    if (newBrain.success) {
      // Store the new brain ID for future use
      setBrainId(newBrain.brainId);
      console.log(`✅ Created new brain: ${newBrain.brainName} (${newBrain.brainId})`);
      
      return {
        success: true,
        brainId: newBrain.brainId,
        brainName: newBrain.brainName,
        isNew: true,
        message: `Created new brain: ${newBrain.brainName}`
      };
    } else {
      throw new Error(`Failed to create new brain: ${newBrain.error}`);
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to get or create brain'
    };
  }
}

/**
 * Verify access to a specific brain
 */
function verifyBrainAccess(brainId) {
  try {
    if (!brainId) {
      throw new Error('No brain ID provided');
    }
    
    // Try to get brain info to verify access
    const brain = callTheBrainAPI('GET', `/brains/${brainId}`);
    
    return {
      success: true,
      brain: brain,
      message: `Access verified to brain: ${brain.name || brainId}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Cannot access brain'
    };
  }
}

/**
 * Create a new competitive intelligence brain
 */
function createCompetitiveIntelligenceBrain() {
  try {
    const brainData = {
      name: THEBRAIN_CONFIG.defaultBrainName,
      description: 'Automated competitive intelligence brain created by AI Competitor Monitor',
      tags: ['competitive-intelligence', 'ai-industry', 'automated'],
      isPrivate: true
    };
    
    const brain = callTheBrainAPI('POST', '/brains', brainData);
    
    return {
      success: true,
      brainId: brain.id,
      brainName: brain.name,
      message: 'New competitive intelligence brain created'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to create new brain'
    };
  }
}

// ============ THEBRAIN API FUNCTIONS ============

/**
 * Test TheBrain API connection and brain access
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
    
    // Test getting or creating a brain
    const brainResult = getOrCreateBrain();
    
    if (brainResult.success) {
      return {
        success: true,
        brainId: brainResult.brainId,
        brainName: brainResult.brainName,
        isNew: brainResult.isNew,
        message: `Connection successful: ${brainResult.message}`
      };
    } else {
      return brainResult;
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      message: 'TheBrain connection failed'
    };
  }
}

/**
 * Initialize competitive intelligence in brain (existing or new)
 */
function initializeCompetitiveIntelligence() {
  try {
    // Get or create brain
    const brainResult = getOrCreateBrain();
    if (!brainResult.success) {
      throw new Error(`Brain setup failed: ${brainResult.error}`);
    }
    
    const brainId = brainResult.brainId;
    
    // Create category thoughts if they don't exist
    const categoriesCreated = initializeCategoryThoughts(brainId);
    
    logActivity('TheBrain competitive intelligence initialized', 'success', {
      brainId: brainId,
      brainName: brainResult.brainName,
      isNewBrain: brainResult.isNew,
      categoriesCreated: categoriesCreated
    });
    
    return {
      success: true,
      brainId: brainId,
      brainName: brainResult.brainName,
      isNewBrain: brainResult.isNew,
      categoriesCreated: categoriesCreated,
      message: `Competitive intelligence initialized: ${brainResult.message}`
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Initialize or verify category organizing thoughts
 */
function initializeCategoryThoughts(brainId) {
  let categoriesCreated = 0;
  
  Object.entries(THEBRAIN_CONFIG.categories).forEach(([key, categoryName]) => {
    try {
      // Check if category already exists
      const existingThoughts = findThoughtsByName(brainId, categoryName);
      
      if (existingThoughts.length === 0) {
        // Create new category thought
        const thoughtData = {
          name: categoryName,
          label: categoryName,
          thoughtType: 'category',
          notes: `Category for organizing ${categoryName.toLowerCase()} in competitive intelligence`
        };
        
        const thought = callTheBrainAPI('POST', `/brains/${brainId}/thoughts`, thoughtData);
        
        // Store category thought ID
        const storageKey = `theBrainCategory_${key}`;
        PropertiesService.getScriptProperties().setProperty(storageKey, thought.id);
        
        categoriesCreated++;
        console.log(`Created category: ${categoryName}`);
      } else {
        // Store existing category thought ID
        const storageKey = `theBrainCategory_${key}`;
        PropertiesService.getScriptProperties().setProperty(storageKey, existingThoughts[0].id);
        console.log(`Found existing category: ${categoryName}`);
      }
    } catch (error) {
      console.error(`Error with category ${categoryName}:`, error);
    }
  });
  
  return categoriesCreated;
}

/**
 * Add AI company thoughts to the brain
 */
function addCompaniesToBrain() {
  try {
    // Get or create brain
    const brainResult = getOrCreateBrain();
    if (!brainResult.success) {
      throw new Error(`Brain setup failed: ${brainResult.error}`);
    }
    
    const brainId = brainResult.brainId;
    const config = getCompleteMonitorConfig();
    const companiesCategory = PropertiesService.getScriptProperties().getProperty('theBrainCategory_companies');
    
    let companiesAdded = 0;
    let companiesUpdated = 0;
    
    config.forEach(companyConfig => {
      try {
        // Check if company already exists
        const existingCompanies = findThoughtsByName(brainId, companyConfig.company);
        
        if (existingCompanies.length === 0) {
          // Create new company thought
          const companyThought = {
            name: companyConfig.company,
            label: companyConfig.company,
            thoughtType: 'company',
            notes: `AI Company: ${companyConfig.company}\nURLs monitored: ${companyConfig.urls.length}\nAdded by AI Competitor Monitor`,
            tags: ['ai-company', 'competitor']
          };
          
          const company = callTheBrainAPI('POST', `/brains/${brainId}/thoughts`, companyThought);
          companiesAdded++;
          
          // Link to companies category
          if (companiesCategory) {
            linkThoughts(brainId, companiesCategory, company.id, 'contains');
          }
          
          console.log(`Added company: ${companyConfig.company}`);
        } else {
          companiesUpdated++;
          console.log(`Company already exists: ${companyConfig.company}`);
        }
        
      } catch (companyError) {
        console.error(`Error processing company ${companyConfig.company}:`, companyError);
      }
    });
    
    return {
      success: true,
      brainId: brainId,
      brainName: brainResult.brainName,
      companiesAdded: companiesAdded,
      companiesUpdated: companiesUpdated,
      totalCompanies: config.length,
      message: `Companies processed: ${companiesAdded} added, ${companiesUpdated} existing`
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
    if (!THEBRAIN_CONFIG.enabled) {
      return null; // Silent fail if TheBrain not configured
    }
    
    // Get or create brain
    const brainResult = getOrCreateBrain();
    if (!brainResult.success) {
      console.error('Cannot add change to TheBrain - brain setup failed:', brainResult.error);
      return null;
    }
    
    const brainId = brainResult.brainId;
    
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
    const changesCategory = PropertiesService.getScriptProperties().getProperty('theBrainCategory_changes');
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
      brainId: brainId,
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
  
  const insightsCategory = PropertiesService.getScriptProperties().getProperty('theBrainCategory_insights');
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
    // Get or create brain
    const brainResult = getOrCreateBrain();
    if (!brainResult.success) {
      throw new Error(`Brain setup failed: ${brainResult.error}`);
    }
    
    const brainId = brainResult.brainId;
    
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
    const trendsCategory = PropertiesService.getScriptProperties().getProperty('theBrainCategory_trends');
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
      brainId: brainId,
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
  const currentBrainId = getBrainId();
  
  return {
    enabled: THEBRAIN_CONFIG.enabled,
    apiKey: THEBRAIN_CONFIG.apiKey ? 'configured' : 'missing',
    brainId: currentBrainId,
    brainConfigured: !!currentBrainId,
    brainName: THEBRAIN_CONFIG.defaultBrainName,
    categories: Object.keys(THEBRAIN_CONFIG.categories).length
  };
}

/**
 * Test TheBrain integration end-to-end
 */
function testTheBrainIntegration() {
  try {
    console.log('Testing TheBrain integration...');
    
    // 1. Test connection and brain access/creation
    const connectionTest = testTheBrainConnection();
    console.log('Connection test:', connectionTest.success ? 'PASS' : 'FAIL');
    
    if (!connectionTest.success) {
      return connectionTest;
    }
    
    // 2. Initialize competitive intelligence (categories)
    const initResult = initializeCompetitiveIntelligence();
    console.log('Initialization test:', initResult.success ? 'PASS' : 'FAIL');
    
    if (!initResult.success) {
      return initResult;
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
    console.log('Change test:', changeResult ? (changeResult.success ? 'PASS' : 'FAIL') : 'SKIP');
    
    return {
      success: true,
      brainId: connectionTest.brainId,
      brainName: connectionTest.brainName,
      isNewBrain: connectionTest.isNew,
      tests: {
        connection: connectionTest.success,
        initialization: initResult.success,
        companies: companiesResult.success,
        changes: changeResult ? changeResult.success : false
      },
      results: {
        categoriesCreated: initResult.categoriesCreated,
        companiesAdded: companiesResult.companiesAdded,
        companiesUpdated: companiesResult.companiesUpdated
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

// ============ UTILITY FUNCTIONS ============

/**
 * Force use of a specific brain ID
 */
function forceUseBrain(brainId) {
  if (!brainId) {
    throw new Error('Brain ID required');
  }
  
  const verification = verifyBrainAccess(brainId);
  if (verification.success) {
    setBrainId(brainId);
    return {
      success: true,
      brainId: brainId,
      brainName: verification.brain.name,
      message: `Now using brain: ${verification.brain.name}`
    };
  } else {
    return {
      success: false,
      error: verification.error,
      message: 'Cannot access specified brain'
    };
  }
}

/**
 * Get current brain information
 */
function getCurrentBrainInfo() {
  const brainId = getBrainId();
  if (!brainId) {
    return {
      configured: false,
      message: 'No brain configured - will create new brain on first use'
    };
  }
  
  const verification = verifyBrainAccess(brainId);
  return {
    configured: true,
    brainId: brainId,
    accessible: verification.success,
    brainName: verification.success ? verification.brain.name : 'Unknown',
    error: verification.success ? null : verification.error,
    message: verification.message
  };
}