import type { MosquitoEntity } from './MosquitoSpawner';

export interface BossSystemConfig {
  /**
   * Boss appears every N levels.
   * Default: 3.
   */
  bossEveryLevels?: number;
  /**
   * Boss HP formula: 200 + (Level * 50)
   */
  baseHp?: number;
  hpPerLevel?: number;
  /**
   * Boss reward: 50 gold
   */
  rewardGold?: number;
}

export class BossSystem {
  private readonly bossEveryLevels: number;
  private readonly baseHp: number;
  private readonly hpPerLevel: number;
  private readonly rewardGold: number;
  private nextBossId = 1;

  constructor(config: BossSystemConfig = {}) {
    this.bossEveryLevels = Math.max(1, Math.floor(config.bossEveryLevels ?? 3));
    this.baseHp = config.baseHp ?? 200;
    this.hpPerLevel = config.hpPerLevel ?? 50;
    this.rewardGold = config.rewardGold ?? 50;
  }

  isBossLevel(level: number): boolean {
    const lv = Math.max(1, Math.floor(level));
    return lv % this.bossEveryLevels === 0;
  }

  getBossHp(level: number): number {
    const lv = Math.max(1, Math.floor(level));
    return this.baseHp + lv * this.hpPerLevel;
  }

  createBoss(level: number, nowMs: number): MosquitoEntity {
    const maxHp = this.getBossHp(level);
    return {
      id: `boss_${nowMs}_${this.nextBossId++}`,
      type: 'boss',
      hp: maxHp,
      maxHp,
      rewardGold: this.rewardGold,
      spawnedAtMs: nowMs,
      position: { x: 0.5, y: 0.3 },
    };
  }

  applyDamage(boss: MosquitoEntity, damage: number): { boss: MosquitoEntity; killed: boolean } {
    if (boss.type !== 'boss') return { boss, killed: false };
    const d = Math.max(0, Math.floor(damage));
    const hp = Math.max(0, boss.hp - d);
    const killed = hp <= 0;
    return { boss: { ...boss, hp }, killed };
  }
}

