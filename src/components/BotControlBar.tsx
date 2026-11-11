import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import GlassPanel from './GlassPanel';
import AnimatedPressable from './AnimatedPressable';
import {PALETTE} from '../theme/palette';
import {MAX_BOTS_PER_MATCH} from '../engine/bot';

type Props = {
  /** Seat the controls act on, 1-based. */
  seat: number;
  /** True while the bot is playing this seat. */
  takeover: boolean;
  onToggleTakeover: () => void;
  /** Bots already seated in this match, for the cap hint. */
  botsInMatch: number;
};

/**
 * The control that does not exist in Ludo King: hand your seat to the bot mid-match.
 *
 * Two rules are surfaced in the UI rather than hidden in logic:
 *  * the two-bot cap, so a table never becomes bots playing each other;
 *  * that the takeover also switches the seat to assisted dice, which is why the label says so
 *    instead of quietly making the player luckier.
 */
const BotControlBar = ({
  seat,
  takeover,
  onToggleTakeover,
  botsInMatch,
}: Props) => {
  const atCap = botsInMatch >= MAX_BOTS_PER_MATCH && !takeover;

  return (
    <GlassPanel intensity="low" radius={18} style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.title}>
            {takeover ? 'Bot is playing your seat' : 'Step away?'}
          </Text>
          <Text style={styles.sub}>
            {atCap
              ? `Limit reached — ${MAX_BOTS_PER_MATCH} bots per match`
              : takeover
              ? 'Tap to take back control'
              : `Hand seat ${seat} to the bot (assisted dice)`}
          </Text>
        </View>
        <AnimatedPressable
          onPress={onToggleTakeover}
          disabled={atCap}
          testID="bot-takeover-toggle">
          <View style={[styles.pill, takeover && styles.pillOn]}>
            <Text style={[styles.pillText, takeover && styles.pillTextOn]}>
              {takeover ? 'STOP' : 'BOT'}
            </Text>
          </View>
        </AnimatedPressable>
      </View>
    </GlassPanel>
  );
};

const styles = StyleSheet.create({
  wrap: {marginHorizontal: 12, marginBottom: 6},
  row: {flexDirection: 'row', alignItems: 'center'},
  copy: {flex: 1, paddingRight: 10},
  title: {color: PALETTE.text, fontSize: 13, fontWeight: '700'},
  sub: {color: PALETTE.textDim, fontSize: 11, marginTop: 2},
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillOn: {
    borderColor: PALETTE.cyan,
    backgroundColor: 'rgba(99,230,242,0.22)',
  },
  pillText: {color: PALETTE.text, fontSize: 12, fontWeight: '800', letterSpacing: 1},
  pillTextOn: {color: PALETTE.cyan},
});

export default BotControlBar;
