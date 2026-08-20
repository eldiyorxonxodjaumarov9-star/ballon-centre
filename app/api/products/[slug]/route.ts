import { getProductBySlug } from "@/lib/services/product.service";
import { jsonError } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) return jsonError("Mahsulot topilmadi", 404);
    return Response.json({ product });
  } catch (error) {
    console.error(error);
    return jsonError("Mahsulot yuklanmadi", 500);
  }
}
