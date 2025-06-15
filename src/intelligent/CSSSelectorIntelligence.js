/**
 * CSS Selector Intelligence Module
 * Smart content extraction using configurable CSS selectors
 */

// ============ SELECTOR CONFIGURATION ============
const SELECTOR_CONFIG = {
  // Default selectors for common content areas
  defaultSelectors: {
    main: [
      'main',
      '[role="main"]',
      '#main',
      '#content',
      '.main-content',
      '.content',
      'article',
      '.article-content'
    ],
    
    pricing: [
      '.pricing',
      '#pricing',
      '.pricing-table',
      '.price-card',
      '.pricing-tier',
      '[data-pricing]',
      '.plans',
      '.subscription'
    ],
    
    features: [
      '.features',
      '#features',
      '.feature-list',
      '.capabilities',
      '.benefits',
      '[data-features]'
    ],
    
    product: [
      '.product',
      '.product-info',
      '.product-details',
      '.product-description',
      '[itemtype*="Product"]'
    ],
    
    blog: [
      '.blog-post',
      '.post-content',
      'article.post',
      '.entry-content',
      '.blog-content'
    ],
    
    announcement: [
      '.announcement',
      '.news-item',
      '.press-release',
      '.update',
      '.changelog'
    ]
  },
  
  // Selectors to exclude (noise)
  excludeSelectors: [
    'nav',
    'header',
    'footer',
    '.navigation',
    '.menu',
    '.sidebar',
    '.cookie',
    '.banner',
    '.popup',
    '.modal',
    '.advertisement',
    '.social-share',
    '.comments',
    '#comments'
  ],
  
  // Company-specific selectors
  companySelectors: {
    'Mistral AI': {
      main: '.content-wrapper',
      features: '.model-capabilities',
      exclude: ['.chat-widget']
    },
    'Codeium': {
      main: '.main-section',
      product: '.product-showcase',
      exclude: ['.demo-widget']
    },
    'Synthesia': {
      main: '#main-content',
      pricing: '.pricing-section',
      exclude: ['.video-player-demo']
    }
  }
};

// ============ INTELLIGENT EXTRACTION FUNCTIONS ============

/**
 * Extract content using intelligent CSS selectors
 */
function extractContentWithSelectors(html, url, company) {
  try {
    // Determine page type
    const pageType = identifyPageType(url);
    
    // Get appropriate selectors
    const selectors = getSelectorsForPage(company, pageType);
    
    // Create virtual DOM for parsing
    const doc = parseHtml(html);
    
    // Extract main content
    const mainContent = extractBySelectors(doc, selectors.main);
    
    // Extract specific sections if applicable
    const sections = {};
    if (pageType === 'pricing' && selectors.pricing) {
      sections.pricing = extractBySelectors(doc, selectors.pricing);
    }
    if (pageType === 'features' && selectors.features) {
      sections.features = extractBySelectors(doc, selectors.features);
    }
    
    // Remove excluded content
    const cleanContent = removeExcludedContent(mainContent, selectors.exclude);
    
    // Extract metadata
    const metadata = extractMetadata(doc);
    
    // Combine all content
    const fullContent = combineContent(cleanContent, sections, metadata);
    
    return {
      success: true,
      content: fullContent,
      sections: sections,
      metadata: metadata,
      selectorsUsed: selectors,
      pageType: pageType
    };
    
  } catch (error) {
    console.error('Selector extraction failed:', error);
    return {
      success: false,
      error: error.toString(),
      fallback: extractTextFromHtml(html) // Fallback to basic extraction
    };
  }
}

/**
 * Get selectors for a specific company and page type
 */
