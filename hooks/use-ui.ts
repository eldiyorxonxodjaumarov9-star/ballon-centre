"use client";

import { create } from "zustand";
import { blurActiveElement } from "@/lib/ui/keyboard";

interface UiState {
  searchOpen: boolean;
  filterOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  setFilterOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  searchOpen: false,
  filterOpen: false,
  setSearchOpen: (searchOpen) => {
    if (!searchOpen) blurActiveElement();
    set({ searchOpen });
  },
  setFilterOpen: (filterOpen) => {
    if (filterOpen) blurActiveElement();
    set({ filterOpen });
  },
}));
