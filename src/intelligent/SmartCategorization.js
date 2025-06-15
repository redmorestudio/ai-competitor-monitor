/**
 * Smart Categorization & Competitive Intelligence Module
 * Automatically categorizes changes and extracts competitive insights
 */

// ============ CATEGORIZATION CONFIGURATION ============
const CATEGORY_CONFIG = {
  // Change categories with detection patterns
  categories: {
    'product_launch': {
      priority: 10,
      indicators: [
        'launch', 'announce', 'introducing', 'unveil', 'release',
        'now available', 'new product', 'debut', 'premiere'
      ],
      contentPatterns: [
        /introducing\s+\w+/gi,
        /proud to announce/gi,
        /now available/gi,
        /launching today/gi
      ],
      magnitudeThreshold: 20 // Usually significant content change
    },
    
    'pricing_change': {
      priority: 9,
      indicators: [
        'price', 'pricing', 'cost', 'fee', 'subscription',
        'plan', 'tier', 'enterprise', 'pro', 'premium'
      ],
      contentPatterns: [
        /\$\d+/g,
        /\d+\s*(?:USD|EUR|GBP)/gi,
        /per\s+(?:month|year|user)/gi,
        /pricing\s+(?:update|change)/gi
      ],
      magnitudeThreshold: 10
    },
    
    'feature_update': {
      priority: 8,
      indicators: [
        'feature', 'capability', 'improvement', 'enhance',
        'upgrade', 'performance', 'faster', 'better'
      ],
      contentPatterns: [
        /new\s+features?/gi,
        /improved\s+\w+/gi,
        /\d+x\s+faster/gi,
        /enhanced\s+\w+/gi
      ],
      magnitudeThreshold: 15
    },
    
    'partnership': {
      priority: 7,
      indicators: [
        'partner', 'partnership', 'collaboration', 'integrate',
        'alliance', 'joint', 'together with'
      ],
      contentPatterns: [
        /partnership with/gi,
        /collaborat\w+\s+with/gi,
        /integrated with/gi,
        /powered by/gi
      ],
      magnitudeThreshold: 10
    },
    
    'strategic_shift': {
      priority: 8,
      indicators: [
        'vision', 'mission', 'strategy', 'direction', 'focus',
        'pivot', 'transform', 'evolution'
      ],
      contentPatterns: [
        /new\s+(?:vision|mission|strategy)/gi,
        /strategic\s+\w+/gi,
        /focus(?:ing)?\s+on/gi
      ],
      magnitudeThreshold: 30
    },
    
    'technical_update': {
      priority: 6,
      indicators: [
        'api', 'sdk', 'library', 'framework', 'model',
        'algorithm', 'architecture', 'infrastructure'
      ],
      contentPatterns: [
        /API\s+v?\d+/gi,
        /model\s+\w+/gi,
        /SDK\s+release/gi
      ],
      magnitudeThreshold: 10
    },
    
    'content_update': {
      priority: 4,
      indicators: [
        'blog', 'article', 'post', 'update', 'news'
      ],
      contentPatterns: [
        /blog\s+post/gi,
        /article\s+about/gi
      ],
      magnitudeThreshold: 5
    },
    
    'minor_update': {
      priority: 2,
      indicators: [
        'fix', 'patch', 'typo', 'correction', 'minor'
      ],
      contentPatterns: [
        /bug\s+fix/gi,
        /minor\s+\w+/gi
      ],
      magnitudeThreshold: 5
    }
  },
  
  // Competitive intelligence patterns
  competitivePatterns: {
    competitors: [
      'OpenAI', 'GPT', 'ChatGPT', 'Claude', 'Anthropic', 'Google', 'Gemini',
      'Meta', 'Llama', 'Microsoft', 'Azure', 'AWS', 'Cohere', 'Stability',
      'Midjourney', 'Runway', 'Pika', 'ElevenLabs'
    ],
    
    positioning: [
      'better than', 'compared to', 'versus', 'vs', 'unlike',
      'competitive advantage', 'differentiat', 'unique'
    ],
    
    marketClaims: [
      'market leader', 'industry first', 'largest', 'fastest',
      'most accurate', 'state of the art', 'cutting edge'
    ]
  }
};

