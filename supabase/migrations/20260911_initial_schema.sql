-- ==============================================================================
-- VetBol SaaS — Esquema Inicial de Base de Datos Multi-Tenant con Supabase & RLS
-- Sin dependencia de Stripe (Aprovisionamiento directo de clínicas/tenants)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS Y ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('superadmin', 'clinic_admin', 'veterinarian', 'receptionist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLA DE CLÍNICAS / TENANTS
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Bolivia',
    logo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABLA DE PERFILES (VINCULADA A auth.users DE SUPABASE)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'veterinarian',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    license_number TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. FUNCIONES AUXILIARES PARA ROW LEVEL SECURITY (RLS)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$;

-- 6. TABLA DE DUEÑOS / PROPIETARIOS DE MASCOTAS
CREATE TABLE IF NOT EXISTS public.owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    document_id TEXT,
    email TEXT,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABLA DE PACIENTES / MASCOTAS
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT NOT NULL CHECK (species IN ('canine', 'feline', 'bird', 'rodent', 'reptile', 'equine', 'exotic', 'other')),
    breed TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    is_neutered BOOLEAN DEFAULT false,
    birth_date DATE,
    microchip TEXT,
    color TEXT,
    weight_kg NUMERIC(6,2),
    allergies TEXT,
    notes TEXT,
    avatar_url TEXT,
    is_alive BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLA DE CITAS / AGENDA
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL,
    veterinarian_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    reason TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TABLA DE HISTORIA CLÍNICA (CONSULTAS SOAP)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    veterinarian_id UUID NOT NULL REFERENCES public.profiles(id),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    consultation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    weight_kg NUMERIC(6,2),
    temperature_celsius NUMERIC(4,2),
    heart_rate_bpm INT,
    respiratory_rate_bpm INT,
    anamnesis TEXT,
    subjective TEXT, -- S: Motivo y signos relatados
    objective TEXT,  -- O: Exploración física y pruebas
    assessment TEXT, -- A: Diagnóstico presuntivo o confirmado
    plan TEXT,       -- P: Tratamiento, medicamentos y pautas
    follow_up_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER tr_owners_updated_at BEFORE UPDATE ON public.owners FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER tr_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER tr_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE OR REPLACE TRIGGER tr_medical_records_updated_at BEFORE UPDATE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- 12. POLÍTICAS RLS POR TENANT

-- Tenants:
-- Superadmin ve todas las clínicas. Los usuarios de una clínica ven solo su registro.
CREATE POLICY "Superadmin full access on tenants"
  ON public.tenants FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "Users can view own tenant"
  ON public.tenants FOR SELECT
  USING (id = public.get_user_tenant_id());

-- Profiles:
CREATE POLICY "Superadmin full access on profiles"
  ON public.profiles FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "Users can view profiles in same tenant"
  ON public.profiles FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Owners:
CREATE POLICY "Superadmin full access on owners"
  ON public.owners FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "Tenant users can view owners"
  ON public.owners FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can insert owners"
  ON public.owners FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update owners"
  ON public.owners FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete owners"
  ON public.owners FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- Patients:
CREATE POLICY "Superadmin full access on patients"
  ON public.patients FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "Tenant users can view patients"
  ON public.patients FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update patients"
  ON public.patients FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete patients"
  ON public.patients FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- Appointments:
CREATE POLICY "Superadmin full access on appointments"
  ON public.appointments FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "Tenant users can view appointments"
  ON public.appointments FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update appointments"
  ON public.appointments FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can delete appointments"
  ON public.appointments FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- Medical Records:
CREATE POLICY "Superadmin full access on medical records"
  ON public.medical_records FOR ALL
  USING (public.is_superadmin());

CREATE POLICY "Tenant users can view medical records"
  ON public.medical_records FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can insert medical records"
  ON public.medical_records FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant users can update medical records"
  ON public.medical_records FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
