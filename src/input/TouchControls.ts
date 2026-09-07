import type { Input } from './Input';
export class TouchControls {
  root: HTMLDivElement;
  constructor(private input: Input) {
    this.root=document.createElement('div');this.root.id='touch-controls';this.root.hidden=true;
    this.root.innerHTML=`<div id="touch-look" aria-label="Drag to look"></div><div id="touch-move" role="group" aria-label="Movement joystick"><i></i></div><div class="touch-actions"><button data-key="KeyQ">Q · ECHO / CAPTURE</button><button data-key="KeyE">E · INTERACT</button><button data-key="Space">JUMP</button><button data-key="ShiftLeft">RUN</button><button data-key="KeyR">RESET</button></div><button id="touch-pause" aria-label="Pause game">Ⅱ</button>`;
    document.querySelector('#app')!.append(this.root);
    const move=this.root.querySelector<HTMLElement>('#touch-move')!,knob=move.querySelector<HTMLElement>('i')!;
    let moveId=-1,lookId=-1,lastX=0,lastY=0;
    const resetMove=()=>{moveId=-1;input.moveX=input.moveY=0;knob.style.transform='translate(0px,0px)';};
    const updateMove=(e:PointerEvent)=>{const r=move.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/44,y=(e.clientY-r.top-r.height/2)/44;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}input.moveX=Math.abs(x)>.12?x:0;input.moveY=Math.abs(y)>.12?y:0;knob.style.transform=`translate(${x*35}px,${y*35}px)`;};
    move.onpointerdown=e=>{if(moveId!==-1)return;moveId=e.pointerId;move.setPointerCapture(moveId);updateMove(e);};
    move.onpointermove=e=>{if(e.pointerId===moveId)updateMove(e);};
    move.onpointerup=move.onpointercancel=move.onlostpointercapture=e=>{if(e.pointerId===moveId)resetMove();};
    const look=this.root.querySelector<HTMLElement>('#touch-look')!;
    look.onpointerdown=e=>{if(lookId!==-1)return;lookId=e.pointerId;lastX=e.clientX;lastY=e.clientY;look.setPointerCapture(lookId);};
    look.onpointermove=e=>{if(e.pointerId!==lookId)return;input.dx+=(e.clientX-lastX)*2.3;input.dy+=(e.clientY-lastY)*2.3;lastX=e.clientX;lastY=e.clientY;};
    look.onpointerup=look.onpointercancel=look.onlostpointercapture=e=>{if(e.pointerId===lookId)lookId=-1;};
    this.root.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button=>{
      const key=button.dataset.key!;
      button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);input.keys.add(key);input.pressed.add(key);};
      button.onpointerup=button.onpointercancel=button.onlostpointercapture=()=>input.keys.delete(key);
    });
    this.root.querySelector<HTMLButtonElement>('#touch-pause')!.onclick=()=>input.unlock();
    input.onClearTouch=()=>{resetMove();lookId=-1;};
  }
  show(active:boolean){this.root.hidden=!active;}
}