// ============ SMART CATEGORIZATION FUNCTIONS ============

/**
 * Categorize a change based on multiple signals
 */
function categorizeChangeIntelligent(change, llmAnalysis) {
  const scores = {};
  
  // Use LLM category if highly confident
  if (llmAnalysis?.category && llmAnalysis.significanceScore >= 7) {
    return mapLLMCategory(llmAnalysis.category);
  }
  
  // Score each category
  Object.entries(CATEGORY_CONFIG.categories).forEach(([category, config]) => {
    let score = 0;
    
    // Check indicators in content
    const content = change.newContent || '';
    const contentLower = content.toLowerCase();
    
    config.indicators.forEach(indicator => {
      if (contentLower.includes(indicator)) {
        score += 2;
      }
    });
    
    // Check content patterns
    config.contentPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length;
      }
    });
    
    // Check magnitude threshold
    if (change.magnitude && change.magnitude.percentageChange >= config.magnitudeThreshold) {
      score += 3;
    }
    
    // Apply priority weighting
    score *= (config.priority / 10);
    
    scores[category] = score;
  });
  
  // Find highest scoring category
  const topCategory = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)[0];
  
  // Default to content_update if no strong signal
  return topCategory && topCategory[1] > 5 ? topCategory[0] : 'content_update';
}

/**
 * Map LLM categories to our schema
 */
function mapLLMCategory(llmCategory) {
  const mapping = {
    'product': 'product_launch',
    'pricing': 'pricing_change',
    'feature': 'feature_update',
    'partnership': 'partnership',
    'strategy': 'strategic_shift',
    'technical': 'technical_update',
    'content': 'content_update',
    'minor': 'minor_update'
  };
  
  for (const [key, value] of Object.entries(mapping)) {
    if (llmCategory.toLowerCase().includes(key)) {
      return value;
    }
  }
  
  return 'content_update';
}

// ============ COMPETITIVE INTELLIGENCE EXTRACTION ============

/**
 * Extract competitive intelligence from content
 */
function extractCompetitiveIntelligence(content, company, llmAnalysis) {
  const intelligence = {
    competitorMentions: [],
    positioning: [],
    marketClaims: [],
    comparisons: [],
    threats: [],
    opportunities: []
  };
  
  // Use LLM insights if available
  if (llmAnalysis?.competitiveIntel) {
    intelligence.competitorMentions = llmAnalysis.competitiveIntel;
  }
  
  // Extract competitor mentions
  CATEGORY_CONFIG.competitivePatterns.competitors.forEach(competitor => {
    const pattern = new RegExp(`\\b${competitor}\\b`, 'gi');
    const matches = content.match(pattern);
    if (matches) {
      const context = extractContext(content, competitor);
      intelligence.competitorMentions.push({
        competitor: competitor,
        mentions: matches.length,
        context: context
      });
    }
  });
  
  // Extract positioning statements
  CATEGORY_CONFIG.competitivePatterns.positioning.forEach(phrase => {
    const pattern = new RegExp(`${phrase}\\s+[\\w\\s]{0,50}`, 'gi');
    const matches = content.match(pattern);
    if (matches) {
      intelligence.positioning.push(...matches);
    }
  });
  
  // Extract market claims
  CATEGORY_CONFIG.competitivePatterns.marketClaims.forEach(claim => {
    if (content.toLowerCase().includes(claim)) {
      const context = extractContext(content, claim);
      intelligence.marketClaims.push({
        claim: claim,
        context: context
      });
    }
  });
  
  // Analyze comparisons
  const comparisonPatterns = [
    /compared to\s+(\w+)/gi,
    /versus\s+(\w+)/gi,
    /unlike\s+(\w+)/gi,
    /better than\s+(\w+)/gi
  ];
  
  comparisonPatterns.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      intelligence.comparisons.push({
        type: match[0].split(' ')[0],
        target: match[1],
        context: extractContext(content, match[0])
      });
    }
  });
  
  // Identify threats and opportunities
  if (intelligence.competitorMentions.length > 2) {
    intelligence.threats.push('Multiple competitor references - possible competitive pressure');
  }
  
  if (intelligence.marketClaims.length > 0) {
    intelligence.opportunities.push('Strong market positioning claims to monitor');
  }
  
  return intelligence;
}

