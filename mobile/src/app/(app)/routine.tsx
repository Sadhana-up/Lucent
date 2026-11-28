import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../components/lucent/theme';
import { api, formatCurrency, resolveImageUrl } from '../../lib/api';
import { useCart } from '../../lib/cart-context';
import { Product, Routine, RoutineStep, TimeOfDay } from '../../lib/types';

const TIME_ICONS: Record<TimeOfDay, 'sun' | 'moon'> = { MORNING: 'sun', EVENING: 'moon' };

const todayKey = () => new Date().toISOString().slice(0, 10);

/** Consecutive checked days ending today (matches the web routine page). */
function streakFromDays(days: string[]): number {
  const set = new Set(days);
  let cursor = new Date();
  if (!set.has(todayKey())) {
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

function ProgressRing({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  return (
    <View style={pr.wrap}>
      <Text style={pr.pct}>{pct}%</Text>
      <Text style={pr.sub}>{progress}/{total}</Text>
    </View>
  );
}
const pr = StyleSheet.create({
  wrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: C.sage,
  },
  pct: { fontFamily: F.sans, fontSize: 16, color: C.sage, fontWeight: '700' },
  sub: { fontFamily: F.mono, fontSize: 9, color: C.ink2 },
});

export default function RoutineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart: addProductToCart } = useCart();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [addStepModal, setAddStepModal] = useState(false);
  const [addTimeOfDay, setAddTimeOfDay] = useState<TimeOfDay>('MORNING');
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [stepNotes, setStepNotes] = useState('');

  const loadRoutines = useCallback(async () => {
    const res = await api.getRoutines();
    if (res.data) {
      const active = res.data.filter((r) => !r.isArchived);
      setRoutines(active);
      setActiveId((current) =>
        current && active.some((r) => r.id === current) ? current : active[0]?.id ?? null,
      );
    } else if (res.error) {
      Alert.alert('Could not load routines', res.error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    loadRoutines();
  }, [loadRoutines]);

  const activeRoutine = useMemo(
    () => routines.find((r) => r.id === activeId) ?? routines[0] ?? null,
    [routines, activeId],
  );

  const replaceRoutine = (updated: Routine | null) => {
    if (!updated) return;
    setRoutines((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      return exists ? prev.map((r) => (r.id === updated.id ? updated : r)) : [updated, ...prev];
    });
  };

  const handleCreateRoutine = async (useTemplate = false) => {
    if (!newName.trim() && !useTemplate) return;
    setActionLoading(true);
    const res = await api.createRoutine({
      name: useTemplate ? 'My Daily Routine' : newName.trim(),
      template: useTemplate,
    });
    if (res.data) {
      replaceRoutine(res.data);
      setActiveId(res.data.id);
      setCreateModal(false);
      setNewName('');
    } else {
      Alert.alert('Could not create routine', res.error || 'Please try again.');
    }
    setActionLoading(false);
  };

  const handleCompleteStep = async (step: RoutineStep) => {
    if (!activeRoutine) return;
    const routineId = activeRoutine.id;
    const wasDone = step.completedToday;
    const day = todayKey();

    // Optimistic toggle keeps the ring and streak instant.
    replaceRoutine({
      ...activeRoutine,
      steps: activeRoutine.steps.map((s) =>
        s.id === step.id ? { ...s, completedToday: !wasDone } : s,
      ),
      completions: wasDone
        ? (activeRoutine.completions ?? []).filter((c) => !(c.stepId === step.id && c.day === day))
        : [...(activeRoutine.completions ?? []), { stepId: step.id, day }],
    });

    if (!wasDone) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    const res = await api.completeRoutineStep(routineId, step.id);
    if (res.error) {
      replaceRoutine(activeRoutine); // revert
      Alert.alert('Could not update progress', res.error);
    } else {
      // Re-sync so the streak/history match the server exactly.
      const full = await api.getRoutine(routineId);
      if (full.data) replaceRoutine(full.data);
    }
  };

  const handleDeleteStep = (stepId: string) => {
    if (!activeRoutine) return;
    Alert.alert('Remove Step', 'Remove this step from your routine?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          const res = await api.deleteRoutineStep(activeRoutine.id, stepId);
          if (res.data) replaceRoutine(res.data);
          else Alert.alert('Could not remove step', res.error || 'Please try again.');
          setActionLoading(false);
        },
      },
    ]);
  };

  const handleSearchProducts = async (q: string) => {
    setProductSearch(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const res = await api.getProducts({ search: q.trim(), limit: 20 });
    const used = new Set(activeRoutine?.steps.map((s) => s.productId) ?? []);
    setSearchResults((res.data || []).filter((p) => !used.has(p.id)));
    setSearchLoading(false);
  };

  const handleAddStep = async (product: Product) => {
    if (!activeRoutine) return;
    setActionLoading(true);
    const res = await api.addRoutineStep(activeRoutine.id, {
      productId: product.id,
      timeOfDay: addTimeOfDay,
      notes: stepNotes.trim() || undefined,
    });
    if (res.data) {
      replaceRoutine(res.data);
      setAddStepModal(false);
      setProductSearch('');
      setSearchResults([]);
      setStepNotes('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Alert.alert('Could not add step', res.error || 'Please try again.');
    }
    setActionLoading(false);
  };

  const handleAddAllToCart = async () => {
    const steps = activeRoutine?.steps ?? [];
    const available = steps.filter((step) => step.product && (step.product.stock ?? 0) > 0);
    if (available.length === 0) {
      Alert.alert('Nothing to add', 'None of your routine products are currently in stock.');
      return;
    }
    setActionLoading(true);
    for (const step of available) {
      addProductToCart(step.product!, 1);
    }
    setActionLoading(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      'Added to Cart',
      `${available.length} routine product${available.length === 1 ? '' : 's'} added to your cart.`,
    );
  };

  const openAddStep = (time: TimeOfDay) => {
    setAddTimeOfDay(time);
    setAddStepModal(true);
  };

  const morningSteps = (activeRoutine?.steps ?? [])
    .filter((s) => s.timeOfDay === 'MORNING')
    .sort((a, b) => a.stepOrder - b.stepOrder);
  const eveningSteps = (activeRoutine?.steps ?? [])
    .filter((s) => s.timeOfDay === 'EVENING')
    .sort((a, b) => a.stepOrder - b.stepOrder);
  const progressToday = (activeRoutine?.steps ?? []).filter((s) => s.completedToday).length;
  const totalToday = activeRoutine?.steps.length ?? 0;
  const streak = useMemo(
    () =>
      streakFromDays([
        ...new Set((activeRoutine?.completions ?? []).map((c) => String(c.day).slice(0, 10))),
      ]),
    [activeRoutine?.completions],
  );

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.sage} />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/dashboard'))}
          hitSlop={10}
          style={s.backBtn}
        >
          <Feather name="arrow-left" size={20} color={C.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.eyebrow}>SKIN RITUAL</Text>
          <Text style={s.title}>Daily Routine</Text>
        </View>
        <Pressable style={s.addBtn} onPress={() => setCreateModal(true)}>
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Routine switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.routineTabsBar}
        contentContainerStyle={s.routineTabs}
      >
        {routines.map((r) => (
          <Pressable
            key={r.id}
            style={[s.routineTab, activeRoutine?.id === r.id && s.routineTabActive]}
            onPress={() => setActiveId(r.id)}
            hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
          >
            <Text
              style={[s.routineTabText, activeRoutine?.id === r.id && s.routineTabTextActive]}
              numberOfLines={1}
            >
              {r.name}
            </Text>
          </Pressable>
        ))}
        <Pressable style={s.routineNewTab} onPress={() => setCreateModal(true)}>
          <Feather name="plus" size={13} color={C.sage} />
          <Text style={s.routineNewTabText}>New</Text>
        </Pressable>
      </ScrollView>

      {!activeRoutine ? (
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Feather name="sunrise" size={36} color={C.sage} />
          </View>
          <Text style={s.emptyTitle}>No Routine Yet</Text>
          <Text style={s.emptySub}>
            Build a morning and evening skincare routine from your favourite formulations.
          </Text>
          <Pressable
            style={[s.createBtn, actionLoading && { opacity: 0.6 }]}
            disabled={actionLoading}
            onPress={() => handleCreateRoutine(true)}
          >
            <Feather name="zap" size={16} color="#fff" />
            <Text style={s.createBtnText}>Build it for me</Text>
          </Pressable>
          <Pressable style={s.createBtnOutline} onPress={() => setCreateModal(true)}>
            <Text style={s.createBtnOutlineText}>Start from scratch</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadRoutines();
              }}
              tintColor={C.sage}
              colors={[C.sage]}
            />
          }
        >
          {/* Progress card */}
          <View style={s.progressCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.progressTitle}>{activeRoutine.name}</Text>
              <Text style={s.progressSub}>
                {totalToday > 0 && progressToday === totalToday
                  ? '🎉 All done for today!'
                  : totalToday === 0
                    ? 'Add your first step to get started'
                    : `${totalToday - progressToday} step${totalToday - progressToday === 1 ? '' : 's'} remaining today`}
              </Text>
              {streak > 0 && (
                <View style={s.streakPill}>
                  <Feather name="zap" size={12} color="#E59819" />
                  <Text style={s.streakText}>{streak}-day streak</Text>
                </View>
              )}
            </View>
            <ProgressRing progress={progressToday} total={totalToday} />
          </View>

          {/* Morning Steps */}
          <View style={s.periodSection}>
            <View style={s.periodHeader}>
              <Feather name="sun" size={16} color="#E59819" />
              <Text style={s.periodTitle}>Morning Ritual</Text>
              <Text style={s.periodCount}>{morningSteps.length}</Text>
              <Pressable style={s.addStepBtn} onPress={() => openAddStep('MORNING')}>
                <Feather name="plus" size={14} color={C.sage} />
              </Pressable>
            </View>
            {morningSteps.length === 0 ? (
              <Text style={s.noStepsText}>No morning steps yet. Add a cleanser or moisturiser.</Text>
            ) : (
              morningSteps.map((step, idx) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={idx + 1}
                  onComplete={() => handleCompleteStep(step)}
                  onDelete={() => handleDeleteStep(step.id)}
                  onPress={() => {
                    if (step.product?.slug) {
                      router.push({ pathname: '/(app)/product/[slug]', params: { slug: step.product.slug } });
                    }
                  }}
                />
              ))
            )}
          </View>

          {/* Evening Steps */}
          <View style={s.periodSection}>
            <View style={s.periodHeader}>
              <Feather name="moon" size={16} color="#7C6D9E" />
              <Text style={s.periodTitle}>Evening Ritual</Text>
              <Text style={s.periodCount}>{eveningSteps.length}</Text>
              <Pressable style={s.addStepBtn} onPress={() => openAddStep('EVENING')}>
                <Feather name="plus" size={14} color={C.sage} />
              </Pressable>
            </View>
            {eveningSteps.length === 0 ? (
              <Text style={s.noStepsText}>No evening steps yet. Add a serum or night cream.</Text>
            ) : (
              eveningSteps.map((step, idx) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={idx + 1}
                  onComplete={() => handleCompleteStep(step)}
                  onDelete={() => handleDeleteStep(step.id)}
                  onPress={() => {
                    if (step.product?.slug) {
                      router.push({ pathname: '/(app)/product/[slug]', params: { slug: step.product.slug } });
                    }
                  }}
                />
              ))
            )}
          </View>

          {/* Add all to cart */}
          {totalToday > 0 && (
            <Pressable
              style={[s.addAllBtn, actionLoading && { opacity: 0.7 }]}
              disabled={actionLoading}
              onPress={handleAddAllToCart}
            >
              <Feather name="shopping-bag" size={16} color={C.sage} />
              <Text style={s.addAllBtnText}>Add All Products to Cart</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Create Routine Modal */}
      <Modal
        visible={createModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModal(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>New Routine</Text>
              <Pressable onPress={() => setCreateModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>
            <Text style={s.inputLabel}>ROUTINE NAME</Text>
            <TextInput
              style={s.textInput}
              placeholder="e.g. My Acne-Clear Routine"
              placeholderTextColor="#9EA3AF"
              value={newName}
              onChangeText={setNewName}
              returnKeyType="done"
            />
            <Pressable
              style={[s.submitBtn, (!newName.trim() || actionLoading) && { opacity: 0.5 }]}
              disabled={!newName.trim() || actionLoading}
              onPress={() => handleCreateRoutine(false)}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.submitBtnText}>Create Routine</Text>
              )}
            </Pressable>
            <Pressable
              style={s.templateBtn}
              disabled={actionLoading}
              onPress={() => handleCreateRoutine(true)}
            >
              <Feather name="zap" size={14} color={C.sage} />
              <Text style={s.templateBtnText}>Use Smart Template Instead</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Step Modal */}
      <Modal
        visible={addStepModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddStepModal(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 16, maxHeight: '88%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                Add to {addTimeOfDay === 'MORNING' ? 'Morning' : 'Evening'}
              </Text>
              <Pressable
                onPress={() => {
                  setAddStepModal(false);
                  setProductSearch('');
                  setSearchResults([]);
                  setStepNotes('');
                }}
                hitSlop={10}
              >
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>

            {/* Period switch */}
            <View style={s.periodSwitch}>
              {(['MORNING', 'EVENING'] as TimeOfDay[]).map((t) => (
                <Pressable
                  key={t}
                  style={[s.periodSwitchBtn, addTimeOfDay === t && s.periodSwitchBtnActive]}
                  onPress={() => setAddTimeOfDay(t)}
                >
                  <Feather
                    name={TIME_ICONS[t]}
                    size={14}
                    color={addTimeOfDay === t ? '#fff' : C.ink2}
                  />
                  <Text
                    style={[s.periodSwitchText, addTimeOfDay === t && s.periodSwitchTextActive]}
                  >
                    {t === 'MORNING' ? 'Morning' : 'Evening'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={s.searchInput}
              placeholder="Search serums, cleansers, SPF..."
              placeholderTextColor="#9EA3AF"
              value={productSearch}
              onChangeText={handleSearchProducts}
              returnKeyType="search"
            />

            <ScrollView
              style={{ maxHeight: 260 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {searchLoading ? (
                <ActivityIndicator color={C.sage} style={{ marginTop: 16 }} />
              ) : searchResults.length > 0 ? (
                searchResults.map((p) => {
                  const img = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
                  return (
                    <Pressable
                      key={p.id}
                      style={[s.searchResultRow, actionLoading && { opacity: 0.5 }]}
                      disabled={actionLoading}
                      onPress={() => handleAddStep(p)}
                    >
                      <View style={s.searchResultImg}>
                        {img ? (
                          <Image
                            alt=""
                            source={{ uri: resolveImageUrl(img) }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Feather name="droplet" size={16} color={C.sage} />
                        )}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={s.searchResultTitle} numberOfLines={1}>
                          {p.title}
                        </Text>
                        <Text style={s.searchResultSeller} numberOfLines={1}>
                          {p.seller?.storeName || 'Lucent'} · {formatCurrency(p.discountPrice || p.price)}
                        </Text>
                      </View>
                      <Feather name="plus-circle" size={22} color={C.sage} />
                    </Pressable>
                  );
                })
              ) : productSearch.length > 1 ? (
                <Text style={s.noResultText}>No products found for “{productSearch}”</Text>
              ) : (
                <Text style={s.hintText}>Search for a product to add to your routine.</Text>
              )}
            </ScrollView>

            <Text style={[s.inputLabel, { marginTop: 12 }]}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={s.textInput}
              placeholder="e.g. Apply 2-3 drops before moisturiser"
              placeholderTextColor="#9EA3AF"
              value={stepNotes}
              onChangeText={setStepNotes}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function StepCard({
  step,
  index,
  onComplete,
  onDelete,
  onPress,
}: {
  step: RoutineStep;
  index: number;
  onComplete: () => void;
  onDelete: () => void;
  onPress: () => void;
}) {
  const img =
    step.product?.images?.find((i) => i.isPrimary)?.url ||
    step.product?.images?.[0]?.url ||
    step.imageSnapshot;
  const done = step.completedToday;
  const title = step.product?.title || step.titleSnapshot || 'Product';

  return (
    <View style={[sc.card, done && sc.cardDone]}>
      <Pressable style={sc.checkBtn} onPress={onComplete} hitSlop={6}>
        <View style={[sc.check, done && sc.checkDone]}>
          {done && <Feather name="check" size={12} color="#fff" />}
        </View>
      </Pressable>

      <Pressable style={sc.content} onPress={onPress}>
        <View style={sc.stepNumber}>
          <Text style={sc.stepNumberText}>{index}</Text>
        </View>
        <View style={sc.imgBox}>
          {img ? (
            <Image
              alt=""
              source={{ uri: resolveImageUrl(img) }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Feather name="droplet" size={16} color={C.sage} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[sc.title, done && sc.titleDone]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={sc.meta} numberOfLines={1}>
            {step.product?.seller?.storeName || 'Lucent'}
            {step.product
              ? ` · ${formatCurrency(step.product.discountPrice || step.product.price)}`
              : step.priceSnapshot != null
                ? ` · ${formatCurrency(step.priceSnapshot)}`
                : ''}
          </Text>
          {step.notes ? (
            <Text style={sc.notes} numberOfLines={1}>
              {step.notes}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Pressable onPress={onDelete} hitSlop={8} style={sc.deleteBtn}>
        <Feather name="x" size={14} color={C.muted} />
      </Pressable>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  cardDone: { opacity: 0.62, backgroundColor: '#F7FBF8' },
  checkBtn: { padding: 4, marginRight: 4 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: C.sage, borderColor: C.sage },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepNumber: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  stepNumberText: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.muted,
    fontWeight: '600',
  },
  imgBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: { fontFamily: F.sans, fontSize: 13, color: C.ink, fontWeight: '600' },
  titleDone: { textDecorationLine: 'line-through', color: C.muted },
  meta: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginTop: 2 },
  notes: { fontFamily: F.sansRegular, fontSize: 11, color: C.muted, fontStyle: 'italic', marginTop: 2 },
  deleteBtn: { padding: 6 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: C.sage, fontWeight: '600' },
  title: { fontFamily: F.serifBold, fontSize: 24, color: C.ink },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTabsBar: { flexGrow: 0, flexShrink: 0, maxHeight: 52 },
  routineTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 2,
  },
  routineTab: {
    flexShrink: 0,
    maxWidth: 200,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: R.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E2D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTabActive: { backgroundColor: C.sage, borderColor: C.sage },
  routineTabText: { fontFamily: F.sans, fontSize: 12.5, color: C.ink2, fontWeight: '500' },
  routineTabTextActive: { color: '#fff', fontWeight: '600' },
  routineNewTab: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: R.pill,
    backgroundColor: '#EDF5EF',
    borderWidth: 1,
    borderColor: '#D8E8DC',
  },
  routineNewTabText: { fontFamily: F.sans, fontSize: 12.5, color: C.sage, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 4 },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  progressTitle: { fontFamily: F.serifBold, fontSize: 18, color: C.ink, marginBottom: 4 },
  progressSub: { fontFamily: F.sansRegular, fontSize: 12.5, color: C.ink2 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#FDF4E5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.pill,
  },
  streakText: { fontFamily: F.sans, fontSize: 11, color: '#D97706', fontWeight: '600' },
  periodSection: { marginBottom: 20 },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  periodTitle: { fontFamily: F.sans, fontSize: 14, color: C.ink, fontWeight: '700' },
  periodCount: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.muted,
    backgroundColor: '#F3EFE9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: R.pill,
  },
  addStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  noStepsText: {
    fontFamily: F.sansRegular,
    fontSize: 12.5,
    color: C.muted,
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EDF5EF',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#C8E0CC',
    marginTop: 4,
  },
  addAllBtnText: { fontFamily: F.sans, fontSize: 13.5, color: C.sage, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: F.serifBold, fontSize: 24, color: C.ink, marginBottom: 8 },
  emptySub: {
    fontFamily: F.sansRegular,
    fontSize: 13.5,
    color: C.ink2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.sage,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: R.pill,
    marginBottom: 10,
  },
  createBtnText: { fontFamily: F.sans, fontSize: 14, color: '#fff', fontWeight: '600' },
  createBtnOutline: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.sage,
  },
  createBtnOutlineText: { fontFamily: F.sans, fontSize: 14, color: C.sage },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontFamily: F.serifBold, fontSize: 22, color: C.ink },
  inputLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: C.sage,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  submitBtnText: { fontFamily: F.sans, fontSize: 14, color: '#fff', fontWeight: '600' },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  templateBtnText: { fontFamily: F.sans, fontSize: 13, color: C.sage },
  periodSwitch: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  periodSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  periodSwitchBtnActive: { backgroundColor: C.sage, borderColor: C.sage },
  periodSwitchText: { fontFamily: F.sans, fontSize: 13, color: C.ink2 },
  periodSwitchTextActive: { color: '#fff', fontWeight: '600' },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE6',
  },
  searchResultImg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  searchResultTitle: { fontFamily: F.sans, fontSize: 13, color: C.ink, fontWeight: '600' },
  searchResultSeller: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginTop: 2 },
  noResultText: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    marginTop: 16,
  },
  hintText: {
    fontFamily: F.sansRegular,
    fontSize: 12.5,
    color: C.muted,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
