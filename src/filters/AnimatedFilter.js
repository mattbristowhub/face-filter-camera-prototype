/**
 * Animated Filter
 * Handles all animated filter types (balls, stars, hearts, dots, fish, particles)
 */

import { Filter } from './Filter.js';
import { ANIMATION, FILTER_SIZES, CULLING } from '../config/constants.js';
import { mathUtils } from '../utils/mathUtils.js';
import { getFacePoints, getFaceDimensions, isInViewport } from '../utils/viewportUtils.js';

export class AnimatedFilter extends Filter {
  constructor(config) {
    super(config);
  }

  /**
   * Draw animated filter
   */
  draw(ctx, face, animationTime, qualitySettings) {
    const points = getFacePoints(face);
    const { faceWidth, faceHeight, eyeCenter } = getFaceDimensions(points);

    ctx.save();

    this.parts.forEach((part, index) => {
      const { x, y } = this.getPartPosition(part, points, eyeCenter, faceWidth, faceHeight, index);
      const size = faceWidth * part.size;

      switch (part.type) {
        case 'bouncing_ball':
          this.drawBouncingBall(ctx, x, y, size, part.color, animationTime, qualitySettings);
          break;
        case 'twinkling_star':
          this.drawTwinklingStar(ctx, x, y, size, part.color, animationTime, qualitySettings);
          break;
        case 'floating_heart':
          this.drawFloatingHearts(ctx, eyeCenter, faceWidth, faceHeight, size, part.color, animationTime, index);
          break;
        case 'moving_dot':
          this.drawMovingDot(ctx, x, y, size, part.color, animationTime, part.speed, faceWidth, qualitySettings);
          break;
        case 'swimming_fish':
          this.drawSwimmingFish(ctx, x, y, part.size, part.color, animationTime, part.speed, faceWidth, qualitySettings);
          break;
        case 'particle_burst':
          this.drawParticleBurst(ctx, x, y, animationTime, part.color, part.count, qualitySettings);
          break;
      }
    });

    ctx.restore();
  }

  /**
   * Get position for filter part
   */
  getPartPosition(part, points, eyeCenter, faceWidth, faceHeight, index) {
    switch (part.position) {
      case 'left_eye':
        return { x: points.leftEye[0], y: points.leftEye[1] };
      case 'right_eye':
        return { x: points.rightEye[0], y: points.rightEye[1] };
      case 'nose':
        return { x: points.noseTip[0], y: points.noseTip[1] };
      case 'crown':
        return { x: eyeCenter[0], y: points.foreheadCenter[1] - faceHeight * 0.5 };
      case 'left_cheek':
        return { x: points.leftCheek[0], y: points.leftCheek[1] };
      case 'right_cheek':
        return { x: points.rightCheek[0], y: points.rightCheek[1] };
      case 'random_orbit':
      case 'horizontal_swim':
        return { x: eyeCenter[0], y: eyeCenter[1] + (index * 40 - 20) };
      default:
        return { x: eyeCenter[0], y: eyeCenter[1] };
    }
  }

