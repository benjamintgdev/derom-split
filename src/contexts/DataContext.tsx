import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agente, HistorialComisionAgente, Venta } from '@/types';
import { v4 } from '@/utils/uuid';

interface DataContextType {
  agentes: Agente[];
  historialComisiones: HistorialComisionAgente[];
  ventas: Venta[];
  addAgente: (a: Omit<Agente, 'id' | 'created_at' | 'updated_at'>) => Agente;
  updateAgente: (id: string, a: Partial<Agente>) => void;
  addHistorial: (h: Omit<HistorialComisionAgente, 'id' | 'created_at'>) => void;
  getHistorialByAgente: (agenteId: string) => HistorialComisionAgente[];
  addVenta: (v: Omit<Venta, 'id' | 'created_at' | 'updated_at'>) => Venta;
  updateVenta: (id: string, v: Partial<Venta>) => void;
  deleteVenta: (id: string) => void;
  getAgenteById: (id: string) => Agente | undefined;
  getVentaById: (id: string) => Venta | undefined;
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

  useEffect(() => { localStorage.setItem('derom_agentes', JSON.stringify(agentes)); }, [agentes]);
  useEffect(() => { localStorage.setItem('derom_historial', JSON.stringify(historialComisiones)); }, [historialComisiones]);
  useEffect(() => { localStorage.setItem('derom_ventas', JSON.stringify(ventas)); }, [ventas]);

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
    // Close previous open vigencia for this agent
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

  return (
    <DataContext.Provider value={{
      agentes, historialComisiones, ventas,
      addAgente, updateAgente, addHistorial, getHistorialByAgente,
      addVenta, updateVenta, deleteVenta, getAgenteById, getVentaById,
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
