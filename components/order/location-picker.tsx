"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { haptic, requestTelegramLocation } from "@/lib/telegram/webapp";

const TASHKENT = { lat: 41.311151, lng: 69.279737 };
const TILE = 256;
const COLS = 5;
const ROWS = 5;

function lng2tile(lng: number, zoom: number) {
  return ((lng + 180) / 360) * 2 ** zoom;
}

function lat2tile(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

function tile2lng(x: number, zoom: number) {
  return (x / 2 ** zoom) * 360 - 180;
}

function tile2lat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export type PickedLocation = {
  address: string;
  city: string;
  lat: number;
  lng: number;
};

export function LocationPicker({
  value,
  onChange,
}: {
  value: PickedLocation | null;
  onChange: (next: PickedLocation) => void;
}) {
  const [center, setCenter] = useState(value ?? TASHKENT);
  const [zoom, setZoom] = useState(18);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (value) setCenter({ lat: value.lat, lng: value.lng });
  }, [value]);

  const tiles = useMemo(() => {
    const x = lng2tile(center.lng, zoom);
    const y = lat2tile(center.lat, zoom);
    const startX = Math.floor(x) - Math.floor(COLS / 2);
    const startY = Math.floor(y) - Math.floor(ROWS / 2);
    const images = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tx = startX + col;
        const ty = startY + row;
        images.push({
          key: `${zoom}/${tx}/${ty}`,
          src: `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}.png`,
          left: col * TILE,
          top: row * TILE,
        });
      }
    }
    return {
      images,
      offsetX: (x - startX) * TILE,
      offsetY: (y - startY) * TILE,
    };
  }, [center.lat, center.lng, zoom]);

  async function applyCoords(lat: number, lng: number) {
    setCenter({ lat, lng });
    setLoading(true);
    try {
      const geo = await apiFetch<PickedLocation>(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
      onChange({ ...geo, lat, lng });
      haptic("success");
    } catch (error) {
      onChange({
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: "Toshkent",
        lat,
        lng,
      });
      toast.error(error instanceof Error ? error.message : "Manzil olinmadi");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyLocation() {
    setLoading(true);
    try {
      haptic("medium");
      const coords = await requestTelegramLocation();
      await applyCoords(coords.lat, coords.lng);
    } catch (error) {
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Joylashuv olinmadi. Xaritani surib belgilang.");
    }
  }

  function shiftByPixels(dx: number, dy: number) {
    const tileX = lng2tile(center.lng, zoom) - dx / TILE;
    const tileY = lat2tile(center.lat, zoom) - dy / TILE;
    return {
      lat: tile2lat(tileY, zoom),
      lng: tile2lng(tileX, zoom),
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY };
    moved.current = false;
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const x = event.clientX - dragStart.current.x;
    const y = event.clientY - dragStart.current.y;
    if (Math.hypot(x, y) > 4) moved.current = true;
    setDrag({ x, y });
  }

  function onPointerUp() {
    if (!dragStart.current) return;
    const next = shiftByPixels(drag.x, drag.y);
    dragStart.current = null;
    setDrag({ x: 0, y: 0 });
    if (moved.current) void applyCoords(next.lat, next.lng);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-[rgba(139,116,255,0.28)] bg-[#120a28]">
        <div
          className="relative h-64 w-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="absolute"
            style={{
              width: COLS * TILE,
              height: ROWS * TILE,
              left: `calc(50% - ${tiles.offsetX - drag.x}px)`,
              top: `calc(50% - ${tiles.offsetY - drag.y}px)`,
            }}
          >
            {tiles.images.map((tile) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={tile.key}
                src={tile.src}
                alt=""
                draggable={false}
                className="absolute max-w-none"
                style={{ left: tile.left, top: tile.top, width: TILE, height: TILE }}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
            <MapPin size={40} fill="#8b74ff" className="text-[#3f2a9b] drop-shadow" />
          </div>
          <div className="absolute top-3 right-3 z-20 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/55">
            <button type="button" className="h-10 w-10 text-lg" onClick={() => setZoom((z) => Math.min(19, z + 1))}>
              +
            </button>
            <button type="button" className="h-10 w-10 text-lg" onClick={() => setZoom((z) => Math.max(14, z - 1))}>
              −
            </button>
          </div>
          {loading ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 text-sm">Aniq manzil olinmoqda...</div>
          ) : null}
        </div>
        <p className="px-3 py-2 text-center text-[11px] text-[#9CA3AF]">Xaritani suring — pin markazda qoladi</p>
      </div>

      <button
        type="button"
        onClick={() => void fetchMyLocation()}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(139,116,255,0.45)] bg-[rgba(63,42,155,0.28)] text-sm font-medium"
      >
        <Navigation size={16} />
        Hozirgi joylashuvimni olish
      </button>

      {value ? (
        <div className="rounded-2xl border border-white/8 bg-[#120a28] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Aniq manzil</p>
          <p className="mt-1 text-sm leading-5">{value.address}</p>
          <p className="mt-1 text-[11px] text-[#c4b5ff]">
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </p>
        </div>
      ) : (
        <p className="text-xs text-[#9CA3AF]">Pinni uy/ko‘cha ustiga qo‘ying yoki GPS tugmasini bosing.</p>
      )}
    </div>
  );
}
