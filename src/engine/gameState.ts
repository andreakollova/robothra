// Core game state management

import { OBJECTS, MODULE_NAMES, ModuleName } from '../data/objects';
import { QUESTIONS, getQuestionById, getQuestionForObject, Question } from '../data/questions';
import { OBJECT_PLACEMENTS, getAllWalls, getPlayerStart, getRoomAt, ROOMS, Wall } from '../data/world';
import { resolveCollision, distanceBetween } from './collision';
import { SaveData, loadGame, saveGame, QuizAttempt } from './save';
import { playStep, playDiscovery } from './sound';

const PLAYER_SPEED = 180; // px/sec
const PLAYER_BOOST = 360; // px/sec when holding Shift
const PLAYER_SIZE = 24;
const INTERACTION_DIST = 60;
const STEP_INTERVAL = 0.25;

export type Direction = 'up' | 'down' | 'left' | 'right';

export type UIOverlay = 'none' | 'inspect' | 'question' | 'feedback' | 'map' | 'journal' | 'pause' | 'completion' | 'editor' | 'hint';

export interface PlayerState {
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
}

export interface InspectionState {
  objectId: string;
  phase: 'info' | 'question' | 'feedback';
  selectedAnswer: number;
  writtenAnswer: string;
  feedbackCorrect: boolean | null;
}

export class GameState {
  player: PlayerState;
  walls: Wall[];
  nearestObjectId: string | null = null;
  overlay: UIOverlay = 'hint';
  inspection: InspectionState | null = null;
  save: SaveData;
  playTimeActive = true;
  private stepTimer = 0;
  private saveTimer = 0;
  private hintDismissed = false;
  journalTab: 'collection' | 'progress' = 'collection';
  journalModule: ModuleName | null = null;
  practiceMode = false;
  practiceQueue: string[] = [];
  practiceIndex = 0;

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

    // Validate position
    if (!this.isWalkable(this.player.x, this.player.y)) {
      this.player.x = start.x;
      this.player.y = start.y;
    }

    // Check completion
    if (this.save.discoveredObjects.length >= 75 && this.overlay === 'hint') {
      // Already completed, just show hint
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

    // Movement
    let dx = 0, dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    this.player.moving = dx !== 0 || dy !== 0;

    if (this.player.moving) {
      // Normalize diagonal
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

      // Direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.direction = dx > 0 ? 'right' : 'left';
      } else if (dy !== 0) {
        this.player.direction = dy > 0 ? 'down' : 'up';
      }

      // Step sound
      this.stepTimer += dt;
      if (this.stepTimer >= STEP_INTERVAL) {
        this.stepTimer = 0;
        playStep();
      }
    }

    // Find nearest interactable object
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

    // Update playtime
    if (this.playTimeActive) {
      this.save.playTimeMs += dt * 1000;
    }

