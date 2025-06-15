/**
 * Social Marketing Companies Monitor Configuration
 * Focused on social media management, scheduling, and analytics platforms
 */

const SOCIAL_MARKETING_COMPANIES = [
  {
    company: "Sprout Social",
    category: "Social Media Management",
    description: "Comprehensive all-in-one platform with advanced analytics",
    urls: [
      "https://sproutsocial.com",
      "https://sproutsocial.com/features",
      "https://sproutsocial.com/insights", // Their blog
      "https://sproutsocial.com/pricing"
    ]
  },
  {
    company: "Brandwatch",
    category: "Social Listening & Analytics",
    description: "Social listening, analytics, and management for monitoring trends",
    urls: [
      "https://www.brandwatch.com",
      "https://www.brandwatch.com/products",
      "https://www.brandwatch.com/blog",
      "https://www.brandwatch.com/pricing"
    ]
  },
  {
    company: "SocialPilot",
    category: "Social Media Scheduling",
    description: "Scheduling and analytics for agencies and small businesses",
    urls: [
      "https://www.socialpilot.co",
      "https://www.socialpilot.co/features",
      "https://www.socialpilot.co/blog",
      "https://www.socialpilot.co/pricing"
    ]
  },
  {
    company: "Planable",
    category: "Content Collaboration",
    description: "Content collaboration and approval workflows for teams",
    urls: [
      "https://planable.io",
      "https://planable.io/features",
      "https://planable.io/blog",
      "https://planable.io/pricing"
    ]
  },
  {
    company: "Crowdfire",
    category: "Content Discovery & Scheduling",
    description: "Content discovery and automatic posting for creators",
    urls: [
      "https://www.crowdfireapp.com",
      "https://www.crowdfireapp.com/features",
      "https://blog.crowdfireapp.com",
      "https://www.crowdfireapp.com/pricing"
    ]
  },
  {
    company: "PostPlanner",
    category: "Content Curation",
    description: "Content curation and performance analytics",
    urls: [
      "https://www.postplanner.com",
      "https://www.postplanner.com/features",
      "https://www.postplanner.com/blog",
      "https://www.postplanner.com/pricing"
    ]
  },
  {
    company: "SocialBee",
    category: "Content Management",
    description: "Content categorization and evergreen content recycling",
    urls: [
      "https://socialbee.com",
      "https://socialbee.com/features",
      "https://socialbee.com/blog",
      "https://socialbee.com/pricing"
    ]
  },
  {
    company: "Loomly",
    category: "Campaign Planning",
    description: "Visual content calendar and collaboration tools",
    urls: [
      "https://www.loomly.com",
      "https://www.loomly.com/features",
      "https://www.loomly.com/blog",
      "https://www.loomly.com/pricing"
    ]
  },
  {
    company: "Zoho Social",
    category: "Integrated Marketing Suite",
    description: "Social media management integrated with Zoho CRM",
    urls: [
      "https://www.zoho.com/social",
      "https://www.zoho.com/social/features.html",
      "https://www.zoho.com/social/resources",
      "https://www.zoho.com/social/pricing.html"
    ]
  },
  {
    company: "Later",
    category: "Visual Content Scheduling",
    description: "Visual scheduling for Instagram and TikTok",
    urls: [
      "https://later.com",
      "https://later.com/features",
      "https://later.com/blog",
      "https://later.com/pricing"
    ]
  }
];

/**
 * Combined configuration with both AI and Marketing companies
 */
const ENHANCED_MONITOR_CONFIG = [
  // AI Companies (working list)
  {
    company: "Mistral AI",
    category: "AI/LLM",
    urls: [
      "https://mistral.ai",
      "https://mistral.ai/news/",
      "https://mistral.ai/technology/"
    ]
  },
  {
    company: "Codeium",
    category: "AI/Dev Tools",
    urls: [
      "https://codeium.com",
      "https://codeium.com/blog",
      "https://codeium.com/windsurf"
    ]
  },
  {
    company: "Synthesia",
    category: "AI/Video",
    urls: [
      "https://synthesia.io",
      "https://synthesia.io/blog",
      "https://synthesia.io/features"
    ]
  },
  {
    company: "Articul8",
    category: "AI/Enterprise",
    urls: [
      "https://articul8.ai",
      "https://articul8.ai/platform",
      "https://articul8.ai/solutions"
    ]
  },
  {
    company: "Anysphere",
    category: "AI/Dev Tools",
    urls: [
      "https://anysphere.inc",
      "https://cursor.com",
      "https://cursor.com/features"
    ]
  },
  {
    company: "Moonvalley",
    category: "AI/Video",
    urls: [
      "https://moonvalley.com",
      "https://moonvalley.com/create",
      "https://moonvalley.com/gallery"
    ]
  },
  // Add all social marketing companies
  ...SOCIAL_MARKETING_COMPANIES
];

/**
 * Test social marketing URLs to ensure they're accessible
 */
