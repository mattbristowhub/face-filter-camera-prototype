/**
 * Model Loader
 * Handles TensorFlow.js and MediaPipe Face Mesh model loading
 */

import { SAFARI_CONFIG, PERFORMANCE } from './config/constants.js';
import { browserDetector } from './utils/browserDetection.js';

export class ModelLoader {
  constructor(tf, faceLandmarksDetection) {
    this.tf = tf;
    this.faceLandmarksDetection = faceLandmarksDetection;
    this.model = null;
    this.backend = null;
  }

  /**
   * Load face detection model
   * @param {string} performanceLevel - high, medium, or low
   * @returns {Promise<object>}
   */
  async load(performanceLevel) {
    try {
      // Setup TensorFlow backend
      await this.setupBackend();

      // Wait for backend to be ready
      await this.tf.ready();

      // Determine max faces based on platform and performance
      const maxFaces = this.getMaxFaces(performanceLevel);

      // Build model configuration
      const modelConfig = this.buildModelConfig(maxFaces, performanceLevel);

      // Load model with retry logic
      this.model = await this.loadModelWithRetry(modelConfig);

      return this.model;
    } catch (error) {
      this.handleLoadError(error);
      throw error;
    }
  }

  /**
   * Setup TensorFlow backend with Safari handling
   * @returns {Promise<void>}
   */
  async setupBackend() {
    if (browserDetector.isSafari) {
      try {
        // Try WebGL with Safari checks
        const webglSupported =
          this.tf.ENV.getBool('WEBGL_RENDER_FLOAT32_CAPABLE') &&
          this.tf.ENV.getBool('WEBGL_VERSION') >= 1;

        if (webglSupported) {
          await this.tf.setBackend('webgl');
          this.backend = 'webgl';
        } else {
          throw new Error('WebGL not fully supported in Safari');
        }
      } catch (e) {
        await this.tf.setBackend('cpu');
        this.backend = 'cpu';
      }
    } else {
      // Non-Safari browsers
      try {
        await this.tf.setBackend('webgl');
        this.backend = 'webgl';
      } catch (e) {
        await this.tf.setBackend('cpu');
        this.backend = 'cpu';
      }
    }
  }

  /**
   * Get max faces based on platform and performance
   * @param {string} performanceLevel
   * @returns {number}
   */
  getMaxFaces(performanceLevel) {
    if (browserDetector.isSafari) {
      return SAFARI_CONFIG.MAX_FACES[performanceLevel.toUpperCase()] || 1;
    }

    const perfConfig = PERFORMANCE[performanceLevel.toUpperCase()];
    return perfConfig?.maxFaces || 3;
  }

  /**
   * Build model configuration
   * @param {number} maxFaces
   * @param {string} performanceLevel
   * @returns {object}
   */
  buildModelConfig(maxFaces, performanceLevel) {
    const config = {
      maxFaces: maxFaces,
      refineLandmarks: false,
      detectionConfidence: browserDetector.isSafari
        ? SAFARI_CONFIG.DETECTION_CONFIDENCE
        : PERFORMANCE[performanceLevel.toUpperCase()].detectionConfidence,
      maxContinuousChecks: browserDetector.isSafari
        ? SAFARI_CONFIG.MAX_CONTINUOUS_CHECKS
        : 5,
      detectorModelUrl: undefined,
      landmarkModelUrl: undefined
    };

    // Safari-specific optimizations
    if (browserDetector.isSafari) {
      config.scoreThreshold = SAFARI_CONFIG.SCORE_THRESHOLD;
      config.iouThreshold = SAFARI_CONFIG.IOU_THRESHOLD;

      if (browserDetector.isIOS) {
        config.maxVideoSize = SAFARI_CONFIG.MAX_VIDEO_SIZE_IOS;
      } else {
        config.maxVideoSize = SAFARI_CONFIG.MAX_VIDEO_SIZE_DESKTOP;
      }
    }

    return config;
  }

  /**
   * Load model with retry logic
   * @param {object} modelConfig
   * @returns {Promise<object>}
   */
  async loadModelWithRetry(modelConfig) {
    const maxAttempts = browserDetector.isSafari ? SAFARI_CONFIG.MODEL_LOAD_ATTEMPTS : 1;
    let model = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Progressive degradation for Safari
        if (browserDetector.isSafari && attempt > 1) {
          modelConfig.maxFaces = Math.max(1, Math.floor(modelConfig.maxFaces / 2));
          modelConfig.detectionConfidence = Math.min(0.9, modelConfig.detectionConfidence + 0.1);
        }

        model = await this.faceLandmarksDetection.load(
          this.faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
          modelConfig
        );

        if (model) {
          break;
        }
      } catch (error) {

        if (attempt >= maxAttempts) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, SAFARI_CONFIG.RETRY_DELAY_MS));
      }
    }

    if (!model) {
      throw new Error('Failed to load model after multiple attempts');
    }

    return model;
  }

  /**
   * Handle load error with user-friendly messages
   * @param {Error} error
   */
  handleLoadError(error) {
    if (browserDetector.isSafari && error.message.includes('backend')) {
      throw new Error('Safari compatibility issue. Try enabling WebGL or use Chrome.');
    } else {
      throw new Error('Error loading face detection model. Please refresh the page.');
    }
  }

  /**
   * Detect faces in video frame
   * @param {HTMLVideoElement} video
   * @returns {Promise<Array>}
   */
  async detectFaces(video) {
    if (!this.model || !video.videoWidth) {
      return [];
    }

    try {
      // Safari-specific detection with retry
      if (browserDetector.isSafari) {
        return await this.detectFacesSafari(video);
      }

      return await this.model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: false
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Detect faces on Safari with retry logic
   * @param {HTMLVideoElement} video
   * @returns {Promise<Array>}
   */
  async detectFacesSafari(video) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const faces = await this.model.estimateFaces({
          input: video,
          returnTensors: false,
          flipHorizontal: false,
          predictIrises: false
        });

        // Validate face mesh integrity
        if (faces && faces.length > 0) {
          const validFaces = faces.filter(
            face => face.scaledMesh && face.scaledMesh.length >= 468
          );

          if (validFaces.length > 0) {
            return validFaces;
          }
        }

        // If no valid faces and not last attempt, retry
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        if (attempt >= maxAttempts) {
          return [];
        }
      }
    }

    return [];
  }

  /**
   * Get model info
   * @returns {object}
   */
  getModelInfo() {
    return {
      backend: this.backend,
      loaded: this.model !== null,
      maxFaces: this.model?.maxFaces
    };
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.model) {
      // MediaPipe models don't have a dispose method, but we can null the reference
      this.model = null;
    }
  }
}

export default ModelLoader;
