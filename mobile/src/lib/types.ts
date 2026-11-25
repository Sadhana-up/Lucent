export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
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
  createdAt?: string;
  _count?: {
    products: number;
  };
  products?: Product[];
  totalProducts?: number;
  avgRating?: number | null;
  totalReviews?: number;
  user?: {
    name: string;
    email?: string;
    image?: string | null;
  };
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    image?: string | null;
  };
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
    user?: {
      name: string;
      email?: string;
    };
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
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  shippingAddress: string;
  contactPhone: string;
  notes?: string | null;
  paymentProvider?: string | null;
  paymentStatus: string;
  paymentRef?: string | null;
  createdAt: string;
  items: OrderItem[];
  customer?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
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
  createdAt: string;
  sellerProfile?: {
    id: string;
    storeName: string;
    storeSlug: string;
    isVerified: boolean;
  } | null;
  _count?: {
    orders: number;
    reviews: number;
  };
}
