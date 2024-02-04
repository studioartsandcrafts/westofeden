/** Blurs the node when Escape is pressed */
export function blurOnEscape(node: HTMLButtonElement) {
  const handleKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && node && typeof node.blur === "function")
      node.blur();
  };

  node.addEventListener("keydown", handleKey);

  return {
    destroy() {
      node.removeEventListener("keydown", handleKey);
    },
  };
}
