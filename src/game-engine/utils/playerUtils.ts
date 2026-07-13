import type { Player } from '@/types';

/** Returns the other player. */
export function opponent(player: Player): Player {
  return player === 'X' ? 'O' : 'X';
}

/** Returns the player who moves first. Always X by convention. */
export function firstPlayer(): Player {
  return 'X';
}
