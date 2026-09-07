import { Matrix4 } from 'three';
import type { Reflector } from 'three/addons/objects/Reflector.js';
/** Cache only stationary views. A changed view must never reuse an old projection. */
export function budgetReflection(reflector: Reflector, motion = () => 0) {
  const draw = reflector.onBeforeRender, lastCamera = new Matrix4();
  const lastProjection = new Matrix4(), lastSurface = new Matrix4();
  let last = -Infinity, stamp = -1, width = -1, height = -1;
  reflector.onBeforeRender = function(renderer,scene,camera,geometry,material,group) {
    if(scene.overrideMaterial)return;
    const now=performance.now(),next=motion(),target=reflector.getRenderTarget();
    const changed=!lastCamera.equals(camera.matrixWorld)||!lastProjection.equals(camera.projectionMatrix)
      ||!lastSurface.equals(reflector.matrixWorld)||next!==stamp
      ||width!==target.width||height!==target.height||reflector.forceUpdate;
    // Throttling a moving view freezes both the reflection image and its texture
    // projection, making the floor slide/jump independently of the player.
    if(!changed && now-last<500)return;
    draw.call(reflector,renderer,scene,camera,geometry,material,group);
    last=now;stamp=next;lastCamera.copy(camera.matrixWorld);
    lastProjection.copy(camera.projectionMatrix);lastSurface.copy(reflector.matrixWorld);
    width=target.width;height=target.height;
  };
}
