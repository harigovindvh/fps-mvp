import raw from "./project.json";

export type ProjectConfig = {
  app: { name: string; version: string };
  game: { moveSpeed: number; mouseSensitivity: number; eyeHeight: number };
  network: { serverUrl: string; tickRate: number };
};

export const config = raw as ProjectConfig;
