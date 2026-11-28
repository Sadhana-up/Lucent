import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { C, F, R } from '../../../components/lucent/theme';
import { api, formatCurrency, resolveImageUrl } from '../../../lib/api';
import { Category, Product, SellerProfile } from '../../../lib/types';

type SortOption = 'featured' | 'name' | 'newest' | 'products';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'products', label: 'Most Formulations' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'newest', label: 'Newest' },
];

export default function ShopsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [shops, setShops] = useState<SellerProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  const loadShops = useCallback(async () => {
    try {
      const res = await api.getShops({
        search: search.trim() || undefined,
        verified: verifiedOnly || undefined,
        category: selectedCategory || undefined,
        sort: sortOption === 'products' ? undefined : sortOption,
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
  }, [search, verifiedOnly, selectedCategory, sortOption]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadShops();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadShops]);

  useEffect(() => {
    api.getCategories().then((res) => {
      if (res.data) setCategories(res.data.filter((c) => !c.isDisabled));
    });
  }, []);

  const displayedShops = sortOption === 'products'
    ? [...shops].sort((a, b) => (b._count?.products || 0) - (a._count?.products || 0))
    : shops;

  const hasFilters = !!search || verifiedOnly || !!selectedCategory || sortOption !== 'featured';

  const clearFilters = () => {
    setSearch('');
    setVerifiedOnly(false);
    setSelectedCategory('');
    setSortOption('featured');
  };

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
          router.push({ pathname: '/(app)/shop/[slug]', params: { slug: item.storeSlug } });
        }}
      >
        {/* Banner area */}
        <View style={s.bannerBox}>
          {item.banner ? (
            <Image
              alt=""
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
                alt=""
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
                        alt=""
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
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Feather
            name="check-circle"
            size={14}
            color={verifiedOnly ? '#FFFFFF' : C.sage}
          />
          <Text
            style={[s.toggleBtnText, verifiedOnly && s.toggleBtnTextActive]}
            numberOfLines={1}
          >
            Verified
          </Text>
        </Pressable>
      </View>

      {/* Category + sort filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.chipRow}
      >
        <Pressable
          style={[s.chip, !selectedCategory && s.chipActive]}
          onPress={() => setSelectedCategory('')}
        >
          <Text style={[s.chipText, !selectedCategory && s.chipTextActive]} numberOfLines={1}>
            All Formulators
          </Text>
        </Pressable>
        {categories.map((cat) => {
          const selected = selectedCategory === cat.slug;
          return (
            <Pressable
              key={cat.id}
              style={[s.chip, selected && s.chipActive]}
              onPress={() => setSelectedCategory(selected ? '' : cat.slug)}
            >
              <Text style={[s.chipText, selected && s.chipTextActive]} numberOfLines={1}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[s.filterScroll, s.sortScroll]}
        contentContainerStyle={s.sortRow}
      >
        {SORT_OPTIONS.map((opt) => {
          const selected = sortOption === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[s.sortChip, selected && s.sortChipActive]}
              onPress={() => setSortOption(opt.value)}
            >
              <Feather
                name="sliders"
                size={11}
                color={selected ? C.sage : C.muted}
              />
              <Text style={[s.sortChipText, selected && s.sortChipTextActive]} numberOfLines={1}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
        {hasFilters && (
          <Pressable style={s.resetChip} onPress={clearFilters}>
            <Feather name="x" size={11} color="#B42318" />
            <Text style={s.resetChipText} numberOfLines={1}>
              Reset
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={C.sage} />
          <Text style={s.loadingText}>Loading verified formulators...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedShops}
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
                Try a different keyword, category, or remove the verified filter.
              </Text>
              {hasFilters && (
                <Pressable style={s.emptyResetBtn} onPress={clearFilters}>
                  <Text style={s.emptyResetText}>Reset All Filters</Text>
                </Pressable>
              )}
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
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    minWidth: 100,
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
  filterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 44,
  },
  sortScroll: {
    height: 38,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingRight: 24,
    gap: 8,
    height: 44,
  },
  chip: {
    flexShrink: 0,
    maxWidth: 190,
    height: 32,
    paddingHorizontal: 13,
    borderRadius: R.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  chipText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.ink2,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingRight: 24,
    gap: 8,
    height: 38,
  },
  sortChip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: R.pill,
    backgroundColor: '#F3EFE9',
  },
  sortChipActive: {
    backgroundColor: '#E7F3EA',
  },
  sortChipText: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.muted,
  },
  sortChipTextActive: {
    color: C.sage,
    fontWeight: '600',
  },
  resetChip: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: R.pill,
    backgroundColor: '#FEE4E2',
  },
  resetChipText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: '#B42318',
    fontWeight: '600',
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
  emptyResetBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: R.pill,
    backgroundColor: C.sage,
  },
  emptyResetText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
