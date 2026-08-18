export interface Machine {
  id: string;
  type: "lathe" | "cnc_line" | "robot_cell";
  output: number; // units/tick
  cost: number;
  energy: number;
}

export interface FactoryState {
  coins: number;
  tick: number;
  machines: Machine[];
  engineers: number;
  totalProduced: number;
  totalRevenue: number;
}

export const MACHINE_CATALOG: Omit<Machine, "id">[] = [
  { type: "lathe", output: 2, cost: 200, energy: 1 },
  { type: "cnc_line", output: 6, cost: 800, energy: 3 },
  { type: "robot_cell", output: 14, cost: 2500, energy: 6 },
];

export const ENGINEER_COST = 300;
export const PRICE_PER_UNIT = 12;

export function newGame(): FactoryState {
  return {
    coins: 1000,
    tick: 0,
    machines: [],
    engineers: 1,
    totalProduced: 0,
    totalRevenue: 0,
  };
}

export function step(s: FactoryState): FactoryState {
  const efficiency = Math.min(1, 0.5 + s.engineers * 0.15);
  const totalOutput = s.machines.reduce((a, m) => a + m.output, 0) * efficiency;
  const energyCost = s.machines.reduce((a, m) => a + m.energy, 0) * 0.5;
  const wages = s.engineers * 1.5;
  const revenue = totalOutput * PRICE_PER_UNIT;
  return {
    ...s,
    tick: s.tick + 1,
    coins: +(s.coins + revenue - energyCost - wages).toFixed(0),
    totalProduced: s.totalProduced + Math.round(totalOutput),
    totalRevenue: s.totalRevenue + Math.round(revenue),
  };
}

export function buyMachine(s: FactoryState, type: Machine["type"]): FactoryState {
  const spec = MACHINE_CATALOG.find((m) => m.type === type);
  if (!spec || s.coins < spec.cost) return s;
  return {
    ...s,
    coins: s.coins - spec.cost,
    machines: [...s.machines, { ...spec, id: crypto.randomUUID() }],
  };
}

export function hireEngineer(s: FactoryState): FactoryState {
  if (s.coins < ENGINEER_COST) return s;
  return { ...s, coins: s.coins - ENGINEER_COST, engineers: s.engineers + 1 };
}

export function scoreFactory(s: FactoryState): number {
  // Score based on coins + total revenue + diversity
  const diversity = new Set(s.machines.map((m) => m.type)).size;
  const wealth = Math.min(60, s.coins / 100);
  const rev = Math.min(30, s.totalRevenue / 200);
  return Math.round(wealth + rev + diversity * 3);
}
