import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts } from '../theme/tokens';
import { useSplashDone } from '../features/splash/splashState';

export default function Home() {
  const splashDone = useSplashDone();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {splashDone && (
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(650).delay(0)}>
            <LinearGradient
              colors={[colors.violetLight, colors.rose]}
              style={styles.mark}
            />
          </Animated.View>
          <Animated.Text entering={FadeInDown.duration(650).delay(110)} style={styles.headline}>
            Skin that tells you what it needs.
          </Animated.Text>
          <Animated.Text entering={FadeInDown.duration(650).delay(190)} style={styles.sub}>
            Your light, understood.
          </Animated.Text>
          <Animated.View entering={FadeInDown.duration(650).delay(270)}>
            <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
              <Text style={styles.ctaText}>Begin your ritual</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  mark: { width: 64, height: 64, borderRadius: 32, marginBottom: 32 },
  headline: {
    fontFamily: fonts.serif,
    fontSize: 42,
    lineHeight: 46,
    textAlign: 'center',
    color: colors.sageDark,
  },
  sub: {
    marginTop: 14,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink2,
  },
  cta: {
    marginTop: 40,
    paddingVertical: 16,
    paddingHorizontal: 34,
    borderRadius: 999,
    backgroundColor: colors.sage,
  },
  ctaText: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream },
});
