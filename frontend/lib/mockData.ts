export interface Skill {
  name: string;
  classification: "language" | "content" | "mixed" | "ontrack";
  explanation: string;
}

export interface Quest {
  id: string;
  title: string;
  skillTag: string;
  totalItems: number;
  completedItems: number;
  xpReward: number;
  status: "in_progress" | "not_started" | "completed";
}

export interface Student {
  id: string;
  name: string;
  grade: number;
  classification: "language" | "content" | "mixed" | "ontrack";
  xp: number;
  level: number;
  xpToNextLevel: number;
  streakDays: number;
  skills: Skill[];
  quests: Quest[];
}

export interface DiagnosticQuestion {
  id: string;
  subject: string;
  skill: string;
  grade: number;
  questionEs: string;
  choicesEs: string[];
  correctAnswer: number;
  questionEn: string;
  choicesEn: string[];
}

export interface LeaderboardEntry {
  name: string;
  level: number;
  weeklyXP: number;
}

export const mockTeacher = {
  id: "t1",
  name: "Ms. Rodriguez",
  email: "rodriguez@school.edu",
  school: "Greenwood Academy",
};

export const mockStudents: Student[] = [
  {
    id: "s1",
    name: "Maria Gonzalez",
    grade: 5,
    classification: "language",
    xp: 340,
    level: 4,
    xpToNextLevel: 500,
    streakDays: 5,
    skills: [
      {
        name: "Fractions",
        classification: "language",
        explanation:
          "Maria answered 5/6 fraction questions correctly in Spanish but only 2/6 in English. Her math knowledge is at grade level. The barrier is English academic vocabulary in word problems.",
      },
      {
        name: "Inference",
        classification: "language",
        explanation:
          "Scored 4/5 on inference questions in Spanish vs 1/5 in English. She can identify implied meaning when she understands the text.",
      },
      {
        name: "Geometry",
        classification: "content",
        explanation:
          "Scored 1/4 in both English and Spanish. Maria needs instruction on area and perimeter concepts.",
      },
    ],
    quests: [
      {
        id: "q1",
        title: "Master Math Word Problems",
        skillTag: "Fractions",
        totalItems: 8,
        completedItems: 3,
        xpReward: 120,
        status: "in_progress",
      },
      {
        id: "q2",
        title: "Reading Between the Lines",
        skillTag: "Inference",
        totalItems: 6,
        completedItems: 0,
        xpReward: 90,
        status: "not_started",
      },
    ],
  },
  {
    id: "s2",
    name: "Carlos Rivera",
    grade: 5,
    classification: "content",
    xp: 180,
    level: 2,
    xpToNextLevel: 300,
    streakDays: 2,
    skills: [
      {
        name: "Fractions",
        classification: "content",
        explanation:
          "Scored 2/6 in both English and Spanish. Carlos needs foundational work on fraction operations.",
      },
      {
        name: "Author's Purpose",
        classification: "language",
        explanation:
          "Scored 3/4 in Spanish but 0/4 in English. He understands rhetorical intent but can't parse the English phrasing.",
      },
    ],
    quests: [
      {
        id: "q3",
        title: "Fraction Foundations",
        skillTag: "Fractions",
        totalItems: 10,
        completedItems: 1,
        xpReward: 150,
        status: "in_progress",
      },
    ],
  },
  {
    id: "s3",
    name: "Sofia Herrera",
    grade: 5,
    classification: "language",
    xp: 520,
    level: 6,
    xpToNextLevel: 600,
    streakDays: 8,
    skills: [
      {
        name: "Multiplication",
        classification: "language",
        explanation:
          "Perfect score in Spanish (6/6), but only 3/6 in English. Sofia fully understands multiplication. The barrier is English word problem phrasing.",
      },
      {
        name: "Main Idea",
        classification: "language",
        explanation:
          "4/5 in Spanish, 1/5 in English. She identifies central themes easily in her native language.",
      },
      {
        name: "Vocabulary in Context",
        classification: "language",
        explanation:
          "5/5 in Spanish, 2/5 in English. She understands contextual vocabulary use but needs English-specific academic word knowledge.",
      },
    ],
    quests: [
      {
        id: "q4",
        title: "English Math Vocabulary",
        skillTag: "Multiplication",
        totalItems: 6,
        completedItems: 6,
        xpReward: 90,
        status: "completed",
      },
      {
        id: "q5",
        title: "Finding the Main Idea",
        skillTag: "Main Idea",
        totalItems: 8,
        completedItems: 5,
        xpReward: 120,
        status: "in_progress",
      },
    ],
  },
  {
    id: "s4",
    name: "Diego Martinez",
    grade: 5,
    classification: "mixed",
    xp: 90,
    level: 1,
    xpToNextLevel: 100,
    streakDays: 1,
    skills: [
      {
        name: "Division",
        classification: "content",
        explanation:
          "Scored 1/5 in both languages. Diego needs instruction on long division concepts.",
      },
      {
        name: "Cause and Effect",
        classification: "language",
        explanation:
          "3/4 in Spanish, 0/4 in English. Understands causal reasoning but struggles with English conditional phrasing.",
      },
    ],
    quests: [],
  },
  {
    id: "s5",
    name: "Isabella Lopez",
    grade: 5,
    classification: "ontrack",
    xp: 410,
    level: 5,
    xpToNextLevel: 500,
    streakDays: 6,
    skills: [
      {
        name: "Fractions",
        classification: "ontrack",
        explanation: "Scored 5/6 in English. No re-test needed.",
      },
      {
        name: "Inference",
        classification: "ontrack",
        explanation: "Scored 4/5 in English. No re-test needed.",
      },
    ],
    quests: [],
  },
  {
    id: "s6",
    name: "Mateo Ruiz",
    grade: 5,
    classification: "language",
    xp: 270,
    level: 3,
    xpToNextLevel: 400,
    streakDays: 4,
    skills: [
      {
        name: "Fractions",
        classification: "language",
        explanation:
          "Scored 5/6 in Spanish, 2/6 in English. Mateo understands fractions but struggles with English word problems.",
      },
    ],
    quests: [
      {
        id: "q6",
        title: "Math Word Problems",
        skillTag: "Fractions",
        totalItems: 8,
        completedItems: 2,
        xpReward: 120,
        status: "in_progress",
      },
    ],
  },
  {
    id: "s7",
    name: "Valentina Cruz",
    grade: 5,
    classification: "language",
    xp: 310,
    level: 4,
    xpToNextLevel: 500,
    streakDays: 3,
    skills: [
      {
        name: "Main Idea",
        classification: "language",
        explanation:
          "4/5 in Spanish, 1/5 in English. Valentina identifies themes well in Spanish.",
      },
    ],
    quests: [],
  },
  {
    id: "s8",
    name: "Lucas Morales",
    grade: 5,
    classification: "content",
    xp: 60,
    level: 1,
    xpToNextLevel: 100,
    streakDays: 0,
    skills: [
      {
        name: "Division",
        classification: "content",
        explanation:
          "Scored 1/5 in both languages. Lucas needs foundational work on division.",
      },
    ],
    quests: [],
  },
  {
    id: "s9",
    name: "Camila Reyes",
    grade: 5,
    classification: "language",
    xp: 440,
    level: 5,
    xpToNextLevel: 500,
    streakDays: 7,
    skills: [
      {
        name: "Inference",
        classification: "language",
        explanation:
          "5/5 in Spanish, 2/5 in English. Camila excels at inference in her native language.",
      },
    ],
    quests: [],
  },
  {
    id: "s10",
    name: "Sebastian Torres",
    grade: 5,
    classification: "mixed",
    xp: 150,
    level: 2,
    xpToNextLevel: 300,
    streakDays: 2,
    skills: [
      {
        name: "Geometry",
        classification: "content",
        explanation: "Scored 2/4 in both languages. Needs geometry instruction.",
      },
      {
        name: "Author's Purpose",
        classification: "language",
        explanation:
          "3/4 in Spanish, 1/4 in English. Understands purpose but not English phrasing.",
      },
    ],
    quests: [],
  },
  {
    id: "s11",
    name: "Emilia Vargas",
    grade: 5,
    classification: "language",
    xp: 380,
    level: 4,
    xpToNextLevel: 500,
    streakDays: 5,
    skills: [
      {
        name: "Vocabulary in Context",
        classification: "language",
        explanation:
          "4/5 in Spanish, 1/5 in English. Emilia needs English academic vocabulary support.",
      },
    ],
    quests: [],
  },
  {
    id: "s12",
    name: "Daniel Flores",
    grade: 5,
    classification: "content",
    xp: 120,
    level: 2,
    xpToNextLevel: 300,
    streakDays: 1,
    skills: [
      {
        name: "Fractions",
        classification: "content",
        explanation:
          "Scored 2/6 in both languages. Daniel needs foundational fraction work.",
      },
    ],
    quests: [],
  },
  {
    id: "s13",
    name: "Victoria Sandoval",
    grade: 5,
    classification: "language",
    xp: 490,
    level: 5,
    xpToNextLevel: 500,
    streakDays: 9,
    skills: [
      {
        name: "Multiplication",
        classification: "language",
        explanation:
          "6/6 in Spanish, 3/6 in English. Victoria knows multiplication — the barrier is English phrasing.",
      },
    ],
    quests: [],
  },
  {
    id: "s14",
    name: "Alejandro Nunez",
    grade: 5,
    classification: "mixed",
    xp: 200,
    level: 3,
    xpToNextLevel: 400,
    streakDays: 3,
    skills: [
      {
        name: "Division",
        classification: "content",
        explanation: "Scored 2/5 in both languages. Needs division instruction.",
      },
      {
        name: "Cause and Effect",
        classification: "language",
        explanation:
          "4/4 in Spanish, 1/4 in English. Understands causation but not English conditional phrasing.",
      },
    ],
    quests: [],
  },
  {
    id: "s15",
    name: "Ana Castillo",
    grade: 5,
    classification: "language",
    xp: 360,
    level: 4,
    xpToNextLevel: 500,
    streakDays: 4,
    skills: [
      {
        name: "Main Idea",
        classification: "language",
        explanation:
          "5/5 in Spanish, 2/5 in English. Ana identifies main ideas perfectly in Spanish.",
      },
    ],
    quests: [],
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { name: "Victoria Sandoval", level: 5, weeklyXP: 210 },
  { name: "Sofia Herrera", level: 6, weeklyXP: 185 },
  { name: "Camila Reyes", level: 5, weeklyXP: 170 },
  { name: "Maria Gonzalez", level: 4, weeklyXP: 145 },
  { name: "Isabella Lopez", level: 5, weeklyXP: 130 },
  { name: "Emilia Vargas", level: 4, weeklyXP: 120 },
  { name: "Ana Castillo", level: 4, weeklyXP: 115 },
  { name: "Valentina Cruz", level: 4, weeklyXP: 100 },
  { name: "Mateo Ruiz", level: 3, weeklyXP: 90 },
  { name: "Alejandro Nunez", level: 3, weeklyXP: 75 },
];

export const mockDiagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: "dq1",
    subject: "Math",
    skill: "Fractions",
    grade: 5,
    questionEs:
      "Maria tiene 3/4 de una pizza. Ella come 1/4. Que fraccion de la pizza le queda?",
    choicesEs: ["1/2", "2/4", "1/4", "3/4"],
    correctAnswer: 0,
    questionEn:
      "Maria has 3/4 of a pizza. She eats 1/4. What fraction of the pizza is left?",
    choicesEn: ["1/2", "2/4", "1/4", "3/4"],
  },
  {
    id: "dq2",
    subject: "ELA",
    skill: "Inference",
    grade: 5,
    questionEs:
      "Juan miro por la ventana y suspiro. Las hojas caian de los arboles y el cielo estaba gris. Que estacion del ano es probablemente?",
    choicesEs: ["Primavera", "Verano", "Otono", "Invierno"],
    correctAnswer: 2,
    questionEn:
      "Juan looked out the window and sighed. The leaves were falling from the trees and the sky was gray. What season is it probably?",
    choicesEn: ["Spring", "Summer", "Fall", "Winter"],
  },
  {
    id: "dq3",
    subject: "Math",
    skill: "Multiplication",
    grade: 5,
    questionEs:
      "Una tienda vende cajas de lapices. Cada caja tiene 12 lapices. Si la maestra compra 8 cajas, cuantos lapices tiene en total?",
    choicesEs: ["84", "92", "96", "108"],
    correctAnswer: 2,
    questionEn:
      "A store sells boxes of pencils. Each box has 12 pencils. If the teacher buys 8 boxes, how many pencils does she have in total?",
    choicesEn: ["84", "92", "96", "108"],
  },
  {
    id: "dq4",
    subject: "ELA",
    skill: "Main Idea",
    grade: 5,
    questionEs:
      "Los delfines son mamiferos que viven en el oceano. Respiran aire, cuidan a sus crias, y son muy inteligentes. Pueden comunicarse usando sonidos y trabajan en grupo para encontrar comida. Cual es la idea principal?",
    choicesEs: [
      "Los delfines comen pescado",
      "Los delfines son mamiferos inteligentes que viven en el oceano",
      "Los delfines viven solos",
      "Los delfines no pueden respirar bajo el agua",
    ],
    correctAnswer: 1,
    questionEn:
      "Dolphins are mammals that live in the ocean. They breathe air, care for their young, and are very intelligent. They can communicate using sounds and work in groups to find food. What is the main idea?",
    choicesEn: [
      "Dolphins eat fish",
      "Dolphins are intelligent mammals that live in the ocean",
      "Dolphins live alone",
      "Dolphins cannot breathe underwater",
    ],
  },
  {
    id: "dq5",
    subject: "ELA",
    skill: "Author's Purpose",
    grade: 5,
    questionEs:
      "Lee el siguiente parrafo: 'Deberias reciclar porque ayuda al planeta. Cada botella que reciclas ahorra energia y reduce la basura.' Cual es el proposito del autor?",
    choicesEs: ["Entretener", "Informar", "Persuadir", "Describir"],
    correctAnswer: 2,
    questionEn:
      "Read the following paragraph: 'You should recycle because it helps the planet. Every bottle you recycle saves energy and reduces waste.' What is the author's purpose?",
    choicesEn: ["To entertain", "To inform", "To persuade", "To describe"],
  },
];

export const levelThresholds = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 250 },
  { level: 4, xpRequired: 450 },
  { level: 5, xpRequired: 700 },
  { level: 6, xpRequired: 1000 },
  { level: 7, xpRequired: 1400 },
  { level: 8, xpRequired: 1900 },
  { level: 9, xpRequired: 2500 },
  { level: 10, xpRequired: 3200 },
];

export function getClassificationColor(classification: string) {
  switch (classification) {
    case "language":
      return { bg: "bg-teal", text: "text-white", dot: "bg-teal", label: "Language Barrier" };
    case "content":
      return { bg: "bg-coral", text: "text-white", dot: "bg-coral", label: "Content Gap" };
    case "mixed":
      return { bg: "bg-warning", text: "text-white", dot: "bg-warning", label: "Mixed" };
    case "ontrack":
      return { bg: "bg-success", text: "text-white", dot: "bg-success", label: "On Track" };
    default:
      return { bg: "bg-gray-200", text: "text-gray-700", dot: "bg-gray-400", label: "Unknown" };
  }
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function getInitialsBgColor(name: string) {
  const colors = ["bg-teal", "bg-coral", "bg-navy", "bg-warning", "bg-success"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
