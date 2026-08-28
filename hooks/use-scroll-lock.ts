"use client";

import { useEffect } from "react";
import { acquireScrollLock } from "@/lib/ui/scroll-lock";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return acquireScrollLock();
  }, [active]);
}
