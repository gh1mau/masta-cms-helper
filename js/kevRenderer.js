/**
 * KEV Renderer Module - Professional CISA KEV Display
 * Card-based layout for full text display
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
        <div class="kev-card-grid">
          ${items.map(item => this.renderKEVCard(item)).join('')}
        </div>
      </div>
    `;
  }

  renderKEVCard(item) {
    const severityClass = this.getSeverityClass(item.cvss);
    const severityLabel = this.getSeverityLabel(item.cvss);
    
    return `
      <div class="kev-card ${severityClass}">
        <div class="kev-card-header">
          <div class="kev-card-id">
            <a href="https://www.cve.org/CVERecord?id=${item.id}" 
               target="_blank" 
               rel="noopener"
               title="View on CVE.org">
              ${item.id}
            </a>
          </div>
          <div class="kev-card-severity">
            <span class="kev-card-severity-badge ${severityClass}">${severityLabel}</span>
            <span class="kev-card-score">${item.cvss.toFixed(1)}</span>
          </div>
        </div>
        
        <div class="kev-card-product">
          <span class="kev-card-vendor">${item.vendor}</span>
          <span class="kev-card-separator">›</span>
          <span class="kev-card-product-name">${item.product}</span>
        </div>
        
        <div class="kev-card-description">
          ${this.escapeHtml(item.vulnerability)}
        </div>
        
        <div class="kev-card-footer">
          <div class="kev-card-duedate">
            <i class="fas fa-clock"></i>
            <span class="kev-card-duedate-label">Due:</span>
            <span class="kev-card-duedate-value">${item.dueDate}</span>
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
        kevStatus.innerHTML = `
          <span class="status-dot online" style="background: #3fb950; box-shadow: 0 0 8px #3fb950;"></span>
          <span style="color: #3fb950; font-weight: 600;">✓ LOADED</span>
        `;
      } else {
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