function testSocialMarketingUrls() {
  const results = [];
  
  console.log('Testing Social Marketing Company URLs...');
  
  SOCIAL_MARKETING_COMPANIES.forEach(company => {
    console.log(`\nTesting ${company.company} (${company.category})...`);
    
    company.urls.forEach(url => {
      try {
        const response = UrlFetchApp.fetch(url, {
          muteHttpExceptions: true,
          followRedirects: true,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; CompetitorMonitor/1.0)'
          }
        });
        
        const statusCode = response.getResponseCode();
        const success = statusCode === 200;
        
        results.push({
          company: company.company,
          category: company.category,
          url: url,
          status: statusCode,
          success: success
        });
        
        console.log(`  ${url}: ${success ? '✅' : '❌'} (${statusCode})`);
        
        // Be respectful
        Utilities.sleep(1000);
        
      } catch (error) {
        results.push({
          company: company.company,
          url: url,
          status: 'error',
          success: false,
          error: error.toString()
        });
        console.log(`  ${url}: ❌ (${error.toString()})`);
      }
    });
  });
  
  // Summary
  const summary = {
    totalUrls: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    byCompany: {}
  };
  
  // Group by company
  SOCIAL_MARKETING_COMPANIES.forEach(company => {
    const companyResults = results.filter(r => r.company === company.company);
    summary.byCompany[company.company] = {
      total: companyResults.length,
      successful: companyResults.filter(r => r.success).length,
      category: company.category,
      allWorking: companyResults.every(r => r.success)
    };
  });
  
  return {
    timestamp: new Date().toISOString(),
    summary: summary,
    details: results
  };
}

/**
 * Apply enhanced configuration with AI and Social Marketing companies
 */
function applyEnhancedMonitorConfig() {
  const props = PropertiesService.getScriptProperties();
  
  // Update monitor config
  props.setProperty('monitorConfig', JSON.stringify(ENHANCED_MONITOR_CONFIG));
  
  // Store category breakdown
  const categoryBreakdown = {
    'AI': 6,
    'Social Marketing': SOCIAL_MARKETING_COMPANIES.length,
    'Total': ENHANCED_MONITOR_CONFIG.length
  };
  
  props.setProperty('categoryBreakdown', JSON.stringify(categoryBreakdown));
  
  // Log the update
  logActivity('config_enhanced_social_marketing', {
    action: 'added_social_marketing_companies',
    totalCompanies: ENHANCED_MONITOR_CONFIG.length,
    aiCompanies: 6,
    marketingCompanies: SOCIAL_MARKETING_COMPANIES.length,
    totalUrls: ENHANCED_MONITOR_CONFIG.reduce((sum, m) => sum + m.urls.length, 0),
    categories: [...new Set(ENHANCED_MONITOR_CONFIG.map(c => c.category))],
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    message: 'Configuration updated with AI and Social Marketing companies',
    breakdown: {
      total: ENHANCED_MONITOR_CONFIG.length + ' companies',
      ai: '6 AI companies', 
      marketing: SOCIAL_MARKETING_COMPANIES.length + ' social marketing companies',
      totalUrls: ENHANCED_MONITOR_CONFIG.reduce((sum, m) => sum + m.urls.length, 0) + ' URLs',
      categories: {
        'AI/LLM': 1,
        'AI/Dev Tools': 2,
        'AI/Video': 2,
        'AI/Enterprise': 1,
        'Social Media Management': 1,
        'Social Listening & Analytics': 1,
        'Social Media Scheduling': 1,
        'Content Collaboration': 1,
        'Content Discovery & Scheduling': 1,
        'Content Curation': 1,
        'Content Management': 1,
        'Campaign Planning': 1,
        'Integrated Marketing Suite': 1,
        'Visual Content Scheduling': 1
      }
    }
  };
}

/**
 * Generate competitive analysis report
 */
function generateCompetitiveReport() {
  const config = JSON.parse(
    PropertiesService.getScriptProperties().getProperty('monitorConfig') || '[]'
  );
  
  const report = {
    title: 'Competitive Intelligence Monitor - Portfolio Overview',
    generated: new Date().toISOString(),
    summary: {
      totalCompanies: config.length,
      categories: {
        'AI Technology': config.filter(c => c.category.startsWith('AI/')).length,
        'Social Marketing': config.filter(c => !c.category.startsWith('AI/')).length
      },
      totalUrls: config.reduce((sum, c) => sum + c.urls.length, 0)
    },
    companies: config.map(c => ({
      name: c.company,
      category: c.category,
      urlCount: c.urls.length,
      primaryUrl: c.urls[0]
    })),
    monitoringCapabilities: [
      'Daily automated checks',
      'Content change detection',
      'AI-powered significance analysis',
      'Competitive intelligence insights',
      'Trend identification',
      'Pricing and feature tracking'
    ]
  };
  
  return report;
}

/**
 * Claude analysis for marketing companies (competitive focus)
 */
function analyzeMarketingCompany(company, category, content, urls) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) return null;
  
  const prompt = `Analyze this social marketing platform for competitive intelligence:

Company: ${company}
Category: ${category}
Description: ${SOCIAL_MARKETING_COMPANIES.find(c => c.company === company)?.description || category}
URLs analyzed: ${urls.filter(u => u.success).map(u => u.url).join(', ')}

Content from their website:
${content}

Provide competitive analysis in JSON format:
{
  "summary": "2-3 sentence executive summary of their current position",
  "coreFeatures": ["top 5 key features they emphasize"],
  "targetMarket": {
    "primary": "main customer segment",
    "size": "business size they target (SMB/Mid/Enterprise)"
  },
  "pricing": {
    "model": "subscription/usage-based/etc",
    "entryPoint": "lowest tier price if found",
    "positioning": "budget/mid/premium"
  },
  "integrations": ["top 5-10 key integrations mentioned"],
  "differentiators": ["3-5 unique selling points vs competitors"],
  "recentUpdates": ["any new features/updates mentioned"],
  "marketingMessages": ["key marketing claims or value props"],
  "competitivePosition": "how they position against others",
  "strengthScore": 1-10,
  "weaknesses": ["potential gaps or limitations"],
  "opportunities": ["market opportunities they could exploit"]
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
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      return JSON.parse(result.content[0].text);
    }
  } catch (error) {
    console.error('Claude analysis error:', error);
    return null;
  }
}