import { prisma, isMockMode } from "@/lib/db/prisma";
import { BRANDS } from "@/lib/data/catalog";
import { getExtraProducts } from "@/lib/services/admin.service";
import { normalizeProduct } from "@/lib/products/normalize";
import { matchesProductQuery } from "@/lib/products/search";
import { getCategoryBySlug as findCategoryBySlug, listShopCategories } from "@/lib/services/category.service";
import type { Product, ProductFilters } from "@/types";

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  let result = products.filter((product) => {
    if (!product.isActive || product.isArchived) return false;
    if (!matchesProductQuery(product, filters.q)) return false;
    if (filters.brand && product.brand.slug !== filters.brand && product.brandId !== filters.brand) return false;
    if (
      filters.category &&
      product.category.slug !== filters.category &&
      product.categoryId !== filters.category
    ) {
      return false;
    }
    if (filters.minPrice && product.price < filters.minPrice) return false;
    if (filters.maxPrice && product.price > filters.maxPrice) return false;
    if (filters.diameter != null && String(product.diameter) !== String(filters.diameter)) return false;
    if (filters.width != null && String(product.width) !== String(filters.width)) return false;
    if (filters.profile != null && String(product.profile) !== String(filters.profile)) return false;
    if (filters.season && product.season !== filters.season) return false;
    if (filters.inStock && product.stock <= 0) return false;
    if (filters.discount && !product.oldPrice && !product.originalOldPrice) return false;
    return true;
  });

  switch (filters.sort) {
    case "new":
      result = [...result].reverse();
      break;
    case "price_asc":
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    default:
      result = [...result].sort((a, b) => b.soldCount - a.soldCount || (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  return result;
}

function mapProduct(product: Parameters<typeof normalizeProduct>[0]): Product {
  return normalizeProduct(product);
}

export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (isMockMode()) {
    return filterProducts(getExtraProducts(), filters);
  }

  const products = await prisma.product.findMany({
    where: { isActive: true, isArchived: false },
    include: { brand: true, category: true },
    orderBy: { soldCount: "desc" },
  });

  return filterProducts(products.map(mapProduct), filters);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isMockMode()) {
    const product = getExtraProducts().find((p) => p.slug === slug && p.isActive && !p.isArchived);
    return product ? normalizeProduct(product) : null;
  }

  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, isArchived: false },
    include: { brand: true, category: true },
  });
  return product ? mapProduct(product) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isMockMode()) {
    const product = getExtraProducts().find((p) => p.id === id);
    return product ? normalizeProduct(product) : null;
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { brand: true, category: true },
  });
  return product ? mapProduct(product) : null;
}

export async function listCategories() {
  return listShopCategories();
}

export async function getCategoryBySlug(slug: string) {
  return findCategoryBySlug(slug);
}

export async function listBrands() {
  if (isMockMode()) return BRANDS.filter((b) => b.isActive);
  return prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function listFeaturedProducts(limit = 8) {
  const products = await listProducts({ sort: "new" });
  const featured = products.filter((p) => p.featured);
  return (featured.length ? featured : products).slice(0, limit);
}
