import type { DropZone } from "./page-move";

// Top quarter of a row = before, bottom quarter = after, middle = nest inside.
export function dropZoneAt(
  pointerY: number,
  rect: { top: number; height: number },
): DropZone {
  const ratio = (pointerY - rect.top) / Math.max(rect.height, 1);
  if (ratio < 0.25) return "before";
  if (ratio > 0.75) return "after";
  return "inside";
}

export function pointerClientY(event: Event | null): number | null {
  if (!event) return null;
  if ("touches" in event) {
    const touch =
      (event as TouchEvent).touches[0] ??
      (event as TouchEvent).changedTouches[0];
    return touch ? touch.clientY : null;
  }
  return "clientY" in event ? (event as MouseEvent).clientY : null;
}
