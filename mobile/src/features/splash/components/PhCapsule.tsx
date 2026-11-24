import { Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { T } from '../constants';
import { clamp01, easeEase, easeSmooth } from '../easing';
import { useScene } from '../context';
import { colors, fonts } from '../../../theme/tokens';

// Reanimated's generated types don't expose `animatedProps.text` on Text.
const AnimatedInput: any = Animated.createAnimatedComponent(Text);

export function PhCapsule() {
  const { t, layout, reduced, leaveT, ready } = useScene();
  const scaleW = Math.min(200, Math.max(96, 0.24 * layout.width));

  /* The engine chases the target with a 0.14-per-frame lerp, so the bar, the
     number and the label all trail the timeline slightly instead of snapping. */
  const progress = useSharedValue(0);
  useFrameCallback((frame) => {
    const raw = clamp01((t.value - T.phStart) / T.phDur);
    const p = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
    const target = Math.min(p, ready.value ? 1 : 0.94);
    // frame-rate independent form of `lerp(shown, target, 0.14)` at 60fps
    const dt = Math.min(frame.timeSincePreviousFrame ?? 16.67, 34);
    const k = reduced ? 1 : 1 - Math.pow(0.86, dt / 16.67);
    progress.value += (target - progress.value) * k;
  });

  const label = useDerivedValue(() => {
    const p = progress.value;
    return p < 0.34 ? 'READING LIGHT' : p < 0.985 ? 'CALIBRATING' : 'BALANCED';
  }, [progress]);
  const value = useDerivedValue(() => `PH ${(7 - 1.5 * progress.value).toFixed(1)}`, [progress]);
  const balanced = useDerivedValue(() => progress.value >= 0.985, [progress]);

  const labelProps = useAnimatedProps(() => ({ text: label.value }), [label]);
  const valueProps = useAnimatedProps(() => ({ text: value.value }), [value]);
  const labelStyle = useAnimatedStyle(() => ({ color: balanced.value ? '#FFFFFF' : 'rgba(250,246,240,.9)' }), [balanced]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }), [progress]);
  const headStyle = useAnimatedStyle(() => ({ left: `${progress.value * 100}%` }), [progress]);
  const zoneStyle = useAnimatedStyle(() => ({
    opacity: balanced.value ? 1 : 0.75,
    shadowColor: balanced.value ? 'rgba(232,180,184,.8)' : 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: balanced.value ? 14 : 0,
  }), [balanced]);

  const capsuleStyle = useAnimatedStyle(() => {
    const inP = reduced ? 1 : easeSmooth(clamp01((t.value - T.phStart) / 1));
    const outP = reduced || leaveT.value === Infinity ? 0 : easeEase(clamp01((t.value - leaveT.value) / T.hudOutDur));
    return {
      opacity: inP * (1 - outP),
      transform: [{ translateY: (1 - inP) * 8 + outP * 14 }],
    };
  }, [t, reduced, leaveT]);
  const blurStyle = useAnimatedStyle(() => ({ opacity: reduced ? 1 : easeSmooth(clamp01((t.value - T.phStart) / 1)) }), [t, reduced]);

  return (
    <View pointerEvents="none" style={[styles.hud, { bottom: layout.safeBottom + 0.034 * layout.height, left: layout.safeLeft, right: layout.safeRight }]}>
      <Animated.View style={[styles.shadowWrap, capsuleStyle]}>
        <Animated.View style={[styles.shell, blurStyle]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} tint="default" style={styles.blur}>{content()}</BlurView>
          ) : (
            <View style={[styles.blur, styles.androidFill]}>{content()}</View>
          )}
          <View pointerEvents="none" style={styles.gloss} />
        </Animated.View>
      </Animated.View>
    </View>
  );

  function content() {
    return (
      <View style={[styles.row, layout.short && styles.rowShort]}>
        <AnimatedInput
          animatedProps={labelProps}
          style={[styles.label, labelStyle]}
          numberOfLines={1}
          editable={false}
        />
        <View style={[styles.scale, { width: scaleW }]}>
          <View style={styles.zone}>
            <Animated.View style={[styles.zoneGlow, zoneStyle]}>
              <LinearGradient
                colors={['rgba(232,180,184,0)', 'rgba(232,180,184,.55)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, fillStyle]}>
              <LinearGradient colors={[colors.violetLight, colors.rose]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            </Animated.View>
            <Animated.View style={[styles.head, headStyle]} />
          </View>
          <View style={styles.ticks}>
            {[0, 1, 2, 3, 4].map((i) => <View key={i} style={styles.tick} />)}
          </View>
        </View>
        <AnimatedInput
          animatedProps={valueProps}
          style={[styles.value, styles.valueText]}
          numberOfLines={1}
          editable={false}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  hud: { position: 'absolute', alignItems: 'center' },
  shadowWrap: {
    borderRadius: 999,
    shadowColor: 'rgba(8,20,13,.28)',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 40,
    shadowOpacity: 1,
  },
  shell: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.2)',
    backgroundColor: 'rgba(255,255,255,.09)',
  },
  blur: { overflow: 'hidden' },
  gloss: { position: 'absolute', left: 0, right: 0, top: 0, height: 1, backgroundColor: 'rgba(255,255,255,.26)' },
  androidFill: { backgroundColor: 'rgba(255,255,255,.16)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  rowShort: { paddingVertical: 9, paddingHorizontal: 16 },
  label: {
    width: 108,
    textAlign: 'right',
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1.54,
  },
  value: { width: 58, fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.54 },
  valueText: { color: '#FFFFFF' },
  scale: { height: 14, justifyContent: 'center' },
  zone: {
    position: 'absolute', right: 0, top: 4.5, width: '25%', height: 5, borderRadius: 5, overflow: 'visible',
  },
  zoneGlow: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 5, overflow: 'hidden',
  },
  track: { height: 1, backgroundColor: 'rgba(250,246,240,.26)' },
  fill: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 1, borderRadius: 1,
    transformOrigin: 'left',
    backgroundColor: colors.violetLight,
    shadowColor: colors.rose,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  head: {
    position: 'absolute', top: -3, width: 6, height: 6, marginLeft: -3, borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.rose,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.9,
  },
  ticks: { position: 'absolute', left: 0, right: 0, top: 11, flexDirection: 'row', justifyContent: 'space-between' },
  tick: { width: 1, height: 5, backgroundColor: 'rgba(250,246,240,.34)' },
});
