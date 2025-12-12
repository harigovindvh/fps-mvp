export class Hud {
  private ammoEl: HTMLDivElement;
  private hitMarkerEl: HTMLDivElement;
  private hitUntil = 0;

  private scoreEl: HTMLDivElement;
  private score = 0;

  constructor() {
    const crosshair = document.createElement("div");
    crosshair.className = "hud-crosshair";
    document.body.appendChild(crosshair);

    this.hitMarkerEl = document.createElement("div");
    this.hitMarkerEl.className = "hud-hitmarker";
    document.body.appendChild(this.hitMarkerEl);

    this.scoreEl = document.createElement("div");
    this.scoreEl.className = "hud-score";
    this.scoreEl.textContent = "Score: 0";
    document.body.appendChild(this.scoreEl);

    this.ammoEl = document.createElement("div");
    this.ammoEl.className = "hud-ammo";
    this.ammoEl.textContent = "Ammo: -- / --";
    document.body.appendChild(this.ammoEl);

  }

  addScore(amount = 1) {
    this.score += amount;
    this.scoreEl.textContent = `Score: ${this.score}`;
  }

  showHitMarker(now: number, durationMs = 120) {
    this.hitUntil = Math.max(this.hitUntil, now + durationMs);
  }

  update(now: number) {
    this.hitMarkerEl.classList.toggle("is-on", now < this.hitUntil);
  }

  setAmmo(mag: number, reserve: number, reloading: boolean) {
    this.ammoEl.textContent = reloading
        ? `Ammo: ${mag} / ${reserve} (Reloading...)`
        : `Ammo: ${mag} / ${reserve}`;
  }

}
