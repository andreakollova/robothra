// HTML-based UI overlays

import { GameState, UIOverlay, FlashcardDifficulty } from '../engine/gameState';
import { OBJECTS, MODULE_NAMES, MODULE_COLORS, ModuleName, getObjectsByModule } from '../data/objects';
import { QUESTIONS, getQuestionById } from '../data/questions';
import { ROOMS, OBJECT_PLACEMENTS, WORLD_W, WORLD_H, TILE } from '../data/world';
import { playUIClick, playCorrect, playIncorrect, setSoundEnabled, isSoundEnabled } from '../engine/sound';
import { clearSave } from '../engine/save';
import { InputManager } from '../engine/input';
import { getSpriteForObject } from '../engine/renderer';

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
      case 'question': this.renderQuiz(); break;
      case 'feedback': this.renderQuizFeedback(); break;
      case 'open_ended': this.renderOpenEnded(); break;
      case 'open_feedback': this.renderOpenFeedback(); break;
      case 'challenge_result': this.renderChallengeResult(); break;
      case 'map': this.renderMap(); break;
      case 'journal': this.renderJournal(); break;
      case 'pause': this.renderPause(); break;
      case 'completion': this.renderCompletion(); break;
      case 'editor': this.renderEditor(); break;
      case 'flashcards': this.renderFlashcards(); break;
    }
  }

  // ======================== HINT ========================
  private renderHint() {
    const panel = this.createPanel(420);
    panel.innerHTML = `<div style="text-align:center;padding:24px">
      <div style="font-size:28px;font-weight:700;color:#263445;margin-bottom:8px">LITTLE ROBOT</div>
      <div style="font-size:14px;color:#627185;margin-bottom:20px">THE LEARNING FACTORY</div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:left;margin-bottom:16px">
        <div style="font-weight:600;color:#263445;margin-bottom:8px">Controls</div>
        <div style="font-size:13px;color:#627185;line-height:1.8">
          <b>WASD / Arrows</b> - Move<br>
          <b>Shift</b> - Run faster<br>
          <b>E</b> - Inspect nearby object<br>
          <b>M</b> - Map (click room to teleport)<br>
          <b>J</b> - Journal<br>
          <b>Esc</b> - Pause / close
        </div>
      </div>
      <div style="font-size:13px;color:#627185;margin-bottom:16px">
        Explore the factory, find objects, answer questions to collect them.
      </div>
      <button class="ui-btn primary" id="hint-dismiss">Start Exploring</button>
    </div>`;
    document.getElementById('hint-dismiss')?.addEventListener('click', () => { playUIClick(); this.state.dismissHint(); });
  }

  // ======================== INSPECT (object info) ========================
  private renderInspect() {
    const obj = OBJECTS.find(o => o.id === this.state.inspectingObjectId);
    if (!obj) return;
    const panel = this.createPanel(480);
    const color = MODULE_CIRCLE_COLORS[obj.module] || '#888';

    panel.innerHTML = `<div style="padding:24px">
      <div style="display:flex;align-items:center;gap:4px;margin-bottom:16px">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
        <span style="font-size:12px;color:#627185;font-weight:500">${obj.module}</span>
      </div>
      <div style="display:flex;justify-content:center;margin-bottom:20px">
        <div style="width:160px;height:160px;border-radius:16px;background:${color}15;display:flex;align-items:center;justify-content:center">
          ${getSpriteForObject(obj.id)
            ? `<img src="/objects/${obj.id}.png" style="width:130px;height:130px;object-fit:contain" alt="${obj.name}">`
            : `<div style="width:60px;height:60px;border-radius:50%;background:${color}"></div>`}
        </div>
      </div>
      <h2 style="font-size:18px;font-weight:700;color:#263445;margin:0 0 8px">${obj.name}</h2>
      <p style="font-size:14px;color:#627185;line-height:1.6;margin:0 0 20px">${obj.description}</p>
      <div style="font-size:12px;color:#90A4AE;margin-bottom:16px">${obj.large ? 'Large exhibit - will be scanned' : 'Small component - will be collected'}</div>
      <div style="display:flex;gap:8px">
        <button class="ui-btn primary" id="inspect-continue">Answer Questions to Collect</button>
        <button class="ui-btn secondary" id="inspect-skip">Skip</button>
      </div>
    </div>`;

    document.getElementById('inspect-continue')?.addEventListener('click', () => {
      playUIClick();
      this.state.startChallenge();
      this.update();
    });
    document.getElementById('inspect-skip')?.addEventListener('click', () => {
      playUIClick();
      this.state.skipChallenge();
      this.update();
    });
  }

  // ======================== QUIZ (multi-select) ========================
  private renderQuiz() {
    const ch = this.state.challenge;
    if (!ch) return;
    const q = ch.questions[ch.currentIndex];
    if (!q || !q.options) return;
    const obj = OBJECTS.find(o => o.id === ch.objectId);
    const color = MODULE_CIRCLE_COLORS[q.module] || '#888';
    const selected = ch.selectedAnswers[ch.currentIndex];
    const hasMultiple = (q.correctAnswers?.length || 0) > 1;
    const qNum = ch.currentIndex + 1;
    const qTotal = ch.questions.length;

    const optionsHtml = q.options.map((opt, i) => {
      const sel = selected.has(i);
      return `<button class="quiz-option ${sel ? 'selected' : ''}" data-index="${i}">
        <span class="option-label">${opt.label}.</span>
        <span>${opt.text}</span>
        ${sel ? '<span style="margin-left:auto;color:#3564D8">&#10003;</span>' : ''}
      </button>`;
    }).join('');

    const panel = this.createPanel(540);
    panel.innerHTML = `<div style="padding:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:4px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
          <span style="font-size:12px;color:#627185;font-weight:500">${q.module}</span>
        </div>
        <span style="font-size:12px;color:#90A4AE">Question ${qNum} / ${qTotal}</span>
      </div>
      <h3 style="font-size:16px;font-weight:600;color:#263445;margin:0 0 4px;line-height:1.5">${q.prompt}</h3>
      ${hasMultiple ? '<div style="font-size:12px;color:#3564D8;margin-bottom:12px">Select all correct answers</div>' : '<div style="margin-bottom:12px"></div>'}
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px" id="quiz-options">${optionsHtml}</div>
      <div style="display:flex;gap:8px">
        <button class="ui-btn primary" id="quiz-submit" ${selected.size === 0 ? 'disabled style="opacity:0.5;pointer-events:none"' : ''}>Submit</button>
        <button class="ui-btn secondary" id="quiz-skip">Skip Challenge</button>
      </div>
    </div>`;

    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset.index!);
        this.state.toggleQuizOption(idx);
        playUIClick();
        this.update();
      });
    });
    document.getElementById('quiz-submit')?.addEventListener('click', () => {
      playUIClick();
      this.state.submitQuizAnswer();
      this.update();
    });
    document.getElementById('quiz-skip')?.addEventListener('click', () => {
      playUIClick();
      this.state.skipChallenge();
      this.update();
    });
  }

  // ======================== QUIZ FEEDBACK ========================
  private renderQuizFeedback() {
    const ch = this.state.challenge;
    if (!ch) return;
    const q = ch.questions[ch.currentIndex];
    if (!q) return;
    const correct = ch.results[ch.currentIndex];
    if (correct) playCorrect(); else playIncorrect();

    const panel = this.createPanel(480);
    panel.innerHTML = `<div style="padding:24px;text-align:center">
      <div style="width:48px;height:48px;border-radius:50%;background:${correct ? '#E8F5E9' : '#FFEBEE'};display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px">
        ${correct ? '<span style="color:#4CAF50">&#10003;</span>' : '<span style="color:#F44336">&#10007;</span>'}
      </div>
      <h3 style="font-size:16px;font-weight:600;color:${correct ? '#2E7D32' : '#C62828'};margin:0 0 8px">
        ${correct ? 'Correct!' : 'Not quite right'}
      </h3>
      ${!correct && q.correctAnswers ? `<div style="font-size:13px;color:#627185;margin-bottom:8px">Correct: ${q.correctAnswers.join(', ')}</div>` : ''}
      ${q.explanation ? `<p style="font-size:14px;color:#627185;line-height:1.6;margin:0 0 20px">${q.explanation}</p>` : ''}
      <button class="ui-btn primary" id="feedback-next">Continue</button>
    </div>`;

    document.getElementById('feedback-next')?.addEventListener('click', () => {
      playUIClick();
      if (this.state.practiceMode) {
        this.state.nextPracticeQuestion();
      } else {
        this.state.advanceFromFeedback();
      }
      this.update();
    });
  }

  // ======================== OPEN-ENDED QUESTION ========================
  private renderOpenEnded() {
    const ch = this.state.challenge;
    if (!ch) return;
    const q = ch.questions[ch.currentIndex];
    if (!q) return;
    const color = MODULE_CIRCLE_COLORS[q.module] || '#888';
    const qNum = ch.currentIndex + 1;
    const qTotal = ch.questions.length;

    const panel = this.createPanel(540);
    panel.innerHTML = `<div style="padding:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:4px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
          <span style="font-size:12px;color:#627185;font-weight:500">${q.module}</span>
        </div>
        <span style="font-size:12px;color:#90A4AE">Question ${qNum} / ${qTotal}</span>
      </div>
      <h3 style="font-size:16px;font-weight:600;color:#263445;margin:0 0 16px;line-height:1.5">${q.prompt}</h3>
      <textarea id="open-answer" rows="5" style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #DCE3E8;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;outline:none" placeholder="Write your answer here...">${ch.writtenAnswer}</textarea>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="ui-btn primary" id="open-submit">Submit</button>
        <button class="ui-btn secondary" id="open-skip">Skip Challenge</button>
      </div>
      <div style="font-size:11px;color:#90A4AE;margin-top:8px">Ctrl/Cmd+Enter to submit</div>
    </div>`;

    const textarea = document.getElementById('open-answer') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      this.inputManager.setTyping(true);
      textarea.addEventListener('input', () => { ch.writtenAnswer = textarea.value; });
      textarea.addEventListener('focus', () => this.inputManager.setTyping(true));
      textarea.addEventListener('blur', () => this.inputManager.setTyping(false));
      textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          ch.writtenAnswer = textarea.value;
          this.inputManager.setTyping(false);
          this.state.submitOpenAnswer();
          this.update();
        }
      });
    }
    document.getElementById('open-submit')?.addEventListener('click', () => {
      if (textarea) ch.writtenAnswer = textarea.value;
      this.inputManager.setTyping(false);
      playUIClick();
      this.state.submitOpenAnswer();
      this.update();
    });
    document.getElementById('open-skip')?.addEventListener('click', () => {
      this.inputManager.setTyping(false);
      playUIClick();
      this.state.skipChallenge();
      this.update();
    });
  }

  // ======================== OPEN-ENDED FEEDBACK (self-approve) ========================
  private renderOpenFeedback() {
    const ch = this.state.challenge;
    if (!ch) return;
    const q = ch.questions[ch.currentIndex];
    if (!q) return;

    const panel = this.createPanel(540);
    panel.innerHTML = `<div style="padding:24px">
      <h3 style="font-size:16px;font-weight:600;color:#263445;margin:0 0 16px">Compare your answer</h3>
      <div style="background:#F8F9FA;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-size:12px;color:#90A4AE;margin-bottom:4px;font-weight:600">Your answer:</div>
        <div style="font-size:14px;color:#263445;line-height:1.5">${ch.writtenAnswer || '(no answer)'}</div>
      </div>
      <div style="background:#E3F2FD;border-radius:8px;padding:12px;margin-bottom:16px">
        <div style="font-size:12px;color:#627185;margin-bottom:4px;font-weight:600">Model answer:</div>
        <div style="font-size:14px;color:#263445;line-height:1.5">${q.modelResponse || ''}</div>
      </div>
      ${q.keywords ? `<div style="font-size:12px;color:#90A4AE;margin-bottom:16px">Key concepts: ${q.keywords.join(', ')}</div>` : ''}
      <div style="font-size:14px;color:#263445;font-weight:600;margin-bottom:12px">Does your answer match the key concepts?</div>
      <div style="display:flex;gap:8px">
        <button class="ui-btn primary" id="approve-yes" style="background:#4CAF50">Yes, it matches</button>
        <button class="ui-btn secondary" id="approve-no" style="background:#FFEBEE;color:#C62828;border:none">No, it doesn't</button>
      </div>
    </div>`;

    document.getElementById('approve-yes')?.addEventListener('click', () => {
      playCorrect();
      this.state.selfApproveOpenEnded(true);
      this.update();
    });
    document.getElementById('approve-no')?.addEventListener('click', () => {
      playIncorrect();
      this.state.selfApproveOpenEnded(false);
      this.update();
    });
  }

  // ======================== CHALLENGE RESULT ========================
  private renderChallengeResult() {
    const ch = this.state.challenge;
    if (!ch) return;
    const allCorrect = ch.results.every(r => r === true);
    const obj = OBJECTS.find(o => o.id === ch.objectId);

    const panel = this.createPanel(420);
    panel.innerHTML = `<div style="padding:24px;text-align:center">
      <div style="width:56px;height:56px;border-radius:50%;background:${allCorrect ? '#E8F5E9' : '#FFF3E0'};display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:12px">
        ${allCorrect ? '<span style="color:#4CAF50">&#10003;</span>' : '<span style="color:#FF9800">!</span>'}
      </div>
      <h3 style="font-size:18px;font-weight:700;color:#263445;margin:0 0 8px">
        ${allCorrect ? 'Object Collected!' : 'Not all answers correct'}
      </h3>
      <p style="font-size:14px;color:#627185;line-height:1.6;margin:0 0 4px">
        ${allCorrect
          ? `You answered all questions correctly and ${obj?.large ? 'scanned' : 'collected'} <b>${obj?.name || 'the object'}</b>.`
          : `You need all correct answers to collect this object. You can try again.`}
      </p>
      <div style="display:flex;gap:4px;justify-content:center;margin:12px 0 20px">
        ${ch.results.map((r, i) => `<div style="width:24px;height:24px;border-radius:50%;background:${r === true ? '#E8F5E9' : '#FFEBEE'};display:flex;align-items:center;justify-content:center;font-size:12px">
          ${r === true ? '<span style="color:#4CAF50">&#10003;</span>' : '<span style="color:#F44336">&#10007;</span>'}
        </div>`).join('')}
      </div>
      <button class="ui-btn primary" id="result-continue">Continue Exploring</button>
    </div>`;

    document.getElementById('result-continue')?.addEventListener('click', () => {
      playUIClick();
      this.state.finishChallenge();
      this.update();
    });
  }

  // ======================== MAP ========================
  private renderMap() {
    const panel = this.createPanel(700);
    const scale = Math.min(660 / WORLD_W, 400 / WORLD_H);
    const mapW = WORLD_W * scale;
    const mapH = WORLD_H * scale;

    let roomsHtml = '';
    for (const room of ROOMS) {
      if (room.id === 'hall_main') continue;
      const colors = MODULE_COLORS[room.module as ModuleName];
      const rx = room.x * scale, ry = room.y * scale, rw = room.w * scale, rh = room.h * scale;
      roomsHtml += `<div class="map-room" data-room="${room.id}" style="position:absolute;left:${rx}px;top:${ry}px;width:${rw}px;height:${rh}px;background:${colors?.floor || '#eee'};border:1px solid ${colors?.wall || '#ccc'};border-radius:3px;cursor:pointer;transition:filter 0.15s" title="${room.name} (click to teleport)"></div>`;
    }

    const hall = ROOMS.find(r => r.id === 'hall_main')!;
    if (hall) {
      roomsHtml += `<div style="position:absolute;left:${hall.x * scale}px;top:${hall.y * scale}px;width:${hall.w * scale}px;height:${hall.h * scale}px;background:#F0EDE5;border:1px solid #D8D2C8;border-radius:2px"></div>`;
    }

    let objectsHtml = '';
    for (const p of OBJECT_PLACEMENTS) {
      const obj = OBJECTS.find(o => o.id === p.objectId);
      if (!obj) continue;
      const disc = this.state.isDiscovered(obj.id);
      const color = MODULE_CIRCLE_COLORS[obj.module];
      const show = disc || this.state.save.settings.showRemainingObjects;
      if (!show) continue;
      objectsHtml += `<div style="position:absolute;left:${p.x * scale - 2}px;top:${p.y * scale - 2}px;width:4px;height:4px;border-radius:50%;background:${disc ? color : '#CCC'};opacity:${disc ? 1 : 0.5}"></div>`;
    }

    const px = (this.state.player.x + 12) * scale;
    const py = (this.state.player.y + 12) * scale;

    const RW = TILE * 12, GAP = TILE * 2, RH = TILE * 9, CH = TILE * 3;
    const zones = [
      { name: 'What is Robotics?', x: RW / 2, y: 10 },
      { name: 'Robots', x: RW * 2 + GAP + RW / 2, y: 10 },
      { name: 'Industrial Robots', x: RW / 2, y: RH * 2 + CH + 10 },
      { name: 'Applications', x: RW * 2 + GAP + RW / 2, y: RH * 2 + CH + 10 },
      { name: 'Mobile Robots', x: (RW * 2 + GAP) * 2 + RW / 2, y: RH * 2 + CH + 10 },
    ];
    let labelsHtml = zones.map(z => {
      const c = MODULE_CIRCLE_COLORS[z.name] || '#888';
      return `<div style="position:absolute;left:${z.x * scale}px;top:${z.y * scale - 12}px;font-size:9px;font-weight:600;color:${c};white-space:nowrap">${z.name}</div>`;
    }).join('');

    panel.innerHTML = `<div style="padding:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="font-size:16px;font-weight:700;color:#263445;margin:0">World Map</h2>
        <button class="ui-btn secondary" id="map-close" style="padding:4px 12px;font-size:12px">Close (M)</button>
      </div>
      <div style="position:relative;width:${mapW}px;height:${mapH}px;background:#E8E4DC;border-radius:8px;overflow:hidden;margin:0 auto">
        ${roomsHtml}${objectsHtml}${labelsHtml}
        <div style="position:absolute;left:${px - 4}px;top:${py - 4}px;width:8px;height:8px;border-radius:50%;background:#3564D8;border:2px solid #FFF;box-shadow:0 0 4px rgba(53,100,216,0.5);z-index:10"></div>
      </div>
      <div style="display:flex;gap:16px;margin-top:12px;justify-content:center;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#627185"><div style="width:8px;height:8px;border-radius:50%;background:#3564D8;border:1px solid #fff"></div> You</div>
        <label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#627185;cursor:pointer">
          <input type="checkbox" id="show-remaining" ${this.state.save.settings.showRemainingObjects ? 'checked' : ''} style="margin:0"> Show remaining
        </label>
      </div>
    </div>`;

    document.getElementById('map-close')?.addEventListener('click', () => { playUIClick(); this.state.toggleMap(); this.update(); });
    document.getElementById('show-remaining')?.addEventListener('change', (e) => {
      this.state.save.settings.showRemainingObjects = (e.target as HTMLInputElement).checked;
      this.state.forceSave();
      this.update();
    });
    document.querySelectorAll('.map-room').forEach(el => {
      el.addEventListener('click', () => {
        const roomId = (el as HTMLElement).dataset.room;
        if (roomId) { playUIClick(); this.state.teleportToRoom(roomId); this.update(); }
      });
      (el as HTMLElement).addEventListener('mouseenter', () => { (el as HTMLElement).style.filter = 'brightness(0.9)'; });
      (el as HTMLElement).addEventListener('mouseleave', () => { (el as HTMLElement).style.filter = ''; });
    });
  }

  // ======================== JOURNAL ========================
  private renderJournal() {
    const panel = this.createPanel(640);
    const activeTab = this.state.journalTab;
    const contentHtml = activeTab === 'collection' ? this.renderCollectionTab() : this.renderProgressTab();

    panel.innerHTML = `<div style="padding:20px;max-height:85vh;display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="font-size:16px;font-weight:700;color:#263445;margin:0">Journal</h2>
        <button class="ui-btn secondary" id="journal-close" style="padding:4px 12px;font-size:12px">Close (J)</button>
      </div>
      <div style="display:flex;gap:4px;margin-bottom:16px">
        <button class="tab-btn ${activeTab === 'collection' ? 'active' : ''}" id="tab-collection">Collection</button>
        <button class="tab-btn ${activeTab === 'progress' ? 'active' : ''}" id="tab-progress">Progress</button>
      </div>
      <div style="flex:1;overflow-y:auto">${contentHtml}</div>
    </div>`;

    document.getElementById('journal-close')?.addEventListener('click', () => { playUIClick(); this.state.toggleJournal(); this.update(); });
    document.getElementById('tab-collection')?.addEventListener('click', () => { playUIClick(); this.state.journalTab = 'collection'; this.update(); });
    document.getElementById('tab-progress')?.addEventListener('click', () => { playUIClick(); this.state.journalTab = 'progress'; this.update(); });
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
      html += `<div style="margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
          <span style="font-size:13px;font-weight:600;color:#263445">${moduleName}</span>
          <span style="font-size:11px;color:#90A4AE">${discovered.length} / ${objects.length}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px">`;
      for (const obj of objects) {
        const disc = this.state.isDiscovered(obj.id);
        html += `<div style="padding:8px;border-radius:8px;background:${disc ? '#F8F9FA' : '#F0F0F0'};border:1px solid ${disc ? '#DCE3E8' : '#E0E0E0'}">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            ${disc && getSpriteForObject(obj.id)
              ? `<img src="/objects/${obj.id}.png" style="width:24px;height:24px;object-fit:contain;flex-shrink:0" alt="">`
              : `<div style="width:18px;height:18px;border-radius:50%;background:${disc ? color : '#CCC'};flex-shrink:0"></div>`}
            <div style="font-size:11px;font-weight:600;color:${disc ? '#263445' : '#B0B0B0'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${disc ? obj.name : '???'}</div>
          </div>
          ${disc ? `<div style="font-size:10px;color:#627185;line-height:1.4">${obj.description.slice(0, 80)}${obj.description.length > 80 ? '...' : ''}</div>` : ''}
        </div>`;
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
      html += `<div style="margin-bottom:16px;padding:12px;border-radius:8px;background:#F8F9FA;border:1px solid #DCE3E8">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
          <span style="font-size:13px;font-weight:600;color:#263445">${moduleName}</span>
        </div>
        <div style="font-size:12px;color:#627185;margin-bottom:4px">Objects: ${progress.discovered} / ${progress.total}</div>`;
      if (progress.hasQuestions) {
        html += `<div style="font-size:12px;color:#627185;line-height:1.8">
          Correct: <span style="color:#4CAF50;font-weight:600">${progress.correctCount}</span> &middot;
          Incorrect: <span style="color:#F44336;font-weight:600">${progress.incorrectCount}</span> &middot;
          To review: <span style="color:#FF9800;font-weight:600">${progress.reviewCount}</span>
          ${progress.reflections > 0 ? `&middot; Reflections: <span style="color:#1976D2;font-weight:600">${progress.reflections}</span>` : ''}
        </div>`;
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

  // ======================== PAUSE ========================
  private renderPause() {
    const panel = this.createPanel(360);
    panel.innerHTML = `<div style="padding:24px;text-align:center">
      <h2 style="font-size:18px;font-weight:700;color:#263445;margin:0 0 4px">Paused</h2>
      <div style="font-size:12px;color:#627185;margin-bottom:20px">Playtime: ${this.state.getPlayTimeFormatted()}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="ui-btn primary" id="pause-resume">Resume</button>
        <label style="display:flex;align-items:center;gap:8px;justify-content:center;font-size:13px;color:#627185;cursor:pointer">
          <input type="checkbox" id="sound-toggle" ${isSoundEnabled() ? 'checked' : ''}> Sound effects
        </label>
        <button class="ui-btn secondary" id="pause-flashcards" style="background:#E3F2FD;color:#1976D2">Flashcards</button>
        <button class="ui-btn secondary" id="pause-editor">Content Editor</button>
        <button class="ui-btn danger" id="pause-reset">Reset Progress</button>
      </div>
    </div>`;
    document.getElementById('pause-resume')?.addEventListener('click', () => { playUIClick(); this.state.togglePause(); this.update(); });
    document.getElementById('sound-toggle')?.addEventListener('change', (e) => {
      setSoundEnabled((e.target as HTMLInputElement).checked);
      this.state.save.settings.soundEnabled = (e.target as HTMLInputElement).checked;
    });
    document.getElementById('pause-flashcards')?.addEventListener('click', () => { playUIClick(); this.state.openFlashcards(); this.update(); });
    document.getElementById('pause-editor')?.addEventListener('click', () => { playUIClick(); this.state.openEditor(); this.update(); });
    document.getElementById('pause-reset')?.addEventListener('click', () => { if (confirm('Reset all progress?')) { clearSave(); window.location.reload(); } });
  }

  // ======================== COMPLETION ========================
  private renderCompletion() {
    const panel = this.createPanel(420);
    panel.innerHTML = `<div style="padding:32px;text-align:center">
      <div style="font-size:48px;margin-bottom:16px">&#9733;</div>
      <h2 style="font-size:20px;font-weight:700;color:#263445;margin:0 0 8px">All Objects Discovered!</h2>
      <p style="font-size:14px;color:#627185;line-height:1.6;margin:0 0 8px">You found all 75 objects.</p>
      <p style="font-size:13px;color:#90A4AE;margin:0 0 20px">Playtime: ${this.state.getPlayTimeFormatted()}</p>
      <button class="ui-btn primary" id="completion-continue">Continue Exploring</button>
    </div>`;
    document.getElementById('completion-continue')?.addEventListener('click', () => { playUIClick(); this.state.closeOverlay(); this.update(); });
  }

  // ======================== EDITOR ========================
  private renderEditor() {
    const questionsJson = JSON.stringify(QUESTIONS, null, 2);
    const panel = this.createPanel(700);
    panel.innerHTML = `<div style="padding:20px;max-height:85vh;display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h2 style="font-size:16px;font-weight:700;color:#263445;margin:0">Content Editor</h2>
        <button class="ui-btn secondary" id="editor-close" style="padding:4px 12px;font-size:12px">Close</button>
      </div>
      <div style="font-size:12px;color:#627185;margin-bottom:12px">Questions per module. Edit src/data/questions.ts to add more.</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="ui-btn secondary" id="editor-export">Export JSON</button>
      </div>
      <div style="flex:1;overflow-y:auto;background:#F8F9FA;border-radius:8px;padding:12px;font-size:11px;line-height:1.6">
        ${MODULE_NAMES.map(m => {
          const qs = QUESTIONS.filter(q => q.module === m);
          const quizzes = qs.filter(q => q.type === 'quiz').length;
          const open = qs.filter(q => q.type === 'open_ended').length;
          return `<div style="margin-bottom:8px"><b>${m}</b>: ${quizzes} quizzes, ${open} open-ended</div>`;
        }).join('')}
      </div>
    </div>`;
    document.getElementById('editor-close')?.addEventListener('click', () => { playUIClick(); this.state.overlay = 'pause'; this.update(); });
    document.getElementById('editor-export')?.addEventListener('click', () => {
      const blob = new Blob([questionsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'questions.json'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ======================== FLASHCARDS ========================
  private renderFlashcards() {
    const fc = this.state.flashcardMode;

    if (!fc) {
      // Setup screen - choose difficulty and module
      this.renderFlashcardSetup();
      return;
    }

    // Check if finished
    if (fc.currentIndex >= fc.cards.length) {
      this.renderFlashcardResults();
      return;
    }

    const card = fc.cards[fc.currentIndex];
    const obj = OBJECTS.find(o => o.id === card.objectId)!;
    const color = MODULE_CIRCLE_COLORS[obj.module] || '#888';
    const panel = this.createPanel(520);

    if (fc.phase === 'question') {
      // Show the card
      let cardContent = '';
      if (card.cardType === 'image' && card.hasImage) {
        // Show image, guess the name
        cardContent = `
          <div style="display:flex;justify-content:center;margin-bottom:20px">
            <div style="width:200px;height:200px;border-radius:16px;background:#F8F9FA;display:flex;align-items:center;justify-content:center;border:2px solid #DCE3E8">
              <img src="/objects/${obj.id}.png" style="width:170px;height:170px;object-fit:contain" alt="?">
            </div>
          </div>
          <div style="font-size:14px;color:#627185;text-align:center;margin-bottom:16px">What is this component?</div>
        `;
      } else {
        // Show description, guess the name
        cardContent = `
          <div style="background:#F8F9FA;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid ${color}">
            <div style="font-size:14px;color:#263445;line-height:1.6">${obj.description}</div>
          </div>
          <div style="font-size:14px;color:#627185;text-align:center;margin-bottom:16px">What is this describing?</div>
        `;
      }

      let answerArea = '';
      if (fc.difficulty === 'choose') {
        answerArea = `<div style="display:flex;flex-direction:column;gap:8px">
          ${fc.options.map((opt, i) => `
            <button class="quiz-option fc-option" data-answer="${opt.replace(/"/g, '&quot;')}">${opt}</button>
          `).join('')}
        </div>`;
      } else {
        answerArea = `
          <input type="text" id="fc-type-input" style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #DCE3E8;border-radius:8px;font-size:16px;font-family:inherit;outline:none;text-align:center" placeholder="Type the name..." value="${fc.typedAnswer}" autocomplete="off">
          <button class="ui-btn primary" id="fc-type-submit" style="margin-top:12px">Check Answer</button>
        `;
      }

      panel.innerHTML = `<div style="padding:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:4px">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
            <span style="font-size:12px;color:#627185;font-weight:500">${obj.module}</span>
          </div>
          <div style="font-size:12px;color:#90A4AE">${fc.currentIndex + 1} / ${fc.total} &middot; Score: ${fc.score}</div>
        </div>
        ${cardContent}
        ${answerArea}
        <button class="ui-btn secondary" id="fc-quit" style="margin-top:12px;font-size:12px">Quit Flashcards</button>
      </div>`;

      // Event handlers
      document.querySelectorAll('.fc-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const answer = (btn as HTMLElement).dataset.answer!;
          playUIClick();
          this.state.flashcardAnswer(answer);
          this.update();
        });
      });

      const typeInput = document.getElementById('fc-type-input') as HTMLInputElement;
      if (typeInput) {
        typeInput.focus();
        this.inputManager.setTyping(true);
        typeInput.addEventListener('input', () => { fc.typedAnswer = typeInput.value; });
        typeInput.addEventListener('focus', () => this.inputManager.setTyping(true));
        typeInput.addEventListener('blur', () => this.inputManager.setTyping(false));
        typeInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            fc.typedAnswer = typeInput.value;
            this.inputManager.setTyping(false);
            this.state.flashcardAnswer(fc.typedAnswer);
            this.update();
          }
        });
      }
      document.getElementById('fc-type-submit')?.addEventListener('click', () => {
        if (typeInput) fc.typedAnswer = typeInput.value;
        this.inputManager.setTyping(false);
        playUIClick();
        this.state.flashcardAnswer(fc.typedAnswer);
        this.update();
      });
      document.getElementById('fc-quit')?.addEventListener('click', () => {
        this.inputManager.setTyping(false);
        playUIClick();
        this.state.flashcardMode = null;
        this.state.overlay = 'pause';
        this.update();
      });

    } else {
      // Show correct/incorrect feedback
      const isCorrect = fc.phase === 'correct';
      if (isCorrect) playCorrect(); else playIncorrect();

      panel.innerHTML = `<div style="padding:24px;text-align:center">
        <div style="width:48px;height:48px;border-radius:50%;background:${isCorrect ? '#E8F5E9' : '#FFEBEE'};display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px">
          ${isCorrect ? '<span style="color:#4CAF50">&#10003;</span>' : '<span style="color:#F44336">&#10007;</span>'}
        </div>
        <h3 style="font-size:16px;font-weight:600;color:${isCorrect ? '#2E7D32' : '#C62828'};margin:0 0 8px">${isCorrect ? 'Correct!' : 'Not quite'}</h3>
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          ${card.hasImage ? `<img src="/objects/${obj.id}.png" style="width:80px;height:80px;object-fit:contain" alt="">` : ''}
        </div>
        <div style="font-size:16px;font-weight:700;color:#263445;margin-bottom:4px">${obj.name}</div>
        <div style="font-size:13px;color:#627185;margin-bottom:20px;line-height:1.5">${obj.description}</div>
        <button class="ui-btn primary" id="fc-next">${fc.currentIndex + 1 >= fc.total ? 'See Results' : 'Next Card'}</button>
      </div>`;

      document.getElementById('fc-next')?.addEventListener('click', () => {
        playUIClick();
        this.state.flashcardNext();
        this.update();
      });
    }
  }

  private renderFlashcardSetup() {
    const panel = this.createPanel(440);
    panel.innerHTML = `<div style="padding:24px">
      <h2 style="font-size:18px;font-weight:700;color:#263445;margin:0 0 4px">Flashcards</h2>
      <p style="font-size:13px;color:#627185;margin:0 0 20px">Test your knowledge of robotics components and concepts.</p>

      <div style="font-size:13px;font-weight:600;color:#263445;margin-bottom:8px">Difficulty</div>
      <div style="display:flex;gap:8px;margin-bottom:20px">
        <button class="quiz-option fc-diff selected" data-diff="choose" style="flex:1;justify-content:center">
          <span>Choose from options</span>
        </button>
        <button class="quiz-option fc-diff" data-diff="type" style="flex:1;justify-content:center">
          <span>Type the answer</span>
        </button>
      </div>

      <div style="font-size:13px;font-weight:600;color:#263445;margin-bottom:8px">Module</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px">
        <button class="quiz-option fc-mod selected" data-mod="all">All modules (75 cards)</button>
        ${MODULE_NAMES.map(m => {
          const c = MODULE_CIRCLE_COLORS[m];
          const count = OBJECTS.filter(o => o.module === m).length;
          return `<button class="quiz-option fc-mod" data-mod="${m}">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:6px"></span>
            ${m} (${count})
          </button>`;
        }).join('')}
      </div>

      <div style="display:flex;gap:8px">
        <button class="ui-btn primary" id="fc-start">Start</button>
        <button class="ui-btn secondary" id="fc-back">Back</button>
      </div>
    </div>`;

    let selectedDiff: FlashcardDifficulty = 'choose';
    let selectedMod: string = 'all';

    document.querySelectorAll('.fc-diff').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fc-diff').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedDiff = (btn as HTMLElement).dataset.diff as FlashcardDifficulty;
        playUIClick();
      });
    });

    document.querySelectorAll('.fc-mod').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fc-mod').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedMod = (btn as HTMLElement).dataset.mod!;
        playUIClick();
      });
    });

    document.getElementById('fc-start')?.addEventListener('click', () => {
      playUIClick();
      const mod = selectedMod === 'all' ? null : selectedMod as ModuleName;
      this.state.startFlashcards(selectedDiff, mod);
      this.update();
    });

    document.getElementById('fc-back')?.addEventListener('click', () => {
      playUIClick();
      this.state.overlay = 'pause';
      this.state.playTimeActive = false;
      this.update();
    });
  }

  private renderFlashcardResults() {
    const fc = this.state.flashcardMode!;
    const pct = Math.round((fc.score / fc.total) * 100);
    const panel = this.createPanel(400);
    panel.innerHTML = `<div style="padding:32px;text-align:center">
      <div style="font-size:48px;margin-bottom:12px">${pct >= 80 ? '&#9733;' : pct >= 50 ? '&#9733;' : '&#9734;'}</div>
      <h2 style="font-size:20px;font-weight:700;color:#263445;margin:0 0 8px">Flashcards Complete</h2>
      <div style="font-size:32px;font-weight:700;color:#3564D8;margin-bottom:4px">${fc.score} / ${fc.total}</div>
      <div style="font-size:14px;color:#627185;margin-bottom:20px">${pct}% correct</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="ui-btn primary" id="fc-retry">Play Again</button>
        <button class="ui-btn secondary" id="fc-done">Back to Game</button>
      </div>
    </div>`;

    document.getElementById('fc-retry')?.addEventListener('click', () => {
      playUIClick();
      this.state.flashcardMode = null;
      this.state.openFlashcards();
      this.update();
    });
    document.getElementById('fc-done')?.addEventListener('click', () => {
      playUIClick();
      this.state.flashcardMode = null;
      this.state.closeOverlay();
      this.state.playTimeActive = true;
      this.update();
    });
  }

  private createPanel(width: number): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'ui-panel';
    panel.style.width = `${width}px`;
    panel.style.maxWidth = '95vw';
    panel.style.maxHeight = '90vh';
    this.container.appendChild(panel);
    return panel;
  }
}