function getSelectorsForPage(company, pageType) {
  const selectors = {
    main: [],
    exclude: [...SELECTOR_CONFIG.excludeSelectors]
  };
  
  // Add company-specific selectors
  if (SELECTOR_CONFIG.companySelectors[company]) {
    const companyConfig = SELECTOR_CONFIG.companySelectors[company];
    if (companyConfig.main) selectors.main.push(companyConfig.main);
    if (companyConfig.exclude) selectors.exclude.push(...companyConfig.exclude);
    
    // Add page-type specific selectors for company
    if (companyConfig[pageType]) {
      selectors[pageType] = [companyConfig[pageType]];
    }
  }
  
  // Add default selectors
  selectors.main.push(...SELECTOR_CONFIG.defaultSelectors.main);
  
  // Add page-type specific defaults
  if (SELECTOR_CONFIG.defaultSelectors[pageType]) {
    selectors[pageType] = [
      ...(selectors[pageType] || []),
      ...SELECTOR_CONFIG.defaultSelectors[pageType]
    ];
  }
  
  return selectors;
}

/**
 * Parse HTML into a queryable structure
 * Note: Apps Script doesn't have DOM parser, so we use XML Service
 */
function parseHtml(html) {
  // Clean HTML for XML parsing
  html = html.replace(/<!DOCTYPE[^>]*>/i, '');
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Wrap in root element
  html = '<root>' + html + '</root>';
  
  try {
    // For Apps Script, we'll use regex-based extraction
    // In a real implementation, you'd use XmlService
    return {
      html: html,
      querySelector: function(selector) {
        return extractBySelector(html, selector);
      }
    };
  } catch (error) {
    console.error('HTML parsing failed:', error);
    return { html: html };
  }
}

/**
 * Extract content by CSS selectors
 */
function extractBySelectors(doc, selectors) {
  let content = '';
  
  for (const selector of selectors) {
    const extracted = extractBySelector(doc.html, selector);
    if (extracted) {
      content += '\n\n' + extracted;
    }
  }
  
  return content.trim();
}

/**
 * Extract content by a single selector using regex
 */
function extractBySelector(html, selector) {
  try {
    let pattern;
    
    // Handle different selector types
    if (selector.startsWith('#')) {
      // ID selector
      const id = selector.substring(1);
      pattern = new RegExp(`<[^>]+id\\s*=\\s*["']${id}["'][^>]*>([\\s\\S]*?)<\\/\\w+>`, 'gi');
    } else if (selector.startsWith('.')) {
      // Class selector
      const className = selector.substring(1);
      pattern = new RegExp(`<[^>]+class\\s*=\\s*["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\w+>`, 'gi');
    } else if (selector.startsWith('[')) {
      // Attribute selector
      const attr = selector.match(/\[([^=\]]+)(?:=["']([^"']+)["'])?\]/);
      if (attr) {
        if (attr[2]) {
          pattern = new RegExp(`<[^>]+${attr[1]}\\s*=\\s*["']${attr[2]}["'][^>]*>([\\s\\S]*?)<\\/\\w+>`, 'gi');
        } else {
          pattern = new RegExp(`<[^>]+${attr[1]}[^>]*>([\\s\\S]*?)<\\/\\w+>`, 'gi');
        }
      }
    } else {
      // Tag selector
      pattern = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'gi');
    }
    
    if (pattern) {
      const matches = html.match(pattern);
      if (matches) {
        // Extract text from matched HTML
        return matches.map(match => {
          return match.replace(/<[^>]+>/g, ' ')
                     .replace(/&nbsp;/g, ' ')
                     .replace(/&amp;/g, '&')
                     .replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>')
                     .replace(/&quot;/g, '"')
                     .replace(/&#39;/g, "'")
                     .replace(/\s+/g, ' ')
                     .trim();
        }).join('\n');
      }
    }
  } catch (error) {
    console.error(`Selector extraction failed for ${selector}:`, error);
  }
  
  return '';
}

/**
 * Remove excluded content
 */
function removeExcludedContent(content, excludeSelectors) {
  let cleanContent = content;
  
  for (const selector of excludeSelectors) {
    // Remove content matching exclude selectors
    const pattern = createExcludePattern(selector);
    if (pattern) {
      cleanContent = cleanContent.replace(pattern, '');
    }
  }
  
  return cleanContent.trim();
}

/**
 * Create regex pattern for exclude selectors
 */
