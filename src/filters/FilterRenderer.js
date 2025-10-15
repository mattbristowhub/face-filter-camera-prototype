/**
 * Filter Renderer
 * Manages and renders all filters
 */

import { AnimatedFilter } from './AnimatedFilter.js';
import { MorphFilter } from './MorphFilter.js';
import { filterDefinitions } from './filterDefinitions.js';
import { shouldCullAnimation } from '../utils/viewportUtils.js';

export class FilterRenderer {
  constructor() {
    this.filters = new Map();
    this.currentFilterName = 'none';
    this.animationTime = 0;
    this.initFilters();
  }

  /**
   * Initialize all filters
   */
  initFilters() {
    Object.entries(filterDefinitions).forEach(([name, config]) => {
      let filter;
      if (config.type === 'morph') {
        filter = new MorphFilter(config);
      } else {
        filter = new AnimatedFilter(config);
      }
      this.filters.set(name, filter);
    });
  }

  /**
   * Set current filter
   * @param {string} filterName
   */
  setFilter(filterName) {
    if (filterName === 'none' || this.filters.has(filterName)) {
      this.currentFilterName = filterName;
      return true;
    }
    return false;
  }

  /**
   * Get current filter name
   * @returns {string}
   */
  getCurrentFilter() {
    return this.currentFilterName;
  }

  /**
   * Update animation time
   * @param {number} deltaTime
   */
  updateAnimationTime(deltaTime) {
    this.animationTime += deltaTime / 1000; // Convert to seconds
  }

  /**
   * Render current filter on all faces
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array} faces
   * @param {object} qualitySettings
   */
  render(ctx, faces, qualitySettings) {
    if (this.currentFilterName === 'none' || !faces || faces.length === 0) {
      return;
    }

    const filter = this.filters.get(this.currentFilterName);
    if (!filter) return;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    faces.forEach(face => {
      // Cull off-screen faces
      if (shouldCullAnimation(face, canvasWidth, canvasHeight)) {
        return;
      }

      try {
        filter.draw(ctx, face, this.animationTime, {
          ...qualitySettings,
          performanceLevel: qualitySettings.performanceLevel || 'high'
        });
      } catch (error) {
        // Silently handle rendering errors
      }
    });
  }

  /**
   * Get list of available filters
   * @returns {Array<object>}
   */
  getAvailableFilters() {
    const filters = [{ name: 'none', displayName: 'No Filter', type: 'none' }];

    this.filters.forEach((filter, name) => {
      filters.push({
        name: name,
        displayName: filter.name,
        type: filter.type,
        description: filter.description
      });
    });

    return filters;
  }

  /**
   * Reset animation time
   */
  resetAnimationTime() {
    this.animationTime = 0;
  }
}

export default FilterRenderer;
