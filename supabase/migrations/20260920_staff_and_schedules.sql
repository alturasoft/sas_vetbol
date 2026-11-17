-- ==============================================================================
-- VetBol SaaS — Módulo de Gestión de Staff Médico, Personal y Horarios
-- Migración: 20260920_staff_and_schedules.sql
-- ==============================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ASEGURAR TABLAS RELACIONALES EN ESQUEMA veterinarias

-- Tabla Principal: veterinarias.personal
CREATE TABLE IF NOT EXISTS veterinarias.personal (
    id_persona BIGSERIAL PRIMARY KEY,
    id_veterinaria BIGINT NOT NULL REFERENCES veterinarias.veterinarias(id_veterinaria) ON DELETE CASCADE,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT DEFAULT NULL,
    rol TEXT NOT NULL DEFAULT 'MED',
    estado TEXT NOT NULL DEFAULT 'VIG',
    user_id UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    foto_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar constraint de regla ON DELETE SET NULL en caso de que ya existiera
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'personal_user_id_fkey' 
          AND table_schema = 'veterinarias'
    ) THEN
        ALTER TABLE veterinarias.personal DROP CONSTRAINT personal_user_id_fkey;
    END IF;
    ALTER TABLE veterinarias.personal 
        ADD CONSTRAINT personal_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Tabla: veterinarias.roles
CREATE TABLE IF NOT EXISTS veterinarias.roles (
    id_rol BIGSERIAL PRIMARY KEY,
    id_veterinaria BIGINT NOT NULL REFERENCES veterinarias.veterinarias(id_veterinaria) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    es_sistema BOOLEAN NOT NULL DEFAULT false,
    fecha_crea TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_roles_vet_nombre UNIQUE (id_veterinaria, nombre)
);

-- Tabla: veterinarias.permisos
CREATE TABLE IF NOT EXISTS veterinarias.permisos (
    id_permiso BIGSERIAL PRIMARY KEY,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    modulo TEXT NOT NULL,
    fecha_crea TIMESTAMPTZ DEFAULT now()
);

