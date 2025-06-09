# Source Files Overview

This directory contains the essential Google Apps Script files needed to run the AI Competitor Intelligence Monitor.

## Core Files (Required)

### WebApp.gs
The main API endpoint handler. Processes all HTTP requests and routes them to appropriate functions.

### ExecutionHandlers.gs
Handles function execution and error management for the web API.

### IntelligentMonitor.gs
Core monitoring logic including change detection and relevance scoring.

### ClaudeIntegration.gs
Integration with Claude AI API for intelligent analysis of changes.

### DailyDigestEmail.gs
Email template system for sending beautiful HTML reports.

### SocialMarketingConfig.gs
Configuration for all monitored companies and URLs.

### MonitorStubs.gs
Utility functions for monitoring operations.

### DailyMonitoring.gs
Scheduling and trigger management for automated runs.

### NotificationSystem.gs
Alert and notification handling system.

### EmailSystemFixed.gs
Fixed email functions that work around Google Apps Script limitations.

### appsscript.json
Manifest file defining permissions and project settings.

## Optional Enhancement Files

These files add extra functionality but aren't required for basic operation:

- **BaselineWithClaude.gs** - Enhanced baseline generation with AI analysis
- **AnalyzeAllCompanies.gs** - Bulk analysis functions
- **SelfHealing.gs** - Error recovery and retry logic
- **AuthHelper.gs** - Additional authentication utilities

## Setup Order

1. Copy all files to your Google Apps Script project
2. Start with `appsscript.json` to set permissions
3. Configure `SocialMarketingConfig.gs` with your companies
4. Set up API key in `ClaudeIntegration.gs`
5. Deploy `WebApp.gs` as web app
6. Test with `MonitorStubs.gs` functions

## File Dependencies

```
WebApp.gs
├── ExecutionHandlers.gs
├── IntelligentMonitor.gs
│   ├── MonitorStubs.gs
│   └── ClaudeIntegration.gs
├── DailyDigestEmail.gs
│   └── EmailSystemFixed.gs
├── DailyMonitoring.gs
│   └── NotificationSystem.gs
└── SocialMarketingConfig.gs
```

## Customization Points

- **SocialMarketingConfig.gs** - Add/remove companies
- **DailyDigestEmail.gs** - Customize email templates
- **IntelligentMonitor.gs** - Adjust change detection sensitivity
- **ClaudeIntegration.gs** - Modify AI prompts

## Security Notes

Never commit files containing:
- API keys (store in Script Properties)
- Email addresses (store in Script Properties)
- Personal tokens or credentials

Use the provided setup functions to securely store sensitive data.