export function navigateWithTransition(navigate: () => void): void {
  if (typeof document === 'undefined') {
    navigate();
    return;
  }

  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };

  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      navigate();
    });
    return;
  }

  navigate();
}
