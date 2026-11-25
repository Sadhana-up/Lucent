import { fetch as expoFetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import { API_URL, authClient } from './auth-client';
import { AdminStats, Category, Order, Product, Review, SellerProfile, UserSummary } from './types';

/**
 * Format currency in Nepali Rupees (NPR).
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return 'Rs. 0';
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

/**
 * Normalizes image URLs so local paths like "/uploads/xyz.png"
 * resolve to the full backend server address.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_URL}${cleanPath}`;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  try {
    const cookie = authClient.getCookie();
    if (cookie) {
      headers['Cookie'] = cookie;
    } else {
      const stored = await SecureStore.getItemAsync('lucent_cookie');
      if (stored) headers['Cookie'] = stored;
    }
  } catch (e) {
    // secure store fallback
  }

  return headers;
}

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
      ...((options.headers as any) || {}),
    };

    if (!isFormData && !finalHeaders['Content-Type']) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      ...options,
      headers: finalHeaders,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: null,
        error: json?.error || `Request failed with status ${res.status}`,
      };
    }

    return { data: json as T, error: null };
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err);
    return { data: null, error: err?.message || 'Network request failed' };
  }
}

export const api = {
  // Products
  async getProducts(params?: {
    search?: string;
    category?: string;
    skinType?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.skinType) q.append('skinType', params.skinType);
    if (params?.minPrice != null) q.append('minPrice', String(params.minPrice));
    if (params?.maxPrice != null) q.append('maxPrice', String(params.maxPrice));
    const qs = q.toString();
    return request<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
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
    return request<{ success: boolean }>(`/api/products/${slug}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories() {
    return request<Category[]>('/api/categories');
  },

  async createCategory(data: { name: string; description?: string }) {
    return request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Shops
  async getShops(params?: { search?: string; verified?: boolean }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.verified) q.append('verified', 'true');
    const qs = q.toString();
    return request<SellerProfile[]>(`/api/shops${qs ? `?${qs}` : ''}`);
  },

  async getShop(slug: string) {
    return request<SellerProfile>(`/api/shops/${slug}`);
  },

  // Reviews
  async getReviews(productId: string) {
    return request<Review[]>(`/api/reviews?productId=${productId}`);
  },

  async submitReview(data: { productId: string; rating: number; comment?: string }) {
    return request<Review>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Orders
  async getOrders() {
    return request<Order[]>('/api/orders');
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
    return request<{ order: Order; paymentUrl?: string; paymentMethod?: string; message?: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async cancelOrder(id: string) {
    return request<Order>(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
  },

  // Seller Dashboard
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

  async getSellerProducts() {
    return request<Product[]>('/api/seller/products');
  },

  async getSellerOrders() {
    return request<Order[]>('/api/seller/orders');
  },

  async updateSellerOrderStatus(orderId: string, status: string) {
    return request<Order>('/api/seller/orders', {
      method: 'PATCH',
      body: JSON.stringify({ orderId, status }),
    });
  },

  // Admin Dashboard
  async getAdminStats() {
    return request<AdminStats>('/api/admin/stats');
  },

  async getAdminUsers(params?: { search?: string; role?: string }) {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.role) q.append('role', params.role);
    const qs = q.toString();
    return request<UserSummary[]>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },

  async updateAdminUser(data: {
    userId: string;
    role?: string;
    banned?: boolean;
    banReason?: string;
  }) {
    return request<UserSummary>('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getAdminSellers() {
    return request<SellerProfile[]>('/api/admin/sellers');
  },

  async verifySeller(sellerId: string, isVerified: boolean) {
    return request<SellerProfile>('/api/admin/sellers', {
      method: 'PATCH',
      body: JSON.stringify({ sellerId, isVerified }),
    });
  },

  // AI Chat. The backend replies with an SSE stream, so this can't use request().
  // Callbacks fire as tokens arrive; the promise settles when the stream ends.
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
        headers: { ...(await getAuthHeaders() as Record<string, string>), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sessionId, images: images?.length ? images : null }),
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
          return; // ignore malformed frames
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
