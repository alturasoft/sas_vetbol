# Especificación de Software y Plan de Migración: Portal Web SaaS Veterinario

**Versión:** 1.0  
**Fecha:** 2026-09-11  
**Stack de Origen (Móvil):** Flutter / Dart (Clean Architecture + Riverpod + GoRouter)  
**Stack de Destino (Web SaaS):** React 18+ / Vite / TypeScript / Tailwind CSS / TanStack Query / Zustand / Supabase  
**Base de Datos:** PostgreSQL en Supabase (Esquema: `veterinarias`, 30 tablas, 3 vistas unificadas)  

---

## 1. Mapeo del Esquema de Base de Datos y Arquitectura Multi-Tenant (SaaS)

### 1.1 Resumen Estructural del Esquema `veterinarias`

El sistema descansa sobre una arquitectura relacional en PostgreSQL alojada en Supabase, organizada en el esquema `veterinarias`. Abarca **30 tablas**, **3 vistas unificadas** y un conjunto de **triggers, funciones y políticas RLS**.

```
                           ┌────────────────────────┐
                           │      veterinarias      │ (Tenant Principal)
                           └───────────┬────────────┘
                                       │ 1:1
                                       ├─────────────────────────────┐
                                       │                             │
                        ┌──────────────┴─────────────┐ ┌─────────────┴────────────┐
                        │       suscripciones        │ │          roles           │
                        └────────────────────────────┘ └─────────────┬────────────┘
                                                                     │ 1:N
                                                       ┌─────────────┴────────────┐
                                                       │      roles_permisos      │
                                                       └─────────────┬────────────┘
                                                                     │ N:1
                                                       ┌─────────────┴────────────┐
                                                       │         permisos         │
                                                       └──────────────────────────┘
                                       │ 1:N
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
┌────────┴────────┐           ┌────────┴────────┐           ┌────────┴────────┐
│    personal     │           │    clientes     │           │    servicios    │
└────────┬────────┘           └────────┬────────┘           └─────────────────┘
         │                             │
         │ (1:1 usuarios_roles)        │ 1:N
         │                             │
         │                    ┌────────┴────────┐
         │                    │    mascotas     │
         │                    └────────┬────────┘
         │                             │
         └───────────────┬─────────────┴────────────────┐
                         │                              │
                ┌────────┴────────┐            ┌────────┴────────┐
                │      citas      │            │historias_clinicas│
                └─────────────────┘            └────────┬────────┘
                                                        │
                      ┌─────────────────────────────────┼────────────────────────────────┐
                      │                                 │                                │
            ┌─────────┴─────────┐             ┌─────────┴─────────┐            ┌─────────┴─────────┐
            │  hospitalizaciones│             │     cirugias      │            │  signos_vitales   │
            └─────────┬─────────┘             └───────────────────┘            │   diagnosticos    │
                      │                                                        │     recetas       │
            ┌─────────┴─────────┐                                              │   tratamientos    │
            │historia_evolucion │                                              │     examenes      │
            └───────────────────┘                                              │     archivos      │
                                                                               └───────────────────┘
```

### 1.2 Catálogo Completo de Tablas y Vistas del Esquema `veterinarias`

| Categoría | Tablas / Vistas | Propósito |
| :--- | :--- | :--- |
| **Tenant y Facturación** | `veterinarias`, `suscripciones`, `departamentos` | Gestión de clínicas inquilinas, planes, periodos de prueba y facturación. |
| **Seguridad y Accesos** | `roles`, `permisos`, `roles_permisos`, `usuarios_roles` | Sistema RBAC configurable por clínica y global. |
| **Recursos Humanos** | `personal`, `horarios_personal` | Empleados, veterinarios, asistentes, horarios laborales y turnos. |
| **Directorio de Clientes**| `clientes`, `mascotas` | Propietarios de mascotas y fichas biológicas de los pacientes. |
| **Agenda y Turnos** | `citas`, `servicios`, `bloqueos_agenda`, `citas_historial`, `citas_notificaciones` | Programación de citas médicas, bloqueos de agenda y trazabilidad. |
| **Expediente Clínico** | `historias_clinicas`, `historia_signos_vitales`, `historia_diagnosticos`, `historia_recetas`, `historia_tratamientos`, `historia_examenes`, `historia_archivos`, `historial_vacunas` | Registro de consultas médicas, posologías, laboratorio y vacunación. |
| **Área Hospitalaria** | `hospitalizaciones`, `historia_evolucion_hospitalizacion` | Admisión de internados, control de jaulas y evolución horaria. |
| **Área Quirúrgica** | `cirugias` | Protocolos de quirófano, anestesia, cirujanos y posoperatorio. |
| **Comunicación y Logs** | `publicaciones`, `avisos_cliente`, `notificaciones_trace` | Anuncios públicos, notificaciones 1 a 1 y tracing de push notifications. |
| **Vistas Analíticas** | `vw_timeline_clinico`, `vw_agenda_general`, `v_notificaciones_trace` | Vistas SQL consolidadas para alta velocidad de lectura. |

