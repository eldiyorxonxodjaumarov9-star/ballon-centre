"use client";

import { useMemo, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Brand, Category, ProductFilters, Season, SortOption } from "@/types";
import { useUi } from "@/hooks/use-ui";
import { Button } from "@/components/ui/button";
import { SEASON_LABEL } from "@/lib/constants";

const SORTS: { id: SortOption; label: string }[] = [
  { id: "popular", label: "Ommabop" },
  { id: "new", label: "Yangi" },
  { id: "price_asc", label: "Arzon → Qimmat" },
  { id: "price_desc", label: "Qimmat → Arzon" },
];

const DIAMETERS = [15, 16, 17, 18, 19, 22];
const WIDTHS = [185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 295, 315];
const PROFILES = [45, 50, 55, 60, 65, 70, 75, 80];

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs ${
        active
          ? "border-[rgba(139,116,255,0.65)] bg-[rgba(63,42,155,0.28)] text-[#c4b5ff]"
          : "border-white/10 text-[#9CA3AF]"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterDrawer({
  filters,
  onChange,
  brands,
  categories,
}: {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  brands: Brand[];
  categories: Category[];
}) {
  const open = useUi((s) => s.filterOpen);
  const setOpen = useUi((s) => s.setFilterOpen);

  const patch = (partial: ProductFilters) => onChange({ ...filters, ...partial });

  const seasons = useMemo(() => Object.keys(SEASON_LABEL) as Season[], []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-label="Yopish" />
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px] border border-[rgba(167,139,255,0.16)] bg-[#120a28] p-5"
            style={{ paddingBottom: "calc(var(--safe-bottom) + 20px)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Filter</h2>
              <button onClick={() => setOpen(false)} className="h-9 w-9 rounded-full border border-white/10">
                <X size={16} className="mx-auto" />
              </button>
            </div>

            <Section title="Saralash">
              <div className="flex flex-wrap gap-2">
                {SORTS.map((sort) => (
                  <Chip key={sort.id} active={(filters.sort ?? "popular") === sort.id} onClick={() => patch({ sort: sort.id })}>
                    {sort.label}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section title="Brend">
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => (
                  <Chip
                    key={brand.id}
                    active={filters.brand === brand.slug}
                    onClick={() => patch({ brand: filters.brand === brand.slug ? undefined : brand.slug })}
                  >
                    {brand.name}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section title="Kategoriya">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    active={filters.category === category.slug}
                    onClick={() => patch({ category: filters.category === category.slug ? undefined : category.slug })}
                  >
                    {category.emoji} {category.nameUz}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section title="Narx">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice ?? ""}
                  onChange={(e) => patch({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="h-11 rounded-2xl border border-white/10 bg-[#0a0618] px-3 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) => patch({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="h-11 rounded-2xl border border-white/10 bg-[#0a0618] px-3 text-sm"
                />
              </div>
            </Section>

            <Section title="Diametr">
              <div className="flex flex-wrap gap-2">
                {DIAMETERS.map((d) => (
                  <Chip key={d} active={filters.diameter === d} onClick={() => patch({ diameter: filters.diameter === d ? undefined : d })}>
                    R{d}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section title="Kenglik">
              <div className="flex flex-wrap gap-2">
                {WIDTHS.map((w) => (
                  <Chip key={w} active={filters.width === w} onClick={() => patch({ width: filters.width === w ? undefined : w })}>
                    {w}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section title="Profil">
              <div className="flex flex-wrap gap-2">
                {PROFILES.map((p) => (
                  <Chip key={p} active={filters.profile === p} onClick={() => patch({ profile: filters.profile === p ? undefined : p })}>
                    {p}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section title="Mavsum">
              <div className="flex flex-wrap gap-2">
                {seasons.map((season) => (
                  <Chip
                    key={season}
                    active={filters.season === season}
                    onClick={() => patch({ season: filters.season === season ? undefined : season })}
                  >
                    {SEASON_LABEL[season]}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section title="Mavjudlik">
              <div className="flex flex-wrap gap-2">
                <Chip active={Boolean(filters.inStock)} onClick={() => patch({ inStock: filters.inStock ? undefined : true })}>
                  Omborda
                </Chip>
                <Chip active={Boolean(filters.discount)} onClick={() => patch({ discount: filters.discount ? undefined : true })}>
                  Chegirma
                </Chip>
              </div>
            </Section>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onChange({})}>
                Tozalash
              </Button>
              <Button onClick={() => setOpen(false)}>Qo‘llash</Button>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">{title}</h3>
      {children}
    </section>
  );
}
