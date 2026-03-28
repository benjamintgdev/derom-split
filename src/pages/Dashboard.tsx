import React from 'react';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/utils/calculations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart, Users, TrendingUp, DollarSign, Building2, BookmarkCheck, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
  const { ventas, agentes, getAgenteById } = useData();

  const totalVentas = ventas.length;
  const totalComisionBruta = ventas.reduce((s, v) => s + v.comision_bruta, 0);
  const totalEmpresa = ventas.reduce((s, v) => s + v.monto_empresa_total, 0);
  const ventasReserva = ventas.filter(v => v.estado === 'reserva').length;
  const ventasCerradas = ventas.filter(v => v.estado === 'cerrada').length;

  const ventasRecientes = [...ventas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen general del sistema</p>
        </div>
        <Button asChild>
          <Link to="/ventas/nueva"><Plus className="h-4 w-4 mr-2" />Nueva Venta</Link>
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={<ShoppingCart className="h-5 w-5" />} label="Total Ventas" value={totalVentas.toString()} />
        <KpiCard icon={<DollarSign className="h-5 w-5" />} label="Comisión Bruta" value={formatCurrency(totalComisionBruta)} accent />
        <KpiCard icon={<Building2 className="h-5 w-5" />} label="Ganado Empresa" value={formatCurrency(totalEmpresa)} accent />
        <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="En Reserva" value={ventasReserva.toString()} />
        <KpiCard icon={<BookmarkCheck className="h-5 w-5" />} label="Cerradas" value={ventasCerradas.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent sales */}
        <div className="lg:col-span-2 kpi-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-base">Ventas Recientes</h2>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary">
              <Link to="/ventas" className="flex items-center gap-1">Ver todas <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          {ventasRecientes.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">No hay ventas registradas</p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="pl-6">Cliente</th>
                    <th>Proyecto</th>
                    <th>Vendedor</th>
                    <th>Precio USD</th>
                    <th className="pr-6">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasRecientes.map(v => (
                    <tr key={v.id}>
                      <td className="pl-6">
                        <Link to={`/ventas/${v.id}`} className="text-foreground hover:text-primary font-medium transition-colors">{v.cliente}</Link>
                      </td>
                      <td className="text-muted-foreground">{v.proyecto}</td>
                      <td className="text-muted-foreground">{getAgenteById(v.vendedor_id)?.nombre ?? '-'}</td>
                      <td className="font-medium">{formatCurrency(v.precio_usd)}</td>
                      <td className="pr-6"><span className={v.estado === 'reserva' ? 'badge-reserva' : 'badge-cerrada'}>{v.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick access */}
        <div className="space-y-4">
          <div className="kpi-card">
            <h2 className="font-semibold text-base mb-4">Accesos Rápidos</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-11 text-sm font-medium" asChild>
                <Link to="/ventas/nueva"><Plus className="h-4 w-4 mr-3 text-primary" />Nueva Venta</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-11 text-sm font-medium" asChild>
                <Link to="/agentes"><Users className="h-4 w-4 mr-3 text-primary" />Agentes</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start h-11 text-sm font-medium" asChild>
                <Link to="/ventas"><ShoppingCart className="h-4 w-4 mr-3 text-primary" />Ventas</Link>
              </Button>
            </div>
          </div>

          {/* Summary card */}
          <div className="kpi-card bg-primary text-primary-foreground">
            <h3 className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">Total Empresa</h3>
            <p className="text-3xl font-bold">{formatCurrency(totalEmpresa)}</p>
            <p className="text-xs mt-2 opacity-70">{totalVentas} ventas registradas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function KpiCard({ icon, label, value, accent = false }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="kpi-card group">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`p-2 rounded-lg ${accent ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground'}`}>
          {icon}
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default Dashboard;