    // Auto-save every 10 seconds
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
      this.discoverObject(this.nearestObjectId);
    }
  }

  discoverObject(objectId: string) {
    const obj = OBJECTS.find(o => o.id === objectId);
    if (!obj) return;

    if (!this.save.discoveredObjects.includes(objectId)) {
      this.save.discoveredObjects.push(objectId);
      playDiscovery();
    }

    this.inspection = {
      objectId,
      phase: 'info',
      selectedAnswer: 0,
      writtenAnswer: '',
      feedbackCorrect: null,
    };
    this.overlay = 'inspect';
  }

  continueFromInspection() {
    if (!this.inspection) return;

    const obj = OBJECTS.find(o => o.id === this.inspection!.objectId);
    if (!obj) { this.closeOverlay(); return; }

    const question = obj.questionId ? getQuestionById(obj.questionId) : null;

    if (this.inspection.phase === 'info') {
      if (question) {
        this.inspection.phase = 'question';
        this.overlay = 'question';
      } else {
        this.closeOverlay();
        this.checkCompletion();
      }
    } else if (this.inspection.phase === 'feedback') {
      this.closeOverlay();
      this.checkCompletion();
    }
  }

  submitAnswer() {
    if (!this.inspection || this.inspection.phase !== 'question') return;
    const obj = OBJECTS.find(o => o.id === this.inspection!.objectId);
    if (!obj || !obj.questionId) return;

    const question = getQuestionById(obj.questionId);
    if (!question) return;

    let correct: boolean | null = null;
    let answer = '';

    if (question.type === 'quiz') {
      const selected = question.options![this.inspection.selectedAnswer];
      answer = selected.label;
      correct = answer === question.correctAnswer;

      // Add to review if incorrect
      if (!correct && !this.save.reviewQueue.includes(question.id)) {
        this.save.reviewQueue.push(question.id);
      }
      // Remove from review if correct
      if (correct) {
        this.save.reviewQueue = this.save.reviewQueue.filter(id => id !== question.id);
      }
    } else {
      // Open-ended
      answer = this.inspection.writtenAnswer;
      correct = null; // Mark as reflection
      this.save.openEndedAnswers[question.id] = answer;
    }

    const attempt: QuizAttempt = {
      questionId: question.id,
      answer,
      correct,
      timestamp: Date.now(),
    };
    this.save.quizAttempts.push(attempt);

    this.inspection.phase = 'feedback';
    this.inspection.feedbackCorrect = correct;
    this.overlay = 'feedback';

    this.save.playerX = this.player.x;
    this.save.playerY = this.player.y;
    saveGame(this.save);
  }

  skipQuestion() {
    this.closeOverlay();
    this.checkCompletion();
  }

  closeOverlay() {
    this.overlay = 'none';
    this.inspection = null;
    this.practiceMode = false;
  }

  dismissHint() {
    this.hintDismissed = true;
    this.overlay = 'none';
  }

  toggleMap() {
    if (this.overlay === 'map') {
      this.overlay = 'none';
    } else if (this.overlay === 'none') {
      this.overlay = 'map';
    }
  }

  toggleJournal() {
    if (this.overlay === 'journal') {
      this.overlay = 'none';
    } else if (this.overlay === 'none') {
      this.overlay = 'journal';
    }
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
    // Place player in center of room, avoiding furniture
    this.player.x = room.x + room.w / 2 - PLAYER_SIZE / 2;
    this.player.y = room.y + room.h / 2 - PLAYER_SIZE / 2;
    // If stuck in collision, nudge
    if (!this.isWalkable(this.player.x, this.player.y)) {
      // Try offsets
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

    // Question stats
    const moduleQuestions = QUESTIONS.filter(q => q.module === moduleName);
    const attempts = this.save.quizAttempts.filter(a =>
      moduleQuestions.some(q => q.id === a.questionId)
    );

    const uniqueAttempted = new Set(attempts.map(a => a.questionId)).size;
    const correctIds = new Set(
      attempts.filter(a => a.correct === true).map(a => a.questionId)
    );
    const incorrectIds = new Set(
      attempts.filter(a => a.correct === false).map(a => a.questionId)
    );
    // Remove correct from incorrect set (they retried successfully)
    for (const id of correctIds) incorrectIds.delete(id);

    const reflections = new Set(
      attempts.filter(a => a.correct === null).map(a => a.questionId)
    ).size;

    const reviewCount = this.save.reviewQueue.filter(id =>
      moduleQuestions.some(q => q.id === id)
    ).length;

    const unanswered = moduleQuestions.filter(q => {
      const discovered = this.isDiscovered(q.objectId);
      const attempted = attempts.some(a => a.questionId === q.id);
      return discovered && !attempted;
    }).length;

    return {
      discovered,
      total,
      uniqueAttempted,
      correctCount: correctIds.size,
      incorrectCount: incorrectIds.size,
      reflections,
      reviewCount,
      unanswered,
      hasQuestions: moduleQuestions.length > 0,
    };
  }

  startPractice(moduleName: ModuleName | null) {
    let reviewIds: string[];
    if (moduleName) {
      const moduleQuestions = QUESTIONS.filter(q => q.module === moduleName);
      reviewIds = this.save.reviewQueue.filter(id =>
        moduleQuestions.some(q => q.id === id)
      );
    } else {
      reviewIds = [...this.save.reviewQueue];
    }

    if (reviewIds.length === 0) return;

    this.practiceMode = true;
    this.practiceQueue = reviewIds;
    this.practiceIndex = 0;

    const question = getQuestionById(reviewIds[0]);
    if (!question) return;

    this.inspection = {
      objectId: question.objectId,
      phase: 'question',
      selectedAnswer: 0,
      writtenAnswer: '',
      feedbackCorrect: null,
    };
    this.overlay = 'question';
  }

  nextPracticeQuestion() {
    this.practiceIndex++;
    if (this.practiceIndex >= this.practiceQueue.length) {
      this.closeOverlay();
      return;
    }

    const question = getQuestionById(this.practiceQueue[this.practiceIndex]);
    if (!question) { this.closeOverlay(); return; }

    this.inspection = {
      objectId: question.objectId,
      phase: 'question',
      selectedAnswer: 0,
      writtenAnswer: '',
      feedbackCorrect: null,
    };
    this.overlay = 'question';
  }

  private checkCompletion() {
    if (this.save.discoveredObjects.length >= 75) {
      this.overlay = 'completion';
    }
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