/**
 * Extract context around a term
 */
function extractContext(content, term, contextLength = 100) {
  const index = content.toLowerCase().indexOf(term.toLowerCase());
  if (index === -1) return '';
  
  const start = Math.max(0, index - contextLength);
  const end = Math.min(content.length, index + term.length + contextLength);
  
  return '...' + content.substring(start, end).trim() + '...';
}

// ============ PATTERN RECOGNITION & TRENDS ============

/**
 * Detect patterns across multiple changes
 */
function detectPatterns(changes) {
  const patterns = {
    byCategory: {},
    byCompany: {},
    timeSeries: [],
    industryTrends: [],
    emergingThemes: []
  };
  
  // Group by category
  changes.forEach(change => {
    const category = change.category || 'uncategorized';
    if (!patterns.byCategory[category]) {
      patterns.byCategory[category] = {
        count: 0,
        companies: new Set(),
        examples: []
      };
    }
    patterns.byCategory[category].count++;
    patterns.byCategory[category].companies.add(change.company);
    if (patterns.byCategory[category].examples.length < 3) {
      patterns.byCategory[category].examples.push({
        company: change.company,
        summary: change.summary
      });
    }
  });
  
  // Identify industry trends
  Object.entries(patterns.byCategory).forEach(([category, data]) => {
    if (data.companies.size >= 3) {
      patterns.industryTrends.push({
        trend: `Multiple companies (${data.companies.size}) showing ${category}`,
        category: category,
        companies: Array.from(data.companies)
      });
    }
  });
  
  // Extract emerging themes from summaries
  const allSummaries = changes.map(c => c.summary).join(' ');
  const themeKeywords = ['AI', 'API', 'model', 'enterprise', 'open source', 'pricing'];
  
  themeKeywords.forEach(theme => {
    const themePattern = new RegExp(`\\b${theme}\\b`, 'gi');
    const matches = allSummaries.match(themePattern);
    if (matches && matches.length >= 3) {
      patterns.emergingThemes.push({
        theme: theme,
        frequency: matches.length,
        percentage: Math.round((matches.length / changes.length) * 100)
      });
    }
  });
  
  return patterns;
}

/**
 * Generate trend analysis report
 */
function generateTrendAnalysis(changes, timeframe = 7) {
  const patterns = detectPatterns(changes);
  const intelligence = {
    summary: '',
    keyTrends: [],
    predictions: [],
    recommendations: []
  };
  
  // Generate summary
  const topCategories = Object.entries(patterns.byCategory)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 3)
    .map(([cat,]) => cat);
  
  intelligence.summary = `Over the past ${timeframe} days, the AI industry shows ` +
    `increased activity in ${topCategories.join(', ')}. `;
  
  // Key trends
  patterns.industryTrends.forEach(trend => {
    intelligence.keyTrends.push(trend.trend);
  });
  
  // Predictions based on patterns
  if (patterns.byCategory.pricing_change?.count >= 3) {
    intelligence.predictions.push('Pricing pressure likely to continue - prepare competitive pricing strategy');
  }
  
  if (patterns.byCategory.product_launch?.count >= 2) {
    intelligence.predictions.push('Product launch cycle detected - expect more announcements');
  }
  
  // Recommendations
  if (patterns.emergingThemes.some(t => t.theme === 'enterprise' && t.frequency > 5)) {
    intelligence.recommendations.push('Enterprise focus emerging - consider B2B positioning');
  }
  
  return intelligence;
}

// ============ MARKET MOVEMENT ANALYSIS ============

/**
 * Analyze market movements and competitive dynamics
 */
