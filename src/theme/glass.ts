/**
 * Glass tokens.
 *
 * A real frosted panel needs a backdrop blur, and blurring live board content every frame is
 * exactly the thing that drops this app to 30 fps on a mid-range phone. So the look is built
 * from four cheap layers instead, which is what a native glass surface looks like anyway once
 * you stop moving it:
 *
 *   1. a translucent fill that picks up the background gradient,
 *   2. a vertical sheen across the top third, where the light would fall,
 *   3. a 1 px border that is brighter at the top than at the bottom,
 *   4. a soft outer shadow so the panel sits above the board instead of on it.
 *
 * The result costs one LinearGradient and one View per panel, and holds 60 fps.
 */

export type GlassIntensity = 'low' | 'mid' | 'high';

export const GLASS = {
  radius: {sm: 14, md: 22, lg: 28, pill: 999},
  pad: {sm: 12, md: 18, lg: 24},
  border: 1,
} as const;

const FILL: Record<GlassIntensity, string> = {
  low: 'rgba(255,255,255,0.05)',
  mid: 'rgba(255,255,255,0.08)',
  high: 'rgba(255,255,255,0.12)',
};

const SHEEN: Record<GlassIntensity, string> = {
  low: 'rgba(255,255,255,0.10)',
  mid: 'rgba(255,255,255,0.16)',
  high: 'rgba(255,255,255,0.24)',
};

const EDGE_TOP: Record<GlassIntensity, string> = {
  low: 'rgba(255,255,255,0.12)',
  mid: 'rgba(255,255,255,0.20)',
  high: 'rgba(255,255,255,0.30)',
};

/** Gradient stops for a panel face, top to bottom. */
export const glassStops = (intensity: GlassIntensity = 'mid'): string[] => [
  SHEEN[intensity],
  FILL[intensity],
  FILL[intensity],
];

export const glassFill = (intensity: GlassIntensity = 'mid') => FILL[intensity];

export const glassEdge = (intensity: GlassIntensity = 'mid') => EDGE_TOP[intensity];

/** Soft elevation, tuned per platform (iOS reads shadow*, Android reads elevation). */
export const glassShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.45,
  shadowRadius: 18,
  shadowOffset: {width: 0, height: 10},
  elevation: 10,
} as const;