-- Tabla: veterinarias.roles_permisos
CREATE TABLE IF NOT EXISTS veterinarias.roles_permisos (
    id_rol BIGINT NOT NULL REFERENCES veterinarias.roles(id_rol) ON DELETE CASCADE,
    id_permiso BIGINT NOT NULL REFERENCES veterinarias.permisos(id_permiso) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

-- Tabla: veterinarias.usuarios_roles
CREATE TABLE IF NOT EXISTS veterinarias.usuarios_roles (
    id_persona BIGINT NOT NULL REFERENCES veterinarias.personal(id_persona) ON DELETE CASCADE,
    id_rol BIGINT NOT NULL REFERENCES veterinarias.roles(id_rol) ON DELETE CASCADE,
    PRIMARY KEY (id_persona)
);

-- Tabla: veterinarias.horarios_personal
CREATE TABLE IF NOT EXISTS veterinarias.horarios_personal (
    id_horario BIGSERIAL PRIMARY KEY,
    id_persona BIGINT NOT NULL REFERENCES veterinarias.personal(id_persona) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1: Lunes, 7: Domingo
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: veterinarias.bloqueos_agenda
CREATE TABLE IF NOT EXISTS veterinarias.bloqueos_agenda (
    id_bloqueo BIGSERIAL PRIMARY KEY,
    id_veterinaria BIGINT NOT NULL REFERENCES veterinarias.veterinarias(id_veterinaria) ON DELETE CASCADE,
    id_persona BIGINT DEFAULT NULL REFERENCES veterinarias.personal(id_persona) ON DELETE CASCADE,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    tipo_bloqueo VARCHAR(50) NOT NULL CHECK (tipo_bloqueo IN ('DESCANSO', 'VACACION', 'CIRUGIA', 'FERIADO', 'EMERGENCIA')),
    motivo TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_personal_vet_estado ON veterinarias.personal(id_veterinaria, estado);
CREATE INDEX IF NOT EXISTS idx_personal_user_id ON veterinarias.personal(user_id);
CREATE INDEX IF NOT EXISTS idx_horarios_persona_dia ON veterinarias.horarios_personal(id_persona, dia_semana);
CREATE INDEX IF NOT EXISTS idx_bloqueos_vet_persona ON veterinarias.bloqueos_agenda(id_veterinaria, id_persona, fecha_inicio, fecha_fin);

-- 3. FUNCIONES RPC DE SEGURIDAD

-- 3.1 RPC: public.registrar_personal_con_auth
CREATE OR REPLACE FUNCTION public.registrar_personal_con_auth(
    p_nombres TEXT,
    p_apellidos TEXT,
    p_email TEXT,
    p_password TEXT,
    p_telefono TEXT DEFAULT NULL,
    p_rol TEXT DEFAULT 'MED',
    p_id_rol BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, veterinarias, extensions
AS $$
DECLARE
    v_caller_user_id UUID;
    v_caller_vet_id BIGINT;
    v_user_id UUID;
    v_persona_id BIGINT;
    v_clean_email TEXT;
    v_pass_hash TEXT;
    v_result JSONB;
BEGIN
    -- 1. Validar sesión activa del solicitante
    v_caller_user_id := auth.uid();
    IF v_caller_user_id IS NULL THEN
        RAISE EXCEPTION 'No autorizado. Debe iniciar sesión.';
    END IF;

    -- 2. Obtener la clínica del usuario administrador en sesión
    SELECT id_veterinaria
    INTO v_caller_vet_id
    FROM veterinarias.personal
    WHERE user_id = v_caller_user_id AND estado = 'VIG'
    LIMIT 1;

    IF v_caller_vet_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró una clínica activa para el usuario en sesión.';
    END IF;

    -- 3. Validar correo y contraseña
    v_clean_email := lower(trim(p_email));
    IF v_clean_email IS NULL OR v_clean_email = '' THEN
        RAISE EXCEPTION 'El correo electrónico es obligatorio.';
    END IF;

    IF p_password IS NULL OR length(trim(p_password)) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres.';
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_clean_email) THEN
        RAISE EXCEPTION 'Ya existe un usuario registrado con el correo %', v_clean_email;
    END IF;

    IF EXISTS (
        SELECT 1 FROM veterinarias.personal 
        WHERE email = v_clean_email AND id_veterinaria = v_caller_vet_id AND estado = 'VIG'
    ) THEN
        RAISE EXCEPTION 'Ya existe un miembro del personal activo con el correo % en esta clínica.', v_clean_email;
    END IF;

    -- 4. Crear el usuario en auth.users (Auto-confirmado)
    v_user_id := gen_random_uuid();
    v_pass_hash := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        v_clean_email,
        v_pass_hash,
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'sub', v_user_id::text,
            'email', v_clean_email,
            'email_verified', true,
            'nombres', p_nombres,
            'apellidos', p_apellidos,
            'rol', p_rol
        ),
        'authenticated',
        'authenticated',
        now(),
        now()
    );

    -- 5. Crear identidad en auth.identities
    BEGIN
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            v_user_id::text,
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
            'email',
            v_user_id::text,
            now(), now(), now()
        );
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- 6. Insertar registro en veterinarias.personal
    INSERT INTO veterinarias.personal (
        id_veterinaria,
        nombres,
        apellidos,
        email,
        telefono,
        rol,
        estado,
        user_id
    ) VALUES (
        v_caller_vet_id,
        p_nombres,
        p_apellidos,
        v_clean_email,
        p_telefono,
        p_rol,
        'VIG',
        v_user_id
    ) RETURNING id_persona INTO v_persona_id;

    -- 7. Asignar rol RBAC si se especificó
    IF p_id_rol IS NOT NULL THEN
        INSERT INTO veterinarias.usuarios_roles (id_persona, id_rol)
        VALUES (v_persona_id, p_id_rol)
        ON CONFLICT (id_persona) DO UPDATE SET id_rol = EXCLUDED.id_rol;
    END IF;

    -- 8. Retornar el objeto Persona creado
    SELECT row_to_json(p.*)::jsonb INTO v_result
    FROM veterinarias.personal p
    WHERE p.id_persona = v_persona_id;

    RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.registrar_personal_con_auth(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BIGINT) TO authenticated;

