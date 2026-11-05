/** Returns the element matching `selector`, checked against `kind` at runtime instead of cast. */
export function findElement<T extends Element>(selector: string, kind: abstract new () => T): T {
  const element = document.querySelector(selector);
  if (element instanceof kind) {
    return element;
  }
  throw new Error(`No ${kind.name} matches ${selector}`);
}
