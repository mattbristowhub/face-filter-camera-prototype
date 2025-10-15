/**
 * Configuration constants for Face Filter Camera
 * All magic numbers and configuration values centralized here
 */

// Performance Configuration
export const PERFORMANCE = {
  HIGH: {
    maxFaces: 5,
    skipFrames: 1,
    shadowBlur: 10,
    particleCount: 8,
    animationSpeed: 1.0,
    cleanupInterval: 60,
    targetFPS: 30,
    detectionConfidence: 0.5
  },
  MEDIUM: {
    maxFaces: 3,
    skipFrames: 2,
    shadowBlur: 5,
    particleCount: 6,
    animationSpeed: 0.8,
    cleanupInterval: 40,
    targetFPS: 24,
    detectionConfidence: 0.6
  },
  LOW: {
    maxFaces: 1,
    skipFrames: 5,
    shadowBlur: 0,
    particleCount: 4,
    animationSpeed: 0.6,
    cleanupInterval: 20,
    targetFPS: 20,
    detectionConfidence: 0.7
  }
};

// Safari-specific Configuration
export const SAFARI_CONFIG = {
  MAX_FACES: {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  },
  DETECTION_CONFIDENCE: 0.8,
  MAX_CONTINUOUS_CHECKS: 2,
  SCORE_THRESHOLD: 0.75,
  IOU_THRESHOLD: 0.3,
  MAX_VIDEO_SIZE_IOS: 320,
  MAX_VIDEO_SIZE_DESKTOP: 480,
  MODEL_LOAD_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  MEMORY_CLEANUP_INTERVAL_MS: 10000,
  MEMORY_TENSOR_THRESHOLD: 100
};

// Camera Configuration
export const CAMERA_CONFIG = {
  SAFARI_TIMEOUT_MS: 15000,
  DEFAULT_TIMEOUT_MS: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 500,
  DEFAULT_CONSTRAINTS: {
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  },
  SAFARI_CONSTRAINTS: {
    video: {
      facingMode: 'user',
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 }
    }
  },
  IOS_CONSTRAINTS: {
    video: {
      facingMode: 'user',
      width: { ideal: 320, max: 640 },
      height: { ideal: 240, max: 480 }
    }
  }
};

// Memory Management
export const MEMORY = {
  PRESSURE_THRESHOLD_LOW: 25,
  PRESSURE_THRESHOLD_HIGH: 50,
  TENSOR_CLEANUP_INTERVAL: 60
};

// Animation Constants
export const ANIMATION = {
  BOUNCE_AMPLITUDE: 20,
  BOUNCE_SPEED: 3,
  TWINKLE_SPEED: 4,
  FLOAT_AMPLITUDE: 15,
  FLOAT_SPEED: 2,
  SCALE_SPEED: 3,
  PARTICLE_BURST_DISTANCE: 30,
  PARTICLE_BURST_AMPLITUDE: 20
};

// Face Morph Configuration
export const MORPH = {
  HIGH: {
    intensity: 1.0,
    eyeScaleFactor: 2.5,      // 150% larger eyes (extreme)
    mouthScaleFactor: 2.2,    // 120% larger mouth (extreme)
    faceSlimFactor: 0.85,     // 15% slimmer face
    jawReductionFactor: 0.9,  // 10% smaller jaw
    paddingMultiplier: 0.8,
    faceMultiplier: 1.2,
    heightMultiplier: 1.3
  },
  MEDIUM: {
    intensity: 0.9,
    eyeScaleFactor: 2.0,      // 100% larger eyes
    mouthScaleFactor: 1.8,    // 80% larger mouth
    faceSlimFactor: 0.88,     // 12% slimmer face
    jawReductionFactor: 0.92, // 8% smaller jaw
    paddingMultiplier: 0.6,
    faceMultiplier: 1.0,
    heightMultiplier: 1.1
  },
  LOW: {
    intensity: 0.8,
    eyeScaleFactor: 1.6,      // 60% larger eyes
    mouthScaleFactor: 1.4,    // 40% larger mouth
    faceSlimFactor: 0.9,      // 10% slimmer face
    jawReductionFactor: 0.95, // 5% smaller jaw
    paddingMultiplier: 0.4,
    faceMultiplier: 0.8,
    heightMultiplier: 0.9
  },
  EYE_REGION_MULTIPLIER: 1.2,
  EYE_EXTREME_MULTIPLIER: 1.3,
  MOUTH_REGION_MULTIPLIER: 0.9,
  MOUTH_EXTREME_MULTIPLIER: 1.4,
  FACE_WIDTH_INFLUENCE: 0.6,
  FACE_HEIGHT_INFLUENCE: 0.6,
  FACE_SLIM_INTENSITY: 0.8,
  MORPH_PERFORMANCE_WARNING_MS: 50
};

