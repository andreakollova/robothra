// All 75 discoverable objects organized by module

export interface GameObject {
  id: string;
  name: string;
  module: string;
  moduleIndex: number; // 0-4
  description: string;
  subsection?: string; // For Applications module
  large: boolean; // Large exhibits are scanned, not collected
  worldX?: number;
  worldY?: number;
  illustration: string; // Key for drawing function
}

export const MODULE_NAMES = [
  'What is Robotics?',
  'Robots',
  'Industrial Robots',
  'Mobile Robots',
  'Applications',
] as const;

export type ModuleName = (typeof MODULE_NAMES)[number];

export const MODULE_COLORS: Record<ModuleName, { primary: string; secondary: string; floor: string; wall: string; accent: string }> = {
  'What is Robotics?': { primary: '#F0C930', secondary: '#FFF8E1', floor: '#FDFBF3', wall: '#E6DEC6', accent: '#D4A017' },
  'Robots': { primary: '#7E57C2', secondary: '#EDE7F6', floor: '#F5F2FA', wall: '#CFC4E0', accent: '#5E35B1' },
  'Industrial Robots': { primary: '#EF6C00', secondary: '#FFF3E0', floor: '#FDF5EE', wall: '#E0CEBC', accent: '#E65100' },
  'Mobile Robots': { primary: '#0288D1', secondary: '#E1F5FE', floor: '#F0F8FD', wall: '#BFD6E4', accent: '#01579B' },
  'Applications': { primary: '#43A047', secondary: '#E8F5E9', floor: '#F2F9F2', wall: '#BDD4BD', accent: '#2E7D32' },
};

