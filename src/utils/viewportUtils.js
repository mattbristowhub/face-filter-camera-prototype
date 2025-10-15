/**
 * Viewport and Culling Utilities
 * Functions for viewport checks and animation culling
 */

import { CULLING } from '../../config/constants.js';

/**
 * Check if a point with radius is within viewport
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {boolean}
 */
export function isInViewport(x, y, radius, canvasWidth, canvasHeight) {
  return x + radius >= 0 && x - radius <= canvasWidth &&
         y + radius >= 0 && y - radius <= canvasHeight;
}

/**
 * Check if face animation should be culled (off-screen)
 * @param {object} face - Face detection object
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {boolean}
 */
export function shouldCullAnimation(face, canvasWidth, canvasHeight) {
  const points = getFacePoints(face);
  const { faceWidth } = getFaceDimensions(points);
  const maxRadius = faceWidth * CULLING.MAX_FILTER_RADIUS_MULTIPLIER;

  return !isInViewport(points.noseTip[0], points.noseTip[1], maxRadius, canvasWidth, canvasHeight);
}

/**
 * Get key facial landmark points
 * @param {object} face
 * @returns {object}
 */
export function getFacePoints(face) {
  const { LANDMARKS } = require('../../config/constants.js');
  const mesh = face.scaledMesh;

  return {
    noseTip: mesh[LANDMARKS.NOSE_TIP],
    leftEye: mesh[LANDMARKS.LEFT_EYE],
    rightEye: mesh[LANDMARKS.RIGHT_EYE],
    foreheadCenter: mesh[LANDMARKS.FOREHEAD_CENTER],
    leftMouth: mesh[LANDMARKS.LEFT_MOUTH],
    rightMouth: mesh[LANDMARKS.RIGHT_MOUTH],
    leftCheek: mesh[LANDMARKS.LEFT_CHEEK],
    rightCheek: mesh[LANDMARKS.RIGHT_CHEEK]
  };
}

/**
 * Get face dimensions and eye center
 * @param {object} points - Face points from getFacePoints
 * @returns {object}
 */
export function getFaceDimensions(points) {
  const faceWidth = Math.abs(points.rightEye[0] - points.leftEye[0]);
  const faceHeight = Math.abs(points.foreheadCenter[1] - points.noseTip[1]);
  const eyeCenter = [
    (points.leftEye[0] + points.rightEye[0]) / 2,
    (points.leftEye[1] + points.rightEye[1]) / 2
  ];

  return { faceWidth, faceHeight, eyeCenter };
}

/**
 * Bilinear interpolation for smooth pixel sampling
 * @param {Uint8ClampedArray} imageData
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @returns {Array<number>} [R, G, B, A]
 */
export function bilinearSample(imageData, x, y, width, height) {
  // Clamp coordinates
  x = Math.max(0, Math.min(width - 1, x));
  y = Math.max(0, Math.min(height - 1, y));

  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const x2 = Math.min(x1 + 1, width - 1);
  const y2 = Math.min(y1 + 1, height - 1);

  const fx = x - x1;
  const fy = y - y1;

  const getPixel = (px, py) => {
    const index = (py * width + px) * 4;
    return [
      imageData[index] || 0,
      imageData[index + 1] || 0,
      imageData[index + 2] || 0,
      imageData[index + 3] || 255
    ];
  };

  const p1 = getPixel(x1, y1);
  const p2 = getPixel(x2, y1);
  const p3 = getPixel(x1, y2);
  const p4 = getPixel(x2, y2);

  const result = [];
  for (let i = 0; i < 4; i++) {
    const top = p1[i] * (1 - fx) + p2[i] * fx;
    const bottom = p3[i] * (1 - fx) + p4[i] * fx;
    result[i] = Math.round(top * (1 - fy) + bottom * fy);
  }

  return result;
}
