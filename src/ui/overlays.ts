// HTML-based UI overlays for inspect, question, feedback, map, journal, pause, editor

import { GameState, UIOverlay } from '../engine/gameState';
import { OBJECTS, MODULE_NAMES, MODULE_COLORS, ModuleName, getObjectsByModule } from '../data/objects';
import { QUESTIONS, getQuestionById } from '../data/questions';
import { ROOMS, OBJECT_PLACEMENTS, WORLD_W, WORLD_H, TILE } from '../data/world';
import { playUIClick, playCorrect, playIncorrect, setSoundEnabled, isSoundEnabled } from '../engine/sound';
import { clearSave } from '../engine/save';
import { InputManager } from '../engine/input';

const MODULE_CIRCLE_COLORS: Record<string, string> = {
  'What is Robotics?': '#E8D44D',
  'Robots': '#9575CD',
  'Industrial Robots': '#FF8A65',
  'Mobile Robots': '#4FC3F7',
  'Applications': '#66BB6A',
};

export class UIManager {
  private container: HTMLElement;
  private state: GameState;
  private inputManager: InputManager;

  constructor(container: HTMLElement, state: GameState, inputManager: InputManager) {
    this.container = container;
    this.state = state;
    this.inputManager = inputManager;
  }

  update() {
    const overlay = this.state.overlay;
    this.container.innerHTML = '';
    this.container.style.display = overlay === 'none' ? 'none' : 'flex';

    switch (overlay) {
      case 'hint': this.renderHint(); break;
      case 'inspect': this.renderInspect(); break;
      case 'question': this.renderQuestion(); break;
      case 'feedback': this.renderFeedback(); break;
      case 'map': this.renderMap(); break;
      case 'journal': this.renderJournal(); break;
      case 'pause': this.renderPause(); break;
      case 'completion': this.renderCompletion(); break;
      case 'editor': this.renderEditor(); break;
    }
  }

  private renderHint() {
    const panel = this.createPanel(420, 'auto');
    panel.innerHTML = `
      <div style="text-align:center;padding:24px">
        <div style="font-size:28px;font-weight:700;color:#263445;margin-bottom:8px">LITTLE ROBOT</div>
        <div style="font-size:14px;color:#627185;margin-bottom:20px">THE LEARNING FACTORY</div>
        <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:left;margin-bottom:16px">
          <div style="font-weight:600;color:#263445;margin-bottom:8px">Controls</div>
          <div style="font-size:13px;color:#627185;line-height:1.8">
            <b>WASD / Arrow keys</b> - Move<br>
            <b>E</b> - Inspect nearby object<br>
            <b>M</b> - Toggle map<br>
            <b>J</b> - Toggle journal<br>
            <b>Esc</b> - Pause / close overlay
          </div>
        </div>
        <div style="font-size:13px;color:#627185;margin-bottom:16px">
          Explore the factory, discover objects, and learn about robotics.
        </div>
        <button class="ui-btn primary" id="hint-dismiss">Start Exploring</button>
      </div>
    `;
    document.getElementById('hint-dismiss')?.addEventListener('click', () => {
      playUIClick();
      this.state.dismissHint();
    });
  }

  private renderInspect() {
    if (!this.state.inspection) return;
    const obj = OBJECTS.find(o => o.id === this.state.inspection!.objectId);
    if (!obj) return;

    const panel = this.createPanel(480, 'auto');
    const color = MODULE_CIRCLE_COLORS[obj.module] || '#888';

    panel.innerHTML = `
      <div style="padding:24px">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:16px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
          <span style="font-size:12px;color:#627185;font-weight:500">${obj.module}</span>
        </div>
        <div style="display:flex;justify-content:center;margin-bottom:20px">
          <div style="width:120px;height:120px;border-radius:16px;background:${color}20;display:flex;align-items:center;justify-content:center">
            <div style="width:60px;height:60px;border-radius:50%;background:${color}"></div>
          </div>
        </div>
        <h2 style="font-size:18px;font-weight:700;color:#263445;margin:0 0 8px">${obj.name}</h2>
        <p style="font-size:14px;color:#627185;line-height:1.6;margin:0 0 20px">${obj.description}</p>
        ${obj.large ? '<div style="font-size:12px;color:#90A4AE;margin-bottom:12px">Scanned in place</div>' : '<div style="font-size:12px;color:#90A4AE;margin-bottom:12px">Collected</div>'}
        <button class="ui-btn primary" id="inspect-continue">Continue</button>
      </div>
    `;

    document.getElementById('inspect-continue')?.addEventListener('click', () => {
      playUIClick();
      this.state.continueFromInspection();
      this.update();
    });
  }

