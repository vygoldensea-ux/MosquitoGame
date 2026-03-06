import { BossSystem, type BossSystemConfig } from './BossSystem';
import { HeartSystem, type HeartState } from './HeartSystem';
import { ItemSystem, type ItemState, type ItemSystemConfig } from './ItemSystem';
import { MosquitoSpawner, type MosquitoEntity, type MosquitoId, type MosquitoSpawnerConfig } from './MosquitoSpawner';
import { ScoreSystem, type ScoreState, type ScoreSystemConfig } from './ScoreSystem';

export type GameStatus = 'idle' | 'running' | 'won' | 'lost';

export interface GameSnapshot {
  status: GameStatus;
  level: number;
  targetKills: number;
  timeLeftMs: number;
  mosquitoes: MosquitoEntity[];
  score: ScoreState;
  items: ItemState;
  hearts?: HeartState;
  isBossLevel: boolean;
  spawnIntervalMs: number;
}

export interface GameEngineConfig {
  /**
   * Round duration (fixed).
   * Default: 30000ms.
   */
  roundDurationMs?: number;
  /**
   * Tap damage (before item modifiers).
   * Default: 1.
   */
  baseTapDamage?: number;
  /**
   * Limit entities on screen to prevent unbounded growth.
   * Default: 14.
   */
  maxMosquitoesOnScreen?: number;
  /**
   * Tick frequency for timer and effect expiration.
   * Default: 100ms.
   */
  tickIntervalMs?: number;
  /**
   * Automatically consume a heart when losing or exiting.
   * Default: true (if HeartSystem is provided).
   */
  consumeHeartOnLoseOrExit?: boolean;
  /**
   * Inject clock for determinism/tests.
   */
  now?: () => number;
}

export interface GameEngineDeps {
  spawner?: MosquitoSpawner | MosquitoSpawnerConfig;
  bossSystem?: BossSystem | BossSystemConfig;
  itemSystem?: ItemSystem | ItemSystemConfig;
  scoreSystem?: ScoreSystem | ScoreSystemConfig;
  heartSystem?: HeartSystem;
}

export type GameEngineListener = (snapshot: GameSnapshot) => void;

function computeTargetKills(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return 20 + lv * 5;
}

export class GameEngine {
  private readonly roundDurationMs: number;
  private readonly baseTapDamage: number;
  private readonly maxMosquitoesOnScreen: number;
  private readonly tickIntervalMs: number;
  private readonly consumeHeartOnLoseOrExit: boolean;
  private readonly now: () => number;

  private readonly spawner: MosquitoSpawner;
  private readonly bossSystem: BossSystem;
  private readonly itemSystem: ItemSystem;
  private readonly scoreSystem: ScoreSystem;
  private readonly heartSystem?: HeartSystem;

  private listeners = new Set<GameEngineListener>();
  private snapshot: GameSnapshot;

  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private spawnTimer: ReturnType<typeof setTimeout> | null = null;
  private endAtMs: number = 0;

  private initializedHearts = false;

  constructor(deps: GameEngineDeps = {}, config: GameEngineConfig = {}) {
    this.roundDurationMs = Math.max(1_000, Math.floor(config.roundDurationMs ?? 30_000));
    this.baseTapDamage = Math.max(0, Math.floor(config.baseTapDamage ?? 1));
    this.maxMosquitoesOnScreen = Math.max(1, Math.floor(config.maxMosquitoesOnScreen ?? 14));
    this.tickIntervalMs = Math.max(16, Math.floor(config.tickIntervalMs ?? 100));
    this.consumeHeartOnLoseOrExit = config.consumeHeartOnLoseOrExit ?? true;
    this.now = config.now ?? Date.now;

    this.spawner =
      deps.spawner instanceof MosquitoSpawner ? deps.spawner : new MosquitoSpawner(deps.spawner ?? {});
    this.bossSystem =
      deps.bossSystem instanceof BossSystem ? deps.bossSystem : new BossSystem(deps.bossSystem ?? {});
    this.itemSystem =
      deps.itemSystem instanceof ItemSystem ? deps.itemSystem : new ItemSystem(deps.itemSystem ?? {});
    this.scoreSystem =
      deps.scoreSystem instanceof ScoreSystem ? deps.scoreSystem : new ScoreSystem(deps.scoreSystem ?? {});
    this.heartSystem = deps.heartSystem;

    const level = 1;
    const spawnIntervalMs = this.spawner.getSpawnIntervalMs(level);
    this.snapshot = {
      status: 'idle',
      level,
      targetKills: computeTargetKills(level),
      timeLeftMs: this.roundDurationMs,
      mosquitoes: [],
      score: this.scoreSystem.getState(),
      items: this.itemSystem.getState(),
      hearts: undefined,
      isBossLevel: this.bossSystem.isBossLevel(level),
      spawnIntervalMs,
    };
  }