function analyzeMarketMovement(changes) {
  const movement = {
    leaders: [],
    fastMovers: [],
    quietCompanies: [],
    convergence: [],
    divergence: []
  };
  
  // Count activity by company
  const companyActivity = {};
  changes.forEach(change => {
    if (!companyActivity[change.company]) {
      companyActivity[change.company] = {
        changes: 0,
        significance: 0,
        categories: new Set()
      };
    }
    companyActivity[change.company].changes++;
    companyActivity[change.company].significance += change.relevanceScore || 5;
    companyActivity[change.company].categories.add(change.category);
  });
  
  // Identify market leaders (high significance)
  Object.entries(companyActivity).forEach(([company, activity]) => {
    const avgSignificance = activity.significance / activity.changes;
    if (avgSignificance >= 7) {
      movement.leaders.push({
        company: company,
        avgSignificance: avgSignificance,
        changes: activity.changes
      });
    }
  });
  
  // Identify fast movers (high change count)
  Object.entries(companyActivity)
    .sort(([,a], [,b]) => b.changes - a.changes)
    .slice(0, 3)
    .forEach(([company, activity]) => {
      movement.fastMovers.push({
        company: company,
        changeCount: activity.changes,
        categories: Array.from(activity.categories)
      });
    });
  
  // Identify convergence (similar moves)
  const categoryCompanies = {};
  Object.entries(companyActivity).forEach(([company, activity]) => {
    activity.categories.forEach(category => {
      if (!categoryCompanies[category]) {
        categoryCompanies[category] = [];
      }
      categoryCompanies[category].push(company);
    });
  });
  
  Object.entries(categoryCompanies).forEach(([category, companies]) => {
    if (companies.length >= 3) {
      movement.convergence.push({
        trend: category,
        companies: companies,
        interpretation: `${companies.length} companies converging on ${category}`
      });
    }
  });
  
  return movement;
}

// ============ STRATEGIC RECOMMENDATIONS ============

/**
 * Generate strategic recommendations based on intelligence
 */
function generateStrategicRecommendations(changes, marketMovement, patterns) {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: [],
    competitive: []
  };
  
  // Immediate actions based on competitor moves
  marketMovement.leaders.forEach(leader => {
    recommendations.immediate.push({
      action: `Analyze ${leader.company}'s recent moves`,
      reason: `High significance activity (${leader.avgSignificance}/10)`,
      priority: 'high'
    });
  });
  
  // Short-term based on convergence
  marketMovement.convergence.forEach(convergence => {
    if (convergence.trend === 'pricing_change') {
      recommendations.shortTerm.push({
        action: 'Review and adjust pricing strategy',
        reason: convergence.interpretation,
        priority: 'high'
      });
    }
    if (convergence.trend === 'product_launch') {
      recommendations.shortTerm.push({
        action: 'Accelerate product roadmap',
        reason: 'Multiple competitors launching new products',
        priority: 'medium'
      });
    }
  });
  
  // Long-term based on patterns
  patterns.emergingThemes.forEach(theme => {
    if (theme.percentage > 30) {
      recommendations.longTerm.push({
        action: `Develop strategy for ${theme.theme}`,
        reason: `${theme.percentage}% of changes mention ${theme.theme}`,
        priority: 'medium'
      });
    }
  });
  
  // Competitive recommendations
  const competitorMentions = changes
    .flatMap(c => c.competitiveIntel?.competitorMentions || [])
    .reduce((acc, mention) => {
      acc[mention.competitor] = (acc[mention.competitor] || 0) + 1;
      return acc;
    }, {});
  
  Object.entries(competitorMentions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .forEach(([competitor, count]) => {
      recommendations.competitive.push({
        action: `Monitor ${competitor} closely`,
        reason: `Mentioned ${count} times across competitors`,
        priority: count > 5 ? 'high' : 'medium'
      });
    });
  
  return recommendations;
}

// ============ INTEGRATION WITH MONITORING ============

/**
 * Enhanced change analysis with categorization and competitive intel
 */
function analyzeChangeWithIntelligence(change) {
  // Categorize the change
  change.category = categorizeChangeIntelligent(change, change.llmAnalysis);
  
  // Extract competitive intelligence
  change.competitiveIntel = extractCompetitiveIntelligence(
    change.newContent || '',
    change.company,
    change.llmAnalysis
  );
  
  // Enhance relevance based on category
  const categoryConfig = CATEGORY_CONFIG.categories[change.category];
  if (categoryConfig && categoryConfig.priority >= 8) {
    change.relevanceScore = Math.min(10, change.relevanceScore + 1);
  }
  
  // Update alert decision
  if (change.category === 'product_launch' || change.category === 'pricing_change') {
    change.shouldAlert = true;
  }
  
  return change;
}

