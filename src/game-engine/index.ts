/**
 * Game engine public API.
 *
 * Consumers import from '@/game-engine' — never from internal subpaths.
 * This barrel is the single stable boundary between the engine and the rest
 * of the application.
 */

export { classicEngine } from './ClassicEngine';
export { superEngine } from './SuperEngine';

export * from './models';
export * from './rules';
export * from './validators';
export * from './win-detection';
export * from './utils';
