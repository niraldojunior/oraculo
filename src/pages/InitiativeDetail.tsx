import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Layers, 
  Info, 
  Zap,
  Activity,
  Clock,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockSystems, mockCollaborators, mockInitiatives } from '../data/mockDb';
import { importedInitiatives } from '../data/importedInitiatives';
import type { Initiative } from '../types';

const fixEncoding = (text: string | null | undefined, isTitle = false): string => {
  if (!text) return '';
  let result = text
    .replace(/‡Æ/g, 'çã')
    .replace(/‡ä/g, 'çõ')
    .replace(/‡/g, 'ç')
    .replace(/Æ/g, 'ã')
    .replace(/€Ç/g, 'ÇÃO')
    .replace(/ÇO/g, 'ÃO')
    .replace(/€/g, 'Ç')
    .replace(/¡/g, 'í')
    .replace(/µ/g, 'Á')
    .replace(/à/g, 'ó')
    .replace(/¢/g, 'ó')
    .replace(/ˆ/g, 'ê')
    .replace(/ƒ/g, 'â')
    .replace(/‚/g, 'é')
    .replace(/ä/g, 'õ')
    .replace(/Ç /g, 'ã ')
    .replace(/ hor rio/g, ' horário')
    .replace(/ rio/g, ' rio')
    .replace(/ ria /g, ' ária ')
    .replace(/ria\b/g, 'ria')
    .replace(/fuso hor rio/g, 'fuso horário')
    .replace(/Opera‡Æo/g, 'Operação')
    .replace(/adequa‡Æo/g, 'adequação')
    .replace(/instala‡Æo/g, 'instalação')
    .replace(/pendˆncia/g, 'pendência');

  if (isTitle && result.length > 0) {
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  }
  return result;
};

const InitiativeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [initiative, setInitiative] = useState<Initiative | null>(null);

  const isDirector = user?.role === 'Director';

    useEffect(() => {
    const saved = localStorage.getItem('oraculo_initiatives_v1');
    const localInits = saved ? JSON.parse(saved) as Initiative[] : [];
    
    // Merge: local initiatives take precedence over mock ones with same ID
    const list = [...localInits];
    
    // Add mock initiatives if not present
    mockInitiatives.forEach(mock => {
      if (!list.some(it => it.id === mock.id)) {
        list.push(mock);
      }
    });

    // Add imported initiatives if not present
    importedInitiatives.forEach(imp => {
      if (!list.some(it => it.id === imp.id)) {
        list.push(imp);
      }
    });

    const found = list.find(it => it.id === id);
    if (found) setInitiative(found);
  }, [id]);

  if (!initiative) {
    return (
      <div className="page-layout flex-center" style={{ height: '60vh' }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <Layers size={48} style={{ marginBottom: '1rem' }} />
          <h3>Iniciativa não encontrada</h3>
          <button className="btn btn-glass" style={{ marginTop: '1rem' }} onClick={() => navigate('/iniciativas')}>
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  const manager = mockCollaborators.find(c => c.id === initiative.leaderId);
  const techLead = mockCollaborators.find(c => c.id === initiative.technicalLeadId);

  const calcDeviation = (baseline: string, real?: string) => {
    if (!real) return 0;
    const b = new Date(baseline).getTime();
    const r = new Date(real).getTime();
    return Math.ceil((r - b) / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'Estratégico': return 'var(--status-red)';
      case 'Projetos': return 'var(--accent-base)';
      case 'Fast Track': return 'var(--status-green)';
      case 'Vulnerabilidade': return '#ffae00';
      case 'Roadmap Tecnológico': return '#22d3ee';
      case 'PBI': return 'var(--text-tertiary)';
      default: return 'var(--glass-border-strong)';
    }
  };

  const handleDelete = () => {
    if (!id) return;
    
    // 1. Remove from local initiatives if present
    const saved = localStorage.getItem('oraculo_initiatives_v1');
    if (saved) {
      const localInits = JSON.parse(saved) as Initiative[];
      const filtered = localInits.filter(it => it.id !== id);
      localStorage.setItem('oraculo_initiatives_v1', JSON.stringify(filtered));
    }

    // 2. Add to deleted IDs blacklist (for mock/imported)
    const deletedSaved = localStorage.getItem('oraculo_deleted_ids');
    const deletedIds = deletedSaved ? JSON.parse(deletedSaved) as string[] : [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('oraculo_deleted_ids', JSON.stringify(deletedIds));
    }

    navigate('/iniciativas');
  };

  if (!initiative) {
    return (
      <div className="page-layout flex-center" style={{ height: '60vh' }}>
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <Layers size={48} style={{ marginBottom: '1rem' }} />
          <h3>Iniciativa não encontrada</h3>
          <button className="btn btn-glass" style={{ marginTop: '1rem' }} onClick={() => navigate('/iniciativas')}>
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="page-layout" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button className="btn btn-glass" onClick={() => navigate('/iniciativas')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.25rem' }}>
                <span className="badge" style={{ backgroundColor: getPriorityColor(initiative.type), color: 'white', fontWeight: 800 }}>
                {fixEncoding(initiative.type)}
              </span>
              <span className="text-tertiary" style={{ fontSize: '0.8rem' }}>ID: {initiative.id}</span>
            </div>
            <h1>{fixEncoding(initiative.title, true)}</h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ textAlign: 'right' }}>
              <div className="text-tertiary" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
              <div style={{ color: 'var(--accent-base)', fontWeight: 700, fontSize: '0.9rem' }}>{fixEncoding(initiative.status)}</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/iniciativas/editar/${initiative.id}`)}>
            <Edit2 size={16} /> Editar
          </button>
          
          {isDirector && (
            <button 
              className="btn btn-glass" 
              onClick={() => {
                if (window.confirm('Tem certeza que deseja excluir esta iniciativa? Esta ação não pode ser desfeita.')) {
                  handleDelete();
                }
              }}
              style={{ color: 'var(--status-red)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              <Trash2 size={16} /> Excluir
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* JANELA 1: INFO DE ABERTURA */}
        <section className="glass-panel info-panel">
          <h3><Info size={16} /> Info de Abertura</h3>
          <div className="panel-grid">
            <div className="col">
              <div className="info-item">
                <label>Diretoria de Origem</label>
                <span>{fixEncoding(initiative.originDirectorate)}</span>
              </div>
              <div className="info-item">
                <label>Owner</label>
                <span>{fixEncoding(initiative.customerOwner)}</span>
              </div>
            </div>
            <div className="col">
              <div className="info-item">
                <label>Tipo de Benefício</label>
                <span className="badge-small" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--accent-base)', fontSize: '0.75rem' }}>
                  {fixEncoding(initiative.benefitType) || 'Não definido'}
                </span>
              </div>
              <div className="info-item">
                <label>Benefício Valor do Negócio</label>
                <p>{fixEncoding(initiative.benefit)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* JANELA 2: ESCOPO RESUMIDO */}
        <section className="glass-panel info-panel">
          <h3><Layers size={16} /> Escopo Resumido</h3>
          <p className="scope-text">{fixEncoding(initiative.scope)}</p>
        </section>

        {/* JANELA 3: IMPACTO E EXECUÇÃO */}
        <section className="glass-panel info-panel" style={{ background: '#FFFFFF' }}>
          <h3><Zap size={16} /> Impacto e Execução</h3>
          <div className="panel-grid">
            <div className="col">
              <div className="info-item">
                <label>Gerente</label>
                <span>{manager?.name || '---'}</span>
              </div>
              <div className="info-item">
                <label>Líder Técnico</label>
                <span>{techLead?.name || '---'}</span>
              </div>
            </div>
            <div className="col">
              <div className="info-item">
                <label>Sistemas Impactados</label>
                <div className="tags-container">
                  {initiative.impactedSystemIds.map(id => (
                    <span key={id} className="mini-tag">{mockSystems.find(s => s.id === id)?.name || id}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
        {/* Milestones */}
        <section className="glass-panel" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={20} className="text-tertiary" /> Cronograma
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {initiative.milestones?.map((m) => {
              const deviation = calcDeviation(m.baselineDate, m.realDate);
              const isSimpl = ['Fast Track', 'Vulnerabilidade', 'Problema', 'PBI', 'Roadmap Tecnológico'].includes(initiative.type);
              
              return (
                <div key={m.id} className="milestone-row glass-panel-dark">
                  <div className="m-info">
                    <span className="m-name">{fixEncoding(m.name)}</span>
                    <span className="m-sys">{mockSystems.find(s => s.id === m.systemId)?.name}</span>
                  </div>
                  <div className="m-dates">
                    <div className="date-box">
                      <label>{isSimpl ? 'Início' : 'Planejado'}</label>
                      <span>{m.startDate || m.baselineDate}</span>
                    </div>
                    <div className="date-box">
                      <label>{isSimpl ? 'Entrega' : 'Real'}</label>
                      <span style={{ color: deviation > 0 ? 'var(--status-red)' : 'inherit' }}>
                        {isSimpl ? m.baselineDate : (m.realDate || '---')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Histórico */}
        <section className="glass-panel" style={{ padding: '1.5rem', background: '#FFFFFF' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={20} className="text-tertiary" /> Histórico
          </h3>
          <div className="history-list">
            {(initiative.history || []).slice().reverse().map(h => (
              <div key={h.id} className="history-item">
                <div className="h-dot" />
                <div className="h-content">
                  <div className="h-header">
                    <span className="h-user">{fixEncoding(h.user)}</span>
                    <span className="h-date">{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="h-action">{fixEncoding(h.action)}</p>
                </div>
              </div>
            ))}
            {(!initiative.history || initiative.history.length === 0) && (
              <div style={{ textAlign: 'center', opacity: 0.3, padding: '2rem' }}>Sem registros de histórico.</div>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .info-panel {
          padding: 1.25rem !important;
          background: #FFFFFF !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        .info-panel h3 {
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-tertiary);
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .panel-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.75rem;
        }
        .info-item label {
          font-size: 0.85rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }
        .info-item span, .info-item p {
          font-size: 1rem;
          font-weight: 500;
        }
        .scope-text {
          font-size: 0.85rem;
          line-height: 1.5;
          opacity: 0.8;
        }
        .mini-tag {
          background: rgba(0,0,0,0.05); /* Darks better on white */
          padding: 0.35rem 0.65rem;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .milestone-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
        }
        .m-info {
          display: flex;
          flex-direction: column;
        }
        .m-name { font-weight: 600; font-size: 0.95rem; }
        .m-sys { font-size: 0.75rem; color: var(--text-tertiary); }
        .m-dates { display: flex; gap: 2rem; }
        .date-box { display: flex; flexDirection: column; gap: 0.2rem; }
        .date-box label { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; }
        .date-box span { font-size: 0.85rem; font-weight: 600; }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          padding-left: 0.5rem;
        }
        .history-list::before {
          content: '';
          position: absolute;
          left: 4.5px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--glass-border);
        }
        .history-item {
          display: flex;
          gap: 1rem;
          position: relative;
        }
        .h-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent-base);
          border: 2px solid var(--bg-dark);
          position: relative;
          z-index: 1;
          margin-top: 4px;
        }
        .h-header { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
        .h-user { font-size: 0.8rem; font-weight: 700; color: var(--accent-base); }
        .h-date { font-size: 0.7rem; opacity: 0.4; }
        .h-action { font-size: 0.8rem; line-height: 1.4; }
      `}</style>
    </div>
  );
};

export default InitiativeDetail;
