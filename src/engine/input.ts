// Input handling - keyboard and mouse

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  interact: boolean;
  interactJustPressed: boolean;
  map: boolean;
  mapJustPressed: boolean;
  journal: boolean;
  journalJustPressed: boolean;
  escape: boolean;
  escapeJustPressed: boolean;
  enter: boolean;
  enterJustPressed: boolean;
  space: boolean;
  spaceJustPressed: boolean;
  tab: boolean;
  tabJustPressed: boolean;
  shiftTab: boolean;
  shift: boolean;
  mouseX: number;
  mouseY: number;
  mouseClicked: boolean;
  mouseWorldX: number;
  mouseWorldY: number;
}

export class InputManager {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private _mouseX = 0;
  private _mouseY = 0;
  private _mouseClicked = false;
  private _typing = false;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (this._typing && !['Escape', 'Enter'].includes(e.key)) return;

      const key = e.key;
      if (!this.keys.has(key)) {
        this.justPressed.add(key);
      }
      this.keys.add(key);

      // Prevent default for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', ' '].includes(key) && !this._typing) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('click', (e) => {
      this._mouseClicked = true;
      const rect = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    });

    // Handle focus loss
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  setTyping(typing: boolean) {
    this._typing = typing;
    if (typing) {
      this.keys.clear();
    }
  }

  getState(): InputState {
    const shift = this.keys.has('Shift');
    const state: InputState = {
      up: this.keys.has('w') || this.keys.has('W') || this.keys.has('ArrowUp'),
      down: this.keys.has('s') || this.keys.has('S') || this.keys.has('ArrowDown'),
      left: this.keys.has('a') || this.keys.has('A') || this.keys.has('ArrowLeft'),
      right: this.keys.has('d') || this.keys.has('D') || this.keys.has('ArrowRight'),
      interact: this.keys.has('e') || this.keys.has('E'),
      interactJustPressed: this.justPressed.has('e') || this.justPressed.has('E'),
      map: this.keys.has('m') || this.keys.has('M'),
      mapJustPressed: this.justPressed.has('m') || this.justPressed.has('M'),
      journal: this.keys.has('j') || this.keys.has('J'),
      journalJustPressed: this.justPressed.has('j') || this.justPressed.has('J'),
      escape: this.keys.has('Escape'),
      escapeJustPressed: this.justPressed.has('Escape'),
      enter: this.keys.has('Enter'),
      enterJustPressed: this.justPressed.has('Enter'),
      space: this.keys.has(' '),
      spaceJustPressed: this.justPressed.has(' '),
      tab: this.keys.has('Tab'),
      tabJustPressed: this.justPressed.has('Tab'),
      shiftTab: shift && this.keys.has('Tab'),
      shift,
      mouseX: this._mouseX,
      mouseY: this._mouseY,
      mouseClicked: this._mouseClicked,
      mouseWorldX: 0,
      mouseWorldY: 0,
    };

    // Clear per-frame state
    this.justPressed.clear();
    this._mouseClicked = false;

    return state;
  }
}