### 1.3 Estrategia de Aislamiento Multi-Tenant

#### 1. Identificador de Tenant (`id_veterinaria`)
Cada registro operativo (`clientes`, `mascotas`, `personal`, `citas`, `historias_clinicas`, `hospitalizaciones`, `cirugias`, `servicios`, `avisos_cliente`, `publicaciones`) almacena de forma obligatoria `id_veterinaria BIGINT NOT NULL`.

#### 2. Resolución de Tenant en Supabase RLS
El usuario autenticado en `auth.users` se asocia con `veterinarias.personal.user_id` o `veterinarias.clientes.user_id`. La función de seguridad en PostgreSQL resuelve el tenant en tiempo de ejecución:

```sql
CREATE OR REPLACE FUNCTION veterinarias.get_current_veterinaria_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = veterinarias, public
AS $$
  SELECT id_veterinaria 
  FROM veterinarias.personal 
  WHERE user_id = auth.uid() AND estado = 'VIG'
  LIMIT 1;
$$;
```

#### 3. Políticas Row Level Security (RLS)
Cada tabla del esquema `veterinarias` cuenta con RLS activo:
```sql
CREATE POLICY "Tenant isolation for historias_clinicas" 
ON veterinarias.historias_clinicas
FOR ALL TO authenticated
USING (id_veterinaria = veterinarias.get_current_veterinaria_id())
WITH CHECK (id_veterinaria = veterinarias.get_current_veterinaria_id());
```

#### 4. Motor de Suscripciones SaaS (Fail-Secure)
- La tabla `veterinarias.suscripciones` controla la vigencia operativa:
  - `estado`: `trial`, `active`, `past_due`, `canceled`, `expired`, `suspended`.
  - `fecha_proximo_vencimiento` y `fecha_vencimiento_trial`.
- **Regla Fail-Secure:** Si una veterinaria no tiene registro de suscripción o su fecha de vencimiento (`UTC`) es anterior al momento actual, el middleware/router redirige forzosamente a `/suscripcion` (Paywall), denegando el acceso a los módulos operativos.

---

## 2. Seguridad, Roles y Permisos (RBAC)

### 2.1 Modelo de Autorización Dinámico
La arquitectura de permisos implementa RBAC granular mediante tablas:
- `veterinarias.roles`: Roles por veterinaria (ej. ADMINISTRADOR, SUPERVISOR, VETERINARIO, ASISTENTE, RECEPCION, CLIENTE).
- `veterinarias.permisos`: Catálogo de permisos del sistema.
- `veterinarias.roles_permisos`: Asignación muchos a muchos de permisos a roles.
- `veterinarias.usuarios_roles`: Asignación de rol por colaborador (`id_persona`).

### 2.2 RPC de Hidratación de Sesión: `public.get_mis_permisos()`
Una única llamada RPC tras el login recupera el perfil y todos los permisos asignados en un arreglo:
```sql
SELECT * FROM public.get_mis_permisos();
-- Retorna:
-- rol_nombre: 'ADMINISTRADOR'
-- permisos_codigos: ['VER_CLIENTES', 'CREAR_CLIENTES', 'VER_HISTORIA_CLINICA', ...]
```

### 2.3 Matriz de Roles y Permisos

