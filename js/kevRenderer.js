/**
 * KEV Renderer Module - Professional CISA KEV Display
 * Groups vulnerabilities by year and renders them in a clean card layout
 */

class KEVRenderer {
  constructor() {
    this.catalogVersion = '';
    this.dateReleased = '';
    this.isLiveData = false;
  }

  setCatalogMetadata(version, date, isLive = false) {
    this.catalogVersion = version;
    this.dateReleased = date;
    this.isLiveData = isLive;
  }

  render(container, items) {
    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-shield-alt"></i>
          <p>No relevant KEV entries for selected stack</p>
        </div>`;
      this.updateHeaderInfo(0, false);
      return;
    }

    // Group by year
    const byYear = this.groupByYear(items);
    const years = Object.keys(byYear).sort((a, b) => b - a);

    let html = '';
    years.forEach(year => {
      const yearItems = byYear[year];
      html += this.renderYearGroup(year, yearItems);
    });

    container.innerHTML = html;
    this.updateHeaderInfo(items.length, true);
  }

  groupByYear(items) {
    const byYear = {};
    items.forEach(item => {
      const year = item.dateAdded?.split('-')[0] || 'Unknown';
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(item);
    });
    return byYear;
  }

  renderYearGroup(year, items) {
    return `
      <div class="kev-year-group">
        <div class="kev-year-header">
          <span class="kev-year-badge">${year}</span>
          <span class="kev-year-count">${items.length} vulnerabilities</span>
        </div>
        <div class="kev-year-grid">
          ${items.map(item => this.renderKEVCard(item)).join('')}
        </div>
      </div>
    `;
  }

  renderKEVCard(item) {
    const severityClass = this.getSeverityClass(item.cvss);
    const severityLabel = this.getSeverityLabel(item.cvss);
    const shortDesc = this.truncate(item.vulnerability, 60);
    
    return `
      <div class="kev-card ${severityClass}">
        <div class="kev-card-header">
          <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${item.id}" 
             target="_blank" 
             rel="noopener"
             class="kev-id" 
             title="View in CISA Catalog">
            ${item.id}
          </a>
          <div class="kev-score-badge ${severityClass}">
            <span class="kev-score-value">${item.cvss.toFixed(1)}</span>
            <span class="kev-score-label">${severityLabel}</span>
          </div>
        </div>
        
        <div class="kev-card-body">
          <div class="kev-vendor-row">
            <span class="kev-vendor">${item.vendor}</span>
            <span class="kev-separator">›</span>
            <span class="kev-product">${item.product}</span>
          </div>
          <div class="kev-description" title="${this.escapeHtml(item.vulnerability)}">
            ${shortDesc}
          </div>
        </div>
        
        <div class="kev-card-footer">
          <div class="kev-duedate">
            <i class="fas fa-calendar-alt"></i>
            <span class="kev-duedate-label">Patch Due:</span>
            <span class="kev-duedate-value">${item.dueDate}</span>
          </div>
          <div class="kev-info" title="${this.escapeHtml(item.notes || '')}">
            <i class="fas fa-info-circle"></i>
          </div>
        </div>
      </div>
    `;
  }

  getSeverityClass(cvss) {
    if (cvss >= 9) return 'critical';
    if (cvss >= 7) return 'high';
    if (cvss >= 4) return 'medium';
    return 'low';
  }

  getSeverityLabel(cvss) {
    if (cvss >= 9) return 'CRITICAL';
    if (cvss >= 7) return 'HIGH';
    if (cvss >= 4) return 'MEDIUM';
    return 'LOW';
  }

  truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateHeaderInfo(count, isLoaded) {
    const catalogInfo = document.getElementById('kev-catalog-info');
    const kevStatus = document.getElementById('kev-status');
    const kevCount = document.getElementById('kev-count');

    if (catalogInfo) {
      const version = this.catalogVersion || 'CISA KEV';
      const date = this.dateReleased 
        ? new Date(this.dateReleased).toLocaleDateString() 
        : 'Latest';
      catalogInfo.textContent = `${version} • Released: ${date}`;
    }

    if (kevCount) {
      kevCount.textContent = `${count} entries`;
    }

    if (kevStatus) {
      if (this.isLiveData) {
        // Data loaded successfully (from local JSON via GitHub Actions)
        kevStatus.innerHTML = `
          <span class="status-dot online" style="background: #3fb950; box-shadow: 0 0 8px #3fb950;"></span>
          <span style="color: #3fb950; font-weight: 600;">✓ LOADED</span>
        `;
      } else {
        // Fallback to embedded data
        kevStatus.innerHTML = `
          <span class="status-dot offline" style="background: #58a6ff; box-shadow: 0 0 8px #58a6ff;"></span>
          <span style="color: #58a6ff; font-weight: 600;">EMBEDDED</span>
        `;
      }
    }
  }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KEVRenderer };
}
