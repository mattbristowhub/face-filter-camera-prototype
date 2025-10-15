/**
 * Morph Filter
 * Face morphing filter that enlarges eyes/mouth and slims face
 */

import { Filter } from './Filter.js';
import { MORPH, LANDMARKS } from '../../config/constants.js';
import { bilinearSample, getFacePoints, getFaceDimensions } from '../utils/viewportUtils.js';

export class MorphFilter extends Filter {
  constructor(config) {
    super(config);
    this.intensity = 1.0;
    this.eyeScaleFactor = 2.5;
    this.mouthScaleFactor = 2.2;
    this.faceSlimFactor = 0.85;
    this.jawReductionFactor = 0.9;

    // Canvas for morphing
    this.morphCanvas = null;
    this.morphCtx = null;
  }

  /**
   * Initialize morph canvas
   */
  initCanvas() {
    if (!this.morphCanvas) {
      this.morphCanvas = document.createElement('canvas');
      this.morphCtx = this.morphCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  /**
   * Draw morph filter
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} face
   * @param {number} animationTime
   * @param {object} qualitySettings
   */
  draw(ctx, face, animationTime, qualitySettings) {
    this.initCanvas();
    this.adjustForPerformance(qualitySettings.performanceLevel);

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Set morph canvas size
    if (this.morphCanvas.width !== canvasWidth || this.morphCanvas.height !== canvasHeight) {
      this.morphCanvas.width = canvasWidth;
      this.morphCanvas.height = canvasHeight;
    }

    // Get morphing landmarks
    const landmarks = this.getMorphingLandmarks(face);

    // Calculate face bounding box
    const points = getFacePoints(face);
    const { faceWidth, faceHeight, eyeCenter } = getFaceDimensions(points);

    // Calculate region to process
    const region = this.calculateProcessingRegion(
      eyeCenter,
      faceWidth,
      faceHeight,
      canvasWidth,
      canvasHeight,
      qualitySettings.performanceLevel
    );

    if (region.width <= 0 || region.height <= 0) return;

    try {
      const morphStartTime = performance.now();

      // Get source image data
      const videoImageData = ctx.getImageData(region.minX, region.minY, region.width, region.height);
      const sourceData = videoImageData.data;

      // Create output image data
      const outputImageData = this.morphCtx.createImageData(region.width, region.height);
      const outputData = outputImageData.data;

      // Process pixels with morphing transformation
      for (let y = 0; y < region.height; y++) {
        for (let x = 0; x < region.width; x++) {
          const outputIndex = (y * region.width + x) * 4;

          // Calculate world coordinates
          const worldX = region.minX + x;
          const worldY = region.minY + y;

          // Apply inverse morphing transformation
          const [sourceX, sourceY] = this.inverseTransformPoint(
            worldX,
            worldY,
            landmarks,
            canvasWidth,
            canvasHeight
          );

          // Convert back to relative coordinates
          const relativeSourceX = sourceX - region.minX;
          const relativeSourceY = sourceY - region.minY;

          // Bilinear interpolation
          const sample = bilinearSample(sourceData, relativeSourceX, relativeSourceY, region.width, region.height);

          outputData[outputIndex] = sample[0];
          outputData[outputIndex + 1] = sample[1];
          outputData[outputIndex + 2] = sample[2];
          outputData[outputIndex + 3] = sample[3];
        }
      }

      // Put morphed region back
      ctx.putImageData(outputImageData, region.minX, region.minY);
    } catch (error) {
      // Silently handle morphing errors
    }
  }

  /**
   * Adjust morph parameters based on performance level
   * @param {string} performanceLevel
   */
  adjustForPerformance(performanceLevel) {
    const config = MORPH[performanceLevel.toUpperCase()];
    if (config) {
      this.intensity = config.intensity;
      this.eyeScaleFactor = config.eyeScaleFactor;
      this.mouthScaleFactor = config.mouthScaleFactor;
      this.faceSlimFactor = config.faceSlimFactor;
      this.jawReductionFactor = config.jawReductionFactor;
    }
  }

  /**
   * Calculate processing region
   */
  calculateProcessingRegion(eyeCenter, faceWidth, faceHeight, canvasWidth, canvasHeight, performanceLevel) {
    const config = MORPH[performanceLevel.toUpperCase()];
    const padding = Math.max(faceWidth, faceHeight) * config.paddingMultiplier;

    const minX = Math.max(0, Math.floor(eyeCenter[0] - faceWidth * config.faceMultiplier - padding));
    const maxX = Math.min(canvasWidth, Math.ceil(eyeCenter[0] + faceWidth * config.faceMultiplier + padding));
    const minY = Math.max(0, Math.floor(eyeCenter[1] - faceHeight * config.heightMultiplier - padding));
    const maxY = Math.min(canvasHeight, Math.ceil(eyeCenter[1] + faceHeight * config.heightMultiplier + padding));

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Get morphing landmarks from face mesh
   */
  getMorphingLandmarks(face) {
    const mesh = face.scaledMesh;
    const landmarks = {
      leftEyeCenter: mesh[LANDMARKS.LEFT_EYE_CENTER] || mesh[LANDMARKS.LEFT_EYE],
      rightEyeCenter: mesh[LANDMARKS.RIGHT_EYE_CENTER] || mesh[LANDMARKS.RIGHT_EYE],
      leftEyeInner: mesh[LANDMARKS.LEFT_EYE_INNER],
      leftEyeOuter: mesh[LANDMARKS.LEFT_EYE_OUTER],
      faceLeft: mesh[LANDMARKS.FACE_LEFT],
      faceRight: mesh[LANDMARKS.FACE_RIGHT],
      chinTip: mesh[LANDMARKS.CHIN_TIP],
      foreheadCenter: mesh[LANDMARKS.FOREHEAD_CENTER],
      mouthLeftCorner: mesh[LANDMARKS.MOUTH_LEFT_CORNER],
      mouthRightCorner: mesh[LANDMARKS.MOUTH_RIGHT_CORNER],
      mouthTopCenter: mesh[LANDMARKS.MOUTH_TOP_CENTER],
      mouthBottomCenter: mesh[LANDMARKS.MOUTH_BOTTOM_CENTER],
      mouthCenter: null
    };

    // Calculate mouth center
    if (landmarks.mouthLeftCorner && landmarks.mouthRightCorner) {
      landmarks.mouthCenter = [
        (landmarks.mouthLeftCorner[0] + landmarks.mouthRightCorner[0]) / 2,
        (landmarks.mouthLeftCorner[1] + landmarks.mouthRightCorner[1]) / 2
      ];
    }

    return landmarks;
  }

  /**
   * Inverse transform point for morphing
   */
  inverseTransformPoint(x, y, landmarks, canvasWidth, canvasHeight) {
    let newX = x;
    let newY = y;

    // Reverse face slimming
    const faceCenter = (landmarks.faceLeft[0] + landmarks.faceRight[0]) / 2;
    const faceInfluence = this.calculateFaceSlimInfluence(x, y, landmarks);

    if (faceInfluence > 0) {
      const compressionFactor = 1 - (1 - this.faceSlimFactor) * faceInfluence * this.intensity;
      const expansionFactor = 1 / compressionFactor;
      newX = faceCenter + (newX - faceCenter) * expansionFactor;
    }

    // Reverse eye enlargement
    const leftEyeInfluence = this.calculateEyeInfluence(x, y, landmarks.leftEyeCenter, landmarks);
    const rightEyeInfluence = this.calculateEyeInfluence(x, y, landmarks.rightEyeCenter, landmarks);

    if (leftEyeInfluence > 0) {
      const scale = 1 + (this.eyeScaleFactor - 1) * leftEyeInfluence * this.intensity;
      const shrinkFactor = 1 / scale;
      const centerX = landmarks.leftEyeCenter[0];
      const centerY = landmarks.leftEyeCenter[1];
      newX = centerX + (newX - centerX) * shrinkFactor;
      newY = centerY + (newY - centerY) * shrinkFactor;
    }

    if (rightEyeInfluence > 0) {
      const scale = 1 + (this.eyeScaleFactor - 1) * rightEyeInfluence * this.intensity;
      const shrinkFactor = 1 / scale;
      const centerX = landmarks.rightEyeCenter[0];
      const centerY = landmarks.rightEyeCenter[1];
      newX = centerX + (newX - centerX) * shrinkFactor;
      newY = centerY + (newY - centerY) * shrinkFactor;
    }

    // Reverse mouth enlargement
    const mouthInfluence = this.calculateMouthInfluence(x, y, landmarks.mouthCenter, landmarks);

    if (mouthInfluence > 0) {
      const scale = 1 + (this.mouthScaleFactor - 1) * mouthInfluence * this.intensity;
      const shrinkFactor = 1 / scale;
      const centerX = landmarks.mouthCenter[0];
      const centerY = landmarks.mouthCenter[1];
      newX = centerX + (newX - centerX) * shrinkFactor;
      newY = centerY + (newY - centerY) * shrinkFactor;
    }

    return [newX, newY];
  }

  /**
   * Calculate eye influence at point
   */
  calculateEyeInfluence(x, y, eyeCenter, landmarks) {
    if (!eyeCenter) return 0;

    const distance = Math.sqrt(Math.pow(x - eyeCenter[0], 2) + Math.pow(y - eyeCenter[1], 2));

    const baseEyeRadius = Math.abs(landmarks.leftEyeOuter[0] - landmarks.leftEyeInner[0]) * MORPH.EYE_REGION_MULTIPLIER;
    const eyeRadius = baseEyeRadius * (this.eyeScaleFactor > 2.0 ? MORPH.EYE_EXTREME_MULTIPLIER : 1.0);

    if (distance > eyeRadius) return 0;

    const normalizedDistance = distance / eyeRadius;
    const falloff =
      this.eyeScaleFactor > 2.0
        ? Math.pow(Math.cos(normalizedDistance * Math.PI / 2), 0.7)
        : Math.cos(normalizedDistance * Math.PI / 2);

    return falloff;
  }

  /**
   * Calculate face slim influence at point
   */
  calculateFaceSlimInfluence(x, y, landmarks) {
    const faceWidth = Math.abs(landmarks.faceRight[0] - landmarks.faceLeft[0]);
    const faceHeight = Math.abs(landmarks.foreheadCenter[1] - landmarks.chinTip[1]);
    const faceCenter = (landmarks.faceLeft[0] + landmarks.faceRight[0]) / 2;
    const faceCenterY = (landmarks.foreheadCenter[1] + landmarks.chinTip[1]) / 2;

    const distanceFromCenterX = Math.abs(x - faceCenter);
    const distanceFromCenterY = Math.abs(y - faceCenterY);

    if (
      distanceFromCenterX > faceWidth * MORPH.FACE_WIDTH_INFLUENCE ||
      distanceFromCenterY > faceHeight * MORPH.FACE_HEIGHT_INFLUENCE
    ) {
      return 0;
    }

    const horizontalInfluence = Math.max(0, 1 - distanceFromCenterX / (faceWidth * 0.3));
    const verticalInfluence = Math.max(0, 1 - distanceFromCenterY / (faceHeight * 0.6));

    return horizontalInfluence * verticalInfluence * MORPH.FACE_SLIM_INTENSITY;
  }

  /**
   * Calculate mouth influence at point
   */
  calculateMouthInfluence(x, y, mouthCenter, landmarks) {
    if (!mouthCenter || !landmarks.mouthLeftCorner || !landmarks.mouthRightCorner) return 0;

    const distance = Math.sqrt(Math.pow(x - mouthCenter[0], 2) + Math.pow(y - mouthCenter[1], 2));

    const mouthWidth = Math.abs(landmarks.mouthRightCorner[0] - landmarks.mouthLeftCorner[0]);
    const mouthHeight =
      landmarks.mouthBottomCenter && landmarks.mouthTopCenter
        ? Math.abs(landmarks.mouthBottomCenter[1] - landmarks.mouthTopCenter[1])
        : mouthWidth * 0.3;

    const scaleMultiplier = this.mouthScaleFactor > 1.8 ? MORPH.MOUTH_EXTREME_MULTIPLIER : 1.0;
    const mouthRadiusX = mouthWidth * MORPH.MOUTH_REGION_MULTIPLIER * scaleMultiplier;
    const mouthRadiusY = Math.max(mouthHeight * 1.5, mouthWidth * 0.5) * scaleMultiplier;

    const normalizedX = (x - mouthCenter[0]) / mouthRadiusX;
    const normalizedY = (y - mouthCenter[1]) / mouthRadiusY;
    const ellipticalDistance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);

    if (ellipticalDistance > 1.0) return 0;

    const falloff =
      this.mouthScaleFactor > 1.8
        ? Math.pow(Math.cos(ellipticalDistance * Math.PI / 2), 0.6)
        : Math.cos(ellipticalDistance * Math.PI / 2);

    return falloff;
  }
}

export default MorphFilter;
