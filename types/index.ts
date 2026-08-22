export type Season = "SUMMER" | "WINTER" | "ALL_SEASON";
export type OrderStatus =
  | "NEW"
  | "DELIVERED"
  | "PICKED_UP"
  | "CONFIRMED"
  | "PROCESSING"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";
export type DeliveryType = "COURIER" | "PICKUP";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";
export type SortOption = "popular" | "new" | "price_asc" | "price_desc";
export type PriceCurrency = "UZS" | "USD";

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  country?: string | null;
  isActive: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameUz: string;
  emoji: string;
  imageUrl?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  model: string;
  description?: string | null;
  brandId: string;
  brand: Brand;
  categoryId: string;
  category: Category;
  images: string[];
  price: number;
  oldPrice?: number | null;
  priceCurrency?: PriceCurrency;
  originalPrice?: number | null;
  originalOldPrice?: number | null;
  usdRateAtEntry?: number | null;
  stock: number;
  width: string;
  profile: string;
  diameter: string;
  season: Season;
  loadIndex: string;
  speedIndex: string;
  country: string;
  warranty: string;
  featured: boolean;
  isActive: boolean;
  isArchived: boolean;
  soldCount: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  label?: string | null;
  city: string;
  street: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  note?: string | null;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  receiptUrl?: string | null;
  status: OrderStatus;
  subtotal: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface CustomerAccount {
  telegramId: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  languageCode?: string | null;
  photoUrl?: string | null;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  q?: string;
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  diameter?: string | number;
  width?: string | number;
  profile?: string | number;
  season?: Season;
  inStock?: boolean;
  discount?: boolean;
  sort?: SortOption;
}

export interface PaymentCard {
  id: string;
  cardNumber: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export interface CheckoutInput {
  customerName: string;
  phone: string;
  city: string;
  address: string;
  note?: string;
  lat?: number;
  lng?: number;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  items: { productId: string; quantity: number }[];
}
