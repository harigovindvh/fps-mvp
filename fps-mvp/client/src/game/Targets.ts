import * as THREE from "three";

export class Targets {
  private targets: THREE.Mesh[] = [];
  private area = 25; // spawn area size
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, count = 8) {
    this.scene = scene;
    const geom = new THREE.CapsuleGeometry(0.5, 1.0, 6, 10);
    const mat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc });

    for (let i = 0; i < count; i++) {
      const t = new THREE.Mesh(geom, mat);
      this.respawn(t);
      this.scene.add(t);
      this.targets.push(t);
    }
  }

  getAll() {
    return this.targets;
  }

  respawn(target: THREE.Mesh) {
    target.position.set(
      (Math.random() - 0.5) * this.area * 2,
      1,
      (Math.random() - 0.5) * this.area * 2
    );
  }
}
