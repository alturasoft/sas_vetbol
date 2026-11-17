-- ==============================================================================
-- VetBol SaaS — Módulo "Mis Accesos y Permisos" (RBAC Multi-Tenant)
-- Migración: 20261029_rbac_accesos_permisos.sql
-- ==============================================================================

-- 1. CATÁLOGO MAESTRO DE PERMISOS (25 Permisos en 9 Módulos)
INSERT INTO veterinarias.permisos (codigo, nombre, descripcion, modulo) VALUES
  -- Clientes
  ('VER_CLIENTES', 'Ver clientes', 'Consultar directorio y fichas de propietarios', 'Clientes'),
  ('CREAR_CLIENTES', 'Crear clientes', 'Registrar nuevos propietarios en la clínica', 'Clientes'),
  ('EDITAR_CLIENTES', 'Editar clientes', 'Actualizar datos de contacto de propietarios', 'Clientes'),
  ('ELIMINAR_CLIENTES', 'Eliminar clientes', 'Dar de baja o eliminar registros de clientes', 'Clientes'),
  -- Mascotas
  ('VER_MASCOTAS', 'Ver mascotas', 'Consultar listado y perfil clínico de pacientes', 'Mascotas'),
  ('CREAR_MASCOTAS', 'Crear mascotas', 'Dar de alta nuevos pacientes en el sistema', 'Mascotas'),
  ('EDITAR_MASCOTAS', 'Editar mascotas', 'Modificar datos biométricos y alertas de mascotas', 'Mascotas'),
  ('ELIMINAR_MASCOTAS', 'Eliminar mascotas', 'Dar de baja o eliminar registros de pacientes', 'Mascotas'),
  -- Citas
  ('VER_CITAS', 'Ver citas', 'Visualizar el calendario, agenda médica y bloqueos', 'Citas'),
  ('CREAR_CITAS', 'Crear citas', 'Programar nuevas citas y turnos de atención', 'Citas'),
  ('EDITAR_CITAS', 'Editar citas', 'Reprogramar horarios y estados de citas', 'Citas'),
  ('CANCELAR_CITAS', 'Cancelar citas', 'Anular citas agendadas con registro de motivo', 'Citas'),
  -- Historia Clínica
  ('VER_HISTORIA_CLINICA', 'Ver historia clínica', 'Lectura de historial clínico, hospitalizaciones y cirugías', 'Historia Clínica'),
  ('CREAR_CONSULTA', 'Crear consulta clínica', 'Registrar nuevas consultas SOAP, internaciones y cirugías', 'Historia Clínica'),
  ('EDITAR_CONSULTA', 'Editar consulta clínica', 'Actualizar evoluciones, signos vitales y diagnósticos', 'Historia Clínica'),
  -- Vacunas
  ('VER_RECETAS', 'Ver recetas', 'Consultar carnet de vacunación y recetas emitidas', 'Vacunas'),
  ('CREAR_RECETAS', 'Crear recetas', 'Prescribir medicamentos y registrar dosis de vacunas', 'Vacunas'),
  -- Configuración
  ('VER_INVENTARIO', 'Ver servicios y precios', 'Consultar el catálogo de servicios médicos y aranceles', 'Configuración'),
  ('EDITAR_INVENTARIO', 'Editar servicios y precios', 'Crear y actualizar precios y duración de servicios', 'Configuración'),
  ('CONFIGURACION_GENERAL', 'Configuración general', 'Modificar datos comerciales y ajustes de la clínica', 'Configuración'),
  -- Reportes
  ('VER_REPORTES', 'Ver reportes', 'Acceder a métricas operativas e indicadores de gestión', 'Reportes'),
  -- Publicaciones
  ('VER_PUBLICACIONES', 'Ver tablón de anuncios', 'Visualizar campañas, avisos y noticias de la clínica', 'Publicaciones'),
  ('ADMINISTRAR_PUBLICACIONES', 'Administrar anuncios', 'Crear, publicar y eliminar anuncios y notificaciones push', 'Publicaciones'),
  -- Usuarios
  ('ADMINISTRAR_USUARIOS', 'Administrar personal', 'Gestionar médicos, administrativos, turnos y credenciales', 'Usuarios'),
  -- Roles
  ('ADMINISTRAR_ROLES', 'Administrar roles y accesos', 'Crear roles personalizados y configurar matriz de permisos RBAC', 'Roles')
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  modulo = EXCLUDED.modulo;

-- 2. FUNCIÓN RPC: public.get_mis_permisos (Con Anti-Lockout seguro y respeto de rol inactivo)
CREATE OR REPLACE FUNCTION public.get_mis_permisos()
RETURNS TABLE (
  rol_nombre TEXT,
  permisos_codigos TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = veterinarias, public
AS $$
DECLARE
  v_persona_id BIGINT;
  v_vet_id BIGINT;
  v_rol_id BIGINT;
  v_rol_nombre TEXT;
BEGIN
  -- 1. Resolver identidad del miembro del personal vigente
  SELECT p.id_persona, p.id_veterinaria
  INTO v_persona_id, v_vet_id
  FROM veterinarias.personal p
  WHERE p.user_id = auth.uid() AND p.estado = 'VIG'
  LIMIT 1;

  IF v_persona_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. Obtener rol activo asignado
  SELECT r.id_rol, r.nombre
  INTO v_rol_id, v_rol_nombre
  FROM veterinarias.usuarios_roles ur
  JOIN veterinarias.roles r ON r.id_rol = ur.id_rol
  WHERE ur.id_persona = v_persona_id AND r.activo = true
  LIMIT 1;

  -- 3. Auto-asignación Fallback (Anti-Lockout) únicamente si no existe fila en usuarios_roles
  IF v_rol_id IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM veterinarias.usuarios_roles WHERE id_persona = v_persona_id) THEN
      SELECT r.id_rol, r.nombre
      INTO v_rol_id, v_rol_nombre
      FROM veterinarias.roles r
      WHERE r.id_veterinaria = v_vet_id AND r.nombre = 'ADMINISTRADOR'
      LIMIT 1;

      IF v_rol_id IS NOT NULL THEN
        INSERT INTO veterinarias.usuarios_roles (id_persona, id_rol)
        VALUES (v_persona_id, v_rol_id)
        ON CONFLICT (id_persona) DO NOTHING;
      END IF;
    ELSE
      -- El usuario tiene un rol asignado pero está inactivo (r.activo = false)
      RETURN QUERY SELECT NULL::TEXT, ARRAY[]::TEXT[];
      RETURN;
    END IF;
  END IF;

  IF v_rol_id IS NULL THEN
    RETURN;
  END IF;

  -- 4. Retornar nombre del rol y arreglo de códigos de permisos
  RETURN QUERY
  SELECT
    v_rol_nombre::TEXT,
    COALESCE(array_agg(perm.codigo::TEXT), ARRAY[]::TEXT[])
  FROM veterinarias.roles_permisos rp
  JOIN veterinarias.permisos perm ON perm.id_permiso = rp.id_permiso
  WHERE rp.id_rol = v_rol_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mis_permisos() TO authenticated;

