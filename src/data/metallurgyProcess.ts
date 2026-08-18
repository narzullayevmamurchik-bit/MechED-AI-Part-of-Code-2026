export interface ProcessStage {
  id: string;
  title: string;
  icon: string;
  description: string;
  processes: string[];
  inputs: string[];
  outputs: string[];
  relatedCourses: string[];
  relatedResources: string[];
  relatedExperts: string[];
  color: string;
}

export interface ProcessGroup {
  id: string;
  title: string;
  stages: ProcessStage[];
}

export const processGroups: ProcessGroup[] = [
  {
    id: "raw-materials",
    title: "Raw Materials",
    stages: [
      {
        id: "iron-ore",
        title: "Iron Ore",
        icon: "⛏️",
        description: "Iron ore is the primary raw material for steelmaking. It is mined from the earth's crust and contains iron oxides (hematite Fe₂O₃, magnetite Fe₃O₄). Before use, it undergoes beneficiation — crushing, screening, and concentration to increase iron content.",
        processes: ["Mining & extraction", "Crushing & grinding", "Magnetic separation", "Pelletizing", "Sintering"],
        inputs: ["Earth's crust deposits", "Water", "Energy"],
        outputs: ["Iron ore pellets", "Sinter", "Iron ore fines"],
        relatedCourses: ["practical-metallurgy", "material-science"],
        relatedResources: ["r1", "r6"],
        relatedExperts: ["e6", "e11"],
        color: "hsl(25, 80%, 55%)",
      },
      {
        id: "coal-coke",
        title: "Coal / Coke",
        icon: "🪨",
        description: "Coal is converted into coke through coking (heating without air). Coke serves as both a fuel and a reducing agent in blast furnaces. It provides the carbon needed to remove oxygen from iron ore, producing metallic iron.",
        processes: ["Coking (carbonization)", "Coal washing", "Coke oven operation", "By-product recovery"],
        inputs: ["Bituminous coal", "Heat energy"],
        outputs: ["Metallurgical coke", "Coke oven gas", "Coal tar", "Ammonia"],
        relatedCourses: ["practical-metallurgy"],
        relatedResources: ["r6"],
        relatedExperts: ["e6"],
        color: "hsl(0, 0%, 45%)",
      },
      {
        id: "scrap",
        title: "Scrap Metal",
        icon: "♻️",
        description: "Scrap metal is recycled steel from end-of-life products, industrial waste, and manufacturing offcuts. It is a crucial feedstock for Electric Arc Furnaces (EAF), reducing the need for virgin raw materials and significantly lowering energy consumption.",
        processes: ["Collection & sorting", "Shredding", "Magnetic separation", "Quality grading", "Baling"],
        inputs: ["End-of-life steel products", "Industrial scrap", "Manufacturing offcuts"],
        outputs: ["Sorted scrap grades", "Shredded scrap", "Prepared charge material"],
        relatedCourses: ["practical-metallurgy", "steel-applications"],
        relatedResources: ["r6", "r8"],
        relatedExperts: ["e7"],
        color: "hsl(140, 50%, 45%)",
      },
    ],
  },
  {
    id: "ironmaking",
    title: "Ironmaking",
    stages: [
      {
        id: "blast-furnace",
        title: "Blast Furnace (BF)",
        icon: "🏭",
        description: "The blast furnace is a towering shaft furnace where iron ore, coke, and limestone are charged from the top while hot air is blown from the bottom. Chemical reactions reduce iron oxides to molten pig iron at ~1500°C, which collects at the base.",
        processes: ["Charging (ore + coke + flux)", "Hot blast injection", "Reduction reactions", "Slag formation", "Tapping molten iron"],
        inputs: ["Iron ore / sinter / pellets", "Coke", "Limestone flux", "Hot air blast"],
        outputs: ["Pig iron (hot metal)", "Slag", "Blast furnace gas"],
        relatedCourses: ["practical-metallurgy", "material-science", "metallic-material-technology"],
        relatedResources: ["r6", "r1"],
        relatedExperts: ["e6", "e5"],
        color: "hsl(15, 85%, 50%)",
      },
      {
        id: "dri",
        title: "Direct Reduced Iron (DRI)",
        icon: "🔥",
        description: "DRI is produced by reducing iron ore using natural gas or coal at temperatures below the melting point (~900°C). The result is a sponge-like metalite called sponge iron. DRI is a cleaner alternative to blast furnace ironmaking with lower CO₂ emissions.",
        processes: ["Gas-based reduction (Midrex/HYL)", "Coal-based reduction (rotary kiln)", "Pellet preparation", "Temperature control"],
        inputs: ["Iron ore pellets", "Natural gas / Coal", "Hydrogen (green DRI)"],
        outputs: ["Sponge iron (DRI)", "Hot briquetted iron (HBI)"],
        relatedCourses: ["practical-metallurgy", "special-steel-technology"],
        relatedResources: ["r6", "r14"],
        relatedExperts: ["e6", "e7"],
        color: "hsl(30, 90%, 50%)",
      },
    ],
  },
  {
    id: "primary-metallurgy",
    title: "Primary Metallurgy",
    stages: [
      {
        id: "eaf",
        title: "Electric Arc Furnace (EAF)",
        icon: "⚡",
        description: "The EAF uses powerful electric arcs (up to 3500°C) to melt scrap metal and/or DRI. It is the dominant steelmaking route for recycled steel. Modern EAFs can produce a heat (batch) of steel in under 45 minutes with high flexibility in steel grades.",
        processes: ["Charging scrap/DRI", "Electric arc melting", "Oxygen injection", "Slag foaming", "Temperature sampling", "Tapping"],
        inputs: ["Scrap metal", "DRI/HBI", "Lime", "Carbon", "Electricity", "Oxygen"],
        outputs: ["Liquid steel", "EAF slag", "Off-gases"],
        relatedCourses: ["practical-metallurgy", "steel-applications", "special-steel-technology"],
        relatedResources: ["r6", "r9", "r14"],
        relatedExperts: ["e6", "e7", "e11"],
        color: "hsl(55, 90%, 50%)",
      },
      {
        id: "bof",
        title: "Basic Oxygen Furnace (BOF)",
        icon: "💨",
        description: "The BOF (or LD converter) refines hot metal from the blast furnace by blowing pure oxygen at supersonic speed onto the molten iron. This oxidizes carbon and impurities (Si, Mn, P) in an exothermic reaction, producing steel in ~20 minutes.",
        processes: ["Hot metal charging", "Scrap addition", "Oxygen blowing", "Flux addition", "Temperature control", "Tapping"],
        inputs: ["Hot metal (pig iron)", "Scrap (10-30%)", "Oxygen", "Lime/Dolomite"],
        outputs: ["Liquid steel", "BOF slag", "CO gas"],
        relatedCourses: ["practical-metallurgy", "steel-applications"],
        relatedResources: ["r6", "r10"],
        relatedExperts: ["e6", "e5"],
        color: "hsl(200, 70%, 50%)",
      },
    ],
  },
  {
    id: "secondary-metallurgy",
    title: "Secondary Metallurgy",
    stages: [
      {
        id: "ladle-furnace",
        title: "Ladle Furnace (LF)",
        icon: "🫗",
        description: "The ladle furnace is used for secondary refining after EAF/BOF. It provides precise temperature control, alloying, desulfurization, and inclusion removal. Electric arc heating maintains temperature while argon stirring ensures homogeneity.",
        processes: ["Arc reheating", "Alloying additions", "Desulfurization", "Argon stirring", "Inclusion modification", "Temperature trimming"],
        inputs: ["Liquid steel from EAF/BOF", "Ferroalloys", "Synthetic slag", "Argon gas"],
        outputs: ["Refined liquid steel", "Ladle slag"],
        relatedCourses: ["special-steel-technology", "practical-metallurgy"],
        relatedResources: ["r6", "r14"],
        relatedExperts: ["e6", "e7", "e11"],
        color: "hsl(270, 60%, 55%)",
      },
      {
        id: "vacuum-degassing",
        title: "Vacuum Degassing (VD/VOD)",
        icon: "🌀",
        description: "Vacuum degassing removes dissolved gases (hydrogen, nitrogen, oxygen) from liquid steel by exposing it to low pressure. This is essential for producing ultra-clean steels for critical applications like automotive, aerospace, and bearing steels.",
        processes: ["Vacuum pumping", "Carbon deoxidation", "Hydrogen removal", "Nitrogen control", "VOD (decarburization under vacuum)"],
        inputs: ["Refined liquid steel", "Vacuum (< 1 mbar)", "Argon", "Oxygen (VOD)"],
        outputs: ["Ultra-clean steel", "Low-gas steel grades"],
        relatedCourses: ["special-steel-technology"],
        relatedResources: ["r6", "r14"],
        relatedExperts: ["e7", "e11"],
        color: "hsl(290, 55%, 50%)",
      },
    ],
  },
  {
    id: "casting-forming",
    title: "Casting & Forming",
    stages: [
      {
        id: "continuous-casting",
        title: "Continuous Casting",
        icon: "🏗️",
        description: "Continuous casting transforms liquid steel into solid semi-finished products (slabs, blooms, billets) by pouring through a water-cooled mold. The solidified strand is continuously withdrawn, cut to length, and sent to rolling mills.",
        processes: ["Tundish operation", "Mold oscillation", "Primary cooling", "Secondary cooling (spray)", "Strand cutting", "Quality inspection"],
        inputs: ["Liquid steel from ladle", "Mold powder", "Cooling water"],
        outputs: ["Slabs", "Blooms", "Billets"],
        relatedCourses: ["practical-metallurgy", "steel-applications", "metallic-material-technology"],
        relatedResources: ["r6", "r10"],
        relatedExperts: ["e5", "e6"],
        color: "hsl(340, 70%, 50%)",
      },
      {
        id: "rolling",
        title: "Rolling & Forming",
        icon: "🔄",
        description: "Rolling reduces the thickness and shapes semi-finished steel into final products. Hot rolling (above recrystallization temperature) produces plates, strips, and structural shapes. Cold rolling further improves surface finish and dimensional accuracy.",
        processes: ["Reheating furnace", "Hot rolling", "Cold rolling", "Annealing", "Coating (galvanizing)", "Slitting & cutting"],
        inputs: ["Slabs / blooms / billets", "Heat energy", "Rolling mill lubricant"],
        outputs: ["Hot-rolled coil/plate", "Cold-rolled sheet", "Structural sections", "Wire rod"],
        relatedCourses: ["practical-metallurgy", "steel-applications", "mechanical-properties"],
        relatedResources: ["r10", "r13"],
        relatedExperts: ["e5", "e3"],
        color: "hsl(0, 70%, 50%)",
      },
    ],
  },
];

export const allStages = processGroups.flatMap((g) => g.stages);
