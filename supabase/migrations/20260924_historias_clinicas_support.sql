-- ==============================================================================
-- VetBol SaaS — Soporte para Módulo "Nueva Consulta" (SOAP) y Expediente Clínico
-- Migración: 20260924_historias_clinicas_support.sql
-- ==============================================================================

-- 1. CONFIGURACIÓN DEL BUCKET DE SUPABASE STORAGE PARA HISTORIAS CLÍNICAS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('historias-clinicas', 'historias-clinicas', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para storage.objects
DO $$
BEGIN
    -- Política de lectura pública
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access historias-clinicas'
    ) THEN
        CREATE POLICY "Public Access historias-clinicas" 
        ON storage.objects FOR SELECT 
        USING (bucket_id = 'historias-clinicas');
    END IF;

    -- Política de subida para usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated Upload historias-clinicas'
    ) THEN
        CREATE POLICY "Authenticated Upload historias-clinicas" 
        ON storage.objects FOR INSERT 
        TO authenticated 
        WITH CHECK (bucket_id = 'historias-clinicas');
    END IF;

    -- Política de actualización para usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated Update historias-clinicas'
    ) THEN
        CREATE POLICY "Authenticated Update historias-clinicas" 
        ON storage.objects FOR UPDATE 
        TO authenticated 
        USING (bucket_id = 'historias-clinicas');
    END IF;

    -- Política de borrado para usuarios autenticados
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated Delete historias-clinicas'
    ) THEN
        CREATE POLICY "Authenticated Delete historias-clinicas" 
        ON storage.objects FOR DELETE 
        TO authenticated 
        USING (bucket_id = 'historias-clinicas');
    END IF;
END $$;

-- 2. VISTA DE TIMELINE CLÍNICO EN ESQUEMA veterinarias
CREATE OR REPLACE VIEW veterinarias.vw_timeline_clinico AS
SELECT 
    hc.id_historia_clinica,
    hc.id_veterinaria,
    hc.id_mascota,
    hc.id_cliente,
    hc.fecha_consulta,
    hc.tipo_consulta,
    hc.motivo_consulta,
    hc.estado,
    m.nombre as mascota,
    (c.nombres || ' ' || c.apellidos) as propietario,
    'CONSULTA'::text as origen_registro,
    hc.id_historia_clinica as id_origen
FROM veterinarias.historias_clinicas hc
JOIN veterinarias.mascotas m ON hc.id_mascota = m.id_mascota
JOIN veterinarias.clientes c ON hc.id_cliente = c.id_cliente;
