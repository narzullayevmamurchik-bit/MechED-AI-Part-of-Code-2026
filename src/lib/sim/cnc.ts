export interface CncInputs {
  tool: "carbide" | "hss" | "ceramic";
  material: "aluminum" | "mild_steel" | "stainless" | "titanium";
  rpm: number;
  feed: number; // mm/rev
  depth: number; // mm
}

export interface CncResult {
  surfaceRa: number; // μm
  toolLifeMin: number;
  cycleTimeMin: number;
  cost: number; // USD relative
  productivity: number; // mm^3/min
  score: number;
}

const MAT_HARDNESS: Record<CncInputs["material"], number> = {
  aluminum: 0.5,
  mild_steel: 1,
  stainless: 1.6,
  titanium: 2.2,
};

const TOOL_FACTOR: Record<CncInputs["tool"], number> = {
  hss: 0.6,
  carbide: 1.2,
  ceramic: 1.5,
};

export function simulate(i: CncInputs): CncResult {
  const mat = MAT_HARDNESS[i.material];
  const tool = TOOL_FACTOR[i.tool];

  // Surface roughness ~ feed^2 / (8 * nose) ; use simplified
  const surfaceRa = Math.max(0.4, (i.feed * i.feed) / 0.6);

  // Taylor: V*T^n = C ; approx tool life decreases with RPM and material
  const toolLifeMin = Math.max(1, (600 * tool) / (i.rpm * 0.01 + mat * i.depth));

  const mrr = i.rpm * i.feed * i.depth; // mm3/min proxy
  const cycleTimeMin = 100 / Math.max(1, mrr);

  const cost = cycleTimeMin * 1.2 + (60 / toolLifeMin) * 4 + mat * 0.5;
  const productivity = mrr;

  // Composite score: roughness (low good), productivity (high good), tool life (high good), cost (low good)
  const sRough = Math.max(0, 100 - surfaceRa * 18);
  const sProd = Math.min(100, productivity / 6);
  const sLife = Math.min(100, toolLifeMin * 4);
  const sCost = Math.max(0, 100 - cost * 5);
  const score = Math.round(0.3 * sRough + 0.3 * sProd + 0.2 * sLife + 0.2 * sCost);

  return {
    surfaceRa: +surfaceRa.toFixed(2),
    toolLifeMin: +toolLifeMin.toFixed(1),
    cycleTimeMin: +cycleTimeMin.toFixed(2),
    cost: +cost.toFixed(2),
    productivity: +productivity.toFixed(0),
    score: Math.max(0, Math.min(100, score)),
  };
}
