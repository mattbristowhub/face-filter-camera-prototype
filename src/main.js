/**
 * Main Application
 * Orchestrates all modules and manages the application lifecycle
 */

import { Camera } from './camera.js';
import { ModelLoader } from './model.js';
import { PerformanceManager } from './performance/performanceManager.js';
import { MemoryManager } from './performance/memoryManager.js';
import { FilterRenderer } from './filters/FilterRenderer.js';
import { UIControls } from './ui/controls.js';
import { PhotoCapture } from './ui/photoCapture.js';
import { browserDetector } from './utils/browserDetection.js';

export class FaceFilterApp {
  constructor(tf, faceLandmarksDetection) {
    this.tf = tf;
    this.faceLandmarksDetection = faceLandmarksDetection;

    // Core modules
    this.camera = new Camera();
    this.modelLoader = new ModelLoader(tf, faceLandmarksDetection);
    this.performanceManager = new PerformanceManager();
    this.memoryManager = new MemoryManager(tf);
    this.filterRenderer = new FilterRenderer();
    this.uiControls = new UIControls(this.filterRenderer);
    this.photoCapture = null;

    // Canvas and video elements
    this.video = null;
    this.overlay = null;
    this.ctx = null;

    // Animation loop
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.skipFrameCounter = 0;
    this.isRunning = false;
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      // Show loading
      this.uiControls.showLoading(true);
      this.uiControls.updateStatus('Initializing...');

      // Get DOM elements
      this.video = document.getElementById('video');
      this.overlay = document.getElementById('overlay');
      this.ctx = this.overlay.getContext('2d', {
        willReadFrequently: false,
        alpha: true
      });

      // Initialize performance detection
      await this.performanceManager.init();

      // Initialize camera
      this.uiControls.updateStatus('Accessing camera...');
      await this.camera.setup(this.video);

      // Setup canvas dimensions
      this.setupCanvas();

      // Load face detection model
      this.uiControls.updateStatus('Loading face detection model...');
      await this.modelLoader.load(this.performanceManager.performanceLevel);

      // Initialize UI
      this.uiControls.init();
      this.photoCapture = new PhotoCapture(this.video);
      this.photoCapture.init();

      // Start memory management
      this.memoryManager.startAutoCleanup();

      // Hide loading
      this.uiControls.showLoading(false);

      // Update status
      const stats = this.performanceManager.getStats();
      const modelInfo = this.modelLoader.getModelInfo();
      this.uiControls.updateStatus(
        `Ready! Performance: ${stats.performanceLevel}, ` +
        `Backend: ${modelInfo.backend}, Max faces: ${modelInfo.maxFaces}`
      );

      // Start animation loop
      this.start();
    } catch (error) {
      this.uiControls.showLoading(false);
      this.uiControls.updateStatus(`Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup canvas dimensions
   */
  setupCanvas() {
    const updateCanvasSize = () => {
      this.overlay.width = this.video.videoWidth;
      this.overlay.height = this.video.videoHeight;
    };

    updateCanvasSize();

    // Update on video resize
    this.video.addEventListener('resize', updateCanvasSize);
  }

  /**
   * Start animation loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Stop animation loop
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main animation loop
   */
  async animate() {
    if (!this.isRunning) return;

    try {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      // Update FPS and performance
      this.performanceManager.updateFPS(deltaTime);

      // Update animation time
      this.filterRenderer.updateAnimationTime(deltaTime);

      // Determine if we should skip this frame for detection
      const shouldSkip = this.performanceManager.shouldSkipFrame(this.skipFrameCounter);
      this.skipFrameCounter++;

      let faces = [];

      if (!shouldSkip) {
        // Perform face detection
        faces = await this.modelLoader.detectFaces(this.video);

        // Calculate face movement
        const movement = this.performanceManager.calculateFaceMovement(faces);

        // Cache faces for interpolation
        this.performanceManager.cachedFaces = faces;
      } else {
        // Use interpolated faces
        faces = this.performanceManager.interpolateFaces(
          this.performanceManager.cachedFaces || [],
          0.3
        );
      }

      // Clear canvas
      this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);

      // Render filters
      if (faces && faces.length > 0) {
        const qualitySettings = this.performanceManager.getQualitySettings();
        this.filterRenderer.render(this.ctx, faces, qualitySettings);
      }

      // Memory management (periodic cleanup)
      const stats = this.performanceManager.getStats();
      if (stats.frameCount % stats.cleanupInterval === 0) {
        this.performanceManager.manageTensorMemory(this.tf);
      }

      // Continue loop
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } catch (error) {
      // Continue despite errors
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Cleanup and destroy
   */
  async destroy() {
    this.stop();
    this.camera.stop();
    this.modelLoader.dispose();
    this.memoryManager.destroy();
  }

  /**
   * Get application stats
   * @returns {object}
   */
  getStats() {
    return {
      performance: this.performanceManager.getStats(),
      model: this.modelLoader.getModelInfo(),
      camera: this.camera.getDimensions(),
      memory: this.memoryManager.getMemoryInfo(),
      filter: this.filterRenderer.getCurrentFilter(),
      browser: browserDetector.getCompatibilityInfo()
    };
  }
}

export default FaceFilterApp;
