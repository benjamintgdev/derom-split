import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Agente, HistorialComisionAgente, Venta, PagoComision } from '@/types';
import { getAgentes as fetchSheetAgentes, getVentas as fetchSheetVentas, createVenta as postVentaToSheet, SheetAgente } from '@/services/googleSheets';
import { toast } from 'sonner';

interface DataContextType {
  agentes: Agente[];
  historialComisiones: HistorialComisionAgente[];
  ventas: Venta[];
  pagosComision: PagoComision[];
  sheetAgentes: SheetAgente[];
  loadingAgentes: boolean;
  loadingVentas: boolean;
  addAgente: (a: Omit<Agente, 'id' | 'created_at' | 'updated_at'>) => Agente;
  updateAgente: (id: string, a: Partial<Agente>) => void;
  addHistorial: (h: Omit<HistorialComisionAgente, 'id' | 'created_at'>) => void;
  getHistorialByAgente: (agenteId: string) => HistorialComisionAgente[];
  addVenta: (v: Omit<Venta, 'id' | 'created_at' | 'updated_at'>) => Venta;
  updateVenta: (id: string, v: Partial<Venta>) => void;
  deleteVenta: (id: string) => void;
  getAgenteById: (id: string) => Agente | undefined;
  getVentaById: (id: string) => Venta | undefined;
  addPagoComision: (p: Omit<PagoComision, 'id' | 'created_at'>) => PagoComision;
  getPagosByVenta: (ventaId: string) => PagoComision[];
  saveVentaToSheet: (payload: Record<string, any>) => Promise<void>;
  refreshVentas: () => Promise<void>;
  refreshAgentes: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

const INITIAL_AGENTES: Agente[] = [
  { id: 'ag1', nombre: 'José Ripoll', activo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'ag2', nombre: 'Fátima Marte', activo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'ag3', nombre: 'Sara Rivas', activo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'ag4', nombre: 'Nabila Chevalier', activo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'ag5', nombre: 'Virginia Gómez', activo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'ag6', nombre: 'Tati Arias', activo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'ag7', nombre: 'Erinzon Rosario', activo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 'ag8', nombre: 'Ángel del Rosario', activo: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
];

const INITIAL_HISTORIAL: HistorialComisionAgente[] = [
  { id: 'hc1', agente_id: 'ag1', porcentaje_asesor: 60, porcentaje_empresa: 40, vigencia_desde: '2025-01-01', vigencia_hasta: null, creado_por: '1', observacion: 'Split inicial', created_at: '2025-01-01' },
  { id: 'hc2', agente_id: 'ag2', porcentaje_asesor: 60, porcentaje_empresa: 40, vigencia_desde: '2025-01-01', vigencia_hasta: null, creado_por: '1', observacion: 'Split inicial', created_at: '2025-01-01' },
  { id: 'hc3', agente_id: 'ag3', porcentaje_asesor: 50, porcentaje_empresa: 50, vigencia_desde: '2025-01-01', vigencia_hasta: null, creado_por: '1', observacion: 'Split inicial', created_at: '2025-01-01' },
  { id: 'hc4', agente_id: 'ag4', porcentaje_asesor: 50, porcentaje_empresa: 50, vigencia_desde: '2025-01-01', vigencia_hasta: null, creado_por: '1', observacion: 'Split inicial', created_at: '2025-01-01' },
  { id: 'hc5', agente_id: 'ag5', porcentaje_asesor: 50, porcentaje_empresa: 50, vigencia_desde: '2025-01-01', vigencia_hasta: null, creado_por: '1', observacion: 'Split inicial', created_at: '2025-01-01' },
  { id: 'hc6', agente_id: 'ag6', porcentaje_asesor: 50, porcentaje_empresa: 50, vigencia_desde: '2025-01-01', vigencia_hasta: null, creado_por: '1', observacion: 'Split inicial', created_at: '2025-01-01' },
  { id: 'hc7', agente_id: 'ag7', porcentaje_asesor: 50, porcentaje_empresa: 50, vigencia_desde: '2025-01-01', vigencia_hasta: null, creado_por: '1', observacion: 'Split inicial', created_at: '2025-01-01' },
  { id: 'hc8', agente_id: 'ag8', porcentaje_asesor: 50, porcentaje_empresa: 50, vigencia_desde: '2025-01-01', vigencia_hasta: null, creado_por: '1', observacion: 'Split inicial', created_at: '2025-01-01' },
];

function loadState<T>(key: string, initial: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initial;
  } catch {
    return initial;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [agentes, setAgentes] = useState<Agente[]>(() => loadState('derom_agentes', INITIAL_AGENTES));
  const [historialComisiones, setHistorial] = useState<HistorialComisionAgente[]>(() => loadState('derom_historial', INITIAL_HISTORIAL));
  const [ventas, setVentas] = useState<Venta[]>(() => loadState('derom_ventas', []));
  const [pagosComision, setPagosComision] = useState<PagoComision[]>(() => loadState('derom_pagos', []));

  // Google Sheets state
  const [sheetAgentes, setSheetAgentes] = useState<SheetAgente[]>([]);
  const [loadingAgentes, setLoadingAgentes] = useState(true);
  const [loadingVentas, setLoadingVentas] = useState(true);

  useEffect(() => { localStorage.setItem('derom_agentes', JSON.stringify(agentes)); }, [agentes]);
  useEffect(() => { localStorage.setItem('derom_historial', JSON.stringify(historialComisiones)); }, [historialComisiones]);
  useEffect(() => { localStorage.setItem('derom_ventas', JSON.stringify(ventas)); }, [ventas]);
  useEffect(() => { localStorage.setItem('derom_pagos', JSON.stringify(pagosComision)); }, [pagosComision]);

  // Load agentes from Google Sheets on mount
  const refreshAgentes = useCallback(async () => {
    setLoadingAgentes(true);
    try {
      const remote = await fetchSheetAgentes();
      setSheetAgentes(remote);
      // Also sync to local agentes array for compatibility with rest of app
      const mapped: Agente[] = remote.map(a => ({
        id: a.id_agente,
        nombre: a.nombre,
        activo: a.activo !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      if (mapped.length > 0) {
        setAgentes(mapped);
        // Also create/update historial from sheet splits
        const newHistorial: HistorialComisionAgente[] = remote.map((a, i) => ({
          id: `sheet_hc_${a.id_agente}`,
          agente_id: a.id_agente,
          porcentaje_asesor: a.porcentaje_asesor,
          porcentaje_empresa: a.porcentaje_empresa,
          vigencia_desde: '2025-01-01',
          vigencia_hasta: null,
          creado_por: 'sheet',
          observacion: 'Desde Google Sheets',
          created_at: new Date().toISOString(),
        }));
        setHistorial(newHistorial);
      }
    } catch (err) {
      console.error('Error loading agentes from Sheets:', err);
      toast.error('No se pudieron cargar los agentes desde Google Sheets. Usando datos locales.');
    } finally {
      setLoadingAgentes(false);
    }
  }, []);

  // Load ventas from Google Sheets on mount
  const refreshVentas = useCallback(async () => {
    setLoadingVentas(true);
    try {
      const remote = await fetchSheetVentas();
      // Map sheet ventas to local Venta format
      const mapped: Venta[] = remote.map((sv, i) => ({
        id: sv.id || `sheet_v_${i}_${Date.now()}`,
        tipo_ingreso: sv.tipo_inmueble ? 'Venta directa' : 'Venta directa',
        fecha_reserva: sv.fecha_reserva || '',
        cliente: sv.cliente || '',
        telefono: sv.telefono || '',
        email: sv.email || '',
        proyecto: sv.proyecto || '',
        unidad: sv.unidad || '',
        tipo_inmueble: sv.tipo_inmueble || '',
        precio_usd: Number(sv.precio_usd) || 0,
        tasa: Number(sv.tasa) || 58,
        precio_rd: Number(sv.precio_rd) || 0,
        porcentaje_comision_venta: Number(sv.porcentaje_comision) || 0,
        comision_bruta: Number(sv.comision_bruta) || 0,
        vendedor_id: sv.vendedor_id || '',
        captador_id: sv.captador_id || null,
        porcentaje_captador: Number(sv.porcentaje_captador) || 0,
        porcentaje_referido: Number(sv.referido_porcentaje) || 0,
        fecha_cierre: sv.fecha_cierre || null,
        estado: (sv.estado_venta === 'cerrada' ? 'cerrada' : 'reserva') as any,
        notas: '',
        split_vendedor_asesor_aplicado: 50,
        split_vendedor_empresa_aplicado: 50,
        split_captador_asesor_aplicado: 50,
        split_captador_empresa_aplicado: 50,
        override_split_vendedor: false,
        override_split_captador: false,
        monto_vendedor_agente: 0,
        monto_vendedor_empresa: 0,
        monto_captador_agente: 0,
        monto_captador_empresa: 0,
        monto_referido: 0,
        monto_empresa_total: 0,
        creado_por: '',
        created_at: sv.fecha_reserva || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        habitaciones: sv.habitaciones ? Number(sv.habitaciones) : undefined,
        metraje: sv.metraje ? Number(sv.metraje) : undefined,
        precio_por_m2: sv.precio_m2 ? Number(sv.precio_m2) : undefined,
        asistencia_agente_id: sv.asistencia_agente_id || null,
        porcentaje_asistencia: sv.porcentaje_asistencia ? Number(sv.porcentaje_asistencia) : 0,
        tipo_pago_comision: (sv.tipo_pago_comision === 'parcial' ? 'parcial' : 'unico') as any,
        fecha_primer_pago_comision: sv.fecha_pago_1 || undefined,
        fecha_proximo_pago_comision: sv.fecha_pago_2 || undefined,
        estado_pago_comision: 'pendiente' as any,
      }));
      if (mapped.length > 0) {
        setVentas(mapped);
      }
    } catch (err) {
      console.error('Error loading ventas from Sheets:', err);
      toast.error('No se pudieron cargar las ventas desde Google Sheets. Usando datos locales.');
    } finally {
      setLoadingVentas(false);
    }
  }, []);

  useEffect(() => {
    refreshAgentes();
    refreshVentas();
  }, [refreshAgentes, refreshVentas]);

  // Save venta to Google Sheets
  const saveVentaToSheet = useCallback(async (payload: Record<string, any>) => {
    try {
      await postVentaToSheet(payload);
      toast.success('Venta guardada en Google Sheets');
      await refreshVentas();
    } catch (err) {
      console.error('Error saving venta to Sheets:', err);
      toast.error('Error al guardar en Google Sheets. La venta se guardó localmente.');
    }
  }, [refreshVentas]);

  const addAgente = (a: Omit<Agente, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newA: Agente = { ...a, id: generateId(), created_at: now, updated_at: now };
    setAgentes(prev => [...prev, newA]);
    return newA;
  };

  const updateAgente = (id: string, a: Partial<Agente>) => {
    setAgentes(prev => prev.map(ag => ag.id === id ? { ...ag, ...a, updated_at: new Date().toISOString() } : ag));
  };

  const addHistorial = (h: Omit<HistorialComisionAgente, 'id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const newDesde = new Date(h.vigencia_desde);
    const dayBefore = new Date(newDesde);
    dayBefore.setDate(dayBefore.getDate() - 1);

    setHistorial(prev => {
      const updated = prev.map(existing => {
        if (existing.agente_id === h.agente_id && !existing.vigencia_hasta) {
          return { ...existing, vigencia_hasta: dayBefore.toISOString().split('T')[0] };
        }
        return existing;
      });
      return [...updated, { ...h, id: generateId(), created_at: now }];
    });
  };

  const getHistorialByAgente = (agenteId: string) =>
    historialComisiones.filter(h => h.agente_id === agenteId).sort((a, b) => new Date(b.vigencia_desde).getTime() - new Date(a.vigencia_desde).getTime());

  const addVenta = (v: Omit<Venta, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newV: Venta = { ...v, id: generateId(), created_at: now, updated_at: now };
    setVentas(prev => [...prev, newV]);
    return newV;
  };

  const updateVenta = (id: string, v: Partial<Venta>) => {
    setVentas(prev => prev.map(vt => vt.id === id ? { ...vt, ...v, updated_at: new Date().toISOString() } : vt));
  };

  const deleteVenta = (id: string) => {
    setVentas(prev => prev.filter(v => v.id !== id));
  };

  const getAgenteById = (id: string) => agentes.find(a => a.id === id);
  const getVentaById = (id: string) => ventas.find(v => v.id === id);

  const addPagoComision = (p: Omit<PagoComision, 'id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const newP: PagoComision = { ...p, id: generateId(), created_at: now };
    setPagosComision(prev => [...prev, newP]);
    return newP;
  };

  const getPagosByVenta = (ventaId: string) =>
    pagosComision.filter(p => p.venta_id === ventaId).sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());

  return (
    <DataContext.Provider value={{
      agentes, historialComisiones, ventas, pagosComision,
      sheetAgentes, loadingAgentes, loadingVentas,
      addAgente, updateAgente, addHistorial, getHistorialByAgente,
      addVenta, updateVenta, deleteVenta, getAgenteById, getVentaById,
      addPagoComision, getPagosByVenta, saveVentaToSheet, refreshVentas, refreshAgentes,
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
