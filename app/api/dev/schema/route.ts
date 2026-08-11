import { NextResponse } from 'next/server'
import pool from '@/lib/db'

// Devuelve el esquema REAL de la base (PostgreSQL): tablas, columnas con su
// tipo/nullable, claves primarias y relaciones (foreign keys), tal como lo
// muestra pgAdmin/DBeaver/Supabase.

export async function GET() {
  try {
    const [schemaRow] = await pool.query(
      `SELECT current_schema() AS s`
    ).catch(() => [{ s: 'public' }] as any[]) as any[]
    const schema = schemaRow?.[0]?.s || 'public'

    const [cols] = await pool.query(
      `SELECT table_name, column_name, data_type, is_nullable,
              COALESCE(character_maximum_length, numeric_precision, datetime_precision) AS len
       FROM information_schema.columns
       WHERE table_schema = ?
       ORDER BY table_name, ordinal_position`,
      [schema]
    ).catch(() => [] as any[]) as any[]

    const [pks] = await pool.query(
      `SELECT tc.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON kcu.constraint_name = tc.constraint_name
        AND kcu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = ?
       ORDER BY tc.table_name`,
      [schema]
    ).catch(() => [] as any[]) as any[]

    const [fks] = await pool.query(
      `SELECT tc.table_name AS "table_name",
              kcu.column_name AS "column_name",
              ccu.table_name AS "referenced_table",
              ccu.column_name AS "referenced_column"
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON kcu.constraint_name = tc.constraint_name
        AND kcu.table_schema = tc.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = ?
       ORDER BY tc.table_name`,
      [schema]
    ).catch(() => [] as any[]) as any[]

    const pkMap: Record<string, Set<string>> = {}
    for (const pk of (pks || []) as any[]) {
      (pkMap[pk.table_name] ||= new Set()).add(pk.column_name)
    }

    const tablesMap: Record<string, { columns: any[]; relations: any[] }> = {}
    for (const c of (cols || []) as any[]) {
      const tableName = c.table_name
      if (!c.table_name) continue
      const t = (tablesMap[tableName] ||= { columns: [], relations: [] })
      t.columns.push({
        name: c.column_name,
        type: `${c.data_type}${c.len ? `(${c.len})` : ''}`,
        nullable: c.is_nullable === 'YES',
        primary: !!(pkMap[tableName]?.has(c.column_name)),
      })
    }
    for (const f of (fks || []) as any[]) {
      if (!f.table_name || !f.referenced_table) continue
      const t = (tablesMap[f.table_name] ||= { columns: [], relations: [] })
      t.relations.push({
        column: f.column_name,
        refTable: f.referenced_table,
        refColumn: f.referenced_column,
      })
    }

    const tables = Object.entries(tablesMap)
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const [countRow] = await pool.query(
      `SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = ?`,
      [schema]
    ).catch(() => [] as any[]) as any[]

    return NextResponse.json({
      ok: true,
      schema,
      tableCount: countRow?.[0]?.count || tables.length,
      tables,
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || error) }, { status: 500 })
  }
}