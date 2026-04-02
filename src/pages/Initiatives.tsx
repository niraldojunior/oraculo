import React, { useState, useEffect } from 'react';
import { 
  Layers,
  Users,
  Clock,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Plus,
  Target,
  ChevronUp,
  X,
  ArrowUpDown,
  Trash2
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
  const { activeView, searchTerm: globalSearch, registerAddAction, setSelectedCount, registerDeleteAction } = useView();
  const [viewMode, setViewMode] = useState<'manager' | 'directorate' | 'type' | 'status' | 'system' | 'timeline' | 'table'>('manager');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setSelectedCount(selectedIds.size);
    registerDeleteAction(() => setShowDeleteConfirm(true));

    return () => {
      setSelectedCount(0);
      registerDeleteAction(null);
    };
  }, [selectedIds, registerDeleteAction, setSelectedCount]);

  const handleDeleteConfirmed = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => fetch(`/api/initiatives/${id}`, { method: 'DELETE' }))
      );
      setInitiatives(prev => prev.filter(it => !selectedIds.has(it.id)));
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Failed to delete initiatives', err);
      alert('Ocorreu um erro ao excluir as iniciativas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
  const [tableFilters, setTableFilters] = useState<Record<string, string>>({});
  const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
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
    if (viewMode !== 'status' && viewMode !== 'timeline' && viewMode !== 'table') {
      if (it.status === '5- Concluído' || it.status === 'Cancelado') return false;
    } else if (viewMode === 'timeline') {
      if (it.status === 'Cancelado') return false;
    }

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
    let list = filteredInitiatives;
    if (viewMode === 'table') {
      list = list.filter(it => {
        if (tableFilters.type && it.type !== tableFilters.type && (it as any).initiativeType !== tableFilters.type) return false;
        if (tableFilters.status && it.status !== tableFilters.status) return false;
        if (tableFilters.manager) {
          const managerName = collaborators.find(c => c.id === it.leaderId)?.name || 'Não atribuído';
          if (managerName !== tableFilters.manager) return false;
        }
        return true;
      });
    }

    if (!sortConfig) return list;

    return [...list].sort((a, b) => {
      const { key, direction } = sortConfig;

      let valA: any = a[key as keyof Initiative];
      let valB: any = b[key as keyof Initiative];

      // Custom value extractors
      if (key === 'manager') {
        valA = collaborators.find(c => c.id === a.leaderId)?.name || '';
        valB = collaborators.find(c => c.id === b.leaderId)?.name || '';
      } else if (key === 'cycleTime') {
        valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (key === 'stageAging') {
        const getStageDate = (it: Initiative) => {
          const h = (it.history || []).filter(x => x.toStatus === it.status);
          const last = h.length > 0 ? h[h.length - 1] : ((it.history || []).length > 0 ? it.history[0] : null);
          return last ? new Date(last.timestamp).getTime() : (it.createdAt ? new Date(it.createdAt).getTime() : 0);
        };
        valA = getStageDate(a);
        valB = getStageDate(b);
      } else if (key === 'endDate') {
        valA = a.endDate ? new Date(a.endDate).getTime() : 0;
        valB = b.endDate ? new Date(b.endDate).getTime() : 0;
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
      const relevantManagers = Array.from(new Set(filteredInitiatives.map(it => it.leaderId).filter(Boolean)));
      const baseManagers = collaborators.filter(c => 
        ['Manager', 'Head'].includes(c.role) || relevantManagers.includes(c.id)
      );
      
      return baseManagers.map(m => ({
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
            const tempDate = it.endDate || it.businessExpectationDate;
            if (!it || !tempDate) return false;
            const parts = tempDate.split('-');
            if (parts.length < 2) return false;
            const [y, m] = parts;
            return y === selectedYear && m === monthStr;
          })
        };
      });
    }

    return [];
  };

  const getPhaseIcon = React.useCallback((status: string) => {
    const normalizedStatus = oldToNewMap[status] || status;
    switch (normalizedStatus) {
      case '1- Backlog': return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />;
      case '2- Discovery': return <Target size={14} style={{ color: 'var(--text-tertiary)' }} />;
      case '3- Planejamento': return <Layers size={14} style={{ color: 'var(--text-tertiary)' }} />;
      case '4- Execução': return <Activity size={14} style={{ color: 'var(--text-tertiary)' }} />;
      case '5- Concluído': return <CheckCircle size={14} style={{ color: 'var(--status-green)' }} />;
      case 'Suspenso': return <AlertTriangle size={14} style={{ color: 'var(--status-amber)' }} />;
      case 'Cancelado': return <XCircle size={14} style={{ color: 'var(--status-red)' }} />;
      default: return <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />;
    }
  }, []);

  const renderInitiativeCard = (it: Initiative) => {
    if (!it) return null;
    const manager = collaborators.find(c => c.id === it.leaderId);

    return (
      <div 
        key={it.id} 
        className="initiative-kanban-card"
        onClick={() => setSelectedInitiative(it)}
        style={{ 
          padding: '0.35rem 0.45rem', 
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid var(--glass-border-strong)',
          borderLeft: `5px solid ${TYPE_COLORS[(it as any).initiativeType] || TYPE_COLORS[it.type] || 'var(--glass-border-strong)'}`,
          marginBottom: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '53px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: '1.2', color: 'var(--text-primary)' }}>
            {fixEncoding(it.title, true) || 'Sem título'}
          </div>
          
          {it.endDate && (
            <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 400, marginTop: '0.1rem' }}>
              📅 Término: {it.endDate}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem', height: '22px' }}>
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
              <th style={{ width: '40px', padding: '0.5rem', textAlign: 'center', verticalAlign: 'top' }}>
                <input 
                  type="checkbox" 
                  checked={sortedInitiatives.length > 0 && selectedIds.size === sortedInitiatives.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(sortedInitiatives.map(it => it.id)));
                    else setSelectedIds(new Set());
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ userSelect: 'none', verticalAlign: 'top' }}>
                <div onClick={() => handleSort('title')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Iniciativa
                  {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th style={{ userSelect: 'none', verticalAlign: 'top', position: 'relative', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div 
                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'manager' ? null : 'manager')} 
                    style={{ cursor: 'pointer', fontWeight: 600, color: tableFilters.manager ? 'var(--brand-primary)' : 'inherit' }}
                  >
                    Gestor {tableFilters.manager && '*'}
                  </div>
                  <div onClick={() => handleSort('manager')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {(sortConfig?.key === 'manager' && sortConfig.direction === 'asc') ? <ChevronUp size={14} /> : (sortConfig?.key === 'manager' && sortConfig.direction === 'desc') ? <ChevronDown size={14} /> : <span style={{ opacity: 0.3 }}><ArrowUpDown size={14} /></span>}
                  </div>
                </div>
                {activeFilterMenu === 'manager' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '0.5rem', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <div 
                        onClick={() => { setTableFilters(prev => ({...prev, manager: ''})); setActiveFilterMenu(null); }}
                        style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: !tableFilters.manager ? '#F3F4F6' : 'transparent', fontSize: '0.75rem', color: '#111827' }}
                     >
                        Todos
                     </div>
                     {Array.from(new Set(filteredInitiatives.map(it => collaborators.find(c => c.id === it.leaderId)?.name || 'Não atribuído'))).sort().map(m => (
                        <div 
                          key={m}
                          onClick={() => { setTableFilters(prev => ({...prev, manager: m === 'Não atribuído' ? '' : m})); setActiveFilterMenu(null); }}
                          style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: tableFilters.manager === m ? '#EFF6FF' : 'transparent', color: tableFilters.manager === m ? '#2563EB' : '#4B5563', fontSize: '0.75rem' }}
                        >
                          {m}
                        </div>
                     ))}
                  </div>
                )}
              </th>
              <th onClick={() => handleSort('priority')} style={{ cursor: 'pointer', userSelect: 'none', width: '100px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  PRIO
                  {sortConfig?.key === 'priority' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th style={{ userSelect: 'none', verticalAlign: 'top', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div 
                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'type' ? null : 'type')} 
                    style={{ cursor: 'pointer', fontWeight: 600, color: tableFilters.type ? 'var(--brand-primary)' : 'inherit' }}
                  >
                    Tipo {tableFilters.type && '*'}
                  </div>
                  <div onClick={() => handleSort('type')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {(sortConfig?.key === 'type' && sortConfig.direction === 'asc') ? <ChevronUp size={14} /> : (sortConfig?.key === 'type' && sortConfig.direction === 'desc') ? <ChevronDown size={14} /> : <span style={{ opacity: 0.3 }}><ArrowUpDown size={14} /></span>}
                  </div>
                </div>
                {activeFilterMenu === 'type' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '0.5rem', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <div 
                        onClick={() => { setTableFilters(prev => ({...prev, type: ''})); setActiveFilterMenu(null); }}
                        style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: !tableFilters.type ? '#F3F4F6' : 'transparent', fontSize: '0.75rem', color: '#111827' }}
                     >
                        Todos
                     </div>
                     {Array.from(new Set(filteredInitiatives.map(it => (it as any).initiativeType || it.type))).filter(Boolean).sort().map(t => (
                        <div 
                          key={t}
                          onClick={() => { setTableFilters(prev => ({...prev, type: t})); setActiveFilterMenu(null); }}
                          style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: tableFilters.type === t ? '#EFF6FF' : 'transparent', color: tableFilters.type === t ? '#2563EB' : '#4B5563', fontSize: '0.75rem' }}
                        >
                          {t}
                        </div>
                     ))}
                  </div>
                )}
              </th>
              <th style={{ userSelect: 'none', verticalAlign: 'top', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div 
                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'status' ? null : 'status')} 
                    style={{ cursor: 'pointer', fontWeight: 600, color: tableFilters.status ? 'var(--brand-primary)' : 'inherit' }}
                  >
                    Status {tableFilters.status && '*'}
                  </div>
                  <div onClick={() => handleSort('status')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {(sortConfig?.key === 'status' && sortConfig.direction === 'asc') ? <ChevronUp size={14} /> : (sortConfig?.key === 'status' && sortConfig.direction === 'desc') ? <ChevronDown size={14} /> : <span style={{ opacity: 0.3 }}><ArrowUpDown size={14} /></span>}
                  </div>
                </div>
                {activeFilterMenu === 'status' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '0.5rem', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <div 
                        onClick={() => { setTableFilters(prev => ({...prev, status: ''})); setActiveFilterMenu(null); }}
                        style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: !tableFilters.status ? '#F3F4F6' : 'transparent', fontSize: '0.75rem', color: '#111827' }}
                     >
                        Todos
                     </div>
                     {Array.from(new Set(filteredInitiatives.map(it => it.status))).filter(Boolean).sort().map(s => (
                        <div 
                          key={s}
                          onClick={() => { setTableFilters(prev => ({...prev, status: s})); setActiveFilterMenu(null); }}
                          style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: tableFilters.status === s ? '#EFF6FF' : 'transparent', color: tableFilters.status === s ? '#2563EB' : '#4B5563', fontSize: '0.75rem' }}
                        >
                          {s}
                        </div>
                     ))}
                  </div>
                )}
              </th>
              <th onClick={() => handleSort('stageAging')} style={{ cursor: 'pointer', userSelect: 'none', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Aging Etapa
                  {sortConfig?.key === 'stageAging' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('cycleTime')} style={{ cursor: 'pointer', userSelect: 'none', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Cycle Time
                  {sortConfig?.key === 'cycleTime' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              <th onClick={() => handleSort('endDate')} style={{ cursor: 'pointer', userSelect: 'none', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Data Fim
                  {sortConfig?.key === 'endDate' && (sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedInitiatives.map(it => {
              const manager = collaborators.find(c => c.id === it.leaderId);
              const createdAtDate = it.createdAt ? new Date(it.createdAt) : null;
              const cycleTime = createdAtDate 
                ? Math.floor((new Date().getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24))
                : -1;

              const phaseChanges = (it.history || []).filter(h => h.toStatus === it.status);
              const lastPhaseChange = phaseChanges.length > 0 
                 ? phaseChanges[phaseChanges.length - 1] 
                 : ((it.history || []).length > 0 ? it.history[0] : null);
              
              const stageDateStr = lastPhaseChange?.timestamp || it.createdAt;
              const stageDate = stageDateStr ? new Date(stageDateStr) : null;
              const stageAging = stageDate
                ? Math.floor((new Date().getTime() - stageDate.getTime()) / (1000 * 60 * 60 * 24))
                : cycleTime;

              const formatEndDate = (d?: string) => {
                if (!d) return '-';
                const parts = d.split('-');
                if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                return d;
              };

              return (
                <tr key={it.id} onClick={() => setSelectedInitiative(it)} style={{ cursor: 'pointer', background: selectedIds.has(it.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(it.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(it.id);
                        else newSet.delete(it.id);
                        setSelectedIds(newSet);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ fontWeight: 700 }}>{fixEncoding(it.title, true) || 'Sem título'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }} title={manager?.name || 'Não atribuído'}>
                      {manager?.photoUrl ? (
                        <img src={manager.photoUrl} alt={manager.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 600 }}>
                          {(manager?.name || 'N').charAt(0).toUpperCase()}
                        </div>
                      )}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.8rem' }}>
                      {getPhaseIcon(it.status)}
                      {it.status}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ opacity: 0.5 }} />
                      <span style={{ fontWeight: 500, color: stageAging > 15 ? 'var(--status-amber)' : 'var(--text-secondary)' }}>
                        {stageAging >= 0 ? `${stageAging} d` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ opacity: 0.5 }} />
                      <span style={{ fontWeight: 500, color: cycleTime > 30 ? 'var(--status-red)' : cycleTime > 15 ? 'var(--status-amber)' : 'var(--text-secondary)' }}>
                        {cycleTime >= 0 ? `${cycleTime} d` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={14} style={{ opacity: 0.5 }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {formatEndDate(it.endDate)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredInitiatives.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
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

        @keyframes fadeInModal {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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

      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeInModal 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            border: '1px solid var(--glass-border-strong)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'var(--status-red)'
            }}>
              <Trash2 size={32} />
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Confirmar Exclusão
            </h3>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
              Você selecionou <strong>{selectedIds.size}</strong> iniciativa(s) para exclusão. 
              Esta ação é <strong>permanente</strong> e removerá todos os dados relacionados, incluindo marcos e histórico.
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirmed}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--status-red)',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Also need to import Plus from lucide-react if not already

export default Initiatives;
