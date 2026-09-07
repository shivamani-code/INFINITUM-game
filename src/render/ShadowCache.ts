import { Matrix4, type Object3D, type Scene } from 'three';

/** Shadow maps depend on lights and casters, not on the player's view direction. */
export class ShadowCache {
  private matrices = new WeakMap<Object3D, Matrix4>();
  private versions = new WeakMap<Object3D, number>();
  private previousSet = new Set<Object3D>();
  private currentSet = new Set<Object3D>();
  changed(scene: Scene) {
    let dirty = false;
    this.currentSet.clear();
    scene.traverseVisible(object => {
      if (!object.castShadow && !(object as any).isLight) return;
      this.currentSet.add(object);
      if (!this.previousSet.has(object)) dirty = true;
      const previous = this.matrices.get(object);
      if (!previous) { this.matrices.set(object, object.matrixWorld.clone()); dirty = true; }
      else if (!previous.equals(object.matrixWorld)) { previous.copy(object.matrixWorld); dirty = true; }
      const version = (object as any).instanceMatrix?.version ?? 0;
      if (this.versions.get(object) !== version) { this.versions.set(object, version); dirty = true; }
    });
    if (this.currentSet.size !== this.previousSet.size) dirty = true;
    const previous = this.previousSet; this.previousSet = this.currentSet; this.currentSet = previous;
    return dirty;
  }
}
