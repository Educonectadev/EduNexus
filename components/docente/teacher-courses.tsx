"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, ChevronRight, Users } from "@/components/ui/proicons"

export interface TeacherCourse {
  id: string
  name: string
  grade: string
  section: string
  students: number
  schedule?: string
}

interface TeacherCoursesProps {
  courses: TeacherCourse[]
  loading?: boolean
}

export function TeacherCourses({ courses, loading }: TeacherCoursesProps) {
  return (
    <section className="td-card" aria-label="Mis cursos">
      <header className="td-card-head">
        <div className="td-card-title-wrap">
          <BookOpen className="td-card-title-icon" />
          <h3 className="td-card-title">Mis cursos</h3>
        </div>
        <Link href="/docente/cursos" className="td-card-link">
          Ver todos <ChevronRight className="td-card-link-icon" />
        </Link>
      </header>

      {loading ? (
        <div className="td-courses-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="td-course-card td-course-card--skeleton" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="td-empty">
          <div className="td-empty-icon">
            <BookOpen className="td-empty-icon-svg" />
          </div>
          <p className="td-empty-text">No tienes cursos asignados.</p>
        </div>
      ) : (
        <div className="td-courses-grid">
          {courses.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/docente/cursos/${c.id}`}
              className="td-course-card"
            >
              <div className="td-course-icon" aria-hidden="true">
                <BookOpen className="td-course-icon-svg" />
              </div>
              <div className="td-course-body">
                <p className="td-course-name">{c.name}</p>
                <p className="td-course-meta">
                  {c.grade}
                  {c.section && <> · {c.section}</>}
                </p>
              </div>
              <div className="td-course-foot">
                <span className="td-course-students">
                  <Users className="td-course-students-icon" />
                  {c.students} alumnos
                </span>
                <ChevronRight className="td-course-chevron" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default TeacherCourses
