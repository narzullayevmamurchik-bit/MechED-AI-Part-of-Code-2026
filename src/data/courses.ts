export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "reading" | "quiz";
  completed: boolean;
  videoUrl?: string;
  pdfUrl?: string;
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Quiz {
  id: string;
  title: string;
  questions: number;
  duration: string;
  score?: number;
  completed: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  lessons: number;
  duration: string;
  icon: string;
  chapters: Chapter[];
  quizzes: Quiz[];
}

export const courses: Course[] = [
  {
    id: "practical-metallurgy",
    title: "Practical Metallurgy",
    description: "Hands-on metallurgical processes, microstructure analysis and metal forming techniques",
    progress: 72,
    lessons: 24,
    duration: "18h 30m",
    icon: "🔬",
    chapters: [
      {
        id: "pm-1", title: "Introduction to Metallurgy",
        lessons: [
          { id: "pm-1-1", title: "History of Metallurgy", duration: "25m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
          { id: "pm-1-2", title: "Classification of Metals", duration: "30m", type: "reading", completed: true, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
          { id: "pm-1-3", title: "Lab Safety Protocols", duration: "20m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
        ],
      },
      {
        id: "pm-2", title: "Microstructure Analysis",
        lessons: [
          { id: "pm-2-1", title: "Optical Microscopy Techniques", duration: "35m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/Ao41FrJFgvQ" },
          { id: "pm-2-2", title: "Sample Preparation", duration: "40m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/R0sw85RkKCY" },
          { id: "pm-2-3", title: "Grain Size Measurement", duration: "30m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
      {
        id: "pm-3", title: "Metal Forming",
        lessons: [
          { id: "pm-3-1", title: "Rolling Processes", duration: "45m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
          { id: "pm-3-2", title: "Forging Fundamentals", duration: "40m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
          { id: "pm-3-3", title: "Extrusion Methods", duration: "35m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
    ],
    quizzes: [
      { id: "pm-q1", title: "Metallurgy Fundamentals Quiz", questions: 15, duration: "20m", score: 88, completed: true },
      { id: "pm-q2", title: "Microstructure Analysis Quiz", questions: 12, duration: "15m", completed: false },
      { id: "pm-q3", title: "Metal Forming Quiz", questions: 10, duration: "15m", completed: false },
    ],
  },
  {
    id: "steel-applications",
    title: "Steel Applications",
    description: "Structural steel design, welding metallurgy and industrial steel usage",
    progress: 45,
    lessons: 20,
    duration: "15h 00m",
    icon: "🏗️",
    chapters: [
      {
        id: "sa-1", title: "Structural Steel Design",
        lessons: [
          { id: "sa-1-1", title: "Steel Grades & Standards", duration: "30m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/2He92NhilME" },
          { id: "sa-1-2", title: "Load-Bearing Calculations", duration: "45m", type: "reading", completed: true, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
          { id: "sa-1-3", title: "Connection Design", duration: "35m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/2He92NhilME" },
        ],
      },
      {
        id: "sa-2", title: "Welding Metallurgy",
        lessons: [
          { id: "sa-2-1", title: "Welding Processes Overview", duration: "40m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
          { id: "sa-2-2", title: "Heat-Affected Zone", duration: "30m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
          { id: "sa-2-3", title: "Weld Defects & Inspection", duration: "35m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
        ],
      },
    ],
    quizzes: [
      { id: "sa-q1", title: "Structural Steel Quiz", questions: 12, duration: "15m", score: 75, completed: true },
      { id: "sa-q2", title: "Welding Metallurgy Quiz", questions: 10, duration: "15m", completed: false },
    ],
  },
  {
    id: "special-steel-technology",
    title: "Special Steel Technology",
    description: "Stainless steels, tool steels, high-speed steels and advanced alloy systems",
    progress: 18,
    lessons: 18,
    duration: "14h 00m",
    icon: "⚙️",
    chapters: [
      {
        id: "sst-1", title: "Stainless Steels",
        lessons: [
          { id: "sst-1-1", title: "Austenitic Stainless Steels", duration: "35m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
          { id: "sst-1-2", title: "Ferritic & Martensitic Types", duration: "30m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
          { id: "sst-1-3", title: "Corrosion Resistance", duration: "40m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
        ],
      },
      {
        id: "sst-2", title: "Tool & High-Speed Steels",
        lessons: [
          { id: "sst-2-1", title: "Tool Steel Classification", duration: "30m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/2He92NhilME" },
          { id: "sst-2-2", title: "Heat Treatment of Tool Steels", duration: "45m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/2He92NhilME" },
        ],
      },
    ],
    quizzes: [
      { id: "sst-q1", title: "Stainless Steel Quiz", questions: 10, duration: "15m", completed: false },
    ],
  },
  {
    id: "material-science",
    title: "Material Science",
    description: "Crystal structures, phase diagrams, material properties and characterization methods",
    progress: 90,
    lessons: 22,
    duration: "16h 00m",
    icon: "🧪",
    chapters: [
      {
        id: "ms-1", title: "Crystal Structures",
        lessons: [
          { id: "ms-1-1", title: "Unit Cells & Lattice Types", duration: "35m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/R0sw85RkKCY" },
          { id: "ms-1-2", title: "Miller Indices", duration: "30m", type: "reading", completed: true, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
          { id: "ms-1-3", title: "Defects in Crystals", duration: "40m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/WuclTFbINq4" },
        ],
      },
      {
        id: "ms-2", title: "Phase Diagrams",
        lessons: [
          { id: "ms-2-1", title: "Binary Phase Diagrams", duration: "45m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/Ao41FrJFgvQ" },
          { id: "ms-2-2", title: "Iron-Carbon Diagram", duration: "50m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
          { id: "ms-2-3", title: "Lever Rule Applications", duration: "30m", type: "reading", completed: true, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
    ],
    quizzes: [
      { id: "ms-q1", title: "Crystal Structures Quiz", questions: 15, duration: "20m", score: 92, completed: true },
      { id: "ms-q2", title: "Phase Diagrams Quiz", questions: 12, duration: "15m", score: 88, completed: true },
    ],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    description: "ML algorithms, neural networks and data-driven engineering applications",
    progress: 30,
    lessons: 20,
    duration: "16h 00m",
    icon: "🤖",
    chapters: [
      {
        id: "ml-1", title: "ML Fundamentals",
        lessons: [
          { id: "ml-1-1", title: "Supervised vs Unsupervised Learning", duration: "35m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/BUTjcAjfMgY" },
          { id: "ml-1-2", title: "Linear Regression", duration: "40m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/BUTjcAjfMgY" },
          { id: "ml-1-3", title: "Data Preprocessing", duration: "30m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
      {
        id: "ml-2", title: "Neural Networks",
        lessons: [
          { id: "ml-2-1", title: "Perceptrons & Activation Functions", duration: "45m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/BUTjcAjfMgY" },
          { id: "ml-2-2", title: "Backpropagation", duration: "50m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/BUTjcAjfMgY" },
        ],
      },
    ],
    quizzes: [
      { id: "ml-q1", title: "ML Basics Quiz", questions: 12, duration: "15m", score: 80, completed: true },
      { id: "ml-q2", title: "Neural Networks Quiz", questions: 10, duration: "15m", completed: false },
    ],
  },
  {
    id: "mechanical-properties",
    title: "Mechanical Properties",
    description: "Tensile strength, hardness, fatigue, fracture mechanics and testing methods",
    progress: 55,
    lessons: 16,
    duration: "12h 00m",
    icon: "💪",
    chapters: [
      {
        id: "mp-1", title: "Strength & Hardness",
        lessons: [
          { id: "mp-1-1", title: "Tensile Testing", duration: "35m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/4czuI4OAyro" },
          { id: "mp-1-2", title: "Hardness Testing Methods", duration: "30m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/Ug6RIeJGDn8" },
          { id: "mp-1-3", title: "Stress-Strain Curves", duration: "40m", type: "reading", completed: true, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
      {
        id: "mp-2", title: "Fatigue & Fracture",
        lessons: [
          { id: "mp-2-1", title: "Fatigue Life Prediction", duration: "45m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/o502uqywKKg" },
          { id: "mp-2-2", title: "Fracture Mechanics Basics", duration: "40m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/o502uqywKKg" },
        ],
      },
    ],
    quizzes: [
      { id: "mp-q1", title: "Strength & Hardness Quiz", questions: 12, duration: "15m", score: 85, completed: true },
      { id: "mp-q2", title: "Fracture Mechanics Quiz", questions: 10, duration: "15m", completed: false },
    ],
  },
  {
    id: "metallic-material-technology",
    title: "Metallic Material Technology",
    description: "Non-ferrous alloys, casting, powder metallurgy and surface treatments",
    progress: 40,
    lessons: 18,
    duration: "14h 00m",
    icon: "🔩",
    chapters: [
      {
        id: "mmt-1", title: "Non-Ferrous Alloys",
        lessons: [
          { id: "mmt-1-1", title: "Aluminum Alloys", duration: "35m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/Ao41FrJFgvQ" },
          { id: "mmt-1-2", title: "Copper & Titanium Alloys", duration: "40m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/R0sw85RkKCY" },
          { id: "mmt-1-3", title: "Nickel-Based Superalloys", duration: "30m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
      {
        id: "mmt-2", title: "Casting & Powder Metallurgy",
        lessons: [
          { id: "mmt-2-1", title: "Sand Casting", duration: "35m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
          { id: "mmt-2-2", title: "Powder Metallurgy Process", duration: "40m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/zCznMbj2Yn4" },
        ],
      },
    ],
    quizzes: [
      { id: "mmt-q1", title: "Non-Ferrous Alloys Quiz", questions: 10, duration: "15m", score: 78, completed: true },
      { id: "mmt-q2", title: "Casting Methods Quiz", questions: 8, duration: "12m", completed: false },
    ],
  },
  {
    id: "robotics-mechatronics",
    title: "Robotics & Mechatronics",
    description: "Robot kinematics, sensors, actuators and integrated mechanical-electronic systems",
    progress: 25,
    lessons: 22,
    duration: "18h 00m",
    icon: "🦾",
    chapters: [
      {
        id: "rm-1", title: "Robot Kinematics",
        lessons: [
          { id: "rm-1-1", title: "Forward Kinematics", duration: "40m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/K_xIJBlbjg4" },
          { id: "rm-1-2", title: "Inverse Kinematics", duration: "45m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/K_xIJBlbjg4" },
          { id: "rm-1-3", title: "DH Parameters", duration: "35m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
      {
        id: "rm-2", title: "Sensors & Actuators",
        lessons: [
          { id: "rm-2-1", title: "Sensor Types & Selection", duration: "30m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/K_xIJBlbjg4" },
          { id: "rm-2-2", title: "Electric Actuators", duration: "35m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/K_xIJBlbjg4" },
        ],
      },
    ],
    quizzes: [
      { id: "rm-q1", title: "Kinematics Quiz", questions: 12, duration: "15m", score: 70, completed: true },
      { id: "rm-q2", title: "Sensors & Actuators Quiz", questions: 10, duration: "15m", completed: false },
    ],
  },
  {
    id: "ai-innovation-engineering",
    title: "AI & Innovation Engineering",
    description: "AI-driven design, generative engineering, optimization and smart manufacturing",
    progress: 10,
    lessons: 20,
    duration: "16h 00m",
    icon: "🧠",
    chapters: [
      {
        id: "aie-1", title: "AI-Driven Design",
        lessons: [
          { id: "aie-1-1", title: "Generative Design Principles", duration: "40m", type: "video", completed: true, videoUrl: "https://www.youtube.com/embed/BUTjcAjfMgY" },
          { id: "aie-1-2", title: "Topology Optimization", duration: "45m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
      {
        id: "aie-2", title: "Smart Manufacturing",
        lessons: [
          { id: "aie-2-1", title: "Industry 4.0 Overview", duration: "35m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/ODeXeYR0h-M" },
          { id: "aie-2-2", title: "Digital Twins", duration: "40m", type: "video", completed: false, videoUrl: "https://www.youtube.com/embed/vFQoEmCwd98" },
          { id: "aie-2-3", title: "Predictive Maintenance", duration: "35m", type: "reading", completed: false, pdfUrl: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" },
        ],
      },
    ],
    quizzes: [
      { id: "aie-q1", title: "AI Design Quiz", questions: 10, duration: "15m", completed: false },
      { id: "aie-q2", title: "Smart Manufacturing Quiz", questions: 12, duration: "15m", completed: false },
    ],
  },
];
