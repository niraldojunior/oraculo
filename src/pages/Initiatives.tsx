import React, { useState, useEffect } from 'react';
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
  Plus,
  Target
} from 'lucide-react';
import type { Initiative, InitiativeType, Collaborator, System, Team } from '../types';
import InitiativeDetailModal from '../components/layout/InitiativeDetailModal';

const PRIORITY_ORDER: Record<InitiativeType, number> = {
  '1- Portfolio 26': 1,
  '2- Project': 2,
  '3- Feature': 3,
  '4- Enhancements': 4,
  '5- Tech Debt': 5,
  '6- Enabler': 6,
  '7- Bug': 7,
  'Indefinido': 8
};

const TYPE_COLORS: Record<string, string> = {
  '1- Portfolio 26': '#E11D48',
  'Portifólio 26': '#E11D48',
  '2- Project': '#2563EB',
  'Projeto': '#2563EB',
  '3- Feature': '#059669',
  'Nova Funcionalidade': '#059669',
  '4- Enhancements': '#D97706',
  'Melhoria': '#D97706',
  '5- Tech Debt': '#4B5563',
  'Débito Técnico': '#4B5563',
  '6- Enabler': '#4F46E5',
  'Enabler': '#4F46E5',
  '7- Bug': '#DC2626',
  'Bug': '#DC2626'
};

