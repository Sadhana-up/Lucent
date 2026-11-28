import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../components/lucent/theme';
import { api } from '../../lib/api';

const SKIN_TYPES = [
  { id: 'oily', label: 'Oily', desc: 'Excess shine, enlarged pores throughout the day' },
  { id: 'dry', label: 'Dry', desc: 'Feels tight, flaky patches, needs deep hydration' },
  { id: 'combination', label: 'Combination', desc: 'Oily T-zone, drier cheeks and edges' },
  { id: 'sensitive', label: 'Sensitive', desc: 'Easily irritated, prone to redness or stinging' },
  { id: 'normal', label: 'Normal', desc: 'Well-balanced, rarely breaks out or feels tight' },
  { id: 'unknown', label: "I'm not sure yet", desc: "We'll help you figure it out during your journey" },
];

const SKIN_CONCERNS = [
  'Acne & Breakouts',
  'Hyperpigmentation & Dark Spots',
  'Dryness & Dehydration',
  'Fine Lines & Wrinkles',
  'Redness & Sensitivity',
  'Enlarged Pores',
  'Uneven Texture',
  'Dullness & Lack of Glow',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleConcern = (c: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const finish = async (skip = false) => {
    setSaving(true);
    try {
      if (skip) {
        await api.updateProfile({ onboardingCompleted: true });
      } else {
        await api.updateProfile({
          skinType: selectedType === 'unknown' ? '' : selectedType,
          skinConcerns: selectedConcerns.join(', '),
          onboardingCompleted: true,
        });
      }
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setSaving(false);
      router.replace('/(app)/(tabs)');
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.logoRow}>
          <View style={s.logoMark} />
          <Text style={s.logoText}>Lucent</Text>
        </View>
        <Pressable onPress={() => finish(true)} hitSlop={12}>
          <Text style={s.skipText}>Skip for now</Text>
        </Pressable>
      </View>

      {/* Progress pills */}
      <View style={s.progressRow}>
        <View style={[s.progressPill, s.progressPillActive]} />
        <View style={[s.progressPill, step === 2 && s.progressPillActive]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      >
        {step === 1 && (
          <View style={s.stepContainer}>
            <Text style={s.eyebrow}>STEP 1 OF 2</Text>
            <Text style={s.stepTitle}>What best describes{'\n'}your skin?</Text>
            <Text style={s.stepSub}>
              This helps our ingredient engine recommend cleansers, serums, and moisturisers
              tailored for you.
            </Text>

            <View style={s.optionGrid}>
              {SKIN_TYPES.map((t) => {
                const sel = selectedType === t.id;
                return (
                  <Pressable
                    key={t.id}
                    style={[s.optionCard, sel && s.optionCardActive]}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setSelectedType(t.id);
                    }}
                  >
                    <View style={s.optionCardHeader}>
                      <Text style={[s.optionLabel, sel && s.optionLabelActive]}>{t.label}</Text>
                      {sel && (
                        <View style={s.checkCircle}>
                          <Feather name="check" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text style={s.optionDesc} numberOfLines={2}>{t.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[s.continueBtn, !selectedType && s.continueBtnDisabled]}
              disabled={!selectedType}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setStep(2);
              }}
            >
              <Text style={s.continueBtnText}>Continue</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={s.stepContainer}>
            <Text style={s.eyebrow}>STEP 2 OF 2</Text>
            <Text style={s.stepTitle}>What are your main{'\n'}skin concerns?</Text>
            <Text style={s.stepSub}>
              Select all that apply. We'll prioritize formulations targeting these concerns.
            </Text>

            <View style={s.concernGrid}>
              {SKIN_CONCERNS.map((c) => {
                const sel = selectedConcerns.includes(c);
                return (
                  <Pressable
                    key={c}
                    style={[s.concernChip, sel && s.concernChipActive]}
                    onPress={() => toggleConcern(c)}
                  >
                    <Text style={[s.concernText, sel && s.concernTextActive]}>{c}</Text>
                    <View
                      style={[s.concernCheck, sel && s.concernCheckActive]}
                    >
                      {sel && <Feather name="check" size={10} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.stepNavRow}>
              <Pressable
                style={s.backBtn}
                onPress={() => setStep(1)}
              >
                <Feather name="arrow-left" size={16} color={C.ink2} />
                <Text style={s.backBtnText}>Back</Text>
              </Pressable>

              <Pressable
                style={[s.continueBtn, { flex: 1, marginLeft: 12 }, saving && { opacity: 0.7 }]}
                disabled={saving}
                onPress={() => finish(false)}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={s.continueBtnText}>Complete Setup</Text>
                    <Feather name="check" size={16} color="#fff" />
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom trust row */}
      <View style={[s.trustRow, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.trustItem}>
          <Feather name="shield" size={12} color={C.muted} />
          <Text style={s.trustText}>Science-backed</Text>
        </View>
        <View style={s.trustItem}>
          <Feather name="heart" size={12} color={C.muted} />
          <Text style={s.trustText}>Clean beauty</Text>
        </View>
        <View style={s.trustItem}>
          <Feather name="star" size={12} color={C.muted} />
          <Text style={s.trustText}>Free AI analysis</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAFBFC' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.sage,
  },
  logoText: { fontFamily: F.serifBold, fontSize: 18, color: C.ink },
  skipText: { fontFamily: F.sans, fontSize: 13, color: C.ink2 },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 4,
  },
  progressPill: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  progressPillActive: { backgroundColor: C.sage },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  stepContainer: { paddingBottom: 16 },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: C.sage,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepTitle: {
    fontFamily: F.serifBold,
    fontSize: 28,
    color: C.ink,
    lineHeight: 34,
    marginBottom: 10,
  },
  stepSub: {
    fontFamily: F.sansRegular,
    fontSize: 13.5,
    color: C.ink2,
    lineHeight: 20,
    marginBottom: 24,
  },
  optionGrid: { gap: 10, marginBottom: 28 },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  optionCardActive: {
    borderColor: C.sage,
    backgroundColor: 'rgba(45,90,61,0.04)',
  },
  optionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionLabel: {
    fontFamily: F.sans,
    fontSize: 15,
    color: C.ink,
    fontWeight: '600',
  },
  optionLabelActive: { color: C.sage },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionDesc: {
    fontFamily: F.sansRegular,
    fontSize: 12.5,
    color: C.ink2,
    lineHeight: 18,
  },
  continueBtn: {
    backgroundColor: C.sage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: R.pill,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: {
    fontFamily: F.sans,
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  concernGrid: { gap: 8, marginBottom: 28 },
  concernChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  concernChipActive: {
    borderColor: C.sage,
    backgroundColor: 'rgba(45,90,61,0.04)',
  },
  concernText: {
    fontFamily: F.sans,
    fontSize: 14,
    color: C.ink,
    fontWeight: '500',
  },
  concernTextActive: { color: C.sage },
  concernCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  concernCheckActive: { backgroundColor: C.sage, borderColor: C.sage },
  stepNavRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: R.pill,
    backgroundColor: '#F3F4F6',
  },
  backBtnText: { fontFamily: F.sans, fontSize: 14, color: C.ink2 },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
    backgroundColor: '#FAFBFC',
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontFamily: F.sansRegular, fontSize: 11, color: C.muted },
});
