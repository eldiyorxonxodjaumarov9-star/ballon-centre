import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+998\d{9}$/, "Telefon +998XXXXXXXXX formatida bo'lsin"),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(400),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  note: z.string().trim().max(400).optional(),
  deliveryType: z.enum(["COURIER", "PICKUP"]),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]),
  receiptUrl: z
    .string()
    .regex(/^\/uploads\/receipts\/[a-zA-Z0-9._-]+$/, "Chek noto‘g‘ri")
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
}).superRefine((data, ctx) => {
  if ((data.paymentMethod === "CARD" || data.paymentMethod === "TRANSFER") && !data.receiptUrl) {
    ctx.addIssue({ code: "custom", path: ["receiptUrl"], message: "To‘lov chekini yuklang" });
  }
});

export const productFilterSchema = z.object({
  q: z.string().trim().max(80).optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  diameter: z.string().trim().max(20).optional(),
  width: z.string().trim().max(20).optional(),
  profile: z.string().trim().max(20).optional(),
  season: z.enum(["SUMMER", "WINTER", "ALL_SEASON"]).optional(),
  inStock: z.coerce.boolean().optional(),
  discount: z.coerce.boolean().optional(),
  sort: z.enum(["popular", "new", "price_asc", "price_desc"]).optional(),
});

export const productWriteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  model: z.string().trim().min(1).max(80),
  brandName: z.string().trim().min(1).max(80),
  categoryId: z.string().min(1),
  description: z.string().trim().max(2000).optional(),
  images: z.array(z.string()).max(6).optional(),
  price: z.number().int().positive(),
  oldPrice: z.number().int().positive().nullable().optional(),
  priceCurrency: z.enum(["UZS", "USD"]).optional().default("UZS"),
  originalPrice: z.number().positive().nullable().optional(),
  originalOldPrice: z.number().positive().nullable().optional(),
  usdRateAtEntry: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0),
  width: z.string().trim().min(1).max(40),
  profile: z.string().trim().min(1).max(40),
  diameter: z.string().trim().min(1).max(40),
  season: z.enum(["SUMMER", "WINTER", "ALL_SEASON"]),
  loadIndex: z.string().min(1).max(12),
  speedIndex: z.string().min(1).max(4),
  country: z.string().trim().min(2).max(80),
  warranty: z.string().min(2).max(40),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const paymentCardSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, "Karta raqami 16 ta raqam bo‘lsin"),
  firstName: z.string().trim().min(2).max(40),
  lastName: z.string().trim().min(2).max(40),
});

export const adminLoginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+998\d{9}$/, "Telefon +998XXXXXXXXX formatida bo'lsin"),
  password: z.string().min(6, "Parol kamida 6 belgi bo'lsin"),
});

export const customerRegistrationSchema = z.object({
  firstName: z.string().trim().min(2, "Ism kamida 2 belgi bo‘lsin").max(80, "Ism juda uzun"),
  phone: z.string().trim().min(9, "Telefon raqamini kiriting").max(20),
});

export const orderStatusSchema = z.object({
  status: z.enum(["NEW", "DELIVERED", "PICKED_UP", "CONFIRMED", "PROCESSING", "DELIVERING", "COMPLETED", "CANCELLED"]),
});