const oldToNewMap: Record<string, string> = {
  '1- Em Avaliação': '2- Avaliação',
  '1- Avaliação': '2- Avaliação',
  '2- Em Backlog': '3- Backlog',
  '2- Backlog': '3- Backlog',
  '3- Em Planejamento': '5- Planejamento',
  '3- Discovery': '4- Discovery',
  '4- Em Execução': '6- Execução',
  '4- Planejamento': '5- Planejamento',
  '5- Entregue': '7- Concluído',
  '5- Execução': '6- Execução',
  '6- Concluído': '7- Concluído'
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
  const { activeView, searchTerm: globalSearch, registerAddAction } = useView();
  const [viewMode, setViewMode] = useState<'manager' | 'directorate' | 'type' | 'status' | 'system' | 'timeline'>('manager');

  useEffect(() => {
    if (['manager', 'directorate', 'type', 'status', 'system', 'timeline'].includes(activeView)) {
      setViewMode(activeView as any);
    }
  }, [activeView]);

  const handleAddNew = () => {
    const newInit: Initiative = {
      id: `new_${Date.now()}`,
      companyId: currentCompany?.id || '',
      departmentId: currentDepartment?.id || '',
      title: '',
      type: '3- Feature',
      benefit: '',
      scope: '',
      customerOwner: '',
      originDirectorate: '',
      leaderId: '',
      impactedSystemIds: [],
      milestones: [],
      createdAt: new Date().toISOString(),
      status: '1- Criação',
      history: []
    };
    setSelectedInitiative(newInit);
  };

  useEffect(() => {
    registerAddAction(handleAddNew);
    return () => registerAddAction(() => null);
  }, [registerAddAction, currentCompany, currentDepartment]);

  const [selectedYear, setSelectedYear] = useState('2026');
  
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    Promise.all([
      fetch(`/api/initiatives${query}`).then(res => res.json()),
      fetch(`/api/collaborators${query}`).then(res => res.json()),
      fetch(`/api/teams${query}`).then(res => res.json()),
      fetch(`/api/systems${query}`).then(res => res.json())
    ])
    .then(([initData, collabsData, teamsData, systemsData]) => {
      setInitiatives(Array.isArray(initData) ? initData : []);
      setCollaborators(Array.isArray(collabsData) ? collabsData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
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
    if (viewMode !== 'status' && (it.status === '7- Concluído' || it.status === 'Cancelado')) return false;

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
      const getStatusIconValue = (s: string) => {
        switch (s) {
          case '1- Criação': return <Plus size={18} />;
          case '2- Avaliação': return <AlertCircle size={18} />;
          case '3- Backlog': return <Clock size={18} />;
          case '4- Discovery': return <Target size={18} />;
          case '5- Planejamento': return <Layers size={18} />;
          case '6- Execução': return <Activity size={18} />;
          case '7- Concluído': return <CheckCircle size={18} className="text-success" />;
          case 'Suspenso': return <AlertTriangle size={18} />;
          case 'Cancelado': return <XCircle size={18} className="text-error" />;
          default: return <Activity size={18} />;
        }
      };

      const statuses: string[] = [
        '1- Criação',
        '2- Avaliação', 
        '3- Backlog', 
        '4- Discovery', 
        '5- Planejamento', 
        '6- Execução', 
        '7- Concluído', 
        'Suspenso', 
        'Cancelado'
      ];

      return statuses.map(s => {
        return {
          id: s,
          title: s.includes('- ') ? s.split('- ')[1] : s,
          icon: getStatusIconValue(s),
          initiatives: sorted.filter(it => it.status === s || oldToNewMap[it.status] === s)
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
            if (!it || !it.businessExpectationDate) return false;
            const parts = it.businessExpectationDate.split('-');
            if (parts.length < 2) return false;
            const [y, m] = parts;
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
      const normalizedStatus = oldToNewMap[status] || status;
      switch (normalizedStatus) {
        case '1- Criação': return <Plus size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '2- Avaliação': return <AlertCircle size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '3- Backlog': return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '4- Discovery': return <Target size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '5- Planejamento': return <Layers size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '6- Execução': return <Activity size={14} style={{ color: 'var(--text-tertiary)' }} />;
        case '7- Concluído': return <CheckCircle size={14} style={{ color: 'var(--status-green)' }} />;
        case 'Suspenso': return <AlertTriangle size={14} style={{ color: 'var(--status-amber)' }} />;
        case 'Cancelado': return <XCircle size={14} style={{ color: 'var(--status-red)' }} />;
        default: return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />;
      }
    };

    return (
      <div 
        key={it.id} 
        className="initiative-kanban-card"
        onClick={() => setSelectedInitiative(it)}
        style={{ 
          padding: '0.4rem 0.6rem', 
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid var(--glass-border-strong)',
          borderLeft: `5px solid ${TYPE_COLORS[(it as any).initiativeType] || TYPE_COLORS[it.type] || 'var(--glass-border-strong)'}`,
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
        padding: '0 1.5rem 2rem 1.5rem', // Added horizontal and bottom padding
        alignItems: 'flex-start',
        background: 'transparent',
        margin: '0 -1.5rem 0 -1.5rem' // Removed negative bottom margin
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
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fixEncoding(column.title)}
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#000000', background: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                  {colInits.length}
                </div>
              </div>
              
              <div className="kanban-column-content" style={{ padding: '0 0.4rem' }}>
                {colInits.map(renderInitiativeCard)}
              </div>

              <button 
                className="add-card-btn-trello"
                onClick={handleAddNew}
              >
                <Plus size={14} />
                <span>Adicionar uma Iniciativa</span>
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

      {selectedInitiative && (
        <InitiativeDetailModal
          initiative={selectedInitiative}
          allCollaborators={collaborators}
          allTeams={teams}
          onClose={() => setSelectedInitiative(null)}
          onSave={async (updated: Initiative) => {
            const isNew = updated.id.startsWith('new_');
            const url = isNew ? '/api/initiatives' : `/api/initiatives/${updated.id}`;
            const method = isNew ? 'POST' : 'PATCH';

            try {
              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
              });
              if (res.ok) {
                const data = await res.json();
                setInitiatives(prev => {
                  if (isNew) {
                    return [data, ...prev];
                  }
                  return prev.map(i => i.id === data.id ? data : i);
                });
                setSelectedInitiative(data);
              } else {
                throw new Error('Failed to save changes');
              }
            } catch (err) {
              console.error('Failed to save initiative:', err);
              throw err;
            }
          }}
        />
      )}

      <style>{`
        .kanban-board::-webkit-scrollbar { height: 10px; }
        .kanban-board::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 5px; }
        .kanban-board::-webkit-scrollbar-track { background: rgba(0,0,0,0.03); }
        
        .kanban-column-trello {
          min-width: 250px;
          max-width: 250px;
          background: #AEB9C5;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          max-height: 100%;
          border: none;
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
          color: #000000;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 0 0 12px 12px;
          transition: all 0.2s;
          margin-top: auto;
        }

        .add-card-btn-trello:hover {
          background: rgba(0,0,0,0.05);
          color: #000000;
        }

        .initiative-kanban-card {
          transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.1s ease;
        }

        .initiative-kanban-card:hover {
          background-color: #F8FAFC !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          outline: 2px solid var(--accent-base);
          outline-offset: -2px;
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
