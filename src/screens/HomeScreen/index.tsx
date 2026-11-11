import {Animated, Image, Alert, Pressable} from 'react-native';
import React, {useCallback, useEffect, useRef} from 'react';
import Wrapper from '$components/Wrapper';
import {IMAGES} from '$assets/images';
import {styles} from './styles';
import GradientButton from '$components/GradientButton';
import {useAppDispatch} from '$hooks/useAppStore';
import {resetGame} from '$redux/reducers/gameSlice';
import {playSound, stopSound} from '$helpers/SoundUtils';
import {useSelector} from 'react-redux';
import {selectCurrentPosition} from '$redux/reducers/gameSelectors';
import {useIsFocused} from '@react-navigation/native';
import {navigate} from '$helpers/navigationUtils';
import LottieView from 'lottie-react-native';
import {ANIMATATIONS} from '$assets/animation';
import {DEVICE_WIDTH} from '$constants/dimensions';
import GlassPanel from '$components/GlassPanel';
import AnimatedPressable from '$components/AnimatedPressable';
import {PALETTE} from '$theme/palette';

const HomeScreen = () => {
  const dispatch = useAppDispatch();
  const currentPosition = useSelector(selectCurrentPosition);
  const isFocused = useIsFocused();

  const entryLogo = useRef(new Animated.Value(0)).current;
  const entryPanel = useRef(new Animated.Value(0)).current;
  const withAnim = useRef(new Animated.Value(-DEVICE_WIDTH)).current;
  const scaleXAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (isFocused) {
      playSound('home');
    }
  }, [isFocused]);

  // Staggered entrance: the mark settles first, then the panel rises under it. Two beats read
  // as intentional; one simultaneous fade reads as a screen that just appeared.
  useEffect(() => {
    entryLogo.setValue(0);
    entryPanel.setValue(0);
    Animated.stagger(140, [
      Animated.spring(entryLogo, {toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8}),
      Animated.spring(entryPanel, {toValue: 1, useNativeDriver: true, speed: 11, bounciness: 6}),
    ]).start();
  }, [entryLogo, entryPanel]);

  useEffect(() => {
    const loopAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(withAnim, {
              toValue: DEVICE_WIDTH * 0.02,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleXAnim, {
              toValue: -1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),

          Animated.delay(3000),

          Animated.parallel([
            Animated.timing(withAnim, {
              toValue: DEVICE_WIDTH * 2,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleXAnim, {
              toValue: -1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),

          Animated.parallel([
            Animated.timing(withAnim, {
              toValue: -DEVICE_WIDTH * 0.05,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleXAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),

          Animated.delay(3000),

          Animated.parallel([
            Animated.timing(withAnim, {
              toValue: -DEVICE_WIDTH * 2,
              duration: 8000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleXAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ).start();
    };

    const cleanUpAnimation = () => {
      withAnim.stopAnimation();
      scaleXAnim.stopAnimation();
    };

    loopAnimation();

    return cleanUpAnimation;
  }, [withAnim, scaleXAnim]);

  const renderButton = useCallback((title: string, onPress: () => void) => {
    return <GradientButton title={title} onPress={onPress} />;
  }, []);

  const startGame = useCallback(
    async (e: boolean = false) => {
      stopSound();
      if (e) {
        dispatch(resetGame());
      }
      navigate('LudoBoardScreen', {});
      playSound('game_start');
    },
    [dispatch],
  );

  const handleNewGame = useCallback(() => {
    stopSound();
    navigate('PlayerSetupScreen', {});
  }, []);

  const handleResumeGame = useCallback(() => {
    startGame(false);
  }, [startGame]);

  const handleCoomingSoon = useCallback(() => {
    Alert.alert('Cooming Soon');
  }, []);

  // "VS Computer" used to be a dead button. It now opens the seat picker, which is where the
  // bot personalities and the two-bot cap live.
  const handleVsComputer = useCallback(() => {
    stopSound();
    navigate('PlayerSetupScreen', {vsComputer: true});
  }, []);

  return (
    <Wrapper style={styles.wrapper}>
      <Animated.View
        style={[
          styles.imgContainer,
          {
            opacity: entryLogo,
            transform: [
              {
                translateY: entryLogo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-26, 0],
                }),
              },
              {
                scale: entryLogo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 1],
                }),
              },
            ],
          },
        ]}>
        <Image source={IMAGES.Logo} style={styles.img} resizeMode={'contain'} />
      </Animated.View>

      <Animated.View
        style={{
          width: '100%',
          paddingHorizontal: 22,
          opacity: entryPanel,
          transform: [
            {
              translateY: entryPanel.interpolate({
                inputRange: [0, 1],
                outputRange: [34, 0],
              }),
            },
          ],
        }}>
        <GlassPanel intensity="mid" radius={26} accent={PALETTE.gold} style={{paddingBottom: 6}}>
          {currentPosition.length !== 0 && renderButton('RESUME', handleResumeGame)}
          {renderButton('NEW GAME', handleNewGame)}
          {renderButton('VS Computer', handleVsComputer)}
          {renderButton('2 vs 2', handleCoomingSoon)}
        </GlassPanel>
      </Animated.View>

      <Animated.View
        style={[
          styles.witchContainer,
          {transform: [{translateX: withAnim}, {scaleX: scaleXAnim}]},
        ]}>
        <Pressable
          onPress={() => {
            const soundName: any = `sound_girl${Math.floor(Math.random() * 4)}`;
            playSound(soundName);
          }}>
          <LottieView
            hardwareAccelerationAndroid
            source={ANIMATATIONS.Witch}
            autoPlay
            loop
            speed={1}
            style={styles.witch}
          />
        </Pressable>
      </Animated.View>
    </Wrapper>
  );
};

export default HomeScreen;
