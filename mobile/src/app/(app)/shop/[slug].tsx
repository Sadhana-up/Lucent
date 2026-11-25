import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
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
import { useCart } from '../../../lib/cart-context';
import { Product, ProductImage, SellerProfile } from '../../../lib/types';

export default function ShopDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart, totalCount } = useCart();

  const [shop, setShop] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShop() {
      if (!slug) return;
      try {
        const res = await api.getShop(slug);
        if (res.data) {
          setShop(res.data);
        }
      } catch (e) {
        console.error('Failed to load shop:', e);
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [slug]);

  const handleAddToCart = (product: Product) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    addToCart(product);
  };

  if (loading) {
    return (
      <View style={[s.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.sage} />
        <Text style={s.loadingText}>Opening artisan apothecary doors...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={[s.centerBox, { paddingTop: insets.top }]}>
        <Feather name="alert-circle" size={40} color={C.danger} />
        <Text style={s.errorTitle}>Apothecary Not Found</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const initial = shop.storeName?.trim()?.[0]?.toUpperCase() || 'S';

  const renderProduct = ({ item }: { item: Product }) => {
    const primaryImg =
      item.images?.find((img: ProductImage) => img.isPrimary)?.url || item.images?.[0]?.url;
    const hasDiscount = item.discountPrice != null && item.discountPrice > 0;
    const currentPrice = hasDiscount ? item.discountPrice! : item.price;

    return (
      <Pressable
        style={s.productCard}
        onPress={() => router.push(`/(app)/product/${item.slug}` as any)}
      >
        <View style={s.imageBox}>
          {primaryImg ? (
            <Image
              source={{ uri: resolveImageUrl(primaryImg) }}
              style={s.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={s.placeholderBox}>
              <Feather name="droplet" size={24} color={C.sage} />
            </View>
          )}

          <Pressable
            style={s.addBtn}
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
          >
            <Feather name="plus" size={17} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={s.cardBody}>
          <Text style={s.productTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {item.skinType && (
            <View style={s.skinTag}>
              <Text style={s.skinTagText}>{item.skinType}</Text>
            </View>
          )}

          <View style={s.priceRow}>
            <Text style={s.priceCurrent}>{formatCurrency(currentPrice)}</Text>
            {hasDiscount && (
              <Text style={s.priceOriginal}>{formatCurrency(item.price)}</Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={s.root}>
      {/* Floating Top Nav */}
      <View style={[s.topBar, { top: insets.top + 8 }]}>
        <Pressable
          style={s.topBarBtn}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Feather name="arrow-left" size={20} color={C.ink} />
        </Pressable>

        <Pressable
          style={s.topBarBtn}
          onPress={() => router.push('/(app)/(tabs)/cart')}
          hitSlop={10}
        >
          <Feather name="shopping-bag" size={20} color={C.ink} />
          {totalCount > 0 && (
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{totalCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={shop.products || []}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={s.columnWrapper}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Banner */}
            <View style={s.bannerBox}>
              {shop.banner ? (
                <Image
                  source={{ uri: resolveImageUrl(shop.banner) }}
                  style={s.bannerImage}
                />
              ) : (
                <View style={s.defaultBanner} />
              )}
            </View>

            {/* Shop Profile Info Card */}
            <View style={s.profileCard}>
              <View style={s.logoWrapper}>
                {shop.logo ? (
                  <Image
                    source={{ uri: resolveImageUrl(shop.logo) }}
                    style={s.logoImg}
                  />
                ) : (
                  <View style={s.logoFallback}>
                    <Text style={s.logoFallbackText}>{initial}</Text>
                  </View>
                )}
              </View>

              <View style={s.titleRow}>
                <Text style={s.storeTitle}>{shop.storeName}</Text>
                {shop.isVerified && (
                  <View style={s.verifiedBadge}>
                    <Feather name="check-circle" size={12} color={C.sage} />
                    <Text style={s.verifiedBadgeText}>VERIFIED</Text>
                  </View>
                )}
              </View>

              {shop.bio ? <Text style={s.bioText}>{shop.bio}</Text> : null}

              {/* Stats Bar */}
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{shop.totalProducts || shop.products?.length || 0}</Text>
                  <Text style={s.statLabel}>Formulations</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statBox}>
                  <Text style={s.statValue}>
                    {shop.avgRating ? `${shop.avgRating.toFixed(1)} ★` : 'Pure'}
                  </Text>
                  <Text style={s.statLabel}>Rating</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statBox}>
                  <Text style={s.statValue}>Nepal</Text>
                  <Text style={s.statLabel}>Origin</Text>
                </View>
              </View>

              {/* Contact info if available */}
              {(shop.contactEmail || shop.phone) && (
                <View style={s.contactRow}>
                  {shop.contactEmail && (
                    <View style={s.contactItem}>
                      <Feather name="mail" size={13} color={C.muted} />
                      <Text style={s.contactText}>{shop.contactEmail}</Text>
                    </View>
                  )}
                  {shop.phone && (
                    <View style={s.contactItem}>
                      <Feather name="phone" size={13} color={C.muted} />
                      <Text style={s.contactText}>{shop.phone}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={s.catalogHeading}>
              <Text style={s.catalogHeadingText}>AVAILABLE FORMULATIONS</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Feather name="package" size={36} color="#CBD0D8" />
            <Text style={s.emptyTitle}>No products listed yet</Text>
            <Text style={s.emptySub}>
              This apothecary is currently handcrafting their next batch.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: C.sage,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: F.sans,
    fontWeight: '700',
  },
  bannerBox: {
    height: 140,
    backgroundColor: '#E4EDE7',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  defaultBanner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D9E6DC',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    marginTop: -44,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontFamily: F.serifBold,
    fontSize: 26,
    color: '#FFFFFF',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeTitle: {
    fontFamily: F.serifBold,
    fontSize: 24,
    color: C.ink,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.pill,
  },
  verifiedBadgeText: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.sage,
    fontWeight: '700',
  },
  bioText: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: C.ink2,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8F6F2',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: F.sans,
    fontSize: 15,
    color: C.sage,
    fontWeight: '700',
  },
  statLabel: {
    fontFamily: F.sansRegular,
    fontSize: 10.5,
    color: C.ink2,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E0D8',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontFamily: F.sansRegular,
    fontSize: 11.5,
    color: C.ink2,
  },
  catalogHeading: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  catalogHeadingText: {
    fontFamily: F.mono,
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '700',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  productCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE6DD',
  },
  imageBox: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3EFEA',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 10,
  },
  productTitle: {
    fontFamily: F.sans,
    fontSize: 12.5,
    color: C.ink,
    lineHeight: 16,
    fontWeight: '600',
    minHeight: 32,
  },
  skinTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4EFEA',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 4,
  },
  skinTagText: {
    fontFamily: F.sansRegular,
    fontSize: 9,
    color: C.sage,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  priceCurrent: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.sage,
    fontWeight: '700',
  },
  priceOriginal: {
    fontFamily: F.sansRegular,
    fontSize: 10,
    color: C.muted,
    textDecorationLine: 'line-through',
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
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontFamily: F.serifBold,
    fontSize: 18,
    color: C.ink,
    marginTop: 10,
  },
  emptySub: {
    fontFamily: F.sansRegular,
    fontSize: 12.5,
    color: C.ink2,
    textAlign: 'center',
    marginTop: 4,
  },
});
