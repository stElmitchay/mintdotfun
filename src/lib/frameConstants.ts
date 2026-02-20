// Frame dimensions (matching rauno.me)
export const FRAME_WIDTH = 1200;
export const FRAME_HEIGHT = 720;
export const FRAME_GAP = 40;

// Minimap
export const LINE_WIDTH = 1;
export const LINE_GAP = 9;
export const STEP_SIZE = 6.4;
export const MINIMAP_TOTAL_WIDTH = 160;

// Scale limits
export const MIN_SCALE = 0.6;

// Parallax offsets per slide frame [Marketplace only]
// (QuoteFrame and ContactFrame are "default" variant — no parallax)
export const PARALLAX_OFFSETS = [330, 0, 0];

// Frame count (main + 3 content frames)
export const FRAME_COUNT = 4;
export const TOTAL_WIDTH =
  FRAME_WIDTH * FRAME_COUNT + (FRAME_COUNT - 1) * FRAME_GAP;
