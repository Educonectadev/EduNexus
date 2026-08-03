export type UserRole = 'super_admin' | 'director' | 'secretario' | 'docente' | 'padre'

declare module 'mammoth' {
  export interface ConvertResult {
    value: string
    messages: unknown[]
  }
  export interface ConvertOptions {
    arrayBuffer?: ArrayBuffer
    path?: string
    styleMap?: string[]
  }
  export function convertToHtml(input: ArrayBuffer | { arrayBuffer: ArrayBuffer } | string, options?: ConvertOptions): Promise<ConvertResult>
  export function convertToMarkdown(input: ArrayBuffer | { arrayBuffer: ArrayBuffer } | string, options?: ConvertOptions): Promise<ConvertResult>
  export function extractRawText(input: ArrayBuffer | { arrayBuffer: ArrayBuffer } | string): Promise<ConvertResult>
  export default {
    convertToHtml,
    convertToMarkdown,
    extractRawText,
  }
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  institution_id?: string
  created_at: string
}

export interface Institution {
  id: string
  name: string
  code: string
  address: string
  phone: string
  email: string
  logo_url?: string
  plan_id: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
}

export interface Plan {
  id: string
  name: string
  description: string
  price: number
  max_users: number
  max_students: number
  features: string[]
  status: 'active' | 'inactive'
}

export interface Student {
  id: string
  user_id: string
  institution_id: string
  code: string
  first_name: string
  last_name: string
  document_type: 'DNI' | 'CE' | 'PASSPORT'
  document_number: string
  birth_date: string
  gender: 'M' | 'F'
  grade: string
  section: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface Teacher {
  id: string
  user_id: string
  institution_id: string
  code: string
  first_name: string
  last_name: string
  document_type: 'DNI' | 'CE' | 'PASSPORT'
  document_number: string
  specialty: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface Parent {
  id: string
  user_id: string
  institution_id: string
  first_name: string
  last_name: string
  document_type: 'DNI' | 'CE' | 'PASSPORT'
  document_number: string
  phone: string
  email: string
  address: string
  created_at: string
}

export interface Course {
  id: string
  institution_id: string
  name: string
  code: string
  grade: string
  section: string
  teacher_id: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface Attendance {
  id: string
  student_id: string
  course_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'justified'
  notes?: string
  created_at: string
}

export interface Grade {
  id: string
  student_id: string
  course_id: string
  term: string
  score: number
  max_score: number
  comments?: string
  created_at: string
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  description: string
  due_date: string
  max_score: number
  status: 'active' | 'completed'
  created_at: string
}

export interface Notification {
  id: string
  institution_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  target_roles: UserRole[]
  read_by: string[]
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  institution_id?: string
  action: string
  entity: string
  entity_id: string
  details: Record<string, unknown>
  ip_address: string
  created_at: string
}

export interface Subscription {
  id: string
  institution_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'past_due'
  start_date: string
  end_date: string
  payment_method: string
  last_payment_date?: string
  next_payment_date?: string
  created_at: string
}

export interface Ticket {
  id: string
  user_id: string
  institution_id?: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  institution_id: string
  student_id?: string
  student_name?: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'ready'
  notes?: string
  created_at: string
  updated_at: string
}

export interface Certificate {
  id: string
  institution_id: string
  student_id?: string
  student_name: string
  student_full_name?: string
  type: string
  issue_date: string
  file_url?: string
  status: 'emitido' | 'pendiente' | 'anulado'
  created_at: string
  updated_at: string
}
