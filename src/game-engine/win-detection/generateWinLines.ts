/**
 * Generates all winning lines for an N×N board where `winLength` cells in a
 * row (horizontal, vertical, diagonal) are required to win.
 *
 * For a 3×3 board with winLength 3 this returns exactly the same 8 lines as
 * the old WIN_LINES constant. For a 4×4 board with winLength 4 it returns the
 * analogous 10 lines, and so on.
 *
 * Cells are addressed as flat indices: row * size + col.
 */
export function generateWinLines(size: number, winLength: number): readonly (readonly number[])[] {
  const lines: (readonly number[])[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      // Horizontal
      lines.push(Array.from({ length: winLength }, (_, k) => r * size + c + k));
    }
  }

  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winLength; r++) {
      // Vertical
      lines.push(Array.from({ length: winLength }, (_, k) => (r + k) * size + c));
    }
  }

  for (let r = 0; r <= size - winLength; r++) {
    for (let c = 0; c <= size - winLength; c++) {
      // Diagonal ↘
      lines.push(Array.from({ length: winLength }, (_, k) => (r + k) * size + (c + k)));
    }
  }

  for (let r = 0; r <= size - winLength; r++) {
    for (let c = winLength - 1; c < size; c++) {
      // Anti-diagonal ↙
      lines.push(Array.from({ length: winLength }, (_, k) => (r + k) * size + (c - k)));
    }
  }

  return lines;
}

/** Cached win-line lookup so we don't regenerate on every move. */
const _cache = new Map<string, readonly (readonly number[])[]>();
export function getWinLines(size: number, winLength: number): readonly (readonly number[])[] {
  const key = `${size}:${winLength}`;
  if (!_cache.has(key)) _cache.set(key, generateWinLines(size, winLength));
  return _cache.get(key)!;
}
