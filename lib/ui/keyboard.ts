const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable=''], [contenteditable='true']";

let registeredSearchInput: HTMLInputElement | null = null;

export function registerSearchInput(element: HTMLInputElement | null) {
  registeredSearchInput = element;
}

export function isEditableElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest(EDITABLE_SELECTOR));
}

export function isInsideSearchInput(target: EventTarget | null) {
  if (!(target instanceof Node) || !registeredSearchInput) return false;
  return target === registeredSearchInput || registeredSearchInput.contains(target);
}

export function blurActiveElement() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && isEditableElement(active)) {
    active.blur();
  }
}

export function blurActiveSearchInput() {
  const active = document.activeElement;
  if (registeredSearchInput && active === registeredSearchInput) {
    registeredSearchInput.blur();
  }
}

export function dismissKeyboard() {
  blurActiveElement();
}
