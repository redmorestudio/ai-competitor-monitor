/**
 * Change Magnitude Detection Module
 * Tracks HOW MUCH content changed, not just IF it changed
 */

// ============ MAGNITUDE CONFIGURATION ============
const MAGNITUDE_CONFIG = {
  // Alert thresholds based on percentage change
  thresholds: {
    minor: 5,      // < 5% change - ignore
    moderate: 15,  // 5-15% change - log but don't alert
    significant: 25, // 15-25% change - consider alerting
    major: 50      // > 50% change - always alert
  },
  
  // Minimum change in characters to consider (avoid tiny changes)
  minCharacterChange: 50,
  
  // Store full content up to this length (500KB)
  maxContentStorage: 500000,
  
  // Use Google Drive for content > 100KB
  driveThreshold: 100000
};

// ============ MAGNITUDE DETECTION FUNCTIONS ============

/**
 * Calculate change magnitude between two content versions
 */
function calculateChangeMagnitude(oldContent, newContent) {
  if (!oldContent || !newContent) {
    return {
      percentageChange: 100,
      characterDiff: newContent ? newContent.length : 0,
      addedChars: newContent ? newContent.length : 0,
      removedChars: oldContent ? oldContent.length : 0,
      magnitude: 'new_content'
    };
  }
  
  const oldLength = oldContent.length;
  const newLength = newContent.length;
  
  // Simple character-based calculation
  const characterDiff = Math.abs(newLength - oldLength);
  const maxLength = Math.max(oldLength, newLength);
  const percentageChange = maxLength > 0 ? (characterDiff / maxLength) * 100 : 0;
  
  // Advanced: Use Levenshtein distance for more accurate comparison
  const similarity = calculateSimilarity(oldContent, newContent);
  const semanticChange = (1 - similarity) * 100;
  
  // Combine both metrics
  const effectiveChange = (percentageChange + semanticChange) / 2;
  
  // Determine magnitude category
  let magnitude = 'minor';
  if (effectiveChange >= MAGNITUDE_CONFIG.thresholds.major) {
    magnitude = 'major';
  } else if (effectiveChange >= MAGNITUDE_CONFIG.thresholds.significant) {
    magnitude = 'significant';
  } else if (effectiveChange >= MAGNITUDE_CONFIG.thresholds.moderate) {
    magnitude = 'moderate';
  }
  
  return {
    percentageChange: Math.round(effectiveChange * 10) / 10,
    characterDiff: characterDiff,
    addedChars: Math.max(0, newLength - oldLength),
    removedChars: Math.max(0, oldLength - newLength),
    oldLength: oldLength,
    newLength: newLength,
    magnitude: magnitude,
    shouldAlert: effectiveChange >= MAGNITUDE_CONFIG.thresholds.significant &&
                 characterDiff >= MAGNITUDE_CONFIG.minCharacterChange
  };
}

/**
 * Calculate similarity between two strings (0-1)
 * Using a simplified approach for performance
 */
