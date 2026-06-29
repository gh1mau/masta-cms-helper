# AGENTS.md - Masta CMS Helper

## Project Identity

**Name:** Masta CMS Helper  
**Type:** Interactive Security Hardening Dashboard  
**Platform:** GitHub Pages (Static Site)  
**Language:** English  
**Author:** Hussein Mohamed masta ghimau  
**YouTube:** https://www.youtube.com/@mastaghimau  
**GitHub:** https://github.com/gh1mau  
**Email:** gh1mau.rulez@gmail.com

## Project Vision

Create a dynamic, SOC (Security Operations Center) radar-style web application that serves as a comprehensive security hardening companion for CMS administrators (Joomla, WordPress, Drupal). The interface must be cyberpunk/SOC aesthetic - dark themed, neon accents, radar visualizations, real-time threat feeds, and interactive matrix-style checklists.

## Core Requirements

### 1. Visual Design (SOC Radar Style)

- **Theme:** Dark mode primary (#0a0e27, #1a1f3a backgrounds), neon accents (#00f0ff cyan, #ff0055 magenta, #00ff9d green)
- **Layout:** Radar chart center (risk assessment), surrounding panels for feeds and checklists
- **Typography:** Monospace for technical data (JetBrains Mono/Cascadia Code), Sans for headers (Inter/Roboto)
- **Animations:** Pulsing threat indicators, typing effects for CVE feeds, smooth transitions

### 2. Interactive Configuration Engine

Users must select:

- **CMS:** Joomla | WordPress | Drupal | All
- **Web Server:** Apache | Nginx | IIS | LiteSpeed
- **OS:** Linux (Ubuntu/CentOS) | Windows Server
- **Environment:** Production | Staging | Development

Based on selection, dynamically render:

- Context-specific hardening checklists
- Relevant CVE filters
- Compatibility warnings

### 3. Live Threat Intelligence Feeds

**Data Sources (Client-side fetch):**

- **NVD API** (National Vulnerability Database): Fetch latest CVEs for selected CMS/Web Server
  - Endpoint: `https://services.nvd.nist.gov/rest/json/cves/2.0`
  - Keywords: "Joomla", "WordPress", "Drupal", "Apache HTTP Server", "Nginx"
- **CISA KEV Catalog** (Known Exploited Vulnerabilities)
  - Endpoint: `https://api.cisa.gov/known-exploited-vulnerabilities/catalog`
  - Filter for relevant vendors

**Display Requirements:**

- Real-time ticker-style feed (auto-scroll)
- Severity color coding (Critical: Red, High: Orange, Medium: Yellow, Low: Green)
- CVSS score badges
- Exploit availability indicators
- Last updated timestamp

### 4. Comprehensive Hardening Checklists

**CMS-Specific Sections:**

- **Joomla:** .htaccess protection, admin URL obfuscation, SQLi prevention, session management, extension audit
- **WordPress:** wp-config hardening, security keys, file permissions, plugin security, REST API restrictions
- **Drupal:** settings.php protection, admin path protection, database prefixing, Twig autoescape, trusted host patterns

**Web Server Hardening:**

- **Apache:** ModSecurity rules, disable directory listing, security headers (X-Frame-Options, CSP, HSTS), disable server tokens
- **Nginx:** Buffer overflow protection, rate limiting, SSL configuration, location block hardening
- **IIS:** Request filtering, URLScan, IP restrictions, dynamic IP restrictions

**OS Hardening:**

- **Linux:** Fail2ban, SELinux/AppArmor, kernel parameters (sysctl), SSH hardening, auto-updates, log monitoring
- **Windows:** Local security policy, Windows Defender, firewall rules, service hardening, PowerShell execution policy

**Checklist Features:**

- Progress tracking (X of Y completed)
- Priority levels (Critical/High/Medium/Low)
- Expandable details with copy-paste commands/configs
- Export to PDF/JSON
- LocalStorage persistence of checked items

### 5. Risk Assessment Radar

Central visualization showing:

- Current security posture score (0-100)
- Radar/spider chart axes: CMS Security | Server Security | OS Security | Network Security | Application Security | Data Protection
- Real-time updates based on checklist completion
- Threat level indicator (Critical/High/Medium/Low)

## Technical Architecture

### Stack (GitHub Pages Compatible)

- **Frontend:** Vanilla HTML5, CSS3 (CSS Grid/Flexbox), ES6+ JavaScript
- **Visualization:** Chart.js (Radar charts) or D3.js for custom SOC graphics
- **Storage:** LocalStorage for user progress, SessionStorage for temporary data
- **Styling:** Custom CSS with CSS variables for theming
- **Icons:** FontAwesome or Phosphor Icons (security-themed)
- **Fonts:** Google Fonts (Inter + JetBrains Mono)

### File Structure

masta-cms-helper/
├── index.html # Main SPA container
├── logo.png # Branding logo (use in header)
├── css/
│ ├── main.css # Variables, base styles
│ ├── components.css # Cards, buttons, radar
│ ├── animations.css # SOC-style animations
│ └── responsive.css # Mobile adaptations
├── js/
│ ├── config.js # User selection state management
│ ├── cveFetcher.js # NVD & CISA API integration
│ ├── checklistEngine.js # Checklist logic & LocalStorage
│ ├── radarChart.js # Risk visualization
│ ├── data/
│ │ ├── joomla.json # Joomla hardening steps
│ │ ├── wordpress.json # WordPress hardening
│ │ ├── drupal.json # Drupal hardening
│ │ ├── apache.json # Apache hardening
│ │ ├── nginx.json # Nginx hardening
│ │ └── linux.json # OS hardening
│ └── uiController.js # DOM manipulation
└── .github/
└── workflows/
└── update-cve-cache.yml # Optional: GitHub Action to cache CVE data

### API Integration Strategy

1. **NVD API:** Use `fetch()` with proper headers, implement caching (rate limit: 5 requests per 30 seconds)
2. **CISA KEV:** Direct fetch of JSON catalog, filter client-side
3. **Error Handling:** Fallback to cached data if APIs fail, show "Last Updated" timestamps
4. **CORS:** Ensure all API calls are CORS-friendly or use proxy if needed (though client-side preferred for GitHub Pages)

### Branding Requirements

- **Logo:** Use `logo.png` in root as favicon and header branding
- **Header:** Display "Masta CMS Helper" with logo, author credit "by Hussein Mohamed masta ghimau"
- **Footer:**
  - Links: YouTube (youtube.com/@mastaghimau), GitHub (github.com/gh1mau), Email (gh1mau.rulez@gmail.com)
  - Disclaimer: "For educational purposes. Always test in staging before production."
  - Version number

## Implementation Phases

### Phase 1: Foundation

- HTML structure with dark theme SOC layout
- CSS grid system for dashboard layout
- Logo integration and branding
- Configuration selector (CMS/Server/OS dropdowns)

### Phase 2: Data Layer

- Create JSON data files for all hardening checklists
- LocalStorage implementation for progress tracking
- Sample CVE data for offline demonstration

### Phase 3: Visualization

- Radar chart implementation (Chart.js)
- Risk score calculation algorithm
- Animated threat indicators

### Phase 4: Live Feeds

- NVD API integration with rate limiting
- CISA KEV feed parsing
- Auto-refresh mechanism (every 6 hours)

### Phase 5: Polish

- Export functionality (PDF generation using jsPDF or print styles)
- Responsive mobile design
- Keyboard shortcuts (Space to check item, Arrow keys to navigate)
- Loading states and skeleton screens

## Quality Standards

- **Accessibility:** WCAG 2.1 AA compliance (keyboard navigation, ARIA labels, contrast ratios)
- **Performance:** Lighthouse score >90, lazy load CVE lists, minify assets
- **Security:** No hardcoded API keys in client code (use free public endpoints only), sanitize all DOM insertions to prevent XSS
- **Browser Support:** Latest Chrome, Firefox, Safari, Edge (ES6+ features)

## Success Metrics

- Checklist completion tracking works across sessions
- CVE feeds load within 3 seconds
- Radar chart updates dynamically with checklist progress
- Mobile-responsive layout functional on 375px width screens
