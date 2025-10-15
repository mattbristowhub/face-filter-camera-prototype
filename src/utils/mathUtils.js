/**
 * Math Utilities
 * Pre-calculated lookup tables for fast trigonometric operations
 */

import { MATH } from '../config/constants.js';

class MathUtils {
  constructor() {
    this.sinLookup = [];
    this.cosLookup = [];
    this.lookupSize = MATH.LOOKUP_SIZE;
    this.initialized = false;
  }

  /**
   * Initialize lookup tables
   */
  init() {
    if (this.initialized) return;

    for (let i = 0; i < this.lookupSize; i++) {
      const rad = (i * Math.PI * 2) / this.lookupSize;
      this.sinLookup[i] = Math.sin(rad);
      this.cosLookup[i] = Math.cos(rad);
    }

    this.initialized = true;
  }

  /**
   * Fast sine calculation using lookup table
   * @param {number} angle - Angle in radians
   * @returns {number}
   */
  fastSin(angle) {
    if (!this.initialized) this.init();

    const index = Math.floor(((angle % (Math.PI * 2)) / (Math.PI * 2)) * this.lookupSize);
    return this.sinLookup[Math.max(0, Math.min(this.lookupSize - 1, index))];
  }

  /**
   * Fast cosine calculation using lookup table
   * @param {number} angle - Angle in radians
   * @returns {number}
   */
  fastCos(angle) {
    if (!this.initialized) this.init();

    const index = Math.floor(((angle % (Math.PI * 2)) / (Math.PI * 2)) * this.lookupSize);
    return this.cosLookup[Math.max(0, Math.min(this.lookupSize - 1, index))];
  }

  /**
   * Linear interpolation
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number}
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Clamp value between min and max
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Calculate distance between two 2D points
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @returns {number}
   */
  distance2D(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Calculate elliptical distance (normalized)
   * @param {number} x
   * @param {number} y
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} radiusX
   * @param {number} radiusY
   * @returns {number}
   */
  ellipticalDistance(x, y, centerX, centerY, radiusX, radiusY) {
    const normalizedX = (x - centerX) / radiusX;
    const normalizedY = (y - centerY) / radiusY;
    return Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
  }

  /**
   * Smooth falloff function (cosine-based)
   * @param {number} normalizedDistance - Distance from 0-1
   * @param {number} power - Falloff power (default 1.0)
   * @returns {number}
   */
  smoothFalloff(normalizedDistance, power = 1.0) {
    if (normalizedDistance > 1.0) return 0;
    return Math.pow(Math.cos(normalizedDistance * Math.PI / 2), power);
  }
}

// Singleton instance
export const mathUtils = new MathUtils();
export default MathUtils;
