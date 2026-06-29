/**
 * Masta CMS Helper - Main Application Controller
 * OpenCTI-style Professional Security Dashboard
 * Author: Hussein Mohamed masta ghimau
 */

// ==========================================
// STATE MANAGEMENT
// ==========================================
class StateManager {
  constructor() {
    this.config = { cms: 'all', server: 'apache', os: 'linux' };
    this.progress = {};
    this.listeners = [];
    this.storageAvailable = this.checkStorage();
    this.loadAll();
  }

  checkStorage() {
    try {
      if (typeof localStorage === 'undefined') return false;
      const t = '__test__';
      localStorage.setItem(t, t);
      localStorage.removeItem(t);
      return true;
    } catch (e) {
      console.warn('localStorage not available');
      return false;
    }
  }

  saveConfig() {
    if (!this.storageAvailable) return;
    try { localStorage.setItem('masta_config', JSON.stringify(this.config)); } catch {}
    this.emit('configChange', this.config);
  }

  loadConfig() {
    if (!this.storageAvailable) return;
    try {
      const raw = localStorage.getItem('masta_config');
      if (raw) this.config = { ...this.config, ...JSON.parse(raw) };
    } catch {}
  }

  setConfig(key, value) {
    if (this.config[key] !== value) {
      this.config[key] = value;
      this.saveConfig();
    }
  }

  saveProgress() {
    if (!this.storageAvailable) return;
    try { localStorage.setItem('masta_progress', JSON.stringify(this.progress)); } catch {}
  }

  loadProgress() {
    if (!this.storageAvailable) { this.progress = {}; return; }
    try {
      const raw = localStorage.getItem('masta_progress');
      if (raw) this.progress = JSON.parse(raw);
    } catch { this.progress = {}; }
  }

  toggleItem(checklistId, itemId) {
    if (!this.progress[checklistId]) {
      this.progress[checklistId] = { completed: [], timestamp: new Date().toISOString() };
    }
    const list = this.progress[checklistId].completed;
    const idx = list.indexOf(itemId);
    if (idx === -1) list.push(itemId);
    else list.splice(idx, 1);
    this.progress[checklistId].timestamp = new Date().toISOString();
    this.saveProgress();
    this.emit('progressChange', { checklistId, itemId, state: idx === -1 });
  }

  isCompleted(checklistId, itemId) {
    return this.progress[checklistId]?.completed?.includes(itemId) || false;
  }

  getCompletedCount(checklistId) {
    return this.progress[checklistId]?.completed?.length || 0;
  }

  exportProgress() {
    return JSON.stringify({ config: this.config, progress: this.progress, exportedAt: new Date().toISOString() }, null, 2);
  }

  exportMarkdown() {
    const lines = [
      '# Masta CMS Helper - Security Hardening Report',
      `Generated: ${new Date().toLocaleString()}`, '', '## Configuration',
      `- CMS: ${this.config.cms}`, `- Server: ${this.config.server}`, `- OS: ${this.config.os}`,
      '', '## Progress Summary'
    ];
    for (const [key, val] of Object.entries(this.progress)) {
      lines.push(`- ${key}: ${val?.completed?.length || 0} items completed`);
    }
    return lines.join('\n');
  }

  importProgress(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.progress) this.progress = data.progress;
      if (data.config) this.config = { ...this.config, ...data.config };
      this.saveProgress(); this.saveConfig();
      this.emit('configChange', this.config);
      return true;
    } catch { return false; }
  }

  on(event, callback) { this.listeners.push({ event, callback }); }
  emit(event, data) { this.listeners.filter(l => l.event === event).forEach(l => l.callback(data)); }
  loadAll() { this.loadConfig(); this.loadProgress(); }
}

// ==========================================
// HARDENING DATA - Loaded from JSON files
// No longer hardcoded - Edit data/*.json files instead
// ==========================================
let HARDENING_DATA = {}; // Populated by loadHardeningData()

// ==========================================
// HARDENING DATA LOADER
// Loads checklist data from data/*.json files
// ==========================================
async function loadHardeningData(files) {
  const data = {};
  
  for (const file of files) {
    try {
      const response = await fetch(`data/${file}.json`, { cache: 'no-store' });
      if (!response.ok) {
        console.warn(`⚠️ Failed to load ${file}.json: ${response.status}`);
        continue;
      }
      const json = await response.json();
      data[file] = json.items || [];
      console.log(`✅ Loaded ${file}.json: ${data[file].length} items`);
    } catch (error) {
      console.error(`❌ Error loading ${file}.json:`, error);
      data[file] = [];
    }
  }
  return data;
}

