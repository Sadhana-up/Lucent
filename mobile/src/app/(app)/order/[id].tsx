import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../../components/lucent/theme';
import { api, formatCurrency, resolveImageUrl } from '../../../lib/api';
import { Order, OrderItem } from '../../../lib/types';

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        const res = await api.getOrder(id);
        if (res.data) {
          setOrder(res.data);
        }
      } catch (e) {
        console.error('Error fetching order:', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you wish to cancel this order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            if (!order) return;
            setCancelling(true);
            try {
              const res = await api.cancelOrder(order.id);
              if (res.data) {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                setOrder(res.data);
              }
            } catch (e) {
              console.error('Failed to cancel order:', e);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[s.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.sage} />
        <Text style={s.loadingText}>Fetching order timeline...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[s.centerBox, { paddingTop: insets.top }]}>
        <Feather name="alert-circle" size={40} color={C.danger} />
        <Text style={s.errorTitle}>Order Not Found</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const currentStepIdx = isCancelled ? -1 : STATUS_STEPS.indexOf(order.status);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={s.header}>
        <Pressable
          style={s.backIconButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Feather name="arrow-left" size={20} color={C.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.eyebrow}>ORDER DETAILS</Text>
          <Text style={s.orderNumber}>{order.orderNumber}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 30 }}
      >
        {/* Status Tracker Card */}
        <View style={s.card}>
          <Text style={s.cardSectionTitle}>FULFILLMENT STATUS</Text>

          {isCancelled ? (
            <View style={s.cancelledBox}>
              <Feather name="x-circle" size={20} color={C.danger} />
              <Text style={s.cancelledText}>Order was cancelled</Text>
            </View>
          ) : (
            <View style={s.stepperRow}>
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <View key={step} style={s.stepItem}>
                    <View
                      style={[
                        s.stepDot,
                        isPassed && s.stepDotPassed,
                        isCurrent && s.stepDotCurrent,
                      ]}
                    >
                      {isPassed && <Feather name="check" size={10} color="#FFFFFF" />}
                    </View>
                    <Text
                      style={[
                        s.stepLabel,
                        isPassed && s.stepLabelPassed,
                        isCurrent && s.stepLabelCurrent,
                      ]}
                    >
                      {step}
                    </Text>
                    {idx < STATUS_STEPS.length - 1 && (
                      <View
                        style={[
                          s.stepLine,
                          idx < currentStepIdx && s.stepLinePassed,
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View style={s.paymentStatusRow}>
            <Text style={s.paymentMethodText}>
              Payment: {order.paymentProvider?.toUpperCase() || 'COD'}
            </Text>
            <View
              style={[
                s.payBadge,
                order.paymentStatus === 'PAID' ? s.payBadgePaid : s.payBadgeUnpaid,
              ]}
            >
              <Text
                style={[
                  s.payBadgeText,
                  order.paymentStatus === 'PAID' ? s.payBadgeTextPaid : s.payBadgeTextUnpaid,
                ]}
              >
                {order.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Itemized List */}
        <View style={s.card}>
          <Text style={s.cardSectionTitle}>FORMULATIONS ({order.items.length})</Text>
          {order.items.map((item: OrderItem) => {
            const img = item.product?.images?.[0]?.url;
            return (
              <View key={item.id} style={s.itemRow}>
                <View style={s.itemThumb}>
                  {img ? (
                    <Image
                      source={{ uri: resolveImageUrl(img) }}
                      style={s.itemImage}
                    />
                  ) : (
                    <Feather name="droplet" size={20} color={C.sage} />
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.itemTitle} numberOfLines={1}>
                    {item.product?.title || 'Botanical formulation'}
                  </Text>
                  <Text style={s.itemSeller}>
                    Qty: {item.quantity} · {formatCurrency(item.price)} each
                  </Text>
                </View>

                <Text style={s.itemTotal}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            );
          })}

          <View style={s.divider} />

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Amount</Text>
            <Text style={s.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Delivery Address & Contact */}
        <View style={s.card}>
          <Text style={s.cardSectionTitle}>DELIVERY ADDRESS</Text>
          <View style={s.addressRow}>
            <Feather name="map-pin" size={16} color={C.sage} style={{ marginTop: 2 }} />
            <Text style={s.addressText}>{order.shippingAddress}</Text>
          </View>

          <View style={[s.addressRow, { marginTop: 10 }]}>
            <Feather name="phone" size={16} color={C.sage} />
            <Text style={s.addressText}>{order.contactPhone}</Text>
          </View>

          {order.notes ? (
            <View style={[s.addressRow, { marginTop: 10 }]}>
              <Feather name="file-text" size={16} color={C.muted} />
              <Text style={s.notesText}>Note: {order.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Customer Cancellation Option */}
        {order.status === 'PENDING' && (
          <Pressable
            style={s.cancelBtn}
            disabled={cancelling}
            onPress={handleCancelOrder}
          >
            {cancelling ? (
              <ActivityIndicator color={C.danger} />
            ) : (
              <Text style={s.cancelBtnText}>Cancel This Order</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: C.sage,
    fontWeight: '600',
  },
  orderNumber: {
    fontFamily: F.sans,
    fontSize: 16,
    color: C.ink,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  cardSectionTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '700',
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    position: 'relative',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    zIndex: 2,
  },
  stepDotPassed: {
    backgroundColor: C.sage,
  },
  stepDotCurrent: {
    borderWidth: 2,
    borderColor: C.sage,
    backgroundColor: '#FFFFFF',
  },
  stepLabel: {
    fontFamily: F.sansRegular,
    fontSize: 9.5,
    color: C.muted,
  },
  stepLabelPassed: {
    color: C.ink,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: C.sage,
    fontWeight: '700',
  },
  stepLine: {
    position: 'absolute',
    top: 9,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E5E0D8',
    zIndex: 1,
  },
  stepLinePassed: {
    backgroundColor: C.sage,
  },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECEC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  cancelledText: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.danger,
    fontWeight: '600',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
  },
  paymentMethodText: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.ink2,
  },
  payBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payBadgePaid: {
    backgroundColor: '#EDF5EF',
  },
  payBadgeUnpaid: {
    backgroundColor: '#FDF4E5',
  },
  payBadgeText: {
    fontFamily: F.mono,
    fontSize: 10,
    fontWeight: '700',
  },
  payBadgeTextPaid: {
    color: C.sage,
  },
  payBadgeTextUnpaid: {
    color: '#D97706',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemTitle: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink,
    fontWeight: '600',
  },
  itemSeller: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
    marginTop: 2,
  },
  itemTotal: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.sage,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3EFEA',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    fontFamily: F.serifBold,
    fontSize: 16,
    color: C.ink,
  },
  totalValue: {
    fontFamily: F.sans,
    fontSize: 18,
    color: C.sage,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink,
    lineHeight: 18,
  },
  notesText: {
    flex: 1,
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.ink2,
    fontStyle: 'italic',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.danger,
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelBtnText: {
    color: C.danger,
    fontFamily: F.sans,
    fontSize: 13.5,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: C.cream,
  },
  loadingText: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink2,
    marginTop: 10,
  },
  errorTitle: {
    fontFamily: F.serifBold,
    fontSize: 22,
    color: C.ink,
    marginTop: 12,
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: C.sage,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: R.pill,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 13,
    fontWeight: '600',
  },
});
