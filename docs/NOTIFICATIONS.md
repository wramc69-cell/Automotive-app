# Sistema de Notificaciones

El sistema utiliza un patrón de adaptadores para gestionar múltiples canales de comunicación, con integración real para emails y simulaciones para otros canales populares.

## Canales Soportados
- **Email (Real)**: Integrado con la API de **Resend**. Requiere `VITE_RESEND_API_KEY`.
- **SMS (Simulado)**: Registra el envío en consola para propósitos de MVP.
- **WhatsApp (Simulado)**: Preparado para futura integración con proveedores como Twilio o Meta.
- **Telegram (Simulado)**: Preparado para integración con bots de Telegram.

## Plantillas de Mensajes
Las plantillas se gestionan mediante la función `getTemplates`, que recibe datos dinámicos:
- `APPOINTMENT_CONFIRMED`: Confirmación de cita.
- `DIAGNOSIS_READY`: Notificación de diagnóstico disponible.
- `QUOTE_SENT`: Envío de presupuesto para aprobación.
- `QUOTE_APPROVED/DECLINED`: Feedback tras la decisión del cliente.
- `STAFF_INVITATION`: Invitación para nuevos Administradores o Técnicos.
- `ADMIN_TECH_REQUEST`: Notificación crítica al Admin sobre un nuevo registro de técnico.

## Lógica de Envío
1. El sistema busca una API Key en las variables de entorno.
2. Si existe la llave, intenta el envío real a través del proveedor.
3. Si no existe, genera un log de simulación exitosa (`SIMULATED_EMAIL/SMS/etc`).
4. Todas las notificaciones enviadas (reales o simuladas) quedan registradas en la tabla `notifications_outbox` de la base de datos para auditoría.

## Configuración de Remitente
Actualmente se utiliza `onboarding@resend.dev` como remitente por defecto. Para producción, se debe verificar un dominio propio en el panel de Resend y actualizar la constante `from` en `src/lib/notifications.ts`.
