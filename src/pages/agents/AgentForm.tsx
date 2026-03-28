import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AgentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addAgente, updateAgente, getAgenteById, addHistorial } = useData();
  const { isCeo, user } = useAuth();
  const isEdit = !!id;
  const existing = id ? getAgenteById(id) : null;

  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [splitAsesor, setSplitAsesor] = useState(50);
  const [splitEmpresa, setSplitEmpresa] = useState(50);
  const [vigenciaDesde, setVigenciaDesde] = useState(new Date().toISOString().split('T')[0]);
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState('');

  if (!isCeo) {
    return <p className="text-muted-foreground">No tiene permisos para esta acción.</p>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (splitAsesor + splitEmpresa !== 100) { setError('El split debe sumar 100%'); return; }

    if (isEdit && existing) {
      updateAgente(existing.id, { nombre });
      navigate(`/agentes/${existing.id}`);
    } else {
      const newAgent = addAgente({ nombre, activo: true });
      addHistorial({
        agente_id: newAgent.id,
        porcentaje_asesor: splitAsesor,
        porcentaje_empresa: splitEmpresa,
        vigencia_desde: vigenciaDesde,
        vigencia_hasta: null,
        creado_por: user?.id ?? '',
        observacion: observacion || 'Split inicial',
      });
      navigate('/agentes');
    }
  };

  return (
    <div className="max-w-lg animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6">{isEdit ? 'Editar Agente' : 'Nuevo Agente'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del agente" />
        </div>

        {!isEdit && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Split Asesor %</Label>
                <Input type="number" min={0} max={100} value={splitAsesor} onChange={e => { const v = Number(e.target.value); setSplitAsesor(v); setSplitEmpresa(100 - v); }} />
              </div>
              <div className="space-y-2">
                <Label>Split Empresa %</Label>
                <Input type="number" min={0} max={100} value={splitEmpresa} onChange={e => { const v = Number(e.target.value); setSplitEmpresa(v); setSplitAsesor(100 - v); }} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vigencia desde</Label>
              <Input type="date" value={vigenciaDesde} onChange={e => setVigenciaDesde(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observación</Label>
              <Input value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Opcional" />
            </div>
          </>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit">{isEdit ? 'Guardar Cambios' : 'Crear Agente'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
};

export default AgentForm;