// MediaPipe Face Mesh Landmark Indices
export const LANDMARKS = {
  NOSE_TIP: 1,
  LEFT_EYE: 33,
  RIGHT_EYE: 263,
  FOREHEAD_CENTER: 9,
  LEFT_MOUTH: 61,
  RIGHT_MOUTH: 291,
  LEFT_CHEEK: 116,
  RIGHT_CHEEK: 345,
  LEFT_EYE_CENTER: 468,
  RIGHT_EYE_CENTER: 473,
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  LEFT_EYE_INNER: 133,
  LEFT_EYE_OUTER: 33,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  RIGHT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 263,
  FACE_LEFT: 172,
  FACE_RIGHT: 397,
  CHIN_TIP: 175,
  LEFT_JAW: 172,
  RIGHT_JAW: 397,
  JAW_CENTER: 175,
  MOUTH_LEFT_CORNER: 61,
  MOUTH_RIGHT_CORNER: 291,
  MOUTH_TOP_CENTER: 13,
  MOUTH_BOTTOM_CENTER: 17,
  UPPER_LIP_TOP: 12,
  LOWER_LIP_BOTTOM: 15
};

// Face Tracking
export const TRACKING = {
  MOVEMENT_THRESHOLD: 10,
  STABLE_FRAMES_THRESHOLD: 3,
  INTERPOLATION_FACTOR: 0.3,
  MAX_SKIP_INTERVAL: 5,
  MIN_SKIP_INTERVAL: 1
};

// Performance Detection
export const PERFORMANCE_DETECTION = {
  ITERATIONS_MOBILE: 50000,
  ITERATIONS_DESKTOP: 100000,
  HIGH_THRESHOLD_MOBILE: 15,
  HIGH_THRESHOLD_DESKTOP: 10,
  MEDIUM_THRESHOLD_MOBILE: 40,
  MEDIUM_THRESHOLD_DESKTOP: 30,
  CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  CACHE_KEY: 'faceFilterPerformance'
};

// Math Lookup Tables
export const MATH = {
  LOOKUP_SIZE: 360
};

// UI Constants
export const UI = {
  CAPTURE_FLASH_DURATION_MS: 300,
  THUMBNAIL_DISPLAY_DURATION_MS: 3000,
  MIN_TOUCH_TARGET_SIZE: 44,
  VIEWPORT_UPDATE_INTERVAL_MS: 100
};

// Filter Size Multipliers
export const FILTER_SIZES = {
  BALL_SIZE: 0.08,          // 8% of face width
  STAR_SIZE: 0.1,           // 10% of face width
  HEART_SIZE: 0.7,          // 70% of face width (for scaling)
  DOT_SIZE: 0.05,           // 5% of face width
  FISH_SIZE: 1.0,           // Base size 1.0
  PARTICLE_SIZE_BASE: 3,
  PARTICLE_SIZE_VARIANCE: 2
};

// Filter Orbit Speeds
export const ORBIT_SPEEDS = {
  DOT_SPEED_1: 1,
  DOT_SPEED_2: -1.5,
  DOT_SPEED_3: 0.7,
  FISH_SPEED_1: 0.5,
  FISH_SPEED_2: -0.3
};

// Filter Colors
export const COLORS = {
  BALL_LEFT: '#FF6B6B',     // Red-ish
  BALL_RIGHT: '#4ECDC4',    // Teal
  BALL_NOSE: '#FFE66D',     // Yellow
  STAR: '#FFD700',          // Gold
  HEART: '#FF69B4',         // Hot Pink
  DOT_1: '#FF6B6B',         // Red
  DOT_2: '#4ECDC4',         // Teal
  DOT_3: '#FFE66D',         // Yellow
  FISH_1: '#FFA500',        // Orange
  FISH_2: '#9370DB',        // Purple
  PARTICLE: '#FFD700'       // Gold
};

// Viewport Culling
export const CULLING = {
  MAX_FILTER_RADIUS_MULTIPLIER: 0.8,
  FISH_CULL_RADIUS_MULTIPLIER: 50,
  HEART_CULL_RADIUS_MULTIPLIER: 30,
  PARTICLE_MAX_DISTANCE: 50
};
