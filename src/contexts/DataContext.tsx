import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Agente, HistorialComisionAgente, Venta, PagoComision } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataContextType {
  agentes: Agente[];
  historialComisiones: HistorialComisionAgente[];
  ventas: Venta[];
  pagosComision: PagoComision[];
  loadingAgentes: boolean;
  loadingVentas: boolean;
  addAgente: (a: Omit<Agente, 'id' | 'created_at' | 'updated_at'>) => Promise<Agente>;
  updateAgente: (id: string, a: Partial<Agente>) => Promise<void>;
  addHistorial: (h: Omit<HistorialComisionAgente, 'id' | 'created_at'>) => void;
  getHistorialByAgente: (agenteId: string) => HistorialComisionAgente[];
  addVenta: (v: Omit<Venta, 'id' | 'created_at' | 'updated_at'>) => Promise<Venta>;
  updateVenta: (id: string, v: Partial<Venta>) => Promise<void>;
  deleteVenta: (id: string) => Promise<void>;
  getAgenteById: (id: string) => Agente | undefined;
  getVentaById: (id: string) => Venta | undefined;
  addPagoComision: (p: Omit<PagoComision, 'id' | 'created_at'>) => Promise<PagoComision>;
  getPagosByVenta: (ventaId: string) => PagoComision[];
  refreshVentas: () => Promise<void>;
  refreshAgentes: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Map DB row -> app Agente
function mapAgente(row: any): Agente {
  return {
    id: row.id_agente,
    nombre: row.nombre,
    activo: row.activo !== false,
    porcentaje_asesor: Number(row.porcentaje_asesor) || 50,
    porcentaje_empresa: Number(row.porcentaje_empresa) || 50,
    fecha_inicio: row.fecha_inicio ?? new Date().toISOString().split('T')[0],
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

// Map DB row -> app Venta
function mapVenta(row: any): Venta {
  return {
    id: row.id_venta,
    tipo_ingreso: row.tipo_ingreso ?? 'Venta directa',
    fecha_reserva: row.fecha_reserva ?? '',
    cliente: row.cliente ?? '',
    telefono: row.telefono ?? '',
    email: row.email ?? '',
    proyecto: row.proyecto ?? '',
    unidad: row.unidad ?? '',
    tipo_inmueble: row.tipo_inmueble ?? '',
    precio_usd: Number(row.precio_usd) || 0,
    tasa: Number(row.tasa) || 58,
    precio_rd: Number(row.precio_rd) || 0,
    porcentaje_comision_venta: Number(row.porcentaje_comision) || 0,
    comision_bruta: Number(row.comision_bruta) || 0,
    vendedor_id: row.vendedor_id ?? '',
    captador_id: row.captador_id ?? null,
    porcentaje_captador: Number(row.porcentaje_captador) || 0,
    porcentaje_referido: Number(row.referido_porcentaje) || 0,
    fecha_cierre: row.fecha_cierre ?? null,
    estado: (row.estado_venta === 'cerrada' ? 'cerrada' : 'reserva') as any,
    notas: row.notas ?? '',
    split_vendedor_asesor_aplicado: Number(row.split_vendedor_asesor_aplicado) || 50,
    split_vendedor_empresa_aplicado: Number(row.split_vendedor_empresa_aplicado) || 50,
    split_captador_asesor_aplicado: Number(row.split_captador_asesor_aplicado) || 50,
    split_captador_empresa_aplicado: Number(row.split_captador_empresa_aplicado) || 50,
    override_split_vendedor: !!row.override_split_vendedor,
    override_split_captador: !!row.override_split_captador,
    monto_vendedor_agente: Number(row.monto_vendedor_agente) || 0,
    monto_vendedor_empresa: Number(row.monto_vendedor_empresa) || 0,
    monto_captador_agente: Number(row.monto_captador_agente) || 0,
    monto_captador_empresa: Number(row.monto_captador_empresa) || 0,
    monto_referido: Number(row.monto_referido) || 0,
    monto_empresa_total: Number(row.monto_empresa_total) || 0,
    creado_por: row.creado_por ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    habitaciones: row.habitaciones != null ? Number(row.habitaciones) : undefined,
    metraje: row.metraje != null ? Number(row.metraje) : undefined,
    precio_por_m2: row.precio_m2 != null ? Number(row.precio_m2) : undefined,
    asistencia_agente_id: row.asistencia_agente_id ?? null,
    porcentaje_asistencia: Number(row.porcentaje_asistencia) || 0,
    monto_asistencia_agente: Number(row.monto_asistencia_agente) || 0,
    monto_asistencia_empresa: Number(row.monto_asistencia_empresa) || 0,
    tipo_pago_comision: (row.tipo_pago_comision === 'parcial' ? 'parcial' : 'unico') as any,
    monto_total_comision_a_pagar: Number(row.monto_total_comision_a_pagar) || 0,
    monto_pagado_comision: Number(row.monto_pagado_comision) || 0,
    porcentaje_pagado_comision: Number(row.porcentaje_pagado_comision) || 0,
    balance_pendiente_comision: Number(row.balance_pendiente_comision) || 0,
    fecha_primer_pago_comision: row.fecha_pago_1 ?? undefined,
    fecha_proximo_pago_comision: row.fecha_pago_2 ?? undefined,
    estado_pago_comision: (row.estado_pago_comision ?? 'pendiente') as any,
    notas_pago_comision: row.notas_pago_comision ?? '',
  };
}

// Map app Venta payload -> DB row (for insert/update)
function ventaToRow(v: Partial<Venta>): Record<string, any> {
  const row: Record<string, any> = {};
  if (v.tipo_ingreso !== undefined) row.tipo_ingreso = v.tipo_ingreso;
  if (v.fecha_reserva !== undefined) row.fecha_reserva = v.fecha_reserva || null;
  if (v.fecha_cierre !== undefined) row.fecha_cierre = v.fecha_cierre || null;
  if (v.cliente !== undefined) row.cliente = v.cliente;
  if (v.telefono !== undefined) row.telefono = v.telefono;
  if (v.email !== undefined) row.email = v.email;
  if (v.proyecto !== undefined) row.proyecto = v.proyecto;
  if (v.unidad !== undefined) row.unidad = v.unidad;
  if (v.tipo_inmueble !== undefined) row.tipo_inmueble = v.tipo_inmueble;
  if (v.habitaciones !== undefined) row.habitaciones = v.habitaciones ?? null;
  if (v.metraje !== undefined) row.metraje = v.metraje ?? null;
  if (v.precio_por_m2 !== undefined) {
    row.precio_m2 = v.precio_por_m2 ?? null;
    row.m2_total = v.metraje ?? null;
  }
  if (v.precio_usd !== undefined) row.precio_usd = v.precio_usd;
  if (v.tasa !== undefined) row.tasa = v.tasa;
  if (v.precio_rd !== undefined) row.precio_rd = v.precio_rd;
  if (v.porcentaje_comision_venta !== undefined) row.porcentaje_comision = v.porcentaje_comision_venta;
  if (v.comision_bruta !== undefined) row.comision_bruta = v.comision_bruta;
  if (v.vendedor_id !== undefined) row.vendedor_id = v.vendedor_id || null;
  if (v.captador_id !== undefined) row.captador_id = v.captador_id || null;
  if (v.porcentaje_captador !== undefined) row.porcentaje_captador = v.porcentaje_captador;
  if (v.porcentaje_referido !== undefined) row.referido_porcentaje = v.porcentaje_referido;
  if (v.asistencia_agente_id !== undefined) row.asistencia_agente_id = v.asistencia_agente_id || null;
  if (v.porcentaje_asistencia !== undefined) row.porcentaje_asistencia = v.porcentaje_asistencia;
  if (v.tipo_pago_comision !== undefined) row.tipo_pago_comision = v.tipo_pago_comision;
  if (v.fecha_primer_pago_comision !== undefined) row.fecha_pago_1 = v.fecha_primer_pago_comision || null;
  if (v.fecha_proximo_pago_comision !== undefined) row.fecha_pago_2 = v.fecha_proximo_pago_comision || null;
  if (v.estado !== undefined) row.estado_venta = v.estado;
  if (v.notas !== undefined) row.notas = v.notas;
  if (v.split_vendedor_asesor_aplicado !== undefined) row.split_vendedor_asesor_aplicado = v.split_vendedor_asesor_aplicado;
  if (v.split_vendedor_empresa_aplicado !== undefined) row.split_vendedor_empresa_aplicado = v.split_vendedor_empresa_aplicado;
  if (v.split_captador_asesor_aplicado !== undefined) row.split_captador_asesor_aplicado = v.split_captador_asesor_aplicado;
  if (v.split_captador_empresa_aplicado !== undefined) row.split_captador_empresa_aplicado = v.split_captador_empresa_aplicado;
  if (v.override_split_vendedor !== undefined) row.override_split_vendedor = v.override_split_vendedor;
  if (v.override_split_captador !== undefined) row.override_split_captador = v.override_split_captador;
  if (v.monto_vendedor_agente !== undefined) row.monto_vendedor_agente = v.monto_vendedor_agente;
  if (v.monto_vendedor_empresa !== undefined) row.monto_vendedor_empresa = v.monto_vendedor_empresa;
  if (v.monto_captador_agente !== undefined) row.monto_captador_agente = v.monto_captador_agente;
  if (v.monto_captador_empresa !== undefined) row.monto_captador_empresa = v.monto_captador_empresa;
  if (v.monto_referido !== undefined) row.monto_referido = v.monto_referido;
  if (v.monto_empresa_total !== undefined) row.monto_empresa_total = v.monto_empresa_total;
  if (v.monto_asistencia_agente !== undefined) row.monto_asistencia_agente = v.monto_asistencia_agente;
  if (v.monto_asistencia_empresa !== undefined) row.monto_asistencia_empresa = v.monto_asistencia_empresa;
  if (v.monto_total_comision_a_pagar !== undefined) row.monto_total_comision_a_pagar = v.monto_total_comision_a_pagar;
  if (v.monto_pagado_comision !== undefined) row.monto_pagado_comision = v.monto_pagado_comision;
  if (v.porcentaje_pagado_comision !== undefined) row.porcentaje_pagado_comision = v.porcentaje_pagado_comision;
  if (v.balance_pendiente_comision !== undefined) row.balance_pendiente_comision = v.balance_pendiente_comision;
  if (v.estado_pago_comision !== undefined) row.estado_pago_comision = v.estado_pago_comision;
  if (v.notas_pago_comision !== undefined) row.notas_pago_comision = v.notas_pago_comision;
  if (v.creado_por !== undefined) row.creado_por = v.creado_por;
  return row;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [historialComisiones, setHistorial] = useState<HistorialComisionAgente[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [pagosComision, setPagosComision] = useState<PagoComision[]>([]);
  const [loadingAgentes, setLoadingAgentes] = useState(true);
  const [loadingVentas, setLoadingVentas] = useState(true);

  const refreshAgentes = useCallback(async () => {
    setLoadingAgentes(true);
    try {
      const { data, error } = await supabase.from('agentes').select('*').order('nombre');
      if (error) throw error;
      const rows = data ?? [];
      setAgentes(rows.map(mapAgente));
      // Build pseudo-historial from current agente splits (compatibility)
      setHistorial(rows.map((r: any) => ({
        id: `db_hc_${r.id_agente}`,
        agente_id: r.id_agente,
        porcentaje_asesor: Number(r.porcentaje_asesor) || 50,
        porcentaje_empresa: Number(r.porcentaje_empresa) || 50,
        vigencia_desde: r.fecha_inicio ?? '2025-01-01',
        vigencia_hasta: null,
        creado_por: 'db',
        observacion: 'Split actual',
        created_at: r.created_at ?? new Date().toISOString(),
      })));
    } catch (err: any) {
      console.error('Error loading agentes from Supabase:', err);
      toast.error(err?.message || 'No se pudieron cargar los agentes.');
    } finally {
      setLoadingAgentes(false);
    }
  }, []);

  const refreshVentas = useCallback(async () => {
    setLoadingVentas(true);
    try {
      const { data, error } = await supabase.from('ventas').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setVentas((data ?? []).map(mapVenta));
      // Load all pagos
      const { data: pagosData } = await supabase.from('pagos_comision').select('*');
      setPagosComision((pagosData ?? []).map((p: any) => ({
        id: p.id_pago,
        venta_id: p.venta_id,
        fecha_pago: p.fecha_pago,
        monto_pago: Number(p.monto) || 0,
        porcentaje_pago: 0,
        nota: p.nota ?? '',
        created_at: p.created_at,
      })));
    } catch (err: any) {
      console.error('Error loading ventas from Supabase:', err);
      toast.error(err?.message || 'No se pudieron cargar las ventas.');
    } finally {
      setLoadingVentas(false);
    }
  }, []);

  useEffect(() => {
    refreshAgentes();
    refreshVentas();
  }, [refreshAgentes, refreshVentas]);

  const addAgente = async (a: Omit<Agente, 'id' | 'created_at' | 'updated_at'>) => {
    const id = `ag_${generateId()}`;
    const { data, error } = await (supabase as any)
      .from('agentes')
      .insert({
        id_agente: id,
        nombre: a.nombre,
        activo: a.activo,
        porcentaje_asesor: a.porcentaje_asesor,
        porcentaje_empresa: a.porcentaje_empresa,
        fecha_inicio: a.fecha_inicio,
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message || 'Error al crear agente');
      throw error;
    }
    const newA = mapAgente(data);
    await refreshAgentes();
    return newA;
  };

  const updateAgente = async (id: string, a: Partial<Agente>) => {
    const update: Record<string, any> = {};
    if (a.nombre !== undefined) update.nombre = a.nombre;
    if (a.activo !== undefined) update.activo = a.activo;
    if (a.porcentaje_asesor !== undefined) update.porcentaje_asesor = a.porcentaje_asesor;
    if (a.porcentaje_empresa !== undefined) update.porcentaje_empresa = a.porcentaje_empresa;
    if (a.fecha_inicio !== undefined) update.fecha_inicio = a.fecha_inicio;
    const { error } = await (supabase as any).from('agentes').update(update).eq('id_agente', id);
    if (error) {
      toast.error(error.message || 'Error al actualizar agente');
      throw error;
    }
    await refreshAgentes();
  };

  const addHistorial = (h: Omit<HistorialComisionAgente, 'id' | 'created_at'>) => {
    // Update agente split fields to reflect new historial entry (no separate historial table)
    supabase
      .from('agentes')
      .update({
        porcentaje_asesor: h.porcentaje_asesor,
        porcentaje_empresa: h.porcentaje_empresa,
        fecha_inicio: h.vigencia_desde,
      })
      .eq('id_agente', h.agente_id)
      .then(({ error }) => {
        if (error) console.error('Error updating split:', error);
        refreshAgentes();
      });
  };

  const getHistorialByAgente = (agenteId: string) =>
    historialComisiones.filter(h => h.agente_id === agenteId);

  const addVenta = async (v: Omit<Venta, 'id' | 'created_at' | 'updated_at'>) => {
    const ventaPayload = { ...ventaToRow(v), id_venta: crypto.randomUUID() };
    console.log('INSERTING VENTA', ventaPayload);
    const response = await (supabase as any).from('ventas').insert(ventaPayload).select().single();
    console.log('INSERT RESPONSE', response);
    const { data, error } = response;
    if (error) {
      console.error('INSERT ERROR', error);
      toast.error(error.message || 'Error al crear la venta');
      throw error;
    }
    // Reload entire ventas state from Supabase — do NOT manually mutate UI state
    await refreshVentas();
    toast.success('Venta creada correctamente');
    return mapVenta(data);
  };

  const updateVenta = async (id: string, v: Partial<Venta>) => {
    const row = ventaToRow(v);
    const { data, error } = await (supabase as any).from('ventas').update(row).eq('id_venta', id).select().single();
    if (error) {
      console.error('Error updating venta:', error);
      toast.error(error.message || 'Error al actualizar la venta');
      throw error;
    }
    const updated = mapVenta(data);
    await refreshVentas();
    toast.success('Venta actualizada');
  };

  const deleteVenta = async (id: string) => {
    const { error } = await supabase.from('ventas').delete().eq('id_venta', id);
    if (error) {
      console.error('Error deleting venta:', error);
      toast.error(error.message || 'Error al eliminar la venta');
      throw error;
    }
    await refreshVentas();
    toast.success('Venta eliminada');
  };

  const getAgenteById = (id: string) => agentes.find(a => a.id === id);
  const getVentaById = (id: string) => ventas.find(v => v.id === id);

  const addPagoComision = async (p: Omit<PagoComision, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('pagos_comision')
      .insert({
        venta_id: p.venta_id,
        fecha_pago: p.fecha_pago,
        monto: p.monto_pago,
        nota: p.nota,
      })
      .select()
      .single();
    if (error) {
      toast.error('Error al registrar pago');
      throw error;
    }
    const newP: PagoComision = {
      id: data.id_pago,
      venta_id: data.venta_id,
      fecha_pago: data.fecha_pago,
      monto_pago: Number(data.monto) || 0,
      porcentaje_pago: p.porcentaje_pago,
      nota: data.nota ?? '',
      created_at: data.created_at,
    };
    setPagosComision(prev => [...prev, newP]);
    return newP;
  };

  const getPagosByVenta = (ventaId: string) =>
    pagosComision.filter(p => p.venta_id === ventaId).sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());

  return (
    <DataContext.Provider value={{
      agentes, historialComisiones, ventas, pagosComision,
      loadingAgentes, loadingVentas,
      addAgente, updateAgente, addHistorial, getHistorialByAgente,
      addVenta, updateVenta, deleteVenta, getAgenteById, getVentaById,
      addPagoComision, getPagosByVenta, refreshVentas, refreshAgentes,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be inside DataProvider');
  return ctx;
}
