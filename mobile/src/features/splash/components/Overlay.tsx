import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { T } from '../constants';
import { clamp01, easeContentOut, easeEase, easeSmooth, lerp } from '../easing';
import { useScene } from '../context';
import { colors, fonts } from '../../../theme/tokens';

const WORD = 'Lucent';

export function Overlay() {
  const { t, layout, reduced, leaveT } = useScene();
  const { height, safeTop, safeLeft, safeRight, short, wordFontSize } = layout;

  const contentStyle = useAnimatedStyle(() => {
    if (leaveT.value === Infinity || reduced) return { opacity: 1 };
    const p = easeContentOut(clamp01((t.value - leaveT.value - T.contentOutDelay) / T.contentOutDur));
    return {
      opacity: 1 - p,
      transform: [{ translateY: -0.03 * height * p }, { scale: 1 + 0.06 * p }],
    };
  }, [t, leaveT, reduced, height]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.content,
        {
          top: safeTop + (short ? 0.05 : 0.11) * height,
          left: safeLeft + 16,
          right: safeRight + 16,
        },
        contentStyle,
      ]}
    >
      <Animated.Text
        accessible={false}
        style={[styles.word, { fontSize: wordFontSize }]}
      >
        {WORD.split('').map((char, i) => (
          <Letter key={i} char={char} index={i} />
        ))}
      </Animated.Text>
      <RuleRow />
      {!short && (
        <>
          <SoftText text="27.7172° N · 85.3240° E" start={T.coordStart} style={styles.coord} />
          <SoftText text="Skin, in its best light." start={T.tagStart} style={styles.tag} />
        </>
      )}
    </Animated.View>
  );
}

function Letter({ char, index }: { char: string; index: number }) {
  const { t, reduced, layout } = useScene();
  const fontSize = layout.wordFontSize;
  const style = useAnimatedStyle(() => {
    const start = T.wordStart + index * T.letterStagger;
    const p = reduced ? 1 : easeSmooth(clamp01((t.value - start) / T.letterDur));
    const shine = reduced ? 1 : easeEase(clamp01((t.value - T.shineStart - index * T.shineStagger) / T.shineDur));
    const color = interpolateColor(shine, [0, 0.5, 1], [
      colors.sageDark,
      colors.violetLight,
      colors.sageDark,
    ]);
    const spacing = lerp(0.15, 0.012, reduced ? 1 : easeSmooth(clamp01((t.value - T.wordStart) / T.trackDur)));
    return {
      opacity: p,
      color,
      marginRight: index < WORD.length - 1 ? spacing * fontSize : 0,
      transform: [{ translateY: (1 - p) * 0.5 * fontSize }, { scale: 0.86 + 0.14 * p }],
    };
  }, [t, reduced, index, fontSize]);

  return (
    <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>
  );
}

function RuleRow() {
  const { t, reduced } = useScene();
  const line = useAnimatedStyle(() => ({
    transform: [{ scaleX: reduced ? 1 : easeSmooth(clamp01((t.value - T.ruleStart) / T.ruleDur)) }],
  }), [t, reduced]);
  const label = useAnimatedStyle(() => {
    const p = reduced ? 1 : easeSmooth(clamp01((t.value - T.nepStart) / T.ruleDur));
    return { opacity: p, transform: [{ translateY: (1 - p) * 8 }] };
  }, [t, reduced]);

  return (
    <View style={styles.ruleRow} accessible={false}>
      <Animated.View style={[styles.ruleLine, styles.ruleLeft, line]} />
      <Animated.Text style={[styles.nepal, label]}>NEPAL</Animated.Text>
      <Animated.View style={[styles.ruleLine, styles.ruleRight, line]} />
    </View>
  );
}

function SoftText({ text, start, style }: { text: string; start: number; style: object }) {
  const { t, reduced } = useScene();
  const animated = useAnimatedStyle(() => {
    const p = reduced ? 1 : easeSmooth(clamp01((t.value - start) / T.softDur));
    return { opacity: p, transform: [{ translateY: (1 - p) * 8 }] };
  }, [t, reduced, start]);
  return <Animated.Text accessible={false} style={[style, animated]}>{text}</Animated.Text>;
}

const styles = StyleSheet.create({
  content: {
    position: 'absolute',
    alignItems: 'center',
  },
  word: {
    fontFamily: fonts.serif,
    fontWeight: '300',
    lineHeight: undefined,
    textAlign: 'center',
  },
  letter: {
    fontFamily: fonts.serif,
    fontWeight: '300',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  ruleLine: {
    width: 64,
    height: 1,
  },
  ruleLeft: { backgroundColor: colors.sage },
  ruleRight: { backgroundColor: colors.sage },
  nepal: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 6,
    marginRight: -6,
    color: colors.sage,
  },
  coord: {
    marginTop: 16,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.ink2,
  },
  tag: {
    marginTop: 14,
    fontFamily: fonts.serifItalic,
    fontSize: 22,
    color: colors.sage,
  },
});
