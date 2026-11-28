import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../components/lucent/theme';
import { api, formatCurrency, resolveImageUrl } from '../../lib/api';
import { authClient } from '../../lib/auth-client';
import { WishlistItem } from '../../lib/types';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.getWishlist();
    if (res.data) setItems(res.data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (productId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const res = await api.toggleWishlist(productId);
    if (res.data) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    }
  };

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
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={C.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.eyebrow}>YOUR COLLECTION</Text>
          <Text style={s.title}>Wishlist</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Feather name="heart" size={34} color={C.sage} />
          </View>
          <Text style={s.emptyTitle}>Your wishlist is empty</Text>
          <Text style={s.emptySub}>
            Save formulations you love by tapping the heart on any product page.
          </Text>
          <Pressable style={s.shopBtn} onPress={() => router.replace('/(app)/(tabs)')}>
            <Text style={s.shopBtnText}>Explore Catalogue</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={C.sage}
              colors={[C.sage]}
            />
          }
          renderItem={({ item }) => {
            const p = item.product;
            const img = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
            const price = p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price;
            return (
              <Pressable
                style={s.card}
                onPress={() => router.push(`/(app)/product/${p.slug}` as any)}
              >
                <View style={s.cardImg}>
                  {img ? (
                    <Image source={{ uri: resolveImageUrl(img) }} style={s.img} resizeMode="cover" />
                  ) : (
                    <Feather name="droplet" size={24} color={C.sage} />
                  )}
                </View>
                <View style={s.cardBody}>
                  <Text style={s.brandName} numberOfLines={1}>
                    {p.seller?.storeName || 'Lucent'}
                    {p.seller?.isVerified && (
                      <Text style={{ color: C.sage }}> ✓</Text>
                    )}
                  </Text>
                  <Text style={s.productTitle} numberOfLines={2}>{p.title}</Text>
                  <Text style={s.productPrice}>{formatCurrency(price)}</Text>
                </View>
                <Pressable
                  style={s.heartBtn}
                  onPress={() => handleRemove(item.productId)}
                  hitSlop={10}
                >
                  <Feather name="heart" size={18} color={C.danger} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

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
  emptyTitle: { fontFamily: F.serifBold, fontSize: 22, color: C.ink, marginBottom: 8 },
  emptySub: {
    fontFamily: F.sansRegular,
    fontSize: 13.5,
    color: C.ink2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopBtn: {
    backgroundColor: C.sage,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: R.pill,
  },
  shopBtnText: { fontFamily: F.sans, fontSize: 14, color: '#fff', fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  cardImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  cardBody: { flex: 1, marginLeft: 12 },
  brandName: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginBottom: 2 },
  productTitle: { fontFamily: F.sans, fontSize: 13.5, color: C.ink, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontFamily: F.sans, fontSize: 14, color: C.sage, fontWeight: '700' },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
