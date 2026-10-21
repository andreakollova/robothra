// Canvas rendering - world, player, objects, furniture, rooms

import { Camera } from './camera';
import { ROOMS, RoomDef, TILE, OBJECT_PLACEMENTS, getAllWalls } from '../data/world';
import { OBJECTS, MODULE_COLORS, ModuleName } from '../data/objects';
import { GameState } from './gameState';

// Module color for objects (fallback circles for objects without PNGs)
const MODULE_CIRCLE_COLORS: Record<string, string> = {
  'What is Robotics?': '#E8D44D',
  'Robots': '#9575CD',
  'Industrial Robots': '#FF8A65',
  'Mobile Robots': '#4FC3F7',
  'Applications': '#66BB6A',
};

// Object sprite cache
const spriteCache: Record<string, HTMLImageElement | null> = {};
const spriteLoading = new Set<string>();

function loadSprite(objectId: string): HTMLImageElement | null {
  if (objectId in spriteCache) return spriteCache[objectId];
  if (spriteLoading.has(objectId)) return null;
  spriteLoading.add(objectId);
  const img = new Image();
  img.src = `/objects/${objectId}.png`;
  img.onload = () => {
    spriteCache[objectId] = img;
    spriteLoading.delete(objectId);
  };
  img.onerror = () => {
    spriteCache[objectId] = null; // No image available, use circle fallback
    spriteLoading.delete(objectId);
  };
  return null;
}

// Preload all object sprites
for (const obj of OBJECTS) {
  loadSprite(obj.id);
}

