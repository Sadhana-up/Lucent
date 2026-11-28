// ─── Core entity types ───────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
  sortOrder?: number;
  altText?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isDisabled?: boolean;
}

export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  bio?: string | null;
  logo?: string | null;
  banner?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  createdAt?: string;
  _count?: { products: number };
  products?: Product[];
  totalProducts?: number;
  avgRating?: number | null;
  totalReviews?: number;
  user?: { id: string; name: string; email?: string; image?: string | null };
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: { id: string; name: string; image?: string | null };
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId?: string | null;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  skinType?: string | null;
  skinConcerns?: string | null;
  ingredients?: string | null;
  usageInstructions?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  images: ProductImage[];
  category?: Category | null;
  seller?: {
    storeName: string;
    storeSlug: string;
    logo?: string | null;
    isVerified: boolean;
    user?: { name: string; email?: string };
  };
  reviews?: Review[];
  avgRating?: number | null;
  reviewCount?: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  productTitle?: string | null;
  productImage?: string | null;
  product: Product;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  shippingCost?: number;
  discountAmount?: number;
  currency?: string;
  shippingAddress: string;
  contactPhone: string;
  notes?: string | null;
  paymentProvider?: string | null;
  paymentStatus: string;
  paymentRef?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  returnReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  events?: OrderEvent[];
  customer?: { id: string; name: string; email: string; image?: string | null };
}

export interface OrderEvent {
  id: string;
  orderId: string;
  status: string;
  note?: string | null;
  createdAt: string;
  actor?: { name: string };
}

// ─── Seller order (GET /api/seller/orders) ───────────────────────────────────

export interface SellerOrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    slug: string;
    images: { url: string }[];
  };
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentProvider?: string | null;
  totalAmount: number;
  sellerSubtotal: number;
  shippingAddress: string;
  contactPhone: string;
  notes?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  refundStatus: string;
  refundReason?: string | null;
  refundRequestedAt?: string | null;
  refundedAt?: string | null;
  returnRequestedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  customer?: { name: string; email: string };
  items: SellerOrderItem[];
}

export interface AdminStats {
  users: {
    total: number;
    byRole: Record<string, number>;
    newLast7Days: number;
    unverifiedSellers: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    categories: number;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
    newLast7Days: number;
    revenue: number;
    revenueExcludingCancelled: number;
    pendingRefunds?: number;
  };
  reviews: { total: number };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    customer: { name: string; email: string };
  }[];
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt: string;
  image?: string | null;
  sellerProfile?: {
    id: string;
    storeName: string;
    storeSlug: string;
    isVerified: boolean;
  } | null;
  _count?: { orders: number; reviews: number };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  skinType?: string | null;
  skinConcerns?: string | null;
  onboardingCompleted?: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
}

// ─── Server-side Cart ─────────────────────────────────────────────────────────

export interface ServerCartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface ServerCart {
  id: string;
  userId: string;
  items: ServerCartItem[];
  total?: number;
  itemCount?: number;
}

// ─── Wishlist ──────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export type TimeOfDay = 'MORNING' | 'EVENING';

export interface RoutineStep {
  id: string;
  routineId?: string;
  productId: string;
  timeOfDay: TimeOfDay;
  stepOrder: number;
  notes?: string | null;
  titleSnapshot?: string | null;
  imageSnapshot?: string | null;
  priceSnapshot?: number | null;
  completedToday: boolean;
  product: Product | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoutineCompletion {
  stepId: string;
  day: string;
}

export interface Routine {
  id: string;
  userId?: string;
  name: string;
  description?: string | null;
  skinType?: string | null;
  concerns?: string | null;
  isArchived?: boolean;
  createdAt: string;
  updatedAt?: string;
  steps: RoutineStep[];
  completions?: RoutineCompletion[];
}

// ─── Paginated API envelopes (new backend contracts) ─────────────────────────

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedUsers {
  users: UserSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedSellers {
  sellers: SellerProfile[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedSellerProducts {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedWishlist {
  items: WishlistItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Audit log ────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details?: any;
  createdAt: string;
  actor?: { name: string; email: string };
}
