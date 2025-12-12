import * as THREE from "three";
import { Input } from "./Input";
import { Player } from "./Player";
import { Targets } from "./Targets";
import type { Hud } from "../ui/Hud";
import { Weapon } from "./Weapon";
import { NetClient } from "../net/NetClient";
import { RemotePlayers } from "./RemotePlayers";

export class Game {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  private renderer = new THREE.WebGLRenderer({ antialias: true });

  private input = new Input();
  private cube!: THREE.Mesh;

  private moveSpeed = 6; // units per second
  private lastTime = performance.now();
  private player = new Player();
  private hitFlashUntil = 0;
  private baseCubeMat = new THREE.MeshStandardMaterial();
  private hitCubeMat = new THREE.MeshStandardMaterial();
  private fireRateMs = 120; // 120ms ~ 500 RPM-ish (tweak later)
  private hitmarkerUntil = 0;
  private hud: Hud;
  private raycaster = new THREE.Raycaster();
  private targets!: Targets;
  private weapon = new Weapon({
    magSize: 12,
    reserveAmmo: 60,
    reloadMs: 1200,
    fireRateMs: 120,
  });
  private nextShotAt = 0;
  private net: NetClient;
  private remotes: RemotePlayers;
  private myId: string | null = null;

  constructor(hud: Hud) {
    this.hud = hud;
    this.initRenderer();
    this.initScene();
    this.net = new NetClient("ws://localhost:2567");
    this.remotes = new RemotePlayers(this.scene);

    this.net.join().then((room) => {
      this.myId = room.sessionId;

      // Optional: expose for debugging
      (window as any).room = room;

      // Keep track of who we've seen to remove disconnected players
      let lastSeen = new Set<string>();

      room.onStateChange((state: any) => {
        const players = state.players;
        const seenNow = new Set<string>();

        players.forEach((p: any, id: string) => {
          seenNow.add(id);

          // ignore yourself
          if (id === this.myId) return;

          // always upsert (this is what makes it live)
          this.remotes.upsert(id, p.x, p.y, p.z, p.yaw, p.pitch);
        });

        // remove players that disappeared since last patch
        lastSeen.forEach((id) => {
          if (!seenNow.has(id) && id !== this.myId) {
            this.remotes.remove(id);
          }
        });

        lastSeen = seenNow;
      });
    });

    this.input.attach(this.renderer.domElement);

    window.addEventListener("resize", () => this.onResize());
    this.animate();
  }

  private initRenderer() {
    document.body.style.margin = "0";
    document.body.appendChild(this.renderer.domElement);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private initScene() {
    this.camera.position.set(0, 2, 5);
    this.camera.rotation.order = "YXZ"; // FPS-friendly rotation order

    // lights
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 10, 5);
    this.scene.add(sun);

    // floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(60, 1, 60),
      new THREE.MeshStandardMaterial()
    );
    floor.position.y = -0.5;
    this.scene.add(floor);

    this.targets = new Targets(this.scene, 8);

    // cube target
    this.baseCubeMat = new THREE.MeshStandardMaterial();
    this.hitCubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });

    this.cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      this.baseCubeMat
    );
    this.cube.position.set(0, 0.5, 0);
    this.scene.add(this.cube);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    this.input.update();

    // send input to server (authoritative sync)
    this.net.sendInput({
      x: this.player.position.x,
      y: this.player.position.y,
      z: this.player.position.z,
      yaw: this.input.yaw,
      pitch: this.input.pitch,
    });

    // update remote interpolation
    this.remotes.update();

    // reload input
    if (this.input.reload) {
      this.weapon.startReload(now);
      this.input.reload = false; // consume the press
    }

    // weapon tick (finishes reload when time ends)
    this.weapon.update(now);

    // update HUD ammo every frame (cheap + simple)
    this.hud.setAmmo(
      this.weapon.magAmmo,
      this.weapon.reserveAmmo,
      this.weapon.isReloading(now)
    );

    // update player (movement + look)
    this.player.update(this.input, dt);
    this.player.applyToCamera(this.camera);
    // shooting (simple: if holding click, it will shoot controlled frame)
    if (this.input.shoot && this.weapon.canShoot(now, this.nextShotAt)) {
      this.nextShotAt = now + this.weapon.fireRateMs;
      this.weapon.onShot();
      this.tryShoot(now);
    }

    const hitEl = document.querySelector(".hud-hitmarker");
    if (hitEl) {
      hitEl.classList.toggle("is-on", now < this.hitmarkerUntil);
    }

    // flash cube on hit
    (this.cube.material as THREE.Material) =
      now < this.hitFlashUntil ? this.hitCubeMat : this.baseCubeMat;

    this.hud.update(now);

    // render the frame
    this.renderer.render(this.scene, this.camera);
  };

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private tryShoot(now: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const hits = this.raycaster.intersectObjects(this.targets.getAll(), false);
    if (hits.length > 0) {
      const hitTarget = hits[0].object as THREE.Mesh;

      this.hud.showHitMarker(now, 120);
      this.hud.addScore(1);

      // respawn the target somewhere else
      this.targets.respawn(hitTarget);
    }
  }
}
