/**
 * UI Controls Handler
 * Manages filter buttons and UI interactions
 */

import { browserDetector } from '../utils/browserDetection.js';

export class UIControls {
  constructor(filterRenderer) {
    this.filterRenderer = filterRenderer;
    this.filterButtons = [];
    this.onFilterChange = null;
  }

  /**
   * Initialize UI controls
   */
  init() {
    this.setupFilterButtons();
    if (browserDetector.isSafari) {
      browserDetector.setupSafariViewport();
    }
  }

  /**
   * Setup filter button event listeners
   */
  setupFilterButtons() {
    this.filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filterName = btn.dataset.filter;
        this.selectFilter(filterName);
      });
    });
  }

  /**
   * Select a filter
   * @param {string} filterName
   */
  selectFilter(filterName) {
    if (this.filterRenderer.setFilter(filterName)) {
      this.updateActiveButton(filterName);

      if (this.onFilterChange) {
        this.onFilterChange(filterName);
      }
    }
  }

  /**
   * Update active button state
   * @param {string} filterName
   */
  updateActiveButton(filterName) {
    this.filterButtons.forEach(btn => {
      if (btn.dataset.filter === filterName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Update status message
   * @param {string} message
   */
  updateStatus(message) {
    const statusEl = document.getElementById('statusText');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  /**
   * Show loading indicator
   * @param {boolean} show
   */
  showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * Set filter change callback
   * @param {Function} callback
   */
  setFilterChangeCallback(callback) {
    this.onFilterChange = callback;
  }
}

export default UIControls;
