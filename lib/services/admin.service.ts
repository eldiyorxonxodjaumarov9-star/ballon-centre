import { prisma, isMockMode } from "@/lib/db/prisma";
import { BRANDS, CATEGORIES } from "@/lib/data/catalog";
import { getStoredOrders, getStoredProducts, saveStoredProducts } from "@/lib/data/mock-store";
import { productWriteSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { Product } from "@/types";

export function getExtraProducts(): Product[] {
  return getStoredProducts();
}

export async function adminStats() {
  if (isMockMode()) {
    const stored = getStoredProducts();
    const orders = getStoredOrders();
    return {
      products: stored.length,
      orders: orders.length,
      customers: 0,
      revenue: orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0),
      lowStock: stored.filter((p) => p.stock <= 5).length,
    };
  }

  const [products, orders, customers, paid, lowStock] = await Promise.all([
    prisma.product.count({ where: { isArchived: false } }),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.product.count({ where: { stock: { lte: 5 }, isArchived: false } }),
  ]);

  return {
    products,
    orders,
    customers,
    revenue: paid._sum.total ?? 0,
    lowStock,
  };
}

export async function adminListProducts() {
  if (isMockMode()) return getStoredProducts();
  return prisma.product.findMany({ include: { brand: true, category: true }, orderBy: { updatedAt: "desc" } });
}

export async function adminCreateProduct(input: unknown) {
  const data = productWriteSchema.parse(input);
  if (isMockMode()) {
    const brand = BRANDS.find((b) => b.id === data.brandId) ?? BRANDS[0];
    const category = CATEGORIES.find((c) => c.id === data.categoryId) ?? CATEGORIES[0];
    const product: Product = {
      id: `p-${Date.now()}`,
      slug: slugify(`${brand.name}-${data.model}-${Date.now()}`),
      name: data.name,
      model: data.model,
      description: data.description,
      brandId: brand.id,
      brand,
      categoryId: category.id,
      category,
      images: data.images ?? [],
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      stock: data.stock,
      width: data.width,
      profile: data.profile,
      diameter: data.diameter,
      season: data.season,
      loadIndex: data.loadIndex,
      speedIndex: data.speedIndex,
      country: data.country,
      warranty: data.warranty,
      featured: data.featured ?? true,
      isActive: data.isActive ?? true,
      isArchived: false,
      soldCount: 0,
    };
    saveStoredProducts([product, ...getStoredProducts()]);
    return product;
  }

  return prisma.product.create({
    data: {
      ...data,
      slug: slugify(`${data.name}-${data.model}-${Date.now()}`),
      images: data.images ?? [],
    },
    include: { brand: true, category: true },
  });
}

export async function adminUpdateProduct(id: string, input: unknown) {
  const data = productWriteSchema.partial().parse(input);
  if (isMockMode()) {
    const stored = getStoredProducts();
    const idx = stored.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const next = [...stored];
    next[idx] = { ...next[idx], ...data } as Product;
    saveStoredProducts(next);
    return next[idx];
  }

  return prisma.product.update({
    where: { id },
    data,
    include: { brand: true, category: true },
  });
}

export async function adminArchiveProduct(id: string) {
  if (isMockMode()) {
    const stored = getStoredProducts();
    const idx = stored.findIndex((p) => p.id === id);
    if (idx < 0) return { id, isArchived: true };
    const next = [...stored];
    next[idx] = { ...next[idx], isArchived: true, isActive: false };
    saveStoredProducts(next);
    return next[idx];
  }
  return prisma.product.update({ where: { id }, data: { isArchived: true, isActive: false } });
}

export async function adminDeleteProduct(id: string) {
  if (isMockMode()) {
    saveStoredProducts(getStoredProducts().filter((p) => p.id !== id));
    return { ok: true };
  }
  await prisma.product.delete({ where: { id } });
  return { ok: true };
}
