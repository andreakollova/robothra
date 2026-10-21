// World map definition - rooms, walls, doorways, object placements
// All coordinates in world pixels. Each tile = 48px.

import { OBJECTS } from './objects';

export const TILE = 48;
const T = TILE;

export interface Wall {
  x: number; y: number; w: number; h: number;
}

export interface Doorway {
  x: number; y: number; w: number; h: number;
  connects: [string, string];
}

export interface RoomDef {
  id: string;
  name: string;
  module: string;
  x: number; y: number; w: number; h: number;
  walls: Wall[];
  furniture: FurnitureDef[];
  decorations: DecorationDef[];
  signs: SignDef[];
  outdoor?: boolean;
}

export interface FurnitureDef {
  type: string;
  x: number; y: number; w: number; h: number;
}

export interface DecorationDef {
  type: string;
  x: number; y: number;
  animated?: boolean;
}

export interface SignDef {
  text: string;
  x: number; y: number;
  color?: string;
}

export interface ObjectPlacement {
  objectId: string;
  roomId: string;
  x: number; y: number;
}

// Helper to create outer walls for a room with doorways cut out
function roomWalls(x: number, y: number, w: number, h: number, doors: { side: string; pos: number; size: number }[]): Wall[] {
  const wallThick = 12;
  let topSegments = [{ start: x, end: x + w }];
  let bottomSegments = [{ start: x, end: x + w }];
  let leftSegments = [{ start: y, end: y + h }];
  let rightSegments = [{ start: y, end: y + h }];

  for (const door of doors) {
    const dSize = door.size || T * 2;
    if (door.side === 'top') topSegments = cutSegments(topSegments, door.pos, door.pos + dSize);
    else if (door.side === 'bottom') bottomSegments = cutSegments(bottomSegments, door.pos, door.pos + dSize);
    else if (door.side === 'left') leftSegments = cutSegments(leftSegments, door.pos, door.pos + dSize);
    else if (door.side === 'right') rightSegments = cutSegments(rightSegments, door.pos, door.pos + dSize);
  }

  const walls: Wall[] = [];
  for (const s of topSegments) walls.push({ x: s.start, y, w: s.end - s.start, h: wallThick });
  for (const s of bottomSegments) walls.push({ x: s.start, y: y + h - wallThick, w: s.end - s.start, h: wallThick });
  for (const s of leftSegments) walls.push({ x, y: s.start, w: wallThick, h: s.end - s.start });
  for (const s of rightSegments) walls.push({ x: x + w - wallThick, y: s.start, w: wallThick, h: s.end - s.start });
  return walls;
}

function cutSegments(segments: { start: number; end: number }[], cutStart: number, cutEnd: number) {
  const result: { start: number; end: number }[] = [];
  for (const seg of segments) {
    if (cutEnd <= seg.start || cutStart >= seg.end) {
      result.push(seg);
    } else {
      if (cutStart > seg.start) result.push({ start: seg.start, end: cutStart });
      if (cutEnd < seg.end) result.push({ start: cutEnd, end: seg.end });
    }
  }
  return result;
}

/*
  WORLD LAYOUT (rooms share edges, doorways align)

  Row 0 (y=0):   [Z1: Reception][Z1: Exhibition]  gap  [Z2: Workshop][Z2: Display]
  Row 1 (y=RH):  [Z1: History  ][Z1: Demo Lab  ]  gap  [Z2: Calibr. ][Z2: Office ]
  Row 2 (y=2RH): =================== MAIN CORRIDOR ===========================
  Row 3 (y=2RH+CH): [Z3: Produc.][Z3: Motors]  [Z5: Ind.App][Z5: Health] [Z4: Garage][Z4: Charging]
  Row 4 (y=3RH+CH): [Z3: Sensors][Z3: Grippers][Z5: Logist.][Z5: Wear. ] [Z4: Sensor][Z4: Courtyard]
                                                 [Z5: Agri&Space connects to healthcare]

  Each room is RW x RH pixels. RW = T*12 = 576px. RH = T*9 = 432px.
  Corridor height CH = T*3 = 144px.
*/

const RW = T * 12; // room width 576
const RH = T * 9;  // room height 432
const CH = T * 3;  // corridor height 144
const GAP = T * 2; // gap between zone clusters 96

// Zone 1 origin
const Z1X = 0;
const Z1Y = 0;

// Zone 2 origin (to the right of Z1 with gap)
const Z2X = RW * 2 + GAP;
const Z2Y = 0;

// Corridor
const CORR_Y = RH * 2;
const CORR_X = 0;
const CORR_W = RW * 2 + GAP + RW * 2 + GAP + RW * 2; // spans all zones

// Zone 3 origin (below corridor, left)
const Z3X = 0;
const Z3Y = RH * 2 + CH;

// Zone 5 origin (below corridor, center)
const Z5X = RW * 2 + GAP;
const Z5Y = RH * 2 + CH;

// Zone 4 origin (below corridor, right)
const Z4X = (RW * 2 + GAP) * 2;
const Z4Y = RH * 2 + CH;

export const WORLD_W = CORR_W + 48;
export const WORLD_H = RH * 2 + CH + RH * 2 + 48;

// Door width constant
const DW = T * 2; // 96px doorway

// ====================================================================
// ZONE 1: What is Robotics?
// ====================================================================

// Reception Hall (top-left of Z1)
const wr_reception_x = Z1X;
const wr_reception_y = Z1Y;

// Exhibition Room (top-right of Z1)
const wr_exhibition_x = Z1X + RW;
const wr_exhibition_y = Z1Y;

// Historical Office (bottom-left of Z1)
const wr_history_x = Z1X;
const wr_history_y = Z1Y + RH;

// Demo Lab (bottom-right of Z1)
const wr_demolab_x = Z1X + RW;
const wr_demolab_y = Z1Y + RH;

// ====================================================================
// ZONE 2: Robots
// ====================================================================
const rb_workshop_x = Z2X;
const rb_workshop_y = Z2Y;

const rb_display_x = Z2X + RW;
const rb_display_y = Z2Y;

