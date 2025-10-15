/**
 * Performance Manager
 * Handles performance detection, monitoring, and adaptive quality adjustments
 */

import { PERFORMANCE, PERFORMANCE_DETECTION, MEMORY, TRACKING } from '../../config/constants.js';
import { browserDetector } from '../utils/browserDetection.js';
import { mathUtils } from '../utils/mathUtils.js';

export class PerformanceManager {
  constructor() {
    this.performanceLevel = 'high';
    this.fps = 0;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.dynamicSkipInterval = 1;
    this.memoryPressureLevel = 0;
    this.lastFaces = [];
    this.cachedFaces = null;
    this.consecutiveStableFrames = 0;
  }

  /**
   * Initialize performance detection
   */
  async init() {
    await this.detectPerformance();
    mathUtils.init();
  }

  /**
   * Detect device performance level
   * @returns {Promise<string>} Performance level (high, medium, low)
   */
  async detectPerformance() {
    const cacheKey = PERFORMANCE_DETECTION.CACHE_KEY;
    const cached = localStorage.getItem(cacheKey);

    // Check cache
    if (cached) {
      try {
        const { level, timestamp, userAgent } = JSON.parse(cached);
        if (
          Date.now() - timestamp < PERFORMANCE_DETECTION.CACHE_DURATION_MS &&
          userAgent === navigator.userAgent
        ) {
          this.performanceLevel = level;
          return this.performanceLevel;
        }
      } catch (e) {
        // Invalid cache, continue with detection
      }
    }

    // Run performance test
    const startTime = performance.now();
    let testResult = 0;
    const iterations = browserDetector.isMobile
      ? PERFORMANCE_DETECTION.ITERATIONS_MOBILE
      : PERFORMANCE_DETECTION.ITERATIONS_DESKTOP;

    for (let i = 0; i < iterations; i++) {
      testResult += Math.random() * mathUtils.fastSin(i * 0.01);
    }

    const testDuration = performance.now() - startTime;

    // Determine performance level
    const highThreshold = browserDetector.isMobile
      ? PERFORMANCE_DETECTION.HIGH_THRESHOLD_MOBILE
      : PERFORMANCE_DETECTION.HIGH_THRESHOLD_DESKTOP;
    const mediumThreshold = browserDetector.isMobile
      ? PERFORMANCE_DETECTION.MEDIUM_THRESHOLD_MOBILE
      : PERFORMANCE_DETECTION.MEDIUM_THRESHOLD_DESKTOP;

    if (testDuration < highThreshold) {
      this.performanceLevel = 'high';
    } else if (testDuration < mediumThreshold) {
      this.performanceLevel = 'medium';
    } else {
      this.performanceLevel = 'low';
    }

    // Safari-specific adjustments
    if (browserDetector.isSafari) {
      if (this.performanceLevel === 'high') {
        this.performanceLevel = 'medium';
      }

      // Check for older iOS devices
      if (browserDetector.isIOS) {
        const userAgent = navigator.userAgent;
        const isOlderiOS = /OS [5-9]_|OS 10_|OS 11_/.test(userAgent);
        if (isOlderiOS || this.performanceLevel === 'medium') {
          this.performanceLevel = 'low';
        }
      }
    }

    // Additional mobile adjustments
    if (browserDetector.isMobile && !browserDetector.isSafari) {
      if (this.performanceLevel === 'high') {
        this.performanceLevel = 'medium';
      }
    }

    // Cache result
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          level: this.performanceLevel,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        })
      );
    } catch (e) {
      // Could not cache performance data
    }

    return this.performanceLevel;
  }

  /**
   * Get current quality settings based on performance level
   * @returns {object}
   */
  getQualitySettings() {
    const settings = { ...PERFORMANCE[this.performanceLevel.toUpperCase()] };

    // Adjust based on memory pressure
    if (this.memoryPressureLevel > 0) {
      settings.skipFrames = Math.min(settings.skipFrames + this.memoryPressureLevel, 5);
      settings.particleCount = Math.max(settings.particleCount - this.memoryPressureLevel, 1);
      settings.shadowBlur = Math.max(settings.shadowBlur - this.memoryPressureLevel * 2, 0);
    }

    return settings;
  }

  /**
   * Update FPS and adjust performance dynamically
   * @param {number} deltaTime - Time since last frame in ms
   */
  updateFPS(deltaTime) {
    this.frameCount++;

    if (this.frameCount % 30 === 0) {
      this.fps = Math.round(1000 / deltaTime);

      // Dynamic performance adjustment
      const targetFPS = PERFORMANCE[this.performanceLevel.toUpperCase()].targetFPS;

      if (this.fps < targetFPS - 5) {
        this.dynamicSkipInterval = Math.min(this.dynamicSkipInterval + 1, 5);
        if (this.performanceLevel === 'high') {
          this.performanceLevel = 'medium';
        } else if (this.performanceLevel === 'medium') {
          this.performanceLevel = 'low';
        }
      } else if (this.fps > targetFPS + 5 && this.dynamicSkipInterval > 1) {
        this.dynamicSkipInterval = Math.max(this.dynamicSkipInterval - 1, 1);
      }
    }
  }

  /**
   * Check if current frame should be skipped for detection
   * @param {number} skipFrameCounter
   * @returns {boolean}
   */
  shouldSkipFrame(skipFrameCounter) {
    return skipFrameCounter % this.dynamicSkipInterval !== 0;
  }

  /**
   * Calculate face movement between frames
   * @param {Array} newFaces
   * @returns {number} Average movement in pixels
   */
  calculateFaceMovement(newFaces) {
    if (!this.lastFaces.length || !newFaces.length) {
      this.lastFaces = newFaces;
      return Infinity;
    }

    let totalMovement = 0;
    let pairCount = 0;

    for (let i = 0; i < Math.min(newFaces.length, this.lastFaces.length); i++) {
      const newFace = newFaces[i];
      const oldFace = this.lastFaces[i];

      if (newFace.scaledMesh && oldFace.scaledMesh) {
        const newNose = newFace.scaledMesh[1]; // Nose tip
        const oldNose = oldFace.scaledMesh[1];

        const movement = Math.sqrt(
          Math.pow(newNose[0] - oldNose[0], 2) + Math.pow(newNose[1] - oldNose[1], 2)
        );

        totalMovement += movement;
        pairCount++;
      }
    }

    this.lastFaces = newFaces;
    return pairCount > 0 ? totalMovement / pairCount : Infinity;
  }

  /**
   * Interpolate face positions for smooth animation
   * @param {Array} faces
   * @param {number} progress - 0-1 interpolation factor
   * @returns {Array}
   */
  interpolateFaces(faces, progress = 0.3) {
    if (!this.cachedFaces || !faces.length) {
      this.cachedFaces = faces;
      return faces;
    }

    const interpolated = faces.map((face, index) => {
      if (index >= this.cachedFaces.length) return face;

      const cached = this.cachedFaces[index];
      return {
        ...face,
        scaledMesh: face.scaledMesh.map((point, pointIndex) => {
          if (pointIndex >= cached.scaledMesh.length) return point;
          const cachedPoint = cached.scaledMesh[pointIndex];
          return [
            cachedPoint[0] + (point[0] - cachedPoint[0]) * progress,
            cachedPoint[1] + (point[1] - cachedPoint[1]) * progress,
            cachedPoint[2] + (point[2] - cachedPoint[2]) * progress
          ];
        })
      };
    });

    this.cachedFaces = faces;
    return interpolated;
  }

  /**
   * Manage tensor memory
   * @param {object} tf - TensorFlow.js instance
   */
  manageTensorMemory(tf) {
    const memInfo = tf.memory();
    this.memoryPressureLevel =
      memInfo.numTensors > MEMORY.PRESSURE_THRESHOLD_HIGH
        ? 2
        : memInfo.numTensors > MEMORY.PRESSURE_THRESHOLD_LOW
        ? 1
        : 0;

    if (this.memoryPressureLevel > 1) {
      tf.disposeVariables();
      if (tf.engine) {
        tf.engine().startScope();
        tf.engine().endScope();
      }
    }
  }

  /**
   * Get current statistics
   * @returns {object}
   */
  getStats() {
    return {
      performanceLevel: this.performanceLevel,
      fps: this.fps,
      frameCount: this.frameCount,
      skipInterval: this.dynamicSkipInterval,
      memoryPressure: this.memoryPressureLevel
    };
  }
}

export default PerformanceManager;
