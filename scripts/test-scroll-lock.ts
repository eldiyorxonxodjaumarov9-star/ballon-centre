/**
 * Node-side checks for refcounted scroll-lock behaviour.
 * Uses a minimal DOM stub (no browser / phone required).
 */

type StyleBag = { overflow: string };
type ClassList = { add: (name: string) => void; remove: (name: string) => void; has: (name: string) => boolean };

function createDomStub() {
  const htmlClasses = new Set<string>();
  const bodyClasses = new Set<string>();
  const htmlStyle: StyleBag = { overflow: "" };
  const bodyStyle: StyleBag = { overflow: "" };

  const makeClassList = (set: Set<string>): ClassList => ({
    add: (name) => set.add(name),
    remove: (name) => set.delete(name),
    has: (name) => set.has(name),
  });

  (globalThis as { document?: unknown }).document = {
    documentElement: {
      style: htmlStyle,
      classList: makeClassList(htmlClasses),
    },
    body: {
      style: bodyStyle,
      classList: makeClassList(bodyClasses),
    },
  };

  return { htmlStyle, bodyStyle, htmlClasses };
}

type Check = { name: string; pass: boolean; detail?: string };
const checks: Check[] = [];

function record(name: string, pass: boolean, detail?: string) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const stub = createDomStub();
  const {
    acquireScrollLock,
    getScrollLockCount,
    resetScrollLockForTests,
  } = await import("../lib/ui/scroll-lock");

  resetScrollLockForTests();
  stub.htmlStyle.overflow = "auto";
  stub.bodyStyle.overflow = "scroll";
  stub.htmlClasses.clear();

  const releaseA = acquireScrollLock();
  record("first lock applies overflow hidden", stub.bodyStyle.overflow === "hidden" && stub.htmlStyle.overflow === "hidden");
  record("first lock adds scroll-locked class", stub.htmlClasses.has("scroll-locked"));
  record("lock count is 1 after first acquire", getScrollLockCount() === 1);

  const releaseB = acquireScrollLock();
  record("second lock keeps count at 2", getScrollLockCount() === 2);
  record("styles stay locked while second modal open", stub.bodyStyle.overflow === "hidden");

  releaseA();
  record("closing first modal keeps lock for remaining modal", getScrollLockCount() === 1 && stub.bodyStyle.overflow === "hidden");
  record("scroll-locked class remains with open modal", stub.htmlClasses.has("scroll-locked"));

  releaseB();
  record("last unlock restores prior body overflow", stub.bodyStyle.overflow === "scroll");
  record("last unlock restores prior html overflow", stub.htmlStyle.overflow === "auto");
  record("last unlock removes scroll-locked class", !stub.htmlClasses.has("scroll-locked"));
  record("lock count is 0 after all released", getScrollLockCount() === 0);

  // Double-release must not corrupt the counter (StrictMode / unmount safety).
  releaseB();
  record("double-release is a no-op", getScrollLockCount() === 0 && stub.bodyStyle.overflow === "scroll");

  // Simulate remount: acquire → release → acquire (StrictMode / route change).
  const releaseC = acquireScrollLock();
  releaseC();
  const releaseD = acquireScrollLock();
  record("remount cycle leaves single active lock", getScrollLockCount() === 1 && stub.bodyStyle.overflow === "hidden");
  releaseD();
  record("remount cleanup restores styles", getScrollLockCount() === 0 && stub.bodyStyle.overflow === "scroll");

  // Nested unlock order reversed (B then A already covered); also unlock when none left.
  const releaseE = acquireScrollLock();
  const releaseF = acquireScrollLock();
  releaseF();
  releaseE();
  releaseE();
  record("nested reverse unlock ends clean", getScrollLockCount() === 0 && !stub.htmlClasses.has("scroll-locked"));

  const failed = checks.filter((c) => !c.pass);
  console.log(`\n=== Summary: ${checks.length - failed.length}/${checks.length} passed ===`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
