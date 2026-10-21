// Question data - separated from game logic for easy expansion

export type QuestionType = 'quiz' | 'open_ended';

export interface QuizOption {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  module: string;
  objectId: string;
  type: QuestionType;
  prompt: string;
  options?: QuizOption[];
  correctAnswer?: string; // label for quiz
  explanation?: string;
  modelResponse?: string; // for open-ended
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    module: 'What is Robotics?',
    objectId: 'wr04',
    type: 'quiz',
    prompt: 'Which joint allows linear motion along an axis?',
    options: [
      { label: 'A', text: 'Revolute joint' },
      { label: 'B', text: 'Prismatic joint' },
      { label: 'C', text: 'Fixed connection' },
      { label: 'D', text: 'End effector' },
    ],
    correctAnswer: 'B',
    explanation: 'A prismatic joint allows translation along an axis, while a revolute joint allows rotation.',
  },
  {
    id: 'q2',
    module: 'Robots',
    objectId: 'rb13',
    type: 'quiz',
    prompt: 'A robot repeatedly reaches nearly the same point, but that point is offset from its intended target. What does this demonstrate?',
    options: [
      { label: 'A', text: 'High repeatability but poor accuracy' },
      { label: 'B', text: 'High accuracy but poor repeatability' },
      { label: 'C', text: 'Perfect accuracy and repeatability' },
      { label: 'D', text: 'No positioning error' },
    ],
    correctAnswer: 'A',
    explanation: 'Repeatability describes consistency between attempts; accuracy describes closeness to the intended target.',
  },
  {
    id: 'q3',
    module: 'Mobile Robots',
    objectId: 'mr15',
    type: 'open_ended',
    prompt: 'Complete the sentence in your own words: "A mobile robot needs information about its surroundings because..."',
    modelResponse: 'A mobile robot needs information about its surroundings because it must estimate where it is, detect obstacles, and adapt its movement when the environment changes.',
  },
];

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find(q => q.id === id);
}

export function getQuestionForObject(objectId: string): Question | undefined {
  return QUESTIONS.find(q => q.objectId === objectId);
}
