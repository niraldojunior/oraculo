import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers,
  Users,
  AlertCircle,
  Clock,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Plus
} from 'lucide-react';
import type { Initiative, InitiativeType, Collaborator, System } from '../types';

const PRIORITY_ORDER: Record<InitiativeType, number> = {
  'Estratégico': 1,
  'Projeto': 2,
  'Fast Track': 3,
  'Vulnerabilidade': 4,
  'Problema': 5,
  'PBI': 6,
  'Roadmap Tecnológico': 7
};

const TYPE_COLORS: Record<string, string> = {
  'Estratégico': 'var(--status-red)',
  'Projeto': 'var(--accent-base)',
  'Fast Track': 'var(--status-green)',
  'Vulnerabilidade': 'var(--status-amber)',
  'Problema': 'var(--status-purple)',
  'PBI': 'var(--text-tertiary)',
  'Roadmap Tecnológico': 'var(--status-blue)'
};

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

import { useAuth } from '../context/AuthContext';
import { useView } from '../context/ViewContext';

const Initiatives: React.FC = () => {
  const { currentCompany, currentDepartment } = useAuth();
  const navigate = useNavigate();
  const { activeView, searchTerm: globalSearch, registerAddAction } = useView();
  const [viewMode, setViewMode] = useState<'manager' | 'directorate' | 'type' | 'status' | 'system' | 'timeline'>('manager');

  useEffect(() => {
    if (['manager', 'directorate', 'type', 'status', 'system', 'timeline'].includes(activeView)) {
      setViewMode(activeView as any);
    }
  }, [activeView]);

  useEffect(() => {
    registerAddAction(() => { navigate('/iniciativas/nova'); });
    return () => registerAddAction(() => null);
  }, [navigate]);

  const [selectedYear, setSelectedYear] = useState('2026');
  
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    Promise.all([
      fetch(`/api/initiatives${query}`).then(res => res.json()),
      fetch(`/api/collaborators${query}`).then(res => res.json()),
      fetch(`/api/systems${query}`).then(res => res.json())
    ])
    .then(([initData, collabsData, systemsData]) => {
      setInitiatives(Array.isArray(initData) ? initData : []);
      setCollaborators(Array.isArray(collabsData) ? collabsData : []);
      setSystems(Array.isArray(systemsData) ? systemsData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch initiatives data:', err);
      setInitiatives([]);
      setCollaborators([]);
      setSystems([]);
      setLoading(false);
    });
  }, [currentCompany, currentDepartment]);
  
  const filteredInitiatives = (Array.isArray(initiatives) ? initiatives : []).filter(it => {
    if (!it) return false;
    if (viewMode !== 'status' && (it.status === '5- Entregue' || it.status === 'Cancelado')) return false;

    const term = globalSearch.toLowerCase();
    const manager = collaborators?.find(c => c.id === it.leaderId);
    
    return (
      (it.title || '').toLowerCase().includes(term) ||
      (it.customerOwner || '').toLowerCase().includes(term) ||
      (it.originDirectorate || '').toLowerCase().includes(term) ||
      (manager?.name || '').toLowerCase().includes(term) ||
      (it.type || '').toLowerCase().includes(term)
    );
  });

  const getColumns = (): { id: string; title: string; photo?: string; icon?: React.ReactNode; initiatives: Initiative[] }[] => {
    const sorted = [...filteredInitiatives].sort((a, b) => {
      const orderA = PRIORITY_ORDER[a.type as InitiativeType] || 99;
      const orderB = PRIORITY_ORDER[b.type as InitiativeType] || 99;
      return orderA - orderB;
    });
    
    if (viewMode === 'manager') {
      const relevantManagers = Array.from(new Set(filteredInitiatives.map(it => it.leaderId)));
      const managers = collaborators.filter(c => relevantManagers.includes(c.id));
      
      return managers.map(m => ({
        id: m.id,
        title: m.name,
        photo: m.photoUrl,
        initiatives: sorted.filter(it => it.leaderId === m.id)
      }));
    }

    if (viewMode === 'directorate') {
      const dirs = Array.from(new Set(filteredInitiatives.map(it => it.originDirectorate).filter(Boolean)));
      return dirs.sort().map(d => ({
        id: d!,
        title: d!,
        icon: <Users size={18} />,
        initiatives: sorted.filter(it => it.originDirectorate === d)
      }));
    }

    if (viewMode === 'type') {
      const types = Array.from(new Set(filteredInitiatives.map(it => it.type).filter(Boolean)));
      return (Object.keys(PRIORITY_ORDER) as InitiativeType[]).filter(t => types.includes(t)).map(t => ({
        id: t,
        title: t,
        icon: <Layers size={18} />,
        initiatives: sorted.filter(it => it.type === t)
      }));
    }

    if (viewMode === 'status') {
      const getStatusIcon = (s: string) => {
        switch (s) {
          case '1- Em Avaliação': return <AlertCircle size={18} />;
          case '2- Em Backlog': return <Clock size={18} />;
          case '3- Em Planejamento': return <Layers size={18} />;
          case '4- Em Execução': return <Activity size={18} />;
          case '5- Entregue': return <CheckCircle size={18} className="text-success" />;
          case 'Suspenso': return <AlertTriangle size={18} />;
          case 'Cancelado': return <XCircle size={18} className="text-error" />;
          default: return <Activity size={18} />;
        }
      };

      const statuses: string[] = [
        '1- Em Avaliação', 
        '2- Em Backlog', 
        '3- Em Planejamento', 
        '4- Em Execução', 
        '5- Entregue', 
        'Suspenso', 
        'Cancelado'
      ];
      return statuses.map(s => {
        let title = s;
        if (s === '5- Entregue') title = 'Concluído';
        return {
          id: s,
          title: title,
          icon: getStatusIcon(s),
          initiatives: sorted.filter(it => it.status === s)
        };
      });
    }

    if (viewMode === 'system') {
      const impactedSystems = Array.from(new Set(filteredInitiatives.flatMap(it => it.impactedSystemIds || []))).filter(Boolean);
      return impactedSystems.sort().map(sysId => {
        const sys = systems.find(s => s.id === sysId);
        return {
          id: sysId,
          title: sys?.name || sysId,
          icon: <Database size={18} />,
          initiatives: sorted.filter(it => it.impactedSystemIds?.includes(sysId))
        };
      });
    }

    if (viewMode === 'timeline') {
      const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];

      return months.map((month, index) => {
        const monthIndex = index + 1; // 1-12
        const monthStr = monthIndex.toString().padStart(2, '0');
        
        return {
          id: `month_${monthIndex}`,
          title: month,
          icon: <Calendar size={18} />,
          initiatives: sorted.filter(it => {
            if (!it.businessExpectationDate) return false;
            // Parse YYYY-MM-DD or similar
            const [y, m] = it.businessExpectationDate.split('-');
            return y === selectedYear && m === monthStr;
          })
        };
      });
    }

    return [];
  };

  const renderInitiativeCard = (it: Initiative) => {
    if (!it) return null;
    const manager = collaborators.find(c => c.id === it.leaderId);

    const getPhaseIcon = (status: string) => {
      switch (status) {
        case '1- Em Avaliação': return <AlertCircle size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '2- Em Backlog': return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '3- Em Planejamento': return <Layers size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '4- Em Execução': return <Activity size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '5- Entregue': return <CheckCircle size={14} style={{ color: 'var(--status-green)' }} />;
        case 'Suspenso': return <AlertTriangle size={14} style={{ color: 'var(--status-amber)' }} />;
        case 'Cancelado': return <XCircle size={14} style={{ color: 'var(--status-red)' }} />;
        default: return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />;
      }
    };

    return (
      <div 
        key={it.id} 
        className="initiative-kanban-card"
        onClick={() => navigate(`/iniciativas/${it.id}`)}
        style={{ 
          padding: '0.4rem 0.6rem', 
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid var(--glass-border-strong)',
          borderLeft: `5px solid ${TYPE_COLORS[it.type] || 'var(--glass-border-strong)'}`,
          marginBottom: '0.4rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: '1.3', color: 'var(--text-primary)' }}>
          {fixEncoding(it.title, true) || 'Sem título'}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {it.businessExpectationDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Calendar size={11} color="#64748B" />
                <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>
                  {it.businessExpectationDate}
                </span>
              </div>
            )}
            {it.impactedSystemIds && it.impactedSystemIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Database size={11} color="#64748B" />
                <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>
                  {it.impactedSystemIds.length}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getPhaseIcon(it.status)}
            {manager?.photoUrl && (
              <img 
                src={manager.photoUrl} 
                alt={manager.name}
                style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--glass-border)', objectFit: 'cover' }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div><span>Carregando Iniciativas...</span></div>;

  return (
    <div className="page-layout" style={{ 
      position: 'relative', 
      height: 'calc(100vh - 20px)', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '0 1.5rem 0 1.5rem', 
      overflow: 'hidden' 
    }}>
      <div className="kanban-board" style={{ 
        flexGrow: 1, 
        display: 'flex', 
        gap: '1.25rem', 
        overflowX: 'auto', 
        padding: '0 0.5rem 1.25rem 0.5rem',
        alignItems: 'flex-start',
        background: 'transparent',
        margin: '0 -1.5rem -2rem -1.5rem'
      }}>
        {viewMode === 'timeline' && (
          <div style={{ position: 'absolute', top: '0.5rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Ano:</span>
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="form-select-premium"
              style={{ 
                padding: '0.2rem 0.5rem', 
                borderRadius: '6px', 
                border: '1px solid var(--glass-border-strong)',
                background: 'white',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        )}
        {getColumns().map(column => {
          const colInits = column.initiatives;
          if (colInits.length === 0 && globalSearch) return null;

          return (
            <div key={column.id} className="kanban-column-trello">
              <div className="kanban-column-header-trello">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }}>
                  {column.photo && (
                    <img src={column.photo} alt={column.title} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  {column.icon && !column.photo && <span style={{ color: 'var(--text-secondary)' }}>{column.icon}</span>}
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fixEncoding(column.title)}
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  {colInits.length}
                </div>
              </div>
              
              <div className="kanban-column-content" style={{ padding: '0 0.4rem' }}>
                {colInits.map(renderInitiativeCard)}
              </div>

              <button 
                className="add-card-btn-trello"
                onClick={() => navigate('/iniciativas/nova')}
              >
                <Plus size={14} />
                <span>Adicionar um cartão</span>
              </button>
            </div>
          );
        })}

        {getColumns().length === 0 && (
          <div className="flex-center" style={{ width: '100%', flexDirection: 'column', opacity: 0.2, marginTop: '4rem' }}>
            <Layers size={64} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 800 }}>Nenhuma iniciativa encontrada</h3>
          </div>
        )}
      </div>

      <style>{`
        .kanban-board::-webkit-scrollbar { height: 10px; }
        .kanban-board::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 5px; }
        .kanban-board::-webkit-scrollbar-track { background: rgba(0,0,0,0.03); }
        
        .kanban-column-trello {
          min-width: 250px;
          max-width: 250px;
          background: #CDD7E1;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          max-height: 100%;
          border: 1px solid #BCC6D0;
          flex-shrink: 0;
        }

        .kanban-column-header-trello {
          padding: 0.75rem 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kanban-column-content {
          flex-grow: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding-bottom: 0.5rem;
        }

        .kanban-column-content::-webkit-scrollbar { width: 5px; }
        .kanban-column-content::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .kanban-column-content::-webkit-scrollbar-track { background: transparent; }

        .add-card-btn-trello {
          width: 100%;
          padding: 0.65rem 0.85rem;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748B;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 0 0 12px 12px;
          transition: all 0.2s;
          margin-top: auto;
        }

        .add-card-btn-trello:hover {
          background: rgba(0,0,0,0.05);
          color: var(--text-primary);
        }

        .initiative-kanban-card {
          transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.1s ease;
        }

        .initiative-kanban-card:hover {
          background-color: #F8FAFC !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-color: #CBD5E1 !important;
        }

        .initiative-kanban-card:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};

// Also need to import Plus from lucide-react if not already

export default Initiatives;
