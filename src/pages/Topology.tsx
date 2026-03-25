import React, { useState, useEffect } from 'react';
import type { System, Integration } from '../types';
import { Network, Activity, ArrowDown, ShieldAlert } from 'lucide-react';

const Topology: React.FC = () => {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/systems').then(res => res.json()),
      fetch('/api/integrations').then(res => res.json())
    ])
    .then(([sysData, intData]) => {
      setSystems(Array.isArray(sysData) ? sysData : []);
      setIntegrations(Array.isArray(intData) ? intData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch topology data:', err);
      setLoading(false);
    });
  }, []);

  const getImpactedSystems = (sourceId: string): System[] => {
    const targets = integrations.filter(i => i.sourceId === sourceId).map(i => i.targetId);
    return systems.filter(s => targets.includes(s.id));
  };

  const getDependantSystems = (targetId: string): System[] => {
    const sources = integrations.filter(i => i.targetId === targetId).map(i => i.sourceId);
    return systems.filter(s => sources.includes(s.id));
  };

  if (loading) return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <span>Carregando Topologia...</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p className="text-secondary">Simulação de impacto em caso de outage ou manutenção (RF06).</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
        {/* Sidebar Selector */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            <Network size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Selecionar Origem
          </h3>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Selecione um sistema para analisar o raio de impacto.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {systems.map(sys => (
              <button
                key={sys.id}
                onClick={() => setSelectedSystem(sys.id)}
                className="btn-glass"
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '1rem',
                  borderColor: selectedSystem === sys.id ? 'var(--accent-base)' : 'var(--glass-border-strong)',
                  background: selectedSystem === sys.id ? 'hsla(260, 80%, 65%, 0.15)' : 'transparent',
                  textAlign: 'left'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{sys.acronym || sys.name}</div>
                  <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{sys.name}</div>
                </div>
              </button>
            ))}
            {systems.length === 0 && <p className="text-tertiary">Nenhum sistema cadastrado.</p>}
          </div>
        </div>

        {/* Visualizer Panel */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {!selectedSystem ? (
            <div className="flex-center" style={{ height: '100%', flexDirection: 'column', color: 'var(--text-tertiary)' }}>
              <Activity size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Nenhum sistema selecionado.</p>
            </div>
          ) : (
            <>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                 {/* Dependant Level (Upstream) */}
                 {getDependantSystems(selectedSystem).length > 0 && (
                   <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                     {getDependantSystems(selectedSystem).map(sys => (
                       <div key={sys.id} className="glass-panel" style={{ padding: '1rem' }}>
                         <span className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>Origem</span>
                         <div>{sys.acronym || sys.name}</div>
                       </div>
                     ))}
                   </div>
                 )}

                 {getDependantSystems(selectedSystem).length > 0 && (
                   <ArrowDown size={24} color="var(--text-tertiary)" />
                 )}

                 {/* Selected Core Node */}
                 <div className="glass-panel" style={{ padding: '1.5rem', border: '2px solid var(--accent-base)', minWidth: 200, textAlign: 'center' }}>
                   <span className="badge badge-accent" style={{ marginBottom: '0.5rem' }}>Foco de Análise</span>
                   <h3>{systems.find(s => s.id === selectedSystem)?.acronym || systems.find(s => s.id === selectedSystem)?.name}</h3>
                 </div>

                 {getImpactedSystems(selectedSystem).length > 0 && (
                   <ArrowDown size={24} color="var(--status-red)" />
                 )}

                 {/* Impacted Level (Downstream) */}
                 {getImpactedSystems(selectedSystem).length > 0 ? (
                   <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', borderTop: '1px dashed var(--status-red)', paddingTop: '2rem', marginTop: '-1rem' }}>
                     {getImpactedSystems(selectedSystem).map(sys => {
                       const integration = integrations.find(i => i.sourceId === selectedSystem && i.targetId === sys.id);
                       return (
                         <div key={sys.id} className="glass-panel" style={{ padding: '1rem', borderColor: 'hsla(0, 80%, 60%, 0.3)', position: 'relative' }}>
                           <span className="badge badge-red" style={{ position: 'absolute', top: -12, left: 16 }}>Risco High</span>
                           <h4 style={{ marginTop: '0.5rem' }}>{sys.acronym || sys.name}</h4>
                           <p className="text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>via {integration?.protocol}</p>
                         </div>
                       )
                     })}
                   </div>
                 ) : (
                   <div className="text-secondary" style={{ fontSize: '0.875rem' }}>Nenhum sistema downstream mapeado.</div>
                 )}
               </div>

               <div className="glass-panel" style={{ marginTop: 'auto', padding: '1.5rem', background: 'hsla(0, 80%, 60%, 0.05)' }}>
                  <h4 style={{ color: 'var(--status-red)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <ShieldAlert size={16} />
                    Alerta de Sustentação
                  </h4>
                  <p style={{ fontSize: '0.875rem' }}>
                    Se o sistema {systems.find(s => s.id === selectedSystem)?.acronym || systems.find(s => s.id === selectedSystem)?.name} ficar indisponível, 
                    <strong style={{ margin: '0 0.25rem' }}>{getImpactedSystems(selectedSystem).length}</strong> 
                    sistemas downstream entrarão em falha técnica.
                  </p>
               </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topology;
