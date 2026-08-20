import { getActivePaymentCard } from "@/lib/data/mock-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const card = getActivePaymentCard();
  if (!card) return Response.json({ card: null });
  return Response.json({
    card: {
      cardNumber: card.cardNumber,
      firstName: card.firstName,
      lastName: card.lastName,
    },
  });
}
