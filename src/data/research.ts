export interface ResearchArticle {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract: string;
  url: string;
  tags: string[];
}

export interface ResearchLink {
  id: string;
  name: string;
  description: string;
  url: string;
  category: string;
}

export interface UsefulWebsite {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
}

export interface VirtualLab {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  type: string;
  embeddable: boolean;
  embedUrl?: string;
  filterCategory: "Physics" | "CAD" | "Simulation" | "Computation";
}

export interface InnovationIdea {
  id: string;
  title: string;
  description: string;
  field: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

export const researchArticles: ResearchArticle[] = [
  {
    id: "ra1",
    title: "Machine Learning-Based Prediction of Mechanical Properties of High-Entropy Alloys",
    authors: "A. Karimov, S. Chen, R. Aliyev",
    journal: "Journal of Materials Science",
    year: 2024,
    abstract: "This study presents a novel ML framework for predicting yield strength and hardness of high-entropy alloys using composition and processing parameters.",
    url: "https://link.springer.com/journal/10853",
    tags: ["Machine Learning", "High-Entropy Alloys", "Mechanical Properties"],
  },
  {
    id: "ra2",
    title: "Microstructural Evolution During Friction Stir Welding of AA6061",
    authors: "E. Petrova, B. Nishonov",
    journal: "Welding Journal",
    year: 2023,
    abstract: "Investigation of grain refinement mechanisms and texture development in friction stir welded aluminum alloy joints.",
    url: "https://www.aws.org/wj",
    tags: ["Welding", "Microstructure", "Aluminum"],
  },
  {
    id: "ra3",
    title: "Digital Twin Framework for Smart Manufacturing Systems",
    authors: "R. Aliyev, S. Chen",
    journal: "Journal of Manufacturing Systems",
    year: 2024,
    abstract: "A comprehensive digital twin architecture for real-time monitoring and predictive maintenance in Industry 4.0 environments.",
    url: "https://www.sciencedirect.com/journal/journal-of-manufacturing-systems",
    tags: ["Digital Twin", "Industry 4.0", "Smart Manufacturing"],
  },
  {
    id: "ra4",
    title: "Fatigue Crack Growth in Additively Manufactured Ti-6Al-4V",
    authors: "D. Rustamova, A. Karimov",
    journal: "International Journal of Fatigue",
    year: 2023,
    abstract: "Experimental study of fatigue crack propagation behavior in electron beam melted titanium alloy with various build orientations.",
    url: "https://www.sciencedirect.com/journal/international-journal-of-fatigue",
    tags: ["Fatigue", "Additive Manufacturing", "Titanium"],
  },
  {
    id: "ra5",
    title: "Advanced Powder Metallurgy Techniques for Aerospace Components",
    authors: "B. Nishonov",
    journal: "Powder Metallurgy Progress",
    year: 2024,
    abstract: "Review of hot isostatic pressing and spark plasma sintering for producing high-performance aerospace structural components.",
    url: "https://www.degruyter.com/journal/key/pmp/html",
    tags: ["Powder Metallurgy", "Aerospace", "HIP"],
  },
  {
    id: "ra6",
    title: "Topology Optimization for Lightweight Automotive Structures",
    authors: "M. Zhang, K. Usmanov",
    journal: "Structural and Multidisciplinary Optimization",
    year: 2024,
    abstract: "Application of density-based topology optimization methods for reducing mass of automotive chassis components while maintaining structural integrity.",
    url: "https://link.springer.com/journal/158",
    tags: ["Topology Optimization", "Automotive", "FEA"],
  },
];

export const researchLinks: ResearchLink[] = [
  {
    id: "rl1",
    name: "ScienceDirect",
    description: "Leading platform for peer-reviewed scientific literature across all disciplines.",
    url: "https://www.sciencedirect.com",
    category: "Journals",
  },
  {
    id: "rl2",
    name: "Google Scholar",
    description: "Free search engine for scholarly articles, theses, books, and conference papers.",
    url: "https://scholar.google.com",
    category: "Search",
  },
  {
    id: "rl3",
    name: "ResearchGate",
    description: "Social networking site for scientists and researchers to share papers and collaborate.",
    url: "https://www.researchgate.net",
    category: "Network",
  },
  {
    id: "rl4",
    name: "ASM International",
    description: "Professional organization for materials scientists and engineers with extensive resources.",
    url: "https://www.asminternational.org",
    category: "Organization",
  },
  {
    id: "rl5",
    name: "arXiv — Materials Science",
    description: "Open-access archive for preprints in materials science and condensed matter physics.",
    url: "https://arxiv.org/list/cond-mat/recent",
    category: "Preprints",
  },
  {
    id: "rl6",
    name: "NIST Materials Data",
    description: "National Institute of Standards and Technology materials property database.",
    url: "https://www.nist.gov/mml",
    category: "Database",
  },
];

export const usefulWebsites: UsefulWebsite[] = [
  {
    id: "uw1",
    name: "MIT OpenCourseWare",
    description: "Free lecture notes, exams, and videos from MIT's mechanical engineering department.",
    url: "https://ocw.mit.edu/courses/mechanical-engineering/",
    icon: "🎓",
    category: "Education",
  },
  {
    id: "uw2",
    name: "Engineering Toolbox",
    description: "Comprehensive reference for engineering formulas, calculators, and material properties.",
    url: "https://www.engineeringtoolbox.com",
    icon: "🔧",
    category: "Reference",
  },
  {
    id: "uw3",
    name: "MatWeb",
    description: "Database of material property data sheets for thousands of engineering materials.",
    url: "https://www.matweb.com",
    icon: "📊",
    category: "Database",
  },
  {
    id: "uw4",
    name: "GrabCAD",
    description: "Community library of free CAD models, tutorials, and engineering resources.",
    url: "https://grabcad.com/library",
    icon: "📐",
    category: "CAD",
  },
  {
    id: "uw5",
    name: "NPTEL",
    description: "National Programme on Technology Enhanced Learning — free courses from Indian IITs.",
    url: "https://nptel.ac.in/courses/mechanical-engineering",
    icon: "🇮🇳",
    category: "Education",
  },
  {
    id: "uw6",
    name: "Coursera Engineering",
    description: "Online courses from top universities covering mechanics, thermodynamics, and more.",
    url: "https://www.coursera.org/browse/physical-science-and-engineering/mechanical-engineering",
    icon: "🌐",
    category: "Education",
  },
  {
    id: "uw7",
    name: "eFunda",
    description: "Engineering fundamentals reference with calculators, formulas, and design guides.",
    url: "https://www.efunda.com",
    icon: "📘",
    category: "Reference",
  },
  {
    id: "uw8",
    name: "Springer Materials",
    description: "World's largest curated materials properties database for scientists and engineers.",
    url: "https://materials.springer.com",
    icon: "🧪",
    category: "Database",
  },
];

export const virtualLabs: VirtualLab[] = [
  {
    id: "vl1",
    name: "PhET Interactive Simulations",
    description: "Free interactive math and science simulations from the University of Colorado.",
    url: "https://phet.colorado.edu/en/simulations/filter?subjects=physics",
    icon: "⚡",
    type: "Physics",
    embeddable: true,
    embedUrl: "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html",
    filterCategory: "Physics",
  },
  {
    id: "vl2",
    name: "SimScale",
    description: "Cloud-based simulation platform for CFD, FEA, and thermal analysis.",
    url: "https://www.simscale.com",
    icon: "🌊",
    type: "CFD/FEA",
    embeddable: false,
    filterCategory: "Simulation",
  },
  {
    id: "vl3",
    name: "Onshape",
    description: "Free cloud-based CAD platform for 3D modeling and product design.",
    url: "https://www.onshape.com/en/education",
    icon: "🏗️",
    type: "CAD",
    embeddable: false,
    filterCategory: "CAD",
  },
  {
    id: "vl4",
    name: "Tinkercad",
    description: "Free browser-based 3D design, electronics, and coding tool by Autodesk.",
    url: "https://www.tinkercad.com",
    icon: "🎨",
    type: "3D Design",
    embeddable: false,
    filterCategory: "CAD",
  },
  {
    id: "vl5",
    name: "Virtual Labs (IIT)",
    description: "Remote laboratory experiments in mechanical engineering from Indian IITs.",
    url: "https://www.vlab.co.in",
    icon: "🔬",
    type: "Lab",
    embeddable: false,
    filterCategory: "Simulation",
  },
  {
    id: "vl6",
    name: "MATLAB Online",
    description: "Access MATLAB through a browser for numerical computation and visualization.",
    url: "https://matlab.mathworks.com",
    icon: "📈",
    type: "Computation",
    embeddable: false,
    filterCategory: "Computation",
  },
  {
    id: "vl7",
    name: "SketchUp Free",
    description: "Free web-based 3D modeling tool for creating mechanical designs and prototypes.",
    url: "https://app.sketchup.com",
    icon: "✏️",
    type: "3D Design",
    embeddable: false,
    filterCategory: "CAD",
  },
  {
    id: "vl8",
    name: "Wolfram Alpha",
    description: "Computational knowledge engine for solving engineering math and physics problems.",
    url: "https://www.wolframalpha.com",
    icon: "🧮",
    type: "Computation",
    embeddable: false,
    filterCategory: "Computation",
  },
];

export const innovationIdeas: InnovationIdea[] = [
  {
    id: "ii1",
    title: "Self-Healing Materials for Automotive Bodies",
    description: "Research polymer-metal composites that can autonomously repair micro-cracks and surface damage, extending vehicle lifespan.",
    field: "Materials Science",
    difficulty: "advanced",
    tags: ["Smart Materials", "Automotive", "Self-Healing"],
  },
  {
    id: "ii2",
    title: "3D-Printed Prosthetic Limbs with Haptic Feedback",
    description: "Design affordable prosthetics using additive manufacturing with integrated sensors for touch and pressure feedback.",
    field: "Biomedical Engineering",
    difficulty: "advanced",
    tags: ["3D Printing", "Prosthetics", "Sensors"],
  },
  {
    id: "ii3",
    title: "Solar-Powered Water Purification System",
    description: "Build a portable, solar-driven water purification device for rural communities using thermoelectric principles.",
    field: "Energy & Environment",
    difficulty: "intermediate",
    tags: ["Solar Energy", "Water", "Sustainability"],
  },
  {
    id: "ii4",
    title: "AI-Powered Predictive Maintenance for CNC Machines",
    description: "Develop a machine learning model that predicts tool wear and failure in CNC machining using vibration and acoustic data.",
    field: "Manufacturing",
    difficulty: "intermediate",
    tags: ["AI/ML", "CNC", "Industry 4.0"],
  },
  {
    id: "ii5",
    title: "Miniature Wind Turbine for Urban Buildings",
    description: "Design a compact vertical-axis wind turbine optimized for low-speed urban wind conditions on rooftops.",
    field: "Energy & Environment",
    difficulty: "beginner",
    tags: ["Wind Energy", "Urban", "Renewable"],
  },
  {
    id: "ii6",
    title: "Shape Memory Alloy Actuators for Soft Robotics",
    description: "Explore NiTi shape memory alloys as lightweight actuators for flexible robotic grippers and manipulators.",
    field: "Robotics",
    difficulty: "advanced",
    tags: ["SMA", "Soft Robotics", "Actuators"],
  },
  {
    id: "ii7",
    title: "Waste Heat Recovery System for Factories",
    description: "Design a thermoelectric generator system that converts industrial waste heat into usable electrical energy.",
    field: "Thermodynamics",
    difficulty: "intermediate",
    tags: ["Thermoelectrics", "Waste Heat", "Energy"],
  },
  {
    id: "ii8",
    title: "Automated Sorting Robot for Recycling",
    description: "Build a computer vision-based robot that identifies and sorts recyclable materials on a conveyor belt.",
    field: "Robotics",
    difficulty: "beginner",
    tags: ["Computer Vision", "Recycling", "Automation"],
  },
];