| Código del Permiso | Módulo | SuperAdmin SaaS | Admin Clínica | Veterinario | Asistente | Recepción | Cliente (Dueño) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **TENANT_MANAGEMENT** | SuperAdmin | **CRUD** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **VER_CLIENTES** | Clientes | 👁️ (Global) | 👁️ | 👁️ | 👁️ | 👁️ | ❌ |
| **CREAR_CLIENTES** | Clientes | ❌ | ✍️ | ❌ | ❌ | ✍️ | ❌ |
| **EDITAR_CLIENTES** | Clientes | ❌ | ✍️ | ❌ | ❌ | ✍️ | ❌ |
| **ELIMINAR_CLIENTES** | Clientes | ❌ | 🗑️ | ❌ | ❌ | ❌ | ❌ |
| **VER_MASCOTAS** | Mascotas | 👁️ (Global) | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ (Propias) |
| **CREAR_MASCOTAS** | Mascotas | ❌ | ✍️ | ✍️ | ❌ | ✍️ | ✍️ (Solicitud) |
| **EDITAR_MASCOTAS** | Mascotas | ❌ | ✍️ | ✍️ | ❌ | ✍️ | ✍️ (Básicos) |
| **ELIMINAR_MASCOTAS**| Mascotas | ❌ | 🗑️ | ❌ | ❌ | ❌ | ❌ |
| **VER_CITAS** | Citas | 👁️ (Global) | 👁️ | 👁️ (Todas/Propias) | 👁️ | 👁️ | 👁️ (Propias) |
| **CREAR_CITAS** | Citas | ❌ | ✍️ | ✍️ | ✍️ | ✍️ | ✍️ (Solicitud) |
| **EDITAR_CITAS** | Citas | ❌ | ✍️ | ✍️ | ✍️ | ✍️ | ❌ |
| **CANCELAR_CITAS** | Citas | ❌ | ✍️ | ✍️ | ❌ | ✍️ | ✍️ (Anticipada) |
| **VER_HISTORIA_CLINICA**| Historia Clínica| ❌ | 👁️ | 👁️ | 👁️ | ❌ | ❌ |
| **CREAR_CONSULTA** | Historia Clínica| ❌ | ✍️ | ✍️ | ❌ | ❌ | ❌ |
| **EDITAR_CONSULTA** | Historia Clínica| ❌ | ✍️ | ✍️ (Propia) | ❌ | ❌ | ❌ |
| **VER_RECETAS** | Historia Clínica| ❌ | 👁️ | 👁️ | 👁️ | ❌ | 👁️ (Propias) |
| **CREAR_RECETAS** | Historia Clínica| ❌ | ✍️ | ✍️ | ❌ | ❌ | ❌ |
| **HOSPITALIZACION_OP** | Hospitalización | ❌ | ✍️ | ✍️ | ✍️ (Signos) | 👁️ | 👁️ (Estado) |
| **CIRUGIA_OP** | Quirófano | ❌ | ✍️ | ✍️ | 👁️ | ❌ | ❌ |
| **VER_INVENTARIO** | Configuración | ❌ | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ (Públicos) |
| **EDITAR_INVENTARIO**| Configuración | ❌ | ✍️ | ❌ | ❌ | ❌ | ❌ |
| **VER_REPORTES** | Reportes | 👁️ (Global) | 👁️ | ❌ | ❌ | ❌ | ❌ |
| **ADMINISTRAR_PUBLICACIONES**| Comunicación | ❌ | ✍️ | ❌ | ❌ | ✍️ | ❌ |
| **ADMINISTRAR_USUARIOS** | Personal | ❌ | ✍️ | ❌ | ❌ | ❌ | ❌ |
| **ADMINISTRAR_ROLES** | Seguridad | ❌ | ✍️ | ❌ | ❌ | ❌ | ❌ |
| **CONFIGURACION_GENERAL**| Configuración | ❌ | ✍️ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Inventario Completo de Módulos Funcionales Extraídos del Código

### Módulo 1: Agenda de Citas y Turnos
- **Tablas:** `citas`, `servicios`, `bloqueos_agenda`, `horarios_personal`, `citas_historial`, `citas_notificaciones`.
- **Lógica Central:**
  - Control de solapamiento de horarios por profesional y servicio.
  - Validación de días laborales y turnos activos en `horarios_personal`.
  - Estados: `PENDIENTE`, `CONFIRMADA`, `EN_PROCESO`, `COMPLETADA`, `CANCELADA`.
  - Auditoría de modificaciones de turnos en `citas_historial`.
  - Vista general consolidada: `vw_agenda_general`.

### Módulo 2: Expediente Clínico Electrónico (Historia Clínica)
- **Tablas:** `historias_clinicas`, `historia_signos_vitales`, `historia_diagnosticos`, `historia_recetas`, `historia_tratamientos`, `historia_examenes`, `historia_archivos`.
- **Lógica Central:**
  - Registro de consultas: anamnesis, constantes vitales (peso, temperatura, FC, FR, mucosas, hidratación).
  - Diagnósticos presuntivos y definitivos con gravedad y catálogo CIE-Vet.
  - Generación de recetas farmacológicas (medicamento, dosis, vía, frecuencia, duración).
  - Subida y visualización de exámenes complementarios (PDF e imágenes en Supabase Storage).
  - Línea de tiempo unificada: `vw_timeline_clinico`.

