/**
 * Built-in Rule Presets A–D.
 *
 * Each preset is a plain object satisfying the RulePreset interface.
 * The engine imports these as data — zero coupling to any UI or framework.
 *
 * Preset B (Control Draw) requires a ControlBoardChooser to be injected
 * at game creation time. The default exported preset ships without one
 * so it can be serialized; the chooser is added in the game service layer.
 */

import type { RulePreset } from '@/types';

// ---------------------------------------------------------------------------
// Preset A: Classic Ultimate Rules
// ---------------------------------------------------------------------------

export const CLASSIC_ULTIMATE_PRESET: RulePreset = {
  id: 'classic-ultimate',
  displayName: 'Classic Ultimate',
  description:
    'Standard Super Tic Tac Toe. If sent to a resolved board, play anywhere.',
  wonBoardBehavior: { type: 'free-move' },
  drawnBoardBehavior: { type: 'free-move' },
  preventSendingToResolvedBoard: false,
  globalDrawResolution: 'draw',
};

// ---------------------------------------------------------------------------
// Preset B: Control Draw Rules
// ---------------------------------------------------------------------------

/**
 * The chooser is NOT set here — it must be injected by the game service
 * before the engine can process a board-redirect situation.
 *
 * Usage:
 *   const preset = withControlChooser(CONTROL_DRAW_PRESET, myChooser);
 */
export const CONTROL_DRAW_PRESET: RulePreset = {
  id: 'control-draw',
  displayName: 'Control Draw',
  description:
    'When sent to a drawn board, the player who redirected you chooses your next board. High strategy.',
  wonBoardBehavior: { type: 'free-move' },
  drawnBoardBehavior: { type: 'control-board' },
  preventSendingToResolvedBoard: false,
  globalDrawResolution: 'draw',
  // controlBoardChooser: injected at game creation
};

// ---------------------------------------------------------------------------
// Preset C: Portal Draw Rules
// ---------------------------------------------------------------------------

export const PORTAL_DRAW_PRESET: RulePreset = {
  id: 'portal-draw',
  displayName: 'Portal Draw',
  description:
    'When sent to a drawn board, you may "portal" to any valid open board.',
  wonBoardBehavior: { type: 'free-move' },
  drawnBoardBehavior: { type: 'portal-board' },
  preventSendingToResolvedBoard: false,
  globalDrawResolution: 'draw',
};

// ---------------------------------------------------------------------------
// Preset D: Custom (base template — overridden by user config)
// ---------------------------------------------------------------------------

export const CUSTOM_PRESET_TEMPLATE: RulePreset = {
  id: 'custom',
  displayName: 'Custom Rules',
  description: 'Configure your own ruleset.',
  wonBoardBehavior: { type: 'free-move' },
  drawnBoardBehavior: { type: 'free-move' },
  preventSendingToResolvedBoard: false,
  globalDrawResolution: 'draw',
};

// ---------------------------------------------------------------------------
// All built-in presets in display order
// ---------------------------------------------------------------------------

export const ALL_PRESETS: readonly RulePreset[] = [
  CLASSIC_ULTIMATE_PRESET,
  CONTROL_DRAW_PRESET,
  PORTAL_DRAW_PRESET,
  CUSTOM_PRESET_TEMPLATE,
] as const;

// ---------------------------------------------------------------------------
// Helper: inject a ControlBoardChooser into Preset B
// ---------------------------------------------------------------------------

import type { ControlBoardChooser } from '@/types';

export function withControlChooser(
  preset: RulePreset,
  chooser: ControlBoardChooser,
): RulePreset {
  return { ...preset, controlBoardChooser: chooser };
}
