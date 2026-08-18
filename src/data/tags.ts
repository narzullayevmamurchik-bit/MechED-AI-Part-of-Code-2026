// Central tag definitions for cross-content matching
export type ContentTag =
  | "metallurgy"
  | "materials_science"
  | "machining"
  | "mechanical_engineering"
  | "heat_treatment"
  | "cad_cam"
  | "ai_ml"
  | "robotics"
  | "welding"
  | "steel"
  | "casting"
  | "powder_metallurgy"
  | "innovation"
  | "simulation"
  | "3d_printing";

// Map courses to tags
export const courseTags: Record<string, ContentTag[]> = {
  "practical-metallurgy": ["metallurgy", "materials_science", "machining"],
  "steel-applications": ["steel", "welding", "mechanical_engineering", "metallurgy"],
  "special-steel-technology": ["steel", "metallurgy", "heat_treatment", "materials_science"],
  "material-science": ["materials_science", "metallurgy"],
  "machine-learning": ["ai_ml", "innovation"],
  "mechanical-properties": ["materials_science", "mechanical_engineering"],
  "metallic-material-technology": ["metallurgy", "casting", "powder_metallurgy", "materials_science"],
  "robotics-mechatronics": ["robotics", "mechanical_engineering", "innovation"],
  "ai-innovation-engineering": ["ai_ml", "innovation", "simulation", "3d_printing"],
};

// Map resource categories to tags
export const resourceCategoryToTags: Record<string, ContentTag[]> = {
  materials_science: ["materials_science", "metallurgy"],
  metallurgy: ["metallurgy", "steel", "heat_treatment"],
  mechanical_engineering: ["mechanical_engineering", "machining"],
  heat_treatment: ["heat_treatment", "metallurgy", "steel"],
  cad_cam: ["cad_cam", "simulation"],
  ai_ml: ["ai_ml", "innovation"],
  robotics: ["robotics", "mechanical_engineering"],
};

// Map expert categories to tags
export const expertCategoryToTags: Record<string, ContentTag[]> = {
  machining: ["machining", "mechanical_engineering"],
  machine_design: ["mechanical_engineering", "machining"],
  materials: ["materials_science", "metallurgy"],
  heat_treatment: ["heat_treatment", "metallurgy", "steel"],
  cad_cam: ["cad_cam", "simulation"],
  innovation: ["innovation", "ai_ml", "3d_printing"],
};