export const OBJECTS: GameObject[] = [
  // Module 1: What is Robotics?
  { id: 'wr01', name: 'Industrial Robot Scale Model', module: 'What is Robotics?', moduleIndex: 0, description: 'An industrial robot is a programmable manipulator used to perform tasks such as handling, assembly, or welding.', large: true, illustration: 'industrial_robot_model' },
  { id: 'wr02', name: 'Mobile Robot Scale Model', module: 'What is Robotics?', moduleIndex: 0, description: 'A mobile robot can move through its environment rather than working only from a fixed location.', large: true, illustration: 'mobile_robot_model' },
  { id: 'wr03', name: 'Revolute Joint Demonstrator', module: 'What is Robotics?', moduleIndex: 0, description: 'A revolute joint allows one connected link to rotate relative to another.', large: true, illustration: 'revolute_joint' },
  { id: 'wr04', name: 'Prismatic Joint Demonstrator', module: 'What is Robotics?', moduleIndex: 0, description: 'A prismatic joint allows one connected link to slide along an axis.', large: true, illustration: 'prismatic_joint'},
  { id: 'wr05', name: 'Cartesian Coordinate Frame', module: 'What is Robotics?', moduleIndex: 0, description: 'Three perpendicular axes describe positions using x, y, and z coordinates.', large: true, illustration: 'cartesian_frame' },
  { id: 'wr06', name: 'Polar Coordinate Disc', module: 'What is Robotics?', moduleIndex: 0, description: 'A polar coordinate system describes a point in a plane using its distance and angle from an origin.', large: false, illustration: 'polar_disc' },
  { id: 'wr07', name: 'Cylindrical Coordinate Model', module: 'What is Robotics?', moduleIndex: 0, description: 'Cylindrical coordinates describe a position using radius, angle, and height.', large: true, illustration: 'cylindrical_coord' },
  { id: 'wr08', name: 'Robot Classification Card Set', module: 'What is Robotics?', moduleIndex: 0, description: 'These cards illustrate the six JIRA robot classes described in the course.', large: false, illustration: 'classification_cards' },
  { id: 'wr09', name: 'Robotics History Timeline Strip', module: 'What is Robotics?', moduleIndex: 0, description: 'This timeline connects developments in robotics with their historical context.', large: true, illustration: 'timeline_strip' },
  { id: 'wr10', name: 'Stanford Arm Scale Model', module: 'What is Robotics?', moduleIndex: 0, description: 'The Stanford Arm is a historical manipulator discussed in the course\'s development of industrial robotics.', large: true, illustration: 'stanford_arm' },
  { id: 'wr11', name: 'Shakey Scale Model', module: 'What is Robotics?', moduleIndex: 0, description: 'Shakey combined environmental sensing with software for planning movements.', large: true, illustration: 'shakey_model' },
  { id: 'wr12', name: 'Soft Robotic Finger', module: 'What is Robotics?', moduleIndex: 0, description: 'A soft robotic finger uses deformable materials to adapt its shape during interaction.', large: false, illustration: 'soft_finger' },
  { id: 'wr13', name: 'Bio-Inspired Robot Leg', module: 'What is Robotics?', moduleIndex: 0, description: 'This mechanical leg demonstrates how robot designs can take inspiration from animal movement.', large: true, illustration: 'bio_leg' },
  { id: 'wr14', name: 'Cloud Robotics Network Model', module: 'What is Robotics?', moduleIndex: 0, description: 'This model shows how a robot can exchange data or delegate selected computations to remote infrastructure.', large: true, illustration: 'cloud_network' },
  { id: 'wr15', name: 'Labeled Training Image Set', module: 'What is Robotics?', moduleIndex: 0, description: 'Labeled examples can train a perception system to recognize objects or features.', large: false, illustration: 'training_images' },

  // Module 2: Robots
  { id: 'rb01', name: 'Robot Link', module: 'Robots', moduleIndex: 1, description: 'A link is a structural member connected to other members through joints.', large: false, illustration: 'robot_link' },
  { id: 'rb02', name: 'Robot Wrist Assembly', module: 'Robots', moduleIndex: 1, description: 'A wrist assembly provides movements used to adjust the orientation of the end effector.', large: true, illustration: 'wrist_assembly' },
  { id: 'rb03', name: 'Cartesian Robot Model', module: 'Robots', moduleIndex: 1, description: 'A Cartesian robot uses linear axes to position its tool within a working region.', large: true, illustration: 'cartesian_robot' },
  { id: 'rb04', name: 'Cylindrical Robot Model', module: 'Robots', moduleIndex: 1, description: 'A cylindrical configuration combines rotary and linear movements to position its tool.', large: true, illustration: 'cylindrical_robot' },
  { id: 'rb05', name: 'Polar Robot Model', module: 'Robots', moduleIndex: 1, description: 'A polar configuration combines angular movements with a linear extension.', large: true, illustration: 'polar_robot' },
  { id: 'rb06', name: 'Articulated Robot Model', module: 'Robots', moduleIndex: 1, description: 'An articulated robot uses rotary joints arranged in a jointed arm.', large: true, illustration: 'articulated_robot' },
  { id: 'rb07', name: 'SCARA Robot Model', module: 'Robots', moduleIndex: 1, description: 'A SCARA configuration is commonly used for assembly and handling tasks.', large: true, illustration: 'scara_robot' },
  { id: 'rb08', name: 'Serial Kinematic Chain Model', module: 'Robots', moduleIndex: 1, description: 'A serial chain connects links in sequence from the base to the end effector.', large: true, illustration: 'serial_chain' },
  { id: 'rb09', name: 'Closed Kinematic Chain Model', module: 'Robots', moduleIndex: 1, description: 'A closed chain contains a loop of connected links that constrains their movement.', large: true, illustration: 'closed_chain' },
  { id: 'rb10', name: 'Strain Gauge', module: 'Robots', moduleIndex: 1, description: 'A strain gauge changes electrical resistance as the surface it is attached to deforms.', large: false, illustration: 'strain_gauge' },
  { id: 'rb11', name: 'Flexible Material Test Strip', module: 'Robots', moduleIndex: 1, description: 'This sample demonstrates how a material deforms under an applied load.', large: false, illustration: 'flex_strip' },
  { id: 'rb12', name: 'Mechanical Travel Stop', module: 'Robots', moduleIndex: 1, description: 'A mechanical stop physically limits the movement of a mechanism.', large: false, illustration: 'travel_stop' },
  { id: 'rb13', name: 'Positioning Target Plate', module: 'Robots', moduleIndex: 1, description: 'This marked plate provides a reference for comparing desired and achieved tool positions.', large: false, illustration: 'target_plate'},
  { id: 'rb14', name: 'Kinematics Diagram Sheet', module: 'Robots', moduleIndex: 1, description: 'This sheet illustrates the relationship between joint values and end-effector position.', large: false, illustration: 'kinematics_sheet' },
  { id: 'rb15', name: 'Historical Robotics Market Report', module: 'Robots', moduleIndex: 1, description: 'This dated report compares robot installations and adoption measures discussed in the course.', large: false, illustration: 'market_report' },

  // Module 3: Industrial Robots
  { id: 'ir01', name: 'Stepper Motor', module: 'Industrial Robots', moduleIndex: 2, description: 'A stepper motor produces movement in commanded angular increments.', large: false, illustration: 'stepper_motor' },
  { id: 'ir02', name: 'Brushless Servomotor', module: 'Industrial Robots', moduleIndex: 2, description: 'A brushless servomotor can provide controlled movement as part of a feedback-controlled drive system.', large: false, illustration: 'servomotor' },
  { id: 'ir03', name: 'Hydraulic Cylinder', module: 'Industrial Robots', moduleIndex: 2, description: 'A hydraulic cylinder uses pressurized liquid to produce linear force and movement.', large: true, illustration: 'hydraulic_cylinder' },
  { id: 'ir04', name: 'Pneumatic Cylinder', module: 'Industrial Robots', moduleIndex: 2, description: 'A pneumatic cylinder uses compressed gas to produce linear movement.', large: true, illustration: 'pneumatic_cylinder' },
  { id: 'ir05', name: 'Shaft Coupling', module: 'Industrial Robots', moduleIndex: 2, description: 'A shaft coupling connects rotating shafts to transmit motion and torque.', large: false, illustration: 'shaft_coupling' },
  { id: 'ir06', name: 'Inductive Proximity Sensor', module: 'Industrial Robots', moduleIndex: 2, description: 'An inductive proximity sensor detects suitable metallic targets without physical contact.', large: false, illustration: 'inductive_sensor' },
  { id: 'ir07', name: 'Capacitive Proximity Sensor', module: 'Industrial Robots', moduleIndex: 2, description: 'A capacitive proximity sensor detects changes in an electric field caused by a nearby target.', large: false, illustration: 'capacitive_sensor' },
  { id: 'ir08', name: 'Incremental Rotary Encoder', module: 'Industrial Robots', moduleIndex: 2, description: 'An incremental encoder produces signals that can be counted to measure changes in shaft position.', large: false, illustration: 'incremental_encoder' },
  { id: 'ir09', name: 'Absolute Rotary Encoder', module: 'Industrial Robots', moduleIndex: 2, description: 'An absolute encoder provides a coded position value within its specified measuring range.', large: false, illustration: 'absolute_encoder' },
  { id: 'ir10', name: 'Photoelectric Through-Beam Sensor Pair', module: 'Industrial Robots', moduleIndex: 2, description: 'A separate emitter and receiver detect an object when it interrupts their light beam.', large: true, illustration: 'through_beam' },
  { id: 'ir11', name: 'Bernoulli Gripper', module: 'Industrial Robots', moduleIndex: 2, description: 'A Bernoulli gripper uses airflow and the resulting pressure distribution to hold a workpiece.', large: false, illustration: 'bernoulli_gripper' },
  { id: 'ir12', name: 'Magnetic Gripper', module: 'Industrial Robots', moduleIndex: 2, description: 'A magnetic gripper holds workpieces made from suitable magnetic materials.', large: false, illustration: 'magnetic_gripper' },
  { id: 'ir13', name: 'Two-Finger Mechanical Gripper', module: 'Industrial Robots', moduleIndex: 2, description: 'A two-finger gripper holds an object by bringing two gripping surfaces into contact with it.', large: false, illustration: 'two_finger_gripper' },
  { id: 'ir14', name: 'Robot Teach Pendant', module: 'Industrial Robots', moduleIndex: 2, description: 'A teach pendant lets an operator interact with a robot controller and teach or adjust programmed movements.', large: false, illustration: 'teach_pendant' },
  { id: 'ir15', name: 'Robotic Welding Torch', module: 'Industrial Robots', moduleIndex: 2, description: 'A welding torch mounted on a robot performs a welding operation along a programmed path.', large: true, illustration: 'welding_torch' },

  // Module 4: Mobile Robots
  { id: 'mr01', name: 'Drive Wheel', module: 'Mobile Robots', moduleIndex: 3, description: 'A driven wheel transfers motor torque to the ground to move the robot.', large: false, illustration: 'drive_wheel' },
  { id: 'mr02', name: 'Articulated Leg Assembly', module: 'Mobile Robots', moduleIndex: 3, description: 'An articulated leg uses coordinated joint movement to support and move a robot.', large: true, illustration: 'leg_assembly' },
  { id: 'mr03', name: 'DC Drive Motor', module: 'Mobile Robots', moduleIndex: 3, description: 'A DC motor converts electrical energy into rotational motion for a mobile platform.', large: false, illustration: 'dc_motor' },
  { id: 'mr04', name: 'Rechargeable Battery Pack', module: 'Mobile Robots', moduleIndex: 3, description: 'A battery pack stores electrical energy for operation away from a fixed power connection.', large: false, illustration: 'battery_pack' },
  { id: 'mr05', name: 'Charging Dock', module: 'Mobile Robots', moduleIndex: 3, description: 'A charging dock provides an interface for replenishing a robot\'s battery.', large: true, illustration: 'charging_dock' },
  { id: 'mr06', name: 'Tactile Bumper Switch', module: 'Mobile Robots', moduleIndex: 3, description: 'A bumper switch detects physical contact with an obstacle.', large: false, illustration: 'bumper_switch' },
  { id: 'mr07', name: 'Wheel Encoder', module: 'Mobile Robots', moduleIndex: 3, description: 'A wheel encoder measures wheel rotation that can contribute to estimates of robot movement.', large: false, illustration: 'wheel_encoder' },
  { id: 'mr08', name: 'Ultrasonic Range Sensor', module: 'Mobile Robots', moduleIndex: 3, description: 'An ultrasonic range sensor estimates distance using transmitted sound and its returning echo.', large: false, illustration: 'ultrasonic_sensor' },
  { id: 'mr09', name: 'Infrared Distance Sensor', module: 'Mobile Robots', moduleIndex: 3, description: 'An infrared distance sensor uses infrared light to obtain information about nearby objects.', large: false, illustration: 'ir_sensor' },
  { id: 'mr10', name: 'LiDAR Scanner', module: 'Mobile Robots', moduleIndex: 3, description: 'A LiDAR scanner uses laser measurements to obtain distance information about surrounding surfaces.', large: true, illustration: 'lidar_scanner' },
  { id: 'mr11', name: 'Gyroscope Module', module: 'Mobile Robots', moduleIndex: 3, description: 'A gyroscope measures angular velocity, helping track changes in orientation.', large: false, illustration: 'gyroscope' },
  { id: 'mr12', name: 'Camera Module', module: 'Mobile Robots', moduleIndex: 3, description: 'A camera captures images that a robot can process for perception and navigation.', large: false, illustration: 'camera_module' },
  { id: 'mr13', name: 'GPS Receiver', module: 'Mobile Robots', moduleIndex: 3, description: 'A GPS receiver uses satellite signals to estimate position where reception conditions permit.', large: false, illustration: 'gps_receiver' },
  { id: 'mr14', name: 'Electronic Compass', module: 'Mobile Robots', moduleIndex: 3, description: 'An electronic compass estimates heading from the local magnetic field.', large: false, illustration: 'compass' },
  { id: 'mr15', name: 'Environment Map Display', module: 'Mobile Robots', moduleIndex: 3, description: 'This display represents spatial information a robot can use for localization and route planning.', large: true, illustration: 'env_map'},

  // Module 5: Applications
  { id: 'ap01', name: 'Robotic Spot-Welding Gun', module: 'Applications', moduleIndex: 4, subsection: 'Industrial Robots', description: 'A spot-welding gun joins suitable metal sheets at localized contact points.', large: true, illustration: 'spot_weld_gun' },
  { id: 'ap02', name: 'Robotic Paint Spray Gun', module: 'Applications', moduleIndex: 4, subsection: 'Industrial Robots', description: 'A robot-mounted spray gun applies a coating along a controlled path.', large: true, illustration: 'paint_gun' },
  { id: 'ap03', name: 'Surgical Robot Instrument', module: 'Applications', moduleIndex: 4, subsection: 'Healthcare', description: 'A surgical robotic instrument enables controlled manipulation as part of a robot-assisted surgical system.', large: true, illustration: 'surgical_instrument' },
  { id: 'ap04', name: 'Rehabilitation Robot Model', module: 'Applications', moduleIndex: 4, subsection: 'Healthcare', description: 'A rehabilitation robot can support repeated movement practice during recovery.', large: true, illustration: 'rehab_robot' },
  { id: 'ap05', name: 'Robotic Fruit-Picking Gripper', module: 'Applications', moduleIndex: 4, subsection: 'Agriculture or Field Robots', description: 'A fruit-picking gripper handles produce while aiming to limit damage.', large: false, illustration: 'fruit_gripper' },
  { id: 'ap06', name: 'Precision Spraying Nozzle', module: 'Applications', moduleIndex: 4, subsection: 'Agriculture or Field Robots', description: 'A precision spraying system directs treatment toward selected agricultural targets.', large: false, illustration: 'spray_nozzle' },
  { id: 'ap07', name: 'Planetary Rover Model', module: 'Applications', moduleIndex: 4, subsection: 'Space and Defense', description: 'A planetary rover carries instruments to explore and collect information from a planetary surface.', large: true, illustration: 'rover_model' },
  { id: 'ap08', name: 'Remote Inspection Robot Model', module: 'Applications', moduleIndex: 4, subsection: 'Space and Defense', description: 'A remotely operated inspection robot allows people to examine hazardous areas from a distance.', large: true, illustration: 'inspection_robot' },
  { id: 'ap09', name: 'Palletizing Robot Model', module: 'Applications', moduleIndex: 4, subsection: 'Warehouse and Logistics', description: 'A palletizing robot places goods onto pallets in an organized arrangement.', large: true, illustration: 'palletizing_robot' },
  { id: 'ap10', name: 'Magnetic Guidance Tape', module: 'Applications', moduleIndex: 4, subsection: 'Warehouse and Logistics', description: 'Magnetic guidance tape provides a detectable route for compatible guided vehicles.', large: false, illustration: 'guidance_tape' },
  { id: 'ap11', name: 'Construction RFID Tag', module: 'Applications', moduleIndex: 4, subsection: 'Construction', description: 'An RFID tag helps identify and track a construction material, component, or piece of equipment.', large: false, illustration: 'rfid_tag' },
  { id: 'ap12', name: 'Embedded Concrete Monitoring Sensor', module: 'Applications', moduleIndex: 4, subsection: 'Construction', description: 'An embedded sensor can monitor concrete temperature to support maturity-based strength estimates.', large: false, illustration: 'concrete_sensor' },
  { id: 'ap13', name: 'Powered Exoskeleton Joint', module: 'Applications', moduleIndex: 4, subsection: 'Wearables', description: 'A powered exoskeleton joint provides controlled assistance to a wearer\'s movement.', large: true, illustration: 'exo_joint' },
  { id: 'ap14', name: 'Robotic Prosthetic Hand', module: 'Applications', moduleIndex: 4, subsection: 'Wearables', description: 'A robotic prosthetic hand uses actuated mechanisms to provide grasping functions.', large: true, illustration: 'prosthetic_hand' },
  { id: 'ap15', name: 'Paro Robotic Seal Model', module: 'Applications', moduleIndex: 4, subsection: 'Social Robots', description: 'Paro illustrates an animal-inspired social robot designed for interaction with people.', large: true, illustration: 'paro_seal' },
];

export function getObjectsByModule(moduleName: ModuleName): GameObject[] {
  return OBJECTS.filter(o => o.module === moduleName);
}
