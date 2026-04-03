import React, { useState, useEffect, useMemo } from 'react'; // v2
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
  const { agentes, historialComisiones, addVenta, updateVenta, getVentaById, sheetAgentes, loadingAgentes, saveVentaToSheet } = useData();
  const { isCeo, user } = useAuth();
  const isEdit = !!id;
  const existing = id ? getVentaById(id) : null;
  const [saving, setSaving] = useState(false);

  const activeAgentes = agentes.filter(a => a.activo);

  // Helper: get split from sheetAgentes (primary) or fall back to historial
  const getSheetSplit = (agenteId: string) => {
    const sa = sheetAgentes.find(a => a.id_agente === agenteId);
    if (sa) return { porcentaje_asesor: sa.porcentaje_asesor, porcentaje_empresa: sa.porcentaje_empresa };
    return null;
  };

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
    habitaciones: existing?.habitaciones ?? 0,
    metraje: existing?.metraje ?? 0,
    precio_por_m2: existing?.precio_por_m2 ?? 0,
    asistencia_agente_id: existing?.asistencia_agente_id ?? '',
    porcentaje_asistencia: existing?.porcentaje_asistencia ?? 50,
    split_asistencia_asesor: 50,
    split_asistencia_empresa: 50,
    // Simplified payment info
    tipo_pago_comision: (existing?.tipo_pago_comision ?? 'unico') as TipoPagoComision,
    fecha_pago_unico: existing?.fecha_primer_pago_comision ?? '',
    fecha_pago_1: existing?.fecha_primer_pago_comision ?? '',
    fecha_pago_2: existing?.fecha_proximo_pago_comision ?? '',
    estado_pago_1: (existing?.estado_pago_comision === 'pagada' ? 'pagado' : 'pendiente') as 'pendiente' | 'pagado',
    estado_pago_2: (existing?.monto_pagado_comision && existing?.monto_total_comision_a_pagar && existing.monto_pagado_comision >= existing.monto_total_comision_a_pagar ? 'pagado' : 'pendiente') as 'pendiente' | 'pagado',
    notas_pago_comision: existing?.notas_pago_comision ?? '',
  });

  const [error, setError] = useState('');

  // Auto-load split when vendedor changes (prefer sheetAgentes)
  useEffect(() => {
    if (form.vendedor_id && !form.override_split_vendedor) {
      const sheetSplit = getSheetSplit(form.vendedor_id);
      if (sheetSplit) {
        setForm(f => ({ ...f, split_vendedor_asesor: sheetSplit.porcentaje_asesor, split_vendedor_empresa: sheetSplit.porcentaje_empresa }));
      } else {
        const hist = historialComisiones.filter(h => h.agente_id === form.vendedor_id);
        const split = getSplitVigenteByDate(hist, form.fecha_reserva);
        if (split) {
          setForm(f => ({ ...f, split_vendedor_asesor: split.porcentaje_asesor, split_vendedor_empresa: split.porcentaje_empresa }));
        }
      }
    }
  }, [form.vendedor_id, form.fecha_reserva, form.override_split_vendedor, sheetAgentes]);

  // Auto-load split when captador changes (prefer sheetAgentes)
  useEffect(() => {
    if (form.captador_id && !form.override_split_captador) {
      const sheetSplit = getSheetSplit(form.captador_id);
      if (sheetSplit) {
        setForm(f => ({ ...f, split_captador_asesor: sheetSplit.porcentaje_asesor, split_captador_empresa: sheetSplit.porcentaje_empresa }));
      } else {
        const hist = historialComisiones.filter(h => h.agente_id === form.captador_id);
        const split = getSplitVigenteByDate(hist, form.fecha_reserva);
        if (split) {
          setForm(f => ({ ...f, split_captador_asesor: split.porcentaje_asesor, split_captador_empresa: split.porcentaje_empresa }));
        }
      }
    }
  }, [form.captador_id, form.fecha_reserva, form.override_split_captador, sheetAgentes]);

  // Auto-load split for asistencia agent (prefer sheetAgentes)
  useEffect(() => {
    if (form.asistencia_agente_id) {
      const sheetSplit = getSheetSplit(form.asistencia_agente_id);
      if (sheetSplit) {
        setForm(f => ({ ...f, split_asistencia_asesor: sheetSplit.porcentaje_asesor, split_asistencia_empresa: sheetSplit.porcentaje_empresa }));
      } else {
        const hist = historialComisiones.filter(h => h.agente_id === form.asistencia_agente_id);
        const split = getSplitVigenteByDate(hist, form.fecha_reserva);
        if (split) {
          setForm(f => ({ ...f, split_asistencia_asesor: split.porcentaje_asesor, split_asistencia_empresa: split.porcentaje_empresa }));
        }
      }
    }
  }, [form.asistencia_agente_id, form.fecha_reserva, sheetAgentes]);

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

  const computePaymentData = () => {
    if (form.tipo_pago_comision === 'unico') {
      const pagado = form.estado_pago_1 === 'pagado' ? montoTotalComision : 0;
      return { monto_pagado: pagado, balance: montoTotalComision - pagado, estado: form.estado_pago_1 === 'pagado' ? 'pagada' as const : 'pendiente' as const };
    }
    const mitad = montoTotalComision / 2;
    const pagado = (form.estado_pago_1 === 'pagado' ? mitad : 0) + (form.estado_pago_2 === 'pagado' ? mitad : 0);
    const estado = pagado >= montoTotalComision ? 'pagada' as const : pagado > 0 ? 'parcial' as const : 'pendiente' as const;
    return { monto_pagado: pagado, balance: montoTotalComision - pagado, estado };
  };

  const paymentInfo = computePaymentData();

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.cliente.trim()) { setError('El cliente es obligatorio'); return; }
    if (!form.vendedor_id) { setError('Debe seleccionar un vendedor'); return; }
    if (form.precio_usd <= 0) { setError('El precio debe ser mayor a 0'); return; }
    if (form.porcentaje_comision_venta < 0 || form.porcentaje_captador < 0 || form.porcentaje_referido < 0) { setError('Los porcentajes no pueden ser negativos'); return; }
    if (calculo.vendedor_bruto < 0) { setError('Los porcentajes de captador y referido hacen que el monto del vendedor sea negativo'); return; }
    if (tieneAsistencia && (form.porcentaje_asistencia <= 0 || form.porcentaje_asistencia > 100)) { setError('El porcentaje de asistencia debe ser entre 1 y 100'); return; }

    setSaving(true);

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
      habitaciones: needsHabMetraje(form.tipo_inmueble) ? form.habitaciones : undefined,
      metraje: needsHabMetraje(form.tipo_inmueble) ? form.metraje : undefined,
      precio_por_m2: needsPrecioM2(form.tipo_inmueble) ? form.precio_por_m2 : undefined,
      asistencia_agente_id: tieneAsistencia ? form.asistencia_agente_id : null,
      porcentaje_asistencia: tieneAsistencia ? form.porcentaje_asistencia : 0,
      monto_asistencia_agente: calculo.asistencia_agente ?? 0,
      monto_asistencia_empresa: calculo.asistencia_empresa ?? 0,
      tipo_pago_comision: form.tipo_pago_comision,
      monto_total_comision_a_pagar: montoTotalComision,
      monto_pagado_comision: paymentInfo.monto_pagado,
      porcentaje_pagado_comision: montoTotalComision > 0 ? (paymentInfo.monto_pagado / montoTotalComision) * 100 : 0,
      balance_pendiente_comision: paymentInfo.balance,
      fecha_primer_pago_comision: form.tipo_pago_comision === 'unico' ? form.fecha_pago_unico || undefined : form.fecha_pago_1 || undefined,
      fecha_proximo_pago_comision: form.tipo_pago_comision === 'parcial' ? form.fecha_pago_2 || undefined : undefined,
      estado_pago_comision: paymentInfo.estado,
      notas_pago_comision: form.notas_pago_comision,
    };

    // Build Google Sheets payload
    const sheetPayload = {
      fecha_reserva: form.fecha_reserva,
      fecha_cierre: form.fecha_cierre || '',
      cliente: form.cliente,
      telefono: form.telefono,
      email: form.email,
      proyecto: form.proyecto,
      unidad: form.unidad,
      tipo_inmueble: form.tipo_inmueble,
      habitaciones: String(form.habitaciones || ''),
      metraje: String(form.metraje || ''),
      precio_m2: String(form.precio_por_m2 || ''),
      m2_total: String(form.metraje || ''),
      precio_usd: String(form.precio_usd),
      tasa: String(form.tasa),
      precio_rd: String(calculo.precio_rd),
      porcentaje_comision: String(form.porcentaje_comision_venta),
      comision_bruta: String(calculo.comision_bruta),
      vendedor_id: form.vendedor_id,
      captador_id: form.captador_id || '',
      porcentaje_captador: String(form.porcentaje_captador),
      referido_porcentaje: String(form.porcentaje_referido),
      asistencia_agente_id: tieneAsistencia ? form.asistencia_agente_id : '',
      porcentaje_asistencia: String(tieneAsistencia ? form.porcentaje_asistencia : ''),
      tipo_pago_comision: form.tipo_pago_comision,
      fecha_pago_1: form.tipo_pago_comision === 'unico' ? (form.fecha_pago_unico || '') : (form.fecha_pago_1 || ''),
      fecha_pago_2: form.tipo_pago_comision === 'parcial' ? (form.fecha_pago_2 || '') : '',
      estado_venta: form.estado,
    };

    try {
      if (isEdit && existing) {
        updateVenta(existing.id, ventaData);
        navigate(`/ventas/${existing.id}`);
      } else {
        // Save locally
        const newV = addVenta(ventaData);
        // Also save to Google Sheets
        await saveVentaToSheet(sheetPayload);
        navigate(`/ventas/${newV.id}`);
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
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
                    <SelectItem value="parcial">Pago en 2 partes (50/50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Monto Total Comisión</Label>
                <Input value={formatCurrency(montoTotalComision)} readOnly className="bg-muted/50 font-semibold" />
              </div>
            </div>

            {form.tipo_pago_comision === 'unico' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Fecha de Pago" value={form.fecha_pago_unico} onChange={v => set('fecha_pago_unico', v)} type="date" />
                <div className="space-y-2">
                  <Label className="text-xs">Estado</Label>
                  <Select value={form.estado_pago_1} onValueChange={v => set('estado_pago_1', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">Pago 1 — {formatCurrency(montoTotalComision / 2)}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Fecha Pago 1" value={form.fecha_pago_1} onChange={v => set('fecha_pago_1', v)} type="date" />
                    <div className="space-y-2">
                      <Label className="text-xs">Estado</Label>
                      <Select value={form.estado_pago_1} onValueChange={v => set('estado_pago_1', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="pagado">Pagado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">Pago 2 — {formatCurrency(montoTotalComision / 2)}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Fecha Pago 2" value={form.fecha_pago_2} onChange={v => set('fecha_pago_2', v)} type="date" />
                    <div className="space-y-2">
                      <Label className="text-xs">Estado</Label>
                      <Select value={form.estado_pago_2} onValueChange={v => set('estado_pago_2', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="pagado">Pagado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
          <div className="sticky top-4 space-y-3">
            {/* SECCIÓN 1: RESUMEN GENERAL */}
            <div className="kpi-card">
              <h2 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3">Resumen General</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Comisión Bruta</span>
                  <span className="text-base font-bold text-primary">{formatCurrency(calculo.comision_bruta)}</span>
                </div>
                {calculo.monto_referido > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Referido</span>
                    <span className="text-sm font-medium">{formatCurrency(calculo.monto_referido)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: VENDEDOR */}
            {(() => {
              const vendedorAgent = activeAgentes.find(a => a.id === form.vendedor_id);
              const vendedorName = vendedorAgent?.nombre || 'Vendedor';
              const vendedorComisionAsignada = tieneAsistencia
                ? calculo.vendedor_bruto * ((100 - form.porcentaje_asistencia) / 100)
                : calculo.vendedor_bruto;
              return (
                <div className="kpi-card">
                  <h2 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3">Vendedor</h2>
                  {/* Vendedor block */}
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{vendedorName.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-semibold">{vendedorName}</span>
                      {tieneAsistencia && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{100 - form.porcentaje_asistencia}%</span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Comisión asignada</span>
                      <span className="font-medium">{formatCurrency(vendedorComisionAsignada)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Gana (asesor)</span>
                      <span className="font-semibold text-primary">{formatCurrency(calculo.vendedor_agente_final ?? calculo.vendedor_agente)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Empresa</span>
                      <span>{formatCurrency(calculo.vendedor_empresa)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">Split {form.split_vendedor_asesor}/{form.split_vendedor_empresa}</div>
                  </div>

                  {/* Asistencia block */}
                  {tieneAsistencia && (() => {
                    const asisAgent = activeAgentes.find(a => a.id === form.asistencia_agente_id);
                    const asisName = asisAgent?.nombre || 'Asistente';
                    const asisComisionAsignada = calculo.vendedor_bruto * (form.porcentaje_asistencia / 100);
                    return (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-full bg-accent/50 flex items-center justify-center">
                            <span className="text-xs font-bold text-accent-foreground">{asisName.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-semibold">{asisName}</span>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Asistencia · {form.porcentaje_asistencia}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Comisión asignada</span>
                          <span className="font-medium">{formatCurrency(asisComisionAsignada)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Gana (asesor)</span>
                          <span className="font-semibold text-primary">{formatCurrency(calculo.asistencia_agente ?? 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Empresa</span>
                          <span>{formatCurrency(calculo.asistencia_empresa ?? 0)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground text-right">Split {form.split_asistencia_asesor}/{form.split_asistencia_empresa}</div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* SECCIÓN 3: CAPTADOR */}
            {form.captador_id && (() => {
              const captadorAgent = activeAgentes.find(a => a.id === form.captador_id);
              const captadorName = captadorAgent?.nombre || 'Captador';
              return (
                <div className="kpi-card">
                  <h2 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3">Captador</h2>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{captadorName.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-semibold">{captadorName}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Comisión asignada</span>
                      <span className="font-medium">{formatCurrency(calculo.captador_bruto)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Gana (asesor)</span>
                      <span className="font-semibold text-primary">{formatCurrency(calculo.captador_agente)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Empresa</span>
                      <span>{formatCurrency(calculo.captador_empresa)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">Split {form.split_captador_asesor}/{form.split_captador_empresa}</div>
                  </div>
                </div>
              );
            })()}

            {/* SECCIÓN 4: TOTAL EMPRESA */}
            <div className="kpi-card">
              <h2 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-2">Total Empresa</h2>
              <div className="text-xl font-bold text-primary">{formatCurrency(calculo.empresa_total)}</div>
            </div>

            {/* SECCIÓN 5: ESTADO DE PAGO */}
            <div className="kpi-card">
              <h2 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3">Estado de Pago</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total a Pagar</span>
                  <span className="font-medium">{formatCurrency(montoTotalComision)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pagado</span>
                  <span className="font-medium">{formatCurrency(paymentInfo.monto_pagado)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pendiente</span>
                  <span className="font-bold text-primary">{formatCurrency(Math.max(0, paymentInfo.balance))}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t">
                  <span className="text-muted-foreground">Estado</span>
                  <span className={`font-semibold ${paymentInfo.estado === 'pagada' ? 'text-primary' : paymentInfo.estado === 'parcial' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {paymentInfo.estado === 'pagada' ? 'Pagada' : paymentInfo.estado === 'parcial' ? 'Parcial' : 'Pendiente'}
                  </span>
                </div>
              </div>
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
