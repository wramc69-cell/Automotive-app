# Modelo de Base de Datos - Supabase

## Tipos Personalizados (Enums)
- `app_role`: CUSTOMER, TECH, ADMIN.
- `request_status`: DRAFT, SUBMITTED, TRIAGE, SCHEDULED, IN_PROGRESS, PENDING_APPROVAL, APPROVED, DECLINED, COMPLETED, CANCELED.
- `appointment_status`: SCHEDULED, EN_ROUTE, ARRIVED, IN_PROGRESS, COMPLETED, CANCELED.
- `risk_level`: LOW, MEDIUM, HIGH, CRITICAL.

## Tablas Principales

### Usuarios y Perfiles
- **profiles**: Extiende `auth.users`. Almacena nombre, teléfono y rol.
- **vehicles**: Vehículos de los clientes (año, marca, modelo, VIN/Placas en notas).

### Operaciones
- **service_catalog**: Catálogo de servicios base (ej. Diagnóstico, Frenos).
- **service_requests**: El "Ticket" principal. Vincula cliente, vehículo y estatus.
- **appointments**: Citas específicas para una solicitud. Incluye dirección, coordenadas y técnico asignado.
- **symptom_tags**: Etiquetas de síntomas comunes seleccionables por el usuario.

### Técnico e Inspección
- **inspection_checklists**: Plantillas de inspección.
- **checklist_items**: Ítems individuales de una plantilla.
- **inspections**: Resultados de la inspección realizada por el técnico.
- **quotes**: Cotización generada tras la inspección.
- **quote_items**: Conceptos de mano de obra y refacciones.
- **quote_approvals**: Registro de aceptación del cliente (firma digital simulada).

### Auxiliares
- **notifications_outbox**: Cola de mensajes para enviar por email/SMS.
- **audit_logs**: Registro de cambios críticos en el sistema.
- **chatbot_sessions/messages**: Historial de interacción con el asistente inteligente.

## Seguridad (RLS)
Todas las tablas tienen **Row Level Security** habilitado:
- **Clientes**: Solo acceden a sus propios vehículos, solicitudes y aprobaciones.
- **Técnicos**: Acceden a servicios asignados y pueden crear inspecciones/cotizaciones.
- **Administradores**: Acceso total a todas las tablas para gestión manual.
