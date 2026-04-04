import React, { useState, useEffect } from 'react';
import { 
  Layers,
  Users,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Database,
  Diamond,
  Briefcase,
  Zap
} from 'lucide-react';
import { PriorityIcon, PriorityPicker } from '../components/common/PriorityPicker';
import type { Initiative, InitiativeType, Collaborator, System } from '../types';
import { StatusIcon } from '../components/common/StatusIcon';
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
  '1- Em Avaliação': '2- Discovery',
  '1- Avaliação': '2- Discovery',
  '2- Em Backlog': '1- Backlog',
  '2- Backlog': '1- Backlog',
  '3- Em Planejamento': '3- Planejamento',
  '3- Discovery': '2- Discovery',
  '4- Em Execução': '4- Execução',
  '4- Planejamento': '3- Planejamento',
  '5- Entregue': '6- Concluído',
  '5- Execução': '4- Execução',
  '5- Concluído': '6- Concluído',
  '6- Concluído': '6- Concluído'
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

const getTypeIcon = (type: string, size: number = 16) => {
  const color = TYPE_COLORS[type] || '#475569';
  const t = type.toLowerCase();
  
  if (t.includes('estrat') || t.includes('1-')) return <Diamond size={size} color={color} fill={`${color}20`} />;
  if (t.includes('proje') || t.includes('2-')) return <Briefcase size={size} color={color} fill={`${color}20`} />;
  if (t.includes('fast') || t.includes('3-')) return <Zap size={size} color={color} fill={`${color}20`} />;
  
  return <Layers size={size} color={color} />;
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
      registerDeleteAction(() => null);
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
      history: [],
      createdAt: new Date().toISOString(),
      status: '1- Backlog',
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
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [tableFilters, setTableFilters] = useState<Record<string, string[]>>({});
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
      fetch(`/api/systems${query}`).then(res => res.json())
    ])
    .then(([initData, collabsData, systemsData]) => {
      const normalizedInitData = (Array.isArray(initData) ? initData : []).map(it => ({
        ...it,
        status: oldToNewMap[it.status] || it.status
      }));
      setInitiatives(normalizedInitData);
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
    if (viewMode !== 'status' && viewMode !== 'timeline' && viewMode !== 'table') {
      if (it.status === '6- Concluído' || it.status === 'Cancelado') return false;
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
        if (tableFilters.type?.length) {
          const initiativeType = (it as any).initiativeType || it.type;
          if (!tableFilters.type.includes(initiativeType)) return false;
        }
        if (tableFilters.status?.length) {
          const normalizedStatus = oldToNewMap[it.status] || it.status;
          if (!tableFilters.status.includes(normalizedStatus)) return false;
        }
        if (tableFilters.manager?.length) {
          const managerName = collaborators.find(c => c.id === it.leaderId)?.name || 'Não atribuído';
          if (!tableFilters.manager.includes(managerName)) return false;
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
      } else if (key === 'cycleTime' || key === 'stageAging') {
        const parseLocalDate = (d?: string | null) => {
          if (!d) return null;
          const parts = d.split('-');
          if (parts.length !== 3) return new Date(d);
          return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        };

        const getAgingMetrics = (it: Initiative) => {
          const now = new Date();
          const startRef = parseLocalDate(it.startDate) || (it.createdAt ? new Date(it.createdAt) : null);
          const isDone = it.status === '6- Concluído';
          const endRef = (isDone && it.endDate) ? parseLocalDate(it.endDate) : now;

          const cycle = (startRef && endRef) 
            ? Math.floor((endRef.getTime() - startRef.getTime()) / (1000 * 60 * 60 * 24)) 
            : -1;

          if (key === 'cycleTime') return cycle;

          const phaseChanges = (it.history || []).filter(h => h.toStatus === it.status);
          const lastChange = phaseChanges.length > 0 ? phaseChanges[phaseChanges.length - 1] : null;
          const stageDateStr = lastChange?.timestamp;
          const stageDate = stageDateStr ? new Date(stageDateStr) : startRef;
          
          return stageDate ? Math.floor((now.getTime() - stageDate.getTime()) / (1000 * 60 * 60 * 24)) : cycle;
        };

        valA = getAgingMetrics(a);
        valB = getAgingMetrics(b);
      } else if (key === 'endDate') {
        valA = a.endDate ? new Date(a.endDate).getTime() : 0;
        valB = b.endDate ? new Date(b.endDate).getTime() : 0;
      } else if (key === 'initiativeType' || key === 'type') {
        valA = (a as any).initiativeType || a.type || '';
        valB = (b as any).initiativeType || b.type || '';
      } else if (key === 'leaderId') {
        const nameA = collaborators.find(c => c.id === a.leaderId)?.name || '';
        const nameB = collaborators.find(c => c.id === b.leaderId)?.name || '';
        valA = nameA;
        valB = nameB;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInitiatives, sortConfig, collaborators, tableFilters]);

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
        icon: getTypeIcon(t, 18),
        initiatives: sorted.filter(it => it.type === t)
      }));
    }

    if (viewMode === 'status') {
      const statuses: string[] = [
        '1- Backlog', 
        '2- Discovery', 
        '3- Planejamento', 
        '4- Execução', 
        '5- Implantação',
        '6- Concluído', 
        'Suspenso', 
        'Cancelado'
      ];

      return statuses.map(s => {
        let initiatives = sorted.filter(it => it.status === s);
        
        // Custom sorting for specific status columns
        if (['4- Execução', '5- Implantação', '6- Concluído'].includes(s)) {
          initiatives = [...initiatives].sort((a, b) => {
            const dateA = a.actualEndDate || a.endDate;
            const dateB = b.actualEndDate || b.endDate;
            
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            return dateA.localeCompare(dateB);
          });
        }

        return {
          id: s,
          title: s.includes('- ') ? s.split('- ')[1] : s,
          icon: <StatusIcon status={s} size={18} />,
          initiatives
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
        const monthIndex = index + 1;
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
    const normalized = oldToNewMap[status] || status;
    return <StatusIcon status={normalized} size={14} />;
  }, []);

  const formatDateShort = (d?: string) => {
    if (!d) return '-';
    const parts = d.split('-');
    if (parts.length === 3) {
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const monthIndex = parseInt(parts[1]) - 1;
      const monthName = months[monthIndex] || parts[1];
      return `${parts[2]}/${monthName}`;
    }
    return d;
  };

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
          
          {['4- Execução', '5- Implantação', '6- Concluído'].includes(it.status) && (it.actualEndDate || it.endDate) && (
            <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 400, marginTop: '0.1rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <span style={{ fontWeight: 700 }}>📅 {it.actualEndDate ? formatDateShort(it.actualEndDate) : formatDateShort(it.endDate)}</span>
              </div>
              {it.actualEndDate && it.endDate && new Date(it.actualEndDate) > new Date(it.endDate) && (
                <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.65rem', marginLeft: '1.1rem' }}>
                  {formatDateShort(it.endDate)}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem', height: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {it.businessExpectationDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Calendar size={11} color="#64748B" />
                <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>
                  {formatDateShort(it.businessExpectationDate)}
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
    const toggleSelectAll = () => {
      if (selectedIds.size === filteredInitiatives.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(filteredInitiatives.map(it => it.id)));
      }
    };

    return (
      <div className="glass-panel" style={{ 
        flex: 1, 
        overflow: 'auto', 
        background: 'white',
        borderRadius: '12px',
        border: '1px solid var(--glass-border-strong)',
        margin: '0',
        boxShadow: 'var(--shadow-md)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB', fontWeight: 800 }}>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9FAFB', textAlign: 'center', width: '40px', padding: '0.75rem 0.5rem' }}>
                <input 
                  type="checkbox" 
                  checked={filteredInitiatives.length > 0 && selectedIds.size === filteredInitiatives.length} 
                  onChange={toggleSelectAll} 
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th onClick={() => handleSort('title')} style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9FAFB', cursor: 'pointer', userSelect: 'none', verticalAlign: 'top', textAlign: 'left', padding: '0.75rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  INICIATIVA
                  {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9FAFB', userSelect: 'none', verticalAlign: 'top', textAlign: 'center', width: '80px', padding: '0.75rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <div 
                    onClick={() => handleSort('leaderId')} 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    LEAD
                    {sortConfig?.key === 'leaderId' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                  <div 
                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'manager' ? null : 'manager')}
                    style={{ cursor: 'pointer', opacity: tableFilters.manager?.length ? 1 : 0.5 }}
                  >
                    <Layers size={12} />
                  </div>
                </div>
                {activeFilterMenu === 'manager' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '0.5rem', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <div 
                        onClick={() => { setTableFilters(prev => ({...prev, manager: []})); setActiveFilterMenu(null); }}
                        style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: !tableFilters.manager?.length ? '#F3F4F6' : 'transparent', fontSize: '0.75rem', color: '#111827', fontWeight: !tableFilters.manager?.length ? 600 : 400 }}
                     >
                        Todos
                     </div>
                     {Array.from(new Set(filteredInitiatives.map(it => collaborators.find(c => c.id === it.leaderId)?.name || 'Não atribuído'))).sort().map(m => {
                        const isSelected = tableFilters.manager?.includes(m);
                        return (
                          <div 
                            key={m}
                            onClick={() => { 
                              setTableFilters(prev => {
                                const current = prev.manager || [];
                                if (current.includes(m)) {
                                  return { ...prev, manager: current.filter(x => x !== m) };
                                }
                                return { ...prev, manager: [...current, m] };
                              });
                            }}
                            style={{ 
                              padding: '0.4rem', 
                              cursor: 'pointer', 
                              borderRadius: '4px', 
                              background: isSelected ? '#EFF6FF' : 'transparent', 
                              color: isSelected ? '#2563EB' : '#4B5563', 
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: isSelected ? 600 : 400
                            }}
                          >
                            <div style={{ width: '12px', height: '12px', border: '1px solid currentColor', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '1px' }} />}
                            </div>
                            {m}
                          </div>
                        );
                     })}
                  </div>
                )}
              </th>
              <th onClick={() => handleSort('priority')} style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9FAFB', cursor: 'pointer', userSelect: 'none', verticalAlign: 'top', textAlign: 'center', width: '60px', padding: '0.75rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                  PRIO
                  {sortConfig?.key === 'priority' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9FAFB', userSelect: 'none', verticalAlign: 'top', textAlign: 'center', width: '60px', padding: '0.75rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <div 
                    onClick={() => handleSort('type')} 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    TIPO
                    {sortConfig?.key === 'type' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                  <div 
                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'type' ? null : 'type')}
                    style={{ cursor: 'pointer', opacity: tableFilters.type?.length ? 1 : 0.5 }}
                  >
                    <Layers size={12} />
                  </div>
                </div>
                {activeFilterMenu === 'type' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '0.5rem', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <div 
                        onClick={() => { setTableFilters(prev => ({...prev, type: []})); setActiveFilterMenu(null); }}
                        style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: !tableFilters.type?.length ? '#F3F4F6' : 'transparent', fontSize: '0.75rem', color: '#111827', fontWeight: !tableFilters.type?.length ? 600 : 400 }}
                     >
                        Todos
                     </div>
                     {Array.from(new Set(initiatives.map(it => (it as any).initiativeType || it.type))).filter(Boolean).sort().map(t => {
                        const isSelected = tableFilters.type?.includes(t);
                        return (
                          <div 
                            key={t}
                            onClick={() => { 
                              setTableFilters(prev => {
                                const current = prev.type || [];
                                if (current.includes(t)) {
                                  return { ...prev, type: current.filter(x => x !== t) };
                                }
                                return { ...prev, type: [...current, t] };
                              });
                            }}
                            style={{ 
                              padding: '0.4rem', 
                              cursor: 'pointer', 
                              borderRadius: '4px', 
                              background: isSelected ? '#EFF6FF' : 'transparent', 
                              color: isSelected ? '#2563EB' : '#4B5563', 
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: isSelected ? 600 : 400
                            }}
                          >
                            <div style={{ width: '12px', height: '12px', border: '1px solid currentColor', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '1px' }} />}
                            </div>
                            {t}
                          </div>
                        );
                     })}
                  </div>
                )}
              </th>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9FAFB', userSelect: 'none', verticalAlign: 'top', textAlign: 'center', width: '75px', padding: '0.75rem 0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <div 
                    onClick={() => handleSort('status')} 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    STATUS
                    {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                  <div 
                    onClick={() => setActiveFilterMenu(activeFilterMenu === 'status' ? null : 'status')}
                    style={{ cursor: 'pointer', opacity: tableFilters.status?.length ? 1 : 0.5 }}
                  >
                    <Layers size={12} />
                  </div>
                </div>
                {activeFilterMenu === 'status' && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '0.5rem', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <div 
                        onClick={() => { setTableFilters(prev => ({...prev, status: []})); setActiveFilterMenu(null); }}
                        style={{ padding: '0.4rem', cursor: 'pointer', borderRadius: '4px', background: !tableFilters.status?.length ? '#F3F4F6' : 'transparent', fontSize: '0.75rem', color: '#111827', fontWeight: !tableFilters.status?.length ? 600 : 400 }}
                     >
                        Todos
                     </div>
                     {Array.from(new Set(initiatives.map(it => it.status))).filter(Boolean).sort().map(s => {
                        const isSelected = tableFilters.status?.includes(s);
                        return (
                          <div 
                            key={s}
                            onClick={() => { 
                              setTableFilters(prev => {
                                const current = prev.status || [];
                                if (current.includes(s)) {
                                  return { ...prev, status: current.filter(x => x !== s) };
                                }
                                return { ...prev, status: [...current, s] };
                              });
                            }}
                            style={{ 
                              padding: '0.4rem', 
                              cursor: 'pointer', 
                              borderRadius: '4px', 
                              background: isSelected ? '#EFF6FF' : 'transparent', 
                              color: isSelected ? '#2563EB' : '#4B5563', 
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: isSelected ? 600 : 400
                            }}
                          >
                            <div style={{ width: '12px', height: '12px', border: '1px solid currentColor', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '1px' }} />}
                            </div>
                            {s}
                          </div>
                        );
                     })}
                  </div>
                )}
              </th>
              <th onClick={() => handleSort('cycleTime')} style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9FAFB', cursor: 'pointer', userSelect: 'none', verticalAlign: 'top', width: '58px', textAlign: 'right', padding: '0.75rem 0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                  CYCLE
                  {sortConfig?.key === 'cycleTime' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
              <th onClick={() => handleSort('endDate')} style={{ position: 'sticky', top: 0, zIndex: 10, background: '#F9FAFB', cursor: 'pointer', userSelect: 'none', verticalAlign: 'top', width: '110px', textAlign: 'right', padding: '0.75rem 1.5rem 0.75rem 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                  TARGET
                  {sortConfig?.key === 'endDate' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedInitiatives.map(it => {
              const manager = collaborators.find(c => c.id === it.leaderId);
              const parseLocalDate = (d?: string | null) => {
                if (!d) return null;
                const parts = d.split('-');
                if (parts.length !== 3) return new Date(d);
                return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
              };

              const now = new Date();
              const startReference = parseLocalDate(it.startDate) || (it.createdAt ? new Date(it.createdAt) : null);
              const isConcluded = it.status === '6- Concluído';
              const endReference = (isConcluded && it.endDate) ? parseLocalDate(it.endDate) : now;

              const cycleTime = (startReference && endReference)
                ? Math.floor((endReference.getTime() - startReference.getTime()) / (1000 * 60 * 60 * 24))
                : -1;

              return (
                <tr key={it.id} onClick={() => setSelectedInitiative(it)} style={{ cursor: 'pointer', borderBottom: '1px solid #F3F4F6', background: selectedIds.has(it.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', width: '40px', padding: '0.75rem 0.5rem' }}>
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
                  <td style={{ fontWeight: 800, padding: '0.75rem 0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{fixEncoding(it.title, true) || 'Sem título'}</td>
                  <td style={{ textAlign: 'center', width: '80px', padding: '0.75rem 0.5rem' }}>
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
                  }} style={{ textAlign: 'center', width: '60px', padding: '0.75rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '4px', background: '#F8FAFC', width: '100%' }}>
                      <PriorityIcon value={it.priority} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', width: '60px', padding: '0.75rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={it.type}>
                      {getTypeIcon((it as any).initiativeType || it.type || '')}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', width: '75px', padding: '0.75rem 0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={it.status}>
                      {getPhaseIcon(it.status)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', width: '58px', padding: '0.75rem 0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.75rem', color: cycleTime > 30 ? 'var(--status-red)' : cycleTime > 15 ? 'var(--status-amber)' : 'var(--text-secondary)' }}>
                        {cycleTime >= 0 ? `${cycleTime} d` : '-'}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', width: '110px', padding: '0.75rem 1.5rem 0.75rem 0.5rem' }}>
                    {['4- Execução', '5- Implantação', '6- Concluído'].includes(it.status) && (it.actualEndDate || it.endDate) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', color: it.actualEndDate ? 'var(--status-red)' : 'var(--text-secondary)' }}>
                          {it.actualEndDate ? formatDateShort(it.actualEndDate) : formatDateShort(it.endDate)}
                        </span>
                        {it.actualEndDate && it.endDate && new Date(it.actualEndDate) > new Date(it.endDate) && (
                          <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.65rem', marginTop: '-2px' }}>
                            {formatDateShort(it.endDate)}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {sortedInitiatives.length === 0 && (
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
      flex: 1,
      display: 'flex', 
      flexDirection: 'column', 
      padding: '0', 
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
          flex: 1, 
          display: 'flex', 
          gap: '0.8rem', 
          overflowX: 'auto', 
          padding: '0 0 0.5rem 0', 
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
          allSystems={systems}
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
          alignItems: center;
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

export default Initiatives;
