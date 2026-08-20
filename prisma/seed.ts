import { PrismaClient } from "@prisma/client";
import { BRANDS, CATEGORIES } from "../lib/data/catalog";

const prisma = new PrismaClient();

async function main() {
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  await prisma.category.createMany({
    data: CATEGORIES.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      nameUz: c.nameUz,
      emoji: c.emoji,
      imageUrl: c.imageUrl,
      description: c.description,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    })),
  });

  await prisma.brand.createMany({
    data: BRANDS.map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      country: b.country,
      isActive: b.isActive,
    })),
  });

  console.log(`Seeded ${BRANDS.length} brands and ${CATEGORIES.length} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
