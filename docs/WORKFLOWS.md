# Flujos de Trabajo (MVP Workflow)

El sistema está diseñado para cubrir el ciclo de vida completo de una reparación móvil.

## 1. Solicitud y Agendamiento (Cliente)
1. El cliente inicia sesión y registra su vehículo.
2. Crea una **Solicitud de Servicio** seleccionando síntomas o usando el Chatbot.
3. El sistema propone una cita (**Appointment**) tras capturar la dirección del servicio.
4. Estatus inicial: `SUBMITTED`.

## 2. Asignación y Triaje (Admin)
1. El administrador revisa las solicitudes entrantes en su Dashboard.
2. Evalúa el riesgo (`Triage Risk`) y valida la disponibilidad de técnicos.
3. El administrador **Asigna un Técnico** a la cita correspondiente.
4. Estatus cambia a: `SCHEDULED`.

## 3. Operación en Sitio (Técnico)
1. El técnico ve su agenda en el `Tech Dashboard`.
2. Marca el inicio del servicio: `EN_ROUTE` -> `ARRIVED`.
3. Realiza la **Inspección**: Llena el checklist correspondiente y documenta hallazgos.
4. Genera una **Cotización (Quote)**: Agrega refacciones y mano de obra.
5. Envía la cotización para aprobación: `PENDING_APPROVAL`.

## 4. Aprobación y Cierre (Cliente / Tech)
1. El cliente recibe una notificación y revisa el detalle en su portal.
2. El cliente acepta los términos y **Firma Digitalmente** la cotización.
3. El técnico procede con la reparación.
4. Una vez finalizado, marca como `COMPLETED`.
5. Se genera (opcionalmente) el registro de pago.

## 5. Notificaciones Automáticas
- Registro de técnico/admin (Notificación de bienvenida).
- Solicitud de nuevo servicio (Confirmación al cliente).
- Asignación de técnico (Aviso al técnico).
- Cotización lista (Aviso al cliente).
- Cambio de estatus general.