  /**
   * Draw bouncing ball
   */
  drawBouncingBall(ctx, x, y, size, color, time, quality) {
    const bounce = Math.abs(mathUtils.fastSin(time * ANIMATION.BOUNCE_SPEED * quality.animationSpeed)) * ANIMATION.BOUNCE_AMPLITUDE;

    if (!isInViewport(x, y - bounce, size, ctx.canvas.width, ctx.canvas.height)) return;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = quality.shadowBlur;
    ctx.beginPath();
    ctx.arc(x, y - bounce, size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw twinkling star
   */
  drawTwinklingStar(ctx, x, y, size, color, time, quality) {
    const twinkle = 0.5 + 0.5 * mathUtils.fastSin(time * ANIMATION.TWINKLE_SPEED * quality.animationSpeed);
    const outerRadius = size * twinkle;
    const innerRadius = size * 0.5 * twinkle;

    if (!isInViewport(x, y, outerRadius, ctx.canvas.width, ctx.canvas.height)) return;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = quality.shadowBlur * twinkle;

    ctx.save();
    ctx.translate(x, y);

    const rotation = time * 0.5 * quality.animationSpeed;
    ctx.rotate(rotation);

    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / 5;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw floating hearts around face
   */
  drawFloatingHearts(ctx, eyeCenter, faceWidth, faceHeight, size, color, time, partIndex) {
    const heartPositions = [
      [eyeCenter[0] - faceWidth * 0.6, eyeCenter[1] - faceHeight * 0.3],
      [eyeCenter[0] + faceWidth * 0.6, eyeCenter[1] - faceHeight * 0.3],
      [eyeCenter[0] - faceWidth * 0.8, eyeCenter[1] + faceHeight * 0.2],
      [eyeCenter[0] + faceWidth * 0.8, eyeCenter[1] + faceHeight * 0.2],
      [eyeCenter[0], eyeCenter[1] - faceHeight * 0.8],
      [eyeCenter[0], eyeCenter[1] + faceHeight * 0.6]
    ];

    heartPositions.forEach((pos, i) => {
      const float = mathUtils.fastSin(time * ANIMATION.FLOAT_SPEED + i) * ANIMATION.FLOAT_AMPLITUDE;
      const scale = 0.8 + 0.2 * mathUtils.fastSin(time * ANIMATION.SCALE_SPEED + i);
      const heartSize = size * scale;
      const finalY = pos[1] + float;

      if (!isInViewport(pos[0], finalY, heartSize * 30, ctx.canvas.width, ctx.canvas.height)) return;

      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.translate(pos[0], finalY);
      ctx.scale(heartSize, heartSize);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-0.5, -0.5, -1, -0.2, -0.5, 0.2);
      ctx.bezierCurveTo(0, 0.8, 0, 0.8, 0, 0.8);
      ctx.bezierCurveTo(0, 0.8, 0, 0.8, 0.5, 0.2);
      ctx.bezierCurveTo(1, -0.2, 0.5, -0.5, 0, 0);
      ctx.fill();

      ctx.restore();
    });
  }

  /**
   * Draw moving dot (orbiting)
   */
  drawMovingDot(ctx, centerX, centerY, size, color, time, speed, faceWidth, quality) {
    const radius = faceWidth * 0.6;
    const angle = time * speed;
    const x = centerX + mathUtils.fastCos(angle) * radius;
    const y = centerY + mathUtils.fastSin(angle) * radius * 0.7;

    if (!isInViewport(x, y, size, ctx.canvas.width, ctx.canvas.height)) return;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = quality.shadowBlur;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draw swimming fish
   */
  drawSwimmingFish(ctx, baseX, baseY, baseSize, color, time, speed, faceWidth, quality) {
    const swimX = baseX + mathUtils.fastSin(time * speed) * faceWidth * 0.8;
    const swimY = baseY + mathUtils.fastCos(time * speed * 0.7) * 20;
    const fishSize = baseSize * (0.8 + 0.2 * mathUtils.fastSin(time * 2));

    if (!isInViewport(swimX, swimY, CULLING.FISH_CULL_RADIUS_MULTIPLIER * fishSize, ctx.canvas.width, ctx.canvas.height)) return;

    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = quality.shadowBlur;
    ctx.translate(swimX, swimY);
    ctx.scale(fishSize, fishSize);

    // Fish body
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fish tail
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(-40, -10);
    ctx.lineTo(-40, 10);
    ctx.closePath();
    ctx.fill();

    // Fish eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw particle burst
   */
  drawParticleBurst(ctx, x, y, time, color, count, quality) {
    const actualCount = Math.min(count, quality.particleCount);

    if (!isInViewport(x, y, CULLING.PARTICLE_MAX_DISTANCE, ctx.canvas.width, ctx.canvas.height)) return;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = quality.shadowBlur;

    for (let i = 0; i < actualCount; i++) {
      const angle = (i / actualCount) * Math.PI * 2;
      const distance = ANIMATION.PARTICLE_BURST_DISTANCE + mathUtils.fastSin(time * 3 * quality.animationSpeed) * ANIMATION.PARTICLE_BURST_AMPLITUDE;
      const px = x + mathUtils.fastCos(angle) * distance;
      const py = y + mathUtils.fastSin(angle) * distance;
      const sparkleSize = FILTER_SIZES.PARTICLE_SIZE_BASE + mathUtils.fastSin(time * 4 * quality.animationSpeed + i) * FILTER_SIZES.PARTICLE_SIZE_VARIANCE;

      if (isInViewport(px, py, sparkleSize, ctx.canvas.width, ctx.canvas.height)) {
        ctx.beginPath();
        ctx.arc(px, py, sparkleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export default AnimatedFilter;
