import type { MosquitoEntity } from './MosquitoSpawner';

export interface ScoreState {
  /**
   * Number of kills in the current round (used for target condition).
   */
  killsThisRound: number;
  /**
   * Gold earned in the current round.
   */
  goldEarnedThisRound: number;
  /**
   * Player's total gold (persist this elsewhere if desired).
   */
  totalGold: number;
}

export interface ScoreSystemConfig {
  initialTotalGold?: number;
}

export class ScoreSystem {
  private state: ScoreState;

  constructor(config: ScoreSystemConfig = {}) {
    this.state = {
      killsThisRound: 0,
      goldEarnedThisRound: 0,
      totalGold: Math.max(0, Math.floor(config.initialTotalGold ?? 0)),
    };
  }

  getState(): ScoreState {
    return { ...this.state };
  }

  resetRound(): void {
    this.state = {
      ...this.state,
      killsThisRound: 0,
      goldEarnedThisRound: 0,
    };
  }

  addKill(mosquito: MosquitoEntity): void {
    const reward = Math.max(0, Math.floor(mosquito.rewardGold));
    this.state = {
      ...this.state,
      killsThisRound: this.state.killsThisRound + 1,
      goldEarnedThisRound: this.state.goldEarnedThisRound + reward,
      totalGold: this.state.totalGold + reward,
    };
  }

  addGold(amount: number): void {
    const a = Math.max(0, Math.floor(amount));
    if (a === 0) return;
    this.state = {
      ...this.state,
      goldEarnedThisRound: this.state.goldEarnedThisRound + a,
      totalGold: this.state.totalGold + a,
    };
  }

  spendGold(amount: number): boolean {
    const a = Math.max(0, Math.floor(amount));
    if (a === 0) return true;
    if (this.state.totalGold < a) return false;
    this.state = { ...this.state, totalGold: this.state.totalGold - a };
    return true;
  }
}