function calculateSimilarity(str1, str2) {
  // For very long strings, sample sections
  if (str1.length > 10000 || str2.length > 10000) {
    return calculateSampledSimilarity(str1, str2);
  }
  
  // Convert to words for better semantic comparison
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Calculate Jaccard similarity
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Sample-based similarity for large documents
 */
function calculateSampledSimilarity(str1, str2) {
  const samples = 5;
  const sampleSize = 1000;
  let totalSimilarity = 0;
  
  for (let i = 0; i < samples; i++) {
    const pos1 = Math.floor(Math.random() * Math.max(0, str1.length - sampleSize));
    const pos2 = Math.floor(Math.random() * Math.max(0, str2.length - sampleSize));
    
    const sample1 = str1.substring(pos1, pos1 + sampleSize);
    const sample2 = str2.substring(pos2, pos2 + sampleSize);
    
    const words1 = new Set(sample1.toLowerCase().split(/\s+/));
    const words2 = new Set(sample2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    totalSimilarity += union.size > 0 ? intersection.size / union.size : 0;
  }
  
  return totalSimilarity / samples;
}

/**
 * Generate diff summary showing what changed
 */
function generateDiffSummary(oldContent, newContent, maxLength = 500) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const added = [];
  const removed = [];
  
  // Simple line-based diff (for performance)
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  
  // Find removed lines
  oldLines.forEach(line => {
    if (!newSet.has(line) && line.trim().length > 10) {
      removed.push(line.trim());
    }
  });
  
  // Find added lines
  newLines.forEach(line => {
    if (!oldSet.has(line) && line.trim().length > 10) {
      added.push(line.trim());
    }
  });
  
  return {
    added: added.slice(0, 10),
    removed: removed.slice(0, 10),
    addedCount: added.length,
    removedCount: removed.length,
    summary: `Added ${added.length} lines, removed ${removed.length} lines`
  };
}

// ============ ENHANCED STORAGE FUNCTIONS ============

/**
 * Store full page content with magnitude tracking
 */
function storeFullPageContent(url, content, magnitude, extraction) {
  const sheet = getOrCreateMonitorSheet();
  let contentSheet = sheet.getSheetByName('FullContent');
  
  // Create sheet if it doesn't exist
  if (!contentSheet) {
    contentSheet = sheet.insertSheet('FullContent');
    contentSheet.getRange(1, 1, 1, 8).setValues([[
      'URL', 'Timestamp', 'Content Length', 'Content Hash', 
      'Storage Type', 'Content/Drive ID', 'Magnitude', 'Change %'
    ]]);
    contentSheet.setFrozenRows(1);
  }
  
  const timestamp = new Date().toISOString();
  const contentHash = extraction.contentHash;
  
  // Determine storage method
  let storageType = 'sheet';
  let storageValue = content;
  
  if (content.length > MAGNITUDE_CONFIG.driveThreshold) {
    // Store in Google Drive for large content
    try {
      const driveFileId = saveContentToDrive(url, content, timestamp);
      storageType = 'drive';
      storageValue = driveFileId;
    } catch (error) {
      console.error('Failed to save to Drive:', error);
      // Fall back to truncated storage
      storageValue = content.substring(0, MAGNITUDE_CONFIG.driveThreshold);
    }
  } else if (content.length > 50000) {
    // Truncate for Google Sheets cell limit
    storageValue = content.substring(0, 50000);
    storageType = 'sheet-truncated';
  }
  
  // Add new row
  contentSheet.appendRow([
    url,
    timestamp,
    content.length,
    contentHash,
    storageType,
    storageValue,
    magnitude ? magnitude.magnitude : 'baseline',
    magnitude ? magnitude.percentageChange : 0
  ]);
  
  // Keep only last 30 days of data
  cleanOldContent(contentSheet, 30);
}

/**
 * Get previous full content for comparison
 */
function getPreviousFullContent(url) {
  const sheet = getOrCreateMonitorSheet();
  const contentSheet = sheet.getSheetByName('FullContent');
  
  if (!contentSheet) return null;
  
  const data = contentSheet.getDataRange().getValues();
  
  // Find most recent entry for this URL
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === url) {
      const storageType = data[i][4];
      const storageValue = data[i][5];
      
      if (storageType === 'drive') {
        // Retrieve from Google Drive
        try {
          return getContentFromDrive(storageValue);
        } catch (error) {
          console.error('Failed to retrieve from Drive:', error);
          return null;
        }
      } else {
        // Direct content from sheet
        return storageValue;
      }
    }
  }
  
  return null;
}

/**
 * Save content to Google Drive
 */
function saveContentToDrive(url, content, timestamp) {
  const folder = getOrCreateDriveFolder('AI_Monitor_Content');
  const fileName = `${url.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.txt`;
  
  const blob = Utilities.newBlob(content, 'text/plain', fileName);
  const file = folder.createFile(blob);
  
  return file.getId();
}

