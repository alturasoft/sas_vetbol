# 🏗️ Arquitectura SaaS Veterinaria — Ajustada para Hosting Compartido HostGator

> **Restricción aplicada:** Solo se cuenta con hosting compartido + dominio en HostGator.  
> Sin VPS, sin SSH, sin acceso root, sin Redis, sin workers background.

---

## 🧠 La Solución: Arquitectura JAMstack (Zero-Backend en el Hosting)

La clave es **no correr ningún backend en HostGator**. El hosting solo sirve archivos estáticos (HTML, CSS, JS compilados). Toda la lógica vive en servicios cloud externos ya disponibles en tu proyecto.

```
  TU DOMINIO (HostGator)
  app_veterinaria.com
        │
        │  Solo sirve archivos estáticos
        │  (HTML + CSS + JS compilado)
        ▼
┌──────────────────────────────────────────────────────────────┐
│              FRONTEND SPA — React + Vite                      │
│         (Archivos dist/ subidos por FTP / cPanel)            │
│                                                              │
│  📊 Dashboard Clínica     │  🛠️  Super-Admin SaaS            │
│  📅 Agenda / Citas        │  💳 Suscripciones / Planes       │
│  🐾 Pacientes             │  📈 Reportes / Estadísticas      │
│  📋 Historia Clínica      │  🏥 Gestión de Tenants           │
│                                                              │
│  React 18 + Vite 6 + TypeScript + Tailwind CSS + shadcn/ui  │
└──────────────────────────┬───────────────────────────────────┘
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  SUPABASE       │ │   STRIPE     │ │   RESEND        │
│  (ya existente) │ │  Pagos SaaS  │ │  Emails         │
│                 │ │              │ │  transaccionales │
│ • PostgreSQL    │ │ • Checkout   │ │                 │
│ • Auth + RLS    │ │ • Webhooks → │ │ • Recordatorio  │
│ • Storage       │ │   Edge Fn    │ │   de citas      │
│ • Realtime      │ │ • Portal     │ │ • Bienvenida    │
│ • Edge Functions│ └──────────────┘ │ • Facturas      │
│   (serverless)  │                  └─────────────────┘
└─────────────────┘
```

---

## 🏗️ Por Qué Esta Arquitectura Funciona sin VPS

| Necesidad SaaS | Sin VPS (cómo resolverlo) |
|----------------|--------------------------|
| Backend / API | ✅ Supabase REST + GraphQL API (ya tienes) |
| Autenticación | ✅ Supabase Auth (ya configurado) |
| Base de datos | ✅ Supabase PostgreSQL + RLS (ya tienes) |
| Lógica de server | ✅ Supabase Edge Functions (Deno, serverless) |
| Pagos y suscripciones | ✅ Stripe Checkout (redirect, sin server propio) |
| Emails automáticos | ✅ Resend.com API (desde Edge Functions) |
| Archivos / imágenes | ✅ Supabase Storage (ya configurado) |
| PDF / reportes | ✅ Generación en cliente con `@react-pdf/renderer` |
| Tiempo real | ✅ Supabase Realtime (WebSockets gestionados) |
| CI/CD / Deploy | ✅ FTP a HostGator tras `npm run build` |

---

## 🛠️ Stack Tecnológico Definitivo

### Frontend — Lo que se ejecuta en el navegador del usuario

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **React** | 18+ | Framework UI — componentes reactivos |
| **Vite** | 6+ | Build tool — compilación ultrarrápida |
| **TypeScript** | 5+ | Tipado estático — código más seguro |
| **Tailwind CSS** | 4 | Diseño moderno, utility-first |
| **shadcn/ui** | latest | Componentes UI premium y accesibles |
| **React Router v7** | 7 | Navegación SPA client-side |
| **TanStack Query** | 5 | Caché y sincronización de datos |
| **TanStack Table** | 8 | Tablas avanzadas (listas de pacientes, citas) |
| **React Hook Form** | 7 | Formularios performantes |
| **Zod** | 3 | Validación de esquemas |
| **Zustand** | 5 | Estado global ligero (alternativa liviana a Redux) |
| **@supabase/supabase-js** | 2 | Cliente oficial Supabase |
| **@react-pdf/renderer** | 4 | PDFs generados en el cliente |
| **FullCalendar** | 6 | Agenda de citas drag-and-drop |
| **ApexCharts / Recharts** | latest | Gráficas de dashboard |
| **date-fns** | 4 | Manipulación de fechas |
| **Lucide React** | latest | Iconos modernos |

