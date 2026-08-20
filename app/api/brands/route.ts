import { listBrands } from "@/lib/services/product.service";
import { jsonError } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await listBrands();
    return Response.json({ brands });
  } catch (error) {
    console.error(error);
    return jsonError("Brendlar yuklanmadi", 500);
  }
}
