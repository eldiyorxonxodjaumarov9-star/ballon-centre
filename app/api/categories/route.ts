import { listCategories } from "@/lib/services/product.service";
import { jsonError } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await listCategories();
    return Response.json({ categories });
  } catch (error) {
    console.error(error);
    return jsonError("Kategoriyalar yuklanmadi", 500);
  }
}
