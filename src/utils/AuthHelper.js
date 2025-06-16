/**
 * Authorization Helper Functions
 * Transferred from Resilient project for debugging and setup
 */

/**
 * Authorization helper - Run this first if there are permission issues
 */
function authorizeScript() {
  console.log("Authorizing script for user:", Session.getActiveUser().getEmail());
  
  try {
    // Test spreadsheet permission
    console.log("Testing Spreadsheet permissions...");
    const testSheet = SpreadsheetApp.create("_temp_auth_test");
    console.log("✅ Spreadsheet permissions OK");
    
    // Test Drive permission  
    console.log("Testing Drive permissions...");
    const files = DriveApp.getFilesByName("_temp_auth_test");
    console.log("✅ Drive permissions OK");
    
    // Clean up test file
    if (files.hasNext()) {
      files.next().setTrashed(true);
    }
    
    // Test Properties permission
    console.log("Testing Properties permissions...");
    PropertiesService.getScriptProperties().setProperty("auth_test", new Date().toISOString());
    console.log("✅ Properties permissions OK");
    
    // Test Mail permission
    console.log("Testing Mail permissions...");
    const recipient = Session.getActiveUser().getEmail();
    MailApp.sendEmail({
      to: recipient,
      subject: "AI Monitor - Authorization Test",
      body: "This is a test email to verify mail permissions are working."
    });
    console.log("✅ Mail permissions OK");
    
    console.log("✅ All permissions verified! System ready to use.");
    return "Success - all permissions verified!";
    
  } catch (error) {
    console.error("Authorization error:", error);
    return error.toString();
  }
}

/**
 * Simple test function to verify auth
 */
function testConnection() {
  return {
    user: Session.getActiveUser().getEmail(),
    timezone: Session.getScriptTimeZone(),
    timestamp: new Date().toISOString(),
    authTest: "If you see this, basic auth worked!"
  };
}

/**
 * Test email without Drive dependencies
 */
function testEmailSimple() {
  try {
    const recipient = Session.getActiveUser().getEmail();
    const subject = "AI Monitor - Simple Email Test";
    const body = `
      This is a test email from AI Competitor Monitor.
      
      Sent at: ${new Date().toISOString()}
      User: ${Session.getActiveUser().getEmail()}
      
      If you received this, the email system is working!
    `;
    
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: body
    });
    
    console.log(`Test email sent to ${recipient}`);
    return {
      success: true,
      message: "Test email sent successfully",
      recipient: recipient
    };
    
  } catch (error) {
    console.error("Email test failed:", error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Debug system status
 */
function debugSystemStatus() {
  const status = {
    user: Session.getActiveUser().getEmail(),
    timezone: Session.getScriptTimeZone(),
    timestamp: new Date().toISOString(),
    permissions: {},
    properties: {},
    errors: []
  };
  
  // Test each permission
  try {
    DriveApp.getRootFolder();
    status.permissions.drive = "✅ OK";
  } catch (error) {
    status.permissions.drive = "❌ " + error.toString();
    status.errors.push("Drive: " + error.toString());
  }
  
  try {
    SpreadsheetApp.create("test").setName("test");
    status.permissions.sheets = "✅ OK";
  } catch (error) {
    status.permissions.sheets = "❌ " + error.toString();
    status.errors.push("Sheets: " + error.toString());
  }
  
  try {
    MailApp.getRemainingDailyQuota();
    status.permissions.mail = "✅ OK";
  } catch (error) {
    status.permissions.mail = "❌ " + error.toString();
    status.errors.push("Mail: " + error.toString());
  }
  
  // Get key properties
  const props = PropertiesService.getScriptProperties();
  status.properties.ownerEmail = props.getProperty('ownerEmail') || 'Not set';
  status.properties.claudeApiKey = props.getProperty('CLAUDE_API_KEY') ? 'Set' : 'Not set';
  status.properties.brainApiKey = props.getProperty('THEBRAIN_API_KEY') ? 'Set' : 'Not set';
  
  return status;
}

/**
 * Fix common permission issues
 */
function fixPermissions() {
  const fixes = [];
  
  try {
    // Re-authorize core services
    const user = Session.getActiveUser().getEmail();
    fixes.push(`User identified: ${user}`);
    
    // Test and fix Properties
    const props = PropertiesService.getScriptProperties();
    props.setProperty('lastPermissionFix', new Date().toISOString());
    fixes.push("Properties service: ✅ Working");
    
    // Test Mail quota
    const quota = MailApp.getRemainingDailyQuota();
    fixes.push(`Mail quota remaining: ${quota}`);
    
    return {
      success: true,
      fixes: fixes,
      message: "Permission fixes completed"
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
      fixes: fixes
    };
  }
}
