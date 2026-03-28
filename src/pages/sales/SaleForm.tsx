import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { calcularVenta, getSplitVigenteByDate, formatCurrency } from '@/utils/calculations';
import { Venta, EstadoVenta } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TIPOS_INGRESO = ['Venta directa', 'Referido', 'Captación', 'Otro'];
const TIPOS_INMUEBLE = ['Apartamento', 'Casa', 'Solar', 'Local comercial', 'Oficina', 'Villa', 'Penthouse', 'Otro'];

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
    tipo_inmueble: existing?.tipo_inmueble ?? 'Apartamento',
    precio_usd: existing?.precio_usd ?? 0,
    tasa: existing?.tasa ?? 58,
    porcentaje_comision_venta: existing?.porcentaje_comision_venta ?? 3,
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
  }), [form.precio_usd, form.tasa, form.porcentaje_comision_venta, form.porcentaje_referido, form.porcentaje_captador, form.split_vendedor_asesor, form.split_vendedor_empresa, form.split_captador_asesor, form.split_captador_empresa]);

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.cliente.trim()) { setError('El cliente es obligatorio'); return; }
    if (!form.vendedor_id) { setError('Debe seleccionar un vendedor'); return; }
    if (form.precio_usd <= 0) { setError('El precio debe ser mayor a 0'); return; }
    if (form.porcentaje_comision_venta < 0 || form.porcentaje_captador < 0 || form.porcentaje_referido < 0) { setError('Los porcentajes no pueden ser negativos'); return; }
    if (calculo.vendedor_bruto < 0) { setError('Los porcentajes de captador y referido hacen que el monto del vendedor sea negativo'); return; }

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
            </div>
          </div>

          {/* Valores y comisiones */}
          <div className="kpi-card space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Valores y Comisiones</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumField label="Precio USD *" value={form.precio_usd} onChange={v => set('precio_usd', v)} />
              <NumField label="Tasa" value={form.tasa} onChange={v => set('tasa', v)} />
              <div className="space-y-2">
                <Label className="text-xs">Precio RD$</Label>
                <Input value={formatCurrency(calculo.precio_rd, 'DOP')} readOnly className="bg-muted/50" />
              </div>
              <NumField label="% Comisión Venta" value={form.porcentaje_comision_venta} onChange={v => set('porcentaje_comision_venta', v)} step={0.1} />
              <div className="space-y-2">
                <Label className="text-xs">Comisión Bruta</Label>
                <Input value={formatCurrency(calculo.comision_bruta)} readOnly className="bg-muted/50" />
              </div>
              <Field label="Fecha Reserva" value={form.fecha_reserva} onChange={v => set('fecha_reserva', v)} type="date" />
              <Field label="Fecha Cierre" value={form.fecha_cierre} onChange={v => set('fecha_cierre', v)} type="date" />
            </div>
          </div>

          {/* Vendedor y captador */}
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
              <NumField label="% Captador" value={form.porcentaje_captador} onChange={v => set('porcentaje_captador', v)} step={0.1} />
              <NumField label="% Referido" value={form.porcentaje_referido} onChange={v => set('porcentaje_referido', v)} step={0.1} />
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
              <CalcRow label="→ Agente" value={calculo.vendedor_agente} sub />
              <CalcRow label="→ Empresa" value={calculo.vendedor_empresa} sub />
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
