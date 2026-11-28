import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { C, F, R } from '../../../components/lucent/theme';
import { api, formatCurrency, resolveImageUrl } from '../../../lib/api';
import { useCart } from '../../../lib/cart-context';
import { Product, ProductImage, Review } from '../../../lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart, totalCount } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        const [res, wishRes] = await Promise.all([
          api.getProduct(slug),
          api.getWishlist(1, 100),
        ]);
        if (res.data) {
          setProduct(res.data);
          if (wishRes.data) {
            setWishlisted(wishRes.data.some((w) => w.productId === res.data!.id));
          }
        }
      } catch (e) {
        console.error('Failed to load product:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const handleToggleWishlist = async () => {
    if (!product || togglingWishlist) return;
    setTogglingWishlist(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const prev = wishlisted;
    setWishlisted(!prev);
    const res = await api.toggleWishlist(product.id);
    if (res.error) {
      setWishlisted(prev);
      Alert.alert('Wishlist', res.error);
    } else if (res.data) {
      setWishlisted(res.data.wishlisted);
    }
    setTogglingWishlist(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2400);
  };

  const handleSubmitReview = async () => {
    if (!product) return;
    setSubmittingReview(true);
    try {
      const res = await api.submitReview(product.slug, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      if (res.error) {
        Alert.alert('Review Unavailable', res.error);
        return;
      }
      if (res.data) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const updatedRes = await api.getProduct(product.slug);
        if (updatedRes.data) setProduct(updatedRes.data);
        setReviewModalOpen(false);
        setReviewComment('');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={C.sage} />
        <Text style={s.loadingText}>Unveiling formulation notes...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[s.centerBox, { paddingTop: insets.top }]}>
        <Feather name="alert-circle" size={40} color={C.danger} />
        <Text style={s.errorTitle}>Formulation Not Found</Text>
        <Pressable style={s.backHomeBtn} onPress={() => router.back()}>
          <Text style={s.backHomeText}>Return to Catalogue</Text>
        </Pressable>
      </View>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
  const hasDiscount = product.discountPrice != null && product.discountPrice > 0;
  const currentPrice = hasDiscount ? product.discountPrice! : product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <View style={s.root}>
      {/* Custom Floating Top Bar */}
      <View style={[s.topBar, { top: insets.top + 8 }]}>
        <Pressable
          style={s.topBarBtn}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Feather name="arrow-left" size={20} color={C.ink} />
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            style={s.topBarBtn}
            onPress={handleToggleWishlist}
            hitSlop={10}
          >
            <Feather
              name="heart"
              size={20}
              color={wishlisted ? C.danger : C.ink}
            />
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Image Gallery */}
        <View style={s.galleryBox}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(idx);
              }}
              scrollEventThrottle={16}
            >
              {images.map((img: ProductImage) => (
                <Image
                  key={img.id}
                  source={{ uri: resolveImageUrl(img.url) }}
                  style={s.galleryImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={s.galleryFallback}>
              <Feather name="droplet" size={48} color={C.sage} />
            </View>
          )}

          {hasDiscount && (
            <View style={s.discountBadge}>
              <Text style={s.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}

          {images.length > 1 && (
            <View style={s.paginationDots}>
              {images.map((_: any, i: number) => (
                <View
                  key={i}
                  style={[s.dot, i === activeImageIndex && s.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Sheet */}
        <View style={s.contentSheet}>
          {/* Seller / Store Pill */}
          {product.seller && (
            <Pressable
              style={s.sellerRow}
              onPress={() => router.push(`/(app)/shop/${product.seller?.storeSlug}` as any)}
            >
              <View style={s.sellerLogoBox}>
                {product.seller.logo ? (
                  <Image
                    source={{ uri: resolveImageUrl(product.seller.logo) }}
                    style={s.sellerLogo}
                  />
                ) : (
                  <Feather name="award" size={14} color={C.sage} />
                )}
              </View>
              <Text style={s.sellerName}>{product.seller.storeName}</Text>
              {product.seller.isVerified && (
                <Feather name="check-circle" size={13} color={C.sage} />
              )}
              <Feather
                name="chevron-right"
                size={14}
                color={C.muted}
                style={{ marginLeft: 'auto' }}
              />
            </Pressable>
          )}

          {/* Title & Rating */}
          <Text style={s.title}>{product.title}</Text>

          <View style={s.metaRow}>
            {product.avgRating ? (
              <View style={s.ratingPill}>
                <Feather name="star" size={13} color="#E59819" />
                <Text style={s.ratingScore}>{product.avgRating.toFixed(1)}</Text>
                <Text style={s.ratingCount}>({product.reviewCount || 0} reviews)</Text>
              </View>
            ) : (
              <View style={s.ratingPill}>
                <Text style={s.ratingCount}>New Formulation</Text>
              </View>
            )}

            <View
              style={[
                s.stockBadge,
                product.stock > 0 ? s.stockIn : s.stockOut,
              ]}
            >
              <Text
                style={[
                  s.stockText,
                  product.stock > 0 ? s.stockInText : s.stockOutText,
                ]}
              >
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Price Row */}
          <View style={s.priceBox}>
            <Text style={s.currentPrice}>{formatCurrency(currentPrice)}</Text>
            {hasDiscount && (
              <Text style={s.originalPrice}>{formatCurrency(product.price)}</Text>
            )}
          </View>

          {/* Skin Type & Concerns Tags */}
          <View style={s.tagsRow}>
            {product.skinType && (
              <View style={s.tag}>
                <Feather name="user" size={12} color={C.sage} />
                <Text style={s.tagText}>For {product.skinType} Skin</Text>
              </View>
            )}
            {product.skinConcerns && (
              <View style={[s.tag, { backgroundColor: '#F0EBF9' }]}>
                <Feather name="target" size={12} color={C.violet} />
                <Text style={[s.tagText, { color: C.violet }]}>
                  Targets: {product.skinConcerns}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>THE FORMULATION</Text>
            <Text style={s.bodyText}>{product.description}</Text>
          </View>

          {/* Ingredients */}
          {product.ingredients && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>KEY BOTANICAL INGREDIENTS</Text>
              <View style={s.infoCard}>
                <Feather name="feather" size={18} color={C.sage} style={{ marginTop: 2 }} />
                <Text style={s.infoCardText}>{product.ingredients}</Text>
              </View>
            </View>
          )}

          {/* Usage Instructions */}
          {product.usageInstructions && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>APPLICATION RITUAL</Text>
              <View style={s.infoCard}>
                <Feather name="sun" size={18} color={C.sage} style={{ marginTop: 2 }} />
                <Text style={s.infoCardText}>{product.usageInstructions}</Text>
              </View>
            </View>
          )}

          {/* Reviews Section */}
          <View style={s.section}>
            <View style={s.reviewsHeader}>
              <Text style={s.sectionTitle}>COMMUNITY VERIFICATIONS</Text>
              <Pressable
                style={s.writeReviewBtn}
                onPress={() => setReviewModalOpen(true)}
              >
                <Feather name="edit-2" size={12} color={C.sage} />
                <Text style={s.writeReviewText}>Add Review</Text>
              </Pressable>
            </View>

            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev: Review) => (
                <View key={rev.id} style={s.reviewCard}>
                  <View style={s.reviewAuthorRow}>
                    <View style={s.reviewAvatar}>
                      <Text style={s.reviewAvatarText}>
                        {rev.user?.name?.[0] || 'L'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={s.reviewAuthor}>{rev.user?.name || 'Customer'}</Text>
                      <View style={s.starRow}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Feather
                            key={i}
                            name="star"
                            size={11}
                            color={i < rev.rating ? '#E59819' : '#D1D5DB'}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  {rev.comment && <Text style={s.reviewComment}>{rev.comment}</Text>}
                </View>
              ))
            ) : (
              <View style={s.noReviewsBox}>
                <Text style={s.noReviewsText}>
                  Be the first to share your experience with this formulation.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Added to Bag Toast Notification */}
      {addedToast && (
        <View style={[s.toastBox, { bottom: insets.bottom + 85 }]}>
          <Feather name="check" size={16} color="#FFFFFF" />
          <Text style={s.toastText}>Added to your apothecary bag</Text>
        </View>
      )}

      {/* Sticky Bottom Checkout / Add to Cart Bar */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Quantity selector */}
        <View style={s.qtyControl}>
          <Pressable
            style={s.qtyBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Feather name="minus" size={15} color={quantity <= 1 ? C.muted : C.ink} />
          </Pressable>
          <Text style={s.qtyText}>{quantity}</Text>
          <Pressable
            style={s.qtyBtn}
            onPress={() => setQuantity(Math.min(Math.max(1, product.stock), quantity + 1))}
            disabled={quantity >= product.stock}
          >
            <Feather name="plus" size={15} color={quantity >= product.stock ? C.muted : C.ink} />
          </Pressable>
        </View>

        {/* Add to Bag Button */}
        <Pressable
          style={[s.addToCartBtn, product.stock <= 0 && s.disabledBtn]}
          disabled={product.stock <= 0}
          onPress={handleAddToCart}
        >
          <Feather name="shopping-bag" size={18} color="#FFFFFF" />
          <Text style={s.addToCartText}>
            {product.stock > 0
              ? `Add to Bag · ${formatCurrency(currentPrice * quantity)}`
              : 'Currently Unavailable'}
          </Text>
        </Pressable>
      </View>

      {/* Write Review Modal */}
      <Modal
        visible={reviewModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setReviewModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Share Your Review</Text>
              <Pressable onPress={() => setReviewModalOpen(false)}>
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>

            <Text style={s.ratingSelectLabel}>Select Rating</Text>
            <View style={s.ratingSelectRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setReviewRating(star)}
                  style={{ padding: 6 }}
                >
                  <Feather
                    name="star"
                    size={30}
                    color={star <= reviewRating ? '#E59819' : '#D1D5DB'}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={s.commentLabel}>Your Experience (Optional)</Text>
            <TextInput
              style={s.commentInput}
              multiline
              numberOfLines={4}
              placeholder="Tell others how this formulation felt on your skin..."
              placeholderTextColor="#9EA3AF"
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <Pressable
              style={[s.submitReviewBtn, submittingReview && { opacity: 0.7 }]}
              disabled={submittingReview}
              onPress={handleSubmitReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.submitReviewText}>Submit Verification</Text>
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
  galleryBox: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.95,
    backgroundColor: '#F3EFEA',
    position: 'relative',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.95,
  },
  galleryFallback: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: C.rose,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  discountText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 11,
    fontWeight: '700',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  contentSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    minHeight: 500,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F5F1',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    gap: 6,
  },
  sellerLogoBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerLogo: {
    width: '100%',
    height: '100%',
  },
  sellerName: {
    fontFamily: F.sans,
    fontSize: 12.5,
    color: C.ink,
    fontWeight: '600',
  },
  title: {
    fontFamily: F.serifBold,
    fontSize: 26,
    color: C.ink,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScore: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink,
    fontWeight: '700',
  },
  ratingCount: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.ink2,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockIn: {
    backgroundColor: '#EDF5EF',
  },
  stockOut: {
    backgroundColor: '#FDECEC',
  },
  stockText: {
    fontFamily: F.mono,
    fontSize: 10,
    fontWeight: '600',
  },
  stockInText: {
    color: C.sage,
  },
  stockOutText: {
    color: C.danger,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  currentPrice: {
    fontFamily: F.sans,
    fontSize: 24,
    color: C.sage,
    fontWeight: '700',
  },
  originalPrice: {
    fontFamily: F.sansRegular,
    fontSize: 15,
    color: C.muted,
    textDecorationLine: 'line-through',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.pill,
  },
  tagText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: C.sage,
    fontWeight: '500',
  },
  section: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
    paddingTop: 18,
  },
  sectionTitle: {
    fontFamily: F.mono,
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '700',
    marginBottom: 8,
  },
  bodyText: {
    fontFamily: F.sansRegular,
    fontSize: 14,
    lineHeight: 22,
    color: C.ink2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  infoCardText: {
    flex: 1,
    fontFamily: F.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    color: C.ink,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
  },
  writeReviewText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: C.sage,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewAuthor: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.ink,
    fontWeight: '600',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewComment: {
    fontFamily: F.sansRegular,
    fontSize: 12.5,
    color: C.ink2,
    marginTop: 6,
    lineHeight: 18,
  },
  noReviewsBox: {
    paddingVertical: 14,
  },
  noReviewsText: {
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.muted,
    fontStyle: 'italic',
  },
  toastBox: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#1E3D2A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: R.pill,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
  },
  toastText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECE5DB',
    gap: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4EFE9',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: F.sans,
    fontSize: 14,
    color: C.ink,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  addToCartBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.sage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledBtn: {
    backgroundColor: '#B4BCB6',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 14,
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
  backHomeBtn: {
    marginTop: 16,
    backgroundColor: C.sage,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: R.pill,
  },
  backHomeText: {
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
  ratingSelectLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '600',
    marginBottom: 6,
  },
  ratingSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  commentLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.muted,
    fontWeight: '600',
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 14,
    padding: 12,
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 20,
  },
  submitReviewBtn: {
    backgroundColor: C.sage,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 14,
    fontWeight: '600',
  },
});
