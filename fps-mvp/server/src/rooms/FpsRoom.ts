import { Room, type Client } from "colyseus";
import { RoomState, PlayerState } from "../schema/State.js";

type InputMsg = {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
};

export class FpsRoom extends Room<RoomState> {
  onCreate() {
    this.setState(new RoomState());

    // ✅ Make Colyseus broadcast state patches regularly
    this.setPatchRate(20); // 20 patches/sec
    this.setSimulationInterval(() => {
      // no-op loop is fine for now; it drives the room clock
    }, 1000 / 20);

    this.onMessage("input", (client, msg: InputMsg) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;

      // basic sanity clamp (MVP)
      p.x = Number.isFinite(msg.x) ? msg.x : p.x;
      p.y = 2;
      p.z = Number.isFinite(msg.z) ? msg.z : p.z;

      p.yaw = Number.isFinite(msg.yaw) ? msg.yaw : p.yaw;
      p.pitch = Number.isFinite(msg.pitch) ? msg.pitch : p.pitch;
    });
  }

  onJoin(client: Client) {
    const p = new PlayerState();
    p.id = client.sessionId;
    p.x = (Math.random() - 0.5) * 10;
    p.z = (Math.random() - 0.5) * 10;

    this.state.players.set(client.sessionId, p);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }
}
