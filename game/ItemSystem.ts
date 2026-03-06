import type { MosquitoEntity, MosquitoId } from './MosquitoSpawner';

export type ItemKey = 'electricRacket' | 'mosquitoCoil' | 'bugSpray';

export interface ItemState {
  electricRacketActiveUntilMs: number | null;
}

export interface ItemSystemConfig {
  /**
   * Electric Racket duration (active time).
   * Default: 4000ms.
   */
  electricDurationMs?: number;
  /**
   * Electric Racket hit damage when active.
   * Default: 9999.
   */
  electricDamage?: number;
  /**
   * Mosquito Coil kills random N mosquitoes.
   * Default: 5.
   */
  coilKillCount?: number;
  /**
   * Inject RNG for deterministic coil selection.
   */
  rng?: () => number;
}

export interface ItemUseResult {
  killedIds: MosquitoId[];
  remaining: MosquitoEntity[];
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export class ItemSystem {
  private readonly electricDurationMs: number;
  private readonly electricDamage: number;
  private readonly coilKillCount: number;
  private readonly rng: () => number;
  private state: ItemState = { electricRacketActiveUntilMs: null };

  constructor(config: ItemSystemConfig = {}) {
    this.electricDurationMs = config.electricDurationMs ?? 4000;
    this.electricDamage = config.electricDamage ?? 9999;
    this.coilKillCount = config.coilKillCount ?? 5;
    this.rng = config.rng ?? Math.random;
  }

  getState(): ItemState {
    return { ...this.state };
  }

  /**
   * Call periodically (e.g. engine tick) to expire temporary effects.
   */
  tick(nowMs: number): void {
    if (this.state.electricRacketActiveUntilMs != null && nowMs >= this.state.electricRacketActiveUntilMs) {
      this.state = { ...this.state, electricRacketActiveUntilMs: null };
    }
  }

  activateElectricRacket(nowMs: number): void {
    this.state = { ...this.state, electricRacketActiveUntilMs: nowMs + this.electricDurationMs };
  }

  isElectricRacketActive(nowMs: number): boolean {
    return this.state.electricRacketActiveUntilMs != null && nowMs < this.state.electricRacketActiveUntilMs;
  }

  /**
   * Returns damage to apply for a tap/hit.
   */
  getHitDamage(baseDamage: number, nowMs: number): number {
    if (this.isElectricRacketActive(nowMs)) return this.electricDamage;
    return Math.max(0, Math.floor(baseDamage));
  }

  useMosquitoCoil(mosquitoes: MosquitoEntity[]): ItemUseResult {
    if (mosquitoes.length === 0) return { killedIds: [], remaining: mosquitoes };
    const ids = mosquitoes.map((m) => m.id);
    shuffleInPlace(ids, this.rng);
    const killedSet = new Set(ids.slice(0, Math.min(this.coilKillCount, ids.length)));
    const killedIds = mosquitoes.filter((m) => killedSet.has(m.id)).map((m) => m.id);
    const remaining = mosquitoes.filter((m) => !killedSet.has(m.id));
    return { killedIds, remaining };
  }

  useBugSpray(mosquitoes: MosquitoEntity[]): ItemUseResult {
    if (mosquitoes.length === 0) return { killedIds: [], remaining: mosquitoes };
    const killedIds = mosquitoes.map((m) => m.id);
    return { killedIds, remaining: [] };
  }
}

