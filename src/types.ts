/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Point;
}

export interface Rocket extends Entity {
  start: Point;
  target: Point;
  speed: number;
  progress: number; // 0 to 1
  destroyed: boolean;
}

export interface Interceptor extends Entity {
  start: Point;
  target: Point;
  speed: number;
  progress: number; // 0 to 1
  exploded: boolean;
}

export interface Explosion extends Entity {
  radius: number;
  maxRadius: number;
  growthRate: number;
  finished: boolean;
}

export interface Battery extends Entity {
  missiles: number;
  maxMissiles: number;
  destroyed: boolean;
  health: number;
}

export interface ResearchShip extends Entity {
  destroyed: boolean;
}

export interface Turbine extends Entity {
  destroyed: boolean;
  health: number;
}

export type GameState = 'START' | 'PLAYING' | 'WON' | 'LOST';

export interface Language {
  title: string;
  start: string;
  win: string;
  loss: string;
  restart: string;
  score: string;
  missiles: string;
  instructions: string;
}

export const LANGUAGES: Record<'en' | 'zh', Language> = {
  en: {
    title: "Wind Power Defense",
    start: "Start Game",
    win: "Mission Accomplished!",
    loss: "Defense Failed",
    restart: "Play Again",
    score: "Score",
    missiles: "Missiles",
    instructions: "Click to intercept incoming rockets. Protect the wind turbines!"
  },
  zh: {
    title: "Wind Power 防御",
    start: "开始游戏",
    win: "任务成功！",
    loss: "防御失败",
    restart: "再玩一次",
    score: "得分",
    missiles: "导弹",
    instructions: "点击屏幕发射拦截导弹。保护海上风电机组！"
  }
};
