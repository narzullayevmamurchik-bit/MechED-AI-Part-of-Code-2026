export type Treatment = "anneal" | "quench" | "temper" | "normalize";

export interface MetallurgyInputs {
  grade: string; // e.g. AISI 1045
  carbon: number; // % C
  alloy: number; // % alloying
  temperature: number; // °C
  holdMinutes: number;
  treatment: Treatment;
}

export interface MetallurgyResult {
  ferrite: number;
  pearlite: number;
  martensite: number;
  bainite: number;
  hardnessHRC: number;
  notes: string[];
}

const GRADES: Record<string, { carbon: number; targetHRC: number }> = {
  "AISI 1018": { carbon: 0.18, targetHRC: 20 },
  "AISI 1045": { carbon: 0.45, targetHRC: 45 },
  "AISI 1095": { carbon: 0.95, targetHRC: 60 },
  "4140 Cr-Mo": { carbon: 0.4, targetHRC: 50 },
  "52100 Bearing": { carbon: 1.0, targetHRC: 62 },
};

export const GRADE_KEYS = Object.keys(GRADES);
export const gradeInfo = (g: string) => GRADES[g] ?? { carbon: 0.4, targetHRC: 40 };

export function simulate(i: MetallurgyInputs): MetallurgyResult {
  const notes: string[] = [];
  let martensite = 0,
    pearlite = 0,
    ferrite = 0,
    bainite = 0;

  const austenitized = i.temperature >= 760 && i.holdMinutes >= 10;
  if (!austenitized) notes.push("Insufficient austenitizing — incomplete transformation.");

  switch (i.treatment) {
    case "quench":
      if (austenitized) {
        martensite = Math.min(95, 40 + i.carbon * 80 + i.alloy * 3);
        bainite = 100 - martensite;
        notes.push("Rapid cooling forms martensite — high hardness, brittle.");
      } else {
        ferrite = 60;
        pearlite = 40;
      }
      break;
    case "temper":
      martensite = 35 + i.carbon * 20;
      bainite = 25;
      ferrite = 100 - martensite - bainite;
      notes.push("Tempered martensite — tougher, slightly lower hardness.");
      break;
    case "anneal":
      ferrite = 70 - i.carbon * 30;
      pearlite = 100 - ferrite;
      notes.push("Slow cool — soft, ductile ferrite + pearlite.");
      break;
    case "normalize":
      ferrite = 50 - i.carbon * 20;
      pearlite = 100 - ferrite;
      notes.push("Air-cooled — refined grain, balanced properties.");
      break;
  }

  ferrite = Math.max(0, ferrite);
  const sum = ferrite + pearlite + martensite + bainite;
  ferrite = (ferrite / sum) * 100;
  pearlite = (pearlite / sum) * 100;
  martensite = (martensite / sum) * 100;
  bainite = (bainite / sum) * 100;

  const hardnessHRC = Math.round(
    0.62 * martensite * (0.4 + i.carbon) + 0.25 * bainite + 0.1 * pearlite
  );

  return {
    ferrite: Math.round(ferrite),
    pearlite: Math.round(pearlite),
    martensite: Math.round(martensite),
    bainite: Math.round(bainite),
    hardnessHRC: Math.max(15, Math.min(68, hardnessHRC)),
    notes,
  };
}

export function scoreRun(i: MetallurgyInputs, r: MetallurgyResult): number {
  const target = gradeInfo(i.grade).targetHRC;
  const delta = Math.abs(r.hardnessHRC - target);
  return Math.max(0, Math.round(100 - delta * 4));
}