### Módulo 3: Hospitalizaciones y Cuidados Intensivos
- **Tablas:** `hospitalizaciones`, `historia_evolucion_hospitalizacion`.
- **Lógica Central:**
  - Admisión clínica: motivo, diagnóstico de ingreso, habitación o jaula asignada.
  - Seguimiento horario: registro de evolución periódica, signos vitales y tratamientos administrados.
  - Estados: `INGRESADO`, `EN_TRATAMIENTO`, `OBSERVACION`, `ALTA`, `FALLECIDO`.
  - Resumen y protocolo de alta médica.

### Módulo 4: Quirófano y Procedimientos Quirúrgicos
- **Tablas:** `cirugias`.
- **Lógica Central:**
  - Programación quirúrgica: tipo de cirugía, cirujano asignado, anestesia planificada.
  - Protocolo operatorio: descripción del procedimiento, hallazgos, complicaciones intraoperatorias.
  - Estados: `PROGRAMADA`, `EN_QUIROFANO`, `FINALIZADA`, `CANCELADA`.

### Módulo 5: Medicina Preventiva y Vacunación
- **Tablas:** `historial_vacunas`.
- **Lógica Central:**
  - Control de vacunas aplicadas por especie (canino/felino).
  - Registro de lote, dosificación y fecha de refuerzo sugerida.

### Módulo 6: Gestión de Pacientes (Mascotas)
- **Tablas:** `mascotas`.
- **Lógica Central:**
  - Ficha biológica completa (especie, raza, sexo, fecha de nacimiento, cálculo dinámico de edad en años y meses).
  - Registro de alertas médicas críticas (alergias, agresividad, padecimientos crónicos).

### Módulo 7: Gestión de Clientes (Propietarios)
- **Tablas:** `clientes`.
- **Lógica Central:**
  - Directorio de titulares con documento de identidad (CI/NIT), teléfono WhatsApp y correo electrónico.
  - Vinculación con cuenta de acceso de cliente en Supabase Auth (`user_id`).

### Módulo 8: Catálogo de Servicios y Tarifario
- **Tablas:** `servicios`.
- **Lógica Central:**
  - Mantenimiento de catálogo de atenciones (consultas, ecografías, cirugías, estética, vacunas).
  - Configuración de duración en minutos y precio base.

### Módulo 9: Personal, Horarios y Control de Accesos
- **Tablas:** `personal`, `horarios_personal`, `usuarios_roles`.
- **Lógica Central:**
  - Gestión de plantilla médica y administrativa.
  - Definición de horarios de atención por día de la semana.
  - Asignación de rol de seguridad en la clínica.

### Módulo 10: Comunicación y Avisos
- **Tablas:** `publicaciones`, `avisos_cliente`, `notificaciones_trace`.
- **Lógica Central:**
  - Publicación de avisos y promociones en la app móvil.
  - Envío de notificaciones directas 1 a 1 a clientes sobre turnos y altas.
  - Trazabilidad y logs de notificaciones push (FCM).

### Módulo 11: Portal del Cliente (Client Experience)
- **Tablas:** `clientes`, `mascotas`, `citas`, `avisos_cliente`.
- **Lógica Central:**
  - Carnet digital de vacunas, historial y estado de hospitalización en tiempo real.
  - Solicitud de citas en línea.

### Módulo 12: Facturación SaaS y Suscripción de la Clínica
- **Tablas:** `suscripciones`.
- **Lógica Central:**
  - Control del periodo de prueba (trial de 30 días).
  - Validación de acceso activo y paywall por vencimiento.
  - Flujo de solicitud y activación de planes.

---

