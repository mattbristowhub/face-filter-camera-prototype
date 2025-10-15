/**
 * Filter Definitions
 * Configuration for all available filters
 */

import { COLORS, ORBIT_SPEEDS } from '../config/constants.js';

export const filterDefinitions = {
  bouncing_balls: {
    type: 'animated',
    name: 'Bouncing Balls',
    parts: [
      { type: 'bouncing_ball', position: 'left_eye', color: COLORS.BALL_LEFT, size: 0.08 },
      { type: 'bouncing_ball', position: 'right_eye', color: COLORS.BALL_RIGHT, size: 0.08 },
      { type: 'bouncing_ball', position: 'nose', color: COLORS.BALL_NOSE, size: 0.08 }
    ]
  },

  twinkling_stars: {
    type: 'animated',
    name: 'Twinkling Stars',
    parts: [
      { type: 'twinkling_star', position: 'crown', color: COLORS.STAR, size: 0.1 },
      { type: 'twinkling_star', position: 'left_cheek', color: COLORS.STAR, size: 0.1 },
      { type: 'twinkling_star', position: 'right_cheek', color: COLORS.STAR, size: 0.1 }
    ]
  },

  floating_hearts: {
    type: 'animated',
    name: 'Floating Hearts',
    parts: [
      { type: 'floating_heart', position: 'around_face', color: COLORS.HEART, size: 0.7, count: 6 }
    ]
  },

  pet_dots: {
    type: 'animated',
    name: 'Moving Dots (Pet)',
    parts: [
      {
        type: 'moving_dot',
        position: 'random_orbit',
        color: COLORS.DOT_1,
        size: 0.05,
        speed: ORBIT_SPEEDS.DOT_SPEED_1
      },
      {
        type: 'moving_dot',
        position: 'random_orbit',
        color: COLORS.DOT_2,
        size: 0.05,
        speed: ORBIT_SPEEDS.DOT_SPEED_2
      },
      {
        type: 'moving_dot',
        position: 'random_orbit',
        color: COLORS.DOT_3,
        size: 0.05,
        speed: ORBIT_SPEEDS.DOT_SPEED_3
      }
    ]
  },

  prey_fish: {
    type: 'animated',
    name: 'Swimming Fish (Pet)',
    parts: [
      {
        type: 'swimming_fish',
        position: 'horizontal_swim',
        color: COLORS.FISH_1,
        size: 1.0,
        speed: ORBIT_SPEEDS.FISH_SPEED_1
      },
      {
        type: 'swimming_fish',
        position: 'horizontal_swim',
        color: COLORS.FISH_2,
        size: 1.0,
        speed: ORBIT_SPEEDS.FISH_SPEED_2
      }
    ]
  },

  sparkle_burst: {
    type: 'particle',
    name: 'Sparkle Burst',
    parts: [
      {
        type: 'particle_burst',
        position: 'nose',
        particleType: 'sparkle',
        color: COLORS.PARTICLE,
        count: 8
      }
    ]
  },

  face_morph: {
    type: 'morph',
    name: 'Extreme Morph',
    description: 'Massive eyes + huge mouth + slim face cartoon filter'
  }
};

export default filterDefinitions;
