import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

export type CameraMode = "orbit" | "turntable";

export interface CameraShot {
  target: Vector3;
  radius: number;
  alpha: number; // horizontal angle
  beta: number; // vertical angle (0 = top, PI/2 = horizon)
  fov?: number;
}

/** Damped orbit camera for inspection (garage, booth, reveal, turntable). */
export class CinematicCamera {
  readonly camera: ArcRotateCamera;
  private current: CameraShot;
  private next: CameraShot | null = null;
  private t = 1;
  private duration = 0;
  mode: CameraMode;

  constructor(scene: Scene, _canvas: HTMLCanvasElement, shot: CameraShot, mode: CameraMode = "orbit") {
    void _canvas;
    this.current = { ...shot };
    this.mode = mode;
    this.camera = new ArcRotateCamera("vc-cam", shot.alpha, shot.beta, shot.radius, shot.target.clone(), scene, true);
    this.camera.lowerRadiusLimit = 1.2;
    this.camera.upperRadiusLimit = 9;
    this.camera.lowerBetaLimit = 0.15;
    this.camera.upperBetaLimit = Math.PI / 2 - 0.02;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 400;
    if (shot.fov) this.camera.fov = shot.fov;
    this.camera.attachControl(false);
    this.camera.wheelPrecision = 40;
    this.camera.pinchPrecision = 40;
    this.camera.panningSensibility = 0;
  }

  setActive(active: boolean): void {
    this.camera.detachControl();
    if (active) this.camera.attachControl(false);
  }

  moveTo(shot: CameraShot, duration = 1.2): void {
    this.next = { ...shot };
    this.t = 0;
    this.duration = Math.max(0.001, duration);
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  update(dt: number): void {
    if (this.next && this.t < 1) {
      this.t = Math.min(1, this.t + dt / this.duration);
      const k = this.t < 0.5 ? 2 * this.t * this.t : 1 - Math.pow(-2 * this.t + 2, 2) / 2;
      const from = this.current;
      const to = this.next;
      this.camera.target = Vector3.Lerp(from.target, to.target, k);
      this.camera.radius = from.radius + (to.radius - from.radius) * k;
      const dAlpha = to.alpha - from.alpha;
      this.camera.alpha = from.alpha + dAlpha * k;
      this.camera.beta = from.beta + (to.beta - from.beta) * k;
      if (to.fov && from.fov) this.camera.fov = from.fov + (to.fov - from.fov) * k;
      if (this.t >= 1) {
        this.current = { ...this.next };
        this.next = null;
      }
    }
  }

  dispose(): void {
    this.camera.dispose();
  }
}

/** Smooth chase camera for the street run. */
export class ChaseCamera {
  readonly camera: UniversalCamera;
  private lookTarget = new Vector3(0, 0, 0);
  private dampedPos: Vector3;

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    void canvas;
    this.camera = new UniversalCamera("vc-chase", new Vector3(0, 2, -6), scene);
    scene.activeCamera = this.camera;
    this.dampedPos = this.camera.position.clone();
    this.camera.attachControl(false);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 500;
    this.camera.fov = 0.9;
  }

  /** Position camera behind the car at yaw with smoothing; look at carTarget. */
  update(dt: number, carPos: Vector3, yaw: number, carTarget: Vector3, speedRatio: number): void {
    const distance = 5.1 - speedRatio * 0.4;
    const height = 2.0 + speedRatio * 0.1;
    const behind = new Vector3(carPos.x - Math.sin(yaw) * distance, carPos.y + height, carPos.z - Math.cos(yaw) * distance);
    const k = Math.min(1, dt * 11);
    this.dampedPos = Vector3.Lerp(this.dampedPos, behind, k);
    this.camera.position = this.dampedPos;
    this.lookTarget = Vector3.Lerp(this.lookTarget, carTarget, Math.min(1, dt * 14));
    this.camera.setTarget(this.lookTarget);
  }

  dispose(): void {
    this.camera.dispose();
  }
}

export function turntableShot(target: Vector3, yaw: number, radius = 4.6): CameraShot {
  return { target, radius, alpha: yaw, beta: Math.PI / 2 - 0.22 };
}

export function garageShot(target: Vector3): CameraShot {
  return { target, radius: 5.4, alpha: -Math.PI * 0.24, beta: Math.PI / 2 - 0.26 };
}

export function boothShot(target: Vector3): CameraShot {
  return { target, radius: 3.6, alpha: -Math.PI * 0.5, beta: Math.PI / 2 - 0.2, fov: 0.8 };
}

export function revealShot(target: Vector3): CameraShot {
  return { target, radius: 4.6, alpha: -Math.PI * 0.12, beta: Math.PI / 2 - 0.18 };
}

export function cardShot(target: Vector3): CameraShot {
  return { target, radius: 4.4, alpha: -Math.PI * 0.05, beta: Math.PI / 2 - 0.2 };
}