## 4. Adaptación UI/UX: De Móvil a Web SaaS de Escritorio

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Móvil (375px) - Secuencial y Paginado           Web Escritorio (1440px) - Integrado   │
│                                                                                        │
│  [ Pantalla 1: Listado ]                         ┌───────────┬──────────────┬────────┐ │
│  ┌────────────────────┐                          │ Sidebar   │ Data Table   │ Quick  │ │
│  │ Mascota 1          │                          │ Navegación│ Pacientes    │ Detail │ │
│  │ Mascota 2          │                          │           │ con Filtros  │ Drawer │ │
│  └─────────┬──────────┘                          │           │ y Búsqueda   │        │ │
│            │ Tap                                 │           │ en Vivo      │        │ │
│  [ Pantalla 2: Detalle ]                         │           │              │        │ │
│  ┌────────────────────┐                          │           │              │        │ │
│  │ Historial Clínico  │                          │           │              │        │ │
│  └─────────┬──────────┘                          │           │              │        │ │
│            │ Tap                                 │           │              │        │ │
│  [ Pantalla 3: Consulta]                         └───────────┴──────────────┴────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Módulo | Enfoque Móvil (Flutter) | Propuesta Web SaaS (Escritorio) | Beneficio UX |
| :--- | :--- | :--- | :--- |
| **Agenda de Citas** | Listas verticales con cambio de fecha día a día. | **FullCalendar / Scheduler Semanal y Diario Multi-Columna** por veterinario con drag & drop y modal de cita rápida. | Visión panorámica de toda la clínica en una sola pantalla. |
| **Pacientes y Clientes** | Cards verticales con scroll infinito. | **DataTable Avanzada** con ordenamiento por columnas, filtros combinados (especie, estado, cliente) y exportación a Excel/PDF. | Búsqueda y gestión masiva en segundos. |
| **Historia Clínica** | Wizard móvil de 7 pasos secuenciales. | **Panel Clínico de 2 Columnas**: Ficha del paciente y constantes vitales a la izquierda; tabs de evolución, diagnósticos y recetas a la derecha. | Registro rápido de la consulta médica sin perder contexto visual. |
| **Hospitalizaciones** | Lista simple de internados. | **Tablero Visual de Jaulas / Habitaciones (Bed Management)** tipo Kanban con badges de estado y drawer lateral de evolución horaria. | Control visual inmediato del aforo y estado crítico. |
| **Timeline Clínico** | ListView con acordeones colapsables. | **Timeline Interactivo Multicapa** con filtros rápidos por tipo de evento y generación de informe clínico consolidado en PDF. | Auditoría rápida de antecedentes del paciente. |
| **Configuración** | Pantallas de navegación multinivel. | **Settings Layout con Tabs**: Perfil de clínica, empleados, horarios y suscripción integrados. | Navegación administrativa ágil y centralizada. |

---

## 5. Propuesta de Arquitectura Frontend para la Web SaaS

### 5.1 Stack Tecnológico
- **Core:** React 18+ con TypeScript y Vite.
- **Estilos:** Tailwind CSS v3 + Radix UI / Shadcn UI primitives.
- **Server State & Caching:** TanStack Query v5 (`@tanstack/react-query`).
- **Client State:** Zustand (`useAuthStore`, `useTenantStore`, `useUIStore`).
- **Enrutamiento:** React Router DOM v6 con Router Guards declarativos (`RoleGuard`, `SubscriptionGuard`).
- **Tablas y Calendarios:** TanStack Table v8 + FullCalendar React.
- **Formularios:** React Hook Form + Zod.
- **Conectividad:** `@supabase/supabase-js`.

### 5.2 Estructura de Carpetas (`sas_vetbol/src/`)

```
src/
├── assets/                  # Iconos, logos e imágenes estáticas
├── components/
│   ├── auth/                # RoleGuard, SubscriptionGuard, TenantGuard
│   ├── common/              # EmptyState, ErrorBoundary, PageHeader, LoadingSpinner
│   ├── layout/              # AppLayout, Sidebar, Navbar, NotificationsDrawer
│   └── ui/                  # Primitivas: Button, Dialog, Dropdown, Table, Input, Badge
├── config/
│   ├── env.ts               # Validación de variables de entorno
│   ├── navigation.ts        # Árbol de navegación según roles RBAC
│   └── supabase.ts          # Cliente Supabase singleton
├── hooks/                   # usePermissions, useDebounce, useActiveTenant
├── lib/
│   ├── queryClient.ts       # Configuración global de React Query
│   └── utils.ts             # Formatters de moneda (BOB), fechas (La Paz UTC-4) y clases
├── pages/
│   ├── auth/                # Login, RecuperarPassword, RegistroClinica
│   ├── dashboard/           # Métricas, KPIs de ocupación y turnos del día
│   ├── citas/               # Calendario maestro, Listado general, Bloqueos
│   ├── pacientes/           # DataTable de mascotas, Ficha clínica del paciente
│   ├── clientes/            # Directorio de clientes y cuentas asociadas
│   ├── historia-clinica/    # Editor de consulta médica, timeline clínico
│   ├── hospitalizaciones/   # Tablero de jaulas, evolución clínica horaria
│   ├── cirugias/            # Programación de quirófano y reportes operatorios
│   ├── configuracion/       # Perfil veterinaria, Servicios, Horarios, Personal & Roles
│   ├── suscripcion/         # Paywall, Planes, Historial de pagos
│   └── superadmin/          # Gestión global SaaS de clínicas y suscripciones
├── routes/
│   └── AppRouter.tsx        # Configuración central de rutas protegidas
├── services/                # Capa de acceso a Supabase organizada por dominio
│   ├── appointments.service.ts
│   ├── medical-records.service.ts
│   ├── patients.service.ts
│   └── tenant.service.ts
├── stores/                  # Stores Zustand (auth, tenant, ui)
└── types/                   # Interfaces TypeScript coincidentes con la base de datos
```