function createExcludePattern(selector) {
  try {
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      return new RegExp(`<[^>]+class\\s*=\\s*["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?<\\/\\w+>`, 'gi');
    } else if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return new RegExp(`<[^>]+id\\s*=\\s*["']${id}["'][^>]*>[\\s\\S]*?<\\/\\w+>`, 'gi');
    } else {
      return new RegExp(`<${selector}[^>]*>[\\s\\S]*?<\\/${selector}>`, 'gi');
    }
  } catch (error) {
    console.error(`Failed to create exclude pattern for ${selector}:`, error);
    return null;
  }
}

/**
 * Extract metadata from HTML
 */
function extractMetadata(doc) {
  const metadata = {
    title: '',
    description: '',
    keywords: [],
    ogTitle: '',
    ogDescription: '',
    structuredData: []
  };
  
  // Extract title
  const titleMatch = doc.html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) metadata.title = titleMatch[1].trim();
  
  // Extract meta tags
  const metaMatches = doc.html.matchAll(/<meta\s+([^>]+)>/gi);
  for (const match of metaMatches) {
    const attrs = match[1];
    
    // Description
    if (attrs.includes('name="description"') || attrs.includes("name='description'")) {
      const contentMatch = attrs.match(/content=["']([^"']+)["']/);
      if (contentMatch) metadata.description = contentMatch[1];
    }
    
    // Keywords
    if (attrs.includes('name="keywords"') || attrs.includes("name='keywords'")) {
      const contentMatch = attrs.match(/content=["']([^"']+)["']/);
      if (contentMatch) metadata.keywords = contentMatch[1].split(',').map(k => k.trim());
    }
    
    // Open Graph
    if (attrs.includes('property="og:title"')) {
      const contentMatch = attrs.match(/content=["']([^"']+)["']/);
      if (contentMatch) metadata.ogTitle = contentMatch[1];
    }
    if (attrs.includes('property="og:description"')) {
      const contentMatch = attrs.match(/content=["']([^"']+)["']/);
      if (contentMatch) metadata.ogDescription = contentMatch[1];
    }
  }
  
  // Extract structured data
  const jsonLdMatches = doc.html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      metadata.structuredData.push(data);
    } catch (error) {
      // Invalid JSON-LD
    }
  }
  
  return metadata;
}

/**
 * Combine all extracted content
 */
function combineContent(mainContent, sections, metadata) {
  const parts = [];
  
  // Add metadata summary
  if (metadata.title) parts.push(`Title: ${metadata.title}`);
  if (metadata.description) parts.push(`Description: ${metadata.description}`);
  
  // Add main content
  if (mainContent) parts.push(mainContent);
  
  // Add section content
  Object.entries(sections).forEach(([section, content]) => {
    if (content) {
      parts.push(`\n[${section.toUpperCase()} SECTION]\n${content}`);
    }
  });
  
  return parts.join('\n\n');
}

// ============ SELECTOR MANAGEMENT ============

/**
 * Update selectors for a company
 */
function updateCompanySelectors(company, selectors) {
  if (!SELECTOR_CONFIG.companySelectors[company]) {
    SELECTOR_CONFIG.companySelectors[company] = {};
  }
  
  Object.assign(SELECTOR_CONFIG.companySelectors[company], selectors);
  
  // Save to properties
  const props = PropertiesService.getScriptProperties();
  props.setProperty('COMPANY_SELECTORS', JSON.stringify(SELECTOR_CONFIG.companySelectors));
  
  return {
    success: true,
    company: company,
    selectors: SELECTOR_CONFIG.companySelectors[company]
  };
}

/**
 * Test selectors on a URL
 */
