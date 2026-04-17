-- ============================================================
-- TecnoPatch Cotizador v2 — Schema Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Tabla principal de cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folio       TEXT NOT NULL UNIQUE,

  -- Datos del proyecto
  titulo      TEXT,
  notas       TEXT,

  -- Datos del cliente
  cliente_nombre    TEXT,
  cliente_empresa   TEXT,
  cliente_email     TEXT,
  cliente_telefono  TEXT,

  -- Items (array JSON con los productos de Syscom)
  -- Cada item: { syscom_id, sku, nombre, precio, cantidad, marca, imagen }
  items       JSONB DEFAULT '[]'::jsonb,

  -- Financiero
  subtotal    NUMERIC(12,2) DEFAULT 0,
  descuento   NUMERIC(5,2) DEFAULT 0,    -- porcentaje
  incluye_iva BOOLEAN DEFAULT true,
  total       NUMERIC(12,2) DEFAULT 0,

  -- CRM
  estatus     TEXT DEFAULT 'pendiente'
              CHECK (estatus IN ('pendiente','enviada','aceptada','rechazada','en_proceso')),

  -- Metadatos
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas rápidas en el CRM
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estatus    ON cotizaciones(estatus);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created_at ON cotizaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente     ON cotizaciones(cliente_nombre);

-- Trigger: auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cotizaciones_updated_at ON cotizaciones;
CREATE TRIGGER trg_cotizaciones_updated_at
  BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
-- Por ahora desactivado para desarrollo, activar en producción
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- Política temporal: acceso completo (reemplazar con auth cuando agregues login)
CREATE POLICY "allow_all_for_now" ON cotizaciones
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Para agregar autenticación después:
-- 1. Agrega columna user_id: ALTER TABLE cotizaciones ADD COLUMN user_id UUID REFERENCES auth.users;
-- 2. Reemplaza la política:
--    DROP POLICY "allow_all_for_now" ON cotizaciones;
--    CREATE POLICY "user_own_data" ON cotizaciones
--      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- ============================================================
