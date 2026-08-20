import { NextRequest } from "next/server";
import { listProducts } from "@/lib/services/product.service";
import { productFilterSchema } from "@/lib/validations";
import { jsonError } from "@/lib/api/http";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!rateLimit(clientKey(request.headers.get("x-forwarded-for"), "products"))) {
    return jsonError("Ko‘p so‘rov yuborildi. Biroz kuting.", 429);
  }

  try {
    const parsed = productFilterSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) return jsonError("Filter noto‘g‘ri");
    const products = await listProducts(parsed.data);
    return Response.json({ products });
  } catch (error) {
    console.error(error);
    return jsonError("Mahsulotlarni yuklashda xatolik", 500);
  }
}
