// Core game state management

import { OBJECTS, MODULE_NAMES, ModuleName } from '../data/objects';
import { QUESTIONS, getQuestionById, getChallengeSet, Question } from '../data/questions';
import { OBJECT_PLACEMENTS, getAllWalls, getPlayerStart, getRoomAt, ROOMS, Wall } from '../data/world';
import { resolveCollision, distanceBetween } from './collision';
import { SaveData, loadGame, saveGame, QuizAttempt } from './save';
import { playStep, playDiscovery } from './sound';

// IDs of objects that have PNG sprites
const _spriteIds = new Set([
  'ir01','ir02','ir03','ir04','ir05','ir06','ir07','ir08','ir09','ir10',
  'ir11','ir12','ir13','ir14','ir15',
  'rb01','rb02','rb03','rb04','rb05','rb06','rb07','rb09','rb10','rb11','rb12',
]);

const PLAYER_SPEED = 180;
const PLAYER_BOOST = 360;
const PLAYER_SIZE = 24;
const INTERACTION_DIST = 80;
const STEP_INTERVAL = 0.25;

export type Direction = 'up' | 'down' | 'left' | 'right';

export type UIOverlay = 'none' | 'inspect' | 'question' | 'feedback' | 'open_ended' | 'open_feedback' | 'challenge_result' | 'map' | 'journal' | 'pause' | 'completion' | 'editor' | 'hint' | 'flashcards';

export interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
}

// The challenge set for an object: 2 quiz + 1 open-ended
export interface ChallengeState {
  objectId: string;
  questions: Question[];       // 3 questions: quiz, quiz, open-ended
  currentIndex: number;        // 0, 1, 2
  selectedAnswers: Set<number>[]; // multi-select for each quiz
  writtenAnswer: string;
  results: (boolean | null)[];  // true/false for quiz, null for open-ended until self-approved
  selfApproved: boolean | null; // for open-ended
}

export type FlashcardDifficulty = 'choose' | 'type';
export type FlashcardCardType = 'image' | 'concept';

export interface FlashcardCard {
  objectId: string;
  cardType: FlashcardCardType; // image = show PNG guess name, concept = show description guess name
  hasImage: boolean;
}

export interface FlashcardState {
  difficulty: FlashcardDifficulty;
  module: ModuleName | null; // null = all modules
  cards: FlashcardCard[];
  currentIndex: number;
  options: string[]; // 4 option names for 'choose' mode
  correctName: string;
  typedAnswer: string;
  phase: 'question' | 'correct' | 'incorrect';
  score: number;
  total: number;
}

export class GameState {
  player: PlayerState;
  walls: Wall[];
  nearestObjectId: string | null = null;
  overlay: UIOverlay = 'hint';
  challenge: ChallengeState | null = null;
  inspectingObjectId: string | null = null; // for the info phase
  save: SaveData;
  playTimeActive = true;
  private stepTimer = 0;
  private saveTimer = 0;
  journalTab: 'collection' | 'progress' = 'collection';
  journalModule: ModuleName | null = null;
  practiceMode = false;
  practiceQueue: string[] = [];
  practiceIndex = 0;
  flashcardMode: FlashcardState | null = null;

  constructor() {
    this.save = loadGame();
    const start = getPlayerStart();
    this.player = {
      x: this.save.playerX || start.x,
      y: this.save.playerY || start.y,
      direction: 'down',
      moving: false,
    };
    this.walls = getAllWalls();
    if (!this.isWalkable(this.player.x, this.player.y)) {
      this.player.x = start.x;
      this.player.y = start.y;
    }
  }

  private isWalkable(x: number, y: number): boolean {
    for (const wall of this.walls) {
      if (x < wall.x + wall.w && x + PLAYER_SIZE > wall.x &&
          y < wall.y + wall.h && y + PLAYER_SIZE > wall.y) {
        return false;
      }
    }
    return true;
  }

  update(dt: number, input: { up: boolean; down: boolean; left: boolean; right: boolean; shift?: boolean }) {
    if (this.overlay !== 'none' && this.overlay !== 'hint') return;

    let dx = 0, dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    this.player.moving = dx !== 0 || dy !== 0;

    if (this.player.moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;

      const speed = input.shift ? PLAYER_BOOST : PLAYER_SPEED;
      const newX = this.player.x + dx * speed * dt;
      const newY = this.player.y + dy * speed * dt;

      const resolved = resolveCollision(
        this.player.x, this.player.y, PLAYER_SIZE, PLAYER_SIZE,
        newX, newY, this.walls
      );
      this.player.x = resolved.x;
      this.player.y = resolved.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.direction = dx > 0 ? 'right' : 'left';
      } else if (dy !== 0) {
        this.player.direction = dy > 0 ? 'down' : 'up';
      }

      this.stepTimer += dt;
      if (this.stepTimer >= STEP_INTERVAL) {
        this.stepTimer = 0;
        playStep();
      }
    }

