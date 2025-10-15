/**
 * Photo Capture Handler
 * Manages photo capture functionality
 */

import { UI } from '../config/constants.js';

export class PhotoCapture {
  constructor(video) {
    this.video = video;
    this.captureBtn = null;
    this.flashEl = null;
    this.capturedImageEl = null;
    this.isCapturing = false;
  }

  /**
   * Initialize photo capture
   */
  init() {
    this.captureBtn = document.getElementById('captureBtn');
    this.flashEl = document.querySelector('.preview-flash');
    this.capturedImageEl = document.getElementById('capturedImage');

    if (this.captureBtn) {
      this.captureBtn.addEventListener('click', () => this.capture());
    }
  }

  /**
   * Capture photo (unfiltered)
   */
  async capture() {
    if (this.isCapturing || !this.video.videoWidth) {
      return;
    }

    this.isCapturing = true;

    try {
      // Create temporary canvas for capture
      const canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;

      const ctx = canvas.getContext('2d');

      // Draw unfiltered video frame (flip horizontally)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `face-filter-${Date.now()}.png`;
      a.click();

      // Show flash effect
      this.showFlash();

      // Show thumbnail
      if (this.capturedImageEl) {
        this.capturedImageEl.src = url;
        this.capturedImageEl.classList.add('show');

        setTimeout(() => {
          this.capturedImageEl.classList.remove('show');
          URL.revokeObjectURL(url);
        }, UI.THUMBNAIL_DISPLAY_DURATION_MS);
      }

      // Update status
      this.updateStatus('Photo captured!');
    } catch (error) {
      this.updateStatus('Failed to capture photo');
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Show flash effect
   */
  showFlash() {
    if (!this.flashEl) return;

    this.flashEl.classList.add('active');
    setTimeout(() => {
      this.flashEl.classList.remove('active');
    }, UI.CAPTURE_FLASH_DURATION_MS);
  }

  /**
   * Update status message
   * @param {string} message
   */
  updateStatus(message) {
    const statusEl = document.getElementById('statusText');
    if (statusEl) {
      statusEl.textContent = message;
      setTimeout(() => {
        statusEl.textContent = 'Ready';
      }, 2000);
    }
  }
}

export default PhotoCapture;
