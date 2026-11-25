import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
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
import { Product, SellerProfile } from '../../../lib/types';

export default function ShopsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [shops, setShops] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const loadShops = useCallback(async () => {
    try {
      const res = await api.getShops({
        search: search.trim() || undefined,
        verified: verifiedOnly || undefined,
      });
      if (res.data) {
        setShops(res.data);
      }
    } catch (e) {
      console.error('Failed to load shops:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, verifiedOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadShops();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadShops]);

  const onRefresh = () => {
    setRefreshing(true);
    loadShops();
  };

  const renderShopCard = ({ item }: { item: SellerProfile }) => {
    const initial = item.storeName?.trim()?.[0]?.toUpperCase() || 'S';

    return (
      <Pressable
        style={s.shopCard}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push(`/(app)/shop/${item.storeSlug}` as any);
        }}
      >
        {/* Banner area */}
        <View style={s.bannerBox}>
          {item.banner ? (
            <Image
              source={{ uri: resolveImageUrl(item.banner) }}
              style={s.bannerImg}
              resizeMode="cover"
            />
          ) : (
            <View style={s.defaultBanner}>
              <View style={s.bannerGlow} />
            </View>
          )}

          {item.isVerified && (
            <View style={s.verifiedTag}>
              <Feather name="check-circle" size={12} color={C.sage} />
              <Text style={s.verifiedTagText}>VERIFIED LAB</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={s.cardContent}>
          <View style={s.logoAndTitleRow}>
            {item.logo ? (
              <Image
                source={{ uri: resolveImageUrl(item.logo) }}
                style={s.storeLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={s.logoFallback}>
                <Text style={s.logoFallbackText}>{initial}</Text>
              </View>
            )}

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.storeTitle} numberOfLines={1}>
                {item.storeName}
              </Text>
              <Text style={s.storeMeta}>
                {item._count?.products ?? (item.products?.length || 0)} formulations
                {item.contactEmail ? ` · ${item.contactEmail}` : ''}
              </Text>
            </View>

            <View style={s.visitPill}>
              <Text style={s.visitText}>Visit</Text>
              <Feather name="chevron-right" size={14} color={C.sage} />
            </View>
          </View>

          {item.bio ? (
            <Text style={s.bioText} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}

          {/* Sample Products preview */}
          {item.products && item.products.length > 0 && (
            <View style={s.productPreviewRow}>
              {item.products.slice(0, 3).map((prod: Product) => {
                const img = prod.images?.[0]?.url;
                return (
                  <View key={prod.id} style={s.previewThumbBox}>
                    {img ? (
                      <Image
                        source={{ uri: resolveImageUrl(img) }}
                        style={s.previewThumb}
                      />
                    ) : (
                      <View style={s.previewThumbFallback}>
                        <Feather name="droplet" size={14} color={C.sage} />
                      </View>
                    )}
                    <Text style={s.previewPrice} numberOfLines={1}>
                      {formatCurrency(prod.discountPrice || prod.price)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>BOTANICAL DIRECTORY</Text>
          <Text style={s.title}>Artisan Apothecaries</Text>
        </View>
      </View>

      {/* Search and Verified toggle */}
      <View style={s.filterRow}>
        <View style={s.searchBox}>
          <Feather name="search" size={17} color={C.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search stores or apothecaries..."
            placeholderTextColor="#9FA4AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={C.muted} />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[s.toggleBtn, verifiedOnly && s.toggleBtnActive]}
          onPress={() => setVerifiedOnly(!verifiedOnly)}
        >
          <Feather
            name="check-circle"
            size={14}
            color={verifiedOnly ? '#FFFFFF' : C.sage}
          />
          <Text style={[s.toggleBtnText, verifiedOnly && s.toggleBtnTextActive]}>
            Verified
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={C.sage} />
          <Text style={s.loadingText}>Loading verified formulators...</Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => item.id}
          renderItem={renderShopCard}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.sage}
              colors={[C.sage]}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="home" size={40} color="#D1D5DB" />
              <Text style={s.emptyTitle}>No apothecaries found</Text>
              <Text style={s.emptySub}>
                Try adjusting your search query or removing the verified filter.
              </Text>
            </View>
          }
        />
      )}
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
    paddingBottom: 10,
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  searchBox: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  toggleBtnActive: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  toggleBtnText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.ink,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 16,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE5DB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  bannerBox: {
    height: 90,
    backgroundColor: '#E7EFEA',
    position: 'relative',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  defaultBanner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E3EDE6',
  },
  bannerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(45,90,61,0.08)',
  },
  verifiedTag: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.pill,
  },
  verifiedTagText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: C.sage,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
  },
  logoAndTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 8,
  },
  storeLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  logoFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logoFallbackText: {
    color: '#FFFFFF',
    fontFamily: F.serifBold,
    fontSize: 22,
  },
  storeTitle: {
    fontFamily: F.serifBold,
    fontSize: 18,
    color: C.ink,
  },
  storeMeta: {
    fontFamily: F.sansRegular,
    fontSize: 11.5,
    color: C.ink2,
    marginTop: 2,
  },
  visitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F3EFE9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.pill,
  },
  visitText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: C.sage,
    fontWeight: '600',
  },
  bioText: {
    fontFamily: F.sansRegular,
    fontSize: 12.5,
    color: C.ink2,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  productPreviewRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
  },
  previewThumbBox: {
    flex: 1,
    alignItems: 'center',
  },
  previewThumb: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0EBE4',
  },
  previewThumbFallback: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0EBE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPrice: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.sage,
    fontWeight: '600',
    marginTop: 4,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink2,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontFamily: F.serifBold,
    fontSize: 20,
    color: C.ink,
    marginTop: 12,
  },
  emptySub: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink2,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
});
