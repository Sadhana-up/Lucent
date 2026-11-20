import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { T } from '../constants';
import { clamp01, smoothstep } from '../easing';
import { useScene } from '../context';
import { colors, fonts } from '../../../theme/tokens';

export function PhCapsule() {
  const { t, layout, reduced, leaveT, ready } = useScene();
  const [label, setLabel] = useState('Reading light');
  const [value, setValue] = useState('7.0');
  const lastValue = useSharedValue('');
  const lastLabel = useSharedValue('');

  const progress = useDerivedValue(() => {
    const raw = clamp01((t.value - T.phStart) / T.phDur);
    const p = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
    return Math.min(p, ready.value ? 1 : 0.94);
  }, [t, ready]);

  useDerivedValue(() => {
    const p = progress.value;
    const v = (7 - 1.5 * p).toFixed(1);
    const l = p < 0.34 ? 'Reading light' : p < 0.985 ? 'Calibrating' : 'Balanced';
    if (v !== lastValue.value) {
      lastValue.value = v;
      runOnJS(setValue)(v);
    }
    if (l !== lastLabel.value) {
      lastLabel.value = l;
      runOnJS(setLabel)(l);
    }
  }, [progress, lastValue, lastLabel]);

  const balanced = useDerivedValue(() => progress.value >= 0.985, [progress]);
  const zoneGlow = useAnimatedStyle(() => ({ opacity: balanced.value ? 1 : 0 }), [balanced]);
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }), [progress]);
  const headStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
  }), [progress]);

  const capsuleStyle = useAnimatedStyle(() => {
    const inP = reduced ? 1 : smoothstep((t.value - T.phStart) / 1);
    const outP = reduced || leaveT.value === Infinity
      ? 0
      : smoothstep((t.value - leaveT.value) / T.hudOutDur);
    return {
      opacity: inP * (1 - outP),
      transform: [{ translateY: outP * 14 }],
    };
  }, [t, reduced, leaveT]);

  const shell = (
    <View style={styles.ph}>
      <View style={styles.phText}>
        <Animated.Text style={[styles.phLabel, balanced.value ? styles.phLabelBalanced : null]}>
          {label}
        </Animated.Text>
        <Animated.Text style={styles.phValue}>
          pH <Animated.Text style={styles.phNumber}>{value}</Animated.Text>
        </Animated.Text>
      </View>
      <View style={styles.scale}>
        <View style={styles.zone} />
        <Animated.View style={[styles.zoneGlow, zoneGlow]} />
        <View style={styles.track}>
          <Animated.View style={[styles.fill, fillStyle]} />
          <Animated.View style={[styles.head, headStyle]} />
        </View>
        <View style={styles.ticks}>
          {[0, 1, 2, 3, 4].map((i) => <View key={i} style={styles.tick} />)}
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Lucent is loading"
      accessibilityValue={{ min: 0, max: 100, now: 0 }}
      pointerEvents="none"
      style={[
        styles.hud,
        {
          bottom: layout.safeBottom + 0.034 * layout.height,
          left: layout.safeLeft,
          right: layout.safeRight,
        },
        capsuleStyle,
      ]}
    >
      <Animated.View style={styles.shellWrap}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="light" style={styles.blur}>{shell}</BlurView>
        ) : (
          <View style={styles.blur}>{shell}</View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
    alignItems: 'center',
  },
  shellWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.2)',
    backgroundColor: 'rgba(255,255,255,.09)',
    shadowColor: 'rgba(8,20,13,.28)',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 40,
    shadowOpacity: 1,
  },
  blur: { paddingHorizontal: 6 },
  ph: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  phText: { gap: 4 },
  phLabel: {
    width: 98,
    textAlign: 'right',
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(250,246,240,.9)',
  },
  phLabelBalanced: { color: '#FFFFFF' },
  phValue: {
    width: 58,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(250,246,240,.9)',
  },
  phNumber: { color: '#FFFFFF' },
  scale: {
    width: 140,
    height: 14,
    justifyContent: 'center',
  },
  zone: {
    position: 'absolute',
    right: 0,
    width: '25%',
    height: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(232,180,184,.6)',
    opacity: 0.75,
  },
  zoneGlow: {
    position: 'absolute',
    right: -4,
    width: '30%',
    height: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(232,180,184,.35)',
  },
  track: {
    height: 1,
    backgroundColor: 'rgba(250,246,240,.26)',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -2,
    height: 5,
    borderRadius: 3,
    transformOrigin: 'left',
    backgroundColor: colors.violetLight,
  },
  head: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 6,
    marginLeft: -3,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  ticks: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tick: { width: 1, height: 5, backgroundColor: 'rgba(250,246,240,.34)' },
});
