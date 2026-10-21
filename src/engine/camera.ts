// Smooth-following camera

export class Camera {
  x = 0;
  y = 0;
  viewW: number;
  viewH: number;
  worldW: number;
  worldH: number;
  private smoothing = 0.08;

  constructor(viewW: number, viewH: number, worldW: number, worldH: number) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.worldW = worldW;
    this.worldH = worldH;
  }

  follow(targetX: number, targetY: number, dt: number) {
    const desiredX = targetX - this.viewW / 2;
    const desiredY = targetY - this.viewH / 2;

    const t = 1 - Math.pow(1 - this.smoothing, dt * 60);
    this.x += (desiredX - this.x) * t;
    this.y += (desiredY - this.y) * t;

    // Clamp to world bounds
    this.x = Math.max(0, Math.min(this.worldW - this.viewW, this.x));
    this.y = Math.max(0, Math.min(this.worldH - this.viewH, this.y));
  }

  snapTo(targetX: number, targetY: number) {
    this.x = targetX - this.viewW / 2;
    this.y = targetY - this.viewH / 2;
    this.x = Math.max(0, Math.min(this.worldW - this.viewW, this.x));
    this.y = Math.max(0, Math.min(this.worldH - this.viewH, this.y));
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return { x: sx + this.x, y: sy + this.y };
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return { x: wx - this.x, y: wy - this.y };
  }

  resize(viewW: number, viewH: number) {
    this.viewW = viewW;
    this.viewH = viewH;
  }
}
