# EDUCONECTA V1.1.1 - Documentación del Sistema

## Plataforma Educativa Nacional del Perú

**Fecha:** Julio 2026
**Versión:** 1.1.1
**Estado:** Producción

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Flujo de Usuarios](#3-flujo-de-usuarios)
4. [Base de Datos](#4-base-de-datos)
5. [API Endpoints](#5-api-endpoints)
6. [Seguridad](#6-seguridad)
7. [Escalabilidad](#7-escalabilidad)
8. [Despliegue](#8-despliegue)
9. [Guía de Uso](#9-guía-de-uso)

---

## 1. RESUMEN EJECUTIVO

Educonecta es una plataforma educativa integral diseñada para colegios públicos y privados del Perú. El sistema permite gestionar matrículas, notas, asistencia, comunicación, documentos y más en una sola plataforma.

### Capacidad del Sistema
- **34,000+ instituciones** soportadas (50% del censo nacional)
- **17M+ estudiantes** potenciales
- **50 conexiones simultáneas** a base de datos
- **250K+ requests/minuto** con caching

### stack Tecnológico
- **Frontend:** Next.js 16, React, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Base de Datos:** MySQL 8.0
- **Autenticación:** JWT (jose)
- **PDF:** jsPDF
- **WebSocket:** Socket.io

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CDN / Load Balancer                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │ API Routes  │  │  Middleware  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Connection  │  │   Queries   │  │   Indexes   │        │
│  │    Pool     │  │             │  │             │        │
│  │   (50)      │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Tenancy

El sistema utiliza **isolación por institución** mediante `institution_id` en todas las tablas principales.

```
JWT Token → institutionId → Query Filter → Datos Aislados
```

### 2.3 Estructura de Directorios

```
EduconectaV2/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/               # Autenticación
│   │   ├── director/           # Endpoints del director
│   │   ├── secretario/         # Endpoints del secretario
│   │   ├── docente/            # Endpoints del docente
│   │   ├── padre/              # Endpoints del padre
│   │   ├── super-admin/        # Endpoints del super admin
│   │   ├── dev/                # Endpoints del desarrollador
│   │   ├── messages/           # Sistema de chat
│   │   └── health/             # Health check
│   ├── director/               # Páginas del director
│   ├── secretario/             # Páginas del secretario
│   ├── docente/                # Páginas del docente
│   ├── padre/                  # Páginas del padre
│   ├── super-admin/            # Páginas del super admin
│   └── dev/                    # Páginas del desarrollador
├── components/                 # Componentes React
├── lib/                        # Utilidades
│   ├── db.ts                   # Conexión a BD
│   ├── cache.ts                # Sistema de caché
│   ├── resolveInstId.ts        # Resolución de institución
│   ├── checkPlanLimit.ts       # Verificación de planes
│   ├── planPermissions.ts      # Permisos por plan
│   └── carnet-design.ts        # Diseño de carnets PDF
├── migrations/                 # Migraciones SQL
├── server.ts                   # Servidor WebSocket
├── middleware.ts                # Middleware de autenticación
└── package.json
```

---

## 3. FLUJO DE USUARIOS

### 3.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    DESARROLLADOR (DEV)                       │
│  • Crea instituciones (COL-01, COL-02, etc.)                │
│  • Gestiona planes y permisos                               │
│  • Monitorea el sistema                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    INSTITUCIÓN (COL-01)                      │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │    DIRECTOR      │    │   SECRETARIO    │                │
│  │  • Ve reportes   │    │  • Crea usuarios│                │
│  │  • Gestiona      │    │  • Gestiona     │                │
│  │    pagos         │    │    cursos       │                │
│  │  • Comunica      │    │  • Maneja       │                │
│  │                  │    │    documentos   │                │
│  └─────────────────┘    └────────┬────────┘                │
│                                  │                          │
│                    ┌─────────────┼─────────────┐           │
│                    ▼             ▼             ▼           │
│            ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│            │  DOCENTE  │ │   PADRE   │ │  ALUMNO   │      │
│            │ • Notas   │ │ • Reportes│ │ • Tareas  │      │
│            │ • Asistencia│ • Pagos   │ • Notas    │      │
│            │ • Tareas  │ │ • Comunica│ │ • Asistencia│     │
│            └───────────┘ └───────────┘ └───────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Creación de Institución

#### Opción 1: Registro Manual
1. El director solicita acceso en educonecta.pe
2. Completa formulario con datos del colegio
3. El equipo verifica la información
4. Se crea la institución y credenciales

#### Opción 2: Panel del Desarrollador
1. El DEV accede a `/dev`
2. Crea la institución con código (COL-01)
3. Se genera automáticamente:
   - Director (email: director.col-01@nombre.edu.pe)
   - Secretario (email: secretario.col-01@nombre.edu.pe)
   - 5 dashboards por defecto
4. Se asigna plan y permisos

### 3.3 Flujo del Secretario

```
Secretario
    │
    ├── Crea Docentes
    │   └── Asigna a cursos
    │
    ├── Crea Padres + Alumnos (vinculados)
    │   └── Relación padre-alumno en parent_student
    │
    ├── Gestiona Cursos
    │   ├── Crea cursos (Matemática, Comunicación, etc.)
    │   ├── Asigna grados y secciones
    │   └── Crea horarios
    │
    ├── Gestiona Documentos
    │   ├── Biblioteca de documentos
    │   ├── Certificados
    │   └── Carnets estudiantiles
    │
    └── Ve Reportes
        ├── Estadísticas del colegio
        ├── Lista de alumnos
        └── Pagos
```

### 3.4 Flujo del Docente

```
Docente
    │
    ├── Ve sus cursos asignados
    │
    ├── Registra Notas
    │   └── Por alumno y curso
    │
    ├── Registra Asistencia
    │   └── Diaria por curso
    │
    ├── Crea Tareas
    │   └── Con fecha límite y seguimiento
    │
    └── Comunica con Padres
        └── Mensajería en tiempo real
```

### 3.5 Flujo del Padre

```
Padre
    │
    ├── Ve Reportes de sus hijos
    │   ├── Notas por período
    │   ├── Asistencia
    │   └── Condición académica
    │
    ├── Ve Pagos
    │   ├── Estado de cuenta
    │   └── Comprobantes
    │
    ├── Comunica con Docentes
    │   └── Mensajería en tiempo real
    │
    └── Ve Calendario
        ├── Eventos del colegio
        └── Fechas de evaluaciones
```

---

## 4. BASE DE DATOS

### 4.1 Diagrama Entidad-Relación

```
┌─────────────────┐     ┌─────────────────┐
│  institutions   │     │      users      │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ institution_id  │
│ name            │     │ id (PK)         │
│ code            │     │ email           │
│ plan_id (FK)    │     │ full_name       │
│ status          │     │ role            │
│ created_at      │     │ password_hash   │
└─────────────────┘     │ status          │
        │               └─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│    students     │     │   enrollments   │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │◄────│ student_id      │
│ institution_id  │     │ course_id       │
│ first_name      │     │ grade_level     │
│ last_name       │     │ section         │
│ dni             │     │ status          │
│ photo_url       │     │ enrollment_year │
└─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│    courses      │     │    grades       │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ institution_id  │     │ student_id      │
│ name            │     │ course_id       │
│ grade           │     │ value           │
│ section         │     │ period          │
│ teacher_id      │     │ created_at      │
└─────────────────┘     └─────────────────┘
```

### 4.2 Tablas Principales

| Tabla | Descripción | Registros Estimados |
|-------|-------------|---------------------|
| `institutions` | Colegios registrados | 34,000+ |
| `users` | Usuarios del sistema | 500,000+ |
| `students` | Estudiantes | 17,000,000+ |
| `enrollments` | Matrículas | 17,000,000+ |
| `courses` | Cursos | 500,000+ |
| `grades` | Notas | 100,000,000+ |
| `attendance` | Asistencia | 500,000,000+ |
| `payments` | Pagos | 50,000,000+ |

### 4.3 Índices Críticos

```sql
-- Multi-tenant (obligatorio en todas las tablas)
CREATE INDEX idx_institution ON table_name(institution_id);

-- Búsqueda por DNI
CREATE INDEX idx_dni ON students(dni);

-- Búsqueda por nombre
CREATE INDEX idx_name ON students(last_name, first_name);

-- Paginación
CREATE INDEX idx_created ON table_name(created_at);

-- Compuestos para consultas frecuentes
CREATE INDEX idx_inst_status ON courses(institution_id, status);
CREATE INDEX idx_inst_role ON users(institution_id, role);
```

### 4.4 Pool de Conexiones

```typescript
// lib/db.ts
const pool = mysql.createPool({
  connectionLimit: 50,      // Máximo 50 conexiones
  maxIdle: 25,              // 25 conexiones en espera
  idleTimeout: 60000,       // 60 segundos timeout
  queueLimit: 100,          // Máximo 100 en cola
  enableKeepAlive: true,    // Mantener conexiones vivas
})
```

---

## 5. API ENDPOINTS

### 5.1 Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Inicio de sesión |
| GET | `/api/auth/me` | Obtener usuario actual |
| PUT | `/api/auth/profile` | Actualizar perfil |
| PUT | `/api/auth/change-password` | Cambiar contraseña |

### 5.2 Director

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/director/stats` | Estadísticas del colegio |
| GET | `/api/director/cursos` | Lista de cursos |
| POST | `/api/director/cursos` | Crear curso |
| PUT | `/api/director/cursos/[id]` | Actualizar curso |
| DELETE | `/api/director/cursos/[id]` | Eliminar curso |
| GET | `/api/director/staff` | Personal del colegio |
| GET | `/api/director/reportes` | Reportes |
| GET | `/api/director/comunicados` | Comunicados |
| GET | `/api/director/horarios` | Horarios |

### 5.3 Secretario

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/secretario/stats` | Estadísticas |
| GET | `/api/secretario/enrollments` | Matrículas |
| POST | `/api/secretario/enrollments` | Crear matrícula |
| GET | `/api/secretario/grades` | Notas |
| POST | `/api/secretario/grades` | Registrar notas |
| GET | `/api/secretario/parents` | Padres |
| POST | `/api/secretario/parents` | Crear padre |
| GET | `/api/secretario/carnets` | Carnets estudiantiles |
| POST | `/api/secretario/carnets` | Generar carnets PDF |
| POST | `/api/secretario/import` | Importar CSV |
| GET | `/api/secretario/documents` | Documentos |
| GET | `/api/secretario/certificados` | Certificados |
| GET | `/api/secretario/payments` | Pagos |
| GET | `/api/secretario/busqueda` | Búsqueda de alumnos |

### 5.4 Docente

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/docente/stats` | Estadísticas del docente |
| GET | `/api/docente/cursos` | Cursos asignados |
| GET | `/api/docente/tareas` | Tareas |
| POST | `/api/docente/tareas` | Crear tarea |
| GET | `/api/docente/student-attendance` | Asistencia de alumnos |
| POST | `/api/docente/student-attendance` | Registrar asistencia |
| GET | `/api/docente/virtual-classes` | Clases virtuales |
| POST | `/api/docente/virtual-classes` | Crear clase virtual |

### 5.5 Padre

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/padre/stats` | Estadísticas |
| GET | `/api/padre/hijo` | Información del hijo |
| GET | `/api/padre/comunicados` | Comunicados |
| GET | `/api/padre/calendario` | Calendario |
| GET | `/api/padre/payments` | Pagos |

### 5.6 Super Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/super-admin/instituciones` | Lista de instituciones |
| POST | `/api/super-admin/instituciones` | Crear institución |
| PUT | `/api/super-admin/instituciones/[id]` | Actualizar institución |
| DELETE | `/api/super-admin/instituciones/[id]` | Eliminar institución |
| GET | `/api/super-admin/instituciones/[id]/carnet` | Carnet institucional |
| GET | `/api/super-admin/instituciones/[id]/dashboards` | Dashboards |

### 5.7 Desarrollador

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dev/stats` | Estadísticas globales |
| GET | `/api/dev/me` | Datos del dev |
| GET | `/api/dev/carnet` | Carnet del dev |
| GET | `/api/health` | Health check del sistema |

### 5.8 Chat

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/messages` | Historial de mensajes |
| POST | `/api/messages` | Enviar mensaje |
| GET | `/api/messages/contacts` | Contactos |

---

## 6. SEGURIDAD

### 6.1 Autenticación

```typescript
// JWT Token Structure
{
  userId: "uuid",
  email: "user@domain.com",
  role: "director" | "secretario" | "docente" | "padre" | "dev",
  institutionId: "uuid"
}
```

### 6.2 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| `dev` | Acceso total, crea instituciones |
| `super_admin` | Gestiona todas las instituciones |
| `director` | Gestiona su institución |
| `secretario` | Crea usuarios, cursos, documentos |
| `docente` | Registra notas, asistencia, tareas |
| `padre` | Ve reportes, pagos, comunica |

### 6.3 Planes y Feature Gating

| Plan | Precio | Permisos |
|------|--------|----------|
| Free | $0 | grades, attendance, documents, parents_portal, homework |
| Básico | $149 | + certificates, chat, import |
| Pro | $449 | + virtual_classes, ai_assistant, carnets, export |
| Enterprise | $899 | Todos los permisos |

### 6.4 Seguridad en Producción

- ✅ Dev routes bloqueadas en producción
- ✅ JWT con secret configurable
- ✅ Passwords hasheados con bcrypt
- ✅ Rate limiting en API
- ✅ Validación de inputs
- ✅ SQL parametrizado (no SQL injection)

---

## 7. ESCALABILIDAD

### 7.1 Optimizaciones Implementadas

| Área | Antes | Después |
|------|-------|---------|
| Connection Pool | 10 | 50 |
| Stats Queries | 11 queries | 1 query |
| N+1 en Cursos | Subqueries correlacionados | JOIN + GROUP BY |
| Búsqueda | `%term%` (full scan) | `term%` (index scan) |
| Importación | Row-by-row | Batch inserts |
| Paginación | Sin límite | LIMIT 20-100 |

### 7.2 Capacidades

```
34,000 instituciones
× 500 alumnos promedio
= 17M estudiantes

50 conexiones × 5,000 req/min
= 250K requests/minuto

Con caching:
- Datos estáticos: 5 min TTL
- Estadísticas: 1 min TTL
- Búsquedas: 30 seg TTL
```

### 7.3 Monitoreo

```bash
# Health Check
GET /api/health

# Response
{
  "status": "ok",
  "database": {
    "status": "healthy",
    "latency": 12,
    "activeConnections": 15,
    "poolLimit": 50
  },
  "stats": {
    "institutions": 34000,
    "users": 500000,
    "students": 17000000
  }
}
```

---

## 8. DESPLIEGUE

### 8.1 Requisitos

- Node.js 18+
- MySQL 8.0+
- npm o yarn

### 8.2 Variables de Entorno

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=educonecta
DB_SOCKET=/opt/lampp/var/mysql/mysql.sock

# Pool Configuration
DB_POOL_LIMIT=50
DB_POOL_MAX_IDLE=25
DB_POOL_QUEUE_LIMIT=100

# Security
JWT_SECRET=your-super-secret-key

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://educonecta.pe
```

### 8.3 Instalación

```bash
# Clonar repositorio
git clone https://github.com/educonecta/educonecta-v2.git
cd educonecta-v2

# Instalar dependencias
npm install

# Ejecutar migraciones
mysql -u root -p educonecta < migrations/001_performance_indexes.sql

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

### 8.4 WebSocket Server

```bash
# Iniciar servidor WebSocket (puerto 3001)
node server.ts
```

---

## 9. GUÍA DE USO

### 9.1 Como Director

1. **Iniciar sesión** con credenciales de director
2. **Ver dashboard** con estadísticas del colegio
3. **Gestionar personal** (docentes, secretarios)
4. **Ver reportes** de notas y asistencia
5. **Comunicar** con padres y docentes

### 9.2 Como Secretario

1. **Crear usuarios**: docentes, padres, alumnos
2. **Vincular padres-alumnos** en el sistema
3. **Gestionar cursos** y horarios
4. **Crear documentos** y certificados
5. **Generar carnets** estudiantiles (PDF)
6. **Importar alumnos** desde CSV

### 9.3 Como Docente

1. **Ver cursos asignados**
2. **Registrar notas** por alumno
3. **Tomar asistencia** diaria
4. **Crear tareas** con fecha límite
5. **Comunicar** con padres

### 9.4 Como Padre

1. **Ver notas** del hijo
2. **Ver asistencia** y punctualidad
3. **Revisar pagos** y estado de cuenta
4. **Comunicar** con docentes
5. **Ver calendario** de eventos

---

## APÉNDICE

### A. Comandos Útiles

```bash
# Verificar TypeScript
npx tsc --noEmit

# Ejecutar migración
mysql -u root -p educonecta < migrations/001_performance_indexes.sql

# Verificar health check
curl http://localhost:3000/api/health

# Ver logs
tail -f /var/log/mysql/slow-query.log
```

### B. Contacto

- **Soporte:** soporte@educonecta.pe
- **Documentación:** docs.educonecta.pe
- **GitHub:** github.com/educonecta

---

**Documento generado automáticamente - Educonecta V1.1.1**
