-- Plan Diamante: todo incluido, para instituciones de élite
INSERT INTO plans (id, name, description, price, max_users, max_students, features, status)
VALUES (
  'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  'Diamante',
  'Para instituciones de élite y redes educativas que lo quieren todo, sin límites',
  1499,
  999999,
  999999,
  '{"labels":["Alumnos y docentes ilimitados","Calificaciones","Asistencia digital","Portal de padres","Tareas y revisiones","Certificados digitales","Clases virtuales (Zoom/Meet)","Asistente IA del secretario","Chat en tiempo real","Carnets PDF descargables","Importación masiva","Exportación de reportes","API de acceso","White label","Soporte prioritario","Integraciones custom"],"permissions":{"can_grades":true,"can_attendance":true,"can_documents":true,"can_parents_portal":true,"can_homework":true,"can_certificates":true,"can_virtual_classes":true,"can_ai_assistant":true,"can_chat":true,"can_carnets":true,"can_bulk_import":true,"can_export_reports":true,"can_api_access":true,"can_white_label":true,"can_priority_support":true}}',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  max_users = EXCLUDED.max_users,
  max_students = EXCLUDED.max_students,
  features = EXCLUDED.features,
  status = EXCLUDED.status;