---

## 6. Plan de Implementación en Fases (Roadmap)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FASE 1     │     │   FASE 2     │     │   FASE 3     │
│  Cimientos y │ ──> │   Módulos    │ ──> │  Expediente  │
│  Seguridad   │     │  Directorio  │     │   Clínico    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
┌──────────────┐     ┌──────────────┐            │
│   FASE 6     │     │   FASE 5     │     ┌──────┴───────┐
│ Despliegue y │ <── │ Hospitaliza- │ <── │   FASE 4     │
│ Producción   │     │ ción/Cirugía │     │  Agenda Web  │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Fase 1: Cimientos, Multi-Tenancy y Matriz de Seguridad RBAC
1. Integrar autenticación con Supabase en `useAuthStore` e hidratar permisos vía `public.get_mis_permisos()`.
2. Implementar `RoleGuard` y `SubscriptionGuard` en el enrutador para proteger rutas según rol y vigencia de la suscripción.
3. Construir la carcasa de escritorio: Sidebar dinámico filtrado por permisos, Navbar con información de la clínica y selector de perfil.
4. Implementar la pantalla de Paywall `/suscripcion` para cuentas con pago vencido.

### Fase 2: Directorio de Clientes y Pacientes (DataTables Maestras)
1. Construir la DataTable de Clientes con búsqueda por CI, teléfono o nombre, y modal de creación/edición.
2. Construir la DataTable de Pacientes con filtros por especie (Canino, Felino), badges de alertas médicas y relación con el propietario.
3. Implementar la Ficha Maestra del Paciente (resumen de constantes, vacunas y accesos directos a consulta médica).

### Fase 3: Expediente Clínico Electrónico y Timeline Clínico
1. Diseñar el editor de consulta clínica en 2 columnas: Constantes vitales, diagnósticos CIE-Vet, recetario farmacéutico y subida de archivos laboratoriales a Supabase Storage.
2. Construir la vista de Timeline Clínico unificado utilizando la vista `vw_timeline_clinico`.
3. Desarrollar la plantilla de impresión de recetas e informes de consulta en formato PDF.

### Fase 4: Agenda y Calendario de Citas Inteligente
1. Integrar FullCalendar con vistas Mensual, Semanal y Diario por columnas de profesionales (`personal`).
2. Implementar el modal de reserva rápida con validación en tiempo real de solapamientos y turnos laborales.
3. Añadir el módulo de bloqueos de agenda y el catálogo de servicios con duraciones y tarifas.

### Fase 5: Hospitalizaciones, Quirófano y Medicina Preventiva
1. Desarrollar el tablero visual de jaulas / habitaciones de hospitalización (Bed Management).
2. Crear la hoja de evolución clínica periódica para pacientes internados con registro de signos vitales.
3. Implementar la gestión de quirófano (`cirugias`) con protocolos pre, trans y posquirúrgicos.
4. Integrar el control de vacunas y refuerzos preventivos.

### Fase 6: Panel Administrativo, Notificaciones y Puesta en Producción
1. Construir el módulo de administración de personal, horarios de turno y asignación de roles.
2. Implementar el Dashboard de métricas y KPIs de la clínica (citas del día, ocupación hospitalaria e ingresos por servicios).
3. Configurar el centro de avisos a clientes (`avisos_cliente`).
4. Pruebas de integración del aislamiento multi-tenant y despliegue del portal web en Vercel o Cloudflare Pages.
