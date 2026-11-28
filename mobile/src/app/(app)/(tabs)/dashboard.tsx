import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  AdminStats,
  AuditEntry,
  Category,
  Order,
  Product,
  SellerOrder,
  SellerProfile,
  UserProfile,
  UserSummary,
} from '../../../lib/types';

const SKIN_TYPES = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Acne-Prone'];
const RECENT_WINDOW_START = Date.now() - 30 * 86_400_000;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const user = session?.user;
  const userRole = (user?.role || 'customer').toLowerCase();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'seller' | 'admin'>(
    userRole === 'admin' ? 'admin' : userRole === 'seller' ? 'seller' : 'customer'
  );

  // Customer Data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [selectedSkinType, setSelectedSkinType] = useState<string>('');
  const [savingSkin, setSavingSkin] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreBio, setNewStoreBio] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('98');

  // Seller Data
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [sellerSubTab, setSellerSubTab] = useState<'orders' | 'inventory'>('orders');
  const [sellerProductSearch, setSellerProductSearch] = useState('');
  const [sellerProductStatus, setSellerProductStatus] = useState('ALL');

  // Admin Data
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserSummary[]>([]);
  const [adminSellers, setAdminSellers] = useState<SellerProfile[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [adminSubTab, setAdminSubTab] = useState<
    'analytics' | 'orders' | 'sellers' | 'users' | 'categories' | 'audit'
  >('analytics');
  const [userSearch, setUserSearch] = useState('');
  const [newCatModalOpen, setNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Ban Reason Modal
  const [banTarget, setBanTarget] = useState<{ userId: string; name: string } | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const [profRes, ordersRes] = await Promise.all([api.getProfile(), api.getOrders()]);
      if (profRes.data) {
        setProfile(profRes.data);
        setSelectedSkinType(profRes.data.skinType || '');
      }
      if (ordersRes.data) setCustomerOrders(ordersRes.data);

      if (userRole === 'seller' || userRole === 'admin') {
        const [sProfRes, prodRes, sOrdersRes] = await Promise.all([
          api.getSellerProfile(),
          api.getSellerProducts({ limit: 100 }),
          api.getSellerOrders(),
        ]);
        if (sProfRes.data) setSellerProfile(sProfRes.data);
        if (prodRes.data) setSellerProducts(prodRes.data);
        if (sOrdersRes.data) setSellerOrders(sOrdersRes.data);
      }

      if (userRole === 'admin') {
        const [statRes, usersRes, sellersRes, catsRes, aOrdersRes, auditRes] = await Promise.all([
          api.getAdminStats(),
          api.getAdminUsers(),
          api.getAdminSellers(),
          api.getCategories(),
          api.getAdminOrders(),
          api.getAuditLog(),
        ]);
        if (statRes.data) setAdminStats(statRes.data);
        if (usersRes.data) setAdminUsers(usersRes.data);
        if (sellersRes.data) setAdminSellers(sellersRes.data);
        if (catsRes.data) setAdminCategories(catsRes.data);
        if (aOrdersRes.data) setAdminOrders(aOrdersRes.data);
        if (auditRes.data?.entries) setAuditEntries(auditRes.data.entries);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const sellerStats = useMemo(() => {
    const billable = sellerOrders.filter(
      (o) => o.paymentStatus === 'PAID' && o.status !== 'CANCELLED' && o.status !== 'REFUNDED',
    );
    const recent = billable.filter((o) => new Date(o.createdAt).getTime() >= RECENT_WINDOW_START);
    return {
      revenue: billable.reduce((sum, o) => sum + Number(o.sellerSubtotal || 0), 0),
      monthRevenue: recent.reduce((sum, o) => sum + Number(o.sellerSubtotal || 0), 0),
      monthOrders: recent.length,
      toFulfil: sellerOrders.filter((o) =>
        ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status),
      ).length,
    };
  }, [sellerOrders]);

  const filteredSellerProducts = useMemo(() => {
    const query = sellerProductSearch.trim().toLowerCase();
    return sellerProducts.filter((p) => {
      const matchesQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        (p.category?.name || '').toLowerCase().includes(query);
      const outOfStock = Number(p.stock) <= 0 || p.status === 'OUT_OF_STOCK';
      const matchesStatus =
        sellerProductStatus === 'ALL' ||
        (sellerProductStatus === 'OUT_OF_STOCK'
          ? outOfStock
          : sellerProductStatus === 'ACTIVE'
            ? p.status === 'ACTIVE' && !outOfStock
            : p.status === sellerProductStatus);
      return matchesQuery && matchesStatus;
    });
  }, [sellerProducts, sellerProductSearch, sellerProductStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadAllData();
  };

  const handleSelectSkinType = async (st: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const prev = selectedSkinType;
    setSelectedSkinType(st);
    setSavingSkin(true);
    const res = await api.updateProfile({ skinType: st });
    setSavingSkin(false);
    if (res.error) {
      setSelectedSkinType(prev);
      Alert.alert('Update Failed', res.error);
    } else if (res.data) {
      setProfile(res.data);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you wish to end your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await authClient.signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  // Seller Action: Advance order status (PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED)
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PROCESSING',
      PROCESSING: 'SHIPPED',
      SHIPPED: 'DELIVERED',
    };
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setActionLoading(true);
    try {
      const res = await api.updateSellerOrder(orderId, 'set_status', { status: nextStatus });
      if (res.error) {
        Alert.alert('Update Failed', res.error);
        return;
      }
      if (res.data) {
        setSellerOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as SellerOrder['status'] } : o))
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Seller Action: Archive formulation
  const handleArchiveProduct = (slug: string) => {
    Alert.alert('Archive Formulation', 'Hide this formulation from your active storefront?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const res = await api.updateProduct(slug, { status: 'ARCHIVED' });
            if (res.error) {
              Alert.alert('Error', res.error);
              return;
            }
            setSellerProducts((prev) =>
              prev.map((p) => (p.slug === slug ? { ...p, status: 'ARCHIVED' } : p))
            );
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to archive formulation.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  // Seller Action: Create seller store
  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      Alert.alert('Missing Info', 'Please enter a store or laboratory name.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.updateSellerProfile({
        storeName: newStoreName.trim(),
        bio: newStoreBio.trim(),
        phone: newStorePhone.trim(),
      });
      if (res.error) {
        Alert.alert('Error', res.error);
        return;
      }
      if (res.data) {
        setSellerProfile(res.data);
        setStoreModalOpen(false);
        setActiveTab('seller');
        void loadAllData();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create store.');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Action: Verify/unverify seller
  const handleToggleVerifySeller = async (sellerId: string, current: boolean) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const res = await api.verifySeller(sellerId, !current);
    if (res.error) {
      Alert.alert('Error', res.error);
      return;
    }
    if (res.data) {
      setAdminSellers((prev) =>
        prev.map((sl) => (sl.id === sellerId ? { ...sl, isVerified: !current } : sl))
      );
    }
  };

  // Admin Action: Impersonate a user via Better Auth's admin plugin
  const handleImpersonate = (userId: string, name: string, targetRole: string) => {
    Alert.alert(
      'Impersonate User',
      `Sign in as ${name} to see the app exactly as they do? You can stop at any time from the banner.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Impersonate',
          onPress: async () => {
            setImpersonating(userId);
            try {
              const { error } = await authClient.admin.impersonateUser({ userId });
              if (error) {
                Alert.alert('Impersonation failed', error.message);
                return;
              }
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              await refetchSession();
              setActiveTab(
                targetRole === 'admin' ? 'admin' : targetRole === 'seller' ? 'seller' : 'customer',
              );
              router.replace('/(app)/(tabs)/dashboard');
            } catch {
              Alert.alert('Impersonation failed', 'Could not start the impersonation session.');
            } finally {
              setImpersonating(null);
            }
          },
        },
      ],
    );
  };

  // Admin Action: Update user role
  const handleUpdateUserRole = async (userId: string, targetRole: string) => {
    const res = await api.updateAdminUser({ userId, role: targetRole });
    if (res.error) {
      Alert.alert('Error', res.error);
      return;
    }
    if (res.data) {
      setAdminUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u)));
    }
  };

  // Admin Action: Unban or open Ban reason modal
  const handleToggleBanUser = async (u: UserSummary) => {
    if (u.banned) {
      const res = await api.updateAdminUser({ userId: u.id, banned: false });
      if (res.error) {
        Alert.alert('Error', res.error);
        return;
      }
      if (res.data) {
        setAdminUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, banned: false } : item)));
      }
    } else {
      setBanReasonInput('');
      setBanTarget({ userId: u.id, name: u.name });
    }
  };

  const handleConfirmBan = async () => {
    if (!banTarget) return;
    if (!banReasonInput.trim()) {
      Alert.alert('Reason Required', 'Please enter a reason for banning this user.');
      return;
    }
    const res = await api.updateAdminUser({
      userId: banTarget.userId,
      banned: true,
      banReason: banReasonInput.trim(),
    });
    if (res.error) {
      Alert.alert('Error', res.error);
      return;
    }
    setAdminUsers((prev) =>
      prev.map((item) =>
        item.id === banTarget.userId
          ? { ...item, banned: true, banReason: banReasonInput.trim() }
          : item
      )
    );
    setBanTarget(null);
    setBanReasonInput('');
  };

  // Admin Action: Update order status
  const handleAdminOrderAction = (ord: Order) => {
    const options: { text: string; onPress: () => void }[] = [];
    if (ord.status === 'RETURN_REQUESTED') {
      options.push({
        text: 'Approve Return & Refund',
        onPress: () => {
          void api.updateAdminOrder(ord.id, { status: 'REFUNDED', paymentStatus: 'REFUNDED' }).then((r) => {
            if (r.data) setAdminOrders((prev) => prev.map((o) => (o.id === ord.id ? r.data! : o)));
          });
        },
      });
    }
    if (ord.status !== 'CANCELLED' && ord.status !== 'DELIVERED' && ord.status !== 'REFUNDED') {
      options.push({
        text: 'Mark Delivered',
        onPress: () => {
          void api.updateAdminOrder(ord.id, { status: 'DELIVERED' }).then((r) => {
            if (r.data) setAdminOrders((prev) => prev.map((o) => (o.id === ord.id ? r.data! : o)));
          });
        },
      });
    }
    options.push({
      text: 'View Order Details',
      onPress: () => router.push(`/(app)/order/${ord.id}` as any),
    });
    options.push({ text: 'Cancel', onPress: () => {} });
    Alert.alert(ord.orderNumber, `Current status: ${ord.status}`, options);
  };

  // Admin Action: Create / Toggle Category
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await api.createCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim() || undefined,
    });
    if (res.error) {
      Alert.alert('Error', res.error);
      return;
    }
    if (res.data) {
      setAdminCategories((prev) => [...prev, res.data!]);
      setNewCatModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
    }
  };

  const handleToggleCategory = async (cat: Category) => {
    const res = await api.updateCategory(cat.id, { isDisabled: !cat.isDisabled });
    if (res.data) {
      setAdminCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isDisabled: !cat.isDisabled } : c)));
    }
  };

  const displayName = profile?.name || user?.name || 'Account';
  const displayEmail = profile?.email || user?.email || '';
  const avatarUrl = profile?.image || user?.image;
  const initial = displayName.trim()?.[0]?.toUpperCase() || displayEmail?.[0]?.toUpperCase() || 'L';
  const concernsList = (profile?.skinConcerns || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  if (loading && !refreshing) {
    return (
      <View style={[s.root, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={C.sage} />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <Logo size={26} />
        <View style={s.roleChip}>
          <Text style={s.roleChipText}>{userRole.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.sage} colors={[C.sage]} />
        }
      >
        {/* User Identity Card */}
        <Pressable style={s.userCard} onPress={() => router.push('/(app)/profile')}>
          <View style={s.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: resolveImageUrl(avatarUrl) }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarText}>{initial}</Text>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={s.userEmail} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
          <Pressable
            style={s.editProfileMiniBtn}
            onPress={() => router.push('/(app)/profile')}
            hitSlop={8}
          >
            <Feather name="edit-2" size={15} color={C.sage} />
          </Pressable>
          <Pressable style={s.signOutMiniBtn} onPress={handleSignOut} hitSlop={8}>
            <Feather name="log-out" size={16} color={C.danger} />
          </Pressable>
        </Pressable>

        {/* Role Switcher */}
        {(userRole === 'admin' || userRole === 'seller') && (
          <View style={s.roleSwitcherBar}>
            <Pressable
              style={[s.roleSwitchBtn, activeTab === 'customer' && s.roleSwitchBtnActive]}
              onPress={() => setActiveTab('customer')}
            >
              <Feather name="user" size={14} color={activeTab === 'customer' ? '#FFFFFF' : C.ink2} />
              <Text style={[s.roleSwitchText, activeTab === 'customer' && s.roleSwitchTextActive]}>
                Customer
              </Text>
            </Pressable>

            <Pressable
              style={[s.roleSwitchBtn, activeTab === 'seller' && s.roleSwitchBtnActive]}
              onPress={() => setActiveTab('seller')}
            >
              <Feather name="briefcase" size={14} color={activeTab === 'seller' ? '#FFFFFF' : C.ink2} />
              <Text style={[s.roleSwitchText, activeTab === 'seller' && s.roleSwitchTextActive]}>
                Seller Hub
              </Text>
            </Pressable>

            {userRole === 'admin' && (
              <Pressable
                style={[s.roleSwitchBtn, activeTab === 'admin' && s.roleSwitchBtnActive]}
                onPress={() => setActiveTab('admin')}
              >
                <Feather name="shield" size={14} color={activeTab === 'admin' ? '#FFFFFF' : C.ink2} />
                <Text style={[s.roleSwitchText, activeTab === 'admin' && s.roleSwitchTextActive]}>
                  Admin Hub
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* 1. CUSTOMER DASHBOARD TAB                                */}
        {/* ======================================================== */}
        {activeTab === 'customer' && (
          <View style={{ marginTop: 14 }}>
            {/* Quick Access: Routine & Wishlist */}
            <View style={s.quickGrid}>
              <Pressable style={s.quickCard} onPress={() => router.push('/(app)/routine')}>
                <View style={s.quickIconCircle}>
                  <Feather name="sun" size={18} color={C.sage} />
                </View>
                <Text style={s.quickTitle}>My Routine</Text>
                <Text style={s.quickSub}>AM & PM ritual</Text>
              </Pressable>

              <Pressable style={s.quickCard} onPress={() => router.push('/(app)/wishlist')}>
                <View style={[s.quickIconCircle, { backgroundColor: '#FDECEC' }]}>
                  <Feather name="heart" size={18} color={C.danger} />
                </View>
                <Text style={s.quickTitle}>My Wishlist</Text>
                <Text style={s.quickSub}>Saved items</Text>
              </Pressable>
            </View>

            {/* Skin Profile Config (Persisted via /api/profile) */}
            <View style={s.sectionCard}>
              <View style={s.sectionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sectionEyebrow}>SKIN PROFILE</Text>
                  <Text style={s.sectionTitle}>Your Skin Settings</Text>
                </View>
                <Pressable onPress={() => router.push('/(app)/profile')} hitSlop={8}>
                  <Text style={s.editLink}>
                    {savingSkin ? 'Saving...' : 'Edit Details'}
                  </Text>
                </Pressable>
              </View>

              <Text style={s.skinSub}>
                {selectedSkinType
                  ? `Active skin type: ${selectedSkinType}. Tap to update:`
                  : 'Select your skin type to personalize recommendations:'}
              </Text>

              <View style={s.skinPillRow}>
                {SKIN_TYPES.map((st) => {
                  const sel = selectedSkinType === st;
                  return (
                    <Pressable
                      key={st}
                      style={[s.skinPill, sel && s.skinPillActive]}
                      onPress={() => handleSelectSkinType(st)}
                    >
                      <Text style={[s.skinPillText, sel && s.skinPillTextActive]}>{st}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {concernsList.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={s.concernsLabel}>CONCERNS</Text>
                  <View style={s.skinPillRow}>
                    {concernsList.map((c) => (
                      <View key={c} style={s.concernTag}>
                        <Text style={s.concernTagText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Order History */}
            <View style={s.sectionCard}>
              <View style={s.sectionHeaderRow}>
                <View>
                  <Text style={s.sectionEyebrow}>PURCHASE HISTORY</Text>
                  <Text style={s.sectionTitle}>Your Orders ({customerOrders.length})</Text>
                </View>
              </View>

              {customerOrders.length === 0 ? (
                <View style={s.emptyBox}>
                  <Feather name="package" size={32} color="#CBD0D8" />
                  <Text style={s.emptyBoxTitle}>No orders placed yet</Text>
                  <Text style={s.emptyBoxSub}>
                    Browse our botanical catalogue to start your skin ritual.
                  </Text>
                </View>
              ) : (
                customerOrders.map((ord) => (
                  <Pressable
                    key={ord.id}
                    style={s.orderRow}
                    onPress={() => router.push(`/(app)/order/${ord.id}` as any)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.orderRowNumber}>{ord.orderNumber}</Text>
                      <Text style={s.orderRowMeta}>
                        {ord.items.length} item{ord.items.length !== 1 ? 's' : ''} ·{' '}
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={s.orderRowAmount}>{formatCurrency(ord.totalAmount)}</Text>
                      <View
                        style={[
                          s.orderStatusChip,
                          ord.status === 'DELIVERED' || ord.status === 'REFUNDED'
                            ? s.statusDelivered
                            : ord.status === 'CANCELLED' || ord.status === 'RETURN_REQUESTED'
                            ? s.statusCancelled
                            : s.statusPending,
                        ]}
                      >
                        <Text style={s.orderStatusChipText}>{ord.status}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>

            {/* Become Seller Card */}
            {userRole === 'customer' && (
              <View style={s.becomeSellerCard}>
                <Feather name="award" size={24} color={C.sage} style={{ marginBottom: 8 }} />
                <Text style={s.becomeSellerTitle}>Sell on Lucent</Text>
                <Text style={s.becomeSellerSub}>
                  Register your skincare brand or laboratory to publish formulations for customers across Nepal.
                </Text>
                <Pressable style={s.becomeSellerBtn} onPress={() => setStoreModalOpen(true)}>
                  <Text style={s.becomeSellerBtnText}>Register Your Store</Text>
                  <Feather name="arrow-right" size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* 2. SELLER DASHBOARD TAB                                  */}
        {/* ======================================================== */}
        {activeTab === 'seller' && (
          <View style={{ marginTop: 14 }}>
            <View style={s.sellerHeaderCard}>
              <View style={s.sellerTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sectionEyebrow}>SELLER HUB</Text>
                  <Text style={s.storeNameDisplay}>{sellerProfile?.storeName || 'My Store'}</Text>
                </View>
                <View style={s.sellerTopActions}>
                  <View
                    style={[
                      s.verifiedBadge,
                      sellerProfile?.isVerified ? s.verifiedTrue : s.verifiedPending,
                    ]}
                  >
                    <Feather
                      name={sellerProfile?.isVerified ? 'check-circle' : 'clock'}
                      size={12}
                      color={sellerProfile?.isVerified ? C.sage : '#D97706'}
                    />
                    <Text
                      style={[
                        s.verifiedText,
                        sellerProfile?.isVerified ? s.verifiedTextTrue : s.verifiedTextPending,
                      ]}
                    >
                      {sellerProfile?.isVerified ? 'VERIFIED' : 'PENDING AUDIT'}
                    </Text>
                  </View>
                  {sellerProfile && (
                    <Pressable
                      style={s.sellerIconBtn}
                      onPress={() => router.push('/(app)/seller/profile')}
                      hitSlop={6}
                    >
                      <Feather name="settings" size={15} color={C.sage} />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={s.kpiGrid}>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{sellerProducts.length}</Text>
                  <Text style={s.kpiLabel}>Products</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{sellerOrders.length}</Text>
                  <Text style={s.kpiLabel}>Orders</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{formatCurrency(sellerStats.revenue)}</Text>
                  <Text style={s.kpiLabel}>Paid revenue</Text>
                </View>
              </View>
              <Text style={s.sellerKpiMeta}>
                {formatCurrency(sellerStats.monthRevenue)} this month · {sellerStats.monthOrders} orders ·{' '}
                {sellerStats.toFulfil} to fulfil
              </Text>
            </View>

            <View style={s.subTabRow}>
              <Pressable
                style={[s.subTabBtn, sellerSubTab === 'orders' && s.subTabBtnActive]}
                onPress={() => setSellerSubTab('orders')}
              >
                <Text style={[s.subTabBtnText, sellerSubTab === 'orders' && s.subTabBtnTextActive]}>
                  Fulfillment ({sellerOrders.length})
                </Text>
              </Pressable>
              <Pressable
                style={[s.subTabBtn, sellerSubTab === 'inventory' && s.subTabBtnActive]}
                onPress={() => setSellerSubTab('inventory')}
              >
                <Text style={[s.subTabBtnText, sellerSubTab === 'inventory' && s.subTabBtnTextActive]}>
                  Catalogue ({sellerProducts.length})
                </Text>
              </Pressable>
            </View>

            {sellerSubTab === 'orders' && (
              <View style={s.sectionCard}>
                <View style={s.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitle}>Incoming Orders</Text>
                    <Text style={s.sectionSub}>
                      Latest {Math.min(sellerOrders.length, 5)} of {sellerOrders.length}
                    </Text>
                  </View>
                  <Pressable style={s.manageLink} onPress={() => router.push('/(app)/seller/orders')}>
                    <Text style={s.manageLinkText}>Manage all</Text>
                    <Feather name="arrow-right" size={13} color={C.sage} />
                  </Pressable>
                </View>
                {sellerOrders.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Feather name="inbox" size={30} color="#CBD0D8" />
                    <Text style={s.emptyBoxTitle}>No orders yet</Text>
                  </View>
                ) : (
                  sellerOrders.slice(0, 5).map((ord) => {
                    const nextLabel =
                      ord.status === 'PENDING'
                        ? 'Confirm'
                        : ord.status === 'CONFIRMED'
                        ? 'Processing'
                        : ord.status === 'PROCESSING'
                        ? 'Shipped'
                        : ord.status === 'SHIPPED'
                        ? 'Delivered'
                        : null;
                    return (
                      <View key={ord.id} style={s.sellerOrderCard}>
                        <View style={s.sellerOrderTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={s.orderRowNumber}>{ord.orderNumber}</Text>
                            <Text style={s.orderRowMeta}>
                              {ord.customer?.name || 'Customer'} · {new Date(ord.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <Text style={s.orderRowAmount}>{formatCurrency(ord.sellerSubtotal)}</Text>
                        </View>

                        <View style={s.sellerOrderBadges}>
                          <View style={s.statusPill}>
                            <Text style={s.statusPillText}>{ord.status}</Text>
                          </View>
                          <View style={[s.statusPill, { backgroundColor: '#F1EEFF' }]}>
                            <Text style={[s.statusPillText, { color: C.violet }]}>
                              {ord.paymentStatus}
                            </Text>
                          </View>
                          {ord.refundStatus !== 'NONE' && (
                            <View style={[s.statusPill, { backgroundColor: '#FEF3C7' }]}>
                              <Text style={[s.statusPillText, { color: '#B45309' }]}>
                                {ord.refundStatus}
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={s.sellerOrderActions}>
                          <Pressable
                            style={s.detailsLink}
                            onPress={() =>
                              router.push({ pathname: '/(app)/seller/orders', params: { orderId: ord.id } })
                            }
                          >
                            <Text style={s.detailsLinkText}>View details</Text>
                          </Pressable>

                          {nextLabel && (
                            <Pressable
                              style={s.advanceStatusBtn}
                              disabled={actionLoading}
                              onPress={() => handleUpdateOrderStatus(ord.id, ord.status)}
                            >
                              <Text style={s.advanceStatusText}>Mark {nextLabel}</Text>
                              <Feather name="arrow-right" size={13} color="#FFFFFF" />
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {sellerSubTab === 'inventory' && (
              <View style={s.sectionCard}>
                <View style={s.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitle}>Catalogue</Text>
                    <Text style={s.sectionSub}>
                      {filteredSellerProducts.length} of {sellerProducts.length} products
                    </Text>
                  </View>
                  <Pressable
                    style={s.addProdBtn}
                    onPress={() => router.push('/(app)/seller/new-product')}
                  >
                    <Feather name="plus" size={14} color="#FFFFFF" />
                    <Text style={s.addProdBtnText}>Add Product</Text>
                  </Pressable>
                </View>

                <View style={s.searchBox}>
                  <Feather name="search" size={15} color={C.muted} />
                  <TextInput
                    style={s.searchBoxInput}
                    value={sellerProductSearch}
                    onChangeText={setSellerProductSearch}
                    placeholder="Search your products..."
                    placeholderTextColor="#9EA3AF"
                  />
                  {sellerProductSearch ? (
                    <Pressable onPress={() => setSellerProductSearch('')} hitSlop={8}>
                      <Feather name="x" size={14} color={C.muted} />
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.productFilterRow}
                >
                  {['ALL', 'ACTIVE', 'DRAFT', 'OUT_OF_STOCK', 'ARCHIVED'].map((st) => {
                    const active = sellerProductStatus === st;
                    return (
                      <Pressable
                        key={st}
                        style={[s.productFilter, active && s.productFilterActive]}
                        onPress={() => setSellerProductStatus(st)}
                      >
                        <Text style={[s.productFilterText, active && s.productFilterTextActive]}>
                          {st.replace('_', ' ')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {filteredSellerProducts.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Feather name={sellerProducts.length === 0 ? 'plus-circle' : 'search'} size={34} color={C.sage} />
                    <Text style={s.emptyBoxTitle}>
                      {sellerProducts.length === 0 ? 'Catalogue is empty' : 'No matching products'}
                    </Text>
                    <Text style={s.emptyBoxSub}>
                      {sellerProducts.length === 0
                        ? 'Add your first formulation.'
                        : 'Try a different search or status filter.'}
                    </Text>
                  </View>
                ) : (
                  filteredSellerProducts.map((p) => {
                    const outOfStock = Number(p.stock) <= 0 || p.status === 'OUT_OF_STOCK';
                    return (
                      <View key={p.id} style={s.inventoryRow}>
                        <View style={s.invImgBox}>
                          {p.images?.[0]?.url ? (
                            <Image source={{ uri: resolveImageUrl(p.images[0].url) }} style={s.invImg} />
                          ) : (
                            <Feather name="droplet" size={18} color={C.sage} />
                          )}
                        </View>

                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={s.invTitle} numberOfLines={1}>
                            {p.title}
                          </Text>
                          <Text style={s.invMeta}>
                            {formatCurrency(p.price)} · {outOfStock ? 'Out of stock' : `Stock: ${p.stock}`} · {p.status}
                          </Text>
                        </View>

                        <Pressable
                          style={s.invActionBtn}
                          onPress={() => router.push(`/(app)/product/${p.slug}` as any)}
                        >
                          <Feather name="eye" size={15} color={C.ink2} />
                        </Pressable>

                        <Pressable
                          style={s.invActionBtn}
                          onPress={() => router.push(`/(app)/seller/edit-product?slug=${p.slug}` as any)}
                        >
                          <Feather name="edit-2" size={15} color={C.sage} />
                        </Pressable>

                        {p.status !== 'ARCHIVED' && (
                          <Pressable
                            style={s.invActionBtn}
                            onPress={() => handleArchiveProduct(p.slug)}
                          >
                            <Feather name="archive" size={15} color={C.danger} />
                          </Pressable>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* 3. ADMIN DASHBOARD TAB                                   */}
        {/* ======================================================== */}
        {activeTab === 'admin' && (
          <View style={{ marginTop: 14 }}>
            <View style={s.adminHeaderCard}>
              <Text style={s.sectionEyebrow}>COMMAND CONTROL</Text>
              <Text style={s.adminTitle}>Platform Operations</Text>

              <View style={s.kpiGrid}>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>
                    {formatCurrency(adminStats?.orders?.revenue || 0)}
                  </Text>
                  <Text style={s.kpiLabel}>Revenue</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.users?.total || 0}</Text>
                  <Text style={s.kpiLabel}>Users</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.products?.total || 0}</Text>
                  <Text style={s.kpiLabel}>Products</Text>
                </View>
              </View>

              <View style={[s.kpiGrid, { marginTop: 8 }]}>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.orders?.total || 0}</Text>
                  <Text style={s.kpiLabel}>Orders</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.users?.unverifiedSellers || 0}</Text>
                  <Text style={s.kpiLabel}>Pending Stores</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.products?.lowStock || 0}</Text>
                  <Text style={s.kpiLabel}>Low Stock</Text>
                </View>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={s.adminSubTabBar}>
                {(
                  [
                    { key: 'analytics', label: 'Feed' },
                    { key: 'orders', label: `Orders (${adminOrders.length})` },
                    { key: 'sellers', label: `Sellers (${adminSellers.length})` },
                    { key: 'users', label: `Users (${adminUsers.length})` },
                    { key: 'categories', label: 'Categories' },
                    { key: 'audit', label: 'Audit Log' },
                  ] as const
                ).map((tab) => (
                  <Pressable
                    key={tab.key}
                    style={[s.adminSubTabBtn, adminSubTab === tab.key && s.subTabBtnActive]}
                    onPress={() => setAdminSubTab(tab.key)}
                  >
                    <Text style={[s.subTabBtnText, adminSubTab === tab.key && s.subTabBtnTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {adminSubTab === 'analytics' && (
              <View>
                <View style={s.sectionCard}>
                  <Text style={s.sectionTitle}>Recent Orders</Text>
                  {adminStats?.recentOrders?.map((ord) => (
                    <Pressable
                      key={ord.id}
                      style={s.feedRow}
                      onPress={() => router.push(`/(app)/order/${ord.id}` as any)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={s.feedTitle}>{ord.orderNumber}</Text>
                        <Text style={s.feedSub}>
                          {ord.customer?.name} ({ord.customer?.email})
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.feedValue}>{formatCurrency(ord.totalAmount)}</Text>
                        <Text style={s.feedStatus}>{ord.status}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>

                <View style={s.sectionCard}>
                  <Text style={s.sectionTitle}>Recent Registrations</Text>
                  {adminStats?.recentUsers?.map((u) => (
                    <View key={u.id} style={s.feedRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.feedTitle}>{u.name}</Text>
                        <Text style={s.feedSub}>{u.email}</Text>
                      </View>
                      <View style={s.roleBadgeMini}>
                        <Text style={s.roleBadgeMiniText}>{u.role}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {adminSubTab === 'orders' && (
              <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>All Platform Orders</Text>
                {adminOrders.map((ord) => (
                  <Pressable
                    key={ord.id}
                    style={s.feedRow}
                    onPress={() => handleAdminOrderAction(ord)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.feedTitle}>{ord.orderNumber}</Text>
                      <Text style={s.feedSub}>
                        {ord.customer?.name || 'Customer'} · {new Date(ord.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.feedValue}>{formatCurrency(ord.totalAmount)}</Text>
                      <Text style={s.feedStatus}>{ord.status}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {adminSubTab === 'sellers' && (
              <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Seller Verification</Text>
                {adminSellers.map((seller) => (
                  <View key={seller.id} style={s.adminSellerRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.adminSellerTitle}>{seller.storeName}</Text>
                        {seller.isVerified && <Feather name="check-circle" size={13} color={C.sage} />}
                      </View>
                      <Text style={s.adminSellerSub}>
                        Owner: {seller.user?.name} · {seller._count?.products || 0} items
                      </Text>
                    </View>

                    <View style={s.sellerActions}>
                      {seller.user?.id && seller.user.id !== user?.id && (
                        <Pressable
                          style={[s.verifyToggleBtn, s.impersonateBtn]}
                          disabled={impersonating === seller.user.id}
                          onPress={() =>
                            handleImpersonate(
                              seller.user!.id,
                              seller.user?.name || seller.storeName,
                              'seller',
                            )
                          }
                        >
                          {impersonating === seller.user.id ? (
                            <ActivityIndicator size="small" color={C.violet} />
                          ) : (
                            <View style={s.impersonateInner}>
                              <Feather name="eye" size={11} color={C.violet} />
                              <Text style={s.impersonateText}>Impersonate</Text>
                            </View>
                          )}
                        </Pressable>
                      )}
                      <Pressable
                        style={[
                          s.verifyToggleBtn,
                          seller.isVerified ? s.verifyToggleRevoke : s.verifyToggleGrant,
                        ]}
                        onPress={() => handleToggleVerifySeller(seller.id, seller.isVerified)}
                      >
                        <Text style={[s.verifyToggleText, seller.isVerified && { color: C.danger }]}>
                          {seller.isVerified ? 'Revoke' : 'Verify'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {adminSubTab === 'users' && (
              <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>User Directory</Text>
                <TextInput
                  style={s.searchField}
                  placeholder="Filter users by name or email..."
                  placeholderTextColor="#9EA3AF"
                  value={userSearch}
                  onChangeText={setUserSearch}
                />

                {adminUsers
                  .filter(
                    (u) =>
                      !userSearch.trim() ||
                      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email?.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <View key={u.id} style={s.userManageRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.userManageName}>{u.name}</Text>
                        <Text style={s.userManageEmail}>{u.email}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <View style={s.roleTag}>
                            <Text style={s.roleTagText}>{u.role.toUpperCase()}</Text>
                          </View>
                          {u.banned && (
                            <View style={[s.roleTag, { backgroundColor: '#FDECEC' }]}>
                              <Text style={[s.roleTagText, { color: C.danger }]}>BANNED</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={{ gap: 6 }}>
                        {u.id !== user?.id && u.role !== 'admin' && (
                          <Pressable
                            style={[s.roleActionBtn, s.impersonateBtn]}
                            disabled={impersonating === u.id}
                            onPress={() => handleImpersonate(u.id, u.name, u.role)}
                          >
                            {impersonating === u.id ? (
                              <ActivityIndicator size="small" color={C.violet} />
                            ) : (
                              <View style={s.impersonateInner}>
                                <Feather name="eye" size={11} color={C.violet} />
                                <Text style={s.impersonateText}>Impersonate</Text>
                              </View>
                            )}
                          </Pressable>
                        )}
                        <Pressable
                          style={s.roleActionBtn}
                          onPress={() =>
                            handleUpdateUserRole(u.id, u.role === 'admin' ? 'customer' : 'admin')
                          }
                        >
                          <Text style={s.roleActionBtnText}>
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[s.roleActionBtn, u.banned && { borderColor: C.sage }]}
                          onPress={() => handleToggleBanUser(u)}
                        >
                          <Text
                            style={[s.roleActionBtnText, { color: u.banned ? C.sage : C.danger }]}
                          >
                            {u.banned ? 'Unban' : 'Ban'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {adminSubTab === 'categories' && (
              <View style={s.sectionCard}>
                <View style={s.sectionHeaderRow}>
                  <Text style={s.sectionTitle}>Skincare Categories</Text>
                  <Pressable style={s.addProdBtn} onPress={() => setNewCatModalOpen(true)}>
                    <Feather name="plus" size={14} color="#FFFFFF" />
                    <Text style={s.addProdBtnText}>Add Category</Text>
                  </Pressable>
                </View>

                {adminCategories.map((cat) => (
                  <View key={cat.id} style={s.categoryManageRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.catManageTitle}>
                        {cat.name} {cat.isDisabled ? '(Disabled)' : ''}
                      </Text>
                      {cat.description ? <Text style={s.catManageDesc}>{cat.description}</Text> : null}
                    </View>
                    <Pressable style={s.roleActionBtn} onPress={() => handleToggleCategory(cat)}>
                      <Text style={s.roleActionBtnText}>
                        {cat.isDisabled ? 'Enable' : 'Disable'}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {adminSubTab === 'audit' && (
              <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Audit Log</Text>
                {auditEntries.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Text style={s.emptyBoxSub}>No audit entries recorded yet.</Text>
                  </View>
                ) : (
                  auditEntries.map((entry) => (
                    <View key={entry.id} style={s.feedRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.feedTitle}>
                          {entry.action} · {entry.entity}
                        </Text>
                        <Text style={s.feedSub}>
                          {entry.actor?.name || 'System'} ·{' '}
                          {new Date(entry.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Become Seller Store Creation Modal */}
      <Modal
        visible={storeModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setStoreModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Register Store</Text>
              <Pressable onPress={() => setStoreModalOpen(false)}>
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>

            <Text style={s.inputLabel}>STORE NAME *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Annapurna Botanicals"
              placeholderTextColor="#9EA3AF"
              value={newStoreName}
              onChangeText={setNewStoreName}
            />

            <Text style={s.inputLabel}>BIO</Text>
            <TextInput
              style={[s.modalInput, { height: 75, textAlignVertical: 'top', paddingTop: 10 }]}
              multiline
              numberOfLines={3}
              placeholder="Handcrafted mountain botanical serums, pure oils..."
              placeholderTextColor="#9EA3AF"
              value={newStoreBio}
              onChangeText={setNewStoreBio}
            />

            <Text style={s.inputLabel}>CONTACT PHONE (NEPAL)</Text>
            <TextInput
              style={s.modalInput}
              keyboardType="phone-pad"
              placeholder="98XXXXXXXX"
              placeholderTextColor="#9EA3AF"
              value={newStorePhone}
              onChangeText={setNewStorePhone}
            />

            <Pressable
              style={[s.confirmStoreBtn, actionLoading && { opacity: 0.7 }]}
              disabled={actionLoading}
              onPress={handleCreateStore}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.confirmStoreBtnText}>Launch Store</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Admin Add Category Modal */}
      <Modal
        visible={newCatModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setNewCatModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>New Skincare Category</Text>
              <Pressable onPress={() => setNewCatModalOpen(false)}>
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>

            <Text style={s.inputLabel}>CATEGORY NAME *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Lip Treatments & Balms"
              placeholderTextColor="#9EA3AF"
              value={newCatName}
              onChangeText={setNewCatName}
            />

            <Text style={s.inputLabel}>DESCRIPTION</Text>
            <TextInput
              style={[s.modalInput, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]}
              multiline
              numberOfLines={3}
              placeholder="Targeted hydration and barrier repair for lips..."
              placeholderTextColor="#9EA3AF"
              value={newCatDesc}
              onChangeText={setNewCatDesc}
            />

            <Pressable style={s.confirmStoreBtn} onPress={handleCreateCategory}>
              <Text style={s.confirmStoreBtnText}>Create Category</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Admin Ban Reason Modal */}
      <Modal
        visible={!!banTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setBanTarget(null)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Ban {banTarget?.name}</Text>
              <Pressable onPress={() => setBanTarget(null)}>
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>

            <Text style={s.inputLabel}>BAN REASON *</Text>
            <TextInput
              style={[s.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
              multiline
              numberOfLines={3}
              placeholder="Provide a reason for suspending this account..."
              placeholderTextColor="#9EA3AF"
              value={banReasonInput}
              onChangeText={setBanReasonInput}
            />

            <Pressable style={[s.confirmStoreBtn, { backgroundColor: C.danger }]} onPress={handleConfirmBan}>
              <Text style={s.confirmStoreBtnText}>Confirm Ban</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  roleChip: {
    backgroundColor: '#EDF5EF', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: R.pill, borderWidth: 1, borderColor: '#D4E5D8',
  },
  roleChipText: { fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.5, color: C.sage, fontWeight: '700' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#ECE5DB',
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: C.sage,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 50, height: 50 },
  avatarText: { fontFamily: F.serifBold, fontSize: 22, color: '#FFFFFF' },
  userName: { fontFamily: F.serifBold, fontSize: 18, color: C.ink },
  userEmail: { fontFamily: F.sansRegular, fontSize: 12, color: C.ink2, marginTop: 2 },
  editProfileMiniBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDF5EF',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  signOutMiniBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAF8F5',
    alignItems: 'center', justifyContent: 'center',
  },
  quickGrid: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  quickCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#ECE5DB',
  },
  quickIconCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDF5EF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  quickTitle: { fontFamily: F.serifBold, fontSize: 17, color: C.ink },
  quickSub: { fontFamily: F.sansRegular, fontSize: 11.5, color: C.ink2, marginTop: 2 },
  roleSwitcherBar: {
    flexDirection: 'row', backgroundColor: '#EBE5DC', borderRadius: 14,
    padding: 4, marginTop: 14, gap: 4,
  },
  roleSwitchBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 38, borderRadius: 10,
  },
  roleSwitchBtnActive: { backgroundColor: C.sage },
  roleSwitchText: { fontFamily: F.sans, fontSize: 11.5, color: C.ink2, fontWeight: '600' },
  roleSwitchTextActive: { color: '#FFFFFF' },
  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#ECE5DB',
  },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  sectionEyebrow: {
    fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.5, color: C.sage,
    fontWeight: '700', marginBottom: 2,
  },
  sectionTitle: { fontFamily: F.serifBold, fontSize: 19, color: C.ink },
  editLink: { fontFamily: F.sans, fontSize: 12.5, color: C.sage, fontWeight: '600' },
  skinSub: { fontFamily: F.sansRegular, fontSize: 12, color: C.ink2, marginBottom: 10 },
  skinPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skinPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.pill,
    backgroundColor: '#F5F0E9', borderWidth: 1, borderColor: '#E8E2D8',
  },
  skinPillActive: { backgroundColor: C.sage, borderColor: C.sage },
  skinPillText: { fontFamily: F.sans, fontSize: 12, color: C.ink },
  skinPillTextActive: { color: '#FFFFFF', fontWeight: '600' },
  concernsLabel: {
    fontFamily: F.mono, fontSize: 9.5, letterSpacing: 1.4, color: C.muted,
    fontWeight: '700', marginBottom: 6,
  },
  concernTag: {
    backgroundColor: '#F0EBF9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill,
  },
  concernTagText: { fontFamily: F.sans, fontSize: 11.5, color: C.violet, fontWeight: '500' },
  orderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3EFEA',
  },
  orderRowNumber: { fontFamily: F.sans, fontSize: 13.5, color: C.ink, fontWeight: '700' },
  orderRowMeta: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginTop: 2 },
  orderRowAmount: { fontFamily: F.sans, fontSize: 13.5, color: C.sage, fontWeight: '700' },
  orderStatusChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  statusDelivered: { backgroundColor: '#EDF5EF' },
  statusCancelled: { backgroundColor: '#FDECEC' },
  statusPending: { backgroundColor: '#FEF3C7' },
  orderStatusChipText: { fontFamily: F.mono, fontSize: 9, fontWeight: '700' },
  becomeSellerCard: {
    backgroundColor: '#EBF2ED', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#D4E5D8', marginBottom: 14,
  },
  becomeSellerTitle: { fontFamily: F.serifBold, fontSize: 19, color: C.ink },
  becomeSellerSub: {
    fontFamily: F.sansRegular, fontSize: 12.5, lineHeight: 18,
    color: C.ink2, marginTop: 4, marginBottom: 14,
  },
  becomeSellerBtn: {
    backgroundColor: C.sage, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, height: 44, borderRadius: 12,
  },
  becomeSellerBtnText: { color: '#FFFFFF', fontFamily: F.sans, fontSize: 13.5, fontWeight: '600' },
  sellerHeaderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#ECE5DB',
  },
  sellerTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  sellerTopActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sellerIconBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#EDF5EF',
    alignItems: 'center', justifyContent: 'center',
  },
  storeNameDisplay: { fontFamily: F.serifBold, fontSize: 22, color: C.ink },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.pill,
  },
  verifiedTrue: { backgroundColor: '#EDF5EF' },
  verifiedPending: { backgroundColor: '#FEF3C7' },
  verifiedText: { fontFamily: F.mono, fontSize: 9.5, fontWeight: '700' },
  verifiedTextTrue: { color: C.sage },
  verifiedTextPending: { color: '#D97706' },
  kpiGrid: { flexDirection: 'row', gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#F8F6F2', borderRadius: 12, padding: 10, alignItems: 'center' },
  kpiValue: { fontFamily: F.sans, fontSize: 15, color: C.sage, fontWeight: '700' },
  kpiLabel: { fontFamily: F.sansRegular, fontSize: 10, color: C.ink2, marginTop: 2 },
  sellerKpiMeta: {
    fontFamily: F.sansRegular, fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 9,
  },
  subTabRow: {
    flexDirection: 'row', backgroundColor: '#EBE5DC', borderRadius: 12,
    padding: 3, marginBottom: 14, gap: 4,
  },
  subTabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  adminSubTabBar: {
    flexDirection: 'row', backgroundColor: '#EBE5DC', borderRadius: 12, padding: 3, gap: 4,
  },
  adminSubTabBtn: { paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', borderRadius: 9 },
  subTabBtnActive: { backgroundColor: '#FFFFFF' },
  subTabBtnText: { fontFamily: F.sans, fontSize: 11.5, color: C.ink2, fontWeight: '600' },
  subTabBtnTextActive: { color: C.sage },
  sellerOrderCard: { backgroundColor: '#FAF8F5', borderRadius: 14, padding: 12, marginBottom: 10 },
  sellerOrderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sellerOrderBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  orderAddressBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  orderAddressText: { fontFamily: F.sansRegular, fontSize: 11.5, color: C.ink2, flex: 1 },
  sellerOrderActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ECE5DB',
  },
  statusPill: { backgroundColor: '#EDF5EF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusPillText: { fontFamily: F.mono, fontSize: 10, color: C.sage, fontWeight: '700' },
  advanceStatusBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.sage,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  advanceStatusText: { color: '#FFFFFF', fontFamily: F.sans, fontSize: 11.5, fontWeight: '600' },
  detailsLink: { paddingVertical: 4 },
  detailsLinkText: { fontFamily: F.sans, fontSize: 11.5, color: C.sage, fontWeight: '600' },
  manageLink: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  manageLinkText: { fontFamily: F.sans, fontSize: 11.5, color: C.sage, fontWeight: '600' },
  sectionSub: { fontFamily: F.sansRegular, fontSize: 11, color: C.muted, marginTop: 2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FAF8F5',
    borderRadius: 11, borderWidth: 1, borderColor: '#E8E2D8', paddingHorizontal: 10,
    height: 40, marginBottom: 8,
  },
  searchBoxInput: { flex: 1, fontFamily: F.sansRegular, fontSize: 12.5, color: C.ink, paddingVertical: 0 },
  productFilterRow: { gap: 6, paddingVertical: 2, paddingRight: 4 },
  productFilter: {
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: R.pill,
    backgroundColor: '#F3EFEA', borderWidth: 1, borderColor: '#ECE5DB',
  },
  productFilterActive: { backgroundColor: C.sage, borderColor: C.sage },
  productFilterText: { fontFamily: F.mono, fontSize: 9.5, color: C.ink2, fontWeight: '700' },
  productFilterTextActive: { color: '#FFFFFF' },
  addProdBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.sage,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.pill,
  },
  addProdBtnText: { color: '#FFFFFF', fontFamily: F.sans, fontSize: 12, fontWeight: '600' },
  inventoryRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3EFEA',
  },
  invImgBox: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3EFEA',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  invImg: { width: '100%', height: '100%' },
  invTitle: { fontFamily: F.sans, fontSize: 13, color: C.ink, fontWeight: '600' },
  invMeta: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginTop: 2 },
  invActionBtn: { padding: 8 },
  adminHeaderCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#ECE5DB',
  },
  adminTitle: { fontFamily: F.serifBold, fontSize: 22, color: C.ink, marginBottom: 12 },
  feedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3EFEA',
  },
  feedTitle: { fontFamily: F.sans, fontSize: 13, color: C.ink, fontWeight: '600' },
  feedSub: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginTop: 2 },
  feedValue: { fontFamily: F.sans, fontSize: 13, color: C.sage, fontWeight: '700' },
  feedStatus: { fontFamily: F.mono, fontSize: 9.5, color: C.muted },
  roleBadgeMini: { backgroundColor: '#EDF5EF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleBadgeMiniText: { fontFamily: F.mono, fontSize: 9, color: C.sage, fontWeight: '700' },
  adminSellerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3EFEA',
  },
  adminSellerTitle: { fontFamily: F.serifBold, fontSize: 15, color: C.ink },
  adminSellerSub: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginTop: 2 },
  verifyToggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  verifyToggleGrant: { backgroundColor: '#EDF5EF', borderColor: C.sage },
  verifyToggleRevoke: { backgroundColor: '#FDECEC', borderColor: C.danger },
  verifyToggleText: { fontFamily: F.sans, fontSize: 11.5, color: C.sage, fontWeight: '600' },
  searchField: {
    backgroundColor: '#F8F6F2', borderRadius: 12, paddingHorizontal: 12, height: 40,
    fontFamily: F.sansRegular, fontSize: 12.5, color: C.ink, marginBottom: 10,
  },
  userManageRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3EFEA',
  },
  userManageName: { fontFamily: F.sans, fontSize: 13, color: C.ink, fontWeight: '600' },
  userManageEmail: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2 },
  roleTag: { backgroundColor: '#EDF5EF', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  roleTagText: { fontFamily: F.mono, fontSize: 8.5, color: C.sage, fontWeight: '700' },
  roleActionBtn: {
    borderWidth: 1, borderColor: '#D8D3CB', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, alignItems: 'center',
  },
  roleActionBtnText: { fontFamily: F.sans, fontSize: 10.5, color: C.ink, fontWeight: '600' },
  impersonateBtn: { borderColor: C.violet, backgroundColor: '#F5F2FF' },
  impersonateInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  impersonateText: { fontFamily: F.sans, fontSize: 10.5, color: C.violet, fontWeight: '700' },
  sellerActions: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  categoryManageRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3EFEA',
  },
  catManageTitle: { fontFamily: F.sans, fontSize: 13.5, color: C.ink, fontWeight: '600' },
  catManageDesc: { fontFamily: F.sansRegular, fontSize: 11, color: C.ink2, marginTop: 2 },
  emptyBox: { alignItems: 'center', paddingVertical: 26 },
  emptyBoxTitle: { fontFamily: F.serifBold, fontSize: 17, color: C.ink, marginTop: 8 },
  emptyBoxSub: {
    fontFamily: F.sansRegular, fontSize: 12, color: C.ink2, textAlign: 'center',
    marginTop: 4, paddingHorizontal: 20,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 22, paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  modalTitle: { fontFamily: F.serifBold, fontSize: 22, color: C.ink },
  inputLabel: {
    fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: C.muted,
    fontWeight: '700', marginTop: 10, marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1, borderColor: '#E8E2D8', borderRadius: 12, height: 44,
    paddingHorizontal: 12, fontFamily: F.sansRegular, fontSize: 13, color: C.ink,
  },
  confirmStoreBtn: {
    backgroundColor: C.sage, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  confirmStoreBtnText: { color: '#FFFFFF', fontFamily: F.sans, fontSize: 14, fontWeight: '600' },
});
