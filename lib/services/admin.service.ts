import { prisma, isMockMode } from "@/lib/db/prisma";
import { getStoredOrders, getStoredProducts, saveStoredProducts } from "@/lib/data/mock-store";
import { getCategoryById } from "@/lib/services/category.service";
import { normalizeProduct } from "@/lib/products/normalize";
import { normalizeProductImages } from "@/lib/uploads/storage";
import { productWriteSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { Brand, Product } from "@/types";

export function getExtraProducts(): Product[] {
  return getStoredProducts().map(normalizeProduct);
}

function brandFromName(brandName: string): Brand {
  const name = brandName.trim();
  const slug = slugify(name);
  return {
    id: `br-${slug}`,
    slug,
    name,
    country: null,
    isActive: true,
  };
}

async function resolvePrismaBrand(brandName: string) {
  const name = brandName.trim();
  const slug = slugify(name);
  return prisma.brand.upsert({
    where: { slug },
    create: { name, slug, country: null, isActive: true },
    update: { name, isActive: true },
  });
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
  if (isMockMode()) return getExtraProducts();
  const products = await prisma.product.findMany({ include: { brand: true, category: true }, orderBy: { updatedAt: "desc" } });
  return products.map((product) => normalizeProduct(product));
}

export async function adminCreateProduct(input: unknown) {
  const data = productWriteSchema.parse(input);
  const { brandName, ...rest } = data;
  const brand = brandFromName(brandName);

  if (isMockMode()) {
    const category = await getCategoryById(rest.categoryId);
    if (!category) throw new Error("Kategoriya topilmadi");
    const product: Product = normalizeProduct({
      id: `p-${Date.now()}`,
      slug: slugify(`${brand.name}-${rest.model}-${Date.now()}`),
      name: rest.name,
      model: rest.model,
      description: rest.description,
      brandId: brand.id,
      brand,
      categoryId: category.id,
      category,
      images: normalizeProductImages(rest.images ?? []),
      price: rest.price,
      oldPrice: rest.oldPrice ?? null,
      priceCurrency: rest.priceCurrency ?? "UZS",
      originalPrice: rest.originalPrice ?? null,
      originalOldPrice: rest.originalOldPrice ?? null,
      usdRateAtEntry: rest.usdRateAtEntry ?? null,
      stock: rest.stock,
      width: rest.width,
      profile: rest.profile,
      diameter: rest.diameter,
      season: rest.season,
      loadIndex: rest.loadIndex,
      speedIndex: rest.speedIndex,
      country: rest.country,
      warranty: rest.warranty,
      featured: rest.featured ?? true,
      isActive: rest.isActive ?? true,
      isArchived: false,
      soldCount: 0,
    });
    saveStoredProducts([product, ...getStoredProducts()]);
    return product;
  }

  const dbBrand = await resolvePrismaBrand(brandName);
  return prisma.product.create({
    data: {
      ...rest,
      brandId: dbBrand.id,
      slug: slugify(`${rest.name}-${rest.model}-${Date.now()}`),
      images: normalizeProductImages(rest.images ?? []),
    },
    include: { brand: true, category: true },
  }).then((product) => normalizeProduct(product));
}

export async function adminUpdateProduct(id: string, input: unknown) {
  const data = productWriteSchema.partial().parse(input);
  const { brandName, ...rest } = data;

  if (isMockMode()) {
    const stored = getStoredProducts();
    const idx = stored.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const next = [...stored];
    const updated: Product = normalizeProduct({
      ...next[idx],
      ...rest,
      ...(rest.images ? { images: normalizeProductImages(rest.images) } : {}),
    });
    if (rest.categoryId) {
      const category = await getCategoryById(rest.categoryId);
      if (!category) throw new Error("Kategoriya topilmadi");
      updated.category = category;
      updated.categoryId = category.id;
    }
    if (brandName !== undefined) {
      const brand = brandFromName(brandName);
      updated.brand = brand;
      updated.brandId = brand.id;
    }
    next[idx] = updated;
    saveStoredProducts(next);
    return next[idx];
  }

  const updateData: typeof rest & { brandId?: string; images?: string[] } = {
    ...rest,
    ...(rest.images ? { images: normalizeProductImages(rest.images) } : {}),
  };
  if (brandName !== undefined) {
    const dbBrand = await resolvePrismaBrand(brandName);
    updateData.brandId = dbBrand.id;
  }

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: { brand: true, category: true },
  }).then((product) => normalizeProduct(product));
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
