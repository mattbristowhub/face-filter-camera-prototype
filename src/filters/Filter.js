/**
 * Base Filter Class
 * Abstract base class for all filter implementations
 */

export class Filter {
  constructor(config) {
    this.type = config.type;
    this.name = config.name;
    this.parts = config.parts || [];
    this.description = config.description || '';
  }

  /**
   * Draw the filter on canvas
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} face - Face detection result
   * @param {number} animationTime - Current animation time
   * @param {object} qualitySettings - Performance quality settings
   */
  draw(ctx, face, animationTime, qualitySettings) {
    throw new Error('draw() must be implemented by subclass');
  }

  /**
   * Check if filter should be culled (off-screen)
   * @param {object} face
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @returns {boolean}
   */
  shouldCull(face, canvasWidth, canvasHeight) {
    return false; // Override in subclass if needed
  }

  /**
   * Get filter configuration
   * @returns {object}
   */
  getConfig() {
    return {
      type: this.type,
      name: this.name,
      description: this.description
    };
  }
}

export default Filter;
