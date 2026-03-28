import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/calculations';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVentaById, getAgenteById, deleteVenta } = useData();
  const { isCeo } = useAuth();
  const venta = id ? getVentaById(id) : null;

  if (!venta) return <p>Venta no encontrada</p>;

  const vendedor = getAgenteById(venta.vendedor_id);
  const captador = venta.captador_id ? getAgenteById(venta.captador_id) : null;

  const handleDelete = () => {
    if (confirm('¿Está seguro de eliminar esta venta?')) {
      deleteVenta(venta.id);
      navigate('/ventas');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="hover:bg-accent"><Link to="/ventas"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold">{venta.cliente}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={venta.estado === 'reserva' ? 'badge-reserva' : 'badge-cerrada'}>{venta.estado}</span>
              <span className="text-xs text-muted-foreground">{venta.proyecto} · {venta.unidad}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/ventas/${venta.id}/editar`}><Pencil className="h-4 w-4 mr-1" />Editar</Link>
          </Button>
          {isCeo && (
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="kpi-card">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Información General</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <Detail label="Tipo Ingreso" value={venta.tipo_ingreso} />
              <Detail label="Fecha Reserva" value={venta.fecha_reserva} />
              <Detail label="Proyecto" value={venta.proyecto} />
              <Detail label="Unidad" value={venta.unidad} />
              <Detail label="Tipo Inmueble" value={venta.tipo_inmueble} />
              <Detail label="Estado" value={venta.estado} />
              <Detail label="Teléfono" value={venta.telefono} />
              <Detail label="Email" value={venta.email} />
              {venta.fecha_cierre && <Detail label="Fecha Cierre" value={venta.fecha_cierre} />}
            </div>
          </div>

          <div className="kpi-card">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Valores</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <Detail label="Precio USD" value={formatCurrency(venta.precio_usd)} />
              <Detail label="Tasa" value={venta.tasa.toString()} />
              <Detail label="Precio RD$" value={formatCurrency(venta.precio_rd, 'DOP')} />
              <Detail label="% Comisión" value={`${venta.porcentaje_comision_venta}%`} />
            </div>
          </div>

          <div className="kpi-card">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Agentes</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <Detail label="Vendedor" value={vendedor?.nombre ?? '-'} />
              <Detail label="Split Vendedor" value={`${venta.split_vendedor_asesor_aplicado}% / ${venta.split_vendedor_empresa_aplicado}%`} />
              {captador && (
                <>
                  <Detail label="Captador" value={captador.nombre} />
                  <Detail label="Split Captador" value={`${venta.split_captador_asesor_aplicado}% / ${venta.split_captador_empresa_aplicado}%`} />
                  <Detail label="% Captador" value={`${venta.porcentaje_captador}%`} />
                </>
              )}
              {venta.porcentaje_referido > 0 && <Detail label="% Referido" value={`${venta.porcentaje_referido}%`} />}
              {venta.override_split_vendedor && <Detail label="" value="⚠️ Override split vendedor" />}
              {venta.override_split_captador && <Detail label="" value="⚠️ Override split captador" />}
            </div>
          </div>

          {venta.notas && (
            <div className="kpi-card">
              <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Notas</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{venta.notas}</p>
            </div>
          )}
        </div>

        {/* Commission breakdown panel */}
        <div>
          <div className="kpi-card sticky top-6 border-primary/20">
            <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-5">Desglose de Comisiones</h2>
            <div className="space-y-3">
              <CommRow label="Comisión Bruta" value={venta.comision_bruta} highlight />
              {venta.monto_referido > 0 && <CommRow label="Monto Referido" value={venta.monto_referido} />}
              <div className="border-t border-border my-2" />
              <CommRow label="Vendedor (Agente)" value={venta.monto_vendedor_agente} />
              <CommRow label="Vendedor (Empresa)" value={venta.monto_vendedor_empresa} />
              {captador && (
                <>
                  <div className="border-t border-border my-2" />
                  <CommRow label="Captador (Agente)" value={venta.monto_captador_agente} />
                  <CommRow label="Captador (Empresa)" value={venta.monto_captador_empresa} />
                </>
              )}
              <div className="border-t-2 border-primary/20 my-2" />
              <div className="bg-primary/5 rounded-lg p-3 -mx-1">
                <CommRow label="Total Empresa" value={venta.monto_empresa_total} highlight />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      {label && <span className="text-muted-foreground text-xs">{label}</span>}
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function CommRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={highlight ? 'font-semibold text-sm text-foreground' : 'text-muted-foreground text-sm'}>{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'font-bold text-primary' : 'text-foreground'}`}>{formatCurrency(value)}</span>
    </div>
  );
}

export default SaleDetail;
