import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface DriveInput {
  throttle: boolean;
  brake: boolean;
  steer: number; // -1..1
  boost: boolean;
}

export interface DriveState {
  position: Vector3;
  yaw: number;
  speed: number; // m/s
}

export interface DriveParams {
  maxSpeed: number; // m/s
  acceleration: number;
  braking: number;
  drag: number;
  steerRate: number;
  grip: number;
}

export const DEFAULT_DRIVE: DriveParams = {
  maxSpeed: 34,
  acceleration: 11,
  braking: 16,
  drag: 0.6,
  steerRate: 1.9,
  grip: 0.92,
};

export class ArcadeController {
  state: DriveState;
  private params: DriveParams;

  constructor(params?: Partial<DriveParams>) {
    this.params = { ...DEFAULT_DRIVE, ...params };
    this.state = { position: new Vector3(0, 0, 0), yaw: 0, speed: 0 };
  }

  update(dt: number, input: DriveInput): void {
    const p = this.params;
    const s = this.state;

    if (input.throttle) {
      s.speed += p.acceleration * dt;
    }
    if (input.brake) {
      s.speed -= p.braking * dt;
    }
    s.speed -= p.drag * s.speed * dt;
    if (input.boost) {
      s.speed += p.acceleration * 0.5 * dt;
    }
    s.speed = Math.max(0, Math.min(p.maxSpeed * (input.boost ? 1.25 : 1), s.speed));

    const speedRatio = s.speed / p.maxSpeed;
    s.yaw += input.steer * p.steerRate * speedRatio * dt;

    const forward = new Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw));
    s.position.addInPlace(forward.scale(s.speed * dt));

    // lateral slip for arcade feel
    if (Math.abs(input.steer) > 0.01 && speedRatio > 0.2) {
      const right = new Vector3(Math.cos(s.yaw), 0, -Math.sin(s.yaw));
      const slip = input.steer * speedRatio * 2.2 * dt * (1 - p.grip);
      s.position.addInPlace(right.scale(slip));
    }

    // keep on the road corridor
    s.position.x = Math.max(-4.6, Math.min(4.6, s.position.x));
  }

  reset(): void {
    this.state.position = new Vector3(0, 0, 0);
    this.state.yaw = 0;
    this.state.speed = 0;
  }

  dispose(): void {
    void 0;
  }
}