  /**
   * Loads optional HeartSystem state (AsyncStorage).
   * Safe to call multiple times.
   */
  async init(): Promise<void> {
    if (!this.heartSystem || this.initializedHearts) return;
    const hearts = await this.heartSystem.load();
    this.initializedHearts = true;
    this.setSnapshot({ hearts });
  }

  subscribe(listener: GameEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): GameSnapshot {
    return this.snapshot;
  }

  /**
   * Starts a new 30s round for the given level.
   */
  async startRound(level: number): Promise<void> {
    await this.init();
    if (this.heartSystem) {
      const hearts = await this.heartSystem.refresh();
      this.setSnapshot({ hearts });
    }

    this.stopTimers();

    const lv = Math.max(1, Math.floor(level));
    const isBossLevel = this.bossSystem.isBossLevel(lv);

    this.scoreSystem.resetRound();
    this.itemSystem.tick(this.now());

    const nowMs = this.now();
    this.endAtMs = nowMs + this.roundDurationMs;

    const mosquitoes: MosquitoEntity[] = [];
    if (isBossLevel) {
      mosquitoes.push(this.bossSystem.createBoss(lv, nowMs));
    }

    const spawnIntervalMs = this.spawner.getSpawnIntervalMs(lv);
    this.snapshot = {
      status: 'running',
      level: lv,
      targetKills: computeTargetKills(lv),
      timeLeftMs: this.roundDurationMs,
      mosquitoes,
      score: this.scoreSystem.getState(),
      items: this.itemSystem.getState(),
      hearts: this.snapshot.hearts,
      isBossLevel,
      spawnIntervalMs,
    };
    this.emit();

    this.tickTimer = setInterval(() => this.onTick(), this.tickIntervalMs);
    if (!isBossLevel) {
      this.scheduleNextSpawn();
    }
  }

  /**
   * Exit counts as losing 1 heart (if enabled), but does not force a "lost" outcome.
   */
  async exitRound(): Promise<void> {
    if (this.snapshot.status !== 'running') {
      this.stopTimers();
      return;
    }
    this.stopTimers();
    if (this.heartSystem && this.consumeHeartOnLoseOrExit) {
      const hearts = await this.heartSystem.consumeHearts(1);
      this.setSnapshot({ hearts });
    }
    this.setSnapshot({ status: 'idle' });
  }

  tapMosquito(id: MosquitoId): void {
    if (this.snapshot.status !== 'running') return;
    const nowMs = this.now();
    this.itemSystem.tick(nowMs);

    const damage = this.itemSystem.getHitDamage(this.baseTapDamage, nowMs);
    if (damage <= 0) return;

    const idx = this.snapshot.mosquitoes.findIndex((m) => m.id === id);
    if (idx < 0) return;

    const target = this.snapshot.mosquitoes[idx];
    const nextHp = Math.max(0, target.hp - damage);
    const updated = { ...target, hp: nextHp };

    if (nextHp <= 0) {
      const remaining = this.snapshot.mosquitoes.filter((m) => m.id !== id);
      this.scoreSystem.addKill(target);
      this.setSnapshot({
        mosquitoes: remaining,
        score: this.scoreSystem.getState(),
      });
      this.checkWinCondition();
      return;
    }

    const nextMosquitoes = this.snapshot.mosquitoes.slice();
    nextMosquitoes[idx] = updated;
    this.setSnapshot({ mosquitoes: nextMosquitoes });
  }

