import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { calcularVenta, getSplitVigenteByDate, formatCurrency } from '@/utils/calculations';
import { Venta, EstadoVenta, TIPOS_INMUEBLE, EstadoPagoComision, TipoPagoComision } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TIPOS_INGRESO = ['Venta directa', 'Referido', 'Captación', 'Otro'];

function needsHabMetraje(tipo: string) {
  return tipo.startsWith('Apartamento') || tipo.startsWith('Casa/Villa');
}
function needsPrecioM2(tipo: string) {
  return tipo === 'Solar' || tipo === 'Local';
}

const SaleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agentes, historialComisiones, addVenta, updateVenta, getVentaById } = useData();
  const { isCeo, user } = useAuth();
  const isEdit = !!id;
  const existing = id ? getVentaById(id) : null;

  const activeAgentes = agentes.filter(a => a.activo);

  const [form, setForm] = useState({
    tipo_ingreso: existing?.tipo_ingreso ?? 'Venta directa',
    fecha_reserva: existing?.fecha_reserva ?? new Date().toISOString().split('T')[0],
    cliente: existing?.cliente ?? '',
    telefono: existing?.telefono ?? '',
    email: existing?.email ?? '',
    proyecto: existing?.proyecto ?? '',
    unidad: existing?.unidad ?? '',
    tipo_inmueble: existing?.tipo_inmueble ?? 'Apartamento construido',
    precio_usd: existing?.precio_usd ?? 0,
    tasa: existing?.tasa ?? 58,
    porcentaje_comision_venta: existing?.porcentaje_comision_venta ?? 5,
    vendedor_id: existing?.vendedor_id ?? '',
    captador_id: existing?.captador_id ?? '',
    porcentaje_captador: existing?.porcentaje_captador ?? 0,
    porcentaje_referido: existing?.porcentaje_referido ?? 0,
    fecha_cierre: existing?.fecha_cierre ?? '',
    estado: (existing?.estado ?? 'reserva') as EstadoVenta,
    notas: existing?.notas ?? '',
    split_vendedor_asesor: existing?.split_vendedor_asesor_aplicado ?? 50,
    split_vendedor_empresa: existing?.split_vendedor_empresa_aplicado ?? 50,
    split_captador_asesor: existing?.split_captador_asesor_aplicado ?? 50,
    split_captador_empresa: existing?.split_captador_empresa_aplicado ?? 50,
    override_split_vendedor: existing?.override_split_vendedor ?? false,
    override_split_captador: existing?.override_split_captador ?? false,
    // Dynamic property fields
    habitaciones: existing?.habitaciones ?? 0,
    metraje: existing?.metraje ?? 0,
    precio_por_m2: existing?.precio_por_m2 ?? 0,
    // Assistance
    asistencia_agente_id: existing?.asistencia_agente_id ?? '',
    porcentaje_asistencia: existing?.porcentaje_asistencia ?? 50,
    split_asistencia_asesor: 50,
    split_asistencia_empresa: 50,
    // Payment info
    tipo_pago_comision: (existing?.tipo_pago_comision ?? 'unico') as TipoPagoComision,
    monto_pagado_comision: existing?.monto_pagado_comision ?? 0,
    porcentaje_pagado_comision: existing?.porcentaje_pagado_comision ?? 0,
    fecha_primer_pago_comision: existing?.fecha_primer_pago_comision ?? '',
    fecha_proximo_pago_comision: existing?.fecha_proximo_pago_comision ?? '',
    estado_pago_comision: (existing?.estado_pago_comision ?? 'pendiente') as EstadoPagoComision,
    notas_pago_comision: existing?.notas_pago_comision ?? '',
  });

  const [error, setError] = useState('');

  // Auto-load split when vendedor changes
  useEffect(() => {
    if (form.vendedor_id && !form.override_split_vendedor) {
      const hist = historialComisiones.filter(h => h.agente_id === form.vendedor_id);
      const split = getSplitVigenteByDate(hist, form.fecha_reserva);
      if (split) {
        setForm(f => ({ ...f, split_vendedor_asesor: split.porcentaje_asesor, split_vendedor_empresa: split.porcentaje_empresa }));
      }
    }
  }, [form.vendedor_id, form.fecha_reserva, form.override_split_vendedor]);

  // Auto-load split when captador changes
  useEffect(() => {
    if (form.captador_id && !form.override_split_captador) {
      const hist = historialComisiones.filter(h => h.agente_id === form.captador_id);
      const split = getSplitVigenteByDate(hist, form.fecha_reserva);
      if (split) {
        setForm(f => ({ ...f, split_captador_asesor: split.porcentaje_asesor, split_captador_empresa: split.porcentaje_empresa }));
      }
    }
  }, [form.captador_id, form.fecha_reserva, form.override_split_captador]);

  // Auto-load split for asistencia agent
  useEffect(() => {
    if (form.asistencia_agente_id) {
      const hist = historialComisiones.filter(h => h.agente_id === form.asistencia_agente_id);
      const split = getSplitVigenteByDate(hist, form.fecha_reserva);
      if (split) {
        setForm(f => ({ ...f, split_asistencia_asesor: split.porcentaje_asesor, split_asistencia_empresa: split.porcentaje_empresa }));
      }
    }
  }, [form.asistencia_agente_id, form.fecha_reserva]);

  const tieneAsistencia = !!form.asistencia_agente_id;

  const calculo = useMemo(() => calcularVenta({
    precio_usd: form.precio_usd,
    tasa: form.tasa,
    porcentaje_comision_venta: form.porcentaje_comision_venta,
    porcentaje_referido: form.porcentaje_referido,
    porcentaje_captador: form.porcentaje_captador,
    split_vendedor_asesor: form.split_vendedor_asesor,
    split_vendedor_empresa: form.split_vendedor_empresa,
    split_captador_asesor: form.split_captador_asesor,
    split_captador_empresa: form.split_captador_empresa,
    porcentaje_asistencia: form.porcentaje_asistencia,
    split_asistencia_asesor: form.split_asistencia_asesor,
    split_asistencia_empresa: form.split_asistencia_empresa,
    tiene_asistencia: tieneAsistencia,
  }), [form.precio_usd, form.tasa, form.porcentaje_comision_venta, form.porcentaje_referido, form.porcentaje_captador, form.split_vendedor_asesor, form.split_vendedor_empresa, form.split_captador_asesor, form.split_captador_empresa, form.porcentaje_asistencia, form.split_asistencia_asesor, form.split_asistencia_empresa, tieneAsistencia]);

  // Payment calculations
  const montoTotalComision = calculo.vendedor_agente;
  const balancePendiente = montoTotalComision - form.monto_pagado_comision;

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handlePagadoChange = (monto: number) => {
    const clamped = Math.min(Math.max(0, monto), montoTotalComision);
    const pct = montoTotalComision > 0 ? (clamped / montoTotalComision) * 100 : 0;
    setForm(f => ({
      ...f,
      monto_pagado_comision: clamped,
      porcentaje_pagado_comision: Math.round(pct * 100) / 100,
      estado_pago_comision: clamped <= 0 ? 'pendiente' : clamped >= montoTotalComision ? 'pagada' : 'parcial',
    }));
  };

  const handlePorcentajePagadoChange = (pct: number) => {
    const clampedPct = Math.min(Math.max(0, pct), 100);
    const monto = montoTotalComision * (clampedPct / 100);
    setForm(f => ({
      ...f,
      porcentaje_pagado_comision: clampedPct,
      monto_pagado_comision: Math.round(monto * 100) / 100,
      estado_pago_comision: clampedPct <= 0 ? 'pendiente' : clampedPct >= 100 ? 'pagada' : 'parcial',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.cliente.trim()) { setError('El cliente es obligatorio'); return; }
    if (!form.vendedor_id) { setError('Debe seleccionar un vendedor'); return; }
    if (form.precio_usd <= 0) { setError('El precio debe ser mayor a 0'); return; }
    if (form.porcentaje_comision_venta < 0 || form.porcentaje_captador < 0 || form.porcentaje_referido < 0) { setError('Los porcentajes no pueden ser negativos'); return; }
    if (calculo.vendedor_bruto < 0) { setError('Los porcentajes de captador y referido hacen que el monto del vendedor sea negativo'); return; }
    if (tieneAsistencia && (form.porcentaje_asistencia <= 0 || form.porcentaje_asistencia > 100)) { setError('El porcentaje de asistencia debe ser entre 1 y 100'); return; }

    const ventaData: Omit<Venta, 'id' | 'created_at' | 'updated_at'> = {
      tipo_ingreso: form.tipo_ingreso,
      fecha_reserva: form.fecha_reserva,
      cliente: form.cliente,
      telefono: form.telefono,
      email: form.email,
      proyecto: form.proyecto,
      unidad: form.unidad,
      tipo_inmueble: form.tipo_inmueble,
      precio_usd: form.precio_usd,
      tasa: form.tasa,
      precio_rd: calculo.precio_rd,
      porcentaje_comision_venta: form.porcentaje_comision_venta,
      comision_bruta: calculo.comision_bruta,
      vendedor_id: form.vendedor_id,
      captador_id: form.captador_id || null,
      porcentaje_captador: form.porcentaje_captador,
      porcentaje_referido: form.porcentaje_referido,
      fecha_cierre: form.fecha_cierre || null,
      estado: form.estado,
      notas: form.notas,
      split_vendedor_asesor_aplicado: form.split_vendedor_asesor,
      split_vendedor_empresa_aplicado: form.split_vendedor_empresa,
      split_captador_asesor_aplicado: form.split_captador_asesor,
      split_captador_empresa_aplicado: form.split_captador_empresa,
      override_split_vendedor: form.override_split_vendedor,
      override_split_captador: form.override_split_captador,
      monto_vendedor_agente: calculo.vendedor_agente,
      monto_vendedor_empresa: calculo.vendedor_empresa,
      monto_captador_agente: calculo.captador_agente,
      monto_captador_empresa: calculo.captador_empresa,
      monto_referido: calculo.monto_referido,
      monto_empresa_total: calculo.empresa_total,
      creado_por: user?.id ?? '',
      // Dynamic property fields
      habitaciones: needsHabMetraje(form.tipo_inmueble) ? form.habitaciones : undefined,
      metraje: needsHabMetraje(form.tipo_inmueble) ? form.metraje : undefined,
      precio_por_m2: needsPrecioM2(form.tipo_inmueble) ? form.precio_por_m2 : undefined,
      // Assistance
      asistencia_agente_id: tieneAsistencia ? form.asistencia_agente_id : null,
      porcentaje_asistencia: tieneAsistencia ? form.porcentaje_asistencia : 0,
      monto_asistencia_agente: calculo.asistencia_agente ?? 0,
      monto_asistencia_empresa: calculo.asistencia_empresa ?? 0,
      // Payment tracking
      tipo_pago_comision: form.tipo_pago_comision,
      monto_total_comision_a_pagar: montoTotalComision,
      monto_pagado_comision: form.monto_pagado_comision,
      porcentaje_pagado_comision: form.porcentaje_pagado_comision,
      balance_pendiente_comision: balancePendiente,
      fecha_primer_pago_comision: form.fecha_primer_pago_comision || undefined,
      fecha_proximo_pago_comision: form.fecha_proximo_pago_comision || undefined,
      estado_pago_comision: form.estado_pago_comision,
      notas_pago_comision: form.notas_pago_comision,
    };

    if (isEdit && existing) {
      updateVenta(existing.id, ventaData);
      navigate(`/ventas/${existing.id}`);
    } else {
      const newV = addVenta(ventaData);
      navigate(`/ventas/${newV.id}`);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6">{isEdit ? 'Editar Venta' : 'Nueva Venta'}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info del cliente */}
          <div className="kpi-card space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Información del Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Cliente *" value={form.cliente} onChange={v => set('cliente', v)} />
              <Field label="Teléfono" value={form.telefono} onChange={v => set('telefono', v)} />
              <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
              <div className="space-y-2">
                <Label className="text-xs">Tipo de Ingreso</Label>
                <Select value={form.tipo_ingreso} onValueChange={v => set('tipo_ingreso', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_INGRESO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Info del inmueble */}
          <div className="kpi-card space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Información del Inmueble</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Proyecto / Inmueble" value={form.proyecto} onChange={v => set('proyecto', v)} />
              <Field label="Unidad" value={form.unidad} onChange={v => set('unidad', v)} />
              <div className="space-y-2">
                <Label className="text-xs">Tipo de Inmueble</Label>
                <Select value={form.tipo_inmueble} onValueChange={v => set('tipo_inmueble', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_INMUEBLE.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Estado</Label>
                <Select value={form.estado} onValueChange={v => set('estado', v as EstadoVenta)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reserva">Reserva</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Dynamic fields based on property type */}
              {needsHabMetraje(form.tipo_inmueble) && (
                <>
                  <NumField label="Habitaciones" value={form.habitaciones} onChange={v => set('habitaciones', Math.max(0, v))} step={1} />
                  <NumField label="Metraje (m²)" value={form.metraje} onChange={v => set('metraje', Math.max(0, v))} step={0.01} />
                </>
              )}
              {needsPrecioM2(form.tipo_inmueble) && (
                <NumField label="Precio por m² (USD)" value={form.precio_por_m2} onChange={v => set('precio_por_m2', Math.max(0, v))} step={0.01} />
              )}
            </div>
          </div>

          {/* Valores y comisiones */}
          <div className="kpi-card space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Valores y Comisiones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumField label="Precio USD *" value={form.precio_usd} onChange={v => set('precio_usd', Math.max(0, v))} />
              <NumField label="Tasa" value={form.tasa} onChange={v => set('tasa', Math.max(0, v))} />
              <div className="space-y-2">
                <Label className="text-xs">Precio RD$</Label>
                <Input value={formatCurrency(calculo.precio_rd, 'DOP')} readOnly className="bg-muted/50" />
              </div>
              <NumField label="% Comisión Venta" value={form.porcentaje_comision_venta} onChange={v => set('porcentaje_comision_venta', Math.max(0, v))} step={0.1} />
              <div className="space-y-2">
                <Label className="text-xs">Comisión Bruta</Label>
                <Input value={formatCurrency(calculo.comision_bruta)} readOnly className="bg-muted/50" />
              </div>
              <Field label="Fecha Reserva" value={form.fecha_reserva} onChange={v => set('fecha_reserva', v)} type="date" />
              <Field label="Fecha Cierre" value={form.fecha_cierre} onChange={v => set('fecha_cierre', v)} type="date" />
            </div>
          </div>

          {/* Vendedor, captador y asistencia */}
          <div className="kpi-card space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Asignación de Agentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Vendedor *</Label>
                <Select value={form.vendedor_id} onValueChange={v => set('vendedor_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar vendedor" /></SelectTrigger>
                  <SelectContent>{activeAgentes.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Captador (opcional)</Label>
                <Select value={form.captador_id} onValueChange={v => set('captador_id', v === '_none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Sin captador" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin captador</SelectItem>
                    {activeAgentes.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <NumField label="% Captador" value={form.porcentaje_captador} onChange={v => set('porcentaje_captador', Math.max(0, v))} step={0.1} />
              <NumField label="% Referido" value={form.porcentaje_referido} onChange={v => set('porcentaje_referido', Math.max(0, v))} step={0.1} />
            </div>

            {/* Asistencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-xs">Asistencia (opcional)</Label>
                <Select value={form.asistencia_agente_id || '_none'} onValueChange={v => set('asistencia_agente_id', v === '_none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Sin asistencia" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin asistencia</SelectItem>
                    {activeAgentes.filter(a => a.id !== form.vendedor_id).map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {tieneAsistencia && (
                <NumField
                  label="% Asistencia"
                  value={form.porcentaje_asistencia}
                  onChange={v => set('porcentaje_asistencia', Math.min(100, Math.max(1, v)))}
                  step={1}
                />
              )}
            </div>

            {/* Splits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Split Vendedor</Label>
                  {isCeo && (
                    <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={form.override_split_vendedor} onChange={e => set('override_split_vendedor', e.target.checked)} className="rounded" />
                      Override manual
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <NumField label="Asesor %" value={form.split_vendedor_asesor} onChange={v => { set('split_vendedor_asesor', v); set('split_vendedor_empresa', 100 - v); }} disabled={!form.override_split_vendedor && !isCeo} />
                  <NumField label="Empresa %" value={form.split_vendedor_empresa} onChange={v => { set('split_vendedor_empresa', v); set('split_vendedor_asesor', 100 - v); }} disabled={!form.override_split_vendedor && !isCeo} />
                </div>
              </div>
              {form.captador_id && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Split Captador</Label>
                    {isCeo && (
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                        <input type="checkbox" checked={form.override_split_captador} onChange={e => set('override_split_captador', e.target.checked)} className="rounded" />
                        Override manual
                      </label>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumField label="Asesor %" value={form.split_captador_asesor} onChange={v => { set('split_captador_asesor', v); set('split_captador_empresa', 100 - v); }} disabled={!form.override_split_captador && !isCeo} />
                    <NumField label="Empresa %" value={form.split_captador_empresa} onChange={v => { set('split_captador_empresa', v); set('split_captador_asesor', 100 - v); }} disabled={!form.override_split_captador && !isCeo} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información de Pago de Comisión */}
          <div className="kpi-card space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Información de Pago de Comisión</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Tipo de Pago</Label>
                <Select value={form.tipo_pago_comision} onValueChange={v => set('tipo_pago_comision', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unico">Pago único</SelectItem>
                    <SelectItem value="parcial">Pago parcial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Monto Total Comisión a Pagar</Label>
                <Input value={formatCurrency(montoTotalComision)} readOnly className="bg-muted/50 font-semibold" />
              </div>
              <NumField label="Monto Pagado" value={form.monto_pagado_comision} onChange={handlePagadoChange} step={0.01} />
              <NumField label="% Pagado" value={form.porcentaje_pagado_comision} onChange={handlePorcentajePagadoChange} step={0.01} />
              <div className="space-y-2">
                <Label className="text-xs">Balance Pendiente</Label>
                <Input value={formatCurrency(Math.max(0, balancePendiente))} readOnly className="bg-muted/50 font-semibold" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Estado de Pago</Label>
                <Input
                  value={form.estado_pago_comision === 'pendiente' ? 'Pendiente' : form.estado_pago_comision === 'parcial' ? 'Parcial' : 'Pagada'}
                  readOnly
                  className={`bg-muted/50 font-semibold ${form.estado_pago_comision === 'pagada' ? 'text-primary' : form.estado_pago_comision === 'parcial' ? 'text-amber-600' : 'text-muted-foreground'}`}
                />
              </div>
              <Field label="Fecha Primer Pago" value={form.fecha_primer_pago_comision} onChange={v => set('fecha_primer_pago_comision', v)} type="date" />
              <Field label="Fecha Próximo Pago" value={form.fecha_proximo_pago_comision} onChange={v => set('fecha_proximo_pago_comision', v)} type="date" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Notas de Pago</Label>
              <textarea
                value={form.notas_pago_comision}
                onChange={e => set('notas_pago_comision', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                placeholder="Notas sobre el pago de comisión..."
              />
            </div>
          </div>

          {/* Notas */}
          <div className="kpi-card space-y-2">
            <Label className="text-xs">Notas</Label>
            <textarea
              value={form.notas}
              onChange={e => set('notas', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
              placeholder="Observaciones de la venta..."
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit">{isEdit ? 'Guardar Cambios' : 'Registrar Venta'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          </div>
        </div>

        {/* Panel de cálculos en tiempo real */}
        <div className="space-y-4">
          <div className="kpi-card sticky top-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">Resumen de Comisiones</h2>
            <div className="space-y-3">
              <CalcRow label="Comisión Bruta" value={calculo.comision_bruta} highlight />
              <CalcRow label="Monto Referido" value={calculo.monto_referido} />
              <hr className="border-border" />
              <CalcRow label="Vendedor (Bruto)" value={calculo.vendedor_bruto} />
              {tieneAsistencia ? (
                <>
                  <CalcRow label={`→ Vendedor (${100 - form.porcentaje_asistencia}%)`} value={calculo.vendedor_agente} sub />
                  <CalcRow label="  → Agente" value={calculo.vendedor_agente_final ?? 0} sub />
                  <CalcRow label="  → Empresa" value={calculo.vendedor_empresa} sub />
                  <hr className="border-border" />
                  <CalcRow label={`→ Asistencia (${form.porcentaje_asistencia}%)`} value={(calculo.asistencia_agente ?? 0) + (calculo.asistencia_empresa ?? 0)} sub />
                  <CalcRow label="  → Agente" value={calculo.asistencia_agente ?? 0} sub />
                  <CalcRow label="  → Empresa" value={calculo.asistencia_empresa ?? 0} sub />
                </>
              ) : (
                <>
                  <CalcRow label="→ Agente" value={calculo.vendedor_agente} sub />
                  <CalcRow label="→ Empresa" value={calculo.vendedor_empresa} sub />
                </>
              )}
              {form.captador_id && (
                <>
                  <hr className="border-border" />
                  <CalcRow label="Captador (Bruto)" value={calculo.captador_bruto} />
                  <CalcRow label="→ Agente" value={calculo.captador_agente} sub />
                  <CalcRow label="→ Empresa" value={calculo.captador_empresa} sub />
                </>
              )}
              <hr className="border-border" />
              <CalcRow label="Total Empresa" value={calculo.empresa_total} highlight />
            </div>

            {/* Payment summary */}
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado de Pago</h3>
              <CalcRow label="Total a Pagar" value={montoTotalComision} />
              <CalcRow label="Pagado" value={form.monto_pagado_comision} />
              <CalcRow label="Pendiente" value={Math.max(0, balancePendiente)} highlight />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function NumField({ label, value, onChange, step = 1, disabled = false }: { label: string; value: number; onChange: (v: number) => void; step?: number; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input type="number" step={step} value={value} onChange={e => onChange(Number(e.target.value))} disabled={disabled} />
    </div>
  );
}

function CalcRow({ label, value, highlight = false, sub = false }: { label: string; value: number; highlight?: boolean; sub?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${sub ? 'pl-3 text-sm' : ''}`}>
      <span className={`${highlight ? 'font-semibold' : 'text-muted-foreground'} ${sub ? 'text-xs' : 'text-sm'}`}>{label}</span>
      <span className={`${highlight ? 'font-semibold text-primary' : ''} text-sm`}>{formatCurrency(value)}</span>
    </div>
  );
}

export default SaleForm;
