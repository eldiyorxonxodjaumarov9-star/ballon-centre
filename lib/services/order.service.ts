import { prisma, isMockMode } from "@/lib/db/prisma";
import { checkoutSchema } from "@/lib/validations";
import { getProductById } from "@/lib/services/product.service";
import { getExtraProducts } from "@/lib/services/admin.service";
import { getStoredOrders, saveStoredOrders } from "@/lib/data/mock-store";
import type { CheckoutInput, Order } from "@/types";
import { formatProductSpec } from "@/lib/utils";

function nextOrderNumber(): string {
  const n = getStoredOrders().length + 1;
  return String(n).padStart(6, "0");
}

export async function createOrder(input: CheckoutInput, userId?: string): Promise<Order> {
  const data = checkoutSchema.parse(input);

  const lines: { product: NonNullable<Awaited<ReturnType<typeof getProductById>>>; quantity: number }[] = [];
  for (const item of data.items) {
    const product = await getProductById(item.productId);
    if (!product || !product.isActive || product.isArchived) {
      throw new Error("Mahsulot topilmadi");
    }
    if (product.stock < item.quantity) {
      throw new Error(`${product.name} omborda yetarli emas`);
    }
    lines.push({ product, quantity: item.quantity });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  if (isMockMode()) {
    const order: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNumber(),
      customerName: data.customerName,
      phone: data.phone,
      city: data.city,
      address: data.address,
      note: data.note,
      deliveryType: data.deliveryType,
      paymentMethod: data.paymentMethod,
      receiptUrl: data.receiptUrl,
      status: "NEW",
      subtotal,
      total: subtotal,
      createdAt: new Date().toISOString(),
      items: lines.map((line) => ({
        id: `${line.product.id}-${Date.now()}`,
        productId: line.product.id,
        name: line.product.name,
            size: formatProductSpec(line.product),
        price: line.product.price,
        quantity: line.quantity,
        product: line.product,
      })),
    };
    saveStoredOrders([order, ...getStoredOrders()]);
    return order;
  }

  if (!userId) {
    throw new Error("Buyurtma uchun foydalanuvchi aniqlanmadi");
  }

  const created = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { createdAt: "desc" }, select: { orderNumber: true } });
    const lastNum = last ? Number(last.orderNumber) : 127;
    const orderNumber = String(lastNum + 1).padStart(6, "0");

    for (const line of lines) {
      const updated = await tx.product.updateMany({
        where: { id: line.product.id, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity }, soldCount: { increment: line.quantity } },
      });
      if (updated.count === 0) {
        throw new Error(`${line.product.name} omborda yetarli emas`);
      }
    }

    return tx.order.create({
      data: {
        orderNumber,
        userId,
        customerName: data.customerName,
        phone: data.phone,
        city: data.city,
        address: data.address,
        note: data.note,
        deliveryType: data.deliveryType,
        paymentMethod: data.paymentMethod,
        status: "NEW",
        subtotal,
        total: subtotal,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            size: formatProductSpec(line.product),
            price: line.product.price,
            quantity: line.quantity,
          })),
        },
        payment: {
          create: {
            method: data.paymentMethod,
            status: "PENDING",
            amount: subtotal,
          },
        },
      },
      include: { items: true },
    });
  });

  return {
    id: created.id,
    orderNumber: created.orderNumber,
    customerName: created.customerName,
    phone: created.phone,
    city: created.city,
    address: created.address,
    note: created.note,
    deliveryType: created.deliveryType,
    paymentMethod: created.paymentMethod,
    receiptUrl: data.receiptUrl,
    status: created.status,
    subtotal: created.subtotal,
    total: created.total,
    createdAt: created.createdAt.toISOString(),
    items: created.items,
  };
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  if (isMockMode()) return getStoredOrders();

  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
  }));
}

export async function getOrderById(id: string, userId?: string): Promise<Order | null> {
  if (isMockMode()) {
    return getStoredOrders().find((o) => o.id === id || o.orderNumber === id) ?? null;
  }

  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { orderNumber: id }], ...(userId ? { userId } : {}) },
    include: { items: true },
  });
  if (!order) return null;
  return { ...order, createdAt: order.createdAt.toISOString() };
}

export async function listAllOrders() {
  if (isMockMode()) return getStoredOrders();

  return prisma.order.findMany({
    include: { items: true, user: true, payment: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<Order | null> {
  if (isMockMode()) {
    const orders = getStoredOrders();
    const idx = orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (idx < 0) return null;
    const next = [...orders];
    next[idx] = { ...next[idx], status };
    saveStoredOrders(next);
    return next[idx];
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return { ...order, createdAt: order.createdAt.toISOString() };
  } catch {
    const byNumber = await prisma.order.findFirst({ where: { orderNumber: id }, include: { items: true } });
    if (!byNumber) return null;
    const order = await prisma.order.update({
      where: { id: byNumber.id },
      data: { status },
      include: { items: true },
    });
    return { ...order, createdAt: order.createdAt.toISOString() };
  }
}

export function productNameFromId(id: string) {
  return getExtraProducts().find((p) => p.id === id)?.name;
}