  useElectricRacket(): void {
    if (this.snapshot.status !== 'running') return;
    this.itemSystem.activateElectricRacket(this.now());
    this.setSnapshot({ items: this.itemSystem.getState() });
  }

  useMosquitoCoil(): void {
    if (this.snapshot.status !== 'running') return;
    const { killedIds, remaining } = this.itemSystem.useMosquitoCoil(this.snapshot.mosquitoes);
    if (killedIds.length === 0) return;

    for (const id of killedIds) {
      const m = this.snapshot.mosquitoes.find((x) => x.id === id);
      if (m) this.scoreSystem.addKill(m);
    }

    this.setSnapshot({
      mosquitoes: remaining,
      score: this.scoreSystem.getState(),
    });
    this.checkWinCondition();
  }

  useBugSpray(): void {
    if (this.snapshot.status !== 'running') return;
    const { killedIds, remaining } = this.itemSystem.useBugSpray(this.snapshot.mosquitoes);
    if (killedIds.length === 0) return;

    for (const m of this.snapshot.mosquitoes) {
      this.scoreSystem.addKill(m);
    }

    this.setSnapshot({
      mosquitoes: remaining,
      score: this.scoreSystem.getState(),
    });
    this.checkWinCondition();
  }

  /**
   * Force stop (e.g. app background) without applying penalties.
   */
  stop(): void {
    this.stopTimers();
    this.setSnapshot({ status: 'idle' });
  }

  private onTick(): void {
    if (this.snapshot.status !== 'running') return;
    const nowMs = this.now();

    this.itemSystem.tick(nowMs);

    const timeLeftMs = Math.max(0, this.endAtMs - nowMs);
    if (timeLeftMs !== this.snapshot.timeLeftMs) {
      this.setSnapshot({
        timeLeftMs,
        items: this.itemSystem.getState(),
      });
    }

    if (timeLeftMs <= 0) {
      void this.loseRound();
    }
  }

  private scheduleNextSpawn(): void {
    if (this.snapshot.status !== 'running') return;
    if (this.snapshot.isBossLevel) return;
    if (this.spawnTimer) clearTimeout(this.spawnTimer);

    const delay = this.snapshot.spawnIntervalMs;
    this.spawnTimer = setTimeout(() => {
      this.spawnTimer = null;
      this.spawnOne();
      this.scheduleNextSpawn();
    }, delay);
  }

  private spawnOne(): void {
    if (this.snapshot.status !== 'running') return;
    if (this.snapshot.isBossLevel) return;
    if (this.snapshot.mosquitoes.length >= this.maxMosquitoesOnScreen) return;

    const nowMs = this.now();
    const m = this.spawner.spawnNormal(this.snapshot.level, nowMs);
    this.setSnapshot({ mosquitoes: [...this.snapshot.mosquitoes, m] });
  }

  private checkWinCondition(): void {
    if (this.snapshot.status !== 'running') return;
    const kills = this.scoreSystem.getState().killsThisRound;
    if (kills >= this.snapshot.targetKills) {
      void this.winRound();
    }
  }

  private async winRound(): Promise<void> {
    if (this.snapshot.status !== 'running') return;
    this.stopTimers();
    this.setSnapshot({ status: 'won' });
  }

  private async loseRound(): Promise<void> {
    if (this.snapshot.status !== 'running') return;
    this.stopTimers();
    this.setSnapshot({ status: 'lost' });
    if (this.heartSystem && this.consumeHeartOnLoseOrExit) {
      const hearts = await this.heartSystem.consumeHearts(1);
      this.setSnapshot({ hearts });
    }
  }

  private stopTimers(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = null;
    if (this.spawnTimer) clearTimeout(this.spawnTimer);
    this.spawnTimer = null;
  }

  private setSnapshot(patch: Partial<GameSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.emit();
  }

  private emit(): void {
    for (const l of this.listeners) l(this.snapshot);
  }
}

