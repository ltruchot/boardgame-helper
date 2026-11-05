export function setupCounter(element: HTMLButtonElement): void {
  let counter = 0;
  const render = (): void => {
    element.replaceChildren(`Count is ${String(counter)}`);
  };
  element.addEventListener("click", () => {
    counter += 1;
    render();
  });
  render();
}
