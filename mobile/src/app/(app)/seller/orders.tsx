import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../../components/lucent/theme';
import { api, formatCurrency, resolveImageUrl } from '../../../lib/api';
import { SellerOrder } from '../../../lib/types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return requested',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};

const REFUND_LABELS: Record<string, string> = {
  NONE: 'Not requested',
  REQUESTED: 'Refund requested',
  APPROVED: 'Refund approved',
  PROCESSING: 'Refund processing',
  REFUNDED: 'Refunded',
  REJECTED: 'Refund rejected',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#F1EEFF', fg: C.violet },
  CONFIRMED: { bg: '#EAF2FF', fg: '#2563EB' },
  PROCESSING: { bg: '#EDF5EF', fg: C.sage },
  SHIPPED: { bg: '#EDF5EF', fg: C.sage },
  DELIVERED: { bg: '#E3F1E8', fg: C.sageDk },
  CANCELLED: { bg: '#FDECEC', fg: C.danger },
  RETURN_REQUESTED: { bg: '#FEF3C7', fg: '#B45309' },
  RETURNED: { bg: '#FEF3C7', fg: '#B45309' },
  REFUNDED: { bg: '#F1F3F5', fg: '#475569' },
};

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  RETURN_REQUESTED: ['RETURNED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

function canReviewRefund(status: string) {
  return status === 'REQUESTED';
}

function canMarkRefunded(status: string) {
  return status === 'APPROVED' || status === 'PROCESSING';
}

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();

  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(
    typeof params.orderId === 'string' ? params.orderId : null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { carrier: string; trackingNumber: string }>
  >({});

  const loadOrders = useCallback(async () => {
    const res = await api.getSellerOrders();
    if (res.data) {
      setOrders(res.data);
      setError('');
    } else if (res.error) {
      setError(res.error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void loadOrders();
  }, [loadOrders]);

  const draftFor = (order: SellerOrder) =>
    drafts[order.id] ?? {
      carrier: order.carrier ?? '',
      trackingNumber: order.trackingNumber ?? '',
    };

  const updateDraft = (order: SellerOrder, field: 'carrier' | 'trackingNumber', value: string) => {
    const current = draftFor(order);
    setDrafts((prev) => ({ ...prev, [order.id]: { ...current, [field]: value } }));
  };

  const runAction = async (
    order: SellerOrder,
    action: string,
    extra: { status?: string; reason?: string; trackingNumber?: string; carrier?: string } = {},
  ) => {
    setBusyId(order.id);
    setError('');
    try {
      const res = await api.updateSellerOrder(order.id, action, extra);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data) {
        setOrders((prev) =>
          prev.map((item) =>
            item.id === order.id
              ? {
                  ...item,
                  status: (res.data?.status as SellerOrder['status']) ?? item.status,
                  paymentStatus: res.data?.paymentStatus ?? item.paymentStatus,
                  refundStatus: res.data?.refundStatus ?? item.refundStatus,
                  refundReason: res.data?.refundReason ?? item.refundReason,
                  refundedAt: res.data?.refundedAt ?? item.refundedAt,
                  trackingNumber: res.data?.trackingNumber ?? item.trackingNumber,
                  carrier: res.data?.carrier ?? item.carrier,
                  cancelledAt: res.data?.cancelledAt ?? item.cancelledAt,
                  cancelReason: res.data?.cancelReason ?? item.cancelReason,
                }
              : item,
          ),
        );
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch {
      setError('Could not update this order. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatus = (order: SellerOrder, next: string) => {
    if (next === 'CANCELLED') {
      Alert.alert(
        'Cancel Order',
        'Cancel this order? Paid orders will be marked for refund review.',
        [
          { text: 'Keep order', style: 'cancel' },
          { text: 'Cancel order', style: 'destructive', onPress: () => void runAction(order, 'set_status', { status: next }) },
        ],
      );
      return;
    }
    void runAction(order, 'set_status', { status: next });
  };

  const handleSaveTracking = (order: SellerOrder) => {
    const draft = draftFor(order);
    if (!draft.trackingNumber.trim()) {
      setError('Enter a tracking number before saving.');
      return;
    }
    void runAction(order, 'update_tracking', {
      trackingNumber: draft.trackingNumber.trim(),
      carrier: draft.carrier.trim() || undefined,
    });
  };

  const orderStats = useMemo(() => {
    const billable = orders.filter(
      (o) => o.paymentStatus === 'PAID' && o.status !== 'CANCELLED' && o.status !== 'REFUNDED',
    );
    return {
      total: billable.reduce((sum, o) => sum + Number(o.sellerSubtotal || 0), 0),
      pending: orders.filter((o) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length,
      refunds: orders.filter((o) => o.refundStatus !== 'NONE' || o.status === 'RETURN_REQUESTED').length,
    };
  }, [orders]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/dashboard'))}
          hitSlop={10}
          style={s.backBtn}
        >
          <Feather name="arrow-left" size={20} color={C.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.eyebrow}>SELLER HUB</Text>
          <Text style={s.title}>Customer Orders</Text>
        </View>
        <Pressable style={s.refreshBtn} onPress={() => { setRefreshing(true); void loadOrders(); }} hitSlop={8}>
          <Feather name="refresh-cw" size={16} color={C.sage} />
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.sage} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 28 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); void loadOrders(); }}
              tintColor={C.sage}
              colors={[C.sage]}
            />
          }
        >
          <View style={s.summaryRow}>
            <View style={s.summaryCard}>
              <Text style={s.summaryValue}>{formatCurrency(orderStats.total)}</Text>
              <Text style={s.summaryLabel}>Paid sales</Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={s.summaryValue}>{orderStats.pending}</Text>
              <Text style={s.summaryLabel}>To fulfil</Text>
            </View>
            <View style={s.summaryCard}>
              <Text style={s.summaryValue}>{orderStats.refunds}</Text>
              <Text style={s.summaryLabel}>Returns</Text>
            </View>
          </View>

          {error ? <Text style={s.errorText}>{error}</Text> : null}

          {orders.length === 0 ? (
            <View style={s.emptyBox}>
              <Feather name="inbox" size={34} color="#CBD0D8" />
              <Text style={s.emptyTitle}>No customer orders yet</Text>
              <Text style={s.emptySub}>Orders containing your products will appear here.</Text>
            </View>
          ) : (
            orders.map((order) => {
              const isOpen = expanded === order.id;
              const status = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
              const transitions = TRANSITIONS[order.status] ?? [];
              const draft = draftFor(order);
              const isBusy = busyId === order.id;
              return (
                <View key={order.id} style={s.orderCard}>
                  <Pressable style={s.orderHeader} onPress={() => setExpanded(isOpen ? null : order.id)}>
                    <View style={{ flex: 1 }}>
                      <View style={s.orderTitleRow}>
                        <Text style={s.orderNumber}>{order.orderNumber}</Text>
                        <View style={[s.badge, { backgroundColor: status.bg }]}>
                          <Text style={[s.badgeText, { color: status.fg }]}>
                            {STATUS_LABELS[order.status] ?? order.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={s.orderMeta}>
                        {order.customer?.name || 'Customer'} · {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                      <Text style={s.orderAmount}>{formatCurrency(order.sellerSubtotal)}</Text>
                      <Text style={s.paymentText}>{order.paymentStatus}</Text>
                    </View>
                    <Feather
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={C.muted}
                      style={{ marginLeft: 8 }}
                    />
                  </Pressable>

                  {isOpen ? (
                    <View style={s.orderBody}>
                      {order.items.map((item) => (
                        <View key={item.id} style={s.itemRow}>
                          <View style={s.itemImg}>
                            {item.product.images?.[0]?.url ? (
                              <Image
                                alt=""
                                source={{ uri: resolveImageUrl(item.product.images[0].url) }}
                                style={{ width: '100%', height: '100%' }}
                              />
                            ) : (
                              <Feather name="package" size={16} color={C.sage} />
                            )}
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={s.itemTitle} numberOfLines={2}>{item.product.title}</Text>
                            <Text style={s.itemMeta}>
                              Qty {item.quantity} × {formatCurrency(item.price)}
                            </Text>
                          </View>
                          <Text style={s.itemTotal}>{formatCurrency(item.quantity * item.price)}</Text>
                        </View>
                      ))}

                      <View style={s.infoGrid}>
                        <View style={s.infoBlock}>
                          <Text style={s.infoLabel}>CUSTOMER</Text>
                          <Text style={s.infoValue}>{order.customer?.name || 'Customer'}</Text>
                          <Text style={s.infoSub}>{order.customer?.email}</Text>
                          <Text style={s.infoSub}>{order.contactPhone}</Text>
                        </View>
                        <View style={s.infoBlock}>
                          <Text style={s.infoLabel}>SHIP TO</Text>
                          <Text style={s.infoSub}>{order.shippingAddress}</Text>
                        </View>
                      </View>

                      {order.notes ? (
                        <Text style={s.notesText}><Text style={{ fontWeight: '700' }}>Buyer notes: </Text>{order.notes}</Text>
                      ) : null}

                      {order.refundStatus !== 'NONE' || order.status === 'RETURN_REQUESTED' ? (
                        <View style={s.section}>
                          <View style={s.sectionTitleRow}>
                            <Feather name="rotate-ccw" size={14} color={C.violet} />
                            <Text style={s.sectionTitle}>Return &amp; refund</Text>
                            <View style={[s.badge, { backgroundColor: '#F1EEFF' }]}>
                              <Text style={[s.badgeText, { color: C.violet }]}>
                                {REFUND_LABELS[order.refundStatus] ?? order.refundStatus}
                              </Text>
                            </View>
                          </View>
                          {order.refundReason ? (
                            <Text style={s.refundReason}>Reason: {order.refundReason}</Text>
                          ) : null}
                          <View style={s.actionRow}>
                            {order.status === 'RETURN_REQUESTED' ? (
                              <>
                                <ActionBtn label="Approve return" disabled={isBusy} onPress={() => void runAction(order, 'approve_return')} />
                                <ActionBtn label="Reject return" tone="danger" disabled={isBusy} onPress={() => void runAction(order, 'reject_return')} />
                              </>
                            ) : null}
                            {canReviewRefund(order.refundStatus) ? (
                              <>
                                <ActionBtn label="Approve refund" disabled={isBusy} onPress={() => void runAction(order, 'approve_refund')} />
                                <ActionBtn label="Reject refund" tone="danger" disabled={isBusy} onPress={() => void runAction(order, 'reject_refund')} />
                              </>
                            ) : null}
                            {canMarkRefunded(order.refundStatus) ? (
                              <ActionBtn label="Mark refunded" disabled={isBusy} onPress={() => void runAction(order, 'mark_refunded')} />
                            ) : null}
                          </View>
                        </View>
                      ) : null}

                      {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' ? (
                        <View style={s.section}>
                          <View style={s.sectionTitleRow}>
                            <Feather name="truck" size={14} color={C.sage} />
                            <Text style={s.sectionTitle}>Shipment tracking</Text>
                          </View>
                          <View style={s.trackingRow}>
                            <TextInput
                              style={[s.input, { flex: 1 }]}
                              placeholder="Carrier"
                              placeholderTextColor="#9EA3AF"
                              value={draft.carrier}
                              onChangeText={(v) => updateDraft(order, 'carrier', v)}
                            />
                            <TextInput
                              style={[s.input, { flex: 1.2 }]}
                              placeholder="Tracking number"
                              placeholderTextColor="#9EA3AF"
                              value={draft.trackingNumber}
                              onChangeText={(v) => updateDraft(order, 'trackingNumber', v)}
                            />
                          </View>
                          <ActionBtn
                            label={isBusy ? 'Saving…' : 'Save tracking'}
                            disabled={isBusy}
                            onPress={() => handleSaveTracking(order)}
                          />
                        </View>
                      ) : null}

                      <View style={s.section}>
                        <Text style={s.infoLabel}>UPDATE ORDER STATUS</Text>
                        {transitions.length === 0 ? (
                          <Text style={s.infoSub}>No further status changes available.</Text>
                        ) : (
                          <View style={s.actionRow}>
                            {transitions.map((next) => (
                              <ActionBtn
                                key={next}
                                label={`Mark ${STATUS_LABELS[next] ?? next}`}
                                tone={next === 'CANCELLED' ? 'danger' : 'primary'}
                                disabled={isBusy}
                                onPress={() => handleStatus(order, next)}
                              />
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ActionBtn({
  label,
  onPress,
  disabled,
  tone = 'neutral',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'danger' | 'neutral';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        s.actionBtn,
        tone === 'primary' && s.actionBtnPrimary,
        tone === 'danger' && s.actionBtnDanger,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text
        style={[
          s.actionBtnText,
          tone === 'primary' && { color: '#FFFFFF' },
          tone === 'danger' && { color: C.danger },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE5DB',
  },
  eyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2, color: C.sage, fontWeight: '600' },
  title: { fontFamily: F.serifBold, fontSize: 24, color: C.ink },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDF5EF',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 14 },
  summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 11, borderWidth: 1, borderColor: '#ECE5DB' },
  summaryValue: { fontFamily: F.sans, fontSize: 14, color: C.sage, fontWeight: '700' },
  summaryLabel: { fontFamily: F.sansRegular, fontSize: 10.5, color: C.ink2, marginTop: 2 },
  errorText: {
    fontFamily: F.sansRegular, fontSize: 12.5, color: C.danger, backgroundColor: '#FDECEC',
    borderRadius: 10, padding: 10, marginBottom: 12,
  },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontFamily: F.serifBold, fontSize: 18, color: C.ink, marginTop: 10 },
  emptySub: { fontFamily: F.sansRegular, fontSize: 12.5, color: C.muted, marginTop: 4 },
  orderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#ECE5DB', overflow: 'hidden',
  },
  orderHeader: { flexDirection: 'row', alignItems: 'center', padding: 13 },
  orderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  orderNumber: { fontFamily: F.mono, fontSize: 13, color: C.ink, fontWeight: '700' },
  orderMeta: { fontFamily: F.sansRegular, fontSize: 11.5, color: C.ink2, marginTop: 3 },
  orderAmount: { fontFamily: F.sans, fontSize: 13.5, color: C.ink, fontWeight: '700' },
  paymentText: { fontFamily: F.mono, fontSize: 9, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: R.pill },
  badgeText: { fontFamily: F.mono, fontSize: 9, fontWeight: '700' },
  orderBody: { borderTopWidth: 1, borderTopColor: '#F0ECE6', padding: 13, gap: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF8F5', borderRadius: 12, padding: 9 },
  itemImg: { width: 42, height: 42, borderRadius: 9, backgroundColor: '#F3EFEA', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  itemTitle: { fontFamily: F.sans, fontSize: 12.5, color: C.ink, fontWeight: '600' },
  itemMeta: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginTop: 2 },
  itemTotal: { fontFamily: F.sans, fontSize: 12, color: C.ink, fontWeight: '700', marginLeft: 8 },
  infoGrid: { flexDirection: 'row', gap: 12, paddingTop: 2 },
  infoBlock: { flex: 1 },
  infoLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.muted, fontWeight: '700', marginBottom: 3 },
  infoValue: { fontFamily: F.sans, fontSize: 12.5, color: C.ink, fontWeight: '600' },
  infoSub: { fontFamily: F.sansRegular, fontSize: 11.5, color: C.ink2, lineHeight: 16 },
  notesText: { fontFamily: F.sansRegular, fontSize: 11.5, color: C.ink2, backgroundColor: '#FAF8F5', borderRadius: 10, padding: 9 },
  section: { borderTopWidth: 1, borderTopColor: '#F0ECE6', paddingTop: 10, gap: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sectionTitle: { fontFamily: F.sans, fontSize: 12.5, color: C.ink, fontWeight: '700' },
  refundReason: { fontFamily: F.sansRegular, fontSize: 11.5, color: C.ink2 },
  trackingRow: { flexDirection: 'row', gap: 8 },
  input: {
    borderWidth: 1, borderColor: '#E8E2D8', borderRadius: 10, height: 40,
    paddingHorizontal: 10, fontFamily: F.sansRegular, fontSize: 12, color: C.ink, backgroundColor: '#FAF8F5',
  },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  actionBtn: {
    borderWidth: 1, borderColor: '#E2DCD2', backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start',
  },
  actionBtnPrimary: { backgroundColor: C.sage, borderColor: C.sage },
  actionBtnDanger: { borderColor: '#E7C6C6', backgroundColor: '#FFF7F7' },
  actionBtnText: { fontFamily: F.sans, fontSize: 11.5, color: C.ink, fontWeight: '600' },
});
