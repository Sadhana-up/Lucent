import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { AdminStats, Category, Order, Product, SellerProfile, UserSummary } from '../../../lib/types';

const SKIN_TYPES = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive'];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const userRole = (user?.role || 'customer').toLowerCase();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'customer' | 'seller' | 'admin'>(
    userRole === 'admin' ? 'admin' : userRole === 'seller' ? 'seller' : 'customer'
  );

  // Customer Data
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [selectedSkinType, setSelectedSkinType] = useState<string>('Combination');
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreBio, setNewStoreBio] = useState('');
  const [newStorePhone, setNewStorePhone] = useState('98');

  // Seller Data
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [sellerSubTab, setSellerSubTab] = useState<'orders' | 'inventory' | 'settings'>('orders');

  // Admin Data
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserSummary[]>([]);
  const [adminSellers, setAdminSellers] = useState<SellerProfile[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminSubTab, setAdminSubTab] = useState<'analytics' | 'users' | 'sellers' | 'categories'>('analytics');
  const [userSearch, setUserSearch] = useState('');
  const [newCatModalOpen, setNewCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      // 1. Always load customer orders
      const ordersRes = await api.getOrders();
      if (ordersRes.data) setCustomerOrders(ordersRes.data);

      // 2. If seller or admin, load seller info
      if (userRole === 'seller' || userRole === 'admin') {
        const [profRes, prodRes, sOrdersRes] = await Promise.all([
          api.getSellerProfile(),
          api.getSellerProducts(),
          api.getSellerOrders(),
        ]);
        if (profRes.data) setSellerProfile(profRes.data);
        if (prodRes.data) setSellerProducts(prodRes.data);
        if (sOrdersRes.data) setSellerOrders(sOrdersRes.data);
      }

      // 3. If admin, load admin statistics & lists
      if (userRole === 'admin') {
        const [statRes, usersRes, sellersRes, catsRes] = await Promise.all([
          api.getAdminStats(),
          api.getAdminUsers(),
          api.getAdminSellers(),
          api.getCategories(),
        ]);
        if (statRes.data) setAdminStats(statRes.data);
        if (usersRes.data) setAdminUsers(usersRes.data);
        if (sellersRes.data) setAdminSellers(sellersRes.data);
        if (catsRes.data) setAdminCategories(catsRes.data);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
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

  // Seller Action: Update order status
  const handleUpdateOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      PENDING: 'PROCESSING',
      PROCESSING: 'SHIPPED',
      SHIPPED: 'DELIVERED',
    };
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setActionLoading(true);
    try {
      const res = await api.updateSellerOrderStatus(orderId, nextStatus);
      if (res.data) {
        setSellerOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
        );
      }
    } catch (e) {
      console.error('Error updating seller order:', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Seller Action: Delete formulation
  const handleDeleteProduct = (slug: string) => {
    Alert.alert('Delete Formulation', 'Remove this formulation from your store catalogue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await api.deleteProduct(slug);
            setSellerProducts((prev) => prev.filter((p) => p.slug !== slug));
          } catch (e) {
            console.error('Error deleting product:', e);
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
      if (res.data) {
        setSellerProfile(res.data);
        setStoreModalOpen(false);
        setActiveTab('seller');
        loadAllData();
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
    try {
      const res = await api.verifySeller(sellerId, !current);
      if (res.data) {
        setAdminSellers((prev) =>
          prev.map((s) => (s.id === sellerId ? { ...s, isVerified: !current } : s))
        );
      }
    } catch (e) {
      console.error('Failed to toggle verification:', e);
    }
  };

  // Admin Action: Update user role
  const handleUpdateUserRole = async (userId: string, targetRole: string) => {
    try {
      const res = await api.updateAdminUser({ userId, role: targetRole });
      if (res.data) {
        setAdminUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
        );
      }
    } catch (e) {
      console.error('Failed to update role:', e);
    }
  };

  // Admin Action: Ban / Unban user
  const handleToggleBanUser = async (userId: string, currentBanned: boolean) => {
    try {
      const res = await api.updateAdminUser({
        userId,
        banned: !currentBanned,
        banReason: !currentBanned ? 'Violated apothecary standards' : undefined,
      });
      if (res.data) {
        setAdminUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, banned: !currentBanned } : u))
        );
      }
    } catch (e) {
      console.error('Failed to toggle ban:', e);
    }
  };

  // Admin Action: Create Category
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await api.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
      });
      if (res.data) {
        setAdminCategories((prev) => [...prev, res.data!]);
        setNewCatModalOpen(false);
        setNewCatName('');
        setNewCatDesc('');
      }
    } catch (e) {
      console.error('Error creating category:', e);
    }
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'L';

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Top Bar with Brand & Role Indicator */}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.sage}
            colors={[C.sage]}
          />
        }
      >
        {/* User Identity Card */}
        <View style={s.userCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.userName} numberOfLines={1}>
              {user?.name || 'Lucent Member'}
            </Text>
            <Text style={s.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <Pressable style={s.signOutMiniBtn} onPress={handleSignOut}>
            <Feather name="log-out" size={17} color={C.danger} />
          </Pressable>
        </View>

        {/* Dynamic Role Switcher (Visible to Admins and Sellers to toggle view) */}
        {(userRole === 'admin' || userRole === 'seller') && (
          <View style={s.roleSwitcherBar}>
            <Pressable
              style={[s.roleSwitchBtn, activeTab === 'customer' && s.roleSwitchBtnActive]}
              onPress={() => setActiveTab('customer')}
            >
              <Feather
                name="user"
                size={14}
                color={activeTab === 'customer' ? '#FFFFFF' : C.ink2}
              />
              <Text
                style={[
                  s.roleSwitchText,
                  activeTab === 'customer' && s.roleSwitchTextActive,
                ]}
              >
                Customer View
              </Text>
            </Pressable>

            <Pressable
              style={[s.roleSwitchBtn, activeTab === 'seller' && s.roleSwitchBtnActive]}
              onPress={() => setActiveTab('seller')}
            >
              <Feather
                name="briefcase"
                size={14}
                color={activeTab === 'seller' ? '#FFFFFF' : C.ink2}
              />
              <Text
                style={[
                  s.roleSwitchText,
                  activeTab === 'seller' && s.roleSwitchTextActive,
                ]}
              >
                Seller Hub
              </Text>
            </Pressable>

            {userRole === 'admin' && (
              <Pressable
                style={[s.roleSwitchBtn, activeTab === 'admin' && s.roleSwitchBtnActive]}
                onPress={() => setActiveTab('admin')}
              >
                <Feather
                  name="shield"
                  size={14}
                  color={activeTab === 'admin' ? '#FFFFFF' : C.ink2}
                />
                <Text
                  style={[
                    s.roleSwitchText,
                    activeTab === 'admin' && s.roleSwitchTextActive,
                  ]}
                >
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
            {/* Skin Profile Config */}
            <View style={s.sectionCard}>
              <View style={s.sectionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sectionEyebrow}>SKIN BARRIER PROFILE</Text>
                  <Text style={s.sectionTitle}>Your Biocompatibility Settings</Text>
                </View>
                <View style={s.phBadge}>
                  <Text style={s.phBadgeText}>pH 5.5 Optimal</Text>
                </View>
              </View>

              <Text style={s.skinSub}>
                Selected skin type tailors formulation suggestions across the app:
              </Text>

              <View style={s.skinPillRow}>
                {SKIN_TYPES.map((st) => {
                  const sel = selectedSkinType === st;
                  return (
                    <Pressable
                      key={st}
                      style={[s.skinPill, sel && s.skinPillActive]}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedSkinType(st);
                      }}
                    >
                      <Text style={[s.skinPillText, sel && s.skinPillTextActive]}>{st}</Text>
                    </Pressable>
                  );
                })}
              </View>
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
                    Browse our botanical catalogue and verify your skin ritual today.
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
                        {ord.items.length} item{ord.items.length > 1 ? 's' : ''} ·{' '}
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={s.orderRowAmount}>
                        {formatCurrency(ord.totalAmount)}
                      </Text>
                      <View
                        style={[
                          s.orderStatusChip,
                          ord.status === 'DELIVERED'
                            ? s.statusDelivered
                            : ord.status === 'CANCELLED'
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

            {/* Become Seller Card (If user is customer) */}
            {userRole === 'customer' && (
              <View style={s.becomeSellerCard}>
                <Feather name="award" size={24} color={C.sage} style={{ marginBottom: 8 }} />
                <Text style={s.becomeSellerTitle}>Become an Apothecary Partner</Text>
                <Text style={s.becomeSellerSub}>
                  Are you an organic cosmetic chemist or skincare artisan in Nepal? Publish
                  your biocompatible formulations to thousands of customers.
                </Text>
                <Pressable
                  style={s.becomeSellerBtn}
                  onPress={() => setStoreModalOpen(true)}
                >
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
            {/* Store Banner & Metrics */}
            <View style={s.sellerHeaderCard}>
              <View style={s.sellerTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.sectionEyebrow}>APOTHECARY HUB</Text>
                  <Text style={s.storeNameDisplay}>
                    {sellerProfile?.storeName || 'My Laboratory'}
                  </Text>
                </View>
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
              </View>

              {/* KPI Metrics */}
              <View style={s.kpiGrid}>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{sellerProducts.length}</Text>
                  <Text style={s.kpiLabel}>Formulations</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{sellerOrders.length}</Text>
                  <Text style={s.kpiLabel}>Orders</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>
                    {formatCurrency(
                      sellerOrders
                        .filter((o) => o.status !== 'CANCELLED')
                        .reduce((acc, o) => acc + o.totalAmount, 0)
                    )}
                  </Text>
                  <Text style={s.kpiLabel}>Revenue</Text>
                </View>
              </View>
            </View>

            {/* Seller Sub-tabs */}
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

            {/* Seller: Orders List */}
            {sellerSubTab === 'orders' && (
              <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Incoming Customer Orders</Text>
                {sellerOrders.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Feather name="inbox" size={30} color="#CBD0D8" />
                    <Text style={s.emptyBoxTitle}>No orders yet</Text>
                  </View>
                ) : (
                  sellerOrders.map((ord) => (
                    <View key={ord.id} style={s.sellerOrderCard}>
                      <View style={s.sellerOrderTop}>
                        <View>
                          <Text style={s.orderRowNumber}>{ord.orderNumber}</Text>
                          <Text style={s.orderRowMeta}>
                            Customer: {ord.customer?.name || 'Member'} · {ord.contactPhone}
                          </Text>
                        </View>
                        <Text style={s.orderRowAmount}>{formatCurrency(ord.totalAmount)}</Text>
                      </View>

                      <View style={s.orderAddressBox}>
                        <Feather name="map-pin" size={13} color={C.muted} />
                        <Text style={s.orderAddressText} numberOfLines={2}>
                          {ord.shippingAddress}
                        </Text>
                      </View>

                      <View style={s.sellerOrderActions}>
                        <View style={s.statusPill}>
                          <Text style={s.statusPillText}>{ord.status}</Text>
                        </View>

                        {ord.status !== 'DELIVERED' && ord.status !== 'CANCELLED' && (
                          <Pressable
                            style={s.advanceStatusBtn}
                            disabled={actionLoading}
                            onPress={() => handleUpdateOrderStatus(ord.id, ord.status)}
                          >
                            <Text style={s.advanceStatusText}>
                              Mark as{' '}
                              {ord.status === 'PENDING'
                                ? 'Processing'
                                : ord.status === 'PROCESSING'
                                ? 'Shipped'
                                : 'Delivered'}
                            </Text>
                            <Feather name="arrow-right" size={13} color="#FFFFFF" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Seller: Inventory List */}
            {sellerSubTab === 'inventory' && (
              <View style={s.sectionCard}>
                <View style={s.sectionHeaderRow}>
                  <Text style={s.sectionTitle}>Catalogue Management</Text>
                  <Pressable
                    style={s.addProdBtn}
                    onPress={() => router.push('/(app)/seller/new-product')}
                  >
                    <Feather name="plus" size={14} color="#FFFFFF" />
                    <Text style={s.addProdBtnText}>Add Formulation</Text>
                  </Pressable>
                </View>

                {sellerProducts.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Feather name="plus-circle" size={34} color={C.sage} />
                    <Text style={s.emptyBoxTitle}>Catalogue is empty</Text>
                    <Text style={s.emptyBoxSub}>Add your first handcrafted formulation.</Text>
                  </View>
                ) : (
                  sellerProducts.map((p) => (
                    <View key={p.id} style={s.inventoryRow}>
                      <View style={s.invImgBox}>
                        {p.images?.[0]?.url ? (
                          <Image
                            source={{ uri: resolveImageUrl(p.images[0].url) }}
                            style={s.invImg}
                          />
                        ) : (
                          <Feather name="droplet" size={18} color={C.sage} />
                        )}
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.invTitle} numberOfLines={1}>
                          {p.title}
                        </Text>
                        <Text style={s.invMeta}>
                          {formatCurrency(p.price)} · Stock: {p.stock}
                        </Text>
                      </View>

                      <Pressable
                        style={s.deleteBtn}
                        onPress={() => handleDeleteProduct(p.slug)}
                      >
                        <Feather name="trash-2" size={16} color={C.danger} />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* 3. ADMIN DASHBOARD TAB (Supreme Control Center)           */}
        {/* ======================================================== */}
        {activeTab === 'admin' && (
          <View style={{ marginTop: 14 }}>
            {/* Platform Analytics KPI Grid */}
            <View style={s.adminHeaderCard}>
              <Text style={s.sectionEyebrow}>COMMAND CONTROL</Text>
              <Text style={s.adminTitle}>Platform Operations</Text>

              <View style={s.kpiGrid}>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>
                    {formatCurrency(adminStats?.orders?.revenue || 0)}
                  </Text>
                  <Text style={s.kpiLabel}>Total Revenue</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.users?.total || 0}</Text>
                  <Text style={s.kpiLabel}>Total Users</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.products?.total || 0}</Text>
                  <Text style={s.kpiLabel}>Formulations</Text>
                </View>
              </View>

              <View style={[s.kpiGrid, { marginTop: 8 }]}>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.orders?.total || 0}</Text>
                  <Text style={s.kpiLabel}>Total Orders</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.users?.unverifiedSellers || 0}</Text>
                  <Text style={s.kpiLabel}>Pending Stores</Text>
                </View>
                <View style={s.kpiCard}>
                  <Text style={s.kpiValue}>{adminStats?.products?.lowStock || 0}</Text>
                  <Text style={s.kpiLabel}>Low Stock Items</Text>
                </View>
              </View>
            </View>

            {/* Admin Sub-tabs */}
            <View style={s.subTabRow}>
              <Pressable
                style={[s.subTabBtn, adminSubTab === 'analytics' && s.subTabBtnActive]}
                onPress={() => setAdminSubTab('analytics')}
              >
                <Text style={[s.subTabBtnText, adminSubTab === 'analytics' && s.subTabBtnTextActive]}>
                  Live Feed
                </Text>
              </Pressable>
              <Pressable
                style={[s.subTabBtn, adminSubTab === 'sellers' && s.subTabBtnActive]}
                onPress={() => setAdminSubTab('sellers')}
              >
                <Text style={[s.subTabBtnText, adminSubTab === 'sellers' && s.subTabBtnTextActive]}>
                  Sellers ({adminSellers.length})
                </Text>
              </Pressable>
              <Pressable
                style={[s.subTabBtn, adminSubTab === 'users' && s.subTabBtnActive]}
                onPress={() => setAdminSubTab('users')}
              >
                <Text style={[s.subTabBtnText, adminSubTab === 'users' && s.subTabBtnTextActive]}>
                  Users ({adminUsers.length})
                </Text>
              </Pressable>
              <Pressable
                style={[s.subTabBtn, adminSubTab === 'categories' && s.subTabBtnActive]}
                onPress={() => setAdminSubTab('categories')}
              >
                <Text style={[s.subTabBtnText, adminSubTab === 'categories' && s.subTabBtnTextActive]}>
                  Categories
                </Text>
              </Pressable>
            </View>

            {/* Admin: Live Feed */}
            {adminSubTab === 'analytics' && (
              <View>
                {/* Recent Orders */}
                <View style={s.sectionCard}>
                  <Text style={s.sectionTitle}>Recent Orders (Realtime)</Text>
                  {adminStats?.recentOrders?.map((ord: any) => (
                    <View key={ord.id} style={s.feedRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.feedTitle}>{ord.orderNumber}</Text>
                        <Text style={s.feedSub}>
                          Buyer: {ord.customer?.name} ({ord.customer?.email})
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.feedValue}>{formatCurrency(ord.totalAmount)}</Text>
                        <Text style={s.feedStatus}>{ord.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Recent Users */}
                <View style={s.sectionCard}>
                  <Text style={s.sectionTitle}>Recent Member Registrations</Text>
                  {adminStats?.recentUsers?.map((u: any) => (
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

            {/* Admin: Seller Verification Hub */}
            {adminSubTab === 'sellers' && (
              <View style={s.sectionCard}>
                <Text style={s.sectionTitle}>Apothecary Lab Verification</Text>
                {adminSellers.map((seller) => (
                  <View key={seller.id} style={s.adminSellerRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.adminSellerTitle}>{seller.storeName}</Text>
                        {seller.isVerified && (
                          <Feather name="check-circle" size={13} color={C.sage} />
                        )}
                      </View>
                      <Text style={s.adminSellerSub}>
                        Owner: {seller.user?.name} · {seller._count?.products || 0} items
                      </Text>
                    </View>

                    <Pressable
                      style={[
                        s.verifyToggleBtn,
                        seller.isVerified ? s.verifyToggleRevoke : s.verifyToggleGrant,
                      ]}
                      onPress={() => handleToggleVerifySeller(seller.id, seller.isVerified)}
                    >
                      <Text
                        style={[
                          s.verifyToggleText,
                          seller.isVerified && { color: C.danger },
                        ]}
                      >
                        {seller.isVerified ? 'Revoke' : 'Verify'}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Admin: User Management */}
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
                        <Pressable
                          style={s.roleActionBtn}
                          onPress={() =>
                            handleUpdateUserRole(
                              u.id,
                              u.role === 'admin' ? 'customer' : 'admin'
                            )
                          }
                        >
                          <Text style={s.roleActionBtnText}>
                            {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[s.roleActionBtn, u.banned && { borderColor: C.sage }]}
                          onPress={() => handleToggleBanUser(u.id, !!u.banned)}
                        >
                          <Text
                            style={[
                              s.roleActionBtnText,
                              { color: u.banned ? C.sage : C.danger },
                            ]}
                          >
                            {u.banned ? 'Unban' : 'Ban'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {/* Admin: Categories Manager */}
            {adminSubTab === 'categories' && (
              <View style={s.sectionCard}>
                <View style={s.sectionHeaderRow}>
                  <Text style={s.sectionTitle}>Skincare Categories</Text>
                  <Pressable
                    style={s.addProdBtn}
                    onPress={() => setNewCatModalOpen(true)}
                  >
                    <Feather name="plus" size={14} color="#FFFFFF" />
                    <Text style={s.addProdBtnText}>Add Category</Text>
                  </Pressable>
                </View>

                {adminCategories.map((cat) => (
                  <View key={cat.id} style={s.categoryManageRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.catManageTitle}>{cat.name}</Text>
                      {cat.description ? (
                        <Text style={s.catManageDesc}>{cat.description}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
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
              <Text style={s.modalTitle}>Register Apothecary Store</Text>
              <Pressable onPress={() => setStoreModalOpen(false)}>
                <Feather name="x" size={20} color={C.ink} />
              </Pressable>
            </View>

            <Text style={s.inputLabel}>STORE / APOTHECARY NAME *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Annapurna Botanicals"
              placeholderTextColor="#9EA3AF"
              value={newStoreName}
              onChangeText={setNewStoreName}
            />

            <Text style={s.inputLabel}>LABORATORY PHILOSOPHY / BIO</Text>
            <TextInput
              style={[s.modalInput, { height: 75, textAlignVertical: 'top' }]}
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
                <Text style={s.confirmStoreBtnText}>Launch Apothecary Store</Text>
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
              style={[s.modalInput, { height: 70, textAlignVertical: 'top' }]}
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
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.cream,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  roleChip: {
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: '#D4E5D8',
  },
  roleChipText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: C.sage,
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: F.serifBold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  userName: {
    fontFamily: F.serifBold,
    fontSize: 18,
    color: C.ink,
  },
  userEmail: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.ink2,
    marginTop: 2,
  },
  signOutMiniBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSwitcherBar: {
    flexDirection: 'row',
    backgroundColor: '#EBE5DC',
    borderRadius: 14,
    padding: 4,
    marginTop: 14,
    gap: 4,
  },
  roleSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
  },
  roleSwitchBtnActive: {
    backgroundColor: C.sage,
  },
  roleSwitchText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: C.ink2,
    fontWeight: '600',
  },
  roleSwitchTextActive: {
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionEyebrow: {
    fontFamily: F.mono,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: C.sage,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: F.serifBold,
    fontSize: 19,
    color: C.ink,
  },
  phBadge: {
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phBadgeText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.sage,
    fontWeight: '700',
  },
  skinSub: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.ink2,
    marginBottom: 10,
  },
  skinPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skinPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.pill,
    backgroundColor: '#F5F0E9',
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  skinPillActive: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  skinPillText: {
    fontFamily: F.sans,
    fontSize: 12,
    color: C.ink,
  },
  skinPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  orderRowNumber: {
    fontFamily: F.sans,
    fontSize: 13.5,
    color: C.ink,
    fontWeight: '700',
  },
  orderRowMeta: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
    marginTop: 2,
  },
  orderRowAmount: {
    fontFamily: F.sans,
    fontSize: 13.5,
    color: C.sage,
    fontWeight: '700',
  },
  orderStatusChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDelivered: {
    backgroundColor: '#EDF5EF',
  },
  statusCancelled: {
    backgroundColor: '#FDECEC',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  orderStatusChipText: {
    fontFamily: F.mono,
    fontSize: 9,
    fontWeight: '700',
  },
  becomeSellerCard: {
    backgroundColor: '#EBF2ED',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D4E5D8',
    marginBottom: 14,
  },
  becomeSellerTitle: {
    fontFamily: F.serifBold,
    fontSize: 19,
    color: C.ink,
  },
  becomeSellerSub: {
    fontFamily: F.sansRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.ink2,
    marginTop: 4,
    marginBottom: 14,
  },
  becomeSellerBtn: {
    backgroundColor: C.sage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  becomeSellerBtnText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 13.5,
    fontWeight: '600',
  },
  sellerHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  sellerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  storeNameDisplay: {
    fontFamily: F.serifBold,
    fontSize: 22,
    color: C.ink,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: R.pill,
  },
  verifiedTrue: {
    backgroundColor: '#EDF5EF',
  },
  verifiedPending: {
    backgroundColor: '#FEF3C7',
  },
  verifiedText: {
    fontFamily: F.mono,
    fontSize: 9.5,
    fontWeight: '700',
  },
  verifiedTextTrue: {
    color: C.sage,
  },
  verifiedTextPending: {
    color: '#D97706',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F8F6F2',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  kpiValue: {
    fontFamily: F.sans,
    fontSize: 15,
    color: C.sage,
    fontWeight: '700',
  },
  kpiLabel: {
    fontFamily: F.sansRegular,
    fontSize: 10,
    color: C.ink2,
    marginTop: 2,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#EBE5DC',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 4,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  subTabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  subTabBtnText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: C.ink2,
    fontWeight: '600',
  },
  subTabBtnTextActive: {
    color: C.sage,
  },
  sellerOrderCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  sellerOrderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  orderAddressText: {
    fontFamily: F.sansRegular,
    fontSize: 11.5,
    color: C.ink2,
    flex: 1,
  },
  sellerOrderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECE5DB',
  },
  statusPill: {
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPillText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.sage,
    fontWeight: '700',
  },
  advanceStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.sage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  advanceStatusText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 11.5,
    fontWeight: '600',
  },
  addProdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.sage,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.pill,
  },
  addProdBtnText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  invImgBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  invImg: {
    width: '100%',
    height: '100%',
  },
  invTitle: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink,
    fontWeight: '600',
  },
  invMeta: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  adminHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE5DB',
  },
  adminTitle: {
    fontFamily: F.serifBold,
    fontSize: 22,
    color: C.ink,
    marginBottom: 12,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  feedTitle: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink,
    fontWeight: '600',
  },
  feedSub: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
    marginTop: 2,
  },
  feedValue: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.sage,
    fontWeight: '700',
  },
  feedStatus: {
    fontFamily: F.mono,
    fontSize: 9.5,
    color: C.muted,
  },
  roleBadgeMini: {
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeMiniText: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.sage,
    fontWeight: '700',
  },
  adminSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  adminSellerTitle: {
    fontFamily: F.serifBold,
    fontSize: 15,
    color: C.ink,
  },
  adminSellerSub: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
    marginTop: 2,
  },
  verifyToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  verifyToggleGrant: {
    backgroundColor: '#EDF5EF',
    borderColor: C.sage,
  },
  verifyToggleRevoke: {
    backgroundColor: '#FDECEC',
    borderColor: C.danger,
  },
  verifyToggleText: {
    fontFamily: F.sans,
    fontSize: 11.5,
    color: C.sage,
    fontWeight: '600',
  },
  searchField: {
    backgroundColor: '#F8F6F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    fontFamily: F.sansRegular,
    fontSize: 12.5,
    color: C.ink,
    marginBottom: 10,
  },
  userManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  userManageName: {
    fontFamily: F.sans,
    fontSize: 13,
    color: C.ink,
    fontWeight: '600',
  },
  userManageEmail: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
  },
  roleTag: {
    backgroundColor: '#EDF5EF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  roleTagText: {
    fontFamily: F.mono,
    fontSize: 8.5,
    color: C.sage,
    fontWeight: '700',
  },
  roleActionBtn: {
    borderWidth: 1,
    borderColor: '#D8D3CB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleActionBtnText: {
    fontFamily: F.sans,
    fontSize: 10.5,
    color: C.ink,
    fontWeight: '600',
  },
  categoryManageRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFEA',
  },
  catManageTitle: {
    fontFamily: F.sans,
    fontSize: 13.5,
    color: C.ink,
    fontWeight: '600',
  },
  catManageDesc: {
    fontFamily: F.sansRegular,
    fontSize: 11,
    color: C.ink2,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  emptyBoxTitle: {
    fontFamily: F.serifBold,
    fontSize: 17,
    color: C.ink,
    marginTop: 8,
  },
  emptyBoxSub: {
    fontFamily: F.sansRegular,
    fontSize: 12,
    color: C.ink2,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
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
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontFamily: F.sansRegular,
    fontSize: 13,
    color: C.ink,
  },
  confirmStoreBtn: {
    backgroundColor: C.sage,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  confirmStoreBtnText: {
    color: '#FFFFFF',
    fontFamily: F.sans,
    fontSize: 14,
    fontWeight: '600',
  },
});
