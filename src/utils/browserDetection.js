/**
 * Browser Detection Utilities
 * Centralizes all browser/device detection logic
 */

class BrowserDetector {
  constructor() {
    this.userAgent = navigator.userAgent;
    this._isMobile = null;
    this._isIOS = null;
    this._isSafari = null;
    this._isChrome = null;
    this._isFirefox = null;
  }

  /**
   * Check if device is mobile
   * @returns {boolean}
   */
  get isMobile() {
    if (this._isMobile === null) {
      this._isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(this.userAgent);
    }
    return this._isMobile;
  }

  /**
   * Check if device is iOS
   * @returns {boolean}
   */
  get isIOS() {
    if (this._isIOS === null) {
      this._isIOS = /iPad|iPhone|iPod/.test(this.userAgent);
    }
    return this._isIOS;
  }

  /**
   * Check if browser is Safari
   * @returns {boolean}
   */
  get isSafari() {
    if (this._isSafari === null) {
      this._isSafari = /^((?!chrome|android).)*safari/i.test(this.userAgent) ||
                       /iPhone|iPad|iPod/.test(this.userAgent);
    }
    return this._isSafari;
  }

  /**
   * Check if browser is Chrome
   * @returns {boolean}
   */
  get isChrome() {
    if (this._isChrome === null) {
      this._isChrome = /Chrome/.test(this.userAgent) && /Google Inc/.test(navigator.vendor);
    }
    return this._isChrome;
  }

  /**
   * Check if browser is Firefox
   * @returns {boolean}
   */
  get isFirefox() {
    if (this._isFirefox === null) {
      this._isFirefox = /Firefox/.test(this.userAgent);
    }
    return this._isFirefox;
  }

  /**
   * Get platform-specific camera timeout
   * @returns {number} Timeout in milliseconds
   */
  getCameraTimeout() {
    const { SAFARI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS } = require('../../config/constants').CAMERA_CONFIG;
    return this.isSafari ? SAFARI_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  }

  /**
   * Get platform-specific camera constraints
   * @returns {object} MediaStream constraints
   */
  getCameraConstraints() {
    const { DEFAULT_CONSTRAINTS, SAFARI_CONSTRAINTS, IOS_CONSTRAINTS } =
      require('../../config/constants').CAMERA_CONFIG;

    if (this.isIOS) {
      return IOS_CONSTRAINTS;
    } else if (this.isSafari) {
      return SAFARI_CONSTRAINTS;
    }
    return DEFAULT_CONSTRAINTS;
  }

  /**
   * Check if Web Workers are supported and recommended
   * @returns {boolean}
   */
  supportsWebWorkers() {
    return typeof Worker !== 'undefined' && !this.isSafari;
  }

  /**
   * Get recommended performance level based on platform
   * @param {string} detectedLevel - Performance level from performance detection
   * @returns {string} Adjusted performance level
   */
  adjustPerformanceLevel(detectedLevel) {
    if (this.isSafari) {
      // Safari needs more conservative settings
      if (detectedLevel === 'high') return 'medium';
      // medium and low stay the same
    }
    return detectedLevel;
  }

  /**
   * Setup Safari-specific viewport handling
   */
  setupSafariViewport() {
    if (!this.isSafari) return;

    // Set CSS variable for Safari's dynamic viewport
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    // Detect Safari interface visibility changes
    let lastHeight = window.innerHeight;
    setInterval(() => {
      if (window.innerHeight !== lastHeight) {
        lastHeight = window.innerHeight;
        const heightDiff = window.screen.height - window.innerHeight;

        if (heightDiff > 100) {
          document.body.classList.add('safari-interface-visible');
          document.body.classList.add('safari-tab-bar-visible');
        } else if (heightDiff > 50) {
          document.body.classList.add('safari-interface-visible');
          document.body.classList.remove('safari-tab-bar-visible');
        } else {
          document.body.classList.remove('safari-interface-visible');
          document.body.classList.remove('safari-tab-bar-visible');
        }
      }
    }, 100);
  }

  /**
   * Get browser compatibility info
   * @returns {object}
   */
  getCompatibilityInfo() {
    return {
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isSafari: this.isSafari,
      isChrome: this.isChrome,
      isFirefox: this.isFirefox,
      supportsWebWorkers: this.supportsWebWorkers(),
      userAgent: this.userAgent
    };
  }
}

// Singleton instance
export const browserDetector = new BrowserDetector();
export default BrowserDetector;
