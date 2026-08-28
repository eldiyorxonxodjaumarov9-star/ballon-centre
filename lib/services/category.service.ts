import { Prisma } from "@prisma/client";
import { prisma, isMockMode } from "@/lib/db/prisma";
import { getStoredCategories, getStoredProducts, saveStoredCategories } from "@/lib/data/mock-store";
import { slugify } from "@/lib/utils";
import type { Category } from "@/types";

export type CategoryWithCount = Category & { productCount: number };

function withProductCounts(categories: Category[], products: { categoryId: string }[]): CategoryWithCount[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }
  return categories.map((category) => ({
    ...category,
    productCount: counts.get(category.id) ?? 0,
  }));
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function listShopCategories(): Promise<Category[]> {
  if (isMockMode()) {
    return getStoredCategories()
      .filter((category) => category.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listAdminCategories(): Promise<CategoryWithCount[]> {
  if (isMockMode()) {
    const categories = getStoredCategories().sort((a, b) => a.sortOrder - b.sortOrder);
    return withProductCounts(categories, getStoredProducts());
  }

  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return rows.map((category) => ({
    ...category,
    productCount: category._count.products,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (isMockMode()) {
    return getStoredCategories().find((category) => category.slug === slug && category.isActive) ?? null;
  }
  return prisma.category.findFirst({ where: { slug, isActive: true } });
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (isMockMode()) {
    return getStoredCategories().find((category) => category.id === id) ?? null;
  }
  return prisma.category.findUnique({ where: { id } });
}

export async function createCategory(input: {
  nameUz: string;
  emoji?: string;
  description?: string;
  isActive?: boolean;
}): Promise<Category> {
  const nameUz = input.nameUz.trim();
  const slug = slugify(nameUz);
  if (!nameUz) throw new Error("Kategoriya nomi bo‘sh bo‘lmasin");
  if (!slug) throw new Error("Kategoriya slug yaratib bo‘lmadi");

  const emoji = input.emoji?.trim() || "🛞";
  const description = input.description?.trim() || null;
  const isActive = input.isActive ?? true;

  if (isMockMode()) {
    const existing = getStoredCategories();
    if (existing.some((category) => category.slug === slug)) {
      throw new Error("Bu nom bilan kategoriya allaqachon mavjud");
    }
    const category: Category = {
      id: `cat-${Date.now()}`,
      slug,
      name: nameUz,
      nameUz,
      emoji,
      description,
      imageUrl: null,
      sortOrder: existing.length + 1,
      isActive,
    };
    saveStoredCategories([...existing, category]);
    return category;
  }

  try {
    return await prisma.category.create({
      data: {
        nameUz,
        name: nameUz,
        slug,
        emoji,
        description,
        isActive,
        sortOrder: 99,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("Bu nom bilan kategoriya allaqachon mavjud");
    }
    throw error;
  }
}

export async function updateCategory(
  id: string,
  input: {
    nameUz?: string;
    emoji?: string;
    description?: string;
    isActive?: boolean;
  },
): Promise<Category | null> {
  if (isMockMode()) {
    const stored = getStoredCategories();
    const idx = stored.findIndex((category) => category.id === id);
    if (idx < 0) return null;

    const current = stored[idx];
    const nameUz = input.nameUz !== undefined ? input.nameUz.trim() : current.nameUz;
    if (!nameUz) throw new Error("Kategoriya nomi bo‘sh bo‘lmasin");

    const next = [...stored];
    next[idx] = {
      ...current,
      nameUz,
      name: nameUz,
      emoji: input.emoji !== undefined ? input.emoji.trim() || "🛞" : current.emoji,
      description: input.description !== undefined ? input.description.trim() || null : current.description,
      isActive: input.isActive ?? current.isActive,
    };
    saveStoredCategories(next);
    return next[idx];
  }

  const data: {
    nameUz?: string;
    name?: string;
    emoji?: string;
    description?: string | null;
    isActive?: boolean;
  } = {};

  if (input.nameUz !== undefined) {
    const nameUz = input.nameUz.trim();
    if (!nameUz) throw new Error("Kategoriya nomi bo‘sh bo‘lmasin");
    data.nameUz = nameUz;
    data.name = nameUz;
  }
  if (input.emoji !== undefined) data.emoji = input.emoji.trim() || "🛞";
  if (input.description !== undefined) data.description = input.description.trim() || null;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  try {
    return await prisma.category.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return null;
    }
    throw error;
  }
}
