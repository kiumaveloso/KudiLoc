// ---------------------------------------------------------------------------
// KudiLoc design tokens — green palette matching the reference design
// ---------------------------------------------------------------------------

export const Colors = {
  // Brand greens
  primary: '#10B981',           // emerald green — has-cash pins, active elements
  primaryDark: '#065F46',       // dark emerald — profile card, dark headers
  primaryMedium: '#059669',     // onboarding / login background
  primaryLight: '#D1FAE5',      // light green tint

  // Status
  cashGreen: '#10B981',         // has cash
  noCashGold: '#EF4444',        // no cash (red)
  offlineGrey: '#9CA3AF',       // offline / unknown

  // Neutrals
  white: '#FFFFFF',
  background: '#F5F5F0',        // very light warm white — app bg
  card: '#FFFFFF',
  border: '#E8E8E0',
  borderLight: '#F0F0E8',

  // Text
  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9B9B9B',
  textInverse: '#FFFFFF',

  // Legacy aliases kept for compatibility
  green: '#2E6B3E',
  greenLight: '#C8DFD0',
  red: '#D4483A',
  redLight: '#FCE8E8',
  amber: '#C9963A',
  amberLight: '#FCF0DC',
  shadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

/** Returns the marker colour for an ATM based on status and cash. */
export function atmMarkerColor(operationalStatus?: string, hasCash?: boolean): string {
  const s = operationalStatus?.toLowerCase();
  if (s === 'offline') return Colors.offlineGrey;
  if (s === 'maintenance') return Colors.noCashGold;
  if (hasCash === false) return Colors.noCashGold;
  if (hasCash === true) return Colors.cashGreen;
  return Colors.offlineGrey;
}

// ---------------------------------------------------------------------------
// Gamification levels
// ---------------------------------------------------------------------------

export type GamificationLevel =
  | 'Explorador'
  | 'Repórter'
  | 'Kamba Activo'
  | 'Guardião do Bairro'
  | 'Comandante KudiLoc';

export interface LevelInfo {
  name: GamificationLevel;
  minPoints: number;
  nextLevelPoints: number;
  color: string;
  icon: string; // Ionicons name
}

export const LEVELS: LevelInfo[] = [
  { name: 'Explorador',          minPoints: 0,    nextLevelPoints: 100,  color: '#7AAE8A', icon: 'compass-outline' },
  { name: 'Repórter',            minPoints: 100,  nextLevelPoints: 500,  color: '#2E6B3E', icon: 'camera-outline' },
  { name: 'Kamba Activo',        minPoints: 500,  nextLevelPoints: 1000, color: '#C9963A', icon: 'location-outline' },
  { name: 'Guardião do Bairro',  minPoints: 1000, nextLevelPoints: 2000, color: '#0F2D18', icon: 'shield-outline' },
  { name: 'Comandante KudiLoc',  minPoints: 2000, nextLevelPoints: 9999, color: '#1A1A1A', icon: 'star-outline' },
];

export function getLevelInfo(points: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) return LEVELS[i];
  }
  return LEVELS[0];
}
