import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, RefreshCw, Loader2, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/calculations';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const EXPORT_COLUMNS = [
  'id_venta','fecha_reserva','fecha_cierre','cliente','telefono','email','proyecto','unidad',
  'tipo_inmueble','habitaciones','metraje','precio_m2','m2_total','precio_usd','tasa','precio_rd',
  'porcentaje_comision','comision_bruta','vendedor_id','captador_id','porcentaje_captador',
  'referido_nombre','referido_porcentaje','asistencia_agente_id','porcentaje_asistencia',
  'tipo_pago_comision','fecha_pago_1','fecha_pago_2','estado_venta','balance_pendiente_comision','created_at',
];

const SalesList = () => {
  const { ventas, getAgenteById, deleteVenta, loadingVentas, refreshVentas } = useData();
  const { isCeo } = useAuth();
  const [exportOpen, setExportOpen] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [exporting, setExporting] = useState(false);

  const sorted = [...ventas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleExport = async () => {
    if (!desde || !hasta) { toast.error('Selecciona ambas fechas'); return; }
    if (desde > hasta) { toast.error('La fecha "desde" debe ser anterior a "hasta"'); return; }
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(EXPORT_COLUMNS.join(','))
        .gte('fecha_reserva', desde)
        .lte('fecha_reserva', hasta)
        .order('fecha_reserva', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('No hay ventas en el rango seleccionado');
        return;
      }
      const rows = data.map((r: any) => {
        const obj: Record<string, any> = {};
        EXPORT_COLUMNS.forEach(c => { obj[c] = r[c] ?? ''; });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
      XLSX.writeFile(wb, `ventas_${desde}_a_${hasta}.xlsx`);
      toast.success(`Exportadas ${rows.length} ventas`);
      setExportOpen(false);
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error(err?.message || 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4 mr-1" />Exportar ventas
          </Button>
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
          <span className="text-muted-foreground text-sm">Cargando ventas...</span>
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

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar ventas a Excel</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Fecha desde</Label>
              <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Fecha hasta</Label>
              <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Filtrado por fecha_reserva. Se exportan los datos directamente desde la base de datos.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)} disabled={exporting}>Cancelar</Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Exportar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesList;
