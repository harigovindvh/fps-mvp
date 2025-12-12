import http from "http";
import express from "express";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { FpsRoom } from "./rooms/FpsRoom.js";

const app = express();
const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server })
});

gameServer.define("fps", FpsRoom);

server.listen(2567, () => {
  console.log("✅ Colyseus server running on ws://localhost:2567");
});
