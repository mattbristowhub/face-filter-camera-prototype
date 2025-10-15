/**
 * Camera Module
 * Handles camera initialization and stream management
 */

import { CAMERA_CONFIG } from './config/constants.js';
import { browserDetector } from './utils/browserDetection.js';

export class Camera {
  constructor() {
    this.video = null;
    this.stream = null;
    this.initialized = false;
  }

  /**
   * Setup camera and video element
   * @param {HTMLVideoElement} videoElement
   * @returns {Promise<void>}
   */
  async setup(videoElement) {
    this.video = videoElement;
    const constraints = browserDetector.getCameraConstraints();

    try {
      this.stream = await this.accessCamera(constraints);
      this.video.srcObject = this.stream;

      // iOS Safari specific setup
      if (browserDetector.isIOS) {
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.setAttribute('playsinline', 'true');
        this.video.setAttribute('muted', 'true');
      }

      await this.waitForVideoReady();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Camera access failed: ${error.message}`);
    }
  }

  /**
   * Access camera with retry logic
   * @param {object} constraints
   * @returns {Promise<MediaStream>}
   */
  async accessCamera(constraints) {
    const maxAttempts = CAMERA_CONFIG.RETRY_ATTEMPTS;
    let stream = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check for getUserMedia support with fallbacks
        if (!navigator.mediaDevices?.getUserMedia) {
          if (navigator.webkitGetUserMedia) {
            stream = await new Promise((resolve, reject) => {
              navigator.webkitGetUserMedia(constraints, resolve, reject);
            });
          } else {
            throw new Error('Camera access is not supported in this browser');
          }
        } else {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        }

        if (stream) {
          return stream;
        }
      } catch (error) {
        if (browserDetector.isSafari && attempt < maxAttempts) {
          // Progressive degradation for Safari
          this.degradeConstraints(constraints);
          await this.delay(CAMERA_CONFIG.RETRY_DELAY_MS);
        } else if (attempt >= maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error('Failed to obtain camera stream after multiple attempts');
  }

  /**
   * Degrade camera constraints for retry
   * @param {object} constraints
   */
  degradeConstraints(constraints) {
    if (constraints.video.width?.ideal) {
      constraints.video.width.ideal = Math.max(240, constraints.video.width.ideal - 80);
    }
    if (constraints.video.height?.ideal) {
      constraints.video.height.ideal = Math.max(180, constraints.video.height.ideal - 60);
    }
    if (constraints.video.frameRate?.ideal) {
      constraints.video.frameRate.ideal = Math.max(10, constraints.video.frameRate.ideal - 5);
    }
  }

  /**
   * Wait for video to be ready
   * @returns {Promise<void>}
   */
  waitForVideoReady() {
    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeoutMs = browserDetector.getCameraTimeout();

      const handleVideoReady = async () => {
        if (resolved) return;

        try {
          // iOS Safari video play attempts
          if (browserDetector.isIOS && this.video.paused) {
            await this.playVideoIOS();
          }

          // Verify video dimensions
          if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
            throw new Error('Video dimensions are invalid');
          }

          resolved = true;
          resolve();
        } catch (error) {
          resolved = true;
          reject(error);
        }
      };

      // Multiple event listeners for Safari compatibility
      this.video.addEventListener('loadedmetadata', handleVideoReady);
      this.video.addEventListener('canplay', handleVideoReady);
      this.video.addEventListener('loadeddata', handleVideoReady);

      this.video.addEventListener('error', error => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Video error: ${error.message || 'Unknown video error'}`));
        }
      });

      // Timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`Video loading timeout after ${timeoutMs}ms`));
        }
      }, timeoutMs);
    });
  }

  /**
   * Play video on iOS with retry logic
   * @returns {Promise<void>}
   */
  async playVideoIOS() {
    const maxPlayAttempts = 3;

    for (let attempt = 1; attempt <= maxPlayAttempts; attempt++) {
      try {
        await this.video.play();
        return;
      } catch (error) {
        if (attempt >= maxPlayAttempts) {
          throw error;
        }

        await this.delay(200);
      }
    }
  }

  /**
   * Stop camera stream
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.initialized = false;
  }

  /**
   * Get video dimensions
   * @returns {object}
   */
  getDimensions() {
    return {
      width: this.video?.videoWidth || 0,
      height: this.video?.videoHeight || 0
    };
  }

  /**
   * Check if camera is ready
   * @returns {boolean}
   */
  isReady() {
    return this.initialized && this.video?.videoWidth > 0;
  }

  /**
   * Delay helper
   * @param {number} ms
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default Camera;