  private renderQuestion() {
    if (!this.state.inspection) return;
    const obj = OBJECTS.find(o => o.id === this.state.inspection!.objectId);
    if (!obj || !obj.questionId) return;

    const question = getQuestionById(obj.questionId);
    if (!question) return;

    const panel = this.createPanel(520, 'auto');
    const color = MODULE_CIRCLE_COLORS[obj.module] || '#888';

    if (question.type === 'quiz') {
      const optionsHtml = question.options!.map((opt, i) => {
        const selected = i === this.state.inspection!.selectedAnswer;
        return `<button class="quiz-option ${selected ? 'selected' : ''}" data-index="${i}">
          <span class="option-label">${opt.label}.</span>
          <span>${opt.text}</span>
        </button>`;
      }).join('');

      panel.innerHTML = `
        <div style="padding:24px">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:16px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
            <span style="font-size:12px;color:#627185;font-weight:500">${obj.module}</span>
          </div>
          <h3 style="font-size:16px;font-weight:600;color:#263445;margin:0 0 16px;line-height:1.5">${question.prompt}</h3>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px" id="quiz-options">
            ${optionsHtml}
          </div>
          <div style="display:flex;gap:8px">
            <button class="ui-btn primary" id="quiz-submit">Submit Answer</button>
            <button class="ui-btn secondary" id="quiz-skip">Skip</button>
          </div>
          <div style="font-size:11px;color:#90A4AE;margin-top:12px">Arrow keys to navigate, Space to select, Enter to submit</div>
        </div>
      `;

      // Option click handlers
      document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt((btn as HTMLElement).dataset.index!);
          this.state.inspection!.selectedAnswer = idx;
          playUIClick();
          this.update();
        });
      });

      document.getElementById('quiz-submit')?.addEventListener('click', () => {
        playUIClick();
        this.state.submitAnswer();
        this.update();
      });

      document.getElementById('quiz-skip')?.addEventListener('click', () => {
        playUIClick();
        this.state.skipQuestion();
        this.update();
      });

    } else {
      // Open-ended
      panel.innerHTML = `
        <div style="padding:24px">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:16px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
            <span style="font-size:12px;color:#627185;font-weight:500">${obj.module}</span>
          </div>
          <h3 style="font-size:16px;font-weight:600;color:#263445;margin:0 0 16px;line-height:1.5">${question.prompt}</h3>
          <textarea id="open-answer" rows="4" style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #DCE3E8;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;outline:none;transition:border-color 0.2s" placeholder="Write your answer here...">${this.state.inspection!.writtenAnswer}</textarea>
          <div style="display:flex;gap:8px;margin-top:16px">
            <button class="ui-btn primary" id="open-submit">Submit Reflection</button>
            <button class="ui-btn secondary" id="open-skip">Skip</button>
          </div>
          <div style="font-size:11px;color:#90A4AE;margin-top:12px">Ctrl/Cmd+Enter to submit</div>
        </div>
      `;

      const textarea = document.getElementById('open-answer') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        this.inputManager.setTyping(true);

        textarea.addEventListener('input', () => {
          this.state.inspection!.writtenAnswer = textarea.value;
        });

        textarea.addEventListener('focus', () => this.inputManager.setTyping(true));
        textarea.addEventListener('blur', () => this.inputManager.setTyping(false));

        textarea.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.state.inspection!.writtenAnswer = textarea.value;
            this.inputManager.setTyping(false);
            this.state.submitAnswer();
            this.update();
          }
        });
      }

      document.getElementById('open-submit')?.addEventListener('click', () => {
        const ta = document.getElementById('open-answer') as HTMLTextAreaElement;
        if (ta) this.state.inspection!.writtenAnswer = ta.value;
        this.inputManager.setTyping(false);
        playUIClick();
        this.state.submitAnswer();
        this.update();
      });

      document.getElementById('open-skip')?.addEventListener('click', () => {
        this.inputManager.setTyping(false);
        playUIClick();
        this.state.skipQuestion();
        this.update();
      });
    }
  }

  private renderFeedback() {
    if (!this.state.inspection) return;
    const obj = OBJECTS.find(o => o.id === this.state.inspection!.objectId);
    if (!obj || !obj.questionId) return;

    const question = getQuestionById(obj.questionId);
    if (!question) return;

    const panel = this.createPanel(480, 'auto');
    const correct = this.state.inspection.feedbackCorrect;

    if (question.type === 'quiz') {
      const isCorrect = correct === true;
      if (isCorrect) playCorrect(); else playIncorrect();

      panel.innerHTML = `
        <div style="padding:24px">
          <div style="text-align:center;margin-bottom:16px">
            <div style="width:48px;height:48px;border-radius:50%;background:${isCorrect ? '#E8F5E9' : '#FFEBEE'};display:inline-flex;align-items:center;justify-content:center;font-size:24px">
              ${isCorrect ? '<span style="color:#4CAF50">\u2713</span>' : '<span style="color:#F44336">\u2717</span>'}
            </div>
          </div>
          <h3 style="font-size:16px;font-weight:600;color:${isCorrect ? '#2E7D32' : '#C62828'};margin:0 0 8px;text-align:center">
            ${isCorrect ? 'Correct!' : 'Not quite right'}
          </h3>
          ${question.explanation ? `<p style="font-size:14px;color:#627185;line-height:1.6;margin:0 0 20px;text-align:center">${question.explanation}</p>` : ''}
          <button class="ui-btn primary" id="feedback-continue">Continue Exploring</button>
        </div>
      `;
    } else {
      // Open-ended feedback
      panel.innerHTML = `
        <div style="padding:24px">
          <div style="text-align:center;margin-bottom:16px">
            <div style="width:48px;height:48px;border-radius:50%;background:#E3F2FD;display:inline-flex;align-items:center;justify-content:center;font-size:24px">
              <span style="color:#1976D2">\u270E</span>
            </div>
          </div>
          <h3 style="font-size:16px;font-weight:600;color:#263445;margin:0 0 8px;text-align:center">Reflection Recorded</h3>
          <div style="background:#F8F9FA;border-radius:8px;padding:12px;margin-bottom:16px">
            <div style="font-size:12px;color:#90A4AE;margin-bottom:4px">Your answer:</div>
            <div style="font-size:14px;color:#263445;line-height:1.5">${this.state.inspection.writtenAnswer || '(no answer)'}</div>
          </div>
          ${question.modelResponse ? `
          <div style="background:#E3F2FD;border-radius:8px;padding:12px;margin-bottom:16px">
            <div style="font-size:12px;color:#627185;margin-bottom:4px">Model answer for comparison:</div>
            <div style="font-size:14px;color:#263445;line-height:1.5">${question.modelResponse}</div>
          </div>` : ''}
          <button class="ui-btn primary" id="feedback-continue">Continue Exploring</button>
        </div>
      `;
    }

    document.getElementById('feedback-continue')?.addEventListener('click', () => {
      playUIClick();
      if (this.state.practiceMode) {
        this.state.nextPracticeQuestion();
      } else {
        this.state.continueFromInspection();
      }
      this.update();
    });
  }

  private renderMap() {
    const panel = this.createPanel(700, 520);
    const scale = Math.min(660 / WORLD_W, 400 / WORLD_H);
    const mapW = WORLD_W * scale;
    const mapH = WORLD_H * scale;

    let roomsHtml = '';
    for (const room of ROOMS) {
      if (room.id === 'hall_main') continue;
      const colors = MODULE_COLORS[room.module as ModuleName];
      const rx = room.x * scale;
      const ry = room.y * scale;
      const rw = room.w * scale;
      const rh = room.h * scale;
      roomsHtml += `<div style="position:absolute;left:${rx}px;top:${ry}px;width:${rw}px;height:${rh}px;background:${colors?.floor || '#eee'};border:1px solid ${colors?.wall || '#ccc'};border-radius:3px" title="${room.name}"></div>`;
    }

    // Hall
    const hall = ROOMS.find(r => r.id === 'hall_main')!;
    if (hall) {
      roomsHtml += `<div style="position:absolute;left:${hall.x * scale}px;top:${hall.y * scale}px;width:${hall.w * scale}px;height:${hall.h * scale}px;background:#F0EDE5;border:1px solid #D8D2C8;border-radius:2px"></div>`;
    }

    // Objects on map
    let objectsHtml = '';
    for (const p of OBJECT_PLACEMENTS) {
      const obj = OBJECTS.find(o => o.id === p.objectId);
      if (!obj) continue;
      const disc = this.state.isDiscovered(obj.id);
      const color = MODULE_CIRCLE_COLORS[obj.module];
      const show = disc || this.state.save.settings.showRemainingObjects;
      if (!show && !disc) continue;
      objectsHtml += `<div style="position:absolute;left:${p.x * scale - 2}px;top:${p.y * scale - 2}px;width:4px;height:4px;border-radius:50%;background:${disc ? color : '#CCC'};opacity:${disc ? 1 : 0.5}"></div>`;
    }

    // Player
    const px = (this.state.player.x + 12) * scale;
    const py = (this.state.player.y + 12) * scale;
    const playerHtml = `<div style="position:absolute;left:${px - 4}px;top:${py - 4}px;width:8px;height:8px;border-radius:50%;background:#3564D8;border:2px solid #FFFFFF;box-shadow:0 0 4px rgba(53,100,216,0.5);z-index:10"></div>`;

    // Zone labels
    // Zone labels - use actual room positions from ROOMS
    const RW = TILE * 12;
    const GAP = TILE * 2;
    const RH = TILE * 9;
    const CH = TILE * 3;
    const zones = [
      { name: 'What is Robotics?', x: RW / 2, y: 10 },
      { name: 'Robots', x: RW * 2 + GAP + RW / 2, y: 10 },
      { name: 'Industrial Robots', x: RW / 2, y: RH * 2 + CH + 10 },
      { name: 'Applications', x: RW * 2 + GAP + RW / 2, y: RH * 2 + CH + 10 },
      { name: 'Mobile Robots', x: (RW * 2 + GAP) * 2 + RW / 2, y: RH * 2 + CH + 10 },
    ];
    let labelsHtml = '';
    for (const z of zones) {
      const color = MODULE_CIRCLE_COLORS[z.name] || '#888';
      labelsHtml += `<div style="position:absolute;left:${z.x * scale}px;top:${z.y * scale - 12}px;font-size:9px;font-weight:600;color:${color};white-space:nowrap">${z.name}</div>`;
    }

    panel.innerHTML = `
      <div style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 style="font-size:16px;font-weight:700;color:#263445;margin:0">World Map</h2>
          <button class="ui-btn secondary" id="map-close" style="padding:4px 12px;font-size:12px">Close (M)</button>
        </div>
        <div style="position:relative;width:${mapW}px;height:${mapH}px;background:#E8E4DC;border-radius:8px;overflow:hidden;margin:0 auto">
          ${roomsHtml}
          ${objectsHtml}
          ${playerHtml}
          ${labelsHtml}
        </div>
        <div style="display:flex;gap:16px;margin-top:12px;justify-content:center;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#627185">
            <div style="width:8px;height:8px;border-radius:50%;background:#3564D8;border:1px solid #fff"></div> You
          </div>
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#627185">
            <div style="width:6px;height:6px;border-radius:50%;background:#66BB6A"></div> Discovered
          </div>
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#627185">
            <div style="width:6px;height:6px;border-radius:50%;background:#CCC"></div> Remaining
          </div>
          <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#627185;cursor:pointer">
            <input type="checkbox" id="show-remaining" ${this.state.save.settings.showRemainingObjects ? 'checked' : ''} style="margin:0">
            Show remaining
          </label>
        </div>
      </div>
    `;

    document.getElementById('map-close')?.addEventListener('click', () => {
      playUIClick();
      this.state.toggleMap();
      this.update();
    });

    document.getElementById('show-remaining')?.addEventListener('change', (e) => {
      this.state.save.settings.showRemainingObjects = (e.target as HTMLInputElement).checked;
      this.state.forceSave();
      this.update();
    });
  }

  private renderJournal() {
    const panel = this.createPanel(640, 520);
    const activeTab = this.state.journalTab;

    let contentHtml = '';

    if (activeTab === 'collection') {
      contentHtml = this.renderCollectionTab();
    } else {
      contentHtml = this.renderProgressTab();
    }

    panel.innerHTML = `
      <div style="padding:20px;height:100%;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 style="font-size:16px;font-weight:700;color:#263445;margin:0">Journal</h2>
          <button class="ui-btn secondary" id="journal-close" style="padding:4px 12px;font-size:12px">Close (J)</button>
        </div>
        <div style="display:flex;gap:4px;margin-bottom:16px">
          <button class="tab-btn ${activeTab === 'collection' ? 'active' : ''}" id="tab-collection">Collection</button>
          <button class="tab-btn ${activeTab === 'progress' ? 'active' : ''}" id="tab-progress">Progress</button>
        </div>
        <div style="flex:1;overflow-y:auto">${contentHtml}</div>
      </div>
    `;

    document.getElementById('journal-close')?.addEventListener('click', () => {
      playUIClick();
      this.state.toggleJournal();
      this.update();
    });

    document.getElementById('tab-collection')?.addEventListener('click', () => {
      playUIClick();
      this.state.journalTab = 'collection';
      this.update();
    });

    document.getElementById('tab-progress')?.addEventListener('click', () => {
      playUIClick();
      this.state.journalTab = 'progress';
      this.update();
    });

    // Practice buttons
    document.querySelectorAll('.practice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playUIClick();
        const mod = (btn as HTMLElement).dataset.module;
        this.state.startPractice(mod === 'all' ? null : mod as ModuleName);
        this.update();
      });
    });
  }

  private renderCollectionTab(): string {
    let html = '';
    for (const moduleName of MODULE_NAMES) {
      const objects = getObjectsByModule(moduleName);
      const color = MODULE_CIRCLE_COLORS[moduleName];
      const discovered = objects.filter(o => this.state.isDiscovered(o.id));

      html += `
        <div style="margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
            <span style="font-size:13px;font-weight:600;color:#263445">${moduleName}</span>
            <span style="font-size:11px;color:#90A4AE">${discovered.length} / ${objects.length}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px">
      `;

      for (const obj of objects) {
        const disc = this.state.isDiscovered(obj.id);
        html += `
          <div style="padding:8px;border-radius:8px;background:${disc ? '#F8F9FA' : '#F0F0F0'};border:1px solid ${disc ? '#DCE3E8' : '#E0E0E0'}">
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
              <div style="width:16px;height:16px;border-radius:50%;background:${disc ? color : '#CCC'};flex-shrink:0"></div>
              <div style="font-size:11px;font-weight:600;color:${disc ? '#263445' : '#B0B0B0'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${disc ? obj.name : '???'}</div>
            </div>
            ${disc ? `<div style="font-size:10px;color:#627185;line-height:1.4">${obj.description.slice(0, 80)}${obj.description.length > 80 ? '...' : ''}</div>` : ''}
          </div>
        `;
      }

      html += '</div></div>';
    }
    return html;
  }

  private renderProgressTab(): string {
    let html = '';
    const totalReview = this.state.save.reviewQueue.length;

    if (totalReview > 0) {
      html += `<div style="margin-bottom:16px"><button class="ui-btn primary practice-btn" data-module="all" style="font-size:13px;padding:8px 16px">Practice all mistakes (${totalReview})</button></div>`;
    }

    for (const moduleName of MODULE_NAMES) {
      const progress = this.state.getModuleProgress(moduleName);
      const color = MODULE_CIRCLE_COLORS[moduleName];

      html += `
        <div style="margin-bottom:16px;padding:12px;border-radius:8px;background:#F8F9FA;border:1px solid #DCE3E8">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
            <span style="font-size:13px;font-weight:600;color:#263445">${moduleName}</span>
          </div>
          <div style="font-size:12px;color:#627185;margin-bottom:4px">
            Objects: ${progress.discovered} / ${progress.total}
          </div>
      `;

      if (progress.hasQuestions) {
        html += `
          <div style="font-size:12px;color:#627185;line-height:1.8">
            Correct: <span style="color:#4CAF50;font-weight:600">${progress.correctCount}</span> &middot;
            Incorrect: <span style="color:#F44336;font-weight:600">${progress.incorrectCount}</span> &middot;
            To review: <span style="color:#FF9800;font-weight:600">${progress.reviewCount}</span>
            ${progress.reflections > 0 ? `&middot; Reflections: <span style="color:#1976D2;font-weight:600">${progress.reflections}</span>` : ''}
            ${progress.unanswered > 0 ? `&middot; Unanswered: <span style="color:#90A4AE;font-weight:600">${progress.unanswered}</span>` : ''}
          </div>
        `;
        if (progress.reviewCount > 0) {
          html += `<button class="ui-btn secondary practice-btn" data-module="${moduleName}" style="font-size:11px;padding:4px 12px;margin-top:8px">Practice mistakes (${progress.reviewCount})</button>`;
        }
      } else {
        html += `<div style="font-size:12px;color:#90A4AE;font-style:italic">No quiz questions added yet</div>`;
      }

      html += '</div>';
    }
    return html;
  }

  private renderPause() {
    const panel = this.createPanel(360, 'auto');
    panel.innerHTML = `
      <div style="padding:24px;text-align:center">
        <h2 style="font-size:18px;font-weight:700;color:#263445;margin:0 0 4px">Paused</h2>
        <div style="font-size:12px;color:#627185;margin-bottom:20px">Playtime: ${this.state.getPlayTimeFormatted()}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="ui-btn primary" id="pause-resume">Resume</button>
          <label style="display:flex;align-items:center;gap:8px;justify-content:center;font-size:13px;color:#627185;cursor:pointer">
            <input type="checkbox" id="sound-toggle" ${isSoundEnabled() ? 'checked' : ''}>
            Sound effects
          </label>
          <button class="ui-btn secondary" id="pause-editor">Content Editor</button>
          <button class="ui-btn danger" id="pause-reset">Reset Progress</button>
        </div>
      </div>
    `;

    document.getElementById('pause-resume')?.addEventListener('click', () => {
      playUIClick();
      this.state.togglePause();
      this.update();
    });

    document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
      setSoundEnabled((e.target as HTMLInputElement).checked);
      this.state.save.settings.soundEnabled = (e.target as HTMLInputElement).checked;
    });

    document.getElementById('pause-editor')?.addEventListener('click', () => {
      playUIClick();
      this.state.openEditor();
      this.update();
    });

    document.getElementById('pause-reset')?.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        clearSave();
        window.location.reload();
      }
    });
  }

  private renderCompletion() {
    const panel = this.createPanel(420, 'auto');
    panel.innerHTML = `
      <div style="padding:32px;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">\u2605</div>
        <h2 style="font-size:20px;font-weight:700;color:#263445;margin:0 0 8px">All Objects Discovered!</h2>
        <p style="font-size:14px;color:#627185;line-height:1.6;margin:0 0 8px">
          You have found all 75 objects across the factory.
        </p>
        <p style="font-size:13px;color:#90A4AE;margin:0 0 20px">
          Playtime: ${this.state.getPlayTimeFormatted()}
        </p>
        <button class="ui-btn primary" id="completion-continue">Continue Exploring</button>
      </div>
    `;

    document.getElementById('completion-continue')?.addEventListener('click', () => {
      playUIClick();
      this.state.closeOverlay();
      this.update();
    });
  }

  private renderEditor() {
    const panel = this.createPanel(700, 520);
    const questionsJson = JSON.stringify(QUESTIONS, null, 2);

    panel.innerHTML = `
      <div style="padding:20px;height:100%;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 style="font-size:16px;font-weight:700;color:#263445;margin:0">Content Editor</h2>
          <button class="ui-btn secondary" id="editor-close" style="padding:4px 12px;font-size:12px">Close</button>
        </div>
        <div style="font-size:12px;color:#627185;margin-bottom:12px">
          View and export question data. To add questions, edit <code>src/data/questions.ts</code> and rebuild.
        </div>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button class="ui-btn secondary" id="editor-export">Export JSON</button>
          <button class="ui-btn secondary" id="editor-import">Import JSON</button>
        </div>
        <div style="font-size:12px;color:#90A4AE;margin-bottom:8px">Objects available for question assignment:</div>
        <div style="flex:1;overflow-y:auto;background:#F8F9FA;border-radius:8px;padding:12px;font-size:11px;line-height:1.6">
          ${OBJECTS.map(o => {
            const hasQ = QUESTIONS.some(q => q.objectId === o.id);
            return `<div style="color:${hasQ ? '#4CAF50' : '#627185'}"><b>${o.id}</b>: ${o.name} (${o.module})${hasQ ? ' \u2713' : ''}</div>`;
          }).join('')}
        </div>
        <textarea id="editor-json" style="display:none">${questionsJson}</textarea>
      </div>
    `;

    document.getElementById('editor-close')?.addEventListener('click', () => {
      playUIClick();
      this.state.overlay = 'pause';
      this.state.playTimeActive = false;
      this.update();
    });

    document.getElementById('editor-export')?.addEventListener('click', () => {
      const blob = new Blob([questionsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('editor-import')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result as string);
            alert(`Parsed ${data.length} questions. To apply, update src/data/questions.ts and rebuild.`);
          } catch {
            alert('Invalid JSON file');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  private createPanel(width: number, height: number | 'auto'): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.style.width = `${width}px`;
    panel.style.maxWidth = '95vw';
    if (height !== 'auto') {
      panel.style.height = `${height}px`;
      panel.style.maxHeight = '90vh';
    } else {
      panel.style.maxHeight = '90vh';
    }
    this.container.appendChild(panel);
    return panel;
  }
}