/**
 * Get content from Google Drive
 */
function getContentFromDrive(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return file.getBlob().getDataAsString();
  } catch (error) {
    console.error('Error retrieving file:', error);
    return null;
  }
}

/**
 * Get or create Drive folder
 */
function getOrCreateDriveFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * Clean old content entries
 */
function cleanOldContent(sheet, daysToKeep) {
  const data = sheet.getDataRange().getValues();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const rowsToDelete = [];
  
  for (let i = 1; i < data.length; i++) {
    const timestamp = new Date(data[i][1]);
    if (timestamp < cutoffDate) {
      rowsToDelete.push(i + 1);
      
      // Clean up Drive files if applicable
      if (data[i][4] === 'drive') {
        try {
          DriveApp.getFileById(data[i][5]).setTrashed(true);
        } catch (error) {
          // File might already be deleted
        }
      }
    }
  }
  
  // Delete rows in reverse order
  rowsToDelete.reverse().forEach(row => {
    sheet.deleteRow(row);
  });
}

// ============ ENHANCED MONITORING WITH MAGNITUDE ============

/**
 * Process monitor with magnitude detection
 */
function processMonitorWithMagnitude(monitor) {
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
      
      // Get previous full content
      const previousContent = getPreviousFullContent(url);
      
      if (!baseline) {
        // First time seeing this URL
        storeBaseline(monitor.company, url, extraction);
        storeFullPageContent(url, extraction.content, null, extraction);
        
        results.urls.push({
          url: url,
          status: 'baseline_created',
          contentLength: extraction.contentLength
        });
      } else {
        // Check for changes
        if (baseline.contentHash !== extraction.contentHash) {
          // Calculate magnitude of change
          const magnitude = calculateChangeMagnitude(
            previousContent || baseline.content || '',
            extraction.content
          );
          
          // Generate diff summary
          const diff = generateDiffSummary(
            previousContent || baseline.content || '',
            extraction.content
          );
          
          // Determine if we should alert based on magnitude
          const shouldAlert = magnitude.shouldAlert || 
                            (magnitude.percentageChange >= MAGNITUDE_CONFIG.thresholds.significant);
          
          // Calculate relevance score with magnitude boost
          let relevanceScore = calculateRelevanceScore(
            previousContent || baseline.content || '',
            extraction.content,
            url
          );
          
          // Boost score based on magnitude
          if (magnitude.magnitude === 'major') relevanceScore += 3;
          else if (magnitude.magnitude === 'significant') relevanceScore += 2;
          else if (magnitude.magnitude === 'moderate') relevanceScore += 1;
          
          relevanceScore = Math.min(10, relevanceScore);
          
          const change = {
            company: monitor.company,
            url: url,
            oldHash: baseline.contentHash,
            newHash: extraction.contentHash,
            magnitude: magnitude,
            diff: diff,
            relevanceScore: relevanceScore,
            keywords: extractChangeKeywords(
              previousContent || baseline.content || '',
              extraction.content
            ),
            shouldAlert: shouldAlert,
            detectedAt: new Date().toISOString()
          };
          
          results.changes.push(change);
          
          // Update baseline and store new content
          storeBaseline(monitor.company, url, extraction);
          storeFullPageContent(url, extraction.content, magnitude, extraction);
          
          results.urls.push({
            url: url,
            status: 'changed',
            changePercentage: magnitude.percentageChange,
            magnitude: magnitude.magnitude,
            relevanceScore: relevanceScore,
            alert: shouldAlert
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
 * Generate magnitude report across all changes
 */
function generateMagnitudeReport(changes) {
  const report = {
    totalChanges: changes.length,
    byMagnitude: {
      major: [],
      significant: [],
      moderate: [],
      minor: []
    },
    alerts: [],
    summary: ''
  };
  
  changes.forEach(change => {
    const magnitude = change.magnitude.magnitude;
    report.byMagnitude[magnitude].push({
      company: change.company,
      url: change.url,
      changePercent: change.magnitude.percentageChange,
      diff: change.diff.summary
    });
    
    if (change.shouldAlert) {
      report.alerts.push({
        company: change.company,
        url: change.url,
        reason: `${change.magnitude.percentageChange}% content change (${magnitude})`,
        preview: change.diff.added.slice(0, 3)
      });
    }
  });
  
  // Generate summary
  const majorCount = report.byMagnitude.major.length;
  const significantCount = report.byMagnitude.significant.length;
  
  if (majorCount > 0) {
    report.summary = `ALERT: ${majorCount} major changes detected (>50% content change). `;
  }
  if (significantCount > 0) {
    report.summary += `${significantCount} significant changes require attention. `;
  }
  
  report.summary = report.summary || 'No significant changes detected.';
  
  return report;
}

/**
 * Test magnitude detection
 */
function testMagnitudeDetection() {
  const test1 = "This is a test page about AI and machine learning.";
  const test2 = "This is a test page about AI, machine learning, and now includes pricing at $99/month.";
  const test3 = "Completely new content about quantum computing and blockchain.";
  
  console.log('Test 1 -> 2:', calculateChangeMagnitude(test1, test2));
  console.log('Test 1 -> 3:', calculateChangeMagnitude(test1, test3));
  console.log('Diff 1 -> 2:', generateDiffSummary(test1, test2));
  
  return {
    success: true,
    message: 'Check logs for magnitude test results'
  };
}

/**
 * Enable magnitude detection
 */
function enableMagnitudeDetection() {
  // Replace the standard processor with magnitude-aware version
  processMonitorEnhanced = processMonitorWithMagnitude;
  
  // Set configuration flag
  PropertiesService.getScriptProperties().setProperty('MAGNITUDE_DETECTION_ENABLED', 'true');
  
  // Log the change
  logActivity('Magnitude detection enabled', 'configuration');
  
  return {
    success: true,
    message: 'Magnitude detection is now active',
    thresholds: MAGNITUDE_CONFIG.thresholds
  };
}

/**
 * Get magnitude statistics
 */
function getMagnitudeStats() {
  const sheet = getOrCreateMonitorSheet();
  const contentSheet = sheet.getSheetByName('FullContent');
  
  if (!contentSheet) {
    return {
      enabled: false,
      message: 'No magnitude data collected yet'
    };
  }
  
  const data = contentSheet.getDataRange().getValues();
  const stats = {
    totalEntries: data.length - 1,
    byMagnitude: {
      major: 0,
      significant: 0,
      moderate: 0,
      minor: 0,
      baseline: 0
    },
    averageChangePercent: 0,
    largestChange: 0,
    recentChanges: []
  };
  
  let totalPercent = 0;
  let changeCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const magnitude = data[i][6];
    const changePercent = data[i][7];
    
    stats.byMagnitude[magnitude] = (stats.byMagnitude[magnitude] || 0) + 1;
    
    if (changePercent > 0) {
      totalPercent += changePercent;
      changeCount++;
      stats.largestChange = Math.max(stats.largestChange, changePercent);
    }
    
    // Add to recent changes if within last 24 hours
    const timestamp = new Date(data[i][1]);
    const hoursSince = (new Date() - timestamp) / (1000 * 60 * 60);
    
    if (hoursSince <= 24 && magnitude !== 'baseline') {
      stats.recentChanges.push({
        url: data[i][0],
        magnitude: magnitude,
        changePercent: changePercent,
        timestamp: data[i][1]
      });
    }
  }
  
  stats.averageChangePercent = changeCount > 0 ? 
    Math.round((totalPercent / changeCount) * 10) / 10 : 0;
  
  return stats;
}