-- 3.2 RPC: public.dar_de_baja_personal
CREATE OR REPLACE FUNCTION public.dar_de_baja_personal(p_id_persona BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, veterinarias
AS $$
DECLARE
    v_caller_user_id UUID;
    v_caller_persona_id BIGINT;
    v_caller_vet_id BIGINT;
    v_target_vet_id BIGINT;
    v_target_user_id UUID;
BEGIN
    -- 1. Validar autenticación
    v_caller_user_id := auth.uid();
    IF v_caller_user_id IS NULL THEN
        RAISE EXCEPTION 'No autorizado. Debe iniciar sesión.';
    END IF;

    -- 2. Obtener datos del solicitante
    SELECT id_persona, id_veterinaria 
    INTO v_caller_persona_id, v_caller_vet_id
    FROM veterinarias.personal
    WHERE user_id = v_caller_user_id AND estado = 'VIG'
    LIMIT 1;

    IF v_caller_persona_id IS NULL THEN
        RAISE EXCEPTION 'Usuario solicitante no encontrado o inactivo.';
    END IF;

    -- 3. Evitar auto-baja
    IF v_caller_persona_id = p_id_persona THEN
        RAISE EXCEPTION 'No puedes darte de baja a ti mismo.';
    END IF;

    -- 4. Obtener datos del personal objetivo
    SELECT id_veterinaria, user_id
    INTO v_target_vet_id, v_target_user_id
    FROM veterinarias.personal
    WHERE id_persona = p_id_persona;

    IF v_target_vet_id IS NULL THEN
        RAISE EXCEPTION 'El registro de personal no existe.';
    END IF;

    -- 5. Validar pertenencia a la misma veterinaria
    IF v_caller_vet_id <> v_target_vet_id THEN
        RAISE EXCEPTION 'No tienes permiso para modificar personal de otra clínica.';
    END IF;

    -- 6. Desactivar horarios de atención del personal
    UPDATE veterinarias.horarios_personal
    SET activo = false
    WHERE id_persona = p_id_persona;

    -- 7. Desvincular roles asignados
    DELETE FROM veterinarias.usuarios_roles
    WHERE id_persona = p_id_persona;

    -- 8. Actualizar estado a 'BAJ' y desvincular user_id en personal
    UPDATE veterinarias.personal
    SET estado = 'BAJ',
        user_id = NULL
    WHERE id_persona = p_id_persona;

    -- 9. Eliminar cuenta de auth.users si existía
    IF v_target_user_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_target_user_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Personal dado de baja correctamente y cuenta de autenticación revocada.'
    );
END;
$$;
GRANT EXECUTE ON FUNCTION public.dar_de_baja_personal(BIGINT) TO authenticated;

-- 3.3 RPC: public.get_personal_veterinaria
CREATE OR REPLACE FUNCTION public.get_personal_veterinaria(p_id_veterinaria BIGINT)
RETURNS TABLE (
  id_persona     BIGINT,
  id_veterinaria BIGINT,
  nombres        TEXT,
  apellidos      TEXT,
  email          TEXT,
  telefono       TEXT,
  rol            TEXT,
  estado         TEXT,
  user_id        UUID,
  foto_url       TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = veterinarias, public
AS $$
BEGIN
  IF p_id_veterinaria IS NULL OR p_id_veterinaria <= 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      p.id_persona,
      p.id_veterinaria,
      p.nombres::TEXT,
      p.apellidos::TEXT,
      p.email::TEXT,
      p.telefono::TEXT,
      p.rol::TEXT,
      p.estado::TEXT,
      p.user_id,
      p.foto_url::TEXT
    FROM veterinarias.personal p
    WHERE p.id_veterinaria = p_id_veterinaria
      AND p.estado = 'VIG'
    ORDER BY 
      CASE 
        WHEN p.rol = 'PRO' THEN 1
        WHEN p.rol = 'MED' THEN 2
        WHEN p.rol = 'ADM' THEN 3
        ELSE 4
      END,
      p.nombres;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_personal_veterinaria(BIGINT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_personal_veterinaria(BIGINT) TO authenticated;

-- 4. BUCKET DE STORAGE: personal-fotos
INSERT INTO storage.buckets (id, name, public)
VALUES ('personal-fotos', 'personal-fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas RLS para storage.objects en personal-fotos
CREATE POLICY "Lectura pública de fotos de personal"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'personal-fotos');

CREATE POLICY "Subida de fotos de personal autenticado"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'personal-fotos');

CREATE POLICY "Actualización de fotos de personal autenticado"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'personal-fotos');

CREATE POLICY "Eliminación de fotos de personal autenticado"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'personal-fotos');
