import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resolveInstId } from '@/lib/resolveInstId'
import { checkPlanFeature } from '@/lib/checkPlanLimit'
import crypto from 'crypto'

interface ChatMessage {
  role: string
  content: string
}

interface ActionResult {
  response: string
  actions?: {
    label: string
    description: string
    icon: string
    color: string
    bg: string
    command: string
  }[]
}

function normalizeText(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

function detectIntent(message: string): { intent: string; params: Record<string, string> } {
  const m = normalizeText(message)
  const params: Record<string, string> = {}

  // Extract name patterns
  const nameMatch = m.match(/(?:llamado?|nombre?|se llama|apellido?)\s+([a-záéíóúñ\s]+?)(?:\s+(?:en|de|dni|grado|seccion|curso|telefono|direccion|email|padre|madre|apoderado)|\s*$)/i)
  if (nameMatch) params.name = nameMatch[1].trim()

  // Extract DNI
  const dniMatch = m.match(/dni\s*(?:es\s*)?(\d{6,12})/i) || m.match(/(\d{8})/)
  if (dniMatch) params.dni = dniMatch[1]

  // Extract grade
  const gradeMatch = m.match(/(\d+)(?:°|\s*grado)\s*(?:de\s*)?( primaria| secundaria| kinde| inicie)?/i)
  if (gradeMatch) {
    params.grade = gradeMatch[1]
    params.level = (gradeMatch[2] || "").trim()
  }

  // Extract section
  const sectionMatch = m.match(/seccion\s*([a-z]|(?:\d+))/i) || m.match(/\b([a-d])\b/i)
  if (sectionMatch) params.section = sectionMatch[1].toUpperCase()

  // Extract phone
  const phoneMatch = m.match(/telefono\s*(?:es\s*)?(\d{9,10})/i) || m.match(/celular\s*(?:es\s*)?(\d{9,10})/i)
  if (phoneMatch) params.phone = phoneMatch[1]

  // Detect intent
  if (/registrar\s+alumno|matricular|nuevo\s+alumno|agregar\s+alumno|inscribir/.test(m)) {
    return { intent: 'register_student', params }
  }
  if (/registrar\s+padre|nuevo\s+padre|agregar\s+padre|crear\s+cuenta.*padre|apoderado/.test(m)) {
    return { intent: 'register_parent', params }
  }
  if (/tomar\s+asistencia|registrar\s+asistencia|asistencia\s+(?:del\s+)?dia/.test(m)) {
    return { intent: 'take_attendance', params }
  }
  if (/registrar\s+pago|nuevo\s+pago|pagar|pago\s+de/.test(m)) {
    return { intent: 'register_payment', params }
  }
  if (/buscar\s+alumno|ver\s+alumno|expediente|buscar\s+alumno|ver\s+expediente/.test(m)) {
    return { intent: 'search_student', params }
  }
  if (/ver\s+notas|calificaciones|notas\s+de|consultar\s+notas/.test(m)) {
    return { intent: 'view_grades', params }
  }
  if (/ver\s+pagos|pagos\s+pendientes|deuda|cuotas/.test(m)) {
    return { intent: 'view_payments', params }
  }
  if (/asistencia|presentes|ausentes/.test(m)) {
    return { intent: 'view_attendance', params }
  }
  if (/ver\s+padres|listar\s+padres|padres\s+registrados/.test(m)) {
    return { intent: 'list_parents', params }
  }
  if (/curso|cursos|grados|secciones/.test(m)) {
    return { intent: 'list_courses', params }
  }
  if (/hola|buenos?\s+(dias?|tardes?|noches?)|saludos?/.test(m)) {
    return { intent: 'greeting', params }
  }
  if (/ayuda|que\s+puedes?\s+hacer|opciones|comandos/.test(m)) {
    return { intent: 'help', params }
  }
  if (/certificado|constancia|documento/.test(m)) {
    return { intent: 'generate_document', params }
  }
  if (/resumen|dashboard|resumir|estado/.test(m)) {
    return { intent: 'summary', params }
  }

  return { intent: 'unknown', params }
}

async function executeIntent(
  intent: string,
  params: Record<string, string>,
  instId: string
): Promise<ActionResult> {
  switch (intent) {
    case 'greeting': {
      const hour = new Date().getHours()
      const greeting = hour < 12 ? "Buenos dias" : hour < 18 ? "Buenas tardes" : "Buenas noches"
      return {
        response: `${greeting}! Soy tu asistente virtual. 🎓\n\nPuedo ayudarte con:\n• Registrar alumnos y padres\n• Tomar asistencia\n• Registrar pagos\n• Buscar información\n• Consultar notas y calificaciones\n\nEscribe lo que necesitas o elige una acción rápida para comenzar.`,
        actions: [
          { label: "Registrar alumno", description: "Matricular nuevo estudiante", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-500/10", command: "registrar alumno" },
          { label: "Registrar padre", description: "Agregar apoderado", icon: "Users", color: "text-emerald-600", bg: "bg-emerald-500/10", command: "registrar padre" },
          { label: "Ver pagos pendientes", description: "Consultar deudas", icon: "CreditCard", color: "text-amber-600", bg: "bg-amber-500/10", command: "ver pagos pendientes" },
        ],
      }
    }

    case 'help': {
      return {
        response: "Estos son los comandos que puedo procesar:\n\n📚 **Alumnos**\n• \"Registrar alumno\" - Matricular nuevo estudiante\n• \"Buscar alumno\" - Ver expediente\n• \"Ver notas\" - Consultar calificaciones\n\n👨‍👩‍👧 **Padres**\n• \"Registrar padre\" - Agregar apoderado\n• \"Ver padres\" - Listar padres registrados\n\n💰 **Pagos**\n• \"Registrar pago\" - Registrar pago\n• \"Ver pagos pendientes\" - Consultar deudas\n\n📋 **Asistencia**\n• \"Tomar asistencia\" - Registrar asistencia\n• \"Ver asistencia\" - Consultar registros\n\n📄 **Documentos**\n• \"Generar certificado\" - Crear constancia\n• \"Generar documento\" - Crear documento\n\nPuedes escribir tu solicitud en lenguaje natural.",
        actions: [],
      }
    }

    case 'register_student': {
      if (params.name || params.dni) {
        const [existing] = await pool.query(
          `SELECT id, first_name, last_name FROM students WHERE (document_number = ? OR CONCAT(first_name, ' ', last_name) LIKE ?) AND institution_id = ?`,
          [params.dni || '', `%${params.name || ''}%`, instId]
        ) as any[]

        if (existing && existing.length > 0) {
          const s = existing[0]
          return {
            response: `Encontre ${existing.length} resultado(s) similar(es):\n\n${existing.map((r: any) => `• ${r.first_name} ${r.last_name} (ID: ${r.id?.slice(0, 8)}...)`).join('\n')}\n\nPara registrar un alumno nuevo, ve a la seccion de Matriculas.`,
            actions: [
              { label: "Ir a Matriculas", description: "Registrar nuevo alumno", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-500/10", command: "ir a matriculas" },
            ],
          }
        }

        return {
          response: `Voy a ayudarte a registrar al alumno${params.name ? ` "${params.name}"` : ''}${params.dni ? ` con DNI ${params.dni}` : ''}${params.grade ? ` en ${params.grade}° ${params.level || 'secundaria'}` : ''}${params.section ? ` seccion ${params.section}` : ''}.\n\nPara completar el registro, por favor ve a la seccion de Matriculas donde podras ingresar todos los datos completos.`,
          actions: [
            { label: "Ir a Matriculas", description: "Abrir formulario de matricula", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-500/10", command: "ir a matriculas" },
          ],
        }
      }

      return {
        response: "Para registrar un alumno necesito al menos:\n\n• Nombre y apellido\n• DNI (opcional)\n• Grado y seccion (opcional)\n\nEjemplo: \"Registrar alumno Juan Perez DNI 45678912 en 3° secundaria A\"\n\nO puedes ir directamente a Matriculas:",
        actions: [
          { label: "Ir a Matriculas", description: "Formulario completo", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-500/10", command: "ir a matriculas" },
        ],
      }
    }

    case 'register_parent': {
      return {
        response: params.name
          ? `Voy a ayudarte a registrar al padre/apoderado "${params.name}"${params.dni ? ` con DNI ${params.dni}` : ''}.\n\nPara completar el registro y crear la cuenta de acceso, ve a la seccion de Padres.`
          : "Para registrar un padre o apoderado, necesito al menos su nombre y DNI.\n\nEjemplo: \"Registrar padre Carlos Garcia DNI 12345678\"\n\nO puedes ir directamente a la seccion de Padres:",
        actions: [
          { label: "Ir a Padres", description: "Registrar apoderado", icon: "Users", color: "text-emerald-600", bg: "bg-emerald-500/10", command: "ir a padres" },
        ],
      }
    }

    case 'register_payment': {
      return {
        response: "Para registrar un pago de colegiatura, necesitas ir a la seccion de Pagos donde podras:\n\n• Seleccionar el alumno\n• Ingresar el monto\n• Registrar el metodo de pago\n• Generar recibo",
        actions: [
          { label: "Ir a Pagos", description: "Registrar pago", icon: "CreditCard", color: "text-purple-600", bg: "bg-purple-500/10", command: "ir a pagos" },
        ],
      }
    }

    case 'search_student': {
      if (params.dni) {
        const [students] = await pool.query(
          `SELECT id, first_name, last_name, document_number, grade, section, status FROM students WHERE document_number = ? AND institution_id = ? LIMIT 5`,
          [params.dni, instId]
        ) as any[]

        if (students && students.length > 0) {
          const s = students[0]
          return {
            response: `Encontre al alumno:\n\n• Nombre: ${s.first_name} ${s.last_name}\n• DNI: ${s.document_number}\n• Grado: ${s.grade} ${s.section}\n• Estado: ${s.status || 'activo'}\n\nPara ver el expediente completo, usa la seccion de Busqueda.`,
            actions: [
              { label: "Ir a Busqueda", description: "Ver expediente completo", icon: "Search", color: "text-cyan-600", bg: "bg-cyan-500/10", command: "ir a busqueda" },
            ],
          }
        }
        return {
          response: `No encontre ningun alumno con DNI ${params.dni} en esta institucion. Verifica el numero de documento.`,
          actions: [],
        }
      }

      return {
        response: "Para buscar un alumno necesito su DNI o nombre.\n\nEjemplo: \"Buscar alumno DNI 45678912\" o \"Buscar alumno Juan Perez\"",
        actions: [
          { label: "Ir a Busqueda", description: "Buscador avanzado", icon: "Search", color: "text-cyan-600", bg: "bg-cyan-500/10", command: "ir a busqueda" },
        ],
      }
    }

    case 'view_grades': {
      try {
        const [students] = await pool.query(
          `SELECT id, first_name, last_name, grade, section FROM students WHERE institution_id = ? AND status = 'active' ORDER BY first_name LIMIT 10`,
          [instId]
        ) as any[]

        if (students && students.length > 0) {
          const list = students.slice(0, 5).map((s: any) => `• ${s.first_name} ${s.last_name} - ${s.grade} ${s.section}`).join('\n')
          return {
            response: `Estos son los primeros alumnos activos:\n\n${list}\n\n${students.length > 5 ? `... y ${students.length - 5} mas` : ''}\n\nPara ver calificaciones especificas, ve a la seccion de Notas.`,
            actions: [
              { label: "Ir a Notas", description: "Ver calificaciones", icon: "BookOpen", color: "text-rose-600", bg: "bg-rose-500/10", command: "ir a notas" },
            ],
          }
        }
      } catch {}

      return {
        response: "Para consultar las notas y calificaciones, ve a la seccion de Notas donde podras:\n\n• Ver notas por alumno\n• Ingresar calificaciones\n• Ver promedios",
        actions: [
          { label: "Ir a Notas", description: "Ver calificaciones", icon: "BookOpen", color: "text-rose-600", bg: "bg-rose-500/10", command: "ir a notas" },
        ],
      }
    }

    case 'view_payments': {
      try {
        const [pending] = await pool.query(
          `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE institution_id = ? AND status = 'pending'`,
          [instId]
        ) as any[]
        const p = pending?.[0] || { count: 0, total: 0 }

        return {
          response: `Resumen de pagos:\n\n• Pagos pendientes: ${p.count}\n• Total adeudado: S/ ${Number(p.total).toLocaleString()}\n\nPara ver el detalle o registrar un pago:`,
          actions: [
            { label: "Ir a Pagos", description: "Ver detalle de pagos", icon: "CreditCard", color: "text-purple-600", bg: "bg-purple-500/10", command: "ir a pagos" },
          ],
        }
      } catch {
        return {
          response: "No pude obtener los datos de pagos. Verifica la conexion a la base de datos.",
          actions: [],
        }
      }
    }

    case 'view_attendance': {
      return {
        response: "Para consultar o tomar asistencia, ve a la seccion de Asistencia donde podras:\n\n• Tomar asistencia del dia\n• Ver registros por alumno\n• Ver estadisticas de asistencia",
        actions: [
          { label: "Ir a Asistencia", description: "Tomar asistencia", icon: "ClipboardList", color: "text-amber-600", bg: "bg-amber-500/10", command: "ir a asistencia" },
        ],
      }
    }

    case 'list_parents': {
      try {
        const [parents] = await pool.query(
          `SELECT id, first_name, last_name, document_number, email, phone FROM parents WHERE institution_id = ? ORDER BY first_name LIMIT 10`,
          [instId]
        ) as any[]

        if (parents && parents.length > 0) {
          const list = parents.slice(0, 5).map((p: any) => `• ${p.first_name} ${p.last_name} - DNI: ${p.document_number}`).join('\n')
          return {
            response: `Padres registrados (${parents.length} total):\n\n${list}\n${parents.length > 5 ? `\n... y ${parents.length - 5} mas` : ''}`,
            actions: [
              { label: "Ir a Padres", description: "Ver todos los padres", icon: "Users", color: "text-emerald-600", bg: "bg-emerald-500/10", command: "ir a padres" },
            ],
          }
        }
      } catch {}

      return {
        response: "Para ver los padres registrados, ve a la seccion de Padres.",
        actions: [
          { label: "Ir a Padres", description: "Ver padres", icon: "Users", color: "text-emerald-600", bg: "bg-emerald-500/10", command: "ir a padres" },
        ],
      }
    }

    case 'list_courses': {
      try {
        const [courses] = await pool.query(
          `SELECT id, name, grade_level, section FROM courses WHERE institution_id = ? ORDER BY grade_level, section LIMIT 20`,
          [instId]
        ) as any[]

        if (courses && courses.length > 0) {
          const list = courses.slice(0, 8).map((c: any) => `• ${c.name || c.grade_level} ${c.section || ''}`).join('\n')
          return {
            response: `Cursos/Secciones disponibles:\n\n${list}\n${courses.length > 8 ? `\n... y ${courses.length - 8} mas` : ''}`,
            actions: [
              { label: "Ir a Cursos", description: "Ver todos los cursos", icon: "BookOpen", color: "text-blue-600", bg: "bg-blue-500/10", command: "ir a cursos" },
            ],
          }
        }
      } catch {}

      return {
        response: "Para ver los cursos y secciones, ve a la seccion de Cursos.",
        actions: [
          { label: "Ir a Cursos", description: "Ver cursos", icon: "BookOpen", color: "text-blue-600", bg: "bg-blue-500/10", command: "ir a cursos" },
        ],
      }
    }

    case 'generate_document': {
      return {
        response: "Para generar documentos como constancias, certificados o actas, ve a la seccion de Documentos o Certificados.",
        actions: [
          { label: "Ir a Documentos", description: "Generar documento", icon: "FileText", color: "text-indigo-600", bg: "bg-indigo-500/10", command: "ir a documentos" },
          { label: "Ir a Certificados", description: "Generar certificado", icon: "ClipboardList", color: "text-emerald-600", bg: "bg-emerald-500/10", command: "ir a certificados" },
        ],
      }
    }

    case 'summary': {
      try {
        const [students] = await pool.query(
          `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM students WHERE institution_id = ?`,
          [instId]
        ) as any[]
        const [parents] = await pool.query(
          `SELECT COUNT(*) as total FROM parents WHERE institution_id = ?`,
          [instId]
        ) as any[]
        const [payments] = await pool.query(
          `SELECT COUNT(*) as pending, COALESCE(SUM(amount), 0) as total_debt FROM payments WHERE institution_id = ? AND status = 'pending'`,
          [instId]
        ) as any[]

        const s = students?.[0] || { total: 0, active: 0 }
        const p = parents?.[0] || { total: 0 }
        const pay = payments?.[0] || { pending: 0, total_debt: 0 }

        return {
          response: `📊 **Resumen de la institucion**\n\n• Alumnos activos: ${s.active || 0} de ${s.total || 0}\n• Padres registrados: ${p.total || 0}\n• Pagos pendientes: ${pay.pending || 0}\n• Deuda total: S/ ${Number(pay.total_debt || 0).toLocaleString()}`,
          actions: [
            { label: "Ver Dashboard", description: "Panel principal", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-500/10", command: "ir a dashboard" },
          ],
        }
      } catch {
        return {
          response: "No pude generar el resumen. Verifica la conexion a la base de datos.",
          actions: [],
        }
      }
    }

    default: {
      return {
        response: "No estoy seguro de lo que necesitas. Puedo ayudarte con:\n\n• Registrar alumnos o padres\n• Buscar informacion\n• Ver pagos, notas o asistencia\n• Generar documentos\n\nIntenta con un comando mas especifico.",
        actions: [
          { label: "Registrar alumno", description: "Matricular nuevo estudiante", icon: "GraduationCap", color: "text-blue-600", bg: "bg-blue-500/10", command: "registrar alumno" },
          { label: "Buscar alumno", description: "Ver expediente", icon: "Search", color: "text-cyan-600", bg: "bg-cyan-500/10", command: "buscar alumno" },
          { label: "Ver resumen", description: "Estado general", icon: "ClipboardList", color: "text-amber-600", bg: "bg-amber-500/10", command: "resumen" },
        ],
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const instId = await resolveInstId(request)
    if (!instId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const allowed = await checkPlanFeature(instId, 'can_ai_assistant')
    if (!allowed) {
      return NextResponse.json({ 
        error: 'Asistente IA no disponible en tu plan',
        upgrade_required: true 
      }, { status: 403 })
    }

    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
    }

    const { intent, params } = detectIntent(message)
    const result = await executeIntent(intent, params, instId)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({
      response: "Ocurrio un error al procesar tu solicitud. Intenta de nuevo.",
      actions: [],
    }, { status: 500 })
  }
}
