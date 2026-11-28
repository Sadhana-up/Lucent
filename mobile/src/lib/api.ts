import { fetch as expoFetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import { API_URL, authClient } from './auth-client';
import {
  AuditEntry,
  Category,
  Order,
  PaginatedOrders,
  PaginatedProducts,
  PaginatedSellers,
  PaginatedUsers,
  PaginatedWishlist,
  Product,
  Routine,
  ServerCart,
  SellerOrder,
  SellerProfile,
  UserProfile,
  UserSummary,
  WishlistItem,
  PaginatedSellerProducts,
} from './types';

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${Number(amount).toLocaleString('en-IN')}`;
}

export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_URL}${cleanPath}`;
}

// ─── Auth headers ─────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  try {
    const cookie = authClient.getCookie();
    if (cookie) {
      headers['Cookie'] = cookie;
    }
  } catch {
    // ignore – no cookie means unauthenticated
  }
  return headers;
}

// ─── Generic request wrapper ─────────────────────────────────────────────────

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    const authHeaders = await getAuthHeaders();
    const isFormData = options.body instanceof FormData;

    const finalHeaders: Record<string, string> = {
      ...(authHeaders as Record<string, string>),
      ...((options.headers as Record<string, string>) || {}),
    };
    if (!isFormData && !finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, { ...options, headers: finalHeaders });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return { data: null, error: json?.error || `Request failed with status ${res.status}` };
    }
    return { data: json as T, error: null };
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err);
    return { data: null, error: err?.message || 'Network request failed' };
  }
}

// ─── Paginated-envelope normalisers ─────────────────────────────────────────
// The web API now returns envelopes like { products, total, page, limit }.
// These helpers unwrap them so callers get plain arrays.

function extractProducts(raw: any): Product[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.products)) return raw.products;
  return [];
}

function extractOrders(raw: any): Order[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.orders)) return raw.orders;
  return [];
}

function extractUsers(raw: any): UserSummary[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.users)) return raw.users;
  return [];
}

function extractSellers(raw: any): SellerProfile[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.sellers)) return raw.sellers;
  return [];
}

function extractWishlistItems(raw: any): WishlistItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

