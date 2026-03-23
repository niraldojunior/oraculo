import React, { useState } from 'react';
import { mockInitiatives, mockAllocations, mockCollaborators, mockSystems, mockMilestones } from '../data/mockDb';
import { CalendarClock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Roadmap: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'capacity'>('timeline');

  // Helper to calculate total allocation for a user
  const getUserCapacity = (userId: string) => {
    const allocs = mockAllocations.filter(a => a.collaboratorId === userId);
    return allocs.reduce((sum, a) => sum + a.percentage, 0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h1>Roadmap & Capacity</h1>
          <p className="text-secondary">Visão de timeline estratégica e alocação de engenharia (RF11, RF12).</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)' }}>
          <button 
            className="btn" 
            style={{ 
              background: activeTab === 'timeline' ? 'var(--accent-base)' : 'transparent', 
              color: activeTab === 'timeline' ? 'white' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              padding: '0.5rem 1.5rem'
            }}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline Visual
          </button>
          <button 
            className="btn" 
            style={{ 
              background: activeTab === 'capacity' ? 'var(--accent-base)' : 'transparent', 
              color: activeTab === 'capacity' ? 'white' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              padding: '0.5rem 1.5rem'
            }}
            onClick={() => setActiveTab('capacity')}
          >
            Capacity (Bottom-up)
          </button>
        </div>
      </div>

      {activeTab === 'timeline' && (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {mockInitiatives.map(initiative => {
            const miles = initiative.milestones;
            const systems = mockSystems.filter(s => initiative.impactedSystemIds.includes(s.id));
            
            return (
              <div key={initiative.id} style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem' }}>{initiative.title}</h3>
                    <span className="badge badge-accent">{initiative.type}</span>
                    <span className="badge badge-green">
                      Ativo
                    </span>
                  </div>
                  <div className="text-secondary" style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalendarClock size={16} /> 2026 Q1 - Q3
                  </div>
                </div>

                <p className="text-secondary" style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>{initiative.benefit}</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span className="text-tertiary" style={{ fontSize: '0.75rem' }}>Sistemas Afetados:</span>
                  {systems.map(s => (
                    <span key={s.id} style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', background: 'var(--bg-dark)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                      {s.acronym}
                    </span>
                  ))}
                </div>

                {/* Simulated Gantt Track */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-card-hover)', padding: '1.5rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                   {/* Track Line */}
                   <div style={{ position: 'absolute', top: '50%', left: '2rem', right: '2rem', height: '2px', background: 'var(--glass-border-strong)', zIndex: 0 }} />
                                      {miles.map((m, idx) => (
                      <div key={m.id} style={{ position: 'relative', zIndex: 1, left: `${idx * 30}%`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.status === 'PRD' ? 'var(--status-green)' : 'var(--accent-base)', border: '4px solid var(--bg-card-hover)' }} />
                        <div style={{ position: 'absolute', top: 24, whiteSpace: 'nowrap', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{m.name}</div>
                          <div className="text-tertiary" style={{ fontSize: '0.65rem' }}>{m.baselineDate}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'capacity' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {mockCollaborators.filter(c => c.role === 'Engineer/Analyst' || c.role === 'Lead Engineer').map(collab => {
            const totalLoad = getUserCapacity(collab.id);
            const userAllocs = mockAllocations.filter(a => a.collaboratorId === collab.id);
            const isOverbooked = totalLoad > 100;

            return (
              <div key={collab.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderColor: isOverbooked ? 'hsla(0, 80%, 60%, 0.4)' : 'var(--glass-border)' }}>
                <div className="flex-between">
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>{collab.name}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.75rem' }}>{collab.role}</p>
                  </div>
                  {isOverbooked ? (
                    <div title="Risco de Entrega: Overbooking" style={{ color: 'var(--status-red)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={18} /> <span style={{ fontWeight: 'bold' }}>{totalLoad}%</span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--status-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={18} /> <span style={{ fontWeight: 'bold' }}>{totalLoad}%</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
                   {userAllocs.map((alloc, idx) => (
                     <div 
                       key={alloc.id} 
                       title={`${alloc.initiativeId} (${alloc.percentage}%)`}
                       style={{ 
                         width: `${alloc.percentage}%`, 
                         background: alloc.initiativeId === 'BAU' ? 'var(--text-secondary)' : `hsl(260, ${60 + idx * 10}%, ${50 + idx * 10}%)`,
                         height: '100%'
                       }} 
                     />
                   ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {userAllocs.map(alloc => (
                    <div key={alloc.id} className="flex-between" style={{ fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} className="text-tertiary" /> 
                        {alloc.initiativeId === 'BAU' ? 'Sustentação (BAU)' : mockInitiatives.find(i => i.id === alloc.initiativeId)?.title}
                      </span>
                      <span style={{ fontWeight: 600 }}>{alloc.percentage}%</span>
                    </div>
                  ))}
                </div>

                {isOverbooked && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'hsla(0, 80%, 60%, 0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--status-red)', fontSize: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    Capacidade excedida. Este recurso gerará risco técnico ou atraso (RF12).
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Roadmap;
