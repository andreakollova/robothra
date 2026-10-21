// Main game loop

import { Camera } from './engine/camera';
import { InputManager } from './engine/input';
import { GameState } from './engine/gameState';
import { Renderer } from './engine/renderer';
import { HUD } from './ui/hud';
import { UIManager } from './ui/overlays';
import { WORLD_W, WORLD_H } from './data/world';
import { setSoundEnabled } from './engine/sound';

// Setup canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const overlayContainer = document.getElementById('ui-overlay') as HTMLElement;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Initialize systems
const input = new InputManager(canvas);
const state = new GameState();
const camera = new Camera(canvas.width, canvas.height, WORLD_W, WORLD_H);
const renderer = new Renderer(canvas);
const hud = new HUD(canvas);
const ui = new UIManager(overlayContainer, state, input);

// Apply saved settings
setSoundEnabled(state.save.settings.soundEnabled);

// Initial camera position
camera.snapTo(state.player.x + 12, state.player.y + 12);

// Visibility tracking for playtime
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    state.playTimeActive = false;
    state.forceSave();
  } else {
    if (state.overlay !== 'pause') {
      state.playTimeActive = true;
    }
  }
});

// Render initial UI
ui.update();

let lastTime = performance.now();
let prevOverlay = state.overlay;

function gameLoop(now: number) {
  const dt = Math.min((now - lastTime) / 1000, 0.1); // Cap at 100ms
  lastTime = now;

  // Resize camera if needed
  camera.resize(canvas.width, canvas.height);

  // Get input
  const inputState = input.getState();

  // Convert mouse to world coords
  inputState.mouseWorldX = inputState.mouseX + camera.x;
  inputState.mouseWorldY = inputState.mouseY + camera.y;

  // Handle global key shortcuts
  if (inputState.escapeJustPressed) {
    if (state.overlay === 'none') {
      state.togglePause();
    } else if (state.overlay === 'hint') {
      state.dismissHint();
    } else if (state.overlay === 'inspect' || state.overlay === 'question' || state.overlay === 'feedback') {
      if (state.overlay === 'question') {
        input.setTyping(false);
        state.skipQuestion();
      } else {
        state.closeOverlay();
      }
    } else if (state.overlay === 'editor') {
      state.overlay = 'pause';
      state.playTimeActive = false;
    } else {
      state.closeOverlay();
    }
  }

  if (inputState.mapJustPressed && (state.overlay === 'none' || state.overlay === 'map')) {
    state.toggleMap();
  }

  if (inputState.journalJustPressed && (state.overlay === 'none' || state.overlay === 'journal')) {
    state.toggleJournal();
  }

  // Interaction
  if (inputState.interactJustPressed && state.overlay === 'none') {
    state.interact();
  }

  // Enter to continue in overlays
  if (inputState.enterJustPressed) {
    if (state.overlay === 'inspect') {
      state.continueFromInspection();
    } else if (state.overlay === 'feedback') {
      if (state.practiceMode) {
        state.nextPracticeQuestion();
      } else {
        state.continueFromInspection();
      }
    } else if (state.overlay === 'hint') {
      state.dismissHint();
    }
  }

  // Quiz navigation with arrow keys and space
  if (state.overlay === 'question' && state.inspection) {
    const q = state.inspection;
    if (inputState.spaceJustPressed) {
      // Space selects current option (no-op for open ended, submit for quiz)
    }
    // Arrow keys for quiz options
    if (q.phase === 'question') {
      const obj = OBJECTS_LOOKUP[q.objectId];
      if (obj?.questionId) {
        const question = QUESTIONS_LOOKUP[obj.questionId];
        if (question?.type === 'quiz' && question.options) {
          if (inputState.up || inputState.left) {
            // We need raw key events for this, handled below
          }
        }
      }
    }
  }

  // Mouse click on objects
  if (inputState.mouseClicked && state.overlay === 'none') {
    // Check if clicking near an undiscovered object within interaction range
    const pcx = state.player.x + 12;
    const pcy = state.player.y + 12;

    for (const placement of PLACEMENTS) {
      const dist = Math.sqrt(
        (pcx - placement.x) ** 2 + (pcy - placement.y) ** 2
      );
      if (dist < 60 && !state.isDiscovered(placement.objectId)) {
        const clickDist = Math.sqrt(
          (inputState.mouseWorldX - placement.x) ** 2 +
          (inputState.mouseWorldY - placement.y) ** 2
        );
        if (clickDist < 30) {
          state.discoverObject(placement.objectId);
          break;
        }
      }
    }
  }

  // Update game state
  state.update(dt, {
    up: inputState.up,
    down: inputState.down,
    left: inputState.left,
    right: inputState.right,
  });

  // Camera follow
  camera.follow(state.player.x + 12, state.player.y + 12, dt);

  // Render
  renderer.render(camera, state, dt);
  hud.render(camera, state);

  // Update UI overlays only when overlay changes
  if (state.overlay !== prevOverlay) {
    ui.update();
    prevOverlay = state.overlay;
  }

  requestAnimationFrame(gameLoop);
}

// Quick lookup maps
import { OBJECTS } from './data/objects';
import { QUESTIONS } from './data/questions';
import { OBJECT_PLACEMENTS } from './data/world';

const OBJECTS_LOOKUP: Record<string, typeof OBJECTS[0]> = {};
for (const obj of OBJECTS) OBJECTS_LOOKUP[obj.id] = obj;

const QUESTIONS_LOOKUP: Record<string, typeof QUESTIONS[0]> = {};
for (const q of QUESTIONS) QUESTIONS_LOOKUP[q.id] = q;

const PLACEMENTS = OBJECT_PLACEMENTS;

// Arrow key navigation for quiz options
window.addEventListener('keydown', (e) => {
  if (state.overlay === 'question' && state.inspection?.phase === 'question') {
    const obj = OBJECTS_LOOKUP[state.inspection.objectId];
    if (!obj?.questionId) return;
    const question = QUESTIONS_LOOKUP[obj.questionId];
    if (!question || question.type !== 'quiz' || !question.options) return;

    const optCount = question.options.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      state.inspection.selectedAnswer = (state.inspection.selectedAnswer - 1 + optCount) % optCount;
      ui.update();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      state.inspection.selectedAnswer = (state.inspection.selectedAnswer + 1) % optCount;
      ui.update();
    } else if (e.key === ' ') {
      e.preventDefault();
      // Space confirms selection (visual only, Enter submits)
    } else if (e.key === 'Enter') {
      e.preventDefault();
      state.submitAnswer();
      ui.update();
    }
  }
});

requestAnimationFrame(gameLoop);
