import { Euler, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { Physics, RAPIER } from '../physics/Physics';
import { Input } from '../input/Input';
import type { Settings } from '../core/settings';

const Y = new Vector3(0, 1, 0);
export class PlayerMotor {
  body: RAPIER.RigidBody; collider: RAPIER.Collider; controller: RAPIER.KinematicCharacterController;
  position = new Vector3(); previous = new Vector3(); up = Y.clone(); frame = new Quaternion(); visualFrame = new Quaternion();
  velocity = new Vector3(); yaw = 0; pitch = 0; grounded = false; vertical = 0; coyote = 0; jumpBuffer = 0;
  enabled = true; distance = 0;
  private lookEuler = new Euler(); private lookRotation = new Quaternion();
  private forward = new Vector3(); private right = new Vector3(); private wish = new Vector3(); private delta = new Vector3();
  constructor(readonly physics: Physics, readonly input: Input, readonly camera: PerspectiveCamera, readonly settings: Settings) {
    this.body = physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    this.collider = physics.world.createCollider(RAPIER.ColliderDesc.capsule(.52, .3), this.body);
    this.controller = physics.world.createCharacterController(.025);
    this.controller.enableAutostep(.3, .25, false);
    this.controller.enableSnapToGround(.22);
    this.controller.setMaxSlopeClimbAngle(Math.PI / 4);
    this.controller.setMinSlopeSlideAngle(Math.PI / 3);
    this.teleport(new Vector3(0, .86, 24));
  }
  teleport(position: Vector3, up = Y, yaw = 0) {
    this.position.copy(position); this.previous.copy(position); this.up.copy(up).normalize();
    this.frame.setFromUnitVectors(Y, this.up); this.visualFrame.copy(this.frame);
    this.body.setTranslation(position, true); this.body.setNextKinematicTranslation(position);
    this.body.setRotation(this.frame, true); this.body.setNextKinematicRotation(this.frame);
    this.controller.setUp(this.up); this.velocity.set(0, 0, 0); this.vertical = 0; this.yaw = yaw; this.pitch = 0;
    this.grounded = false; this.coyote = this.jumpBuffer = 0;
  }
  setGravity(up: Vector3) {
    this.up.copy(up).normalize(); this.frame.setFromUnitVectors(Y, this.up);
    this.body.setRotation(this.frame, true); this.body.setNextKinematicRotation(this.frame);
    this.controller.setUp(this.up); this.vertical = 0; this.velocity.set(0, 0, 0);
  }
  look() {
    if (this.enabled) {
      this.yaw -= this.input.dx * .0017 * this.settings.sensitivity;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - this.input.dy * .0017 * this.settings.sensitivity * (this.settings.invertY ? -1 : 1)));
    }
    this.input.dx = this.input.dy = 0;
  }
  tick(dt: number) {
    this.previous.copy(this.position);
    if (!this.enabled) return;
    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).applyQuaternion(this.frame);
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).applyQuaternion(this.frame);
    this.wish.set(0, 0, 0);
    if (this.input.down('KeyW')) this.wish.add(this.forward);
    if (this.input.down('KeyS')) this.wish.sub(this.forward);
    if (this.input.down('KeyD')) this.wish.add(this.right);
    if (this.input.down('KeyA')) this.wish.sub(this.right);
    this.wish.addScaledVector(this.right, this.input.moveX).addScaledVector(this.forward, -this.input.moveY);
    const walking = this.wish.lengthSq() > 0;
    this.wish.normalize().multiplyScalar(this.input.down('ShiftLeft') ? 7.2 : 4.4);
    this.velocity.lerp(this.wish, 1 - Math.exp(-(walking ? 13 : 19) * dt));
    this.coyote = this.grounded ? .11 : Math.max(0, this.coyote - dt);
    this.jumpBuffer = this.input.take('Space') ? .13 : Math.max(0, this.jumpBuffer - dt);
    if (this.jumpBuffer > 0 && this.coyote > 0) { this.vertical = 6.3; this.jumpBuffer = this.coyote = 0; this.grounded = false; }
    else if (this.grounded && this.vertical <= 0) this.vertical = -.6;
    else this.vertical -= 18 * dt;
    this.delta.copy(this.velocity).addScaledVector(this.up, this.vertical).multiplyScalar(dt);
    this.controller.computeColliderMovement(this.collider, this.delta);
    const movement = this.controller.computedMovement();
    this.position.x += movement.x; this.position.y += movement.y; this.position.z += movement.z;
    this.grounded = this.controller.computedGrounded();
    if (this.grounded && this.vertical < 0) this.vertical = -.6;
    this.body.setNextKinematicTranslation(this.position);
    if (this.grounded) this.distance += this.velocity.length() * dt;
  }
  render(alpha: number, dt: number) {
    this.visualFrame.slerp(this.frame, this.settings.reducedMotion ? 1 : 1 - Math.exp(-5 * dt));
    this.syncCamera(alpha);
  }
  /** Simulation queries need the current position, without advancing visual easing. */
  syncCamera(alpha = 1) {
    this.camera.position.lerpVectors(this.previous, this.position, alpha).addScaledVector(this.up, .72);
    this.camera.quaternion.copy(this.visualFrame).multiply(this.lookRotation.setFromEuler(this.lookEuler.set(this.pitch, this.yaw, 0, 'YXZ')));
    if (this.camera.fov !== this.settings.fov) { this.camera.fov = this.settings.fov; this.camera.updateProjectionMatrix(); }
    this.camera.updateMatrixWorld();
  }
}
