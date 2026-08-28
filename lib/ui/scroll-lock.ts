let lockCount = 0;
let htmlOverflow = "";
let bodyOverflow = "";

export function getScrollLockCount(): number {
  return lockCount;
}

/** Test-only: clears lock state without touching the DOM. */
export function resetScrollLockForTests(): void {
  lockCount = 0;
  htmlOverflow = "";
  bodyOverflow = "";
}

export function acquireScrollLock(): () => void {
  lockCount += 1;
  if (lockCount === 1) {
    htmlOverflow = document.documentElement.style.overflow;
    bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("scroll-locked");
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      document.documentElement.classList.remove("scroll-locked");
    }
  };
}
