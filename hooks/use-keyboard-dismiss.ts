"use client";

import { useEffect, type RefObject } from "react";
import { blurActiveElement, isEditableElement } from "@/lib/ui/keyboard";

export function useDismissKeyboardOnOutsidePointer(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: PointerEvent) => {
      if (isEditableElement(event.target)) return;
      blurActiveElement();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [enabled]);
}

export function useDismissKeyboardOnUserScroll(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    let container: HTMLElement | null = null;
    let frame = 0;
    let touchActive = false;
    let touchStartY = 0;
    let moved = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchActive = true;
      moved = false;
      touchStartY = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchActive || event.touches.length !== 1) return;
      if (Math.abs(event.touches[0].clientY - touchStartY) > 10) {
        moved = true;
      }
    };

    const onTouchEnd = () => {
      touchActive = false;
    };

    const onScroll = () => {
      if (!moved) return;
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || !isEditableElement(active)) return;
      if (container?.contains(active)) {
        blurActiveElement();
      }
      moved = false;
    };

    const attach = () => {
      container = containerRef.current;
      if (!container) {
        frame = requestAnimationFrame(attach);
        return;
      }
      container.addEventListener("touchstart", onTouchStart, { passive: true });
      container.addEventListener("touchmove", onTouchMove, { passive: true });
      container.addEventListener("touchend", onTouchEnd, { passive: true });
      container.addEventListener("touchcancel", onTouchEnd, { passive: true });
      container.addEventListener("scroll", onScroll, { passive: true });
    };

    attach();

    return () => {
      cancelAnimationFrame(frame);
      if (!container) return;
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
      container.removeEventListener("scroll", onScroll);
    };
  }, [containerRef, enabled]);
}
