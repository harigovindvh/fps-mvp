import "./styles/styles.scss";
import { Game } from "./game/Game";
import { Hud } from "./ui/Hud";

const hud = new Hud();
new Game(hud);
