/**
 * Theme system types.
 *
 * Themes are plain data objects — no CSS-in-JS, no runtime evaluation.
 * The UI maps these tokens to Tailwind classes or inline style values.
 * This ensures themes work identically on web and React Native.
 */

export interface ColorToken {
  readonly DEFAULT: string;  // hex or hsl
  readonly light: string;
  readonly dark: string;
}

export interface PlayerColors {
  readonly primary: string;
  readonly secondary: string;
  readonly glow: string;
  readonly background: string; // board background tint during this player's turn
}

export interface Theme {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;

  readonly colors: {
    readonly background: {
      readonly base: string;
      readonly surface: string;
      readonly overlay: string;
    };
    readonly playerX: PlayerColors;
    readonly playerO: PlayerColors;
    readonly board: {
      readonly border: string;
      readonly activeBorder: string;
      readonly wonBorder: string;
      readonly drawnBorder: string;
      readonly cellHover: string;
    };
    readonly text: {
      readonly primary: string;
      readonly secondary: string;
      readonly muted: string;
    };
    readonly accent: string;
    readonly success: string;
    readonly error: string;
  };

  readonly typography: {
    readonly fontFamily: string;
    readonly headingWeight: string;
  };

  readonly animation: {
    readonly boardEnter: string;   // Framer Motion variant key
    readonly cellPlace: string;
    readonly winReveal: string;
    readonly backgroundTransition: number; // ms
  };
}