// Available hardening data files
const HARDENING_FILES = ['joomla', 'wordpress', 'drupal', 'apache', 'nginx', 'iis', 'linux', 'windows'];

// ==========================================
// CISA KEV CATALOG - Loaded from kev_data.js
// ==========================================
// CISA_KEV_CATALOG array is defined in js/kev_data.js

// Load hardening data on startup
async function initializeHardeningData() {
  HARDENING_DATA = await loadHardeningData(HARDENING_FILES);
  console.log('✅ Hardening data loaded from JSON files');
}

// ==========================================
// CVE SERVICE
// ==========================================
class CVEService {
  constructor() {
    this.NVD_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
    this.CISA_URL = 'https://api.cisa.gov/known-exploited-vulnerabilities/catalog';
    // On GitHub Pages this is always HTTPS, so live fetch works
    // For local file:// testing, we still try proxies then fall back to embedded data
    this.isFileProtocol = false; // Always try live fetch first
    this.productKeywords = {
      joomla: ['Joomla', 'joomla'], wordpress: ['WordPress', 'wordpress'],
      drupal: ['Drupal', 'drupal'], apache: ['Apache HTTP Server', 'Apache', 'apache', 'httpd'],
      nginx: ['Nginx', 'nginx'], litespeed: ['LiteSpeed', 'litespeed'],
      iis: ['IIS', 'Microsoft IIS'], linux: ['Linux', 'linux', 'Ubuntu', 'Debian', 'CentOS'],
      windows: ['Windows', 'microsoft windows', 'server']
    };
  }

  getProductKeywords(cms, server, os) {
    const keywords = [];
    if (cms === 'all') keywords.push(...this.productKeywords.joomla, ...this.productKeywords.wordpress, ...this.productKeywords.drupal);
    else if (this.productKeywords[cms]) keywords.push(...this.productKeywords[cms]);
    if (this.productKeywords[server]) keywords.push(...this.productKeywords[server]);
    if (this.productKeywords[os]) keywords.push(...this.productKeywords[os]);
    return [...new Set(keywords)];
  }

