import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  GLASS,
  GlassIntensity,
  glassEdge,
  glassShadow,
  glassStops,
} from '../theme/glass';

type Props = {
  children?: React.ReactNode;
  intensity?: GlassIntensity;
  /** Corner radius. Defaults to the medium token. */
  radius?: number;
  /** Optional accent line along the top edge, for the panel that matters most. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A frosted panel: sheen, fill, hairline edge and soft shadow, in that order.
 *
 * Kept deliberately dumb — it takes no state and renders no animation — so it can be dropped
 * anywhere without changing behaviour.
 */
const GlassPanel = ({
  children,
  intensity = 'mid',
  radius = GLASS.radius.md,
  accent,
  style,
  testID,
}: Props) => {
  return (
    <View
      testID={testID}
      style={[
        styles.wrap,
        {borderRadius: radius, borderColor: glassEdge(intensity)},
        glassShadow,
        style,
      ]}>
      <LinearGradient
        colors={glassStops(intensity)}
        start={{x: 0.5, y: 0}}
        end={{x: 0.5, y: 1}}
        style={[StyleSheet.absoluteFill, {borderRadius: radius}]}
        pointerEvents="none"
      />
      {accent ? (
        <View
          pointerEvents="none"
          style={[styles.accent, {backgroundColor: accent, borderRadius: radius}]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: GLASS.border,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    opacity: 0.9,
  },
  content: {
    padding: GLASS.pad.md,
  },
});

export default GlassPanel;