const rb_calibration_x = Z2X;
const rb_calibration_y = Z2Y + RH;

const rb_office_x = Z2X + RW;
const rb_office_y = Z2Y + RH;

// ====================================================================
// ZONE 3: Industrial Robots
// ====================================================================
const ir_production_x = Z3X;
const ir_production_y = Z3Y;

const ir_motors_x = Z3X + RW;
const ir_motors_y = Z3Y;

const ir_sensors_x = Z3X;
const ir_sensors_y = Z3Y + RH;

const ir_grippers_x = Z3X + RW;
const ir_grippers_y = Z3Y + RH;

// ====================================================================
// ZONE 4: Mobile Robots
// ====================================================================
const mr_garage_x = Z4X;
const mr_garage_y = Z4Y;

const mr_charging_x = Z4X + RW;
const mr_charging_y = Z4Y;

const mr_sensor_x = Z4X;
const mr_sensor_y = Z4Y + RH;

const mr_courtyard_x = Z4X + RW;
const mr_courtyard_y = Z4Y + RH;

// ====================================================================
// ZONE 5: Applications
// ====================================================================
const ap_industrial_x = Z5X;
const ap_industrial_y = Z5Y;

const ap_healthcare_x = Z5X + RW;
const ap_healthcare_y = Z5Y;

const ap_logistics_x = Z5X;
const ap_logistics_y = Z5Y + RH;

const ap_wearables_x = Z5X + RW;
const ap_wearables_y = Z5Y + RH;

// Agriculture & Space is an extra room below healthcare
const ap_agri_x = Z5X + RW;
// We'll fit it within the healthcare room vertically, or make healthcare taller
// Actually, let's use 5 rooms by splitting the Z5 grid differently:
// Top row: Industrial Apps | Healthcare | Agri & Space (3 rooms)
// Bottom row: Logistics & Construction | Wearables & Social (2 wide rooms)
// For simplicity with the 2x2 grid, put Agri&Space objects inside Healthcare room
// since it's a big demo space, or handle it as a subsection.
// Let's keep 4 rooms and distribute 15 objects across them.

