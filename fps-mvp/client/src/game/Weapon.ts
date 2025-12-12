export type WeaponState = "ready" | "reloading";

export class Weapon {
  readonly magSize: number;
  readonly reloadMs: number;
  readonly fireRateMs: number;

  magAmmo: number;
  reserveAmmo: number;

  state: WeaponState = "ready";
  private reloadUntil = 0;

  constructor(opts: { magSize: number; reserveAmmo: number; reloadMs: number; fireRateMs: number }) {
    this.magSize = opts.magSize;
    this.reloadMs = opts.reloadMs;
    this.fireRateMs = opts.fireRateMs;

    this.magAmmo = opts.magSize;
    this.reserveAmmo = opts.reserveAmmo;
  }

  canShoot(now: number, nextShotAt: number) {
    return this.state === "ready" && this.magAmmo > 0 && now >= nextShotAt;
  }

  onShot() {
    if (this.magAmmo > 0) this.magAmmo -= 1;
  }

  startReload(now: number) {
    if (this.state === "reloading") return;
    if (this.magAmmo === this.magSize) return;   // already full
    if (this.reserveAmmo <= 0) return;           // nothing to reload

    this.state = "reloading";
    this.reloadUntil = now + this.reloadMs;
  }

  update(now: number) {
    if (this.state !== "reloading") return;
    if (now < this.reloadUntil) return;

    // finish reload
    const needed = this.magSize - this.magAmmo;
    const take = Math.min(needed, this.reserveAmmo);
    this.magAmmo += take;
    this.reserveAmmo -= take;

    this.state = "ready";
  }

  isReloading(now: number) {
    return this.state === "reloading" && now < this.reloadUntil;
  }
}
