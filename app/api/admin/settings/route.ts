import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { jsonError } from "@/lib/api/http";
import { paymentCardSchema } from "@/lib/validations";
import {
  activatePaymentCard,
  createPaymentCard,
  deletePaymentCard,
  getUsdRate,
  listPaymentCards,
  saveUsdRate,
  updatePaymentCard,
} from "@/lib/data/mock-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return Response.json({ cards: listPaymentCards(), usdRate: getUsdRate() });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const card = paymentCardSchema.parse({
      cardNumber: String(body.cardNumber ?? "").replace(/\D/g, ""),
      firstName: body.firstName,
      lastName: body.lastName,
    });
    const created = createPaymentCard(card);
    return Response.json({ card: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Karta saqlanmadi";
    return jsonError(message, 400);
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();

    if (body.action === "usdRate") {
      const rate = Number(body.usdRate);
      if (!Number.isFinite(rate) || rate <= 0) return jsonError("Kurs noto‘g‘ri");
      return Response.json({ usdRate: saveUsdRate(rate) });
    }

    if (!body.id) return jsonError("Karta topilmadi");

    if (body.action === "activate") {
      const card = activatePaymentCard(body.id);
      if (!card) return jsonError("Karta topilmadi", 404);
      return Response.json({ card });
    }

    const card = paymentCardSchema.parse({
      cardNumber: String(body.cardNumber ?? "").replace(/\D/g, ""),
      firstName: body.firstName,
      lastName: body.lastName,
    });
    const updated = updatePaymentCard(body.id, card);
    if (!updated) return jsonError("Karta topilmadi", 404);
    return Response.json({ card: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Karta yangilanmadi";
    return jsonError(message, 400);
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return jsonError("Karta topilmadi");
  if (!deletePaymentCard(id)) return jsonError("Karta topilmadi", 404);
  return Response.json({ ok: true });
}
