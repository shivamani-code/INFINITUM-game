import { TouchControls } from './TouchControls';
export class Input {
  keys = new Set<string>();
  pressed = new Set<string>();
  readonly touch = matchMedia('(pointer: coarse)').matches;
  moveX = 0; moveY = 0; onClearTouch = () => {}; private controls?: TouchControls;
  dx = 0; dy = 0;
  locked = false;
  onLockChange: (locked: boolean) => void = () => {};
  constructor(readonly canvas: HTMLCanvasElement) {
    document.body.classList.toggle('touch', this.touch);
    if (this.touch) this.controls = new TouchControls(this);
    document.addEventListener('keydown', e => {
      if (e.code === 'Escape' && this.locked) this.unlock();
      if (['Space', 'Tab', 'F3'].includes(e.code) && this.locked) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    document.addEventListener('keyup', e => this.keys.delete(e.code));
    document.addEventListener('mousemove', e => { if (this.locked) { this.dx += e.movementX; this.dy += e.movementY; } });
    canvas.addEventListener('mousedown', e => { if (this.locked && !this.touch) this.pressed.add(e.button === 2 ? 'KeyQ' : 'KeyE'); });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      if (!this.touch) this.setLocked(document.pointerLockElement === canvas);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.locked) this.unlock(); });
    window.addEventListener('blur', () => { this.clear(); if (this.locked) this.unlock(); });
  }
  private setLocked(value: boolean) { this.locked = value; this.clear(); this.controls?.show(value); this.onLockChange(value); }
  lock() { if (this.touch) { this.setLocked(true); return Promise.resolve(); } return this.canvas.requestPointerLock(); }
  unlock() { if (this.touch) this.setLocked(false); else document.exitPointerLock(); }
  take(code: string) { const had = this.pressed.has(code); this.pressed.delete(code); return had; }
  down(code: string) { return this.keys.has(code); }
  clear() { this.keys.clear(); this.pressed.clear(); this.dx = this.dy = this.moveX = this.moveY = 0; this.onClearTouch(); }
}
