/**
 * Simplified Monitor Configuration - Only What Actually Works
 * Updated: June 8, 2025
 */

const SIMPLIFIED_MONITOR_CONFIG = [
  // Companies with working direct access
  {
    company: "Mistral AI",
    urls: [
      "https://mistral.ai",
      "https://mistral.ai/news/",
      "https://mistral.ai/technology/"
    ]
  },
  {
    company: "Codeium",
    urls: [
      "https://codeium.com",
      "https://codeium.com/blog",
      "https://codeium.com/windsurf"
    ]
  },
  {
    company: "Synthesia",
    urls: [
      "https://synthesia.io",
      "https://synthesia.io/blog",
      "https://synthesia.io/features"
    ]
  },
  {
    company: "Articul8",
    urls: [
      "https://articul8.ai",
      "https://articul8.ai/platform",
      "https://articul8.ai/solutions"
    ]
  },
  {
    company: "Anysphere",
    urls: [
      "https://anysphere.inc",
      "https://cursor.com",
      "https://cursor.com/features"
    ]
  },
  {
    company: "Moonvalley",
    urls: [
      "https://moonvalley.com",  // Fixed domain
      "https://moonvalley.com/create",
      "https://moonvalley.com/gallery"
    ]
  }
];

// Companies we can't monitor due to technical limitations
const EXCLUDED_COMPANIES = [
  {
    company: "Pika",
    reason: "Requires user authentication",
    urls: ["https://pika.art"]
  },
  {
    company: "Ideogram",
    reason: "Protected by Cloudflare bot detection",
    urls: ["https://ideogram.ai"]
  },
  {
    company: "Prompt Security",
    reason: "Website unreachable/down",
    urls: ["https://promptsecurity.io"]
  }
];

/**
 * Apply simplified configuration
 */
function applySimplifiedConfig() {
  const props = PropertiesService.getScriptProperties();
  
  // Update monitor config
  props.setProperty('monitorConfig', JSON.stringify(SIMPLIFIED_MONITOR_CONFIG));
  
  // Store excluded list for documentation
  props.setProperty('excludedCompanies', JSON.stringify(EXCLUDED_COMPANIES));
  
  // Log the update
  logActivity('config_simplified', {
    action: 'updated_to_working_companies_only',
    workingCompanies: SIMPLIFIED_MONITOR_CONFIG.length,
    excludedCompanies: EXCLUDED_COMPANIES.length,
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    message: 'Configuration simplified to working companies only',
    monitoring: SIMPLIFIED_MONITOR_CONFIG.length + ' companies',
    excluded: EXCLUDED_COMPANIES.length + ' companies',
    totalUrls: SIMPLIFIED_MONITOR_CONFIG.reduce((sum, m) => sum + m.urls.length, 0)
  };
}

/**
 * Get POC status including limitations
 */
function getPOCStatus() {
  const config = JSON.parse(
    PropertiesService.getScriptProperties().getProperty('monitorConfig') || '[]'
  );
  const excluded = JSON.parse(
    PropertiesService.getScriptProperties().getProperty('excludedCompanies') || '[]'
  );
  
  return {
    title: 'AI Competitor Monitor - Proof of Concept',
    status: 'Operational',
    capabilities: {
      monitoring: config.length + ' AI companies',
      changeDetection: 'Content hash comparison',
      intelligence: 'Claude AI analysis',
      scheduling: 'Automated daily checks',
      reporting: 'Google Sheets integration'
    },
    currentlyMonitoring: config.map(c => ({
      company: c.company,
      urlCount: c.urls.length
    })),
    limitations: {
      excluded: excluded.map(e => ({
        company: e.company,
        reason: e.reason
      })),
      technical: [
        'Cannot bypass authentication walls',
        'Cannot handle advanced bot protection',
        'No social media API integration',
        'Limited to publicly accessible pages'
      ]
    },
    potentialSolutions: {
      authentication: 'Could implement login automation',
      botProtection: 'Could use proxy services (ScrapingBee, etc)',
      socialMedia: 'Could integrate Twitter/LinkedIn APIs',
      cost: 'Solutions would add ~$50-150/month in API costs'
    }
  };
}

/**
 * Generate POC documentation
 */
function generatePOCDocumentation() {
  const status = getPOCStatus();
  
  const documentation = `# AI Competitor Monitor - Proof of Concept

## Overview
This POC demonstrates an automated competitive intelligence system that monitors AI companies for changes and uses Claude AI to analyze the significance of those changes.

## Current Capabilities
- ✅ Monitors ${status.currentlyMonitoring.length} AI companies
- ✅ Tracks ${status.currentlyMonitoring.reduce((sum, c) => sum + c.urlCount, 0)} URLs total
- ✅ Detects content changes automatically
- ✅ Uses Claude AI for intelligent analysis
- ✅ Logs all data to Google Sheets
- ✅ Fully automated via Google Apps Script

## Companies Monitored
${status.currentlyMonitoring.map(c => `- ${c.company} (${c.urlCount} URLs)`).join('\n')}

## Known Limitations
${status.limitations.excluded.map(e => `- ${e.company}: ${e.reason}`).join('\n')}

## Technical Constraints
${status.limitations.technical.map(t => `- ${t}`).join('\n')}

## Potential Enhancements
To monitor all companies, we would need:
${Object.entries(status.potentialSolutions).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## Value Proposition
Despite monitoring only ${status.currentlyMonitoring.length} of 9 target companies, this POC demonstrates:
1. Automated competitive intelligence gathering
2. AI-powered change analysis
3. Scalable architecture
4. Cost-effective implementation ($0 for accessible sites)

The excluded companies require additional investment in proxy services or API access, which can be added based on ROI requirements.
`;

  // Save to file
  const blob = Utilities.newBlob(documentation, 'text/markdown', 'AI_Monitor_POC_Documentation.md');
  DriveApp.createFile(blob);
  
  return {
    success: true,
    documentation: documentation,
    summary: `POC monitors ${status.currentlyMonitoring.length} companies successfully`
  };
}