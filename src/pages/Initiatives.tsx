import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
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
import { mockSystems } from '../data/mockDb';
import type { Initiative, InitiativeType, Collaborator } from '../types';

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

const Initiatives: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'manager' | 'directorate' | 'type' | 'status' | 'system' | 'timeline'>('manager');
  const [selectedYear, setSelectedYear] = useState('2026');
  
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/initiatives').then(res => res.json()),
      fetch('/api/collaborators').then(res => res.json())
    ])
    .then(([initData, collabsData]) => {
      setInitiatives(Array.isArray(initData) ? initData : []);
      setCollaborators(Array.isArray(collabsData) ? collabsData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch initiatives data:', err);
      setInitiatives([]);
      setCollaborators([]);
      setLoading(false);
    });
  }, []);
  
  const filteredInitiatives = (Array.isArray(initiatives) ? initiatives : []).filter(it => {
    if (!it) return false;
    // Hide delivered/cancelled for main views (Manager/Dir/Type) to keep them clean
    // But show them in Status view as requested
    if (viewMode !== 'status' && (it.status === '5- Entregue' || it.status === 'Cancelado')) return false;

    const term = searchTerm.toLowerCase();
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
        const sys = mockSystems.find(s => s.id === sysId);
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
        case '1- Em Avaliação': return <AlertCircle size={14} className="text-tertiary" />;
        case '2- Em Backlog': return <Clock size={14} className="text-tertiary" />;
        case '3- Em Planejamento': return <Layers size={14} className="text-tertiary" />;
        case '4- Em Execução': return <Activity size={14} className="text-tertiary" />;
        case '5- Entregue': return <CheckCircle size={14} style={{ color: 'var(--status-green)' }} />;
        case 'Suspenso': return <AlertTriangle size={14} className="text-tertiary" />;
        case 'Cancelado': return <XCircle size={14} style={{ color: 'var(--status-red)' }} />;
        default: return <Clock size={14} className="text-tertiary" />;
      }
    };


    return (
      <div 
        key={it.id} 
        className="initiative-kanban-card"
        onClick={() => navigate(`/iniciativas/${it.id}`)}
        style={{ 
          padding: '1rem', 
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #94A3B8',
          borderLeft: `6px solid ${TYPE_COLORS[it.type] || 'var(--glass-border-strong)'}`,
          marginBottom: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: '1.2', color: '#181919' }}>
            {fixEncoding(it.title, true) || 'Sem título'}
          </div>
          
          {it.businessExpectationDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={10} color="#64748B" />
              <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>
                {it.businessExpectationDate}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {getPhaseIcon(it.status)}
          {manager?.photoUrl && (
            <img 
              src={manager.photoUrl} 
              alt={manager.name}
              style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--glass-border)' }}
            />
          )}
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
      padding: '0.5rem 2rem 0 2rem', 
      overflow: 'hidden' 
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottom: '2px solid var(--glass-border)', 
        paddingBottom: '0.5rem',
        marginTop: '0.5rem'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {[
            { id: 'manager', label: 'Gestor', icon: <Users size={16} /> },
            { id: 'directorate', label: 'Demandante', icon: <Layers size={16} /> },
            { id: 'type', label: 'Tipo', icon: <Activity size={16} /> },
            { id: 'status', label: 'Status', icon: <Clock size={16} /> },
            { id: 'system', label: 'Sistema', icon: <Database size={16} /> },
            { id: 'timeline', label: 'Timeline', icon: <Calendar size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'transparent',
                border: 'none',
                padding: '0.5rem 0.5rem',
                color: viewMode === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                borderBottom: viewMode === tab.id ? '3px solid var(--accent-base)' : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                marginBottom: '-0.7rem'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {viewMode === 'timeline' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Ano:</span>
              <select 
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="form-select-premium"
                style={{ 
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '6px', 
                  border: '1px solid var(--glass-border-strong)',
                  background: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
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

          {/* Integrated Search Bar */}
          <div className="search-box-premium" style={{ width: '300px', marginRight: '1rem' }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
            <input 
              placeholder="Buscar títulos, gestores..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/iniciativas/nova')}
            style={{ padding: '0.5rem 1rem' }}
          >
            <Plus size={18} /> Novo
          </button>
        </div>
      </div>

      <div className="kanban-board" style={{ 
        flexGrow: 1, 
        display: 'flex', 
        gap: '2rem', 
        overflowX: 'auto', 
        padding: '1.5rem 2rem',
        alignItems: 'stretch',
        background: '#E0E5ED',
        borderRadius: '16px 16px 0 0',
        border: '1px solid var(--glass-border)',
        margin: '0.5rem -2rem -2rem -2rem',
        boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.05)'
      }}>
        {getColumns().map(column => {
          const colInits = column.initiatives;
          if (colInits.length === 0 && searchTerm) return null;

          return (
            <div key={column.id} className="kanban-column">
              <div className="kanban-column-header" style={{ 
                background: 'transparent', 
                borderBottom: '2px solid #94A3B8',
                padding: '0 0.5rem 1rem 0.5rem' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {column.photo ? (
                    <img src={column.photo} alt={column.title} style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', objectFit: 'cover', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-full)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                      {column.icon || <Users size={18} />}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{fixEncoding(column.title)}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>{colInits.length} Itens</div>
                  </div>
                </div>
              </div>
              <div className="kanban-column-content" style={{ marginTop: '1rem' }}>
                {colInits.map(renderInitiativeCard)}
              </div>
            </div>
          );
        })}

        {getColumns().length === 0 && (
          <div className="flex-center" style={{ width: '100%', flexDirection: 'column', opacity: 0.3 }}>
            <Layers size={64} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontWeight: 800 }}>Nenhuma iniciativa encontrada</h3>
          </div>
        )}
      </div>

      <style>{`
        .kanban-board::-webkit-scrollbar { height: 10px; }
        .kanban-board::-webkit-scrollbar-thumb { background: #334155; border-radius: 5px; }
        .kanban-board::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        
        .kanban-column {
          min-width: 280px;
          max-width: 280px;
          display: flex;
          flex-direction: column;
        }

        .kanban-column-content {
          flex-grow: 1;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .kanban-column-content::-webkit-scrollbar { width: 8px; }
        .kanban-column-content::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .kanban-column-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }

        .initiative-kanban-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .initiative-kanban-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
      `}</style>
    </div>
  );
};

export default Initiatives;
