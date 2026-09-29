export type AcademicLevel = "Inicial" | "Primaria" | "Secundaria" | ""

export function academicLevel(text?: string | null): AcademicLevel {
  const s = (text || "").toLowerCase()
  if (s.includes("secundaria")) return "Secundaria"
  if (s.includes("primaria")) return "Primaria"
  if (s.includes("inicial")) return "Inicial"
  return ""
}

export function levelMismatch(teacherGradeLevel?: string | null, courseGrade?: string | null): boolean {
  const teacher = academicLevel(teacherGradeLevel)
  const course = academicLevel(courseGrade)
  return Boolean(teacher && course && teacher !== course)
}

export function normalizeGradeLabel(text?: string | null): string {
  const t = (text || "").trim()
  if (!t) return ""
  const year = t.match(/^(\d+)\s*°/)?.[1] || ""
  const level = academicLevel(t)
  if (!level) return t
  return year ? `${year}° de ${level}` : level
}
