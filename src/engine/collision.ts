// Collision detection for player movement

import { Wall } from '../data/world';

export interface AABB {
  x: number; y: number; w: number; h: number;
}

export function rectOverlap(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export function resolveCollision(
  px: number, py: number, pw: number, ph: number,
  newX: number, newY: number,
  walls: Wall[]
): { x: number; y: number } {
  const playerBox: AABB = { x: newX, y: newY, w: pw, h: ph };

  // Try full movement
  let collides = false;
  for (const wall of walls) {
    if (rectOverlap(playerBox, wall)) {
      collides = true;
      break;
    }
  }
  if (!collides) return { x: newX, y: newY };

  // Try X only
  const xBox: AABB = { x: newX, y: py, w: pw, h: ph };
  let xOk = true;
  for (const wall of walls) {
    if (rectOverlap(xBox, wall)) { xOk = false; break; }
  }

  // Try Y only
  const yBox: AABB = { x: px, y: newY, w: pw, h: ph };
  let yOk = true;
  for (const wall of walls) {
    if (rectOverlap(yBox, wall)) { yOk = false; break; }
  }

  if (xOk && yOk) return { x: newX, y: py }; // prefer X
  if (xOk) return { x: newX, y: py };
  if (yOk) return { x: px, y: newY };
  return { x: px, y: py };
}

export function pointInRect(px: number, py: number, rect: AABB): boolean {
  return px >= rect.x && px < rect.x + rect.w && py >= rect.y && py < rect.y + rect.h;
}

export function distanceBetween(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}
