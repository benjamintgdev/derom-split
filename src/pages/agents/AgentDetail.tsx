import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { getSplitVigenteByDate } from '@/utils/calculations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus } from 'lucide-react';

const AgentDetail = () => {
  const { id } = useParams();
  const { getAgenteById, getHistorialByAgente, addHistorial } = useData();
  const { isCeo, user } = useAuth();
  const agente = id ? getAgenteById(id) : null;
  const historial = id ? getHistorialByAgente(id) : [];
  const today = new Date().toISOString().split('T')[0];
  const splitVigente = id ? getSplitVigenteByDate(historial, today) : null;

  const [showForm, setShowForm] = useState(false);
  const [splitAsesor, setSplitAsesor] = useState(50);
  const [splitEmpresa, setSplitEmpresa] = useState(50);
  const [vigenciaDesde, setVigenciaDesde] = useState(today);
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');

  if (!agente) return <p>Agente no encontrado</p>;

  const handleAddHistorial = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (splitAsesor + splitEmpresa !== 100) { setError('Debe sumar 100%'); return; }

    addHistorial({
      agente_id: agente.id,
      porcentaje_asesor: splitAsesor,
      porcentaje_empresa: splitEmpresa,
      vigencia_desde: vigenciaDesde,
      vigencia_hasta: null,
      creado_por: user?.id ?? '',
      observacion,
    });
    setShowForm(false);
    setObservacion('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild><Link to="/agentes"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl font-semibold">{agente.nombre}</h1>
        <span className={agente.activo ? 'badge-active' : 'badge-inactive'}>{agente.activo ? 'Activo' : 'Inactivo'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="kpi-card">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Split Vigente Asesor</h3>
          <p className="text-3xl font-semibold text-primary">{splitVigente ? `${splitVigente.porcentaje_asesor}%` : '-'}</p>
        </div>
        <div className="kpi-card">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Split Vigente Empresa</h3>
          <p className="text-3xl font-semibold">{splitVigente ? `${splitVigente.porcentaje_empresa}%` : '-'}</p>
        </div>
      </div>

      <div className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Historial de Comisiones</h2>
          {isCeo && (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" />Nueva Vigencia
            </Button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAddHistorial} className="p-4 mb-4 rounded-lg bg-muted/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Split Asesor %</Label>
                <Input type="number" min={0} max={100} value={splitAsesor} onChange={e => { const v = Number(e.target.value); setSplitAsesor(v); setSplitEmpresa(100 - v); }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Split Empresa %</Label>
                <Input type="number" min={0} max={100} value={splitEmpresa} onChange={e => { const v = Number(e.target.value); setSplitEmpresa(v); setSplitAsesor(100 - v); }} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vigencia desde</Label>
              <Input type="date" value={vigenciaDesde} onChange={e => setVigenciaDesde(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observación</Label>
              <Input value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Opcional" />
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" type="submit">Guardar</Button>
              <Button size="sm" variant="outline" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Asesor %</th>
              <th>Empresa %</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((h, i) => (
              <tr key={h.id}>
                <td className="font-medium">{h.porcentaje_asesor}%</td>
                <td>{h.porcentaje_empresa}%</td>
                <td>{h.vigencia_desde}</td>
                <td>{h.vigencia_hasta ?? <span className="badge-active">Vigente</span>}</td>
                <td className="text-muted-foreground text-sm">{h.observacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentDetail;
