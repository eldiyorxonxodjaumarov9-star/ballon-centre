"use client";

import { useCallback, useEffect, useRef } from "react";
import { registerSearchInput } from "@/lib/ui/keyboard";

export function useSearchInputRef(enabled = true) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!enabled) {
      if (ref.current) registerSearchInput(null);
      return;
    }
    const element = ref.current;
    if (!element) return;
    registerSearchInput(element);
    return () => {
      registerSearchInput(null);
    };
  }, [enabled]);

  const dismissKeyboard = useCallback(() => {
    ref.current?.blur();
  }, []);

  return { ref, dismissKeyboard };
}
