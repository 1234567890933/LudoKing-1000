import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

export type Burst = {
  /** Bumped for every capture, so two captures in a row both animate. */
  seq: number;
  /** Board coordinates of the captured token. */
  from: {x: number; y: number};
  /** Board coordinates of the owner's pocket, where the token is locked again. */
  to: {x: number; y: number};
  color: string;
  size?: number;
};

type Props = {
  burst: Burst | null;
};

/**
 * The captured token's death: it flares, spins, shrinks and flies home to its pocket.
 *
 * This is the animation that tells a player what just happened without a single word of text —
 * a token that simply disappears leaves people wondering whether it was captured or the app
 * glitched. Flying it back to the pocket also explains the rule: it is not destroyed, it is
 * sent home.
 */
const CaptureBurst = ({burst}: Props) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!burst) {
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 620,
      easing: Easing.bezier(0.22, 0.9, 0.24, 1),
      useNativeDriver: true,
    }).start();
  }, [burst, progress]);

  if (!burst) {
    return null;
  }

  const size = burst.size ?? 22;
  const dx = burst.to.x - burst.from.x;
  const dy = burst.to.y - burst.from.y;

  const translateX = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, dx * 0.18, dx],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, dy * 0.18 - 18, dy],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [1, 1.35, 0.55],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '540deg'],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.token,
          {
            left: burst.from.x - size / 2,
            top: burst.from.y - size / 2,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: burst.color,
            transform: [{translateX}, {translateY}, {scale}, {rotate}],
            opacity,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  token: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 6,
  },
});

export default CaptureBurst;
