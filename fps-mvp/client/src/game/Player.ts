import * as THREE from "three";
import type { Input } from "./Input";
import { config } from "../config/project";

export class Player {
  private velocity = new THREE.Vector3();
  private accel = 30; // how fast we accelerate
  private friction = 12; // how fast we slow down
  private walkSpeed = 6;
  private sprintSpeed = 9;
  private bobTime = 0;
  public bobOffset = new THREE.Vector3(); // public: read by Game

  position = new THREE.Vector3(0, 2, 5);
  yaw = 0;
  pitch = 0;

  update(input: Input, dt: number) {
    this.yaw = input.yaw;
    this.pitch = input.pitch;

    // forward/right from yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.yaw
    );
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.yaw
    );

    // desired movement direction
    const wishDir = new THREE.Vector3();
    wishDir.addScaledVector(forward, input.az);
    wishDir.addScaledVector(right, input.ax);

    if (wishDir.lengthSq() > 0) {
      wishDir.normalize();
      // accelerate
      this.velocity.addScaledVector(wishDir, this.accel * dt);
    } else {
      // apply friction when no input
      const drop = this.friction * dt;
      const speed = this.velocity.length();
      if (speed > 0) {
        const newSpeed = Math.max(speed - drop, 0);
        this.velocity.multiplyScalar(newSpeed / speed);
      }
    }

    const maxSpeed = input.sprint ? this.sprintSpeed : this.walkSpeed;

    if (this.velocity.length() > maxSpeed) {
      this.velocity.setLength(maxSpeed);
    }

    // move
    this.position.addScaledVector(this.velocity, dt);
    this.position.y = 2;

    // head bob based on speed
    const speed = this.velocity.length();
    const moving = speed > 0.05;

    if (moving) {
      this.bobTime += dt * (input.sprint ? 14 : 10); // bob frequency
    } else {
      // gently return to rest when not moving
      this.bobTime *= 0.9;
    }

    const bobAmount = moving ? (input.sprint ? 0.06 : 0.04) : 0.0;

    // y bob + tiny x sway
    this.bobOffset.set(
      Math.sin(this.bobTime) * bobAmount * 0.35,
      Math.abs(Math.cos(this.bobTime)) * bobAmount,
      0
    );
  }

  applyToCamera(camera: THREE.PerspectiveCamera) {
    camera.position.copy(this.position).add(this.bobOffset);
    camera.rotation.order = "YXZ";
    camera.rotation.y = this.yaw;
    camera.rotation.x = this.pitch;
  }
}
