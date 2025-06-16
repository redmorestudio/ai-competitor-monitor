// Test permissions function
function testPermissions() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test 1: Check if we can access SpreadsheetApp
  try {
    const testSpreadsheet = SpreadsheetApp.create('Test Permission Check');
    results.tests.spreadsheetCreate = 'SUCCESS';
    // Clean up
    DriveApp.getFileById(testSpreadsheet.getId()).setTrashed(true);
  } catch (e) {
    results.tests.spreadsheetCreate = 'FAILED: ' + e.toString();
  }
  
  // Test 2: Check if we can access DriveApp
  try {
    const files = DriveApp.getFilesByName('AI Competitor Monitor Data');
    results.tests.driveAccess = 'SUCCESS';
    results.tests.hasExistingFile = files.hasNext();
  } catch (e) {
    results.tests.driveAccess = 'FAILED: ' + e.toString();
  }
  
  // Test 3: Check if we can create folders
  try {
    const testFolder = DriveApp.createFolder('Test Permission Folder');
    results.tests.folderCreate = 'SUCCESS';
    // Clean up
    testFolder.setTrashed(true);
  } catch (e) {
    results.tests.folderCreate = 'FAILED: ' + e.toString();
  }
  
  // Test 4: Check if spreadsheet exists
  try {
    const configFiles = DriveApp.getFilesByName('AI Competitor Monitor Data');
    if (configFiles.hasNext()) {
      const file = configFiles.next();
      const spreadsheet = SpreadsheetApp.openById(file.getId());
      results.tests.existingSpreadsheet = {
        found: true,
        id: file.getId(),
        sheets: spreadsheet.getSheets().map(s => s.getName())
      };
    } else {
      results.tests.existingSpreadsheet = {
        found: false,
        message: 'No existing spreadsheet found'
      };
    }
  } catch (e) {
    results.tests.existingSpreadsheet = 'ERROR: ' + e.toString();
  }
  
  return results;
}

// Get information about the current deployment
function getDeploymentInfo() {
  return {
    scriptId: ScriptApp.getScriptId(),
    projectTriggers: ScriptApp.getProjectTriggers().map(t => ({
      handlerFunction: t.getHandlerFunction(),
      eventType: t.getEventType(),
      triggerSource: t.getTriggerSource(),
      triggerSourceId: t.getTriggerSourceId()
    })),
    executionTranscript: 'Running as: ' + Session.getActiveUser().getEmail(),
    effectiveUser: Session.getEffectiveUser().getEmail(),
    scopes: Utilities.jsonStringify(ScriptApp.getOAuthToken() ? 'Has OAuth token' : 'No OAuth token')
  };
}