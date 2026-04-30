import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getSplitVigenteByDate } from '@/utils/calculations';

const AgentsList = () => {
  const { agentes, historialComisiones, updateAgente, deleteAgente } = useData();
  const { isCeo } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agentes</h1>
        {isCeo && (
          <Button asChild size="sm">
            <Link to="/agentes/nuevo"><Plus className="h-4 w-4 mr-1" />Nuevo Agente</Link>
          </Button>
        )}
      </div>

      <div className="kpi-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Split Asesor</th>
              <th>Split Empresa</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {agentes.map(ag => {
              const split = getSplitVigenteByDate(
                historialComisiones.filter(h => h.agente_id === ag.id),
                today
              );
              return (
                <tr key={ag.id}>
                  <td className="font-medium">
                    <Link to={`/agentes/${ag.id}`} className="text-primary hover:underline">{ag.nombre}</Link>
                  </td>
                  <td>
                    <span className={ag.activo ? 'badge-active' : 'badge-inactive'}>
                      {ag.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{split ? `${split.porcentaje_asesor}%` : '-'}</td>
                  <td>{split ? `${split.porcentaje_empresa}%` : '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/agentes/${ag.id}`}>Ver</Link>
                      </Button>
                      {isCeo && (
                        <>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/agentes/${ag.id}/editar`}>Editar</Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateAgente(ag.id, { activo: !ag.activo })}
                          >
                            {ag.activo ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar al agente "${ag.nombre}"? Esta acción no se puede deshacer.`)) {
                                deleteAgente(ag.id);
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentsList;
