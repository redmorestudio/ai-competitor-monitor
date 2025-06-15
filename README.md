# AI Competitor Intelligence Monitor

An automated competitive intelligence system that monitors competitor websites, detects changes, and delivers AI-powered insights via email. Built with Google Apps Script, Claude AI, and Google Sheets.

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 🚀 Overview

The AI Competitor Intelligence Monitor automatically:
- Monitors 16+ competitor websites daily
- Detects meaningful content changes
- Analyzes changes with Claude AI
- Sends professional email digests
- Maintains historical data in Google Sheets
- Runs completely automated with zero maintenance

## ✨ Key Features

- **Intelligent Monitoring**: Tracks specific URLs across competitor sites
- **Change Detection**: Content hash comparison with relevance scoring
- **AI Analysis**: Claude provides competitive insights on significant changes
- **Email Reports**: Beautiful HTML digests delivered daily
- **Data Storage**: Complete audit trail in Google Sheets
- **Fully Automated**: Set it and forget it - runs via Google's infrastructure
- **🧠 TheBrain Integration**: Visual knowledge mapping with automated competitive intelligence

## 📊 What You'll Monitor

### AI Technology Companies (6)
- Mistral AI - LLM/Foundation models
- Codeium - AI coding assistant
- Synthesia - AI video generation
- Articul8 - Enterprise AI platform
- Anysphere (Cursor) - AI code editor
- Moonvalley - AI video creation

### Social Marketing Platforms (10)
- Sprout Social, Brandwatch, SocialPilot, Planable
- Crowdfire, PostPlanner, SocialBee, Loomly
- Zoho Social, Later

*Easily customizable to monitor any companies you choose.*

## 🎯 Use Cases

- **Competitive Intelligence**: Track competitor product launches and updates
- **Market Research**: Monitor industry trends and announcements
- **Pricing Intelligence**: Detect pricing changes across competitors
- **Content Strategy**: See what content competitors are publishing
- **Strategic Planning**: Get AI insights on competitive moves

## 📧 Daily Email Reports

Every morning at 9:15 AM, receive a professional digest including:
- Executive summary with key metrics
- Companies with detected changes
- AI-powered competitive insights
- Direct links to detailed reports
- Strategic recommendations when relevant

## 🛠️ Technology Stack

- **Google Apps Script**: Core automation engine
- **Claude AI API**: Intelligent analysis
- **Google Sheets**: Data storage and dashboard
- **Gmail**: Email delivery
- **HTML/CSS**: Professional email templates
- **TheBrain API**: Knowledge mapping and visualization

## 📋 Prerequisites

- Google Account
- Claude API Key (from Anthropic)
- TheBrain API Key (optional, for knowledge mapping)
- 30 minutes for initial setup

## ⚡ Quick Start

1. Clone this repository
2. Follow the [Setup Guide](SETUP.md)
3. Configure your companies
4. Deploy and start monitoring

```bash
git clone https://github.com/redmorestudio/ai-competitor-monitor.git
cd ai-competitor-monitor
# Follow setup instructions
```

## 📚 Documentation

- [Setup Guide](SETUP.md) - Complete installation instructions
- [Configuration Guide](docs/CONFIGURATION.md) - Customize companies and settings
- [API Reference](docs/API.md) - Web API endpoints
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Architecture](docs/ARCHITECTURE.md) - System design and flow

## 🔧 Configuration Example

```javascript
const MONITOR_CONFIG = [
  {
    company: "Mistral AI",
    category: "AI/LLM",
    urls: [
      "https://mistral.ai",
      "https://mistral.ai/news/",
      "https://mistral.ai/technology/"
    ]
  }
  // Add your companies here
];
```

## 📊 What You Get

- **Automated Monitoring**: Runs daily at 9 AM PST
- **Change Detection**: Identifies meaningful updates
- **AI Analysis**: Claude provides competitive insights
- **Email Alerts**: Professional HTML reports
- **Historical Data**: Complete change history in Google Sheets
- **Zero Maintenance**: Fully automated operation

## 🔐 Security & Privacy

- Runs entirely in your Google Account
- No external servers or databases
- API keys stored securely in Google Apps Script
- Email sent only to configured recipient

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Google Apps Script
- Powered by Claude AI (Anthropic)
- Enhanced with TheBrain visualization
- Inspired by the need for better competitive intelligence

## 📞 Support

For issues and questions:
- Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- Open an issue on GitHub
- Contact: seth@redmore.studio

---

Built with ❤️ by [Redmore Studio](https://redmore.studio)

*Last updated: June 15, 2025 - TheBrain integration complete!*