"use client";

import { create } from "zustand";

interface UiState {
  searchOpen: boolean;
  filterOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  setFilterOpen: (open: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  searchOpen: false,
  filterOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setFilterOpen: (filterOpen) => set({ filterOpen }),
}));
