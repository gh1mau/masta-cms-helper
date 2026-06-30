# 🛡️ CMS Hardening Helper

A comprehensive security hardening web application and reference guide for Content Management Systems (CMS), Web Servers, and Operating Systems.

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat-square&logo=github)](https://gh1mau.github.io/masta-cms-helper/)
[![Last Updated](https://img.shields.io/badge/Last%20Updated-June%202026-green?style=flat-square)]()

## 🌐 Live Application

**Access the tool here:** [https://gh1mau.github.io/masta-cms-helper/](https://gh1mau.github.io/masta-cms-helper/)

## 📋 What is CMS Hardening Helper?

CMS Hardening Helper is an interactive security hardening checklist and configuration generator designed to help system administrators and developers secure their web infrastructure. The tool provides:

- ✅ **Interactive Security Checklists** - Step-by-step hardening guides
- ✅ **Multi-Platform Support** - CMS, Web Servers, and Operating Systems
- ✅ **CVE Integration** - Known Exploited Vulnerabilities (KEV) tracking via CISA
- ✅ **Multiple Server Support** - Apache, Nginx, LiteSpeed configurations
- ✅ **Implementation Guides** - Complete with commands, testing, and rollback procedures

## 🎯 Supported Platforms

### Content Management Systems (CMS)

| Platform      | Items | Status       |
| ------------- | ----- | ------------ |
| **WordPress** | 15    | ✅ Complete  |
| **Joomla**    | 10    | ✅ Complete  |
| **Drupal**    | 8+    | ✅ Available |

### Web Servers

| Platform      | Items | Status       |
| ------------- | ----- | ------------ |
| **Apache**    | 14    | ✅ Complete  |
| **Nginx**     | 12    | ✅ Complete  |
| **LiteSpeed** | 8+    | ✅ Available |
| **IIS**       | 5+    | ✅ Available |

### Operating Systems

| Platform    | Items | Status       |
| ----------- | ----- | ------------ |
| **Linux**   | 10    | ✅ Complete  |
| **Windows** | 8+    | ✅ Available |

## 🚀 Features

### 1. Interactive Checklist Engine

- Dynamic web-based checklist interface
- Progress tracking and persistence
- Filter by severity (Critical, High, Medium, Low)
- Filter by category (Authentication, Encryption, Server Config, etc.)

### 2. Multi-Server Configuration

- Implementation guides for Apache, Nginx, LiteSpeed
- Copy-paste ready configuration snippets
- Server-specific security directives

### 3. CISA KEV Integration

- Fetches Known Exploited Vulnerabilities from CISA
- Displays active threats for selected CMS/Platform
- Prioritizes patching recommendations

### 4. Comprehensive Item Structure

Each hardening item includes:

- **Threat Analysis** - What danger it mitigates
- **Impact Assessment** - Consequences if ignored
- **Implementation Steps** - Detailed commands and procedures
- **Verification Testing** - How to confirm it's working
- **Rollback Instructions** - How to undo if needed
- **CWE References** - Common Weakness Enumeration links
- **Official Documentation** - Authoritative source references

## 📊 Hardling Coverage

### Severity Distribution

| Severity        | Count     | Examples                                               |
| --------------- | --------- | ------------------------------------------------------ |
| 🔴 **Critical** | 35+ items | SSL/TLS config, Auth bypass prevention, RCE mitigation |
| 🟠 **High**     | 40+ items | WAF deployment, Header security, Rate limiting         |
| 🟡 **Medium**   | 25+ items | Version hiding, Port changes, CSP policies             |
| 🟢 **Low**      | 10+ items | ETag removal, Banner hiding                            |

### Category Coverage

- 🔐 **Authentication** - MFA, Password policies, Brute force protection
- 🌐 **Network Security** - Firewalls, SSL/TLS, Port security
- 📁 **File Security** - Permissions, Access control, Upload security
- 🔧 **Server Configuration** - Headers, Modules, Performance
- 📝 **Logging & Monitoring** - Audit trails, Intrusion detection
- 🔄 **Updates & Patching** - Auto-updates, Vulnerability management

## 🛠️ How to Use

1. **Visit the live site:** [https://gh1mau.github.io/masta-cms-helper/](https://gh1mau.github.io/masta-cms-helper/)

2. **Select Platform:** Choose CMS, Web Server, or Operating System from the tabs

3. **Configure Server:** Select your web server (Apache, Nginx, or LiteSpeed)

4. **Follow Checklist:** Work through each hardening item:
   - Read the threat description
   - Review implementation steps
   - Apply the configuration
   - Run verification tests

5. **Track Progress:** Check off completed items (progress persists in browser)

6. **Stay Updated:** Check CISA KEV section for active vulnerabilities

## 📁 Project Structure

```
masta-cms-helper/
├── index.html          # Main application
├── css/                # Stylesheets
│   ├── variables.css   # Theme variables
│   ├── components.css  # UI components
│   ├── layout.css      # Page layout
│   └── ...
├── js/                 # JavaScript modules
│   ├── app.js          # Main application
│   ├── checklistEngine.js
│   ├── configPanel.js
│   ├── cveService.js
│   └── ...
├── data/               # Hardening data
│   ├── wordpress.json
│   ├── joomla.json
│   ├── drupal.json
│   ├── apache.json
│   ├── nginx.json
│   ├── linux.json
│   └── ...
└── README.md           # This file
```

## 🔄 Data Format

Hardening items follow a standardized JSON schema:

```json
{
  "id": "wp-security-headers",
  "title": "Add Security Headers",
  "severity": "high",
  "category": "application-security",
  "description": "Implement CSP, X-Frame-Options, HSTS...",
  "threat": "XSS and Clickjacking attacks",
  "impact": "Session hijacking, credential theft",
  "implementation": {
    "apache": "Header always set X-Frame-Options...",
    "nginx": "add_header X-Frame-Options...",
    "litespeed": "Same as Apache..."
  },
  "mitigationSteps": ["Step 1...", "Step 2..."],
  "testing": ["Verify headers..."],
  "rollback": "Remove header directives...",
  "tools": ["curl", "securityheaders.com"],
  "cwe": ["CWE-79", "CWE-1021"],
  "references": ["https://..."]
}
```

## 🛡️ Security Best Practices Covered

### CMS Security

- ✅ Default credential changes
- ✅ Security key generation
- ✅ Multi-factor authentication
- ✅ Automatic updates
- ✅ File permission hardening
- ✅ XML-RPC and REST API protection

### Web Server Security

- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ SSL/TLS configuration
- ✅ ModSecurity WAF deployment
- ✅ Rate limiting and DoS protection
- ✅ Directory listing disable
- ✅ Unnecessary module removal

### OS Security

- ✅ SSH hardening (keys only, no root)
- ✅ Firewall configuration (UFW/firewalld)
- ✅ Automatic security updates
- ✅ Fail2Ban intrusion prevention
- ✅ System auditing (auditd)
- ✅ MAC (AppArmor/SELinux)

## 👤 Author

**Hussein Mohamed Masta Ghimau**

- 📧 Email: [gh1mau.rulez@gmail.com](mailto:gh1mau.rulez@gmail.com)
- 🐙 GitHub: [https://github.com/gh1mau](https://github.com/gh1mau)
- 🎬 YouTube: [https://www.youtube.com/@mastaghimau](https://www.youtube.com/@mastaghimau)

## 📝 Contributing

This project is maintained for personal and educational use. Feel free to fork and customize for your needs.

## 📜 License

This project is open source. See repository for license details.

---

**Live Application:** [https://gh1mau.github.io/masta-cms-helper/](https://gh1mau.github.io/masta-cms-helper/)

**Repository:** https://github.com/gh1mau/masta-cms-helper

Last Updated: June 2026
