/**
 * Tests for the lobby design layer and the takeover control.
 *
 * These are not screenshot tests: they check the two things that can silently break — the
 * glass panel rendering its children, and the takeover control refusing to act once the
 * two-bot cap is reached.
 */
import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import GlassPanel from '../GlassPanel';
import BotControlBar from '../BotControlBar';
import AnimatedPressable from '../AnimatedPressable';
import {seatRole} from '../../helpers/seatRole';

const texts = (root: TestRenderer.ReactTestInstance) =>
  root.findAllByType(Text).map(t => [t.props.children].flat().join(''));

describe('GlassPanel', () => {
  it('renders its children', () => {
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <GlassPanel testID="panel">
          <Text>inside</Text>
        </GlassPanel>,
      );
    });
    expect(texts(tree.root)).toContain('inside');
    expect(tree.root.findByProps({testID: 'panel'})).toBeTruthy();
  });
});

describe('AnimatedPressable', () => {
  it('fires onPress', () => {
    const onPress = jest.fn();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <AnimatedPressable onPress={onPress}>
          <Text>tap</Text>
        </AnimatedPressable>,
      );
    });
    act(() => {
      tree.root.findByProps({onPress}).props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });
});

describe('BotControlBar', () => {
  it('offers the takeover when under the cap', () => {
    const onToggle = jest.fn();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <BotControlBar seat={1} takeover={false} onToggleTakeover={onToggle} botsInMatch={1} />,
      );
    });
    const shown = texts(tree.root).join(' | ');
    expect(shown).toContain('Step away?');
    expect(shown).toContain('Hand seat 1 to the bot');
  });

  it('shows the cap message and refuses to act at two bots', () => {
    const onToggle = jest.fn();
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <BotControlBar seat={1} takeover={false} onToggleTakeover={onToggle} botsInMatch={2} />,
      );
    });
    expect(texts(tree.root).join(' | ')).toContain('2 bots per match');
    const pressable = tree.root.findByProps({testID: 'bot-takeover-toggle'});
    expect(pressable.props.disabled).toBe(true);
  });
});

describe('takeover rides on the assist seat', () => {
  it('makes a favoured, non-guaranteed seat play automatically', () => {
    const role = seatRole(
      {
        playerCount: 4,
        aiPlayers: [],
        cheatMode: {enabled: true, favoredPlayer: 1, guaranteed: false},
      },
      1,
    );
    expect(role.assist).toBe(true);
    expect(role.auto).toBe(true);
  });

  it('leaves other seats alone', () => {
    const role = seatRole(
      {
        playerCount: 4,
        aiPlayers: [],
        cheatMode: {enabled: true, favoredPlayer: 1, guaranteed: false},
      },
      2,
    );
    expect(role.auto).toBe(false);
  });
});
