"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Stats {
  products: number;
  orders: number;
  customers: number;
  revenue: number;
  lowStock: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d.stats));
  }, []);

  const cards = [
    { label: "Mahsulotlar", value: stats?.products ?? "—" },
    { label: "Buyurtmalar", value: stats?.orders ?? "—" },
    { label: "Mijozlar", value: stats?.customers ?? "—" },
    { label: "Tushum", value: stats ? formatPrice(stats.revenue) : "—" },
    { label: "Kam qolgan", value: stats?.lowStock ?? "—" },
  ];

  return (
    <div>
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Boshqaruv</h1>
      <Button asChild className="mt-4 w-full">
        <Link href="/admin/products/new">
          <Plus size={16} /> Mahsulot qo‘shish
        </Link>
      </Button>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="premium-card rounded-3xl p-4">
            <p className="text-[11px] tracking-[0.14em] text-[#9CA3AF] uppercase">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
