import React, {useCallback, useRef} from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';

type Props = {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** How far the surface dips on press. 0.96 reads as "physical" without looking broken. */
  pressScale?: number;
  testID?: string;
};

/**
 * Press feedback that feels like a real button: it dips and settles on a spring, rather than
 * snapping between two states. Used for every tappable surface in the lobby.
 */
const AnimatedPressable = ({
  onPress,
  children,
  style,
  disabled,
  pressScale = 0.96,
  testID,
}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressScale,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 0.88,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, pressScale, scale]);

  const pressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 26,
        bounciness: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}>
      <Animated.View
        style={[
          style,
          {transform: [{scale}], opacity: disabled ? 0.5 : opacity},
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default AnimatedPressable;
