/**
 * Memory Manager
 * Handles TensorFlow.js tensor cleanup and memory management
 */

import { MEMORY, SAFARI_CONFIG } from '../config/constants.js';
import { browserDetector } from '../utils/browserDetection.js';

export class MemoryManager {
  constructor(tf) {
    this.tf = tf;
    this.tensorsToDispose = [];
    this.cleanupInterval = null;
  }

  /**
   * Start automatic memory cleanup
   */
  startAutoCleanup() {
    if (browserDetector.isSafari) {
      // Safari-specific memory management
      this.cleanupInterval = setInterval(() => {
        const memInfo = this.tf.memory();
        if (memInfo.numTensors > SAFARI_CONFIG.MEMORY_TENSOR_THRESHOLD) {
          this.tf.disposeVariables();
        }
      }, SAFARI_CONFIG.MEMORY_CLEANUP_INTERVAL_MS);
    }
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Check memory pressure level
   * @returns {number} 0 = low, 1 = medium, 2 = high
   */
  getMemoryPressure() {
    const memInfo = this.tf.memory();
    if (memInfo.numTensors > MEMORY.PRESSURE_THRESHOLD_HIGH) return 2;
    if (memInfo.numTensors > MEMORY.PRESSURE_THRESHOLD_LOW) return 1;
    return 0;
  }

  /**
   * Dispose accumulated tensors
   */
  disposeTensors() {
    this.tensorsToDispose.forEach(tensor => {
      if (tensor && !tensor.isDisposed) {
        tensor.dispose();
      }
    });
    this.tensorsToDispose = [];
  }

  /**
   * Force garbage collection if pressure is high
   */
  forceGC() {
    this.tf.disposeVariables();
    if (this.tf.engine) {
      this.tf.engine().startScope();
      this.tf.engine().endScope();
    }
  }

  /**
   * Get memory info
   * @returns {object}
   */
  getMemoryInfo() {
    return this.tf.memory();
  }

  /**
   * Cleanup before destroying
   */
  destroy() {
    this.stopAutoCleanup();
    this.disposeTensors();
  }
}

export default MemoryManager;
