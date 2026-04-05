export type Language = "en" | "es";

type TranslationEntry = { en: string; es: string };

const translations: Record<string, TranslationEntry> = {
  // ── Nav / Shared ──
  "nav.dashboard": { en: "Dashboard", es: "Tablero" },
  "nav.resources": { en: "Resources", es: "Recursos" },
  "nav.messages": { en: "Messages", es: "Mensajes" },

  // ── Sidebar ──
  "sidebar.classes": { en: "Classes", es: "Clases" },
  "sidebar.assignments": { en: "Assignments", es: "Tareas" },
  "sidebar.library": { en: "Library", es: "Biblioteca" },
  "sidebar.reports": { en: "Reports", es: "Reportes" },
  "sidebar.assignPractice": { en: "Assign Practice", es: "Asignar Práctica" },
  "sidebar.settings": { en: "Settings", es: "Configuración" },
  "sidebar.help": { en: "Help", es: "Ayuda" },

  // ── Landing Page ──
  "landing.heroLine1": { en: "Know What They", es: "Saber Lo Que" },
  "landing.heroHighlight": { en: "Know", es: "Saben" },
  "landing.subtitle": {
    en: "AI-powered diagnostics that separate language barriers from knowledge gaps for English Language Learners.",
    es: "Diagnósticos impulsados por IA que separan las barreras del idioma de las brechas de conocimiento para estudiantes de inglés.",
  },
  "landing.teacherCta": { en: "I'm a Teacher", es: "Soy Profesor(a)" },
  "landing.studentCta": { en: "I'm a Student", es: "Soy Estudiante" },
  "landing.stat1Label": { en: "ELL Students", es: "Estudiantes ELL" },
  "landing.stat2Label": { en: "in Georgia", es: "en Georgia" },
  "landing.stat3Label": { en: "Existing Tools", es: "Herramientas Existentes" },
  "landing.howItWorks": { en: "How It Works", es: "Cómo Funciona" },
  "landing.step1Title": { en: "1. Upload Test Scores", es: "1. Subir Calificaciones" },
  "landing.step1Desc": {
    en: "Teachers upload GA Milestones results. Saber identifies which questions each student missed and maps them to skill categories.",
    es: "Los profesores suben resultados de GA Milestones. Saber identifica qué preguntas falló cada estudiante y las mapea a categorías de habilidades.",
  },
  "landing.step2Title": { en: "2. Students Retake in Spanish", es: "2. Estudiantes Repiten en Español" },
  "landing.step2Desc": {
    en: "For each missed question, students complete an equivalent Spanish-language diagnostic through a clean, kid-friendly interface.",
    es: "Para cada pregunta fallada, los estudiantes completan un diagnóstico equivalente en español a través de una interfaz amigable.",
  },
  "landing.step3Title": { en: "3. Get Actionable Diagnostics", es: "3. Obtener Diagnósticos Accionables" },
  "landing.step3Desc": {
    en: "AI classifies each gap as a language barrier or content gap. Teachers get color-coded dashboards with per-student breakdowns.",
    es: "La IA clasifica cada brecha como barrera de idioma o brecha de contenido. Los profesores obtienen tableros con desgloses por estudiante.",
  },
  "landing.educatorInsight": { en: "Educator Insight", es: "Perspectiva del Educador" },
  "landing.quote": {
    en: "Traditional testing misses what our students actually know. Saber bridges the gap between language ability and intellectual capability.",
    es: "Las pruebas tradicionales no capturan lo que nuestros estudiantes realmente saben. Saber conecta la habilidad lingüística con la capacidad intelectual.",
  },
  "landing.privacy": { en: "Privacy Policy", es: "Política de Privacidad" },
  "landing.terms": { en: "Terms of Service", es: "Términos de Servicio" },
  "landing.contact": { en: "Contact Support", es: "Contactar Soporte" },

  // ── Teacher Dashboard ──
  "teacher.title": { en: "Grade 4: Literacia Bilingue", es: "Grado 4: Literacia Bilingüe" },
  "teacher.subtitle": { en: "Monitoring progress for", es: "Monitoreando el progreso de" },
  "teacher.activeStudents": { en: "active students", es: "estudiantes activos" },
  "teacher.uploadScores": { en: "Upload Scores", es: "Subir Calificaciones" },
  "teacher.totalEnrollment": { en: "Total Enrollment", es: "Inscripción Total" },
  "teacher.students": { en: "Students", es: "Estudiantes" },
  "teacher.languageBarrier": { en: "Language Barrier", es: "Barrera de Idioma" },
  "teacher.goldStatus": { en: "Gold Status", es: "Estado Dorado" },
  "teacher.contentGaps": { en: "Content Gaps", es: "Brechas de Contenido" },
  "teacher.coralStatus": { en: "Coral Status", es: "Estado Coral" },
  "teacher.classHealth": { en: "Class Health", es: "Salud de la Clase" },
  "teacher.excellent": { en: "Excellent", es: "Excelente" },
  "teacher.healthDesc": {
    en: "of students met this week's proficiency targets.",
    es: "de los estudiantes cumplieron las metas de esta semana.",
  },
  "teacher.studentRoster": { en: "Student Roster", es: "Lista de Estudiantes" },
  "teacher.colName": { en: "Student Name", es: "Nombre" },
  "teacher.colStatus": { en: "Status", es: "Estado" },
  "teacher.colLastActive": { en: "Last Active", es: "Última Actividad" },
  "teacher.colAvgScore": { en: "Avg Score", es: "Puntaje Prom." },
  "teacher.search": { en: "Search...", es: "Buscar..." },

  // ── Student Detail Panel ──
  "detail.skillsMastery": { en: "Skills Mastery", es: "Dominio de Habilidades" },
  "detail.masteryLevel": { en: "Mastery Level", es: "Nivel de Dominio" },
  "detail.coachInsight": { en: "Coach's Insight", es: "Perspectiva del Coach" },
  "detail.classMilestones": { en: "Class Milestones", es: "Hitos de la Clase" },
  "detail.midTerm": { en: "Mid-Term Assessment", es: "Evaluación de Medio Término" },
  "detail.today": { en: "OCT 24 - TODAY", es: "OCT 24 - HOY" },
  "detail.assignPractice": { en: "Assign Targeted Practice", es: "Asignar Práctica Dirigida" },
  "detail.noSkills": { en: "No skill data available yet.", es: "Aún no hay datos de habilidades." },

  // ── File Upload Modal ──
  "upload.title": { en: "Upload Test Scores", es: "Subir Calificaciones" },
  "upload.dragDrop": { en: "Drag and drop your CSV file here", es: "Arrastra y suelta tu archivo CSV aquí" },
  "upload.orClick": { en: "or click to browse", es: "o haz clic para buscar" },
  "upload.remove": { en: "Remove", es: "Eliminar" },
  "upload.submit": { en: "Upload Scores", es: "Subir Calificaciones" },

  // ── Student Dashboard ──
  "student.greeting": {
    en: "Good morning! Ready for today's quest?",
    es: "¡Buenos días! ¿Lista para el reto de hoy?",
  },
  "student.level": { en: "LEVEL", es: "NIVEL" },
  "student.goldRank": { en: "Gold Rank", es: "Rango Dorado" },
  "student.progressTo": { en: "Progress to Level", es: "Progreso al Nivel" },
  "student.streak": { en: "Day Streak!", es: "¡Días de Racha!" },
  "student.dontBreak": { en: "Don't break the chain!", es: "¡No rompas la racha!" },
  "student.questBoard": { en: "Quest Board", es: "Tablero de Misiones" },
  "student.selectSkill": { en: "Select a skill to master", es: "Elige una habilidad para dominar" },
  "student.viewAll": { en: "View All", es: "Ver Todo" },
  "student.exercises": { en: "EXERCISES", es: "EJERCICIOS" },

  // ── Leaderboard ──
  "leaderboard.title": { en: "Class Hall of Fame", es: "Salón de la Fama" },
  "leaderboard.subtitle": { en: "Weekly XP", es: "XP Semanal" },
  "leaderboard.showAll": { en: "Show All Rankings", es: "Ver Todos" },
  "leaderboard.showLess": { en: "Show Less", es: "Mostrar Menos" },

  // ── Quest View ──
  "quest.exercise": { en: "Exercise", es: "Ejercicio" },
  "quest.of": { en: "of", es: "de" },
  "quest.submit": { en: "Submit", es: "Enviar" },
  "quest.continue": { en: "Continue", es: "Continuar" },
  "quest.complete": { en: "Quest Complete!", es: "¡Misión Completa!" },
  "quest.masterMath": { en: "Master Math Word Problems", es: "Dominar Problemas Matemáticos" },
  "quest.earned": { en: "earned this quest", es: "ganado en esta misión" },
  "quest.backToDashboard": { en: "Back to Dashboard", es: "Volver al Tablero" },

  // ── Diagnostic Test ──
  "test.question": { en: "Question", es: "Pregunta" },
  "test.submitAnswer": { en: "Submit Answer", es: "Enviar Respuesta" },
  "test.continue": { en: "Continue", es: "Continuar" },
  "test.alternative": { en: "Alternative: Describe what you see", es: "Alternativa: Describe lo que ves" },
  "test.placeholder": { en: "Type your answer in English or Spanish...", es: "Escribe tu respuesta en inglés o español..." },
  "test.completed": { en: "You completed", es: "Completaste" },
  "test.questions": { en: "questions", es: "preguntas" },
  "test.greatJob": { en: "Great job on your diagnostic!", es: "¡Excelente trabajo en tu diagnóstico!" },
  "test.correct": { en: "Correct", es: "Correctas" },
  "test.toReview": { en: "To Review", es: "Por Revisar" },
  "test.xpEarned": { en: "XP Earned", es: "XP Ganado" },
  "test.languageBarriers": { en: "Language Barriers", es: "Barreras de Idioma" },
  "test.contentGaps": { en: "Content Gaps", es: "Brechas de Contenido" },
  "test.identified": { en: "identified", es: "identificadas" },
  "test.teacherResults": { en: "Your teacher will receive your results.", es: "Tu profesor(a) recibirá tus resultados." },
  "test.backToDashboard": { en: "Back to Dashboard", es: "Volver al Tablero" },
  "test.incredibleFocus": { en: "Incredible focus!", es: "¡Enfoque increíble!" },
  "test.keepGoing": { en: "Let's keep going! You're doing great.", es: "¡Sigamos! Lo estás haciendo genial." },
  "test.learningFast": {
    en: "You identified a secondary detail in the question. You're learning fast.",
    es: "Identificaste un detalle secundario en la pregunta. Estás aprendiendo rápido.",
  },
  "test.progress": { en: "Progress", es: "Progreso" },
};

export function t(key: string, lang: Language): string {
  return translations[key]?.[lang] ?? key;
}

export default translations;
