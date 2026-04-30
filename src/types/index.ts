export type UserRole = 'ceo' | 'contable';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
}

export interface Agente {
  id: string;
  nombre: string;
  activo: boolean;
  porcentaje_asesor: number;
  porcentaje_empresa: number;
  fecha_inicio: string;
  created_at: string;
  updated_at: string;
}

export interface HistorialComisionAgente {
  id: string;
  agente_id: string;
  porcentaje_asesor: number;
  porcentaje_empresa: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  creado_por: string;
  observacion: string;
  created_at: string;
}

export type EstadoVenta = 'reserva' | 'cerrada';
export type EstadoPagoComision = 'pendiente' | 'parcial' | 'pagada';
export type TipoPagoComision = 'unico' | 'parcial';

export const TIPOS_INMUEBLE = [
  'Apartamento construido',
  'Apartamento en plano',
  'Casa/Villa construida',
  'Casa/Villa en plano',
  'Solar',
  'Local',
] as const;

export type TipoInmueble = typeof TIPOS_INMUEBLE[number];

export interface PagoComision {
  id: string;
  venta_id: string;
  fecha_pago: string;
  monto_pago: number;
  porcentaje_pago: number;
  nota: string;
  created_at: string;
}

export interface Venta {
  id: string;
  tipo_ingreso: string;
  fecha_reserva: string;
  cliente: string;
  telefono: string;
  email: string;
  proyecto: string;
  unidad: string;
  tipo_inmueble: string;
  precio_usd: number;
  tasa: number;
  precio_rd: number;
  porcentaje_comision_venta: number;
  comision_bruta: number;
  vendedor_id: string;
  captador_id: string | null;
  porcentaje_captador: number;
  porcentaje_referido: number;
  referido_nombre?: string;
  fecha_cierre: string | null;
  estado: EstadoVenta;
  notas: string;
  split_vendedor_asesor_aplicado: number;
  split_vendedor_empresa_aplicado: number;
  split_captador_asesor_aplicado: number;
  split_captador_empresa_aplicado: number;
  override_split_vendedor: boolean;
  override_split_captador: boolean;
  monto_vendedor_agente: number;
  monto_vendedor_empresa: number;
  monto_captador_agente: number;
  monto_captador_empresa: number;
  monto_referido: number;
  monto_empresa_total: number;
  creado_por: string;
  created_at: string;
  updated_at: string;
  // Dynamic property fields
  habitaciones?: number;
  metraje?: number;
  precio_por_m2?: number;
  // Assistance fields
  asistencia_agente_id?: string | null;
  porcentaje_asistencia?: number;
  monto_asistencia_agente?: number;
  monto_asistencia_empresa?: number;
  // Payment tracking fields
  tipo_pago_comision?: TipoPagoComision;
  monto_total_comision_a_pagar?: number;
  monto_pagado_comision?: number;
  porcentaje_pagado_comision?: number;
  balance_pendiente_comision?: number;
  fecha_primer_pago_comision?: string;
  fecha_proximo_pago_comision?: string;
  estado_pago_comision?: EstadoPagoComision;
  notas_pago_comision?: string;
}

export interface SplitVigente {
  porcentaje_asesor: number;
  porcentaje_empresa: number;
}

export interface CalculoVenta {
  precio_rd: number;
  comision_bruta: number;
  monto_referido: number;
  captador_bruto: number;
  vendedor_bruto: number;
  vendedor_agente: number;
  vendedor_empresa: number;
  captador_agente: number;
  captador_empresa: number;
  empresa_total: number;
  // Assistance breakdown
  asistencia_agente?: number;
  asistencia_empresa?: number;
  vendedor_agente_final?: number;
  vendedor_empresa_final?: number;
}