### Backend — Servicios cloud externos (sin servidor propio)

| Servicio | Rol | Costo inicial |
|---------|-----|--------------|
| **Supabase** | DB + Auth + Storage + Realtime + Edge Functions | Gratis (Free tier) |
| **Stripe** | Suscripciones, pagos, portal del cliente | % por transacción |
| **Resend** | Emails transaccionales (API moderna) | Gratis hasta 3.000/mes |

### Hosting

| Recurso | Uso |
|---------|-----|
| **HostGator** | Sirve el `dist/` compilado (HTML+CSS+JS estáticos) |
| **Supabase Cloud** | Toda la lógica de datos y autenticación |
| **Stripe CDN** | Checkout redirect (sin código de pago en tu server) |

---

## 📦 Proceso de Deploy (Sin VPS, Sin SSH)

```
DEV → Código React en tu máquina local
         │
         │  npm run build
         ▼
      dist/
      ├── index.html
      ├── assets/
      │   ├── main-abc123.js   (React compilado)
      │   ├── main-xyz789.css  (Tailwind compilado)
      │   └── ...
         │
         │  Subir por FTP / cPanel File Manager
         ▼
   public_html/ (HostGator)  ← Tu dominio apunta aquí
   ├── index.html
   ├── .htaccess             ← Reglas para SPA routing
   └── assets/
```

### Archivo `.htaccess` obligatorio para SPA en Apache (HostGator)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

> Este archivo es **crítico**: sin él, al refrescar la página en cualquier ruta (ej: `/citas/nueva`) obtendrás un error 404.

---

## 🔐 Seguridad en Arquitectura JAMstack + Supabase

```
CLIENTE (React SPA)
     │
     │  Solo puede llamar a Supabase con las credenciales
     │  del USUARIO AUTENTICADO (anon key + JWT)
     │
     ▼
SUPABASE RLS (Row Level Security)
     │
     │  Cada query PostgreSQL verifica:
     │  auth.uid() = user_id  AND  tenant_id = mi_tenant
     │
     ▼
DATOS  → El usuario SOLO ve los datos de SU clínica

┌──────────────────────────────────────────────────────────┐
│  REGLAS DE SEGURIDAD QUE YA TIENES EN SUPABASE          │
│                                                          │
│  • RLS activado en todas las tablas ✅                  │
│  • Políticas por tenant_id ✅                           │
│  • Auth con JWT firmado por Supabase ✅                  │
│  • Storage buckets con permisos por tenant ✅            │
└──────────────────────────────────────────────────────────┘
```

**Variables de entorno en React (seguras):**
```env
# .env (solo estas vars son públicas — es normal en BaaS)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...  ← llave pública, no secreta
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...  ← pública por diseño
```

> ⚠️ Las llaves secretas (Stripe secret, Resend API key) van **SOLO** en Supabase Edge Functions como variables de entorno del servidor. NUNCA en el frontend.

---

## ⚡ Supabase Edge Functions — Tu "Backend" Serverless

Para lógica que requiere secretos o procesamiento del lado del servidor, usas Edge Functions (Deno, TypeScript), desplegadas directamente en Supabase:

```
FUNCIONES QUE NECESITARÁS:

stripe-checkout/        → Crea sesión de pago Stripe
stripe-webhook/         → Procesa eventos (activar/cancelar plan)
send-email-cita/        → Envía recordatorio por Resend
create-tenant/          → Provisiona nueva clínica al registrarse
generate-invoice/       → Genera PDF de factura (en servidor)
```

