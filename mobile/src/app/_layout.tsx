import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { FONT_MAP, colors } from '../theme/tokens';
import { LucentSplash } from '../features/splash';
import { SplashDoneContext } from '../features/splash/splashState';

// Keep the native splash up until fonts are ready; fade it into our first frame.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 220, fade: true });

// Module scope survives foreground/resume: the splash plays once per cold start.
let consumedThisColdStart = false;

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONT_MAP);
  const [showSplash, setShowSplash] = useState(() => !consumedThisColdStart);
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (!fontsLoaded) return;
    void SplashScreen.hideAsync();
    // Simulate session/data load; the pH capsule holds at 94% until this fires.
    const id = setTimeout(() => setAppReady(true), 250);
    return () => clearTimeout(id);
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.app}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }} />
        </View>
        <SplashDoneContext.Provider value={splashDone}>
          {showSplash && (
            <LucentSplash
              ready={appReady}
              minDuration={5600}
              skippable
              onDone={() => {
                consumedThisColdStart = true;
                setSplashDone(true);
                setShowSplash(false);
              }}
            />
          )}
        </SplashDoneContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  app: { flex: 1, backgroundColor: colors.cream },
});
