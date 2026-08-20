import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/http";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export const dynamic = "force-dynamic";

type GeoResult = {
  address: string;
  city: string;
  lat: number;
  lng: number;
};

function scoreAddress(text: string): number {
  const hasNumber = /\d/.test(text);
  const parts = text.split(",").length;
  return (hasNumber ? 20 : 0) + Math.min(parts, 8) + text.length / 40;
}

function pickCity(parts: Record<string, string | undefined>): string {
  return (
    parts.city ||
    parts.town ||
    parts.village ||
    parts.city_district ||
    parts.county ||
    parts.state ||
    "Toshkent"
  );
}

function formatNominatim(parts: Record<string, string | undefined>, displayName?: string): string {
  const street = [parts.road || parts.pedestrian || parts.residential, parts.house_number || parts.building]
    .filter(Boolean)
    .join(" ");
  const area = parts.suburb || parts.neighbourhood || parts.quarter || parts.city_district;
  const city = pickCity(parts);
  const built = [street, area, city].filter(Boolean).join(", ");
  if (displayName && scoreAddress(displayName) >= scoreAddress(built)) return displayName;
  return built || displayName || "";
}

async function fromNominatim(lat: number, lng: number): Promise<GeoResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat.toFixed(7));
  url.searchParams.set("lon", lng.toFixed(7));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("accept-language", "uz,ru,en");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BalonCentreMiniApp/1.0 (https://t.me/Balonshopbot_bot)",
    },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };
  const parts = data.address ?? {};
  const address = formatNominatim(parts, data.display_name);
  if (!address) return null;
  return { address, city: pickCity(parts), lat, lng };
}

async function fromPhoton(lat: number, lng: number): Promise<GeoResult | null> {
  const url = new URL("https://photon.komoot.io/reverse");
  url.searchParams.set("lat", lat.toFixed(7));
  url.searchParams.set("lon", lng.toFixed(7));
  url.searchParams.set("lang", "en");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    features?: Array<{
      properties?: {
        name?: string;
        housenumber?: string;
        street?: string;
        district?: string;
        city?: string;
        state?: string;
        country?: string;
      };
    }>;
  };
  const props = data.features?.[0]?.properties;
  if (!props) return null;
  const street = [props.street, props.housenumber].filter(Boolean).join(" ");
  const address = [props.name, street, props.district, props.city || props.state, props.country]
    .filter(Boolean)
    .join(", ");
  if (!address) return null;
  return { address, city: props.city || props.state || "Toshkent", lat, lng };
}

async function fromBigDataCloud(lat: number, lng: number): Promise<GeoResult | null> {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", lat.toFixed(7));
  url.searchParams.set("longitude", lng.toFixed(7));
  url.searchParams.set("localityLanguage", "uz");
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    plusCode?: string;
    localityInfo?: { informative?: Array<{ name?: string; description?: string }> };
  };
  const extra = (data.localityInfo?.informative ?? [])
    .map((item) => item.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const address = [data.locality, extra, data.city || data.principalSubdivision, data.plusCode]
    .filter(Boolean)
    .join(", ");
  if (!address) return null;
  return { address, city: data.city || data.locality || "Toshkent", lat, lng };
}

export async function GET(request: NextRequest) {
  if (!rateLimit(clientKey(request.headers.get("x-forwarded-for"), "geo"), 30, 60_000)) {
    return jsonError("Ko‘p so‘rov yuborildi. Biroz kuting.", 429);
  }

  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return jsonError("Koordinata noto‘g‘ri");
  }

  try {
    const results = (
      await Promise.allSettled([fromNominatim(lat, lng), fromPhoton(lat, lng), fromBigDataCloud(lat, lng)])
    )
      .map((item) => (item.status === "fulfilled" ? item.value : null))
      .filter((item): item is GeoResult => Boolean(item));

    const best = [...results].sort((a, b) => scoreAddress(b.address) - scoreAddress(a.address))[0];
    if (!best) {
      return Response.json({
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: "Toshkent",
        lat,
        lng,
      });
    }

    return Response.json({
      ...best,
      lat,
      lng,
      mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
    });
  } catch (error) {
    console.error(error);
    return jsonError("Xaritadan manzil olinmadi", 500);
  }
}
