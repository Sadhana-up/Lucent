import { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MasterClock } from '../useMasterClock';

/** __DEV__ only: replay, scrub the master clock, or force the exit. */
export function DebugOverlay({ clock, onExit }: { clock: MasterClock; onExit: () => void }) {
  const [scrubbing, setScrubbing] = useState(false);
  const [label, setLabel] = useState('0.00s');
  const [barWidth, setBarWidth] = useState(0);

  const setFromX = (x: number) => {
    if (barWidth <= 0) return;
    const seconds = Math.max(0, Math.min(8, (x / barWidth) * 8));
    clock.seek(seconds);
    setLabel(seconds.toFixed(2) + 's');
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setScrubbing(true);
        setFromX(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderRelease: () => setScrubbing(false),
    }),
  ).current;

  return (
    <View style={styles.root} pointerEvents="auto">
      <Text style={styles.title}>LUCENT · {label}{scrubbing ? ' ⏸' : ''}</Text>
      <View
        style={styles.bar}
        onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
        {...pan.panHandlers}
      >
        <View style={styles.barFill} />
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => { clock.replay(); setLabel('0.00s'); }}>
          <Text style={styles.btnText}>Replay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, scrubbing && styles.btnActive]}
          onPress={() => {
            if (scrubbing) {
              clock.resume();
              setScrubbing(false);
            } else {
              clock.seek(clock.t.value);
              setScrubbing(true);
            }
          }}
        >
          <Text style={styles.btnText}>{scrubbing ? 'Resume' : 'Scrub'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onExit}>
          <Text style={styles.btnText}>Exit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 56,
    right: 12,
    width: 190,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(11,25,18,.86)',
    zIndex: 10000,
  },
  title: { color: '#FAF6F0', fontFamily: 'monospace', fontSize: 10, marginBottom: 8 },
  bar: { height: 14, borderRadius: 7, backgroundColor: 'rgba(250,246,240,.2)', overflow: 'hidden' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: '#9B8DF0' },
  row: { flexDirection: 'row', gap: 6, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(250,246,240,.14)',
  },
  btnActive: { backgroundColor: '#7C6BEA' },
  btnText: { color: '#FAF6F0', fontSize: 10 },
});
