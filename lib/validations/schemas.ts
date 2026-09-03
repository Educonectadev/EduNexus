import * as z from "zod"

export const institutionSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  code: z.string().min(3, "El código debe tener al menos 3 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  plan_id: z.string().min(1, "Seleccione un plan"),
  status: z.enum(['active', 'inactive', 'suspended']),
})

export const studentSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  document_type: z.enum(['DNI', 'CE', 'PASSPORT']),
  document_number: z.string().min(8, "El número de documento debe tener al menos 8 caracteres"),
  birth_date: z.string().min(1, "La fecha de nacimiento es requerida"),
  gender: z.enum(['M', 'F']),
  grade: z.string().min(1, "El grado es requerido"),
  section: z.string().min(1, "La sección es requerida"),
  shift: z.string().min(1, "El turno es requerido"),
})

export const teacherSchema = z.object({
  code: z.string().min(1, "El código es requerido"),
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  document_type: z.enum(['DNI', 'CE', 'PASSPORT']),
  document_number: z.string().min(8, "El número de documento debe tener al menos 8 caracteres"),
  specialty: z.string().min(2, "La especialidad debe tener al menos 2 caracteres"),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
})

export const courseSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  code: z.string().min(3, "El código debe tener al menos 3 caracteres"),
  grade: z.string().min(1, "El grado es requerido"),
  section: z.string().min(1, "La sección es requerida"),
  teacher_id: z.string().min(1, "Seleccione un docente"),
})

export const gradeSchema = z.object({
  student_id: z.string().min(1, "Seleccione un alumno"),
  course_id: z.string().min(1, "Seleccione un curso"),
  term: z.string().min(1, "El período es requerido"),
  score: z.number().min(0, "La nota mínima es 0").max(20, "La nota máxima es 20"),
  max_score: z.number().min(1, "La nota máxima debe ser mayor a 0"),
  comments: z.string().optional(),
})

export const attendanceSchema = z.object({
  student_id: z.string().min(1, "Seleccione un alumno"),
  course_id: z.string().min(1, "Seleccione un curso"),
  date: z.string().min(1, "La fecha es requerida"),
  status: z.enum(['present', 'absent', 'late', 'justified']),
  notes: z.string().optional(),
})

export type InstitutionInput = z.infer<typeof institutionSchema>
export type StudentInput = z.infer<typeof studentSchema>
export type TeacherInput = z.infer<typeof teacherSchema>
export type CourseInput = z.infer<typeof courseSchema>
export type GradeInput = z.infer<typeof gradeSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>
