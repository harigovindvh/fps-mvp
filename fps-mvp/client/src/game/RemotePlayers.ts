import * as THREE from "three";

type Remote = { mesh: THREE.Mesh; targetPos: THREE.Vector3; yaw: number; pitch: number };

export class RemotePlayers {
  private map = new Map<string, Remote>();
  scene: THREE.Scene;
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  upsert(id: string, x: number, y: number, z: number, yaw: number, pitch: number) {
    let r = this.map.get(id);
    if (!r) {
      const mesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.5, 1.0, 6, 10),
        new THREE.MeshStandardMaterial({ color: 0xa3e635 })
      );
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      r = { mesh, targetPos: new THREE.Vector3(x, y, z), yaw: 0, pitch: 0 };
      this.map.set(id, r);
    }
    r.targetPos.set(x, y, z);
    r.yaw = yaw;
    r.pitch = pitch;
  }

  remove(id: string) {
    const r = this.map.get(id);
    if (!r) return;
    this.scene.remove(r.mesh);
    r.mesh.geometry.dispose();
    (r.mesh.material as THREE.Material).dispose();
    this.map.delete(id);
  }

  update() {
    for (const r of this.map.values()) {
      const t = 1 - Math.pow(0.001, 1 / 60); // stable smoothing
      r.mesh.position.lerp(r.targetPos, t);
      r.mesh.rotation.y = r.yaw;
    }
  }
}
