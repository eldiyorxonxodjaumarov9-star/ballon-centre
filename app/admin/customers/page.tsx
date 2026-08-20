"use client";

import { useEffect, useState } from "react";

interface Customer {
  id: string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  phone?: string | null;
  telegramId: string;
  _count?: { orders: number };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-sm font-semibold tracking-[0.2em] uppercase">Customers</h1>
      <div className="mt-4 space-y-2">
        {customers.length === 0 ? <p className="text-sm text-[#9CA3AF]">Hali mijozlar yo‘q.</p> : null}
        {customers.map((c) => (
          <div key={c.id} className="premium-card rounded-2xl px-4 py-3">
            <p className="font-medium">
              {c.firstName} {c.lastName}
            </p>
            <p className="text-xs text-[#9CA3AF]">
              @{c.username ?? "—"} · {c.phone ?? "telefon yo‘q"} · {c._count?.orders ?? 0} buyurtma
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
