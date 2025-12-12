import * as Colyseus from "colyseus.js";

export class NetClient {
  private client: Colyseus.Client;
  room: Colyseus.Room | null = null;

  constructor(serverUrl: string) {
    this.client = new Colyseus.Client(serverUrl);
  }

  async join() {
    this.room = await this.client.joinOrCreate("fps");
    return this.room;
  }

  sendInput(msg: any) {
    this.room?.send("input", msg);
  }
}
