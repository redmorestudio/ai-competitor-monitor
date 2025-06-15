/**
 * Configuration UI Enhancement
 * Provides web interface for editing thresholds and settings
 */

/**
 * Get configuration for web UI
 */
function doGetConfig() {
  try {
    const config = getMonitorConfig();
    const monitors = getMonitorConfigurations();
    
    return createJsonResponse({
      success: true,
      config: config,
      monitors: monitors,
      stats: {
        totalCompanies: monitors.length,
        totalUrls: monitors.reduce((sum, m) => sum + m.urls.length, 0),
        lastCheck: PropertiesService.getScriptProperties().getProperty('lastMonitorRun') || 'Never'
      }
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Update configuration from web UI
 */
function doUpdateConfig(data) {
  try {
    const { section, updates } = data;
    
    switch (section) {
      case 'thresholds':
        return updateThresholds(updates);
        
      case 'keywords':
        return updateKeywords(updates);
        
      case 'selectors':
        return updateSelectors(updates);
        
      case 'monitors':
        return updateMonitors(updates);
        
      default:
        return createJsonResponse({
          success: false,
          error: `Unknown config section: ${section}`
        }, 400);
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Update threshold configuration
 */
function updateThresholds(updates) {
  const config = getMonitorConfig();
  
  if (updates.global !== undefined) {
    config.thresholds.global = updates.global;
  }
  
  if (updates.company) {
    Object.assign(config.thresholds.company, updates.company);
  }
  
  if (updates.page) {
    Object.assign(config.thresholds.page, updates.page);
  }
  
  if (updates.ai) {
    Object.assign(config.aiThresholds, updates.ai);
  }
  
  // Save updated config
  updateMonitorConfig(config);
  
  return createJsonResponse({
    success: true,
    message: 'Thresholds updated successfully',
    config: config.thresholds
  });
}

/**
 * Update keyword configuration
 */
function updateKeywords(updates) {
  const props = PropertiesService.getScriptProperties();
  const keywordConfig = JSON.parse(props.getProperty('keywordConfig') || '{}');
  
  if (updates.global) {
    keywordConfig.global = updates.global;
  }
  
  if (updates.company) {
    Object.assign(keywordConfig.company || {}, updates.company);
  }
  
  props.setProperty('keywordConfig', JSON.stringify(keywordConfig));
  
  return createJsonResponse({
    success: true,
    message: 'Keywords updated successfully',
    keywords: keywordConfig
  });
}

/**
 * Update CSS selector configuration
 */
function updateSelectors(updates) {
  const config = getMonitorConfig();
  
  if (updates.default) {
    config.contentSelectors.default = updates.default;
  }
  
  if (updates.exclude) {
    config.contentSelectors.exclude = updates.exclude;
  }
  
  if (updates.specific) {
    Object.assign(config.contentSelectors.specific, updates.specific);
  }
  
  updateMonitorConfig(config);
  
  return createJsonResponse({
    success: true,
    message: 'Selectors updated successfully',
    selectors: config.contentSelectors
  });
}

/**
 * Update monitor configurations (companies and URLs)
 */
function updateMonitors(updates) {
  const props = PropertiesService.getScriptProperties();
  let monitors = JSON.parse(props.getProperty('monitorConfig') || '[]');
  
  if (updates.add) {
    // Add new monitor
    monitors.push(updates.add);
  }
  
  if (updates.remove) {
    // Remove monitor by company name
    monitors = monitors.filter(m => m.company !== updates.remove);
  }
  
  if (updates.update) {
    // Update existing monitor
    const index = monitors.findIndex(m => m.company === updates.update.company);
    if (index >= 0) {
      monitors[index] = updates.update;
    }
  }
  
  props.setProperty('monitorConfig', JSON.stringify(monitors));
  
  return createJsonResponse({
    success: true,
    message: 'Monitors updated successfully',
    monitors: monitors
  });
}

/**
 * Get extracted data for display in web UI
 */
function getExtractedData() {
  try {
    const ss = getOrCreateMonitorSheet().spreadsheet;
    const sheet = ss.getSheetByName('PageContent');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      return {
        success: true,
        data: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Get last 50 entries
    const entries = [];
    const startRow = Math.max(1, data.length - 50);
    
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      entries.push({
        url: row[headers.indexOf('URL')],
        timestamp: row[headers.indexOf('Timestamp')],
        title: row[headers.indexOf('Title')],
        description: row[headers.indexOf('Description')],
        wordCount: row[headers.indexOf('Word Count')],
        preview: row[headers.indexOf('Content Preview')]
      });
    }
    
    return {
      success: true,
      data: entries.reverse() // Most recent first
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      data: []
    };
  }
}

/**
 * Get change history with diffs
 */
function getChangeHistory(url) {
  try {
    const ss = getOrCreateMonitorSheet().spreadsheet;
    const changesSheet = ss.getSheetByName('Changes');
    
    if (!changesSheet || changesSheet.getLastRow() <= 1) {
      return {
        success: true,
        changes: []
      };
    }
    
    const data = changesSheet.getDataRange().getValues();
    const headers = data[0];
    const urlIndex = headers.indexOf('URL');
    
    // Filter changes for this URL
    const changes = [];
    for (let i = 1; i < data.length; i++) {
      if (!url || data[i][urlIndex] === url) {
        changes.push({
          timestamp: data[i][headers.indexOf('Timestamp')],
          company: data[i][headers.indexOf('Company')],
          url: data[i][urlIndex],
          changeType: data[i][headers.indexOf('Change Type')],
          summary: data[i][headers.indexOf('Summary')],
          relevanceScore: data[i][headers.indexOf('Relevance Score')],
          keywords: data[i][headers.indexOf('Keywords')]
        });
      }
    }
    
    return {
      success: true,
      changes: changes.reverse() // Most recent first
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      changes: []
    };
  }
}

/**
 * Get diff between two versions
 */
function getDiff(url, timestamp1, timestamp2) {
  try {
    const content1 = getContentAtTimestamp(url, timestamp1);
    const content2 = getContentAtTimestamp(url, timestamp2);
    
    if (!content1 || !content2) {
      return {
        success: false,
        error: 'Content not found for one or both timestamps'
      };
    }
    
    // Generate diff
    const diff = createDiff(content1.text, content2.text);
    
    return {
      success: true,
      diff: diff,
      metadata: {
        timestamp1: timestamp1,
        timestamp2: timestamp2,
        changeMagnitude: calculateChangeMagnitude(
          { extracted: { fullText: content1.text } },
          { extracted: { fullText: content2.text } }
        )
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Create a simple diff between two texts
 */
function createDiff(text1, text2) {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const diff = [];
  
  let i = 0, j = 0;
  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      // Rest of lines2 are additions
      diff.push({
        type: 'add',
        line: lines2[j],
        lineNumber: j + 1
      });
      j++;
    } else if (j >= lines2.length) {
      // Rest of lines1 are deletions
      diff.push({
        type: 'delete',
        line: lines1[i],
        lineNumber: i + 1
      });
      i++;
    } else if (lines1[i] === lines2[j]) {
      // Lines match
      diff.push({
        type: 'equal',
        line: lines1[i],
        lineNumber: i + 1
      });
      i++;
      j++;
    } else {
      // Lines differ - simple approach
      diff.push({
        type: 'delete',
        line: lines1[i],
        lineNumber: i + 1
      });
      diff.push({
        type: 'add',
        line: lines2[j],
        lineNumber: j + 1
      });
      i++;
      j++;
    }
  }
  
  return diff;
}

/**
 * Get content at a specific timestamp
 */
function getContentAtTimestamp(url, timestamp) {
  const ss = getOrCreateMonitorSheet().spreadsheet;
  const contentSheet = ss.getSheetByName('PageContent');
  
  if (!contentSheet) return null;
  
  const data = contentSheet.getDataRange().getValues();
  const headers = data[0];
  const urlIndex = headers.indexOf('URL');
  const timestampIndex = headers.indexOf('Timestamp');
  const contentIndex = headers.indexOf('Content Preview');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][urlIndex] === url && data[i][timestampIndex] === timestamp) {
      return {
        text: data[i][contentIndex],
        timestamp: timestamp
      };
    }
  }
  
  return null;
}