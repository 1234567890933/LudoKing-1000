/**
 * Shared types for the offline bot stack.
 *
 * Everything here is pure data: no React, no Redux, no I/O. That keeps the whole bot layer
 * unit-testable, which is the only reason it is trustworthy at all.
 */

export type BotPersonality = 'cautious' | 'aggressive' | 'oracle';

export type BotProfile = {
  id: BotPersonality;
  /** Shown on the seat picker. */
  name: string;
  /** One line the lobby shows, so the player knows what they are facing. */
  blurb: string;
};

export const BOT_PROFILES: Record<BotPersonality, BotProfile> = {
  cautious: {
    id: 'cautious',
    name: 'Sentinel',
    blurb: 'Protects its pieces, punishes loose ones',
  },
  aggressive: {
    id: 'aggressive',
    name: 'Raider',
    blurb: 'Hunts captures, accepts risk',
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    blurb: 'Half-sighted dice foresight, best all-round',
  },
};

export const BOT_ORDER: BotPersonality[] = ['cautious', 'aggressive', 'oracle'];
