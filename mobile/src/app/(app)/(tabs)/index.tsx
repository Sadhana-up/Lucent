import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
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
import { Logo } from '../../../components/lucent/ui';
import { api, formatCurrency, resolveImageUrl } from '../../../lib/api';
import { authClient } from '../../../lib/auth-client';
import { useCart } from '../../../lib/cart-context';
import { Category, Product, ProductImage } from '../../../lib/types';

const SKIN_TYPES = [
  { id: '', label: 'All Types' },
  { id: 'Oily', label: 'Oily' },
  { id: 'Dry', label: 'Dry' },
  { id: 'Combination', label: 'Combo' },
  { id: 'Sensitive', label: 'Sensitive' },
  { id: 'Normal', label: 'Normal' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest Arrivals' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
];

export default function ShopCatalogueScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart, totalCount } = useCart();
  const { data: session } = authClient.useSession();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSkinType, setSelectedSkinType] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
          skinType: selectedSkinType || undefined,
          maxPrice,
        }),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) {
        let prods = [...prodRes.data];
        if (sortBy === 'price_low') {
          prods.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_high') {
          prods.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'rating') {
          prods.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        }
        setProducts(prods);
      }
    } catch (e) {
      console.error('Error loading catalogue:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory, selectedSkinType, maxPrice, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddToCart = (product: Product) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    addToCart(product);
  };

  const activeFilterCount =
    (selectedSkinType ? 1 : 0) + (maxPrice ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  const resetFilters = () => {
    setSelectedSkinType('');
    setMaxPrice(undefined);
    setSortBy('newest');
    setSelectedCategory('');
    setSearch('');
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const primaryImg =
      item.images?.find((img: ProductImage) => img.isPrimary)?.url || item.images?.[0]?.url;
    const hasDiscount = item.discountPrice != null && item.discountPrice > 0;
    const currentPrice = hasDiscount ? item.discountPrice! : item.price;
    const discountPercent = hasDiscount
      ? Math.round(((item.price - item.discountPrice!) / item.price) * 100)
      : 0;

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
              <Feather name="image" size={26} color="#CBD0D8" />
            </View>
          )}

          {hasDiscount && (
            <View style={s.discountBadge}>
              <Text style={s.discountText}>-{discountPercent}%</Text>
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
            <Feather name="plus" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={s.cardBody}>
          {!!item.seller?.storeName && (
            <View style={s.brandRow}>
              <Text style={s.brandName} numberOfLines={1}>
                {item.seller.storeName}
              </Text>
              {item.seller.isVerified && (
                <Feather name="check-circle" size={11} color={C.sage} style={{ marginLeft: 3 }} />
              )}
            </View>
          )}

          <Text style={s.productTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {item.skinType && (
            <View style={s.skinTag}>
              <Text style={s.skinTagText} numberOfLines={1}>
                {item.skinType}
              </Text>
            </View>
          )}

          <View style={s.priceRow}>
            <View>
              <Text style={s.priceCurrent}>{formatCurrency(currentPrice)}</Text>
              {hasDiscount && (
                <Text style={s.priceOriginal}>{formatCurrency(item.price)}</Text>
              )}
            </View>

            {item.avgRating ? (
              <View style={s.ratingBox}>
                <Feather name="star" size={11} color="#E59819" />
                <Text style={s.ratingText}>{item.avgRating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={s.header}>
        <Logo size={28} />
        <View style={s.headerActions}>
          <Pressable
            style={s.iconButton}
            onPress={() => router.push('/(app)/(tabs)/chat')}
            accessibilityLabel="AI Skincare Consultant"
          >
            <Feather name="message-circle" size={20} color={C.sage} />
          </Pressable>
          <Pressable
            style={s.iconButton}
            onPress={() => router.push('/(app)/(tabs)/cart')}
            accessibilityLabel="Shopping Cart"
          >
            <Feather name="shopping-bag" size={20} color={C.ink} />
            {totalCount > 0 && (
              <View style={s.cartDot}>
                <Text style={s.cartDotText}>{totalCount > 9 ? '9+' : totalCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search Bar + Filter trigger */}
      <View style={s.searchBarContainer}>
        <View style={s.searchBar}>
          <Feather name="search" size={18} color={C.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search serums, cleansers, ingredients..."
            placeholderTextColor="#9EA3AE"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Feather name="x" size={16} color={C.muted} />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setFilterModalOpen(true);
          }}
        >
          <Feather
            name="sliders"
            size={18}
            color={activeFilterCount > 0 ? '#FFFFFF' : C.ink}
          />
          {activeFilterCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Categories Horizontal Carousel */}
      <View style={s.categoryListContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoryListContent}
        >
          <Pressable
            style={[s.catPill, selectedCategory === '' && s.catPillActive]}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setSelectedCategory('');
            }}
          >
            <Text style={[s.catPillText, selectedCategory === '' && s.catPillTextActive]}>
              All Skincare
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <Pressable
                key={cat.id}
                style={[s.catPill, active && s.catPillActive]}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedCategory(active ? '' : cat.slug);
                }}
              >
                <Text style={[s.catPillText, active && s.catPillTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content / Product Grid */}
      {loading ? (
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={C.sage} />
          <Text style={s.loadingText}>Curating botanical formulations...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={s.columnWrapper}
          contentContainerStyle={s.gridContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.sage}
              colors={[C.sage]}
            />
          }
          ListHeaderComponent={
            selectedCategory === '' && !search ? (
              <View style={s.promoBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={s.promoEyebrow}>VERIFIED BOTANICALS</Text>
                  <Text style={s.promoTitle}>Formulated for Himalayan Climates</Text>
                  <Text style={s.promoSub}>
                    Pure, non-comedogenic skincare from Nepal’s certified cosmetic artisans.
                  </Text>
                </View>
                <View style={s.promoTag}>
                  <Feather name="shield" size={16} color={C.sage} />
                </View>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Feather name="search" size={42} color="#D0D5DD" />
              <Text style={s.emptyTitle}>No formulations found</Text>
              <Text style={s.emptySub}>
                Try adjusting your search terms or relaxing skin type and price filters.
              </Text>
              <Pressable style={s.resetButton} onPress={resetFilters}>
                <Text style={s.resetButtonText}>Reset All Filters</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Refine Formulations</Text>
              <Pressable
                onPress={() => setFilterModalOpen(false)}
                hitSlop={12}
                style={s.modalClose}
              >
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Skin Type Filter */}
              <Text style={s.filterSectionTitle}>SKIN PROFILE</Text>
              <View style={s.pillRow}>
                {SKIN_TYPES.map((st) => {
                  const isSel = selectedSkinType === st.id;
                  return (
                    <Pressable
                      key={st.id}
                      style={[s.modalPill, isSel && s.modalPillActive]}
                      onPress={() => setSelectedSkinType(isSel ? '' : st.id)}
                    >
                      <Text style={[s.modalPillText, isSel && s.modalPillTextActive]}>
                        {st.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Sort By */}
              <Text style={[s.filterSectionTitle, { marginTop: 20 }]}>SORT BY</Text>
              <View style={s.sortGroup}>
                {SORT_OPTIONS.map((opt) => {
                  const isSel = sortBy === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={[s.sortOption, isSel && s.sortOptionActive]}
                      onPress={() => setSortBy(opt.id)}
                    >
                      <Text style={[s.sortOptionText, isSel && s.sortOptionTextActive]}>
                        {opt.label}
                      </Text>
                      {isSel && <Feather name="check" size={16} color={C.sage} />}
                    </Pressable>
                  );
                })}
              </View>

              {/* Price range quick buttons */}
              <Text style={[s.filterSectionTitle, { marginTop: 20 }]}>MAX PRICE</Text>
              <View style={s.pillRow}>
                {[undefined, 1000, 2500, 5000].map((pr, idx) => {
                  const isSel = maxPrice === pr;
                  return (
                    <Pressable
                      key={idx}
                      style={[s.modalPill, isSel && s.modalPillActive]}
                      onPress={() => setMaxPrice(pr)}
                    >
                      <Text style={[s.modalPillText, isSel && s.modalPillTextActive]}>
                        {pr ? `Under Rs. ${pr}` : 'Any Price'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={s.modalActionRow}>
              <Pressable style={s.modalResetBtn} onPress={resetFilters}>
                <Text style={s.modalResetText}>Reset</Text>
              </Pressable>
              <Pressable
                style={s.modalApplyBtn}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setFilterModalOpen(false);
                  loadData();
                }}
              >
                <Text style={s.modalApplyText}>Show Formulations</Text>
              </Pressable>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EDE7DE',
  },
  cartDot: {
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
  cartDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: F.sans,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    height: 44,
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
    fontSize: 13.5,
    color: C.ink,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  filterBtnActive: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: C.rose,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: F.sans,
    fontWeight: '700',
  },
  categoryListContainer: {
    marginBottom: 10,
  },
  categoryListContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: R.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E0D6',
  },
  catPillActive: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  catPillText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.ink2,
    fontWeight: '500',
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gridContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF0EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4E3D7',
  },
  promoEyebrow: {
    fontFamily: F.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: C.sage,
    fontWeight: '600',
    marginBottom: 4,
  },
  promoTitle: {
    fontFamily: F.serifBold,
    fontSize: 19,
    color: C.ink,
    lineHeight: 22,
  },
  promoSub: {
    fontFamily: F.sansRegular,
    fontSize: 11.5,
    color: C.ink2,
    marginTop: 4,
  },
  promoTag: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  productCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE6DD',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  imageBox: {
    width: '100%',
    height: 155,
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
    backgroundColor: '#F0ECE6',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.rose,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '700',
  },
  addBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardBody: {
    padding: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  brandName: {
    fontFamily: F.sansRegular,
    fontSize: 10.5,
    color: C.ink2,
    maxWidth: '85%',
  },
  productTitle: {
    fontFamily: F.sans,
    fontSize: 13,
    lineHeight: 17,
    color: C.ink,
    fontWeight: '600',
    minHeight: 34,
  },
  skinTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4EFEA',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 4,
    marginBottom: 6,
  },
  skinTagText: {
    fontFamily: F.sansRegular,
    fontSize: 9.5,
    color: C.sage,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceCurrent: {
    fontFamily: F.sans,
    fontSize: 13.5,
    color: C.sage,
    fontWeight: '700',
  },
  priceOriginal: {
    fontFamily: F.sansRegular,
    fontSize: 10.5,
    color: C.muted,
    textDecorationLine: 'line-through',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontFamily: F.sans,
    fontSize: 11,
    color: C.ink2,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink2,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontFamily: F.serifBold,
    fontSize: 22,
    color: C.ink,
    marginTop: 14,
  },
  emptySub: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink2,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetButton: {
    marginTop: 18,
    backgroundColor: C.sage,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: R.pill,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 13,
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
    paddingHorizontal: 20,
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
  modalClose: {
    padding: 4,
  },
  filterSectionTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '600',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: R.pill,
    backgroundColor: '#F4EFEA',
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  modalPillActive: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  modalPillText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.ink,
  },
  modalPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortGroup: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8F6F2',
  },
  sortOptionActive: {
    backgroundColor: '#EDF4EF',
  },
  sortOptionText: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink,
  },
  sortOptionTextActive: {
    color: C.sage,
    fontWeight: '600',
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  modalResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8D3CB',
  },
  modalResetText: {
    fontFamily: F.sans,
    fontSize: 14,
    color: C.ink2,
    fontWeight: '600',
  },
  modalApplyBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyText: {
    fontFamily: F.sans,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
