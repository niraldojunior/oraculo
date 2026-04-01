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
  Target,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { PriorityIcon, PriorityPicker } from '../components/common/PriorityPicker';
import type { Initiative, InitiativeType, Collaborator, System, Team } from '../types';
import InitiativeDetailModal from '../components/layout/InitiativeDetailModal';

const PRIORITY_ORDER: Record<InitiativeType, number> = {
  '1- Estratégico': 1,
  '2- Projeto': 2,
  '3- Fast Track': 3
};

const TYPE_COLORS: Record<string, string> = {
  '1- Estratégico': '#E11D48',
  '2- Projeto': '#2563EB',
  '3- Fast Track': '#059669'
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
  const [viewMode, setViewMode] = useState<'manager' | 'directorate' | 'type' | 'status' | 'system' | 'timeline' | 'table'>('manager');

  useEffect(() => {
    if (['manager', 'directorate', 'type', 'status', 'system', 'timeline', 'table'].includes(activeView)) {
      setViewMode(activeView as any);
    }
  }, [activeView]);

  const handleAddNew = React.useCallback(() => {
    const newInit: Initiative = {
      id: `new_${Date.now()}`,
      companyId: currentCompany?.id || '',
      departmentId: currentDepartment?.id || '',
      title: '',
      type: '3- Fast Track',
      benefit: '',
      scope: '',
      customerOwner: '',
      originDirectorate: '',
      leaderId: '',
      impactedSystemIds: [],
      milestones: [],
      createdAt: new Date().toISOString(),
      status: '1- Backlog',
      history: []
    };
    setSelectedInitiative(newInit);
    setAddingCardToColumn(null);
    setNewCardTitle('');
  }, [currentCompany, currentDepartment]);

  useEffect(() => {
    registerAddAction(handleAddNew);
    return () => registerAddAction(() => null);
  }, [registerAddAction, handleAddNew]);

  const [selectedYear, setSelectedYear] = useState('2026');
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleSaveInline = async (columnId: string) => {
    if (!newCardTitle.trim()) {
      setAddingCardToColumn(null);
      return;
    }

    const payload: any = {
      title: newCardTitle.trim(),
      companyId: currentCompany?.id || '',
      departmentId: currentDepartment?.id || '',
      status: viewMode === 'status' ? columnId : '1- Backlog',
      type: '1- Estratégico',
      benefit: '',
      scope: '',
      customerOwner: '',
      originDirectorate: viewMode === 'directorate' ? columnId : '',
      leaderId: viewMode === 'manager' ? columnId : '',
      createdAt: new Date().toISOString(),
      impactedSystemIds: viewMode === 'system' ? [columnId] : [],
      milestones: [],
      history: []
    };

    if (viewMode === 'type') payload.type = columnId;

    try {
      const res = await fetch('/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setInitiatives(prev => [data, ...prev]);
        setNewCardTitle('');
        // We keep addingCardToColumn to allow adding multiple cards in a row like Trello
      }
    } catch (err) {
      console.error('Failed to save inline initiative:', err);
    }
  };
  
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [priorityMenu, setPriorityMenu] = useState<{ initiativeId: string; position: { top: number; left: number } } | null>(null);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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
    if (viewMode !== 'status' && (it.status === '5- Concluído' || it.status === 'Cancelado')) return false;

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

  const sortedInitiatives = React.useMemo(() => {
    if (!sortConfig) return filteredInitiatives;

    return [...filteredInitiatives].sort((a, b) => {
      const { key, direction } = sortConfig;

      let valA: any = a[key as keyof Initiative];
      let valB: any = b[key as keyof Initiative];

      // Custom value extractors
      if (key === 'manager') {
        valA = collaborators.find(c => c.id === a.leaderId)?.name || '';
        valB = collaborators.find(c => c.id === b.leaderId)?.name || '';
      } else if (key === 'aging') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        valA = dateA;
        valB = dateB;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInitiatives, sortConfig, collaborators]);

  const handlePriorityUpdate = async (id: string, priority: number) => {
    try {
      const resp = await fetch(`/api/initiatives/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });
      if (resp.ok) {
        const updated = await resp.json();
        setInitiatives(prev => prev.map(it => it.id === id ? updated : it));
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

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
          case '1- Backlog': return <Clock size={18} />;
          case '2- Discovery': return <Target size={18} />;
          case '3- Planejamento': return <Layers size={18} />;
          case '4- Execução': return <Activity size={18} />;
          case '5- Concluído': return <CheckCircle size={18} className="text-success" />;
          case 'Suspenso': return <AlertTriangle size={18} />;
          case 'Cancelado': return <XCircle size={18} className="text-error" />;
          default: return <Activity size={18} />;
        }
      };

      const statuses: string[] = [
        '1- Backlog', 
        '2- Discovery', 
        '3- Planejamento', 
        '4- Execução', 
        '5- Concluído', 
        'Suspenso', 
        'Cancelado'
      ];

      return statuses.map(s => {
        return {
          id: s,
          title: s.includes('- ') ? s.split('- ')[1] : s,
          icon: getStatusIconValue(s),
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

  const renderTableView = () => {
    return (
      <div className="glass-panel" style={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        background: 'white',
        borderRadius: '12px',
        border: '1px solid var(--glass-border-strong)',
        margin: '0 0 1rem 0'
      }}>
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('title')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Iniciativa
                  {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('manager')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Gestor
                  {sortConfig?.key === 'manager' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer', userSelect: 'none', width: '100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  PRIO
                  {sortConfig?.key === 'priority' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('type')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Tipo
                  {sortConfig?.key === 'type' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Status
                  {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('aging')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Aging
                  {sortConfig?.key === 'aging' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedInitiatives.map(it => {
              const manager = collaborators.find(c => c.id === it.leaderId);
              const createdAtDate = it.createdAt ? new Date(it.createdAt) : null;
              const aging = createdAtDate 
                ? Math.floor((new Date().getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
                : -1;

              return (
                <tr key={it.id} onClick={() => setSelectedInitiative(it)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700 }}>{fixEncoding(it.title, true) || 'Sem título'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {manager?.photoUrl && (
                        <img src={manager.photoUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                      )}
                      <span>{manager?.name || 'Não atribuído'}</span>
                    </div>
                  </td>
                  <td onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPriorityMenu({
                      initiativeId: it.id,
                      position: { top: rect.top + rect.height, left: rect.left }
                    });
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', background: '#F8FAFC', width: 'fit-content' }}>
                      <PriorityIcon value={it.priority} />
                    </div>
                  </td>
                  <td>
                    <span 
                      className="badge" 
                      style={{ 
                        backgroundColor: `${TYPE_COLORS[(it as any).initiativeType] || TYPE_COLORS[it.type] || '#CBD5E1'}20`, 
                        color: TYPE_COLORS[(it as any).initiativeType] || TYPE_COLORS[it.type] || '#475569',
                        border: `1px solid ${TYPE_COLORS[(it as any).initiativeType] || TYPE_COLORS[it.type] || '#CBD5E1'}40`,
                        fontSize: '0.7rem'
                      }}
                    >
                      {it.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.8rem' }}>
                      {it.status}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ opacity: 0.5 }} />
                      <span style={{ fontWeight: 700, color: aging > 30 ? 'var(--status-red)' : aging > 15 ? 'var(--status-amber)' : 'var(--text-secondary)' }}>
                        {aging >= 0 ? `${aging} dias` : 'N/A'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredInitiatives.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                   Nenhuma iniciativa encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      padding: '0 0.25rem 0 0', 
      overflow: 'hidden' 
    }}>
      {viewMode === 'timeline' && (
        <div style={{ 
          padding: '0.25rem 2rem 0.75rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          borderBottom: '1px solid var(--glass-border)',
          marginBottom: '0.5rem',
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(8px)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={14} className="text-tertiary" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Ano de Referência:</span>
          </div>
          <select 
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="form-select-premium"
            style={{ 
              padding: '0.25rem 0.75rem', 
              borderRadius: '8px', 
              border: '1px solid var(--glass-border-strong)',
              background: 'white',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      )}
      {viewMode === 'table' ? renderTableView() : (
        <div className="kanban-board" style={{ 
          flexGrow: 1, 
          display: 'flex', 
          gap: '0.8rem', 
          overflowX: 'auto', 
          padding: '0 0 2rem 0', 
          alignItems: 'flex-start',
          background: 'transparent',
          margin: '0'
        }}>
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

                {/* Conditional Add Button / Inline Form */}
                {(() => {
                  if (viewMode === 'timeline') return null;
                  
                  if (addingCardToColumn === column.id) {
                    return (
                      <div style={{ padding: '0 0.4rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div className="card-input-trello" style={{ 
                          background: 'white', 
                          borderRadius: '8px', 
                          padding: '0.6rem 0.75rem', 
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
                        }}>
                          <textarea
                            autoFocus
                            placeholder="Insira o nome da nova iniciativa...."
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSaveInline(column.id);
                              }
                              if (e.key === 'Escape') {
                                setAddingCardToColumn(null);
                                setNewCardTitle('');
                              }
                            }}
                            style={{
                              width: '100%',
                              border: 'none',
                              outline: 'none',
                              resize: 'none',
                              fontSize: '0.85rem',
                              fontFamily: 'inherit',
                              minHeight: '40px',
                              padding: 0,
                              background: 'transparent'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleSaveInline(column.id)}
                            style={{
                              background: 'var(--accent-base)',
                              color: 'white',
                              border: 'none',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: 'var(--shadow-sm)'
                            }}
                          >
                            Adicionar Iniciativa
                          </button>
                          <button 
                            onClick={() => {
                              setAddingCardToColumn(null);
                              setNewCardTitle('');
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#172B4D',
                              padding: '0.4rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button 
                      className="add-card-btn-trello"
                      onClick={() => {
                        setAddingCardToColumn(column.id);
                        setNewCardTitle('');
                      }}
                    >
                      <Plus size={14} />
                      <span>Adicionar uma Iniciativa</span>
                    </button>
                  );
                })()}
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
      )}

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
          min-width: 280px;
          max-width: 280px;
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
        }
      `}</style>

      {priorityMenu && (
        <PriorityPicker
          value={initiatives.find(it => it.id === priorityMenu.initiativeId)?.priority || 0}
          position={priorityMenu.position}
          onSelect={(val) => handlePriorityUpdate(priorityMenu.initiativeId, val)}
          onClose={() => setPriorityMenu(null)}
        />
      )}
    </div>
  );
};

// Also need to import Plus from lucide-react if not already

export default Initiatives;
