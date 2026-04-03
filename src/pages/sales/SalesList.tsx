import React, { useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';

const SalesList = () => {
  const { ventas, getAgenteById, deleteVenta, loadingVentas, refreshVentas } = useData();
  const { isCeo } = useAuth();

  const sorted = [...ventas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshVentas()} disabled={loadingVentas}>
            {loadingVentas ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button asChild size="sm">
            <Link to="/ventas/nueva"><Plus className="h-4 w-4 mr-1" />Nueva Venta</Link>
          </Button>
        </div>
      </div>

      {loadingVentas ? (
        <div className="kpi-card flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
          <span className="text-muted-foreground text-sm">Cargando ventas desde Google Sheets...</span>
        </div>
      ) : (
        <div className="kpi-card overflow-x-auto">
          {sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No hay ventas registradas</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Proyecto</th>
                  <th>Vendedor</th>
                  <th>Precio USD</th>
                  <th>Comisión Bruta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(v => (
                  <tr key={v.id}>
                    <td>
                      <Link to={`/ventas/${v.id}`} className="text-primary hover:underline font-medium">{v.cliente}</Link>
                    </td>
                    <td>{v.proyecto}</td>
                    <td>{getAgenteById(v.vendedor_id)?.nombre ?? v.vendedor_id}</td>
                    <td>{formatCurrency(v.precio_usd)}</td>
                    <td>{formatCurrency(v.comision_bruta)}</td>
                    <td><span className={v.estado === 'reserva' ? 'badge-reserva' : 'badge-cerrada'}>{v.estado}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild><Link to={`/ventas/${v.id}`}>Ver</Link></Button>
                        <Button variant="ghost" size="sm" asChild><Link to={`/ventas/${v.id}/editar`}>Editar</Link></Button>
                        {isCeo && (
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm('¿Eliminar esta venta?')) deleteVenta(v.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesList;
