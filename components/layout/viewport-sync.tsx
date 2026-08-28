"use client";

import { useEffect } from "react";

export function ViewportSync() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
        document.documentElement.style.setProperty("--viewport-height", `${vv.height}px`);
      });
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      document.documentElement.style.removeProperty("--keyboard-inset");
      document.documentElement.style.removeProperty("--viewport-height");
    };
  }, []);

  return null;
}