/**
 * Generate comprehensive intelligence report
 */
function generateComprehensiveIntelligenceReport(changes) {
  // Enhance all changes with intelligence
  const enhancedChanges = changes.map(analyzeChangeWithIntelligence);
  
  // Detect patterns
  const patterns = detectPatterns(enhancedChanges);
  
  // Analyze market movement
  const marketMovement = analyzeMarketMovement(enhancedChanges);
  
  // Generate recommendations
  const recommendations = generateStrategicRecommendations(
    enhancedChanges,
    marketMovement,
    patterns
  );
  
  // Generate trend analysis
  const trends = generateTrendAnalysis(enhancedChanges);
  
  return {
    summary: {
      totalChanges: enhancedChanges.length,
      significantChanges: enhancedChanges.filter(c => c.relevanceScore >= 6).length,
      categories: patterns.byCategory,
      topCompetitors: marketMovement.leaders
    },
    intelligence: {
      patterns: patterns,
      marketMovement: marketMovement,
      trends: trends,
      recommendations: recommendations
    },
    competitiveInsights: {
      mostMentioned: aggregateCompetitorMentions(enhancedChanges),
      positioning: aggregatePositioning(enhancedChanges),
      threats: aggregateThreats(enhancedChanges)
    },
    changes: enhancedChanges
  };
}

// ============ AGGREGATION HELPERS ============

function aggregateCompetitorMentions(changes) {
  const mentions = {};
  changes.forEach(change => {
    if (change.competitiveIntel?.competitorMentions) {
      change.competitiveIntel.competitorMentions.forEach(mention => {
        if (!mentions[mention.competitor]) {
          mentions[mention.competitor] = {
            count: 0,
            companies: new Set(),
            contexts: []
          };
        }
        mentions[mention.competitor].count += mention.mentions;
        mentions[mention.competitor].companies.add(change.company);
        mentions[mention.competitor].contexts.push(mention.context);
      });
    }
  });
  return mentions;
}

function aggregatePositioning(changes) {
  const positioning = [];
  changes.forEach(change => {
    if (change.competitiveIntel?.positioning) {
      positioning.push(...change.competitiveIntel.positioning.map(p => ({
        company: change.company,
        statement: p
      })));
    }
  });
  return positioning;
}

function aggregateThreats(changes) {
  const threats = [];
  changes.forEach(change => {
    if (change.competitiveIntel?.threats) {
      threats.push(...change.competitiveIntel.threats.map(t => ({
        company: change.company,
        threat: t
      })));
    }
  });
  return threats;
}

// ============ TEST FUNCTIONS ============

/**
 * Test categorization on sample content
 */
function testCategorization() {
  const testCases = [
    {
      content: "We're excited to announce the launch of our new AI model with 175B parameters",
      expectedCategory: 'product_launch'
    },
    {
      content: "Pricing update: Professional plan now $99/month, Enterprise custom pricing",
      expectedCategory: 'pricing_change'
    },
    {
      content: "New API features: streaming support, function calling, and 2x faster inference",
      expectedCategory: 'feature_update'
    }
  ];
  
  const results = testCases.map(test => {
    const change = {
      newContent: test.content,
      magnitude: { percentageChange: 25 }
    };
    const category = categorizeChangeIntelligent(change, null);
    return {
      content: test.content,
      expected: test.expectedCategory,
      actual: category,
      correct: category === test.expectedCategory
    };
  });
  
  return {
    success: true,
    results: results,
    accuracy: results.filter(r => r.correct).length / results.length
  };
}

/**
 * Test competitive intelligence extraction
 */
function testCompetitiveIntel() {
  const testContent = `
    Unlike OpenAI's closed approach, we believe in open source AI.
    Our model outperforms GPT-4 on reasoning tasks while being 10x more efficient.
    We're proud to partner with Microsoft Azure for global deployment.
    This positions us as the market leader in enterprise AI solutions.
  `;
  
  const intel = extractCompetitiveIntelligence(testContent, 'Test Company', null);
  
  return {
    success: true,
    intelligence: intel,
    summary: {
      competitors: intel.competitorMentions.length,
      claims: intel.marketClaims.length,
      positioning: intel.positioning.length
    }
  };
}