  async loadFeeds(config) {
    if (this.isFileProtocol) {
      return { items: this.getFallbackCVEs(config), kev: await this.getCISA_KEV(config), fromCache: true };
    }
    
    const keywords = this.getProductKeywords(config.cms, config.server, config.os);
    const results = [];
    
    // Fetch NVD for each keyword (parallel)
    const nvdPromises = keywords.slice(0, 3).map(async keyword => {
      try {
        return await this.fetchNVD(keyword, 15);
      } catch (e) { 
        console.warn('NVD fetch failed:', keyword, e.message); 
        return [];
      }
    });
    
    const nvdResults = await Promise.all(nvdPromises);
    nvdResults.forEach(items => results.push(...items));
    
    // Fetch CISA KEV live (async)
    const kev = await this.getCISA_KEV(config);
    
    // Deduplicate and sort
    const seen = new Set();
    const unique = results.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; });
    unique.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
    
    return { items: unique.length > 0 ? unique : this.getFallbackCVEs(config), kev, fromCache: false };
  }

  async fetchNVD(keyword, limit = 10) {
    const url = `${this.NVD_BASE}?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=${limit}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return this.parseNVDResponse(data);
  }

  parseNVDResponse(data) {
    if (!data?.vulnerabilities) return [];
    return data.vulnerabilities.map(v => {
      const cve = v.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
      const cvssScore = metrics?.cvssData?.baseScore || 0;
      let severity = metrics?.cvssData?.baseSeverity?.toLowerCase() || 'low';
      if (cvssScore >= 9) severity = 'critical';
      else if (cvssScore >= 7) severity = 'high';
      else if (cvssScore >= 4) severity = 'medium';
      
      return {
        id: cve.id,
        description: cve.descriptions?.find(d => d.lang === 'en')?.value || 'No description',
        cvssScore: cvssScore,
        severity: severity,
        publishedDate: cve.published,
        source: 'NVD'
      };
    });
  }

  async fetchCISA_KEV() {
    // PRIORITY 1: Load from local JSON file (updated by GitHub Actions)
    // This works from both file:// (local disk) and https:// (GitHub Pages)
    // No CORS issues since it's same-origin for both cases
    
    try {
      console.log('📂 Loading CISA KEV from local JSON (GitHub Actions updated)...');
      const res = await fetch('./data/cisa_kev.json', { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      const vulnerabilities = data?.vulnerabilities;
      
      if (vulnerabilities && Array.isArray(vulnerabilities) && vulnerabilities.length > 0) {
        console.log(`✅ SUCCESS: Loaded ${vulnerabilities.length} vulnerabilities from local JSON`);
        this.catalogVersion = data.catalogVersion || data.catalog_version || 'GitHub Edition';
        this.dateReleased = data.dateReleased || data.date_released || new Date().toISOString();
        this.isLiveData = true; // Consider local file as "live" since it's updated daily
        this.dataSource = 'local-json';
        return vulnerabilities;
      } else {
        throw new Error('No vulnerabilities array in JSON');
      }
    } catch (e) {
      console.warn(`    ❌ Local JSON failed: ${e.message}`);
    }
    
    // PRIORITY 2: Fallback to embedded kev_data.js (for offline/broken scenarios)
    console.warn('⚠️ Local JSON not available - falling back to embedded catalog');
    this.catalogVersion = 'Offline (Embedded)';
    this.dateReleased = new Date().toISOString();
    this.isLiveData = false;
    this.dataSource = 'embedded';
    return []; // Triggers fallback to CISA_KEV_CATALOG
  }

  async getCISA_KEV(config) {
    // Fetch live CISA KEV catalog
    const kevData = await this.fetchCISA_KEV();
    
    if (kevData.length === 0) {
      // Fallback to hardcoded if API fails
      return this.getFallbackKEV(config);
    }
    
    // Map ALL vulnerabilities to our format (show everything, no filtering)
    const allMapped = kevData.map(v => {
      // Calculate severity based on keywords in vulnerabilityName if no CVSS
      let cvss = 5.0; // default medium
      const vulnName = (v.vulnerabilityName || '').toLowerCase();
      if (vulnName.includes('remote code execution') || vulnName.includes('command injection')) cvss = 9.8;
      else if (vulnName.includes('authentication bypass') || vulnName.includes('privilege escalation')) cvss = 8.5;
      else if (vulnName.includes('sql injection') || vulnName.includes('path traversal')) cvss = 7.5;
      else if (vulnName.includes('information disclosure') || vulnName.includes('denial of service')) cvss = 5.0;
      
      return {
        id: v.cveID,
        vendor: v.vendorProject || 'Unknown',
        product: v.product || 'Unknown',
        vulnerability: v.vulnerabilityName || 'Vulnerability',
        shortDescription: v.shortDescription || '',
        dateAdded: v.dateAdded,
        dueDate: v.dueDate || 'Unknown',
        requiredAction: v.requiredAction || '',
        knownRansomwareCampaignUse: v.knownRansomwareCampaignUse || 'Unknown',
        notes: v.notes || '',
        cwes: v.cwes || [],
        cvss: cvss,
        _source: 'live'
      };
    }).sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    
    // Return first 100 latest entries only (performance + UX)
    const limited = allMapped.slice(0, 100);
    console.log(`📊 Displaying ${limited.length} latest KEV entries (limited from ${allMapped.length})`);
    return limited;
  }

  getFallbackKEV(config) {
    // DEFENSIVE: Embedded CISA KEV catalog from kev_data.js
    // If variable not loaded, return empty (graceful degradation)
    if (typeof CISA_KEV_CATALOG === 'undefined') {
      console.warn('⚠️ CISA_KEV_CATALOG not loaded from kev_data.js - KEV panel will be empty');
      this.catalogVersion = 'Unavailable';
      this.isLiveData = false;
      return [];
    }
    console.log(`📦 EMBEDDED: Displaying ${CISA_KEV_CATALOG.length} offline KEV entries from real CISA catalog`);
    this.catalogVersion = 'Offline (Real Data)';
    this.isLiveData = false;
    return CISA_KEV_CATALOG;
  }

  getFallbackCVEs(config) {
    // Return empty - we want LIVE data only from NVD API
    // Hardcoded CVEs removed as per requirements
    return [];
  }
}

// ==========================================
// CHECKLIST ENGINE
// ==========================================
class ChecklistEngine {
  constructor(stateManager) {
    this.state = stateManager;
    this.currentStack = 'cms';
    this.filter = 'all';
    this.itemsByStack = { cms: [], server: [], os: [] };
    this.container = document.getElementById('checklist-container');
  }

  categorize(filename) {
    const cats = {
      cms: ['joomla', 'wordpress', 'drupal'],
      server: ['apache', 'nginx', 'litespeed', 'iis'],
      os: ['linux', 'windows']
    };
    for (const [cat, items] of Object.entries(cats)) {
      if (items.includes(filename)) return cat;
    }
    return 'cms';
  }

  loadAll(config) {
    const files = [];
    if (config.cms === 'all') files.push('joomla', 'wordpress', 'drupal');
    else files.push(config.cms);
    files.push(config.server, config.os);
    
    this.itemsByStack = { cms: [], server: [], os: [] };
    
    for (const file of [...new Set(files)]) {
      const data = HARDENING_DATA[file] || [];
      const category = this.categorize(file);
      for (const item of data) {
        item._source = file;
        item._category = category;
        this.itemsByStack[category].push(item);
      }
    }
    
    for (const cat of ['cms', 'server', 'os']) {
      const seen = new Set();
      this.itemsByStack[cat] = this.itemsByStack[cat].filter(i => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      this.itemsByStack[cat].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    }
    
    this.updateCounts();
  }

  updateCounts() {
    ['cms', 'server', 'os'].forEach(cat => {
      const el = document.getElementById(`${cat}-count`);
      if (el) el.textContent = this.itemsByStack[cat].length;
    });
  }

  setStack(stack) {
    this.currentStack = stack;
    this.render();
  }

  setFilter(filter) {
    this.filter = filter;
    this.render();
  }

  render() {
    if (!this.container) return;
    
    const items = this.itemsByStack[this.currentStack] || [];
    const filtered = this.filter === 'all' ? items : items.filter(i => i.severity === this.filter);
    
    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No ${this.currentStack.toUpperCase()} items for current filter</p>
        </div>`;
      return;
    }
    
    this.container.innerHTML = '';
    const checklistId = `checklist-${this.state.config.cms}-${this.state.config.server}-${this.state.config.os}`;
    
    filtered.forEach(item => {
      const isChecked = this.state.isCompleted(checklistId, item.id);
      this.container.appendChild(this.createItem(item, isChecked, checklistId));
    });
    
    this.updateProgress();
  }

  createItem(item, isChecked, checklistId) {
    const div = document.createElement('div');
    div.className = `checklist-item ${isChecked ? 'completed' : ''}`;
    div.dataset.id = item.id;
    
    div.innerHTML = `
      <input type="checkbox" class="checklist-checkbox" ${isChecked ? 'checked' : ''}>
      <div class="checklist-content">
        <div class="checklist-header-row">
          <span class="severity-tag ${item.severity}">${item.severity}</span>
          <span class="checklist-title">${this.escapeHtml(item.title)}</span>
        </div>
        <div class="checklist-meta">
          <span class="checklist-category">${item.category.replace('-', ' ')}</span>
          <span>•</span>
          <span>${item._source}</span>
        </div>
      </div>`;
    
    const checkbox = div.querySelector('.checklist-checkbox');
    checkbox.addEventListener('change', () => {
      this.state.toggleItem(checklistId, item.id);
      div.classList.toggle('completed', checkbox.checked);
      this.updateProgress();
      // Update radar chart when checklist item changes
      if (window.app && window.app.updateRadar) {
        window.app.updateRadar();
      }
      if (checkbox.checked) this.showToast(`✓ ${item.title}`, 'success');
    });
    
    div.addEventListener('click', (e) => {
      if (e.target !== checkbox) this.showEntityDetails(item);
    });
    
    return div;
  }

  updateProgress() {
    const items = this.itemsByStack[this.currentStack] || [];
    const checklistId = `checklist-${this.state.config.cms}-${this.state.config.server}-${this.state.config.os}`;
    const completed = this.state.getCompletedCount(checklistId);
    const total = items.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${completed} of ${total} completed`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    
    const statCompleted = document.getElementById('stat-completed');
    const statScore = document.getElementById('stat-security-score');
    const statCritical = document.getElementById('stat-critical');
    
    if (statCompleted) statCompleted.textContent = `${completed}/${total}`;
    if (statScore) statScore.textContent = `${percent}%`;
    if (statCritical) statCritical.textContent = items.filter(i => i.severity === 'critical').length;
  }

  showEntityDetails(item) {
    const panel = document.getElementById('entity-details');
    if (!panel) return;
    
    const impl = item.implementation?.[this.state.config.server] || Object.values(item.implementation || {})[0] || 'No implementation code';
    
    // Build comprehensive details with new fields
    let html = `
      <div class="entity-header">
        <span class="severity-tag ${item.severity}">${item.severity}</span>
        <h3 class="entity-title">${this.escapeHtml(item.title)}</h3>
      </div>
      <div class="entity-body">
        <div class="entity-section">
          <div class="entity-section-title">Description</div>
          <p class="entity-description">${this.escapeHtml(item.description)}</p>
        </div>`;
    
    // Add threat intelligence if available
    if (item.threat) {
      html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-exclamation-triangle"></i> Threat</div>
          <p class="entity-description threat-text">${this.escapeHtml(item.threat)}</p>
        </div>`;
    }
    
    // Add impact if available
    if (item.impact) {
      html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-fire"></i> Impact</div>
          <p class="entity-description impact-text">${this.escapeHtml(item.impact)}</p>
        </div>`;
    }
    
    // Add mitigation steps if available
    if (item.mitigationSteps && item.mitigationSteps.length > 0) {
      html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-tasks"></i> Mitigation Steps</div>
          <ol class="mitigation-steps">`;
      item.mitigationSteps.forEach(step => {
        html += `<li>${this.escapeHtml(step)}</li>`;
      });
      html += `</ol></div>`;
    }
    
    html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-check-circle"></i> Verification</div>
          <p class="entity-description">${this.escapeHtml(item.verification)}</p>
        </div>`;
    
    // Add testing steps if available
    if (item.testing && item.testing.length > 0) {
      html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-vial"></i> Testing Commands</div>
          <ul class="testing-list">`;
      item.testing.forEach(test => {
        html += `<li><code>${this.escapeHtml(test)}</code></li>`;
      });
      html += `</ul></div>`;
    }
    
    html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-code"></i> Implementation</div>
          <div class="entity-code-header">
            <span>${this.state.config.server}</span>
            <button class="code-copy-btn">Copy</button>
          </div>
          <pre class="entity-code-block"><code>${this.escapeHtml(impl)}</code></pre>
        </div>`;
    
    // Add rollback procedure if available
    if (item.rollback) {
      html += `
        <div class="entity-section rollback-section">
          <div class="entity-section-title"><i class="fas fa-undo"></i> Rollback Procedure</div>
          <p class="entity-description rollback-text">${this.escapeHtml(item.rollback)}</p>
        </div>`;
    }
    
    // Add tools if available
    if (item.tools && item.tools.length > 0) {
      html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-toolbox"></i> Required Tools</div>
          <div class="tools-list">`;
      item.tools.forEach(tool => {
        html += `<span class="tool-tag">${this.escapeHtml(tool)}</span>`;
      });
      html += `</div></div>`;
    }
    
    // Add CWE references
    if (item.cwe && item.cwe.length > 0) {
      html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-shield-alt"></i> CWE References</div>
          <div class="cwe-list">`;
      item.cwe.forEach(cwe => {
        html += `<span class="cwe-tag">${this.escapeHtml(cwe)}</span>`;
      });
      html += `</div></div>`;
    }
    
    // Add external references
    if (item.references && item.references.length > 0) {
      html += `
        <div class="entity-section">
          <div class="entity-section-title"><i class="fas fa-external-link-alt"></i> References</div>
          <ul class="references-list">`;
      item.references.forEach(ref => {
        html += `<li><a href="${ref}" target="_blank" rel="noopener">${this.escapeHtml(ref)}</a></li>`;
      });
      html += `</ul></div>`;
    }
    
    html += `</div>`;
    panel.innerHTML = html;
    
    panel.querySelector('.code-copy-btn')?.addEventListener('click', function() {
      const code = this.parentElement.nextElementSibling.textContent;
      navigator.clipboard.writeText(code).then(() => this.textContent = 'Copied!');
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 3000);
  }
}

// ==========================================
// RADAR CHART
// ==========================================
class RadarChart {
  constructor() {
    this.canvas = document.getElementById('radarCanvas');
    this.chart = null;
  }

  init() {
    if (!this.canvas || typeof Chart === 'undefined') return;
    const ctx = this.canvas.getContext('2d');
    
    Chart.defaults.color = '#8b949e';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['CMS Security', 'Server Security', 'OS Security', 'Network Security', 'App Security', 'Data Protection'],
        datasets: [
          {
            label: 'Current',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: '#58a6ff',
            backgroundColor: 'rgba(88, 166, 255, 0.2)',
            borderWidth: 2,
            pointBackgroundColor: '#58a6ff',
            pointBorderColor: '#0d1117'
          },
          {
            label: 'Target',
            data: [100, 100, 100, 100, 100, 100],
            borderColor: 'rgba(139, 148, 158, 0.2)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [5, 5],
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true, max: 100, min: 0,
            ticks: { stepSize: 20, color: '#6e7681', font: { size: 10 } },
            grid: { color: 'rgba(48, 54, 61, 0.5)' },
            angleLines: { color: 'rgba(48, 54, 61, 0.3)' },
            pointLabels: { color: '#c9d1d9', font: { size: 11, weight: '500' } }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  update(scores) {
    if (!this.chart) return;
    this.chart.data.datasets[0].data = scores;
    this.chart.update();
    
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const scoreEl = document.getElementById('riskScoreValue');
    const badgeEl = document.getElementById('risk-badge');
    
    if (scoreEl) {
      scoreEl.textContent = avg;
      scoreEl.style.color = avg >= 80 ? '#3fb950' : avg >= 60 ? '#58a6ff' : avg >= 40 ? '#d29922' : '#f85149';
    }
    if (badgeEl) {
      badgeEl.textContent = avg >= 80 ? 'Excellent' : avg >= 60 ? 'Good' : avg >= 40 ? 'Fair' : 'Critical';
      badgeEl.className = 'panel-badge ' + (avg >= 80 ? 'good' : avg >= 40 ? 'warning' : '');
    }
  }
}

// ==========================================
// MAIN APPLICATION
// ==========================================
class App {
  constructor() {
    this.state = new StateManager();
    this.cveService = new CVEService();
    this.checklist = new ChecklistEngine(this.state);
    this.radar = new RadarChart();
    this.currentTab = 'dashboard';
    this.init();
  }

  async init() {
    this.bindTabs();
    this.bindConfig();
    this.bindStackTabs();
    this.bindSeverityFilter();
    this.bindManagementActions();
    
    // Load hardening data from JSON files first
    await initializeHardeningData();
    
    this.checklist.loadAll(this.state.config);
    this.radar.init();
    this.updateRadar();
    await this.loadCVEs();
    this.renderManagementTab();
    
    // Show dashboard tab
    this.switchTab('dashboard');
  }

  bindTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.dataset.tab === tabName));
  }

  bindConfig() {
    document.getElementById('cms-options')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.config-btn');
      if (!btn) return;
      document.querySelectorAll('#cms-options .config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.state.setConfig('cms', btn.dataset.value);
      this.refreshAll();
    });
    
    document.getElementById('server-options')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.config-btn');
      if (!btn) return;
      document.querySelectorAll('#server-options .config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.state.setConfig('server', btn.dataset.value);
      this.refreshAll();
    });
    
    document.getElementById('os-options')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.config-btn');
      if (!btn) return;
      document.querySelectorAll('#os-options .config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.state.setConfig('os', btn.dataset.value);
      this.refreshAll();
    });
  }

  bindStackTabs() {
    document.querySelector('.stack-selector')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.stack-btn');
      if (!btn) return;
      document.querySelectorAll('.stack-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.checklist.setStack(btn.dataset.stack);
    });
  }

  bindSeverityFilter() {
    document.querySelector('.severity-filter')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.checklist.setFilter(btn.dataset.filter);
    });
  }

  bindManagementActions() {
    // Export JSON
    document.getElementById('export-json')?.addEventListener('click', () => {
      const blob = new Blob([this.state.exportProgress()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `masta-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      this.showToast('Configuration exported', 'success');
    });
    
    // Export Markdown
    document.getElementById('export-md')?.addEventListener('click', () => {
      const blob = new Blob([this.state.exportMarkdown()], { type: 'text/markdown' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `masta-report-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      this.showToast('Report exported', 'success');
    });
    
    // Import
    document.getElementById('import-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (this.state.importProgress(reader.result)) {
          this.refreshAll();
          document.getElementById('import-file').value = '';
          this.showToast('Configuration imported successfully', 'success');
        } else {
          this.showToast('Failed to import - invalid file format', 'error');
        }
      };
      reader.readAsText(file);
    });
    
    // Reset Progress
    document.getElementById('reset-progress')?.addEventListener('click', () => {
      if (confirm('Reset ALL checklist progress? This cannot be undone.')) {
        this.state.progress = {};
        this.state.saveProgress();
        this.refreshAll();
        this.showToast('All progress reset', 'success');
      }
    });
    
    // Clear Config
    document.getElementById('clear-config')?.addEventListener('click', () => {
      if (confirm('Reset configuration to defaults?')) {
        this.state.config = { cms: 'all', server: 'apache', os: 'linux' };
        this.state.saveConfig();
        this.refreshAll();
        this.showToast('Configuration reset', 'success');
      }
    });
  }

  renderManagementTab() {
    const container = document.getElementById('management-content');
    if (!container) return;
    
    // Count stats
    const totalCompleted = Object.values(this.state.progress).reduce((sum, p) => sum + (p?.completed?.length || 0), 0);
    const totalItems = 45; // Approximate
    const backupDate = Object.values(this.state.progress)[0]?.timestamp ? new Date(Object.values(this.state.progress)[0].timestamp).toLocaleDateString() : 'Never';
    
    container.innerHTML = `
      <div class="management-grid">
        <div class="management-card">
          <h4><i class="fas fa-chart-pie"></i> Progress Statistics</h4>
          <div class="stat-row">
            <span>Items Completed:</span>
            <span class="stat-value">${totalCompleted}/${totalItems}</span>
          </div>
          <div class="stat-row">
            <span>Completed:</span>
            <span class="stat-value">${Math.round((totalCompleted/totalItems)*100)}%</span>
          </div>
          <div class="stat-row">
            <span>Last Backup:</span>
            <span class="stat-value">${backupDate}</span>
          </div>
        </div>
        
        <div class="management-card">
          <h4><i class="fas fa-download"></i> Backup & Restore</h4>
          <p>Export your configuration and checklist progress to a JSON file for backup or transfer to another device.</p>
          <div class="action-buttons">
            <button class="action-btn primary" id="export-json">
              <i class="fas fa-file-export"></i> Export JSON
            </button>
            <button class="action-btn primary" id="export-md">
              <i class="fas fa-file-alt"></i> Export Report
            </button>
            <label class="action-btn file-input-label">
              <i class="fas fa-file-import"></i> Import JSON
              <input type="file" id="import-file" accept=".json" hidden>
            </label>
          </div>
        </div>
        
        <div class="management-card danger">
          <h4><i class="fas fa-exclamation-triangle"></i> Danger Zone</h4>
          <p>These actions cannot be undone. Please be certain before proceeding.</p>
          <div class="action-buttons">
            <button class="action-btn danger" id="reset-progress">
              <i class="fas fa-undo"></i> Reset All Progress
            </button>
            <button class="action-btn danger" id="clear-config">
              <i class="fas fa-trash"></i> Reset Configuration
            </button>
          </div>
        </div>
        
        <div class="management-card">
          <h4><i class="fas fa-info-circle"></i> About</h4>
          <p><strong>Masta CMS Helper</strong></p>
          <p>Author: Hussein Mohamed masta ghimau</p>
          <p>Version: 2.0 - OpenCTI Edition</p>
          <p>A comprehensive security hardening companion for CMS administrators.</p>
        </div>
      </div>
    `;
  }

  async refreshAll() {
    this.checklist.loadAll(this.state.config);
    this.checklist.render();
    this.updateRadar();
    this.loadKEVOnly(); // Load only CISA KEV, no NVD API
    this.renderManagementTab();
  }

  updateRadar() {
    const allItems = [...this.checklist.itemsByStack.cms, ...this.checklist.itemsByStack.server, ...this.checklist.itemsByStack.os];
    const checklistId = `checklist-${this.state.config.cms}-${this.state.config.server}-${this.state.config.os}`;
    
    const categories = {
      'CMS Security': { max: 0, score: 0 }, 'Server Security': { max: 0, score: 0 },
      'OS Security': { max: 0, score: 0 }, 'Network Security': { max: 0, score: 0 },
      'App Security': { max: 0, score: 0 }, 'Data Protection': { max: 0, score: 0 }
    };
    
    const catMapping = {
      'server-config': 'Server Security', 'application-security': 'App Security',
      'authentication': 'App Security', 'access-control': 'App Security',
      'database-security': 'Data Protection', 'data-protection': 'Data Protection',
      'network-security': 'Network Security', 'os-security': 'OS Security'
    };
    
    const severityPoints = { critical: 10, high: 7, medium: 4, low: 2 };
    
    allItems.forEach(item => {
      const cat = catMapping[item.category] || 'App Security';
      const points = severityPoints[item.severity] || 2;
      categories[cat].max += points;
      if (this.state.isCompleted(checklistId, item.id)) categories[cat].score += points;
    });
    
    const scores = Object.values(categories).map(c => c.max > 0 ? Math.round((c.score / c.max) * 100) : 0);
    this.radar.update(scores);
  }

  async loadKEVOnly() {
    // Load CISA KEV data (live via CORS proxies or fallback to local)
    const container = document.getElementById('kev-feed-container');
    if (!container) return;
    
    // Initialize KEV renderer if not exists
    if (!this.kevRenderer) {
      this.kevRenderer = new KEVRenderer();
    }
    
    // Show loading state
    container.innerHTML = `
      <div class="loading-kev">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading CISA KEV data...</p>
      </div>`;
    
    try {
      // Fetch CISA KEV data
      const kev = await this.cveService.getCISA_KEV(this.state.config);
      
      // Update stat
      const statCves = document.getElementById('stat-cves');
      if (statCves) statCves.textContent = kev.length;
      
      // Set catalog metadata with live/cached status
      this.kevRenderer.setCatalogMetadata(
        this.cveService.catalogVersion,
        this.cveService.dateReleased,
        this.cveService.isLiveData
      );
      
      // Render using KEVRenderer
      this.kevRenderer.render(container, kev);
      
    } catch (e) {
      console.error('Failed to load KEV:', e);
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <p>Failed to load CISA KEV data</p>
          <small>${e.message}</small>
        </div>`;
    }
  }

  renderKEVFull(container, items) {
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-shield-alt"></i><p>No relevant KEV entries for selected stack</p></div>';
      return;
    }
    
    let html = `
      <div class="kev-header">
        <span class="kev-badge">CISA KEV</span>
        <span class="kev-updated">${items.length} vulnerabilities</span>
      </div>
      <div class="kev-list">
    `;
    
    items.forEach(item => {
      const severityClass = item.cvss >= 9 ? 'critical' : item.cvss >= 7 ? 'high' : item.cvss >= 4 ? 'medium' : 'low';
      html += `
        <div class="kev-item ${severityClass}">
          <div class="kev-main">
            <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${item.id}" 
               target="_blank" class="kev-id">${item.id}</a>
            <span class="kev-score ${severityClass}">${item.cvss.toFixed(1)}</span>
          </div>
          <div class="kev-product">${item.vendor} ${item.product}</div>
          <div class="kev-vuln">${item.vulnerability}</div>
          <div class="kev-meta">
            <span class="kev-duedate"><i class="fas fa-clock"></i> Patch Due: ${item.dueDate}</span>
            <span class="kev-notes" title="${item.notes}">${item.notes}</span>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  async loadCVEs() {
    // Deprecated - use loadKEVOnly() instead
    this.loadKEVOnly();
  }

  renderCVEsByYear(container, items) {
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No CVEs found</p></div>';
      return;
    }
    
    // Group by year
    const byYear = {};
    items.forEach(item => {
      const year = new Date(item.publishedDate).getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(item);
    });
    
    // Sort years descending
    const years = Object.keys(byYear).sort((a, b) => b - a);
    
    let html = '<div class="cve-timeline">';
    years.forEach(year => {
      html += `
        <div class="cve-year-section">
          <div class="cve-year-header">
            <span class="cve-year-badge">${year}</span>
            <span class="cve-year-count">${byYear[year].length} vulnerabilities</span>
          </div>
          <div class="cve-year-grid">
      `;
      
      byYear[year].forEach(item => {
        html += this.renderCVECard(item);
      });
      
      html += '</div></div>';
    });
    
    if (years.length === 0) {
      html = '<div class="empty-state"><p>No CVEs found for selected products</p></div>';
    } else {
      html += '</div>';
    }
    
    container.innerHTML = html;
  }

  renderCVECard(item) {
    const date = new Date(item.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <a href="https://nvd.nist.gov/vuln/detail/${item.id}" target="_blank" rel="noopener" class="cve-card ${item.severity}">
        <div class="cve-card-header">
          <span class="cve-id">${item.id}</span>
          <span class="cve-score ${item.severity}">${item.cvssScore.toFixed(1)}</span>
        </div>
        <div class="cve-source">${item.source}</div>
        <div class="cve-description">${item.description}</div>
        <div class="cve-card-footer">
          <span class="cve-date"><i class="far fa-calendar"></i> ${date}</span>
          <span class="cve-severity ${item.severity}">${item.severity.toUpperCase()}</span>
        </div>
      </a>
    `;
  }

  renderKEV(container, items) {
    if (!container) return;
    
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-state"><strong>No CISA KEV entries</strong><br>for selected products</div>';
      return;
    }
    
    const dateAdded = items[0]?.dateAdded ? new Date(items[0].dateAdded).toLocaleDateString() : 'Unknown';
    
    let html = `
      <div class="kev-header">
        <span class="kev-badge">CISA KEV</span>
        <span class="kev-updated">Updated: ${dateAdded}</span>
      </div>
      <div class="kev-list">
    `;
    
    items.slice(0, 15).forEach(item => {
      html += `
        <div class="kev-item ${item.cvss >= 9 ? 'critical' : item.cvss >= 7 ? 'high' : 'medium'}">
          <div class="kev-main">
            <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${item.id}" 
               target="_blank" class="kev-id">${item.id}</a>
            <span class="kev-score">${item.cvss.toFixed(1)}</span>
          </div>
          <div class="kev-product">${item.vendor} ${item.product}</div>
          <div class="kev-vuln">${item.vulnerability}</div>
          <div class="kev-meta">
            <span class="kev-duedate">Due: ${item.dueDate}</span>
            <span class="kev-notes" title="${item.notes}">${item.notes}</span>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 3000);
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