    // Find nearest undiscovered object
    this.nearestObjectId = null;
    let nearestDist = INTERACTION_DIST;
    const pcx = this.player.x + PLAYER_SIZE / 2;
    const pcy = this.player.y + PLAYER_SIZE / 2;

    for (const placement of OBJECT_PLACEMENTS) {
      const dist = distanceBetween(pcx, pcy, placement.x, placement.y);
      if (dist < nearestDist && !this.isDiscovered(placement.objectId)) {
        nearestDist = dist;
        this.nearestObjectId = placement.objectId;
      }
    }

    if (this.playTimeActive) {
      this.save.playTimeMs += dt * 1000;
    }

    this.saveTimer += dt;
    if (this.saveTimer >= 10) {
      this.saveTimer = 0;
      this.save.playerX = this.player.x;
      this.save.playerY = this.player.y;
      saveGame(this.save);
    }
  }

  interact() {
    if (this.nearestObjectId && this.overlay === 'none') {
      this.startInspection(this.nearestObjectId);
    }
  }

  // Step 1: Show object info
  startInspection(objectId: string) {
    const obj = OBJECTS.find(o => o.id === objectId);
    if (!obj) return;
    this.inspectingObjectId = objectId;
    this.overlay = 'inspect';
  }

  // Step 2: After seeing info, start the challenge (2 quiz + 1 open-ended)
  startChallenge() {
    if (!this.inspectingObjectId) return;
    const obj = OBJECTS.find(o => o.id === this.inspectingObjectId);
    if (!obj) { this.closeOverlay(); return; }

    const questions = getChallengeSet(obj.module);
    if (questions.length === 0) {
      // No questions for this module - auto-collect
      this.collectObject(this.inspectingObjectId);
      this.closeOverlay();
      this.checkCompletion();
      return;
    }

    this.challenge = {
      objectId: this.inspectingObjectId,
      questions,
      currentIndex: 0,
      selectedAnswers: questions.map(() => new Set<number>()),
      writtenAnswer: '',
      results: questions.map(() => null),
      selfApproved: null,
    };

    const q = questions[0];
    this.overlay = q.type === 'quiz' ? 'question' : 'open_ended';
  }

  // Toggle selection for multi-select quiz
  toggleQuizOption(optionIndex: number) {
    if (!this.challenge) return;
    const selected = this.challenge.selectedAnswers[this.challenge.currentIndex];
    if (selected.has(optionIndex)) {
      selected.delete(optionIndex);
    } else {
      selected.add(optionIndex);
    }
  }

  // Submit quiz answer
  submitQuizAnswer() {
    if (!this.challenge) return;
    const idx = this.challenge.currentIndex;
    const q = this.challenge.questions[idx];
    if (!q || q.type !== 'quiz') return;

    const selected = this.challenge.selectedAnswers[idx];
    const selectedLabels = new Set(
      [...selected].map(i => q.options![i].label)
    );
    const correctLabels = new Set(q.correctAnswers || []);

    // Check: same set
    const correct = selectedLabels.size === correctLabels.size &&
      [...selectedLabels].every(l => correctLabels.has(l));

    this.challenge.results[idx] = correct;

    // Save attempt
    const attempt: QuizAttempt = {
      questionId: q.id,
      answer: [...selectedLabels].join(','),
      correct,
      timestamp: Date.now(),
    };
    this.save.quizAttempts.push(attempt);

    if (!correct && !this.save.reviewQueue.includes(q.id)) {
      this.save.reviewQueue.push(q.id);
    }
    if (correct) {
      this.save.reviewQueue = this.save.reviewQueue.filter(id => id !== q.id);
    }

    this.overlay = 'feedback';
    this.forceSave();
  }

  // Submit open-ended answer
  submitOpenAnswer() {
    if (!this.challenge) return;
    const idx = this.challenge.currentIndex;
    const q = this.challenge.questions[idx];
    if (!q || q.type !== 'open_ended') return;

    this.save.openEndedAnswers[q.id] = this.challenge.writtenAnswer;

    const attempt: QuizAttempt = {
      questionId: q.id,
      answer: this.challenge.writtenAnswer,
      correct: null, // pending self-approval
      timestamp: Date.now(),
    };
    this.save.quizAttempts.push(attempt);

    this.overlay = 'open_feedback'; // show model answer + self-approve
    this.forceSave();
  }

  // Self-approve open-ended answer
  selfApproveOpenEnded(approved: boolean) {
    if (!this.challenge) return;
    const idx = this.challenge.currentIndex;
    this.challenge.results[idx] = approved;
    this.challenge.selfApproved = approved;
    this.advanceChallenge();
  }

  // After quiz feedback, advance to next question
  advanceFromFeedback() {
    if (!this.challenge) return;
    this.advanceChallenge();
  }

  private advanceChallenge() {
    if (!this.challenge) return;
    this.challenge.currentIndex++;

    if (this.challenge.currentIndex >= this.challenge.questions.length) {
      // Challenge complete - check if all passed
      const allCorrect = this.challenge.results.every(r => r === true);
      if (allCorrect) {
        this.collectObject(this.challenge.objectId);
      }
      this.overlay = 'challenge_result';
      return;
    }

    // Show next question
    const q = this.challenge.questions[this.challenge.currentIndex];
    this.challenge.writtenAnswer = '';
    this.challenge.selfApproved = null;
    this.overlay = q.type === 'quiz' ? 'question' : 'open_ended';
  }

  private collectObject(objectId: string) {
    if (!this.save.discoveredObjects.includes(objectId)) {
      this.save.discoveredObjects.push(objectId);
      playDiscovery();
      this.forceSave();
    }
  }

  // Called when dismissing challenge result
  finishChallenge() {
    this.challenge = null;
    this.inspectingObjectId = null;
    this.overlay = 'none';
    this.checkCompletion();
  }

  skipChallenge() {
    this.challenge = null;
    this.inspectingObjectId = null;
    this.overlay = 'none';
  }

  closeOverlay() {
    this.overlay = 'none';
    this.challenge = null;
    this.inspectingObjectId = null;
    this.practiceMode = false;
  }

  dismissHint() {
    this.overlay = 'none';
  }

  toggleMap() {
    if (this.overlay === 'map') this.overlay = 'none';
    else if (this.overlay === 'none') this.overlay = 'map';
  }

  toggleJournal() {
    if (this.overlay === 'journal') this.overlay = 'none';
    else if (this.overlay === 'none') this.overlay = 'journal';
  }

  togglePause() {
    if (this.overlay === 'pause') {
      this.overlay = 'none';
      this.playTimeActive = true;
    } else if (this.overlay === 'none') {
      this.overlay = 'pause';
      this.playTimeActive = false;
    }
  }

  openEditor() {
    this.overlay = 'editor';
    this.playTimeActive = false;
  }

  teleportToRoom(roomId: string) {
    const room = ROOMS.find(r => r.id === roomId);
    if (!room) return;
    this.player.x = room.x + room.w / 2 - PLAYER_SIZE / 2;
    this.player.y = room.y + room.h / 2 - PLAYER_SIZE / 2;
    if (!this.isWalkable(this.player.x, this.player.y)) {
      for (const [ox, oy] of [[0, -48], [0, 48], [-48, 0], [48, 0], [-48, -48], [48, 48]]) {
        const tx = room.x + room.w / 2 + ox - PLAYER_SIZE / 2;
        const ty = room.y + room.h / 2 + oy - PLAYER_SIZE / 2;
        if (this.isWalkable(tx, ty)) {
          this.player.x = tx;
          this.player.y = ty;
          break;
        }
      }
    }
    this.overlay = 'none';
  }

  isDiscovered(objectId: string): boolean {
    return this.save.discoveredObjects.includes(objectId);
  }

  getCurrentModule(): ModuleName {
    const room = getRoomAt(this.player.x + PLAYER_SIZE / 2, this.player.y + PLAYER_SIZE / 2);
    return (room?.module as ModuleName) || 'What is Robotics?';
  }

  getModuleProgress(moduleName: ModuleName) {
    const moduleObjects = OBJECTS.filter(o => o.module === moduleName);
    const discovered = moduleObjects.filter(o => this.isDiscovered(o.id)).length;
    const total = moduleObjects.length;

    const moduleQuestions = QUESTIONS.filter(q => q.module === moduleName);
    const attempts = this.save.quizAttempts.filter(a =>
      moduleQuestions.some(q => q.id === a.questionId)
    );

    const correctIds = new Set(attempts.filter(a => a.correct === true).map(a => a.questionId));
    const incorrectIds = new Set(attempts.filter(a => a.correct === false).map(a => a.questionId));
    for (const id of correctIds) incorrectIds.delete(id);

    const reflections = new Set(attempts.filter(a => a.correct === null).map(a => a.questionId)).size;
    const reviewCount = this.save.reviewQueue.filter(id => moduleQuestions.some(q => q.id === id)).length;

    return {
      discovered,
      total,
      correctCount: correctIds.size,
      incorrectCount: incorrectIds.size,
      reflections,
      reviewCount,
      hasQuestions: moduleQuestions.length > 0,
    };
  }

  startPractice(moduleName: ModuleName | null) {
    let reviewIds: string[];
    if (moduleName) {
      const mq = QUESTIONS.filter(q => q.module === moduleName);
      reviewIds = this.save.reviewQueue.filter(id => mq.some(q => q.id === id));
    } else {
      reviewIds = [...this.save.reviewQueue];
    }
    if (reviewIds.length === 0) return;

    this.practiceMode = true;
    this.practiceQueue = reviewIds;
    this.practiceIndex = 0;
    this.loadPracticeQuestion(0);
  }

  private loadPracticeQuestion(index: number) {
    const q = getQuestionById(this.practiceQueue[index]);
    if (!q) { this.closeOverlay(); return; }

    this.challenge = {
      objectId: '',
      questions: [q],
      currentIndex: 0,
      selectedAnswers: [new Set()],
      writtenAnswer: '',
      results: [null],
      selfApproved: null,
    };
    this.overlay = q.type === 'quiz' ? 'question' : 'open_ended';
  }

  nextPracticeQuestion() {
    this.practiceIndex++;
    if (this.practiceIndex >= this.practiceQueue.length) {
      this.closeOverlay();
      return;
    }
    this.loadPracticeQuestion(this.practiceIndex);
  }

  private checkCompletion() {
    if (this.save.discoveredObjects.length >= 75) {
      this.overlay = 'completion';
    }
  }

  // ======================== FLASHCARDS ========================

  openFlashcards() {
    this.overlay = 'flashcards';
    this.flashcardMode = null; // show setup screen
    this.playTimeActive = false;
  }

  startFlashcards(difficulty: FlashcardDifficulty, module: ModuleName | null) {
    const allObjects = module ? OBJECTS.filter(o => o.module === module) : [...OBJECTS];
    // Shuffle
    const shuffled = allObjects.sort(() => Math.random() - 0.5);

    const cards: FlashcardCard[] = shuffled.map(obj => {
      // Check if object has a loaded sprite
      const hasImage = !!this._checkSprite(obj.id);
      return {
        objectId: obj.id,
        cardType: hasImage ? 'image' : 'concept',
        hasImage,
      };
    });

    if (cards.length === 0) return;

    const firstCard = cards[0];
    const firstObj = OBJECTS.find(o => o.id === firstCard.objectId)!;
    const options = this._generateOptions(firstObj, allObjects);

    this.flashcardMode = {
      difficulty,
      module,
      cards,
      currentIndex: 0,
      options,
      correctName: firstObj.name,
      typedAnswer: '',
      phase: 'question',
      score: 0,
      total: cards.length,
    };
    this.overlay = 'flashcards';
  }

  flashcardAnswer(answer: string) {
    if (!this.flashcardMode || this.flashcardMode.phase !== 'question') return;
    const correct = answer.toLowerCase().trim() === this.flashcardMode.correctName.toLowerCase().trim();
    this.flashcardMode.phase = correct ? 'correct' : 'incorrect';
    if (correct) this.flashcardMode.score++;
  }

  flashcardNext() {
    if (!this.flashcardMode) return;
    this.flashcardMode.currentIndex++;
    if (this.flashcardMode.currentIndex >= this.flashcardMode.cards.length) {
      // Finished - stay on flashcards overlay to show final score
      this.flashcardMode.phase = 'question'; // reuse for final screen
      return;
    }
    const card = this.flashcardMode.cards[this.flashcardMode.currentIndex];
    const obj = OBJECTS.find(o => o.id === card.objectId)!;
    const pool = this.flashcardMode.module
      ? OBJECTS.filter(o => o.module === this.flashcardMode!.module)
      : [...OBJECTS];
    this.flashcardMode.options = this._generateOptions(obj, pool);
    this.flashcardMode.correctName = obj.name;
    this.flashcardMode.typedAnswer = '';
    this.flashcardMode.phase = 'question';
  }

  private _generateOptions(correct: typeof OBJECTS[0], pool: typeof OBJECTS): string[] {
    const others = pool.filter(o => o.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [correct.name, ...others.map(o => o.name)];
    return options.sort(() => Math.random() - 0.5);
  }

  // Simple sprite check - access the cache from renderer
  private _checkSprite(objectId: string): boolean {
    // Check if the image element exists in DOM cache
    const img = new Image();
    img.src = `/objects/${objectId}.png`;
    // We can't synchronously check, so we rely on the preload
    // Use a simple heuristic: check if file was in our asset list
    return _spriteIds.has(objectId);
  }

  getPlayTimeFormatted(): string {
    const totalSec = Math.floor(this.save.playTimeMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  }

  forceSave() {
    this.save.playerX = this.player.x;
    this.save.playerY = this.player.y;
    saveGame(this.save);
  }
}
