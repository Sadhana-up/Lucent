import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
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
import { C, F, R } from '../../../components/lucent/theme';
import { api, formatCurrency, resolveImageUrl } from '../../../lib/api';
import { useCart } from '../../../lib/cart-context';
import { CartItem } from '../../../lib/cart-context';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, totalCount } = useCart();

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('98');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'khalti' | 'cod'>('cod');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const shippingFee = subtotal > 2000 ? 0 : 150;
  const grandTotal = subtotal + shippingFee;

  const handlePlaceOrder = async () => {
    setErrorMessage('');
    if (!address.trim()) {
      setErrorMessage('Please enter your delivery address in Nepal.');
      return;
    }

    // Format phone to match Nepali format +977-98XXXXXXXX or 98XXXXXXXX
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let finalPhone = phone.trim();
    if (cleanPhone.length === 10 && cleanPhone.startsWith('98')) {
      finalPhone = `+977-${cleanPhone}`;
    } else if (cleanPhone.length === 10 && (cleanPhone.startsWith('97') || cleanPhone.startsWith('98'))) {
      finalPhone = `+977-${cleanPhone}`;
    }

    setLoading(true);
    try {
      const payload = {
        items: items.map((i: CartItem) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address.trim(),
        contactPhone: finalPhone,
        notes: notes.trim() || undefined,
        paymentMethod,
      };

      const res = await api.createOrder(payload);

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      if (res.data?.order) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const createdOrder = res.data.order;
        clearCart();
        setCheckoutOpen(false);

        // If Khalti payment URL is returned, open it in browser or redirect
        if (res.data.paymentUrl) {
          Linking.openURL(res.data.paymentUrl).catch(() => {});
        }

        router.push(`/(app)/order/${createdOrder.id}` as any);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to place order. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: any }) => {
    return (
      <View style={s.itemCard}>
        <View style={s.itemImgBox}>
          {item.image ? (
            <Image
              source={{ uri: resolveImageUrl(item.image) }}
              style={s.itemImg}
              resizeMode="cover"
            />
          ) : (
            <Feather name="droplet" size={24} color={C.sage} />
          )}
        </View>

        <View style={s.itemDetails}>
          <View style={s.titleRow}>
            <Text style={s.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Pressable
              hitSlop={10}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                removeFromCart(item.productId);
              }}
            >
              <Feather name="trash-2" size={16} color={C.danger} />
            </Pressable>
          </View>

          <Text style={s.itemSeller} numberOfLines={1}>
            {item.sellerName || 'Lucent Formulator'}
          </Text>

          <View style={s.bottomRow}>
            <Text style={s.itemPrice}>{formatCurrency(item.price)}</Text>

            <View style={s.qtyControl}>
              <Pressable
                style={s.qtyBtn}
                onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              >
                <Feather name="minus" size={13} color={C.ink} />
              </Pressable>
              <Text style={s.qtyValue}>{item.quantity}</Text>
              <Pressable
                style={s.qtyBtn}
                onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              >
                <Feather name="plus" size={13} color={C.ink} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.eyebrow}>YOUR APOTHECARY BAG</Text>
        <Text style={s.title}>Selected Formulations</Text>
      </View>

      {items.length === 0 ? (
        <View style={s.emptyCartBox}>
          <View style={s.emptyIconCircle}>
            <Feather name="shopping-bag" size={36} color={C.sage} />
          </View>
          <Text style={s.emptyTitle}>Your Bag is Empty</Text>
          <Text style={s.emptySub}>
            Discover pure, biocompatible skincare formulated by certified botanical artisans.
          </Text>
          <Pressable
            style={s.exploreBtn}
            onPress={() => router.push('/(app)/(tabs)')}
          >
            <Text style={s.exploreBtnText}>Explore Formulations</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={items}
            keyExtractor={(i) => i.productId}
            renderItem={renderCartItem}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <View style={s.summaryCard}>
                <Text style={s.summaryHeader}>ORDER SUMMARY</Text>

                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Subtotal ({totalCount} items)</Text>
                  <Text style={s.summaryValue}>{formatCurrency(subtotal)}</Text>
                </View>

                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Eco Shipping (Nepal)</Text>
                  <Text style={s.summaryValue}>
                    {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}
                  </Text>
                </View>

                {subtotal <= 2000 && (
                  <Text style={s.freeShipHint}>
                    Add {formatCurrency(2000 - subtotal)} more for free delivery!
                  </Text>
                )}

                <View style={s.divider} />

                <View style={s.summaryRow}>
                  <Text style={s.grandTotalLabel}>Estimated Total</Text>
                  <Text style={s.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
                </View>
              </View>
            }
          />

          {/* Bottom Checkout CTA */}
          <View style={[s.checkoutBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
            <View>
              <Text style={s.barTotalLabel}>Total Amount</Text>
              <Text style={s.barTotalValue}>{formatCurrency(grandTotal)}</Text>
            </View>

            <Pressable
              style={s.checkoutBtn}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setCheckoutOpen(true);
              }}
            >
              <Text style={s.checkoutBtnText}>Proceed to Checkout</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal
        visible={checkoutOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCheckoutOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Apothecary Checkout</Text>
              <Pressable
                onPress={() => setCheckoutOpen(false)}
                hitSlop={12}
              >
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* Delivery Address */}
              <Text style={s.inputLabel}>SHIPPING ADDRESS (NEPAL)</Text>
              <TextInput
                style={s.textArea}
                multiline
                numberOfLines={3}
                placeholder="e.g. Ward 4, Baluwatar, Kathmandu (near Russian Embassy)"
                placeholderTextColor="#9EA3AF"
                value={address}
                onChangeText={setAddress}
              />

              {/* Contact Phone */}
              <Text style={s.inputLabel}>CONTACT PHONE</Text>
              <TextInput
                style={s.textInput}
                keyboardType="phone-pad"
                placeholder="98XXXXXXXX"
                placeholderTextColor="#9EA3AF"
                value={phone}
                onChangeText={setPhone}
              />
              <Text style={s.phoneHint}>Format: 10-digit mobile number</Text>

              {/* Delivery Notes */}
              <Text style={s.inputLabel}>SPECIAL INSTRUCTIONS (OPTIONAL)</Text>
              <TextInput
                style={s.textInput}
                placeholder="Gate code, landmark, or delivery time..."
                placeholderTextColor="#9EA3AF"
                value={notes}
                onChangeText={setNotes}
              />

              {/* Payment Method Selector */}
              <Text style={[s.inputLabel, { marginTop: 16 }]}>PAYMENT METHOD</Text>
              <View style={s.paymentOptions}>
                <Pressable
                  style={[s.payOption, paymentMethod === 'cod' && s.payOptionActive]}
                  onPress={() => setPaymentMethod('cod')}
                >
                  <Feather
                    name="truck"
                    size={18}
                    color={paymentMethod === 'cod' ? C.sage : C.ink2}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.payOptionTitle,
                        paymentMethod === 'cod' && s.payOptionTitleActive,
                      ]}
                    >
                      Cash on Delivery
                    </Text>
                    <Text style={s.payOptionSub}>Pay upon parcel arrival</Text>
                  </View>
                  {paymentMethod === 'cod' && (
                    <Feather name="check" size={16} color={C.sage} />
                  )}
                </Pressable>

                <Pressable
                  style={[s.payOption, paymentMethod === 'khalti' && s.payOptionActive]}
                  onPress={() => setPaymentMethod('khalti')}
                >
                  <Feather
                    name="credit-card"
                    size={18}
                    color={paymentMethod === 'khalti' ? C.sage : C.ink2}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        s.payOptionTitle,
                        paymentMethod === 'khalti' && s.payOptionTitleActive,
                      ]}
                    >
                      Khalti Digital Wallet
                    </Text>
                    <Text style={s.payOptionSub}>Instant UPI / eBanking / Wallet</Text>
                  </View>
                  {paymentMethod === 'khalti' && (
                    <Feather name="check" size={16} color={C.sage} />
                  )}
                </Pressable>
              </View>

              {errorMessage ? (
                <View style={s.errorBox}>
                  <Feather name="alert-circle" size={15} color={C.danger} />
                  <Text style={s.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
            </ScrollView>

            <Pressable
              style={[s.confirmBtn, loading && { opacity: 0.7 }]}
              disabled={loading}
              onPress={handlePlaceOrder}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.confirmBtnText}>
                  Confirm Order · {formatCurrency(grandTotal)}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: C.sage,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontFamily: F.serifBold,
    fontSize: 28,
    color: C.ink,
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 110,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  itemImgBox: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImg: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontFamily: F.sans,
    fontSize: 13.5,
    color: C.ink,
    fontWeight: '600',
    maxWidth: '85%',
  },
  itemSeller: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  itemPrice: {
    fontFamily: F.sans,
    fontSize: 14,
    color: C.sage,
    fontWeight: '700',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFEA',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.ink,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  summaryHeader: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink2,
  },
  summaryValue: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink,
    fontWeight: '600',
  },
  freeShipHint: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.sage,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0ECE6',
    marginVertical: 10,
  },
  grandTotalLabel: {
    fontFamily: F.serifBold,
    fontSize: 16,
    color: C.ink,
  },
  grandTotalValue: {
    fontFamily: F.sans,
    fontSize: 18,
    color: C.sage,
    fontWeight: '700',
  },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  barTotalLabel: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
  },
  barTotalValue: {
    fontFamily: F.sans,
    fontSize: 18,
    color: C.sage,
    fontWeight: '700',
  },
  checkoutBtn: {
    backgroundColor: C.sage,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCartBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: F.serifBold,
    fontSize: 24,
    color: C.ink,
  },
  emptySub: {
    fontFamily: F.sansRegular,
    fontSize: 13.5,
    color: C.ink2,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 22,
    backgroundColor: C.sage,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: R.pill,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
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
  modalTitle: {
    fontFamily: F.serifBold,
    fontSize: 22,
    color: C.ink,
  },
  inputLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '600',
    marginTop: 12,
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
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 12,
    height: 70,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink,
    textAlignVertical: 'top',
  },
  phoneHint: {
    fontFamily: F.sansRegular,
    fontSize: 10.5,
    color: C.muted,
    marginTop: 3,
  },
  paymentOptions: {
    gap: 8,
    marginTop: 4,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2D8',
    backgroundColor: '#FAF8F5',
  },
  payOptionActive: {
    borderColor: C.sage,
    backgroundColor: '#EDF5EF',
  },
  payOptionTitle: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink,
    fontWeight: '600',
  },
  payOptionTitleActive: {
    color: C.sage,
  },
  payOptionSub: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDECEC',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.danger,
    flex: 1,
  },
  confirmBtn: {
    backgroundColor: C.sage,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 14,
    fontWeight: '600',
  },
});
