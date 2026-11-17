-- ==============================================================================
-- Módulo: Tablón de Anuncios y Publicaciones (Multi-Tenant)
-- Archivo: 20261007_publicaciones_and_storage.sql
-- ==============================================================================

-- 1. Crear tabla de publicaciones en el esquema veterinarias
CREATE TABLE IF NOT EXISTS veterinarias.publicaciones (
    id_publicacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_veterinaria BIGINT NOT NULL REFERENCES veterinarias.veterinarias(id_veterinaria) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL DEFAULT 'CONSEJO',
    titulo VARCHAR(200) NOT NULL,
    resumen VARCHAR(500) DEFAULT NULL,
    contenido TEXT DEFAULT NULL,
    imagen_url TEXT DEFAULT NULL,
    boton_texto VARCHAR(100) DEFAULT NULL,
    boton_accion VARCHAR(100) DEFAULT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización de consultas multi-tenant
CREATE INDEX IF NOT EXISTS idx_publicaciones_tenant_activo 
    ON veterinarias.publicaciones(id_veterinaria, activo, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_publicaciones_tipo 
    ON veterinarias.publicaciones(tipo);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE veterinarias.publicaciones ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública de publicaciones activas (anónimos y autenticados)
DROP POLICY IF EXISTS "Lectura publica de publicaciones activas" ON veterinarias.publicaciones;
CREATE POLICY "Lectura publica de publicaciones activas"
    ON veterinarias.publicaciones
    FOR SELECT
    TO anon, authenticated
    USING (activo = true);

-- Política: gestión de publicaciones por personal autenticado de la veterinaria
DROP POLICY IF EXISTS "Gestion de publicaciones por autenticados" ON veterinarias.publicaciones;
CREATE POLICY "Gestion de publicaciones por autenticados"
    ON veterinarias.publicaciones
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Otorgar privilegios necesarios a roles anon y authenticated
GRANT ALL ON TABLE veterinarias.publicaciones TO anon, authenticated;
GRANT ALL ON SEQUENCE veterinarias.publicaciones_id_publicacion_seq TO anon, authenticated;

-- 3. Configuración del Bucket de Supabase Storage para Publicaciones
INSERT INTO storage.buckets (id, name, public) 
VALUES ('publicaciones', 'publicaciones', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Lectura publica de imagenes de publicaciones" ON storage.objects;
CREATE POLICY "Lectura publica de imagenes de publicaciones" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'publicaciones');

DROP POLICY IF EXISTS "Gestion de imagenes de publicaciones por autenticados" ON storage.objects;
CREATE POLICY "Gestion de imagenes de publicaciones por autenticados" 
    ON storage.objects FOR ALL 
    TO authenticated 
    USING (bucket_id = 'publicaciones') 
    WITH CHECK (bucket_id = 'publicaciones');

-- 4. Extensión pg_net y Trigger para Notificaciones Push (Edge Function FCM)
CREATE EXTENSION IF NOT EXISTS "pg_net";

CREATE OR REPLACE FUNCTION veterinarias.fn_notify_nueva_publicacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project_ref    TEXT := 'ykzsdqlvrvbybseaulpz';
    v_service_key    TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrenNkcWx2cnZieWJzZWF1bHB6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI0MjY1MSwiZXhwIjoyMDkzODE4NjUxfQ.PBary1Sfby3rQZBiJFdmvB15RYQPa9_LldgF3W45zVs';
    v_edge_url       TEXT;
    v_payload        JSONB;
BEGIN
    -- Solo disparar si la publicación está activa
    IF NEW.activo = FALSE THEN
        RETURN NEW;
    END IF;

    v_edge_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/push-announcements';

    v_payload := jsonb_build_object(
        'type',    'INSERT',
        'table',   'publicaciones',
        'schema',  'veterinarias',
        'record',  jsonb_build_object(
            'id_publicacion',  NEW.id_publicacion,
            'id_veterinaria',  NEW.id_veterinaria,
            'tipo',            NEW.tipo,
            'titulo',          NEW.titulo,
            'resumen',         NEW.resumen,
            'contenido',       NEW.contenido,
            'imagen_url',      NEW.imagen_url,
            'activo',          NEW.activo,
            'created_at',      NEW.created_at
        ),
        'old_record', NULL
    );

    PERFORM net.http_post(
        url     := v_edge_url,
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || v_service_key
        ),
        body    := v_payload
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[fn_notify_nueva_publicacion] Error al llamar Edge Function: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_nueva_publicacion ON veterinarias.publicaciones;
CREATE TRIGGER trg_notify_nueva_publicacion
    AFTER INSERT ON veterinarias.publicaciones
    FOR EACH ROW
    EXECUTE FUNCTION veterinarias.fn_notify_nueva_publicacion();
