// HUD rendering - minimap, status, interaction prompts

import { Camera } from '../engine/camera';
import { GameState } from '../engine/gameState';
import { OBJECTS, MODULE_COLORS, ModuleName } from '../data/objects';
import { ROOMS, OBJECT_PLACEMENTS, TILE, WORLD_W, WORLD_H } from '../data/world';
import { getNPCPosition } from '../engine/renderer';

const MODULE_CIRCLE_COLORS: Record<string, string> = {
  'What is Robotics?': '#E8D44D',
  'Robots': '#9575CD',
  'Industrial Robots': '#FF8A65',
  'Mobile Robots': '#4FC3F7',
  'Applications': '#66BB6A',
};

export class HUD {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(camera: Camera, state: GameState) {
    if (state.overlay !== 'none') return;

    const ctx = this.ctx;
    const w = this.canvas.width;

    this.drawMinimap(ctx, w, state);
    this.drawStatus(ctx, state);
    this.drawInteractionPrompt(ctx, w, state, camera);
  }

  private drawMinimap(ctx: CanvasRenderingContext2D, canvasW: number, state: GameState) {
    const mapW = 180;
    const mapH = Math.round(180 * (WORLD_H / WORLD_W));
    const mx = canvasW - mapW - 12;
    const my = 12;
    const scale = mapW / WORLD_W;

    // Background with glass effect
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    this.roundRect(ctx, mx, my, mapW, mapH, 12, true, true);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Rooms
    for (const room of ROOMS) {
      if (room.id === 'hall_main') {
        ctx.fillStyle = 'rgba(240,237,229,0.8)';
      } else {
        const colors = MODULE_COLORS[room.module as ModuleName];
        ctx.fillStyle = colors?.floor || '#eee';
      }
      const rx = mx + room.x * scale;
      const ry = my + room.y * scale;
      const rw = room.w * scale;
      const rh = room.h * scale;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(rx, ry, rw, rh);
    }

    // Objects
    for (const p of OBJECT_PLACEMENTS) {
      const obj = OBJECTS.find(o => o.id === p.objectId);
      if (!obj) continue;
      const disc = state.isDiscovered(obj.id);
      if (!disc && !state.save.settings.showRemainingObjects) continue;

      const ox = mx + p.x * scale;
      const oy = my + p.y * scale;
      ctx.fillStyle = disc ? MODULE_CIRCLE_COLORS[obj.module] : 'rgba(200,200,200,0.6)';
      ctx.beginPath();
      ctx.arc(ox, oy, disc ? 2 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // NPC Robi on minimap
    const npc = getNPCPosition();
    const npx = mx + (npc.x + 12) * scale;
    const npy = my + (npc.y + 12) * scale;
    ctx.fillStyle = '#EF6C00';
    ctx.beginPath();
    ctx.arc(npx, npy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Player
    const px = mx + (state.player.x + 12) * scale;
    const py = my + (state.player.y + 12) * scale;
    ctx.fillStyle = '#3564D8';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Direction indicator
    const dirOffsets: Record<string, { x: number; y: number }> = {
      up: { x: 0, y: -5 },
      down: { x: 0, y: 5 },
      left: { x: -5, y: 0 },
      right: { x: 5, y: 0 },
    };
    const dir = dirOffsets[state.player.direction];
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(px + dir.x, py + dir.y, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Module label
    const currentModule = state.getCurrentModule();
    ctx.font = '9px system-ui';
    ctx.fillStyle = '#627185';
    ctx.textAlign = 'left';
    ctx.fillText(currentModule, mx + 4, my + mapH - 4);
  }

  private drawStatus(ctx: CanvasRenderingContext2D, state: GameState) {
    const sx = 12;
    const sy = 12;
    const sw = 210;
    const sh = 72;

    // Background with glass effect
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(0,0,0,0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    this.roundRect(ctx, sx, sy, sw, sh, 12, true, true);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    const currentModule = state.getCurrentModule();
    const progress = state.getModuleProgress(currentModule);
    const color = MODULE_CIRCLE_COLORS[currentModule] || '#888';

    // Module name
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx + 12, sy + 14, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 11px system-ui';
    ctx.fillStyle = '#263445';
    ctx.textAlign = 'left';
    ctx.fillText(currentModule, sx + 22, sy + 18);

    // Playtime
    ctx.font = '10px system-ui';
    ctx.fillStyle = '#90A4AE';
    ctx.fillText(state.getPlayTimeFormatted(), sx + 12, sy + 34);

    // Object count
    ctx.font = 'bold 11px system-ui';
    ctx.fillStyle = '#627185';
    ctx.fillText(`${progress.discovered} / ${progress.total} objects`, sx + 12, sy + 52);

    // Quiz counters (only if module has questions)
    if (progress.hasQuestions) {
      const qx = sx + 120;
      ctx.font = '10px system-ui';
      ctx.fillStyle = '#4CAF50';
      ctx.fillText(`\u2713${progress.correctCount}`, qx, sy + 52);
      ctx.fillStyle = '#F44336';
      ctx.fillText(`\u2717${progress.incorrectCount}`, qx + 28, sy + 52);
      ctx.fillStyle = '#FF9800';
      ctx.fillText(`?${progress.reviewCount}`, qx + 56, sy + 52);
    }
  }

  private drawInteractionPrompt(ctx: CanvasRenderingContext2D, canvasW: number, state: GameState, camera: Camera) {
    if (!state.nearestObjectId) return;

    const obj = OBJECTS.find(o => o.id === state.nearestObjectId);
    if (!obj) return;

    // Bottom-center prompt - pill shape with gradient
    const text = `E  Inspect`;
    ctx.font = '600 13px system-ui';
    const metrics = ctx.measureText(text);
    const pw = metrics.width + 32;
    const ph = 34;
    const px = canvasW / 2 - pw / 2;
    const py = this.canvas.height - 64;

    // Shadow
    ctx.shadowColor = 'rgba(53, 100, 216, 0.25)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
    grad.addColorStop(0, '#4A7AE8');
    grad.addColorStop(1, '#3564D8');
    ctx.fillStyle = grad;
    this.roundRect(ctx, px, py, pw, ph, ph / 2, true, false);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvasW / 2, py + ph / 2);
    ctx.textBaseline = 'top';

    // Object name label near the object
    const placement = OBJECT_PLACEMENTS.find(p => p.objectId === state.nearestObjectId);
    if (placement) {
      const sx = placement.x - camera.x;
      const sy = placement.y - camera.y - 24;

      ctx.font = '10px system-ui';
      const nameMetrics = ctx.measureText(obj.name);
      const nw = nameMetrics.width + 12;
      const nh = 18;

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      this.roundRect(ctx, sx - nw / 2, sy, nw, nh, 4, true, false);
      ctx.fillStyle = '#263445';
      ctx.textAlign = 'center';
      ctx.fillText(obj.name, sx, sy + 4);
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: boolean, stroke: boolean) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
