import { config } from "../config/project";

export class Input {
  // movement intent (-1..1)
  ax = 0; // A/D
  az = 0; // W/S

  // camera rotation (radians)
  yaw = 0;
  pitch = 0;
  shoot = false;
  reload = false;
  sprint = false;


  private keys = new Set<string>();
  private canvas?: HTMLCanvasElement;

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    window.addEventListener("keydown", (e) => this.keys.add(e.code));
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("keydown", (e) => {
        this.keys.add(e.code);
        if (e.code === "KeyR") this.reload = true;
    });


    canvas.addEventListener("click", () => {
      canvas.requestPointerLock();
    });

    window.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== this.canvas) return;

      const sensitivity = config.game.mouseSensitivity;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;

      const maxPitch = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });

    window.addEventListener("mousedown", (e) => {
        if (e.button === 0) this.shoot = true; // left click
    });
    window.addEventListener("mouseup", (e) => {
        if (e.button === 0) this.shoot = false;
    });
  }

  update() {
    const left = this.keys.has("KeyA") ? -1 : 0;
    const right = this.keys.has("KeyD") ? 1 : 0;
    const forward = this.keys.has("KeyW") ? 1 : 0;
    const back = this.keys.has("KeyS") ? -1 : 0;
    this.sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");


    this.ax = left + right;
    this.az = forward + back;

    // prevent faster diagonal movement
    const len = Math.hypot(this.ax, this.az);
    if (len > 1) {
    this.ax /= len;
    this.az /= len;
    }
  }
}
