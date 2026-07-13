import type { Theme } from '@/types/theme';

export const CLASSIC_THEME: Theme = {
  id: 'classic',
  displayName: 'Cozy Dark',
  description: 'Warm charcoal with coral and amber',
  colors: {
    background: { base: '#1a1208', surface: '#241a0e', overlay: '#2e2214' },
    playerX:    { primary: '#FF6B6B', secondary: '#FFBABA', glow: 'rgba(255,107,107,0.45)', background: 'rgba(255,107,107,0.09)' },
    playerO:    { primary: '#22D3EE', secondary: '#A5F3FC', glow: 'rgba(34,211,238,0.45)',   background: 'rgba(34,211,238,0.09)' },
    board:      { border: '#42301e', activeBorder: '#C084FC', wonBorder: '#4ADE80', drawnBorder: '#5a4030', cellHover: 'rgba(255,200,150,0.07)' },
    text:       { primary: '#FDF6EC', secondary: '#C4A882', muted: '#7A6048' },
    accent:     '#C084FC',
    success:    '#4ADE80',
    error:      '#F87171',
  },
  typography: { fontFamily: 'inherit', headingWeight: '700' },
  animation:   { boardEnter: 'default', cellPlace: 'pop', winReveal: 'spring', backgroundTransition: 700 },
};

export const NEON_THEME: Theme = {
  id: 'neon',
  displayName: 'Neon',
  description: 'Electric cyan and magenta on black',
  colors: {
    background: { base: '#000000', surface: '#080808', overlay: '#111111' },
    playerX:    { primary: '#00F5FF', secondary: '#80FAFF', glow: 'rgba(0,245,255,0.55)', background: 'rgba(0,245,255,0.08)' },
    playerO:    { primary: '#FF00FF', secondary: '#FF80FF', glow: 'rgba(255,0,255,0.55)',   background: 'rgba(255,0,255,0.08)' },
    board:      { border: '#1a3a2a', activeBorder: '#00FF88', wonBorder: '#00FF88', drawnBorder: '#224433', cellHover: 'rgba(0,255,136,0.06)' },
    text:       { primary: '#EEFFFF', secondary: '#77BBAA', muted: '#446655' },
    accent:     '#00FF88',
    success:    '#00FF88',
    error:      '#FF0055',
  },
  typography: { fontFamily: 'inherit', headingWeight: '900' },
  animation:   { boardEnter: 'default', cellPlace: 'pop', winReveal: 'spring', backgroundTransition: 500 },
};

export const CYBERPUNK_THEME: Theme = {
  id: 'cyberpunk',
  displayName: 'Cyberpunk',
  description: 'Yellow and violet in the digital sprawl',
  colors: {
    background: { base: '#06000f', surface: '#0e0020', overlay: '#18003a' },
    playerX:    { primary: '#FFE600', secondary: '#FFF080', glow: 'rgba(255,230,0,0.55)',   background: 'rgba(255,230,0,0.08)' },
    playerO:    { primary: '#CC00FF', secondary: '#EE88FF', glow: 'rgba(204,0,255,0.55)',    background: 'rgba(204,0,255,0.08)' },
    board:      { border: '#2a0060', activeBorder: '#00FFFF', wonBorder: '#FFE600', drawnBorder: '#440080', cellHover: 'rgba(255,230,0,0.05)' },
    text:       { primary: '#FFF5FF', secondary: '#AA88CC', muted: '#553377' },
    accent:     '#00FFFF',
    success:    '#00FF88',
    error:      '#FF0033',
  },
  typography: { fontFamily: 'inherit', headingWeight: '900' },
  animation:   { boardEnter: 'default', cellPlace: 'pop', winReveal: 'spring', backgroundTransition: 600 },
};

export const GALAXY_THEME: Theme = {
  id: 'galaxy',
  displayName: 'Galaxy',
  description: 'Deep space lavender and rose',
  colors: {
    background: { base: '#03001e', surface: '#0b0033', overlay: '#160050' },
    playerX:    { primary: '#A78BFA', secondary: '#DDD6FE', glow: 'rgba(167,139,250,0.5)',  background: 'rgba(167,139,250,0.09)' },
    playerO:    { primary: '#FB7185', secondary: '#FECDD3', glow: 'rgba(251,113,133,0.5)',   background: 'rgba(251,113,133,0.09)' },
    board:      { border: '#22006a', activeBorder: '#60A5FA', wonBorder: '#A78BFA', drawnBorder: '#330088', cellHover: 'rgba(167,139,250,0.06)' },
    text:       { primary: '#F5F3FF', secondary: '#9D8EB8', muted: '#4a3a6a' },
    accent:     '#60A5FA',
    success:    '#34D399',
    error:      '#F87171',
  },
  typography: { fontFamily: 'inherit', headingWeight: '900' },
  animation:   { boardEnter: 'default', cellPlace: 'pop', winReveal: 'spring', backgroundTransition: 800 },
};

export const MINIMAL_THEME: Theme = {
  id: 'minimal',
  displayName: 'Paper',
  description: 'Warm cream light theme — easy on the eyes',
  colors: {
    background: { base: '#FDF8F0', surface: '#F7EFE0', overlay: '#EEE0C8' },
    playerX:    { primary: '#E05252', secondary: '#F9A8A8', glow: 'rgba(224,82,82,0.25)',  background: 'rgba(224,82,82,0.07)' },
    playerO:    { primary: '#0891B2', secondary: '#67E8F9', glow: 'rgba(8,145,178,0.25)',   background: 'rgba(8,145,178,0.07)' },
    board:      { border: '#DBC9A8', activeBorder: '#9333EA', wonBorder: '#16A34A', drawnBorder: '#C4A882', cellHover: 'rgba(0,0,0,0.04)' },
    text:       { primary: '#2C1A0E', secondary: '#5C3D1E', muted: '#8C7355' },
    accent:     '#9333EA',
    success:    '#16A34A',
    error:      '#DC2626',
  },
  typography: { fontFamily: 'inherit', headingWeight: '700' },
  animation:   { boardEnter: 'default', cellPlace: 'pop', winReveal: 'spring', backgroundTransition: 400 },
};

export const RETRO_THEME: Theme = {
  id: 'retro',
  displayName: 'Retro Arcade',
  description: 'Green phosphor glow on black',
  colors: {
    background: { base: '#000000', surface: '#001100', overlay: '#002200' },
    playerX:    { primary: '#00FF00', secondary: '#88FF88', glow: 'rgba(0,255,0,0.55)',    background: 'rgba(0,255,0,0.07)' },
    playerO:    { primary: '#FFAA00', secondary: '#FFDD88', glow: 'rgba(255,170,0,0.55)',  background: 'rgba(255,170,0,0.07)' },
    board:      { border: '#003300', activeBorder: '#00FF88', wonBorder: '#00FF00', drawnBorder: '#005500', cellHover: 'rgba(0,255,0,0.05)' },
    text:       { primary: '#00FF00', secondary: '#00AA00', muted: '#005500' },
    accent:     '#00FF88',
    success:    '#00FF00',
    error:      '#FF3300',
  },
  typography: { fontFamily: '"Courier New", monospace', headingWeight: '700' },
  animation:   { boardEnter: 'default', cellPlace: 'pop', winReveal: 'spring', backgroundTransition: 300 },
};

export const ALL_THEMES: readonly Theme[] = [
  CLASSIC_THEME,
  NEON_THEME,
  CYBERPUNK_THEME,
  GALAXY_THEME,
  MINIMAL_THEME,
  RETRO_THEME,
];

export const DEFAULT_THEME_ID = 'classic';
