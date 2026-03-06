import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HeartState {
  hearts: number;
  maxHearts: number;
  regenIntervalMs: number;
  /**
   * Timestamp used as the regen baseline when hearts < max.
   */
  lastChangeMs: number;
  /**
   * Null if hearts are full; otherwise the next heart will be gained at this time.
   */
  nextRegenAtMs: number | null;
}

interface StoredHeartStateV1 {
  v: 1;
  hearts: number;
  lastChangeMs: number;
}

export interface HeartSystemConfig {
  storageKey?: string;
  maxHearts?: number;
  regenIntervalMs?: number;
  now?: () => number;
}

export class HeartSystem {
  private readonly storageKey: string;
  private readonly maxHearts: number;
  private readonly regenIntervalMs: number;
  private readonly now: () => number;

  private loaded = false;
  private stored: StoredHeartStateV1 | null = null;

  constructor(config: HeartSystemConfig = {}) {
    this.storageKey = config.storageKey ?? 'mosquitoSmasher.hearts.v1';
    this.maxHearts = Math.max(1, Math.floor(config.maxHearts ?? 5));
    this.regenIntervalMs = Math.max(1_000, Math.floor(config.regenIntervalMs ?? 15 * 60 * 1000));
    this.now = config.now ?? Date.now;
  }

  async load(): Promise<HeartState> {
    const raw = await AsyncStorage.getItem(this.storageKey);
    const nowMs = this.now();

    if (!raw) {
      this.stored = { v: 1, hearts: this.maxHearts, lastChangeMs: nowMs };
      await this.persist();
      this.loaded = true;
      return this.getState();
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredHeartStateV1>;
      const hearts = Math.max(0, Math.min(this.maxHearts, Math.floor(parsed.hearts ?? this.maxHearts)));
      const lastChangeMs = Math.max(0, Math.floor(parsed.lastChangeMs ?? nowMs));
      this.stored = { v: 1, hearts, lastChangeMs };
    } catch {
      this.stored = { v: 1, hearts: this.maxHearts, lastChangeMs: nowMs };
    }

    this.loaded = true;
    await this.refresh();
    return this.getState();
  }

  /**
   * Recomputes offline regen using timestamp difference.
   * Persists if state changes.
   */
  async refresh(): Promise<HeartState> {
    this.ensureLoaded();
    const nowMs = this.now();
    const before = this.stored!;

    if (before.hearts >= this.maxHearts) {
      if (before.hearts !== this.maxHearts) {
        this.stored = { ...before, hearts: this.maxHearts, lastChangeMs: nowMs };
        await this.persist();
      }
      return this.getState();
    }

    const elapsed = Math.max(0, nowMs - before.lastChangeMs);
    const gained = Math.floor(elapsed / this.regenIntervalMs);

    if (gained <= 0) return this.getState();

    const newHearts = Math.min(this.maxHearts, before.hearts + gained);
    const usedGained = newHearts - before.hearts;
    const newLastChangeMs =
      newHearts >= this.maxHearts
        ? nowMs
        : before.lastChangeMs + usedGained * this.regenIntervalMs;

    this.stored = { ...before, hearts: newHearts, lastChangeMs: newLastChangeMs };
    await this.persist();
    return this.getState();
  }

  getState(): HeartState {
    this.ensureLoaded();
    const s = this.stored!;
    const hearts = Math.max(0, Math.min(this.maxHearts, s.hearts));
    const nextRegenAtMs = hearts >= this.maxHearts ? null : s.lastChangeMs + this.regenIntervalMs;
    return {
      hearts,
      maxHearts: this.maxHearts,
      regenIntervalMs: this.regenIntervalMs,
      lastChangeMs: s.lastChangeMs,
      nextRegenAtMs,
    };
  }

  /**
   * Lose hearts on lose or exit.
   * By design, consuming a heart resets the regen baseline.
   */
  async consumeHearts(count: number = 1): Promise<HeartState> {
    this.ensureLoaded();
    const c = Math.max(0, Math.floor(count));
    if (c === 0) return this.getState();

    const nowMs = this.now();
    const before = this.stored!;
    const hearts = Math.max(0, before.hearts - c);
    this.stored = { ...before, hearts, lastChangeMs: nowMs };
    await this.persist();
    return this.getState();
  }

  async addHearts(count: number): Promise<HeartState> {
    this.ensureLoaded();
    const c = Math.max(0, Math.floor(count));
    if (c === 0) return this.getState();

    const nowMs = this.now();
    const before = this.stored!;
    const hearts = Math.min(this.maxHearts, before.hearts + c);
    const lastChangeMs = hearts >= this.maxHearts ? nowMs : before.lastChangeMs;
    this.stored = { ...before, hearts, lastChangeMs };
    await this.persist();
    return this.getState();
  }

  private ensureLoaded(): void {
    if (!this.loaded || !this.stored) {
      throw new Error('HeartSystem not loaded. Call load() first.');
    }
  }

  private async persist(): Promise<void> {
    if (!this.stored) return;
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.stored));
  }
}

