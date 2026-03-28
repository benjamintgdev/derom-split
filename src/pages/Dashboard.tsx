import React from 'react';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/utils/calculations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart, Users, TrendingUp, DollarSign, Building2, BookmarkCheck } from 'lucide-react';

const Dashboard = () => {
  const { ventas, agentes, getAgenteById } = useData();

  const totalVentas = ventas.length;
  const totalComisionBruta = ventas.reduce((s, v) => s + v.comision_bruta, 0);
  const totalEmpresa = ventas.reduce((s, v) => s + v.monto_empresa_total, 0);
  const ventasReserva = ventas.filter(v => v.estado === 'reserva').length;
  const ventasCerradas = ventas.filter(v => v.estado === 'cerrada').length;

  const ventasRecientes = [...ventas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to="/ventas/nueva"><Plus className="h-4 w-4 mr-1" />Nueva Venta</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Ventas" value={totalVentas.toString()} />
        <KpiCard icon={<DollarSign className="h-5 w-5" />} label="Comisión Bruta" value={formatCurrency(totalComisionBruta)} />
        <KpiCard icon={<Building2 className="h-5 w-5" />} label="Ganado Empresa" value={formatCurrency(totalEmpresa)} />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="En Reserva" value={ventasReserva.toString()} />
        <KpiCard icon={<BookmarkCheck className="h-5 w-5" />} label="Cerradas" value={ventasCerradas.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 kpi-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Ventas Recientes</h2>
            <Button variant="ghost" size="sm" asChild><Link to="/ventas">Ver todas</Link></Button>
          </div>
          {ventasRecientes.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No hay ventas registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Proyecto</th>
                    <th>Vendedor</th>
                    <th>Precio USD</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasRecientes.map(v => (
                    <tr key={v.id}>
                      <td>
                        <Link to={`/ventas/${v.id}`} className="text-primary hover:underline font-medium">{v.cliente}</Link>
                      </td>
                      <td>{v.proyecto}</td>
                      <td>{getAgenteById(v.vendedor_id)?.nombre ?? '-'}</td>
                      <td>{formatCurrency(v.precio_usd)}</td>
                      <td><span className={v.estado === 'reserva' ? 'badge-reserva' : 'badge-cerrada'}>{v.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="kpi-card">
            <h2 className="font-semibold mb-3">Accesos Rápidos</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/ventas/nueva"><Plus className="h-4 w-4 mr-2" />Nueva Venta</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/agentes"><Users className="h-4 w-4 mr-2" />Agentes</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/ventas"><ShoppingCart className="h-4 w-4 mr-2" />Ventas</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="kpi-card">
      <div className="flex items-center gap-3 mb-2 text-primary">{icon}<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span></div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default Dashboard;
