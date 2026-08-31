import { matchesProductQuery } from "../lib/products/search";
import type { Product } from "../types";

const product: Product = {
  id: "search-test-1",
  slug: "roadmaster-rm-7-235-75-r17-5",
  name: "235/75R/17.5 16PR",
  model: "RM-7",
  description: "Yuk avtomobili shinasi",
  brandId: "roadmaster",
  brand: {
    id: "roadmaster",
    slug: "roadmaster",
    name: "Road Master",
    isActive: true,
  },
  categoryId: "truck-tires",
  category: {
    id: "truck-tires",
    slug: "yuk-mashinalari",
    name: "Truck tires",
    nameUz: "Yuk mashinalari",
    emoji: "🚚",
    sortOrder: 1,
    isActive: true,
  },
  images: [],
  price: 1_000_000,
  stock: 2,
  width: "235",
  profile: "75R",
  diameter: "17.5",
  season: "ALL_SEASON",
  loadIndex: "143/141",
  speedIndex: "K",
  country: "Xitoy",
  warranty: "1 yil",
  featured: false,
  isActive: true,
  isArchived: false,
  soldCount: 0,
};

const checks: Array<[string, string, boolean]> = [
  ["empty query", "", true],
  ["width only", "235", true],
  ["profile only", "75", true],
  ["decimal diameter", "17.5", true],
  ["compact decimal diameter", "175", true],
  ["diameter with R", "R17.5", true],
  ["diameter with separated R", "r 17.5", true],
  ["slash size", "235/75/R17.5", true],
  ["space separated size", "235 75 17.5", true],
  ["fully compact size", "23575175", true],
  ["numeric name suffix", "16PR", true],
  ["load index", "143/141", true],
  ["model without separator", "rm7", true],
  ["different width", "225 75 17.5", false],
  ["different profile", "235 80 17.5", false],
];

let passed = 0;
for (const [name, query, expected] of checks) {
  const actual = matchesProductQuery(product, query);
  const ok = actual === expected;
  if (ok) passed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — query=${JSON.stringify(query)} result=${actual}`);
}

console.log(`\n=== Summary: ${passed}/${checks.length} passed ===`);
if (passed !== checks.length) process.exitCode = 1;
