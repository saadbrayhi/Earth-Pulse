/** Convert a viewport divider to an image-relative percentage after Leaflet pans. */
export function imageSplitPercent(viewportLeft: number, viewportWidth: number, imageLeft: number, imageWidth: number, split: number) {
  if (![viewportLeft, viewportWidth, imageLeft, imageWidth, split].every(Number.isFinite) || imageWidth <= 0 || viewportWidth <= 0) {
    throw new Error("Cannot clip an image with invalid viewport geometry.");
  }
  return Math.min(100, Math.max(0, (viewportLeft + viewportWidth * split / 100 - imageLeft) / imageWidth * 100));
}
