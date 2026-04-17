-- Agentes table (id_agente as text to allow custom ids like 'ag1')
CREATE TABLE public.agentes (
  id_agente TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  porcentaje_asesor NUMERIC NOT NULL DEFAULT 50,
  porcentaje_empresa NUMERIC NOT NULL DEFAULT 50,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ventas table
CREATE TABLE public.ventas (
  id_venta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_reserva DATE,
  fecha_cierre DATE,
  cliente TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  proyecto TEXT,
  unidad TEXT,
  tipo_inmueble TEXT,
  habitaciones NUMERIC,
  metraje NUMERIC,
  precio_m2 NUMERIC,
  m2_total NUMERIC,
  precio_usd NUMERIC NOT NULL DEFAULT 0,
  tasa NUMERIC NOT NULL DEFAULT 58,
  precio_rd NUMERIC NOT NULL DEFAULT 0,
  porcentaje_comision NUMERIC NOT NULL DEFAULT 0,
  comision_bruta NUMERIC NOT NULL DEFAULT 0,
  vendedor_id TEXT REFERENCES public.agentes(id_agente),
  captador_id TEXT REFERENCES public.agentes(id_agente),
  porcentaje_captador NUMERIC DEFAULT 0,
  referido_porcentaje NUMERIC DEFAULT 0,
  asistencia_agente_id TEXT REFERENCES public.agentes(id_agente),
  porcentaje_asistencia NUMERIC DEFAULT 0,
  tipo_pago_comision TEXT DEFAULT 'unico',
  fecha_pago_1 DATE,
  fecha_pago_2 DATE,
  estado_venta TEXT DEFAULT 'reserva',
  -- Extra fields used by app logic (kept compatible)
  tipo_ingreso TEXT,
  notas TEXT,
  split_vendedor_asesor_aplicado NUMERIC,
  split_vendedor_empresa_aplicado NUMERIC,
  split_captador_asesor_aplicado NUMERIC,
  split_captador_empresa_aplicado NUMERIC,
  override_split_vendedor BOOLEAN DEFAULT false,
  override_split_captador BOOLEAN DEFAULT false,
  monto_vendedor_agente NUMERIC,
  monto_vendedor_empresa NUMERIC,
  monto_captador_agente NUMERIC,
  monto_captador_empresa NUMERIC,
  monto_referido NUMERIC,
  monto_empresa_total NUMERIC,
  monto_asistencia_agente NUMERIC,
  monto_asistencia_empresa NUMERIC,
  monto_total_comision_a_pagar NUMERIC,
  monto_pagado_comision NUMERIC,
  porcentaje_pagado_comision NUMERIC,
  balance_pendiente_comision NUMERIC,
  estado_pago_comision TEXT,
  notas_pago_comision TEXT,
  creado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pagos comision
CREATE TABLE public.pagos_comision (
  id_pago UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES public.ventas(id_venta) ON DELETE CASCADE,
  fecha_pago DATE NOT NULL,
  tipo_pago TEXT,
  monto NUMERIC NOT NULL DEFAULT 0,
  nota TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_agentes_updated_at BEFORE UPDATE ON public.agentes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ventas_updated_at BEFORE UPDATE ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.agentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_comision ENABLE ROW LEVEL SECURITY;

-- Public access policies (app uses custom auth in AuthContext, no Supabase auth)
CREATE POLICY "agentes_all_access" ON public.agentes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "ventas_all_access" ON public.ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "pagos_all_access" ON public.pagos_comision FOR ALL USING (true) WITH CHECK (true);

-- Seed initial agentes (matching existing app data)
INSERT INTO public.agentes (id_agente, nombre, porcentaje_asesor, porcentaje_empresa, activo) VALUES
  ('ag1', 'José Ripoll', 60, 40, true),
  ('ag2', 'Fátima Marte', 60, 40, true),
  ('ag3', 'Sara Rivas', 50, 50, true),
  ('ag4', 'Nabila Chevalier', 50, 50, true),
  ('ag5', 'Virginia Gómez', 50, 50, true),
  ('ag6', 'Tati Arias', 50, 50, true),
  ('ag7', 'Erinzon Rosario', 50, 50, true),
  ('ag8', 'Ángel del Rosario', 50, 50, true)
ON CONFLICT (id_agente) DO NOTHING;