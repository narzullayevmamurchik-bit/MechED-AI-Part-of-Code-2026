export type ExpertCategory =
  | "machining"
  | "machine_design"
  | "materials"
  | "heat_treatment"
  | "cad_cam"
  | "innovation";

export interface Expert {
  id: string;
  name: string;
  title: string;
  position: string;
  institution: string;
  bio: string;
  expertise: string[];
  categories: ExpertCategory[];
  phone?: string;
  telegram?: string;
  email?: string;
  avatar: string;
  isLead?: boolean;
}

export const categoryInfo: Record<ExpertCategory, { labelKey: string; icon: string }> = {
  machining: { labelKey: "experts_cat_machining", icon: "⚙️" },
  machine_design: { labelKey: "experts_cat_machine_design", icon: "🔧" },
  materials: { labelKey: "experts_cat_materials", icon: "🔬" },
  heat_treatment: { labelKey: "experts_cat_heat_treatment", icon: "🔥" },
  cad_cam: { labelKey: "experts_cat_cad_cam", icon: "💻" },
  innovation: { labelKey: "experts_cat_innovation", icon: "🚀" },
};

export const experts: Expert[] = [
  {
    id: "e1",
    name: "Mardonov Baxtiyor T.",
    title: "Professor",
    position: "Rector of NSUMT",
    institution: "Novasibirsk State University of Mechanical Engineering and Technologies (NSUMT)",
    bio: "Distinguished professor and university rector with decades of experience in mechanical engineering. A recognized authority in machining processes, cutting theory, and machine tool design. Under his leadership, NSUMT has become a center of excellence in engineering education and research.",
    expertise: ["Machining processes", "Cutting theory", "Machine tools", "Machine elements"],
    categories: ["machining", "machine_design"],
    avatar: "👨‍🎓",
    isLead: true,
  },
  {
    id: "e2",
    name: "Sayfidinov Oxun",
    title: "PhD",
    position: "Head of Master's Department, Head of CAIL Lab",
    institution: "NSUMT",
    bio: "Pioneering researcher leading the Center for Artificial Intelligence and Innovation Lab (CAIL). Specializes in integrating AI, 3D printing, and advanced materials into modern manufacturing processes. Actively bridges academia and industry through innovative projects.",
    expertise: ["Innovation technologies", "AI", "3D printing", "Material science"],
    categories: ["innovation", "materials"],
    telegram: "@join_g",
    avatar: "🧑‍💻",
    isLead: true,
  },
  {
    id: "e3",
    name: "Ravshanov Jamshid",
    title: "PhD",
    position: "Head of Mechanical Engineering Technology Department",
    institution: "NSUMT",
    bio: "Department head with deep expertise in machining and laser technology. His research focuses on optimizing manufacturing processes through advanced laser-based techniques, contributing to more efficient and precise production methods.",
    expertise: ["Machining", "Laser technology", "Manufacturing processes"],
    categories: ["machining"],
    phone: "+998 90 646 23 24",
    avatar: "👨‍🔬",
    isLead: true,
  },
  {
    id: "e4",
    name: "Beknazarov Jasur",
    title: "PhD",
    position: "Deputy Dean of Energy-Mechanical Faculty",
    institution: "NSUMT",
    bio: "Deputy Dean with extensive knowledge in cutting theory and engineering tooling. His academic work focuses on the development and optimization of cutting tools for industrial applications, combining theoretical analysis with practical engineering solutions.",
    expertise: ["Cutting theory", "Machine tools", "Engineering tools"],
    categories: ["machining", "machine_design"],
    phone: "+998 93 956 37 73",
    avatar: "👨‍💼",
  },
  {
    id: "e5",
    name: "Yaxshiyev Sherali",
    title: "Professor",
    position: "Professor, Mechanical Engineering",
    institution: "NSUMT",
    bio: "Seasoned professor specializing in machine elements design and material science. Known for his work in machine diagnostics and reliability engineering, helping industries predict and prevent mechanical failures through advanced diagnostic techniques.",
    expertise: ["Machine elements", "Material science", "Machine diagnostics"],
    categories: ["machine_design", "materials"],
    phone: "+998 90 501 09 15",
    avatar: "👨‍🏫",
    isLead: true,
  },
  {
    id: "e6",
    name: "Egamberdiyev Ilhom",
    title: "Professor",
    position: "Professor, Mechanical Engineering",
    institution: "NSUMT",
    bio: "Renowned professor in materials science with particular focus on thermal processing and metallurgy. A prolific researcher who has contributed extensively to understanding phase transformations in metals and developing innovative heat treatment protocols.",
    expertise: ["Materials science", "Thermal processing", "Metallurgy", "Innovation"],
    categories: ["materials", "heat_treatment", "innovation"],
    telegram: "@IlhomPulatovich",
    avatar: "👨‍🔬",
    isLead: true,
  },
  {
    id: "e7",
    name: "Axmedov Xasan",
    title: "PhD",
    position: "Researcher, Mechanical Engineering",
    institution: "NSUMT",
    bio: "Specialist in metallurgy with a focus on steel alloys and special steels. His research contributes to the development of high-performance materials for demanding industrial applications, including aerospace and automotive sectors.",
    expertise: ["Machine elements", "Metallurgy", "Steel alloys", "Special steels"],
    categories: ["materials", "heat_treatment", "machine_design"],
    phone: "+998 93 145 02 88",
    avatar: "🧑‍🔬",
  },
  {
    id: "e8",
    name: "Isayev Doniyor",
    title: "PhD",
    position: "Researcher, Mechanical Engineering",
    institution: "NSUMT",
    bio: "Dedicated researcher in cutting theory and machining processes. Focuses on improving tool life and surface quality through optimized cutting parameters and advanced tool geometries.",
    expertise: ["Cutting theory", "Machining", "Engineering tools"],
    categories: ["machining"],
    phone: "+998 90 646 99 91",
    avatar: "👨‍🔧",
  },
  {
    id: "e9",
    name: "Atoullayev Aziz",
    title: "PhD",
    position: "Researcher, Mechanical Engineering",
    institution: "NSUMT",
    bio: "Researcher specializing in cutting processes and tool engineering. His work aims to enhance machining efficiency through the study of tool wear mechanisms and cutting force optimization.",
    expertise: ["Cutting theory", "Machining", "Tools"],
    categories: ["machining"],
    phone: "+998 91 253 72 72",
    avatar: "🔧",
  },
  {
    id: "e10",
    name: "Mamadiyarov Akmal",
    title: "PhD",
    position: "Researcher, Material Science",
    institution: "NSUMT",
    bio: "Expert in CAD/CAM systems and digital manufacturing. Proficient in SolidWorks, AutoCAD, and Kompas 3D with extensive experience in CAM programming and G-code generation for CNC machining operations.",
    expertise: ["CAD/CAM", "SolidWorks", "AutoCAD", "Kompas 3D", "CAM systems", "G-code programming"],
    categories: ["cad_cam"],
    telegram: "@Akmal_Mamadiyarov",
    avatar: "💻",
  },
  {
    id: "e11",
    name: "Hamroyev Nurbek",
    title: "PhD",
    position: "Researcher, Material Science",
    institution: "NSUMT",
    bio: "Researcher focusing on material science and heat treatment processes. Specializes in studying the effects of thermal processing on steel alloy properties, contributing to improved material performance in engineering applications.",
    expertise: ["Material science", "Heat treatment", "Steel alloys"],
    categories: ["materials", "heat_treatment"],
    telegram: "@Nurbek_Nurilloyevich",
    avatar: "🔬",
  },
  {
    id: "e12",
    name: "Saibov Maruf",
    title: "PhD",
    position: "Researcher, Material Science",
    institution: "NSUMT",
    bio: "Skilled in CAD/CAM technologies and 3D modeling for engineering design. Experienced in creating complex engineering models and generating manufacturing programs for modern CNC equipment.",
    expertise: ["CAD/CAM", "3D modeling", "Engineering design", "G-code programming"],
    categories: ["cad_cam"],
    telegram: "@saibovmf",
    avatar: "🖥️",
  },
  {
    id: "e13",
    name: "Ashurov Xisrav",
    title: "PhD",
    position: "Researcher, Material Science",
    institution: "NSUMT",
    bio: "Versatile researcher combining expertise in CAD systems with material science knowledge. Proficient in SolidWorks and AutoCAD, applying digital tools to materials research and engineering design projects.",
    expertise: ["CAD systems", "Material science", "SolidWorks", "AutoCAD", "CAM"],
    categories: ["cad_cam", "materials"],
    telegram: "@Xisrav",
    avatar: "🧪",
  },
];