function extractRoutines(raw: any): Routine[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.routines)) return raw.routines;
  return [];
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const api = {
  // ── Profile ──────────────────────────────────────────────────────────────

  async getProfile() {
    return request<UserProfile>('/api/profile');
  },

  async updateProfile(data: {
    skinType?: string;
    skinConcerns?: string;
    onboardingCompleted?: boolean;
    name?: string;
    image?: string;
  }) {
    return request<UserProfile>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // ── Products ─────────────────────────────────────────────────────────────

  async getProducts(params?: {
    search?: string;
    category?: string;
    skinType?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.skinType) q.append('skinType', params.skinType);
    if (params?.minPrice != null) q.append('minPrice', String(params.minPrice));
    if (params?.maxPrice != null) q.append('maxPrice', String(params.maxPrice));
    if (params?.sort) q.append('sort', params.sort);
    if (params?.page != null) q.append('page', String(params.page));
    if (params?.limit != null) q.append('limit', String(params.limit));
    const qs = q.toString();
    const res = await request<PaginatedProducts | Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
    return { data: extractProducts(res.data), error: res.error };
  },

  async getProduct(slug: string) {
    return request<Product>(`/api/products/${slug}`);
  },

  async createProduct(data: {
    title: string;
    description: string;
    price: number;
    discountPrice?: number;
    stock: number;
    categoryId?: string;
    skinType?: string;
    skinConcerns?: string;
    ingredients?: string;
    usageInstructions?: string;
    images?: string[];
    status?: string;
  }) {
    return request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProduct(slug: string, data: Partial<Product> & { images?: string[] }) {
    return request<Product>(`/api/products/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteProduct(slug: string) {
    return request<{ success: boolean }>(`/api/products/${slug}`, { method: 'DELETE' });
  },

  async uploadImage(formData: FormData) {
    return request<{ url: string }>('/api/upload', { method: 'POST', body: formData });
  },

  // ── Reviews (new gated endpoint) ─────────────────────────────────────────

  async submitReview(slug: string, data: { rating: number; comment?: string; orderItemId?: string }) {
    return request<{ review: any; message?: string }>(`/api/products/${slug}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ── Categories ───────────────────────────────────────────────────────────

  async getCategories() {
    return request<Category[]>('/api/categories');
  },

  async createCategory(data: { name: string; description?: string }) {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: { name?: string; description?: string; isDisabled?: boolean }) {
    return request<Category>('/api/categories', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
    });
  },

  // ── Shops ────────────────────────────────────────────────────────────────

  async getShops(params?: {
    search?: string;
    verified?: boolean;
    category?: string;
    sort?: 'featured' | 'name' | 'newest' | 'products';
  }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.verified) q.append('verified', 'true');
    if (params?.category) q.append('category', params.category);
    if (params?.sort) q.append('sort', params.sort);
    const qs = q.toString();
    return request<SellerProfile[]>(`/api/shops${qs ? `?${qs}` : ''}`);
  },

  async getShop(slug: string) {
    return request<SellerProfile>(`/api/shops/${slug}`);
  },

  // ── Server Cart ───────────────────────────────────────────────────────────

  async getCart() {
    return request<ServerCart>('/api/cart');
  },

  // Cart mutations return { success: true }, not a cart. Re-fetch with getCart().
  async addToCart(productId: string, quantity: number) {
    return request<{ success: boolean }>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  async updateCartItem(itemId: string, quantity: number) {
    return request<{ success: boolean }>('/api/cart', {
      method: 'PATCH',
      body: JSON.stringify({ itemId, quantity }),
    });
  },

  async removeCartItem(itemId: string) {
    return request<{ success: boolean }>(
      `/api/cart?itemId=${encodeURIComponent(itemId)}`,
      { method: 'DELETE' },
    );
  },

  async clearCart() {
    return request<{ success: boolean }>('/api/cart?clear=true', {
      method: 'DELETE',
    });
  },

  // ── Wishlist ─────────────────────────────────────────────────────────────

  async getWishlist(page = 1, limit = 20) {
    const res = await request<PaginatedWishlist | WishlistItem[]>(
      `/api/wishlist?page=${page}&limit=${limit}`
    );
    return { data: extractWishlistItems(res.data), error: res.error };
  },

  async toggleWishlist(productId: string) {
    return request<{ wishlisted: boolean; message: string }>('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  // ── Orders ────────────────────────────────────────────────────────────────

  async getOrders(page = 1, limit = 20) {
    const res = await request<PaginatedOrders | Order[]>(`/api/orders?page=${page}&limit=${limit}`);
    return { data: extractOrders(res.data), error: res.error };
  },

  async getOrder(id: string) {
    return request<Order>(`/api/orders/${id}`);
  },

  async createOrder(data: {
    items: { productId: string; quantity: number }[];
    shippingAddress: string;
    contactPhone: string;
    notes?: string;
    paymentMethod?: 'cod' | 'khalti';
  }) {
    return request<{ order: Order; paymentUrl?: string; paymentMethod?: string; message?: string }>(
      '/api/orders',
      { method: 'POST', body: JSON.stringify(data) }
    );
  },

  /** Cancel a PENDING order */
  async cancelOrder(id: string, reason?: string) {
    return request<Order>(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel', reason: reason || 'Cancelled by customer' }),
    });
  },

  /** Request a return for a DELIVERED order */
  async requestReturn(id: string, reason: string) {
    return request<Order>(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'return', reason }),
    });
  },

  // ── Routines ─────────────────────────────────────────────────────────────

  async getRoutines() {
    const res = await request<{ routines: Routine[] } | Routine[]>('/api/routines');
    return { data: extractRoutines(res.data), error: res.error };
  },

  async createRoutine(data: { name: string; template?: boolean }) {
    return request<Routine>('/api/routines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getRoutine(id: string) {
    return request<Routine>(`/api/routines/${id}`);
  },

  async updateRoutine(id: string, data: { name?: string; isArchived?: boolean }) {
    return request<Routine>(`/api/routines/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteRoutine(id: string) {
    return request<{ success: boolean }>(`/api/routines/${id}`, { method: 'DELETE' });
  },

  async addRoutineStep(routineId: string, data: {
    productId: string;
    timeOfDay: 'MORNING' | 'EVENING';
    notes?: string;
  }) {
    return request<Routine>(`/api/routines/${routineId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async reorderRoutineSteps(routineId: string, updates: { id: string; stepOrder: number; timeOfDay: 'MORNING' | 'EVENING' }[]) {
    return request<Routine>(`/api/routines/${routineId}/steps`, {
      method: 'PATCH',
      body: JSON.stringify({ updates }),
    });
  },

  async updateRoutineStep(routineId: string, stepId: string, data: { notes?: string; timeOfDay?: 'MORNING' | 'EVENING'; stepOrder?: number }) {
    return request<Routine>(`/api/routines/${routineId}/steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteRoutineStep(routineId: string, stepId: string) {
    return request<Routine>(`/api/routines/${routineId}/steps/${stepId}`, { method: 'DELETE' });
  },

  async completeRoutineStep(routineId: string, stepId: string) {
    return request<{ done: boolean; doneToday: number; total: number }>(`/api/routines/${routineId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ stepId }),
    });
  },

  async getRoutineSuggestions(routineId: string) {
    const res = await request<{ suggestions: any[] }>(`/api/routines/${routineId}/suggestions`);
    // Suggestion rows carry a flat `image`, not the product `images` array.
    const products = (res.data?.suggestions ?? []).map((p) => ({
      ...p,
      images: p.image ? [{ id: p.id, productId: p.id, url: p.image, isPrimary: true }] : [],
    })) as Product[];
    return { data: products, error: res.error };
  },

  // ── Seller Dashboard ──────────────────────────────────────────────────────

  async getSellerProfile() {
    return request<SellerProfile>('/api/seller/profile');
  },

  async updateSellerProfile(data: {
    storeName: string;
    bio?: string;
    logo?: string;
    banner?: string;
    contactEmail?: string;
    phone?: string;
  }) {
    return request<SellerProfile>('/api/seller/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getSellerProducts(params?: { page?: number; limit?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.page != null) q.append('page', String(params.page));
    if (params?.limit != null) q.append('limit', String(params.limit));
    if (params?.status) q.append('status', params.status);
    const qs = q.toString();
    const res = await request<PaginatedSellerProducts | Product[]>(`/api/seller/products${qs ? `?${qs}` : ''}`);
    return { data: extractProducts(res.data), error: res.error };
  },

  async getSellerOrders() {
    return request<SellerOrder[]>('/api/seller/orders');
  },

  /** PATCH /api/seller/orders — action: set_status | update_tracking | approve_return | reject_return | approve_refund | reject_refund | mark_refunded */
  async updateSellerOrder(
    orderId: string,
    action: string,
    extra: { status?: string; reason?: string; trackingNumber?: string; carrier?: string } = {},
  ) {
    return request<Partial<SellerOrder>>('/api/seller/orders', {
      method: 'PATCH',
      body: JSON.stringify({ orderId, action, ...extra }),
    });
  },

  // ── Admin Dashboard ───────────────────────────────────────────────────────

  async getAdminStats() {
    return request<import('./types').AdminStats>('/api/admin/stats');
  },

  async getAdminUsers(params?: { search?: string; role?: string; page?: number }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.role) q.append('role', params.role);
    if (params?.page != null) q.append('page', String(params.page));
    const qs = q.toString();
    const res = await request<PaginatedUsers | UserSummary[]>(`/api/admin/users${qs ? `?${qs}` : ''}`);
    return { data: extractUsers(res.data), error: res.error };
  },

  async updateAdminUser(data: {
    userId: string;
    role?: string;
    banned?: boolean;
    banReason?: string;
    banExpires?: string;
  }) {
    return request<UserSummary>('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getAdminSellers(params?: { page?: number }) {
    const qs = params?.page != null ? `?page=${params.page}` : '';
    const res = await request<PaginatedSellers | SellerProfile[]>(`/api/admin/sellers${qs}`);
    return { data: extractSellers(res.data), error: res.error };
  },

  async verifySeller(sellerId: string, isVerified: boolean) {
    return request<SellerProfile>('/api/admin/sellers', {
      method: 'PATCH',
      body: JSON.stringify({ sellerId, isVerified }),
    });
  },

  async getAdminOrders(params?: { status?: string; page?: number }) {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.page != null) q.append('page', String(params.page));
    const qs = q.toString();
    const res = await request<{ orders: Order[]; total: number } | Order[]>(`/api/admin/orders${qs ? `?${qs}` : ''}`);
    return { data: extractOrders(res.data), error: res.error };
  },

  async updateAdminOrder(orderId: string, data: {
    status?: string;
    paymentStatus?: string;
    trackingNumber?: string;
    trackingCarrier?: string;
    refundAmount?: number;
    note?: string;
  }) {
    return request<Order>('/api/admin/orders', {
      method: 'PATCH',
      body: JSON.stringify({ orderId, ...data }),
    });
  },

  async getAuditLog(params?: { page?: number; entity?: string }) {
    const q = new URLSearchParams();
    if (params?.page != null) q.append('page', String(params.page));
    if (params?.entity) q.append('entity', params.entity);
    const qs = q.toString();
    return request<{ entries: AuditEntry[]; total: number }>(`/api/admin/audit${qs ? `?${qs}` : ''}`);
  },

  // ── AI Chat (SSE) ─────────────────────────────────────────────────────────

  async streamChatMessage(
    message: string,
    sessionId: string | null | undefined,
    handler: {
      onSession?: (sessionId: string) => void;
      onReasoning?: (text: string) => void;
      onAnswer?: (text: string) => void;
    },
    images?: { mime_type: string; data: string }[]
  ): Promise<{ error: string | null }> {
    try {
      const res = await expoFetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          ...(await getAuthHeaders() as Record<string, string>),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          images: images?.length ? images : null,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        return { error: json?.error || `Request failed with status ${res.status}` };
      }

      if (!res.body) return { error: 'The assistant returned an empty response' };

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamError: string | null = null;

      const handleFrame = (frame: string) => {
        const line = frame.split('\n').find((l) => l.startsWith('data:'));
        if (!line) return;
        let ev: { type?: string; text?: string; session_id?: string };
        try {
          ev = JSON.parse(line.slice(5).trim());
        } catch {
          return;
        }
        if (ev.type === 'session' && ev.session_id) handler.onSession?.(ev.session_id);
        else if (ev.type === 'reasoning' && ev.text) handler.onReasoning?.(ev.text);
        else if (ev.type === 'answer' && ev.text) handler.onAnswer?.(ev.text);
        else if (ev.type === 'error') streamError = ev.text ?? 'Unknown error';
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        parts.forEach(handleFrame);
      }
      if (buffer.trim()) handleFrame(buffer);

      return { error: streamError };
    } catch (err) {
      console.error('API Error [/api/chat]:', err);
      return { error: err instanceof Error ? err.message : 'Network request failed' };
    }
  },
};