export const ROOMS: RoomDef[] = [
  // ====== ZONE 1: What is Robotics? ======
  {
    id: 'wr_reception',
    name: 'Reception Hall',
    module: 'What is Robotics?',
    x: wr_reception_x, y: wr_reception_y, w: RW, h: RH,
    walls: roomWalls(wr_reception_x, wr_reception_y, RW, RH, [
      { side: 'right', pos: wr_reception_y + T * 3, size: DW },  // -> exhibition
      { side: 'bottom', pos: wr_reception_x + T * 5, size: DW }, // -> history
    ]),
    furniture: [
      { type: 'desk', x: wr_reception_x + T * 2, y: wr_reception_y + T * 2, w: T * 3, h: T * 1.5 },
      { type: 'bench', x: wr_reception_x + T * 7, y: wr_reception_y + T * 1.5, w: T * 3, h: T },
      { type: 'plant', x: wr_reception_x + T * 1, y: wr_reception_y + T * 1, w: T, h: T },
      { type: 'plant', x: wr_reception_x + T * 10, y: wr_reception_y + T * 1, w: T, h: T },
    ],
    decorations: [],
    signs: [
      { text: 'What is Robotics?', x: wr_reception_x + T * 6, y: wr_reception_y + 20, color: '#E8D44D' },
      { text: 'WELCOME', x: wr_reception_x + T * 6, y: wr_reception_y + T * 0.8 },
    ],
  },
  {
    id: 'wr_exhibition',
    name: 'Exhibition Room',
    module: 'What is Robotics?',
    x: wr_exhibition_x, y: wr_exhibition_y, w: RW, h: RH,
    walls: roomWalls(wr_exhibition_x, wr_exhibition_y, RW, RH, [
      { side: 'left', pos: wr_exhibition_y + T * 3, size: DW },   // -> reception
      { side: 'bottom', pos: wr_exhibition_x + T * 5, size: DW }, // -> demolab
    ]),
    furniture: [
      { type: 'display_case', x: wr_exhibition_x + T * 2, y: wr_exhibition_y + T * 2, w: T * 2, h: T * 2 },
      { type: 'display_case', x: wr_exhibition_x + T * 6, y: wr_exhibition_y + T * 2, w: T * 2, h: T * 2 },
      { type: 'display_case', x: wr_exhibition_x + T * 2, y: wr_exhibition_y + T * 5.5, w: T * 2, h: T * 2 },
      { type: 'display_case', x: wr_exhibition_x + T * 6, y: wr_exhibition_y + T * 5.5, w: T * 2, h: T * 2 },
    ],
    decorations: [],
    signs: [
      { text: 'Exhibition', x: wr_exhibition_x + T * 6, y: wr_exhibition_y + 20, color: '#E8D44D' },
    ],
  },
  {
    id: 'wr_history',
    name: 'Historical Office',
    module: 'What is Robotics?',
    x: wr_history_x, y: wr_history_y, w: RW, h: RH,
    walls: roomWalls(wr_history_x, wr_history_y, RW, RH, [
      { side: 'top', pos: wr_history_x + T * 5, size: DW },     // -> reception
      { side: 'right', pos: wr_history_y + T * 3, size: DW },   // -> demolab
      { side: 'bottom', pos: wr_history_x + T * 5, size: DW },  // -> corridor
    ]),
    furniture: [
      { type: 'desk', x: wr_history_x + T * 2, y: wr_history_y + T * 2, w: T * 2.5, h: T * 1.5 },
      { type: 'bookshelf', x: wr_history_x + T * 1, y: wr_history_y + T * 0.5, w: T * 3, h: T },
      { type: 'chair', x: wr_history_x + T * 3, y: wr_history_y + T * 4, w: T, h: T },
      { type: 'filing_cabinet', x: wr_history_x + T * 7, y: wr_history_y + T * 0.5, w: T * 2, h: T },
    ],
    decorations: [],
    signs: [
      { text: 'Historical Office', x: wr_history_x + T * 6, y: wr_history_y + 20, color: '#E8D44D' },
    ],
  },
  {
    id: 'wr_demolab',
    name: 'Demonstration Lab',
    module: 'What is Robotics?',
    x: wr_demolab_x, y: wr_demolab_y, w: RW, h: RH,
    walls: roomWalls(wr_demolab_x, wr_demolab_y, RW, RH, [
      { side: 'top', pos: wr_demolab_x + T * 5, size: DW },   // -> exhibition
      { side: 'left', pos: wr_demolab_y + T * 3, size: DW },  // -> history
      { side: 'bottom', pos: wr_demolab_x + T * 5, size: DW }, // -> corridor
    ]),
    furniture: [
      { type: 'lab_bench', x: wr_demolab_x + T * 2, y: wr_demolab_y + T * 2, w: T * 4, h: T * 1.5 },
      { type: 'lab_bench', x: wr_demolab_x + T * 7, y: wr_demolab_y + T * 2, w: T * 3, h: T * 1.5 },
      { type: 'machine', x: wr_demolab_x + T * 2, y: wr_demolab_y + T * 6, w: T * 2, h: T * 1.5 },
    ],
    decorations: [
      { type: 'rotating_joint', x: wr_demolab_x + T * 8, y: wr_demolab_y + T * 6.5, animated: true },
      { type: 'sliding_joint', x: wr_demolab_x + T * 5, y: wr_demolab_y + T * 6.5, animated: true },
    ],
    signs: [
      { text: 'Demonstration Lab', x: wr_demolab_x + T * 6, y: wr_demolab_y + 20, color: '#E8D44D' },
    ],
  },

  // ====== ZONE 2: Robots ======
  {
    id: 'rb_workshop',
    name: 'Mechanical Workshop',
    module: 'Robots',
    x: rb_workshop_x, y: rb_workshop_y, w: RW, h: RH,
    walls: roomWalls(rb_workshop_x, rb_workshop_y, RW, RH, [
      { side: 'right', pos: rb_workshop_y + T * 3, size: DW },
      { side: 'bottom', pos: rb_workshop_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'workbench', x: rb_workshop_x + T * 2, y: rb_workshop_y + T * 1.5, w: T * 4, h: T * 1.5 },
      { type: 'tool_rack', x: rb_workshop_x + T * 1, y: rb_workshop_y + T * 0.5, w: T * 2, h: T },
      { type: 'workbench', x: rb_workshop_x + T * 7, y: rb_workshop_y + T * 1.5, w: T * 3, h: T * 1.5 },
      { type: 'machine', x: rb_workshop_x + T * 2, y: rb_workshop_y + T * 5, w: T * 3, h: T * 2 },
    ],
    decorations: [],
    signs: [
      { text: 'Robots', x: rb_workshop_x + T * 6, y: rb_workshop_y + 20, color: '#9575CD' },
    ],
  },
  {
    id: 'rb_display',
    name: 'Model Display',
    module: 'Robots',
    x: rb_display_x, y: rb_display_y, w: RW, h: RH,
    walls: roomWalls(rb_display_x, rb_display_y, RW, RH, [
      { side: 'left', pos: rb_display_y + T * 3, size: DW },
      { side: 'bottom', pos: rb_display_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'display_pedestal', x: rb_display_x + T * 1.5, y: rb_display_y + T * 1.5, w: T * 2, h: T * 2 },
      { type: 'display_pedestal', x: rb_display_x + T * 5, y: rb_display_y + T * 1.5, w: T * 2, h: T * 2 },
      { type: 'display_pedestal', x: rb_display_x + T * 8.5, y: rb_display_y + T * 1.5, w: T * 2, h: T * 2 },
      { type: 'display_pedestal', x: rb_display_x + T * 1.5, y: rb_display_y + T * 5, w: T * 2, h: T * 2 },
      { type: 'display_pedestal', x: rb_display_x + T * 5, y: rb_display_y + T * 5, w: T * 2, h: T * 2 },
      { type: 'display_pedestal', x: rb_display_x + T * 8.5, y: rb_display_y + T * 5, w: T * 2, h: T * 2 },
    ],
    decorations: [],
    signs: [
      { text: 'Model Display', x: rb_display_x + T * 6, y: rb_display_y + 20, color: '#9575CD' },
    ],
  },
  {
    id: 'rb_calibration',
    name: 'Calibration Room',
    module: 'Robots',
    x: rb_calibration_x, y: rb_calibration_y, w: RW, h: RH,
    walls: roomWalls(rb_calibration_x, rb_calibration_y, RW, RH, [
      { side: 'top', pos: rb_calibration_x + T * 5, size: DW },
      { side: 'right', pos: rb_calibration_y + T * 3, size: DW },
      { side: 'bottom', pos: rb_calibration_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'calibration_bench', x: rb_calibration_x + T * 2, y: rb_calibration_y + T * 2, w: T * 3, h: T * 2 },
      { type: 'instrument_rack', x: rb_calibration_x + T * 7, y: rb_calibration_y + T * 0.5, w: T * 3, h: T },
    ],
    decorations: [],
    signs: [
      { text: 'Calibration Room', x: rb_calibration_x + T * 6, y: rb_calibration_y + 20, color: '#9575CD' },
    ],
  },
  {
    id: 'rb_office',
    name: 'Planning Office',
    module: 'Robots',
    x: rb_office_x, y: rb_office_y, w: RW, h: RH,
    walls: roomWalls(rb_office_x, rb_office_y, RW, RH, [
      { side: 'top', pos: rb_office_x + T * 5, size: DW },
      { side: 'left', pos: rb_office_y + T * 3, size: DW },
      { side: 'bottom', pos: rb_office_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'desk', x: rb_office_x + T * 2, y: rb_office_y + T * 2, w: T * 3, h: T * 1.5 },
      { type: 'desk', x: rb_office_x + T * 7, y: rb_office_y + T * 2, w: T * 3, h: T * 1.5 },
      { type: 'bookshelf', x: rb_office_x + T * 1, y: rb_office_y + T * 0.5, w: T * 4, h: T },
      { type: 'whiteboard', x: rb_office_x + T * 7, y: rb_office_y + T * 0.5, w: T * 3, h: T },
    ],
    decorations: [],
    signs: [
      { text: 'Planning Office', x: rb_office_x + T * 6, y: rb_office_y + 20, color: '#9575CD' },
    ],
  },

  // ====== ZONE 3: Industrial Robots ======
  {
    id: 'ir_production',
    name: 'Production Cells',
    module: 'Industrial Robots',
    x: ir_production_x, y: ir_production_y, w: RW, h: RH,
    walls: roomWalls(ir_production_x, ir_production_y, RW, RH, [
      { side: 'top', pos: ir_production_x + T * 5, size: DW },    // -> corridor
      { side: 'right', pos: ir_production_y + T * 3, size: DW },
      { side: 'bottom', pos: ir_production_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'production_cell', x: ir_production_x + T * 2, y: ir_production_y + T * 1.5, w: T * 3, h: T * 2.5 },
      { type: 'production_cell', x: ir_production_x + T * 7, y: ir_production_y + T * 1.5, w: T * 3, h: T * 2.5 },
      { type: 'conveyor', x: ir_production_x + T * 2, y: ir_production_y + T * 6, w: T * 8, h: T },
    ],
    decorations: [
      { type: 'robot_arm_anim', x: ir_production_x + T * 4, y: ir_production_y + T * 2.5, animated: true },
    ],
    signs: [
      { text: 'Industrial Robots', x: ir_production_x + T * 6, y: ir_production_y + 20, color: '#FF8A65' },
    ],
  },
  {
    id: 'ir_motors',
    name: 'Motor Bench',
    module: 'Industrial Robots',
    x: ir_motors_x, y: ir_motors_y, w: RW, h: RH,
    walls: roomWalls(ir_motors_x, ir_motors_y, RW, RH, [
      { side: 'top', pos: ir_motors_x + T * 5, size: DW },
      { side: 'left', pos: ir_motors_y + T * 3, size: DW },
      { side: 'bottom', pos: ir_motors_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'motor_bench', x: ir_motors_x + T * 2, y: ir_motors_y + T * 1.5, w: T * 3, h: T * 2 },
      { type: 'motor_bench', x: ir_motors_x + T * 7, y: ir_motors_y + T * 1.5, w: T * 3, h: T * 2 },
      { type: 'test_rig', x: ir_motors_x + T * 3, y: ir_motors_y + T * 5, w: T * 6, h: T * 1.5 },
    ],
    decorations: [],
    signs: [
      { text: 'Motor Bench', x: ir_motors_x + T * 6, y: ir_motors_y + 20, color: '#FF8A65' },
    ],
  },
  {
    id: 'ir_sensors',
    name: 'Sensor Station',
    module: 'Industrial Robots',
    x: ir_sensors_x, y: ir_sensors_y, w: RW, h: RH,
    walls: roomWalls(ir_sensors_x, ir_sensors_y, RW, RH, [
      { side: 'top', pos: ir_sensors_x + T * 5, size: DW },
      { side: 'right', pos: ir_sensors_y + T * 3, size: DW },
    ]),
    furniture: [
      { type: 'sensor_bench', x: ir_sensors_x + T * 2, y: ir_sensors_y + T * 2, w: T * 4, h: T * 1.5 },
      { type: 'sensor_bench', x: ir_sensors_x + T * 7, y: ir_sensors_y + T * 2, w: T * 3, h: T * 1.5 },
      { type: 'test_target', x: ir_sensors_x + T * 5, y: ir_sensors_y + T * 6, w: T * 2, h: T * 2 },
    ],
    decorations: [
      { type: 'beam_anim', x: ir_sensors_x + T * 3, y: ir_sensors_y + T * 5.5, animated: true },
    ],
    signs: [
      { text: 'Sensor Station', x: ir_sensors_x + T * 6, y: ir_sensors_y + 20, color: '#FF8A65' },
    ],
  },
  {
    id: 'ir_grippers',
    name: 'Gripper Demonstration',
    module: 'Industrial Robots',
    x: ir_grippers_x, y: ir_grippers_y, w: RW, h: RH,
    walls: roomWalls(ir_grippers_x, ir_grippers_y, RW, RH, [
      { side: 'top', pos: ir_grippers_x + T * 5, size: DW },
      { side: 'left', pos: ir_grippers_y + T * 3, size: DW },
    ]),
    furniture: [
      { type: 'gripper_stand', x: ir_grippers_x + T * 2, y: ir_grippers_y + T * 2, w: T * 2, h: T * 2 },
      { type: 'gripper_stand', x: ir_grippers_x + T * 5, y: ir_grippers_y + T * 2, w: T * 2, h: T * 2 },
      { type: 'gripper_stand', x: ir_grippers_x + T * 8, y: ir_grippers_y + T * 2, w: T * 2, h: T * 2 },
      { type: 'workpiece_table', x: ir_grippers_x + T * 2, y: ir_grippers_y + T * 6, w: T * 8, h: T },
    ],
    decorations: [],
    signs: [
      { text: 'Gripper Demonstration', x: ir_grippers_x + T * 6, y: ir_grippers_y + 20, color: '#FF8A65' },
    ],
  },

  // ====== ZONE 4: Mobile Robots ======
  {
    id: 'mr_garage',
    name: 'Robot Garage',
    module: 'Mobile Robots',
    x: mr_garage_x, y: mr_garage_y, w: RW, h: RH,
    walls: roomWalls(mr_garage_x, mr_garage_y, RW, RH, [
      { side: 'top', pos: mr_garage_x + T * 5, size: DW },
      { side: 'right', pos: mr_garage_y + T * 3, size: DW },
      { side: 'bottom', pos: mr_garage_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'workbench', x: mr_garage_x + T * 2, y: mr_garage_y + T * 1, w: T * 4, h: T * 1.5 },
      { type: 'tool_rack', x: mr_garage_x + T * 8, y: mr_garage_y + T * 1, w: T * 2, h: T },
      { type: 'robot_platform', x: mr_garage_x + T * 3, y: mr_garage_y + T * 5, w: T * 3, h: T * 2 },
    ],
    decorations: [],
    signs: [
      { text: 'Mobile Robots', x: mr_garage_x + T * 6, y: mr_garage_y + 20, color: '#4FC3F7' },
    ],
  },
  {
    id: 'mr_charging',
    name: 'Charging Area',
    module: 'Mobile Robots',
    x: mr_charging_x, y: mr_charging_y, w: RW, h: RH,
    walls: roomWalls(mr_charging_x, mr_charging_y, RW, RH, [
      { side: 'top', pos: mr_charging_x + T * 5, size: DW },
      { side: 'left', pos: mr_charging_y + T * 3, size: DW },
      { side: 'bottom', pos: mr_charging_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'charging_station', x: mr_charging_x + T * 2, y: mr_charging_y + T * 2, w: T * 3, h: T * 2 },
      { type: 'charging_station', x: mr_charging_x + T * 7, y: mr_charging_y + T * 2, w: T * 3, h: T * 2 },
      { type: 'battery_rack', x: mr_charging_x + T * 3, y: mr_charging_y + T * 6, w: T * 6, h: T },
    ],
    decorations: [],
    signs: [
      { text: 'Charging Area', x: mr_charging_x + T * 6, y: mr_charging_y + 20, color: '#4FC3F7' },
    ],
  },
  {
    id: 'mr_sensor_workshop',
    name: 'Sensor Workshop',
    module: 'Mobile Robots',
    x: mr_sensor_x, y: mr_sensor_y, w: RW, h: RH,
    walls: roomWalls(mr_sensor_x, mr_sensor_y, RW, RH, [
      { side: 'top', pos: mr_sensor_x + T * 5, size: DW },
      { side: 'right', pos: mr_sensor_y + T * 3, size: DW },
    ]),
    furniture: [
      { type: 'sensor_bench', x: mr_sensor_x + T * 2, y: mr_sensor_y + T * 2, w: T * 4, h: T * 1.5 },
      { type: 'electronics_bench', x: mr_sensor_x + T * 7, y: mr_sensor_y + T * 2, w: T * 3, h: T * 1.5 },
      { type: 'oscilloscope', x: mr_sensor_x + T * 2, y: mr_sensor_y + T * 6, w: T * 2, h: T * 1.5 },
    ],
    decorations: [],
    signs: [
      { text: 'Sensor Workshop', x: mr_sensor_x + T * 6, y: mr_sensor_y + 20, color: '#4FC3F7' },
    ],
  },
  {
    id: 'mr_courtyard',
    name: 'Navigation Courtyard',
    module: 'Mobile Robots',
    x: mr_courtyard_x, y: mr_courtyard_y, w: RW, h: RH,
    walls: roomWalls(mr_courtyard_x, mr_courtyard_y, RW, RH, [
      { side: 'top', pos: mr_courtyard_x + T * 5, size: DW },
      { side: 'left', pos: mr_courtyard_y + T * 3, size: DW },
    ]),
    furniture: [
      { type: 'bench_outdoor', x: mr_courtyard_x + T * 2, y: mr_courtyard_y + T * 2, w: T * 3, h: T },
      { type: 'path_markers', x: mr_courtyard_x + T * 5, y: mr_courtyard_y + T * 3, w: T * 5, h: T * 4 },
      { type: 'planter', x: mr_courtyard_x + T * 2, y: mr_courtyard_y + T * 6, w: T * 2, h: T * 2 },
      { type: 'planter', x: mr_courtyard_x + T * 9, y: mr_courtyard_y + T * 1, w: T * 2, h: T * 2 },
    ],
    decorations: [
      { type: 'mobile_robot_route', x: mr_courtyard_x + T * 7, y: mr_courtyard_y + T * 5, animated: true },
    ],
    signs: [
      { text: 'Navigation Courtyard', x: mr_courtyard_x + T * 6, y: mr_courtyard_y + 20, color: '#4FC3F7' },
    ],
    outdoor: true,
  },

  // ====== ZONE 5: Applications ======
  {
    id: 'ap_industrial',
    name: 'Industrial Applications',
    module: 'Applications',
    x: ap_industrial_x, y: ap_industrial_y, w: RW, h: RH,
    walls: roomWalls(ap_industrial_x, ap_industrial_y, RW, RH, [
      { side: 'top', pos: ap_industrial_x + T * 5, size: DW },
      { side: 'right', pos: ap_industrial_y + T * 3, size: DW },
      { side: 'bottom', pos: ap_industrial_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'welding_cell', x: ap_industrial_x + T * 2, y: ap_industrial_y + T * 2, w: T * 3, h: T * 2 },
      { type: 'paint_booth', x: ap_industrial_x + T * 7, y: ap_industrial_y + T * 2, w: T * 3, h: T * 2 },
    ],
    decorations: [],
    signs: [
      { text: 'Applications', x: ap_industrial_x + T * 6, y: ap_industrial_y + 20, color: '#66BB6A' },
      { text: 'Industrial', x: ap_industrial_x + T * 6, y: ap_industrial_y + 40 },
    ],
  },
  {
    id: 'ap_healthcare',
    name: 'Healthcare, Agriculture & Space',
    module: 'Applications',
    x: ap_healthcare_x, y: ap_healthcare_y, w: RW, h: RH,
    walls: roomWalls(ap_healthcare_x, ap_healthcare_y, RW, RH, [
      { side: 'top', pos: ap_healthcare_x + T * 5, size: DW },
      { side: 'left', pos: ap_healthcare_y + T * 3, size: DW },
      { side: 'bottom', pos: ap_healthcare_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'medical_table', x: ap_healthcare_x + T * 2, y: ap_healthcare_y + T * 1.5, w: T * 3, h: T * 2 },
      { type: 'medical_cabinet', x: ap_healthcare_x + T * 6, y: ap_healthcare_y + T * 1, w: T * 2, h: T },
      { type: 'greenhouse_model', x: ap_healthcare_x + T * 2, y: ap_healthcare_y + T * 5, w: T * 3, h: T * 2 },
      { type: 'terrain_model', x: ap_healthcare_x + T * 7, y: ap_healthcare_y + T * 5, w: T * 3, h: T * 2.5 },
    ],
    decorations: [
      { type: 'greenhouse_gripper', x: ap_healthcare_x + T * 4, y: ap_healthcare_y + T * 5.5, animated: true },
    ],
    signs: [
      { text: 'Healthcare, Agri & Space', x: ap_healthcare_x + T * 6, y: ap_healthcare_y + 20, color: '#66BB6A' },
    ],
  },
  {
    id: 'ap_logistics',
    name: 'Logistics & Construction',
    module: 'Applications',
    x: ap_logistics_x, y: ap_logistics_y, w: RW, h: RH,
    walls: roomWalls(ap_logistics_x, ap_logistics_y, RW, RH, [
      { side: 'top', pos: ap_logistics_x + T * 5, size: DW },
      { side: 'right', pos: ap_logistics_y + T * 3, size: DW },
    ]),
    furniture: [
      { type: 'pallet_stack', x: ap_logistics_x + T * 2, y: ap_logistics_y + T * 2, w: T * 3, h: T * 2 },
      { type: 'conveyor', x: ap_logistics_x + T * 2, y: ap_logistics_y + T * 6, w: T * 8, h: T },
      { type: 'construction_model', x: ap_logistics_x + T * 7, y: ap_logistics_y + T * 2, w: T * 3, h: T * 2 },
    ],
    decorations: [],
    signs: [
      { text: 'Logistics & Construction', x: ap_logistics_x + T * 6, y: ap_logistics_y + 20, color: '#66BB6A' },
    ],
  },
  {
    id: 'ap_wearables',
    name: 'Wearables & Social Robots',
    module: 'Applications',
    x: ap_wearables_x, y: ap_wearables_y, w: RW, h: RH,
    walls: roomWalls(ap_wearables_x, ap_wearables_y, RW, RH, [
      { side: 'top', pos: ap_wearables_x + T * 5, size: DW },
      { side: 'left', pos: ap_wearables_y + T * 3, size: DW },
    ]),
    furniture: [
      { type: 'exo_display', x: ap_wearables_x + T * 2, y: ap_wearables_y + T * 2, w: T * 3, h: T * 2 },
      { type: 'display_pedestal', x: ap_wearables_x + T * 6, y: ap_wearables_y + T * 2, w: T * 2, h: T * 2 },
      { type: 'cozy_area', x: ap_wearables_x + T * 9, y: ap_wearables_y + T * 2, w: T * 2, h: T * 2 },
      { type: 'bench_outdoor', x: ap_wearables_x + T * 2, y: ap_wearables_y + T * 6.5, w: T * 3, h: T },
    ],
    decorations: [],
    signs: [
      { text: 'Wearables & Social', x: ap_wearables_x + T * 6, y: ap_wearables_y + 20, color: '#66BB6A' },
    ],
  },

  // ====== MAIN CORRIDOR ======
  {
    id: 'hall_main',
    name: 'Main Corridor',
    module: 'What is Robotics?', // Default; getRoomAt checks corridor specially
    x: CORR_X, y: CORR_Y, w: CORR_W, h: CH,
    walls: roomWalls(CORR_X, CORR_Y, CORR_W, CH, [
      // Top doorways: Z1 history, Z1 demolab, Z2 calibration, Z2 office
      { side: 'top', pos: wr_history_x + T * 5, size: DW },
      { side: 'top', pos: wr_demolab_x + T * 5, size: DW },
      { side: 'top', pos: rb_calibration_x + T * 5, size: DW },
      { side: 'top', pos: rb_office_x + T * 5, size: DW },
      // Bottom doorways: Z3 production, Z3 motors, Z5 industrial, Z5 healthcare, Z4 garage, Z4 charging
      { side: 'bottom', pos: ir_production_x + T * 5, size: DW },
      { side: 'bottom', pos: ir_motors_x + T * 5, size: DW },
      { side: 'bottom', pos: ap_industrial_x + T * 5, size: DW },
      { side: 'bottom', pos: ap_healthcare_x + T * 5, size: DW },
      { side: 'bottom', pos: mr_garage_x + T * 5, size: DW },
      { side: 'bottom', pos: mr_charging_x + T * 5, size: DW },
    ]),
    furniture: [
      { type: 'plant', x: CORR_X + T * 3, y: CORR_Y + T * 0.5, w: T, h: T },
      { type: 'bench', x: CORR_X + T * 15, y: CORR_Y + T * 0.5, w: T * 3, h: T },
      { type: 'terminal', x: CORR_X + T * 1, y: CORR_Y + T * 0.5, w: T * 1.5, h: T * 1.5 },
      { type: 'plant', x: CORR_X + T * 30, y: CORR_Y + T * 0.5, w: T, h: T },
      { type: 'bench', x: CORR_X + T * 45, y: CORR_Y + T * 0.5, w: T * 3, h: T },
      { type: 'plant', x: CORR_X + T * 60, y: CORR_Y + T * 0.5, w: T, h: T },
    ],
    decorations: [],
    signs: [
      { text: 'Main Corridor', x: CORR_X + T * 10, y: CORR_Y + 20 },
    ],
  },
];

// ========================
// OBJECT PLACEMENTS - all 75 objects
// ========================
export const OBJECT_PLACEMENTS: ObjectPlacement[] = [
  // ====== Zone 1: What is Robotics? (15 objects) ======
  // Reception (3)
  { objectId: 'wr01', roomId: 'wr_reception', x: wr_reception_x + T * 7, y: wr_reception_y + T * 4 },
  { objectId: 'wr02', roomId: 'wr_reception', x: wr_reception_x + T * 9.5, y: wr_reception_y + T * 4 },
  { objectId: 'wr08', roomId: 'wr_reception', x: wr_reception_x + T * 5, y: wr_reception_y + T * 6 },
  // Exhibition (4)
  { objectId: 'wr05', roomId: 'wr_exhibition', x: wr_exhibition_x + T * 3, y: wr_exhibition_y + T * 3 },
  { objectId: 'wr06', roomId: 'wr_exhibition', x: wr_exhibition_x + T * 7, y: wr_exhibition_y + T * 3 },
  { objectId: 'wr07', roomId: 'wr_exhibition', x: wr_exhibition_x + T * 3, y: wr_exhibition_y + T * 6.5 },
  { objectId: 'wr14', roomId: 'wr_exhibition', x: wr_exhibition_x + T * 7, y: wr_exhibition_y + T * 6.5 },
  // History (4)
  { objectId: 'wr09', roomId: 'wr_history', x: wr_history_x + T * 5, y: wr_history_y + T * 1.5 },
  { objectId: 'wr10', roomId: 'wr_history', x: wr_history_x + T * 2, y: wr_history_y + T * 6 },
  { objectId: 'wr11', roomId: 'wr_history', x: wr_history_x + T * 6, y: wr_history_y + T * 6 },
  { objectId: 'wr15', roomId: 'wr_history', x: wr_history_x + T * 9, y: wr_history_y + T * 3 },
  // Demo Lab (4)
  { objectId: 'wr03', roomId: 'wr_demolab', x: wr_demolab_x + T * 8, y: wr_demolab_y + T * 5 },
  { objectId: 'wr04', roomId: 'wr_demolab', x: wr_demolab_x + T * 5, y: wr_demolab_y + T * 5 },
  { objectId: 'wr12', roomId: 'wr_demolab', x: wr_demolab_x + T * 2, y: wr_demolab_y + T * 5 },
  { objectId: 'wr13', roomId: 'wr_demolab', x: wr_demolab_x + T * 9, y: wr_demolab_y + T * 7 },

  // ====== Zone 2: Robots (15 objects) ======
  // Workshop (4)
  { objectId: 'rb01', roomId: 'rb_workshop', x: rb_workshop_x + T * 3, y: rb_workshop_y + T * 4 },
  { objectId: 'rb02', roomId: 'rb_workshop', x: rb_workshop_x + T * 8, y: rb_workshop_y + T * 4 },
  { objectId: 'rb10', roomId: 'rb_workshop', x: rb_workshop_x + T * 6, y: rb_workshop_y + T * 7 },
  { objectId: 'rb11', roomId: 'rb_workshop', x: rb_workshop_x + T * 9, y: rb_workshop_y + T * 7 },
  // Display (6)
  { objectId: 'rb03', roomId: 'rb_display', x: rb_display_x + T * 2.5, y: rb_display_y + T * 2.5 },
  { objectId: 'rb04', roomId: 'rb_display', x: rb_display_x + T * 6, y: rb_display_y + T * 2.5 },
  { objectId: 'rb05', roomId: 'rb_display', x: rb_display_x + T * 9.5, y: rb_display_y + T * 2.5 },
  { objectId: 'rb06', roomId: 'rb_display', x: rb_display_x + T * 2.5, y: rb_display_y + T * 6 },
  { objectId: 'rb07', roomId: 'rb_display', x: rb_display_x + T * 6, y: rb_display_y + T * 6 },
  { objectId: 'rb08', roomId: 'rb_display', x: rb_display_x + T * 9.5, y: rb_display_y + T * 6 },
  // Calibration (3)
  { objectId: 'rb09', roomId: 'rb_calibration', x: rb_calibration_x + T * 3, y: rb_calibration_y + T * 6 },
  { objectId: 'rb12', roomId: 'rb_calibration', x: rb_calibration_x + T * 7, y: rb_calibration_y + T * 6 },
  { objectId: 'rb13', roomId: 'rb_calibration', x: rb_calibration_x + T * 5, y: rb_calibration_y + T * 3 },
  // Office (2)
  { objectId: 'rb14', roomId: 'rb_office', x: rb_office_x + T * 3, y: rb_office_y + T * 5 },
  { objectId: 'rb15', roomId: 'rb_office', x: rb_office_x + T * 8, y: rb_office_y + T * 5 },

  // ====== Zone 3: Industrial Robots (15 objects) ======
  // Production (2)
  { objectId: 'ir14', roomId: 'ir_production', x: ir_production_x + T * 9, y: ir_production_y + T * 5 },
  { objectId: 'ir15', roomId: 'ir_production', x: ir_production_x + T * 4, y: ir_production_y + T * 5 },
  // Motors (5)
  { objectId: 'ir01', roomId: 'ir_motors', x: ir_motors_x + T * 3, y: ir_motors_y + T * 2.5 },
  { objectId: 'ir02', roomId: 'ir_motors', x: ir_motors_x + T * 8, y: ir_motors_y + T * 2.5 },
  { objectId: 'ir03', roomId: 'ir_motors', x: ir_motors_x + T * 4, y: ir_motors_y + T * 5.5 },
  { objectId: 'ir04', roomId: 'ir_motors', x: ir_motors_x + T * 7, y: ir_motors_y + T * 5.5 },
  { objectId: 'ir05', roomId: 'ir_motors', x: ir_motors_x + T * 10, y: ir_motors_y + T * 5.5 },
  // Sensors (5)
  { objectId: 'ir06', roomId: 'ir_sensors', x: ir_sensors_x + T * 3, y: ir_sensors_y + T * 3 },
  { objectId: 'ir07', roomId: 'ir_sensors', x: ir_sensors_x + T * 6, y: ir_sensors_y + T * 3 },
  { objectId: 'ir08', roomId: 'ir_sensors', x: ir_sensors_x + T * 9, y: ir_sensors_y + T * 3 },
  { objectId: 'ir09', roomId: 'ir_sensors', x: ir_sensors_x + T * 3, y: ir_sensors_y + T * 6 },
  { objectId: 'ir10', roomId: 'ir_sensors', x: ir_sensors_x + T * 8, y: ir_sensors_y + T * 6 },
  // Grippers (3)
  { objectId: 'ir11', roomId: 'ir_grippers', x: ir_grippers_x + T * 3, y: ir_grippers_y + T * 3 },
  { objectId: 'ir12', roomId: 'ir_grippers', x: ir_grippers_x + T * 6, y: ir_grippers_y + T * 3 },
  { objectId: 'ir13', roomId: 'ir_grippers', x: ir_grippers_x + T * 9, y: ir_grippers_y + T * 3 },

  // ====== Zone 4: Mobile Robots (15 objects) ======
  // Garage (3)
  { objectId: 'mr01', roomId: 'mr_garage', x: mr_garage_x + T * 3, y: mr_garage_y + T * 3 },
  { objectId: 'mr02', roomId: 'mr_garage', x: mr_garage_x + T * 7, y: mr_garage_y + T * 5 },
  { objectId: 'mr03', roomId: 'mr_garage', x: mr_garage_x + T * 7, y: mr_garage_y + T * 3 },
  // Charging (2)
  { objectId: 'mr04', roomId: 'mr_charging', x: mr_charging_x + T * 5, y: mr_charging_y + T * 5 },
  { objectId: 'mr05', roomId: 'mr_charging', x: mr_charging_x + T * 5, y: mr_charging_y + T * 3 },
  // Sensor Workshop (6)
  { objectId: 'mr06', roomId: 'mr_sensor_workshop', x: mr_sensor_x + T * 3, y: mr_sensor_y + T * 3 },
  { objectId: 'mr07', roomId: 'mr_sensor_workshop', x: mr_sensor_x + T * 6, y: mr_sensor_y + T * 3 },
  { objectId: 'mr08', roomId: 'mr_sensor_workshop', x: mr_sensor_x + T * 9, y: mr_sensor_y + T * 3 },
  { objectId: 'mr09', roomId: 'mr_sensor_workshop', x: mr_sensor_x + T * 3, y: mr_sensor_y + T * 6 },
  { objectId: 'mr11', roomId: 'mr_sensor_workshop', x: mr_sensor_x + T * 6, y: mr_sensor_y + T * 6 },
  { objectId: 'mr12', roomId: 'mr_sensor_workshop', x: mr_sensor_x + T * 9, y: mr_sensor_y + T * 6 },
  // Courtyard (4)
  { objectId: 'mr10', roomId: 'mr_courtyard', x: mr_courtyard_x + T * 3, y: mr_courtyard_y + T * 3 },
  { objectId: 'mr13', roomId: 'mr_courtyard', x: mr_courtyard_x + T * 3, y: mr_courtyard_y + T * 6 },
  { objectId: 'mr14', roomId: 'mr_courtyard', x: mr_courtyard_x + T * 9, y: mr_courtyard_y + T * 6 },
  { objectId: 'mr15', roomId: 'mr_courtyard', x: mr_courtyard_x + T * 8, y: mr_courtyard_y + T * 3 },

  // ====== Zone 5: Applications (15 objects) ======
  // Industrial Apps (2)
  { objectId: 'ap01', roomId: 'ap_industrial', x: ap_industrial_x + T * 3, y: ap_industrial_y + T * 5 },
  { objectId: 'ap02', roomId: 'ap_industrial', x: ap_industrial_x + T * 8, y: ap_industrial_y + T * 5 },
  // Healthcare, Agriculture & Space (6)
  { objectId: 'ap03', roomId: 'ap_healthcare', x: ap_healthcare_x + T * 3, y: ap_healthcare_y + T * 2.5 },
  { objectId: 'ap04', roomId: 'ap_healthcare', x: ap_healthcare_x + T * 7, y: ap_healthcare_y + T * 2.5 },
  { objectId: 'ap05', roomId: 'ap_healthcare', x: ap_healthcare_x + T * 3, y: ap_healthcare_y + T * 6 },
  { objectId: 'ap06', roomId: 'ap_healthcare', x: ap_healthcare_x + T * 5.5, y: ap_healthcare_y + T * 6 },
  { objectId: 'ap07', roomId: 'ap_healthcare', x: ap_healthcare_x + T * 8, y: ap_healthcare_y + T * 6 },
  { objectId: 'ap08', roomId: 'ap_healthcare', x: ap_healthcare_x + T * 10, y: ap_healthcare_y + T * 6 },
  // Logistics & Construction (4)
  { objectId: 'ap09', roomId: 'ap_logistics', x: ap_logistics_x + T * 3, y: ap_logistics_y + T * 4 },
  { objectId: 'ap10', roomId: 'ap_logistics', x: ap_logistics_x + T * 6, y: ap_logistics_y + T * 7 },
  { objectId: 'ap11', roomId: 'ap_logistics', x: ap_logistics_x + T * 8, y: ap_logistics_y + T * 4 },
  { objectId: 'ap12', roomId: 'ap_logistics', x: ap_logistics_x + T * 10, y: ap_logistics_y + T * 4 },
  // Wearables & Social (3)
  { objectId: 'ap13', roomId: 'ap_wearables', x: ap_wearables_x + T * 3, y: ap_wearables_y + T * 3 },
  { objectId: 'ap14', roomId: 'ap_wearables', x: ap_wearables_x + T * 7, y: ap_wearables_y + T * 3 },
  { objectId: 'ap15', roomId: 'ap_wearables', x: ap_wearables_x + T * 10, y: ap_wearables_y + T * 3 },
];

// Build collision map from all rooms
export function getAllWalls(): Wall[] {
  const walls: Wall[] = [];
  for (const room of ROOMS) {
    walls.push(...room.walls);
    for (const f of room.furniture) {
      walls.push({ x: f.x, y: f.y, w: f.w, h: f.h });
    }
  }
  return walls;
}

export function getPlayerStart(): { x: number; y: number } {
  return { x: wr_reception_x + T * 6, y: wr_reception_y + T * 4 };
}

export function getRoomAt(x: number, y: number): RoomDef | undefined {
  return ROOMS.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}