export function getSpriteForObject(objectId: string): HTMLImageElement | null {
  return spriteCache[objectId] || null;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(camera: Camera, state: GameState, dt: number) {
    this.time += dt;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = '#E8E4DC';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw rooms
    this.drawRooms(ctx, camera);

    // Draw furniture
    this.drawFurniture(ctx, camera);

    // Draw decorations (animated)
    this.drawDecorations(ctx, camera);

    // Draw objects (colored circles)
    this.drawObjects(ctx, camera, state);

    // Draw player
    this.drawPlayer(ctx, state);

    // Draw signs
    this.drawSigns(ctx, camera);

    ctx.restore();
  }

  private isVisible(camera: Camera, x: number, y: number, w: number, h: number): boolean {
    return x + w > camera.x && x < camera.x + camera.viewW &&
           y + h > camera.y && y < camera.y + camera.viewH;
  }

  private drawRooms(ctx: CanvasRenderingContext2D, camera: Camera) {
    for (const room of ROOMS) {
      if (!this.isVisible(camera, room.x, room.y, room.w, room.h)) continue;

      const colors = MODULE_COLORS[room.module as ModuleName] || MODULE_COLORS['What is Robotics?'];

      // Floor
      ctx.fillStyle = room.outdoor ? '#E5EDDF' : colors.floor;
      ctx.fillRect(room.x, room.y, room.w, room.h);

      // Floor pattern - subtle grid
      ctx.strokeStyle = room.outdoor ? '#D5DDD0' : this.adjustAlpha(colors.wall, 0.3);
      ctx.lineWidth = 0.5;
      for (let gx = room.x; gx < room.x + room.w; gx += TILE) {
        ctx.beginPath();
        ctx.moveTo(gx, room.y);
        ctx.lineTo(gx, room.y + room.h);
        ctx.stroke();
      }
      for (let gy = room.y; gy < room.y + room.h; gy += TILE) {
        ctx.beginPath();
        ctx.moveTo(room.x, gy);
        ctx.lineTo(room.x + room.w, gy);
        ctx.stroke();
      }

      // Outdoor decorations
      if (room.outdoor) {
        this.drawOutdoorDetails(ctx, room);
      }

      // Walls
      ctx.fillStyle = colors.wall;
      for (const wall of room.walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        // Wall shadow
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(wall.x + 2, wall.y + 2, wall.w, wall.h);
        ctx.fillStyle = colors.wall;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      }
    }
  }

  private drawOutdoorDetails(ctx: CanvasRenderingContext2D, room: RoomDef) {
    // Grass patches
    ctx.fillStyle = '#C8DEB8';
    const seed = room.x * 7 + room.y * 13;
    for (let i = 0; i < 8; i++) {
      const gx = room.x + ((seed + i * 37) % (room.w - TILE * 2)) + TILE;
      const gy = room.y + ((seed + i * 53) % (room.h - TILE * 2)) + TILE;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 15 + (i % 3) * 5, 10 + (i % 2) * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Path markings for navigation courtyard
    if (room.id === 'mr_courtyard') {
      ctx.strokeStyle = '#B8C8A8';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(room.x + TILE * 3, room.y + TILE * 5);
      ctx.lineTo(room.x + TILE * 8, room.y + TILE * 5);
      ctx.lineTo(room.x + TILE * 8, room.y + TILE * 8);
      ctx.lineTo(room.x + TILE * 3, room.y + TILE * 8);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private drawFurniture(ctx: CanvasRenderingContext2D, camera: Camera) {
    for (const room of ROOMS) {
      if (!this.isVisible(camera, room.x, room.y, room.w, room.h)) continue;

      for (const f of room.furniture) {
        if (!this.isVisible(camera, f.x, f.y, f.w, f.h)) continue;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        this.drawRoundedRect(ctx, f.x + 3, f.y + 3, f.w, f.h, 4);

        // Furniture body
        switch (f.type) {
          case 'desk':
          case 'workbench':
          case 'calibration_bench':
          case 'lab_bench':
          case 'sensor_bench':
          case 'electronics_bench':
          case 'motor_bench':
          case 'test_rig':
          case 'workpiece_table':
            ctx.fillStyle = '#C4A882';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 4);
            ctx.fillStyle = '#B89B73';
            ctx.fillRect(f.x + 4, f.y + 4, f.w - 8, 3);
            break;
          case 'bench':
          case 'bench_outdoor':
            ctx.fillStyle = '#A0937D';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 6);
            ctx.fillStyle = '#8B7F6B';
            ctx.fillRect(f.x + 4, f.y + f.h / 2 - 1, f.w - 8, 2);
            break;
          case 'plant':
          case 'planter':
            ctx.fillStyle = '#8B7355';
            this.drawRoundedRect(ctx, f.x + f.w * 0.2, f.y + f.h * 0.4, f.w * 0.6, f.h * 0.6, 3);
            ctx.fillStyle = '#6B9B5A';
            ctx.beginPath();
            ctx.ellipse(f.x + f.w / 2, f.y + f.h * 0.3, f.w * 0.4, f.h * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'bookshelf':
          case 'filing_cabinet':
          case 'instrument_rack':
          case 'tool_rack':
          case 'battery_rack':
            ctx.fillStyle = '#9B8B75';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 3);
            // Shelves
            const shelves = 3;
            ctx.fillStyle = '#7B6B55';
            for (let i = 1; i < shelves; i++) {
              ctx.fillRect(f.x + 3, f.y + (f.h / shelves) * i, f.w - 6, 2);
            }
            break;
          case 'display_case':
          case 'display_pedestal':
          case 'gripper_stand':
          case 'exo_display':
            ctx.fillStyle = '#D8D2C8';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 6);
            ctx.strokeStyle = '#B8B2A8';
            ctx.lineWidth = 1.5;
            this.strokeRoundedRect(ctx, f.x, f.y, f.w, f.h, 6);
            break;
          case 'machine':
          case 'production_cell':
          case 'conveyor':
            ctx.fillStyle = '#A8B0B8';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 5);
            ctx.fillStyle = '#909AA0';
            ctx.fillRect(f.x + 5, f.y + 5, f.w - 10, f.h - 10);
            // Indicator light
            ctx.fillStyle = '#66BB6A';
            ctx.beginPath();
            ctx.arc(f.x + f.w - 8, f.y + 8, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'charging_station':
            ctx.fillStyle = '#78909C';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 5);
            // Lightning bolt
            ctx.fillStyle = '#FFD54F';
            ctx.beginPath();
            const cx = f.x + f.w / 2;
            const cy = f.y + f.h / 2;
            ctx.moveTo(cx, cy - 10);
            ctx.lineTo(cx - 5, cy + 2);
            ctx.lineTo(cx + 1, cy + 2);
            ctx.lineTo(cx - 2, cy + 12);
            ctx.lineTo(cx + 5, cy - 2);
            ctx.lineTo(cx - 1, cy - 2);
            ctx.closePath();
            ctx.fill();
            break;
          case 'robot_platform':
            ctx.fillStyle = '#B0BEC5';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 8);
            ctx.strokeStyle = '#90A4AE';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            this.strokeRoundedRect(ctx, f.x + 4, f.y + 4, f.w - 8, f.h - 8, 4);
            ctx.setLineDash([]);
            break;
          case 'chair':
            ctx.fillStyle = '#7986CB';
            ctx.beginPath();
            ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2.5, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'whiteboard':
            ctx.fillStyle = '#FFFFFF';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 2);
            ctx.strokeStyle = '#B0B0B0';
            ctx.lineWidth = 2;
            this.strokeRoundedRect(ctx, f.x, f.y, f.w, f.h, 2);
            break;
          case 'medical_table':
            ctx.fillStyle = '#E0E8E8';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 6);
            ctx.fillStyle = '#C8D8D8';
            ctx.fillRect(f.x + 5, f.y + 5, f.w - 10, f.h - 10);
            break;
          case 'medical_cabinet':
            ctx.fillStyle = '#E8E8EC';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 3);
            ctx.fillStyle = '#FF7043';
            ctx.fillRect(f.x + f.w / 2 - 4, f.y + 3, 8, 2);
            ctx.fillRect(f.x + f.w / 2 - 1, f.y + 1, 2, 6);
            break;
          case 'greenhouse_model':
            ctx.fillStyle = '#A5D6A7';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 8);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(f.x + 5, f.y + 5, f.w - 10, f.h / 2 - 5);
            break;
          case 'terrain_model':
            ctx.fillStyle = '#D7CCC8';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 4);
            ctx.fillStyle = '#BCAAA4';
            // Rocky terrain
            for (let i = 0; i < 5; i++) {
              ctx.beginPath();
              ctx.arc(f.x + 10 + i * 15, f.y + f.h / 2 + Math.sin(i) * 5, 6, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          case 'pallet_stack':
            for (let i = 0; i < 3; i++) {
              ctx.fillStyle = i % 2 === 0 ? '#C8A882' : '#B89872';
              this.drawRoundedRect(ctx, f.x + i * 2, f.y + i * 3, f.w - i * 4, f.h - i * 3, 2);
            }
            break;
          case 'construction_model':
            ctx.fillStyle = '#B0BEC5';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 4);
            ctx.fillStyle = '#FFB74D';
            ctx.fillRect(f.x + 3, f.y + 3, 8, f.h - 6);
            break;
          case 'cozy_area':
            ctx.fillStyle = '#E8D5E8';
            ctx.beginPath();
            ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'welding_cell':
          case 'paint_booth':
            ctx.fillStyle = '#B0B8C0';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 5);
            ctx.strokeStyle = '#FFB74D';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            this.strokeRoundedRect(ctx, f.x + 4, f.y + 4, f.w - 8, f.h - 8, 3);
            ctx.setLineDash([]);
            break;
          case 'oscilloscope':
            ctx.fillStyle = '#455A64';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 4);
            ctx.fillStyle = '#1B5E20';
            ctx.fillRect(f.x + 5, f.y + 5, f.w - 10, f.h - 15);
            // Wave
            ctx.strokeStyle = '#66FF66';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i < f.w - 14; i += 2) {
              const val = Math.sin((i + this.time * 100) * 0.1) * 6;
              if (i === 0) ctx.moveTo(f.x + 7 + i, f.y + f.h / 2 - 3 + val);
              else ctx.lineTo(f.x + 7 + i, f.y + f.h / 2 - 3 + val);
            }
            ctx.stroke();
            break;
          case 'path_markers':
            ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 8);
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(f.x + 10, f.y + f.h / 2);
            ctx.lineTo(f.x + f.w - 10, f.y + f.h / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(f.x + f.w / 2, f.y + 10);
            ctx.lineTo(f.x + f.w / 2, f.y + f.h - 10);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
          case 'terminal':
            ctx.fillStyle = '#37474F';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 4);
            ctx.fillStyle = '#263238';
            ctx.fillRect(f.x + 4, f.y + 4, f.w - 8, f.h - 16);
            // Screen glow
            ctx.fillStyle = '#4FC3F7';
            ctx.fillRect(f.x + 6, f.y + 6, f.w - 12, f.h - 20);
            ctx.fillStyle = '#263238';
            ctx.font = '6px monospace';
            ctx.fillText('>', f.x + 8, f.y + 14);
            break;
          case 'test_target':
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#E53935';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#E53935';
            ctx.beginPath();
            ctx.arc(f.x + f.w / 2, f.y + f.h / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          default:
            ctx.fillStyle = '#C0C0C0';
            this.drawRoundedRect(ctx, f.x, f.y, f.w, f.h, 4);
        }
      }
    }
  }

  private drawDecorations(ctx: CanvasRenderingContext2D, camera: Camera) {
    for (const room of ROOMS) {
      if (!this.isVisible(camera, room.x, room.y, room.w, room.h)) continue;

      for (const d of room.decorations) {
        switch (d.type) {
          case 'rotating_joint':
            this.drawRotatingJoint(ctx, d.x, d.y);
            break;
          case 'sliding_joint':
            this.drawSlidingJoint(ctx, d.x, d.y);
            break;
          case 'robot_arm_anim':
            this.drawRobotArmAnim(ctx, d.x, d.y);
            break;
          case 'beam_anim':
            this.drawBeamAnim(ctx, d.x, d.y);
            break;
          case 'mobile_robot_route':
            this.drawMobileRobotRoute(ctx, d.x, d.y, room);
            break;
          case 'greenhouse_gripper':
            this.drawGreenhouseGripper(ctx, d.x, d.y);
            break;
        }
      }
    }
  }

  private drawRotatingJoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const angle = this.time * 0.5;
    ctx.save();
    ctx.translate(x, y);
    // Base
    ctx.fillStyle = '#90A4AE';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    // Arm
    ctx.rotate(angle);
    ctx.fillStyle = '#607D8B';
    this.drawRoundedRect(ctx, -4, -4, 35, 8, 3);
    ctx.fillStyle = '#FF8A65';
    ctx.beginPath();
    ctx.arc(30, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSlidingJoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const offset = Math.sin(this.time * 0.8) * 18;
    ctx.save();
    ctx.translate(x, y);
    // Rail
    ctx.fillStyle = '#B0BEC5';
    this.drawRoundedRect(ctx, -25, -3, 50, 6, 2);
    // Slider
    ctx.fillStyle = '#607D8B';
    this.drawRoundedRect(ctx, offset - 8, -8, 16, 16, 4);
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.arc(offset, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawRobotArmAnim(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const t = this.time * 0.4;
    const angle1 = Math.sin(t) * 0.6;
    const angle2 = Math.cos(t * 0.7) * 0.5;

    ctx.save();
    ctx.translate(x, y);

    // Base
    ctx.fillStyle = '#78909C';
    this.drawRoundedRect(ctx, -12, -6, 24, 12, 4);

    // Arm 1
    ctx.rotate(angle1);
    ctx.fillStyle = '#546E7A';
    this.drawRoundedRect(ctx, 0, -4, 30, 8, 3);

    // Arm 2
    ctx.translate(28, 0);
    ctx.rotate(angle2);
    ctx.fillStyle = '#455A64';
    this.drawRoundedRect(ctx, 0, -3, 22, 6, 2);

    // End effector
    ctx.fillStyle = '#FF8A65';
    ctx.beginPath();
    ctx.arc(20, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawBeamAnim(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const interrupted = Math.sin(this.time * 2) > 0.3;

    ctx.save();
    ctx.translate(x, y);

    // Emitter
    ctx.fillStyle = '#455A64';
    this.drawRoundedRect(ctx, -8, -20, 16, 12, 3);
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.arc(0, -10, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beam
    if (!interrupted) {
      ctx.strokeStyle = 'rgba(229, 57, 53, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 30);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Receiver
    ctx.fillStyle = '#455A64';
    this.drawRoundedRect(ctx, -8, 28, 16, 12, 3);
    ctx.fillStyle = interrupted ? '#66BB6A' : '#90A4AE';
    ctx.beginPath();
    ctx.arc(0, 34, 3, 0, Math.PI * 2);
    ctx.fill();

    // Test object crossing
    if (interrupted) {
      const objX = Math.sin(this.time * 1.5) * 12;
      ctx.fillStyle = '#B0BEC5';
      this.drawRoundedRect(ctx, objX - 6, 6, 12, 12, 2);
    }

    ctx.restore();
  }

  private drawMobileRobotRoute(ctx: CanvasRenderingContext2D, x: number, y: number, room: RoomDef) {
    const t = this.time * 0.3;
    // Simple looping path
    const pathLen = 160;
    const phase = (t % 4) / 4;
    let rx: number, ry: number;
    if (phase < 0.25) {
      rx = x - 40 + phase * 4 * 80;
      ry = y;
    } else if (phase < 0.5) {
      rx = x + 40;
      ry = y + (phase - 0.25) * 4 * 60;
    } else if (phase < 0.75) {
      rx = x + 40 - (phase - 0.5) * 4 * 80;
      ry = y + 60;
    } else {
      rx = x - 40;
      ry = y + 60 - (phase - 0.75) * 4 * 60;
    }

    // Trail
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.rect(x - 40, y, 80, 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Small robot
    ctx.fillStyle = '#546E7A';
    ctx.beginPath();
    ctx.arc(rx, ry, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGreenhouseGripper(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const grip = Math.sin(this.time * 0.6) * 0.5 + 0.5; // 0-1

    ctx.save();
    ctx.translate(x, y);

    // Arm
    ctx.fillStyle = '#78909C';
    this.drawRoundedRect(ctx, -3, -20, 6, 20, 2);

    // Fingers
    const spread = 8 + grip * 6;
    ctx.fillStyle = '#66BB6A';
    this.drawRoundedRect(ctx, -spread - 3, -2, 6, 14, 2);
    this.drawRoundedRect(ctx, spread - 3, -2, 6, 14, 2);

    // Fruit
    if (grip < 0.3) {
      ctx.fillStyle = '#FF7043';
      ctx.beginPath();
      ctx.arc(0, 8, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawObjects(ctx: CanvasRenderingContext2D, camera: Camera, state: GameState) {
    for (const placement of OBJECT_PLACEMENTS) {
      const spriteSize = 40;
      if (!this.isVisible(camera, placement.x - spriteSize, placement.y - spriteSize, spriteSize * 2, spriteSize * 2)) continue;

      const obj = OBJECTS.find(o => o.id === placement.objectId);
      if (!obj) continue;

      const discovered = state.isDiscovered(obj.id);
      const isNearest = state.nearestObjectId === obj.id;
      const color = MODULE_CIRCLE_COLORS[obj.module] || '#888';
      const sprite = spriteCache[obj.id];

      if (sprite) {
        // === PNG sprite rendering ===
        const size = obj.large ? 56 : 48;
        const halfSize = size / 2;

        // Glow pulse for undiscovered
        if (!discovered) {
          const pulse = Math.sin(this.time * 2) * 0.15 + 0.85;
          ctx.fillStyle = this.adjustAlpha(color, 0.18 * pulse);
          ctx.beginPath();
          ctx.arc(placement.x, placement.y, halfSize + 10, 0, Math.PI * 2);
          ctx.fill();
        }

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.10)';
        ctx.beginPath();
        ctx.ellipse(placement.x + 2, placement.y + halfSize + 2, halfSize * 0.7, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw the sprite
        ctx.save();
        if (discovered) ctx.globalAlpha = 0.5;
        ctx.drawImage(sprite, placement.x - halfSize, placement.y - halfSize, size, size);
        ctx.restore();

        // Interaction outline
        if (isNearest && !discovered) {
          ctx.strokeStyle = '#3564D8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(placement.x, placement.y, halfSize + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Checkmark overlay for discovered
        if (discovered) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(placement.x + halfSize - 4, placement.y - halfSize + 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('\u2713', placement.x + halfSize - 4, placement.y - halfSize + 4);
        }

        // SCAN label for large undiscovered
        if (obj.large && !discovered) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.font = '8px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('SCAN', placement.x, placement.y + halfSize + 12);
        }
      } else {
        // === Colored circle fallback (no PNG) ===
        const radius = obj.large ? 22 : 18;

        // Glow for undiscovered
        if (!discovered) {
          const pulse = Math.sin(this.time * 2) * 0.15 + 0.85;
          ctx.fillStyle = this.adjustAlpha(color, 0.2 * pulse);
          ctx.beginPath();
          ctx.arc(placement.x, placement.y, radius + 8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(placement.x + 2, placement.y + radius + 2, radius * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main circle
        ctx.fillStyle = discovered ? this.adjustAlpha(color, 0.5) : color;
        ctx.beginPath();
        ctx.arc(placement.x, placement.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(placement.x - radius * 0.2, placement.y - radius * 0.2, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Outline for nearest
        if (isNearest && !discovered) {
          ctx.strokeStyle = '#3564D8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(placement.x, placement.y, radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Checkmark for discovered
        if (discovered) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('\u2713', placement.x, placement.y);
        }

        // Large indicator
        if (obj.large && !discovered) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '8px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('SCAN', placement.x, placement.y + radius + 12);
        }
      }
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
    const { x, y, direction } = state.player;
    const bobble = Math.sin(this.time * 8) * (state.player.moving ? 1.5 : 0);

    ctx.save();
    ctx.translate(x + 12, y + 12 + bobble);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#546E7A';
    this.drawRoundedRect(ctx, -10, -10, 20, 20, 6);

    // Body highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    this.drawRoundedRect(ctx, -8, -9, 16, 8, 4);

    // Sensor (front indicator)
    const sensorOffsets: Record<string, { x: number; y: number }> = {
      up: { x: 0, y: -11 },
      down: { x: 0, y: 11 },
      left: { x: -11, y: 0 },
      right: { x: 11, y: 0 },
    };
    const so = sensorOffsets[direction] || sensorOffsets.down;
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.arc(so.x, so.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Sensor glow
    ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
    ctx.beginPath();
    ctx.arc(so.x, so.y, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#37474F';
    if (direction === 'left' || direction === 'right') {
      this.drawRoundedRect(ctx, -8, -13, 4, 4, 1);
      this.drawRoundedRect(ctx, -8, 9, 4, 4, 1);
      this.drawRoundedRect(ctx, 4, -13, 4, 4, 1);
      this.drawRoundedRect(ctx, 4, 9, 4, 4, 1);
    } else {
      this.drawRoundedRect(ctx, -13, -8, 4, 4, 1);
      this.drawRoundedRect(ctx, 9, -8, 4, 4, 1);
      this.drawRoundedRect(ctx, -13, 4, 4, 4, 1);
      this.drawRoundedRect(ctx, 9, 4, 4, 4, 1);
    }

    ctx.restore();
  }

  private drawSigns(ctx: CanvasRenderingContext2D, camera: Camera) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const room of ROOMS) {
      if (!this.isVisible(camera, room.x, room.y, room.w, room.h)) continue;

      for (const sign of room.signs) {
        // Sign background
        ctx.font = 'bold 11px system-ui';
        const metrics = ctx.measureText(sign.text);
        const pw = metrics.width + 16;
        const ph = 20;

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        this.drawRoundedRect(ctx, sign.x - pw / 2, sign.y - 2, pw, ph, 4);

        if (sign.color) {
          ctx.fillStyle = sign.color;
          ctx.fillRect(sign.x - pw / 2, sign.y - 2, pw, 3);
        }

        ctx.fillStyle = '#263445';
        ctx.fillText(sign.text, sign.x, sign.y + 3);
      }
    }
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
    ctx.fill();
  }

  private strokeRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
    ctx.stroke();
  }

  private adjustAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
