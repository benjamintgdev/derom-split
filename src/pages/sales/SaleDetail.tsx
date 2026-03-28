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
          <Button variant="ghost" size="sm" asChild><Link to="/ventas"><ArrowLeft className="h-4 w-4" /></Link></Button>
          <h1 className="text-2xl font-semibold">{venta.cliente}</h1>
          <span className={venta.estado === 'reserva' ? 'badge-reserva' : 'badge-cerrada'}>{venta.estado}</span>
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
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Información General</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
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
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Valores</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <Detail label="Precio USD" value={formatCurrency(venta.precio_usd)} />
              <Detail label="Tasa" value={venta.tasa.toString()} />
              <Detail label="Precio RD$" value={formatCurrency(venta.precio_rd, 'DOP')} />
              <Detail label="% Comisión" value={`${venta.porcentaje_comision_venta}%`} />
            </div>
          </div>

          <div className="kpi-card">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Agentes</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
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
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Notas</h2>
              <p className="text-sm text-muted-foreground">{venta.notas}</p>
            </div>
          )}
        </div>

        {/* Panel de comisiones */}
        <div className="space-y-4">
          <div className="kpi-card">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">Desglose de Comisiones</h2>
            <div className="space-y-3">
              <CommRow label="Comisión Bruta" value={venta.comision_bruta} highlight />
              {venta.monto_referido > 0 && <CommRow label="Monto Referido" value={venta.monto_referido} />}
              <hr className="border-border" />
              <CommRow label="Vendedor (Agente)" value={venta.monto_vendedor_agente} />
              <CommRow label="Vendedor (Empresa)" value={venta.monto_vendedor_empresa} />
              {captador && (
                <>
                  <hr className="border-border" />
                  <CommRow label="Captador (Agente)" value={venta.monto_captador_agente} />
                  <CommRow label="Captador (Empresa)" value={venta.monto_captador_empresa} />
                </>
              )}
              <hr className="border-border" />
              <CommRow label="Total Empresa" value={venta.monto_empresa_total} highlight />
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
      <p className="font-medium">{value}</p>
    </div>
  );
}

function CommRow({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={highlight ? 'font-semibold text-sm' : 'text-muted-foreground text-sm'}>{label}</span>
      <span className={`text-sm ${highlight ? 'font-semibold text-primary' : ''}`}>{formatCurrency(value)}</span>
    </div>
  );
}

export default SaleDetail;