**Ejemplo de Edge Function para crear checkout Stripe:**
```typescript
// supabase/functions/stripe-checkout/index.ts
import Stripe from "https://esm.sh/stripe@14";

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
  const { planId, clinicId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: planId, quantity: 1 }],
    success_url: `https://tu-dominio.com/success`,
    cancel_url: `https://tu-dominio.com/pricing`,
    metadata: { clinicId },
  });

  return new Response(JSON.stringify({ url: session.url }));
});
```

---

## 🗺️ Diagrama de Flujos de Usuario

```
FLUJO 1 — Nueva Clínica se Registra
   Landing Page → Formulario Registro → Supabase Auth (crea user)
   → Edge Function create-tenant (crea fila en tabla clinics)
   → Stripe Checkout (selecciona plan)
   → Stripe Webhook → Edge Function (activa suscripción en DB)
   → Redirect al Dashboard ✅

FLUJO 2 — Login de Clínica Existente
   Login → Supabase Auth → JWT Token → Dashboard
   → Todas las queries filtradas por tenant_id via RLS ✅

FLUJO 3 — App Móvil y Web Comparten Datos
   App Flutter → Supabase ← React Web
   Ambas usan el MISMO proyecto Supabase
   Cambios en tiempo real via Supabase Realtime ✅
```

---

## 📊 Costos Estimados (Inicio → Escala)

| Servicio | Fase MVP (0 clientes) | Fase Growth (50+ clientes) |
|---------|----------------------|---------------------------|
| HostGator Hosting | Ya pagado | Ya pagado |
| Supabase | $0 (Free tier) | $25/mes (Pro, necesario en producción) |
| Stripe | $0 + 2.9% + $0.30/tx | 2.9% + $0.30/tx |
| Resend (emails) | $0 hasta 3k/mes | $20/mes |
| **TOTAL FIJO** | **$0/mes** | **~$45/mes** |

> 💡 El hosting de HostGator que ya tienes cubre perfectamente el frontend estático. No necesitas nada más en infraestructura.

---

## 🚀 Roadmap de Implementación

### Fase 1 — Scaffold y Auth (1-2 semanas)
- [ ] `npm create vite@latest` → React + TypeScript
- [ ] Instalar Tailwind CSS 4 + shadcn/ui
- [ ] Configurar cliente `@supabase/supabase-js`
- [ ] Pantallas de Login / Registro conectadas a Supabase Auth
- [ ] Guard de rutas por sesión y por tenant
- [ ] Deploy inicial a HostGator con `.htaccess`

### Fase 2 — Dashboard Core (3-5 semanas)
- [ ] Layout principal (sidebar + topbar)
- [ ] Módulo de Citas (FullCalendar + CRUD Supabase)
- [ ] Módulo de Pacientes y Mascotas
- [ ] Módulo de Historia Clínica (formulario SOAP)

### Fase 3 — Módulos Avanzados (3-5 semanas)
- [ ] Cirugías y Hospitalizaciones
- [ ] Reportes con ApexCharts (ingresos, citas, pacientes)
- [ ] Generación de PDF en cliente
- [ ] Emails automáticos (recordatorios de cita via Edge Function)

### Fase 4 — SaaS Layer (2-3 semanas)
- [ ] Landing page de marketing
- [ ] Página de Precios / Planes
- [ ] Integración Stripe (Edge Functions)
- [ ] Panel Super-Admin (gestión de todas las clínicas)
- [ ] Portal del cliente (dueño de mascota)

---

## 📋 Resumen Ejecutivo — Stack Final

| Aspecto | Tecnología | Dónde corre |
|---------|-----------|------------|
| **Framework UI** | React 18 + Vite 6 | Navegador del usuario |
| **Lenguaje** | TypeScript 5 | Compilado a JS |
| **CSS** | Tailwind CSS 4 | Compilado a CSS |
| **Componentes** | shadcn/ui | Navegador |
| **Estado** | Zustand + TanStack Query | Navegador |
| **Routing** | React Router v7 | Navegador (SPA) |
| **Base de Datos** | Supabase PostgreSQL | Supabase Cloud |
| **Auth** | Supabase Auth | Supabase Cloud |
| **Storage** | Supabase Storage | Supabase Cloud |
| **Lógica server** | Supabase Edge Functions | Supabase Cloud (Deno) |
| **Tiempo real** | Supabase Realtime | Supabase Cloud |
| **Pagos** | Stripe Checkout | Stripe Cloud |
| **Emails** | Resend API | Resend Cloud |
| **Hosting** | HostGator (archivos estáticos) | Tu hosting actual |
| **Deploy** | Build → FTP → public_html | Manual o GitHub Actions |
