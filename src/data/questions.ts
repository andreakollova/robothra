// Question data - separated from game logic for easy expansion
// Each module has a pool of quiz questions and open-ended questions.
// When inspecting an object, 2 random quizzes + 1 random open-ended from that module are shown.

export type QuestionType = 'quiz' | 'open_ended';

export interface QuizOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  module: string;
  type: QuestionType;
  prompt: string;
  options?: QuizOption[];
  correctAnswers?: string[]; // one or more correct labels for quiz
  explanation?: string;
  modelResponse?: string; // for open-ended
  keywords?: string[]; // keywords the learner should mention (for open-ended guidance)
}

export const QUESTIONS: Question[] = [
  // ====================================================================
  // What is Robotics? - Quiz questions
  // ====================================================================
  {
    id: 'wr_q1',
    module: 'What is Robotics?',
    type: 'quiz',
    prompt: 'Which joint allows linear motion along an axis?',
    options: [
      { label: 'A', text: 'Revolute joint' },
      { label: 'B', text: 'Prismatic joint' },
      { label: 'C', text: 'Fixed connection' },
      { label: 'D', text: 'End effector' },
    ],
    correctAnswers: ['B'],
    explanation: 'A prismatic joint allows translation along an axis, while a revolute joint allows rotation.',
  },
  {
    id: 'wr_q2',
    module: 'What is Robotics?',
    type: 'quiz',
    prompt: 'Which of these are coordinate systems used to describe positions in robotics?',
    options: [
      { label: 'A', text: 'Cartesian coordinates' },
      { label: 'B', text: 'Polar coordinates' },
      { label: 'C', text: 'Cylindrical coordinates' },
      { label: 'D', text: 'Binary coordinates' },
    ],
    correctAnswers: ['A', 'B', 'C'],
    explanation: 'Cartesian (x, y, z), polar (distance + angle), and cylindrical (radius, angle, height) are all used. Binary coordinates do not exist as a coordinate system.',
  },
  {
    id: 'wr_q3',
    module: 'What is Robotics?',
    type: 'quiz',
    prompt: 'What distinguishes a mobile robot from an industrial robot?',
    options: [
      { label: 'A', text: 'A mobile robot can move through its environment' },
      { label: 'B', text: 'An industrial robot works from a fixed location' },
      { label: 'C', text: 'A mobile robot is always autonomous' },
      { label: 'D', text: 'An industrial robot cannot be programmed' },
    ],
    correctAnswers: ['A', 'B'],
    explanation: 'Mobile robots move through their environment while industrial robots typically work from a fixed base. Mobile robots are not always fully autonomous, and industrial robots are programmable.',
  },
  {
    id: 'wr_q4',
    module: 'What is Robotics?',
    type: 'quiz',
    prompt: 'What does a revolute joint allow?',
    options: [
      { label: 'A', text: 'Rotation of one link relative to another' },
      { label: 'B', text: 'Linear sliding along an axis' },
      { label: 'C', text: 'Free movement in all directions' },
      { label: 'D', text: 'No movement at all' },
    ],
    correctAnswers: ['A'],
    explanation: 'A revolute joint allows rotational movement between two connected links.',
  },
  // What is Robotics? - Open-ended
  {
    id: 'wr_o1',
    module: 'What is Robotics?',
    type: 'open_ended',
    prompt: 'Explain in your own words why coordinate systems are important in robotics.',
    modelResponse: 'Coordinate systems are important because they allow us to precisely describe positions and orientations in space. Without them, we could not program a robot to move to specific locations, track objects, or coordinate movements between joints.',
    keywords: ['position', 'describe', 'space', 'movement', 'location', 'orientation'],
  },
  {
    id: 'wr_o2',
    module: 'What is Robotics?',
    type: 'open_ended',
    prompt: 'What advantages might soft robotics offer compared to traditional rigid robots?',
    modelResponse: 'Soft robots can adapt their shape to objects they interact with, handle delicate items without damage, work safely near humans, and navigate through tight or irregular spaces that rigid robots cannot.',
    keywords: ['adapt', 'shape', 'delicate', 'safe', 'flexible', 'deform'],
  },

  // ====================================================================
  // Robots - Quiz questions
  // ====================================================================
  {
    id: 'rb_q1',
    module: 'Robots',
    type: 'quiz',
    prompt: 'A robot repeatedly reaches nearly the same point, but that point is offset from its intended target. What does this demonstrate?',
    options: [
      { label: 'A', text: 'High repeatability but poor accuracy' },
      { label: 'B', text: 'High accuracy but poor repeatability' },
      { label: 'C', text: 'Perfect accuracy and repeatability' },
      { label: 'D', text: 'No positioning error' },
    ],
    correctAnswers: ['A'],
    explanation: 'Repeatability describes consistency between attempts; accuracy describes closeness to the intended target.',
  },
  {
    id: 'rb_q2',
    module: 'Robots',
    type: 'quiz',
    prompt: 'Which of the following are types of robot configurations?',
    options: [
      { label: 'A', text: 'Cartesian' },
      { label: 'B', text: 'SCARA' },
      { label: 'C', text: 'Articulated' },
      { label: 'D', text: 'Recursive' },
    ],
    correctAnswers: ['A', 'B', 'C'],
    explanation: 'Cartesian, SCARA, and articulated are all standard robot configurations. Recursive is not a robot configuration type.',
  },
  {
    id: 'rb_q3',
    module: 'Robots',
    type: 'quiz',
    prompt: 'What is the difference between a serial and a closed kinematic chain?',
    options: [
      { label: 'A', text: 'A serial chain connects links in sequence; a closed chain forms a loop' },
      { label: 'B', text: 'A serial chain is faster than a closed chain' },
      { label: 'C', text: 'A closed chain constrains the movement of its links' },
      { label: 'D', text: 'They are identical in function' },
    ],
    correctAnswers: ['A', 'C'],
    explanation: 'A serial chain connects links in sequence from base to end effector. A closed chain contains a loop that constrains link movement.',
  },
  {
    id: 'rb_q4',
    module: 'Robots',
    type: 'quiz',
    prompt: 'What does a strain gauge measure?',
    options: [
      { label: 'A', text: 'Temperature' },
      { label: 'B', text: 'Deformation of a surface' },
      { label: 'C', text: 'Light intensity' },
      { label: 'D', text: 'Sound frequency' },
    ],
    correctAnswers: ['B'],
    explanation: 'A strain gauge changes electrical resistance as the surface it is attached to deforms, allowing measurement of mechanical strain.',
  },
  // Robots - Open-ended
  {
    id: 'rb_o1',
    module: 'Robots',
    type: 'open_ended',
    prompt: 'Why is it important to understand kinematics when designing a robot arm?',
    modelResponse: 'Understanding kinematics is essential because it describes the relationship between joint movements and the position of the end effector. Without kinematics, we cannot calculate how to move joints to reach a desired position, or predict where the tool will end up for given joint values.',
    keywords: ['joint', 'position', 'end effector', 'movement', 'relationship', 'calculate'],
  },
  {
    id: 'rb_o2',
    module: 'Robots',
    type: 'open_ended',
    prompt: 'Explain why mechanical travel stops are useful in robot mechanisms.',
    modelResponse: 'Mechanical travel stops physically limit the range of movement of a mechanism, preventing it from exceeding safe operating boundaries. They protect against software errors, sensor failures, or unexpected forces that could cause damage.',
    keywords: ['limit', 'movement', 'safe', 'protect', 'range', 'boundary'],
  },

  // ====================================================================
  // Industrial Robots - Quiz questions
  // ====================================================================
  {
    id: 'ir_q1',
    module: 'Industrial Robots',
    type: 'quiz',
    prompt: 'Which actuators use fluid to produce movement?',
    options: [
      { label: 'A', text: 'Hydraulic cylinder' },
      { label: 'B', text: 'Pneumatic cylinder' },
      { label: 'C', text: 'Stepper motor' },
      { label: 'D', text: 'Brushless servomotor' },
    ],
    correctAnswers: ['A', 'B'],
    explanation: 'Hydraulic cylinders use pressurized liquid and pneumatic cylinders use compressed gas. Stepper motors and servomotors are electric actuators.',
  },
  {
    id: 'ir_q2',
    module: 'Industrial Robots',
    type: 'quiz',
    prompt: 'What is the key difference between an incremental and an absolute rotary encoder?',
    options: [
      { label: 'A', text: 'An incremental encoder counts changes; an absolute encoder gives a position value directly' },
      { label: 'B', text: 'An absolute encoder needs a reference point after power-on; an incremental does not' },
      { label: 'C', text: 'They measure completely different physical quantities' },
      { label: 'D', text: 'An incremental encoder is always more accurate' },
    ],
    correctAnswers: ['A'],
    explanation: 'An incremental encoder produces signals counted to measure changes in position, while an absolute encoder provides a coded position value directly within its range.',
  },
  {
    id: 'ir_q3',
    module: 'Industrial Robots',
    type: 'quiz',
    prompt: 'Which sensors detect objects without physical contact?',
    options: [
      { label: 'A', text: 'Inductive proximity sensor' },
      { label: 'B', text: 'Capacitive proximity sensor' },
      { label: 'C', text: 'Photoelectric through-beam sensor' },
      { label: 'D', text: 'All of the above' },
    ],
    correctAnswers: ['A', 'B', 'C', 'D'],
    explanation: 'All three sensor types detect objects without physical contact: inductive sensors detect metal, capacitive sensors detect field changes, and photoelectric sensors detect beam interruption.',
  },
  {
    id: 'ir_q4',
    module: 'Industrial Robots',
    type: 'quiz',
    prompt: 'How does a Bernoulli gripper hold a workpiece?',
    options: [
      { label: 'A', text: 'Using airflow and pressure distribution' },
      { label: 'B', text: 'Using magnetic force' },
      { label: 'C', text: 'Using mechanical fingers' },
      { label: 'D', text: 'Using adhesive' },
    ],
    correctAnswers: ['A'],
    explanation: 'A Bernoulli gripper uses high-speed airflow to create a low-pressure zone that holds the workpiece without mechanical contact.',
  },
  // Industrial Robots - Open-ended
  {
    id: 'ir_o1',
    module: 'Industrial Robots',
    type: 'open_ended',
    prompt: 'Why might a factory choose a pneumatic cylinder over a hydraulic cylinder for a particular application?',
    modelResponse: 'A pneumatic cylinder uses compressed air which is cleaner, cheaper, and simpler to maintain than hydraulic fluid. It is better suited for lighter loads and faster, simpler movements. Hydraulic systems provide more force but are heavier and risk fluid leaks.',
    keywords: ['air', 'clean', 'lighter', 'simpler', 'force', 'fluid', 'maintenance'],
  },
  {
    id: 'ir_o2',
    module: 'Industrial Robots',
    type: 'open_ended',
    prompt: 'What is the role of a teach pendant in industrial robotics?',
    modelResponse: 'A teach pendant allows an operator to manually guide and program the robot by moving it to desired positions and recording those positions. It provides a portable interface for teaching movements, adjusting programs, and controlling the robot during setup.',
    keywords: ['operator', 'program', 'position', 'guide', 'teach', 'control', 'movement'],
  },

  // ====================================================================
  // Mobile Robots - Quiz questions
  // ====================================================================
  {
    id: 'mr_q1',
    module: 'Mobile Robots',
    type: 'quiz',
    prompt: 'Which sensors can a mobile robot use to estimate distance to nearby objects?',
    options: [
      { label: 'A', text: 'Ultrasonic range sensor' },
      { label: 'B', text: 'Infrared distance sensor' },
      { label: 'C', text: 'LiDAR scanner' },
      { label: 'D', text: 'GPS receiver' },
    ],
    correctAnswers: ['A', 'B', 'C'],
    explanation: 'Ultrasonic, infrared, and LiDAR sensors all measure distance to nearby objects. GPS estimates global position using satellites, not distance to nearby objects.',
  },
  {
    id: 'mr_q2',
    module: 'Mobile Robots',
    type: 'quiz',
    prompt: 'What does a wheel encoder measure?',
    options: [
      { label: 'A', text: 'Wheel rotation to estimate robot movement' },
      { label: 'B', text: 'The temperature of the wheel' },
      { label: 'C', text: 'The weight on each wheel' },
      { label: 'D', text: 'Battery charge level' },
    ],
    correctAnswers: ['A'],
    explanation: 'A wheel encoder measures wheel rotation, which can be used to estimate how far and in what direction the robot has moved.',
  },
  {
    id: 'mr_q3',
    module: 'Mobile Robots',
    type: 'quiz',
    prompt: 'Why does a mobile robot need a charging dock?',
    options: [
      { label: 'A', text: 'To replenish its battery for continued operation' },
      { label: 'B', text: 'To update its software' },
      { label: 'C', text: 'To communicate with other robots' },
      { label: 'D', text: 'To calibrate its sensors' },
    ],
    correctAnswers: ['A'],
    explanation: 'A charging dock provides an interface for replenishing the battery so the robot can continue operating away from a fixed power connection.',
  },
  {
    id: 'mr_q4',
    module: 'Mobile Robots',
    type: 'quiz',
    prompt: 'Which instruments help a mobile robot determine its orientation?',
    options: [
      { label: 'A', text: 'Gyroscope' },
      { label: 'B', text: 'Electronic compass' },
      { label: 'C', text: 'Camera' },
      { label: 'D', text: 'Tactile bumper' },
    ],
    correctAnswers: ['A', 'B'],
    explanation: 'A gyroscope measures angular velocity (changes in orientation) and an electronic compass estimates heading from the magnetic field. A camera can help with orientation through visual processing but primarily provides images. A bumper only detects contact.',
  },
  // Mobile Robots - Open-ended
  {
    id: 'mr_o1',
    module: 'Mobile Robots',
    type: 'open_ended',
    prompt: 'Complete the sentence in your own words: "A mobile robot needs information about its surroundings because..."',
    modelResponse: 'A mobile robot needs information about its surroundings because it must estimate where it is, detect obstacles, and adapt its movement when the environment changes.',
    keywords: ['estimate', 'position', 'obstacles', 'adapt', 'environment', 'navigate', 'detect'],
  },
  {
    id: 'mr_o2',
    module: 'Mobile Robots',
    type: 'open_ended',
    prompt: 'What are the advantages and limitations of GPS for mobile robot navigation?',
    modelResponse: 'GPS allows a robot to estimate its global position using satellite signals, which is useful for outdoor navigation over large areas. However, GPS does not work well indoors, under cover, or in urban canyons. Its accuracy is limited to a few meters, which is insufficient for precise local navigation.',
    keywords: ['satellite', 'outdoor', 'indoor', 'accuracy', 'position', 'limited'],
  },

  // ====================================================================
  // Applications - Quiz questions
  // ====================================================================
  {
    id: 'ap_q1',
    module: 'Applications',
    type: 'quiz',
    prompt: 'Which robotic applications are used in healthcare?',
    options: [
      { label: 'A', text: 'Surgical robotic instruments' },
      { label: 'B', text: 'Rehabilitation robots' },
      { label: 'C', text: 'Palletizing robots' },
      { label: 'D', text: 'Spot-welding guns' },
    ],
    correctAnswers: ['A', 'B'],
    explanation: 'Surgical instruments and rehabilitation robots are healthcare applications. Palletizing is logistics and spot-welding is industrial manufacturing.',
  },
  {
    id: 'ap_q2',
    module: 'Applications',
    type: 'quiz',
    prompt: 'What does a planetary rover do?',
    options: [
      { label: 'A', text: 'Carries instruments to explore a planetary surface' },
      { label: 'B', text: 'Orbits a planet to take photographs' },
      { label: 'C', text: 'Launches satellites into orbit' },
      { label: 'D', text: 'Collects information from remote environments' },
    ],
    correctAnswers: ['A', 'D'],
    explanation: 'A planetary rover moves across a planetary surface carrying instruments to explore and collect information. It does not orbit or launch satellites.',
  },
  {
    id: 'ap_q3',
    module: 'Applications',
    type: 'quiz',
    prompt: 'How does magnetic guidance tape help in a warehouse?',
    options: [
      { label: 'A', text: 'It provides a detectable route for guided vehicles' },
      { label: 'B', text: 'It generates electricity for the robots' },
      { label: 'C', text: 'It tracks inventory using RFID' },
      { label: 'D', text: 'It holds metal shelves together' },
    ],
    correctAnswers: ['A'],
    explanation: 'Magnetic guidance tape provides a detectable route on the floor that compatible automated guided vehicles can follow for navigation.',
  },
  {
    id: 'ap_q4',
    module: 'Applications',
    type: 'quiz',
    prompt: 'What is the purpose of Paro, the robotic seal?',
    options: [
      { label: 'A', text: 'Industrial inspection' },
      { label: 'B', text: 'Social interaction with people' },
      { label: 'C', text: 'Underwater exploration' },
      { label: 'D', text: 'Agricultural harvesting' },
    ],
    correctAnswers: ['B'],
    explanation: 'Paro is an animal-inspired social robot designed specifically for interaction with people, particularly in therapeutic and care settings.',
  },
  // Applications - Open-ended
  {
    id: 'ap_o1',
    module: 'Applications',
    type: 'open_ended',
    prompt: 'Why is it important for a fruit-picking gripper to limit damage to the produce?',
    modelResponse: 'Damaged fruit loses market value, spoils faster, and can spread disease to other produce. A gripper must apply enough force to hold the fruit securely but gently enough not to bruise or puncture it.',
    keywords: ['damage', 'value', 'gentle', 'force', 'bruise', 'spoil', 'hold'],
  },
  {
    id: 'ap_o2',
    module: 'Applications',
    type: 'open_ended',
    prompt: 'How could a powered exoskeleton improve the life of its wearer?',
    modelResponse: 'A powered exoskeleton can assist people with reduced mobility by providing controlled support to their movements, helping them walk, lift objects, or perform daily tasks. It can also reduce fatigue and injury risk for workers performing heavy physical labor.',
    keywords: ['mobility', 'support', 'movement', 'assist', 'walk', 'lift', 'fatigue'],
  },
];

// Get all quiz questions for a module
export function getModuleQuizzes(module: string): Question[] {
  return QUESTIONS.filter(q => q.module === module && q.type === 'quiz');
}

// Get all open-ended questions for a module
export function getModuleOpenEnded(module: string): Question[] {
  return QUESTIONS.filter(q => q.module === module && q.type === 'open_ended');
}

// Pick random N items from array
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// Get a challenge set for a module: 2 quizzes + 1 open-ended
export function getChallengeSet(module: string): Question[] {
  const quizzes = pickRandom(getModuleQuizzes(module), 2);
  const openEnded = pickRandom(getModuleOpenEnded(module), 1);
  return [...quizzes, ...openEnded];
}

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find(q => q.id === id);
}