function testSelectors(url, company, customSelectors) {
  try {
    // Fetch the page
    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    
    if (response.getResponseCode() !== 200) {
      return {
        success: false,
        error: `HTTP ${response.getResponseCode()}`
      };
    }
    
    const html = response.getContentText();
    
    // Extract with selectors
    const result = extractContentWithSelectors(html, url, company);
    
    // If custom selectors provided, test those too
    if (customSelectors) {
      const customResult = extractBySelectors(
        { html: html },
        Array.isArray(customSelectors) ? customSelectors : [customSelectors]
      );
      
      result.customExtraction = {
        selectors: customSelectors,
        content: customResult,
        length: customResult.length
      };
    }
    
    return {
      success: true,
      url: url,
      company: company,
      pageType: result.pageType,
      contentLength: result.content.length,
      contentPreview: result.content.substring(0, 500),
      sections: Object.keys(result.sections),
      metadata: result.metadata,
      selectorsUsed: result.selectorsUsed,
      customResult: result.customExtraction
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Auto-discover selectors for a page
 */
function discoverSelectors(url) {
  try {
    const response = UrlFetchApp.fetch(url);
    const html = response.getContentText();
    
    const discovered = {
      ids: [],
      classes: [],
      semantic: [],
      candidates: []
    };
    
    // Find IDs that might contain content
    const idMatches = html.matchAll(/id=["']([^"']+)["']/gi);
    for (const match of idMatches) {
      const id = match[1];
      if (id.match(/content|main|article|post|body|wrapper/i)) {
        discovered.ids.push(`#${id}`);
      }
    }
    
    // Find classes that might contain content
    const classMatches = html.matchAll(/class=["']([^"']+)["']/gi);
    for (const match of classMatches) {
      const classes = match[1].split(/\s+/);
      classes.forEach(className => {
        if (className.match(/content|main|article|post|body|wrapper|section/i)) {
          discovered.classes.push(`.${className}`);
        }
      });
    }
    
    // Find semantic HTML5 elements
    const semanticTags = ['main', 'article', 'section', 'aside'];
    semanticTags.forEach(tag => {
      if (html.includes(`<${tag}`)) {
        discovered.semantic.push(tag);
      }
    });
    
    // Score and rank candidates
    const allSelectors = [
      ...discovered.ids,
      ...discovered.classes.slice(0, 10), // Limit classes
      ...discovered.semantic
    ];
    
    // Test each selector
    allSelectors.forEach(selector => {
      const content = extractBySelector(html, selector);
      if (content && content.length > 100) {
        discovered.candidates.push({
          selector: selector,
          contentLength: content.length,
          preview: content.substring(0, 200)
        });
      }
    });
    
    // Sort by content length
    discovered.candidates.sort((a, b) => b.contentLength - a.contentLength);
    
    return {
      success: true,
      url: url,
      discovered: discovered,
      recommended: discovered.candidates.slice(0, 5).map(c => c.selector),
      topCandidate: discovered.candidates[0]
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ============ INTEGRATION WITH MONITORING ============

/**
 * Enhanced page content extraction using selectors
 */
function extractPageContentEnhanced(url, company) {
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
    
    // Use intelligent selector extraction
    const selectorResult = extractContentWithSelectors(html, url, company);
    
    let textContent;
    if (selectorResult.success) {
      textContent = selectorResult.content;
    } else {
      // Fallback to basic extraction
      textContent = extractTextFromHtml(html);
    }
    
    // Basic content analysis
    const intelligence = analyzeContent(textContent);
    
    // Calculate hash
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
      metadata: selectorResult.metadata || {},
      sections: selectorResult.sections || {},
      selectorsUsed: selectorResult.selectorsUsed || {},
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
 * Get selector configuration for UI
 */
function getSelectorConfiguration() {
  return {
    defaultSelectors: SELECTOR_CONFIG.defaultSelectors,
    excludeSelectors: SELECTOR_CONFIG.excludeSelectors,
    companySelectors: SELECTOR_CONFIG.companySelectors
  };
}

/**
 * Save selector configuration from UI
 */
function saveSelectorConfiguration(config) {
  if (config.defaultSelectors) {
    Object.assign(SELECTOR_CONFIG.defaultSelectors, config.defaultSelectors);
  }
  
  if (config.excludeSelectors) {
    SELECTOR_CONFIG.excludeSelectors = config.excludeSelectors;
  }
  
  if (config.companySelectors) {
    Object.assign(SELECTOR_CONFIG.companySelectors, config.companySelectors);
  }
  
  // Save to properties
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SELECTOR_CONFIG', JSON.stringify(SELECTOR_CONFIG));
  
  return {
    success: true,
    message: 'Selector configuration updated',
    config: SELECTOR_CONFIG
  };
}