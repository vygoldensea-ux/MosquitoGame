export type MosquitoType = 'basic' | 'fat' | 'tanker' | 'bone' | 'boss';

export type MosquitoId = string;

export interface Vec2 {
  /**
   * Normalized position in [0..1]. UI can map this to pixels.
   */
  x: number;
  y: number;
}

export interface MosquitoEntity {
  id: MosquitoId;
  type: MosquitoType;
  hp: number;
  maxHp: number;
  rewardGold: number;
  spawnedAtMs: number;
  position: Vec2;
}

export interface SpawnWeights {
  basic: number; // 60%
  fat: number; // 20%
  tanker: number; // 15%
  bone: number; // 5%
}

export type Rng = () => number; // returns [0..1)

export interface MosquitoSpawnerConfig {
  /**
   * Starting spawn interval at level 1.
   * Default: 1500ms.
   */
  baseIntervalMs?: number;
  /**
   * Interval decreases per level (clamped to minIntervalMs).
   * Default: 45ms per level.
   */
  intervalDecayMsPerLevel?: number;
  /**
   * Minimum spawn interval clamp.
   * Default: 650ms.
   */
  minIntervalMs?: number;
  /**
   * Weighted probability for normal mosquitoes.
   */
  weights?: SpawnWeights;
  /**
   * Injected RNG for determinism/tests.
   */
  rng?: Rng;
}

const DEFAULT_WEIGHTS: SpawnWeights = {
  basic: 60,
  fat: 20,
  tanker: 15,
  bone: 5,
};

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function pickWeightedNormalType(weights: SpawnWeights, rng: Rng): Exclude<MosquitoType, 'boss'> {
  const total = weights.basic + weights.fat + weights.tanker + weights.bone;
  const roll = rng() * total;

  let acc = weights.basic;
  if (roll < acc) return 'basic';
  acc += weights.fat;
  if (roll < acc) return 'fat';
  acc += weights.tanker;
  if (roll < acc) return 'tanker';
  return 'bone';
}

function getNormalSpec(type: Exclude<MosquitoType, 'boss'>): { hp: number; rewardGold: number } {
  switch (type) {
    case 'basic':
      return { hp: 1, rewardGold: 1 };
    case 'fat':
      return { hp: 1, rewardGold: 3 };
    case 'tanker':
      return { hp: 3, rewardGold: 5 };
    case 'bone':
      return { hp: 5, rewardGold: 5 };
  }
}

export class MosquitoSpawner {
  private readonly baseIntervalMs: number;
  private readonly intervalDecayMsPerLevel: number;
  private readonly minIntervalMs: number;
  private readonly weights: SpawnWeights;
  private readonly rng: Rng;
  private nextId = 1;

  constructor(config: MosquitoSpawnerConfig = {}) {
    this.baseIntervalMs = config.baseIntervalMs ?? 1500;
    this.intervalDecayMsPerLevel = config.intervalDecayMsPerLevel ?? 45;
    this.minIntervalMs = config.minIntervalMs ?? 650;
    this.weights = config.weights ?? DEFAULT_WEIGHTS;
    this.rng = config.rng ?? Math.random;
  }

  /**
   * Spawn interval decreases slightly per level.
   */
  getSpawnIntervalMs(level: number): number {
    const lv = Math.max(1, Math.floor(level));
    const interval = this.baseIntervalMs - (lv - 1) * this.intervalDecayMsPerLevel;
    return Math.max(this.minIntervalMs, Math.floor(interval));
  }

  spawnNormal(level: number, nowMs: number): MosquitoEntity {
    const type = pickWeightedNormalType(this.weights, this.rng);
    const spec = getNormalSpec(type);

    const id = `m_${nowMs}_${this.nextId++}_${Math.floor(this.rng() * 1e9)}`;
    const position: Vec2 = { x: clamp01(this.rng()), y: clamp01(this.rng()) };

    return {
      id,
      type,
      hp: spec.hp,
      maxHp: spec.hp,
      rewardGold: spec.rewardGold,
      spawnedAtMs: nowMs,
      position,
    };
  }
}

