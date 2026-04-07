import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
import { PriorityIcon, PriorityPicker } from '../components/common/PriorityPicker';
import type { Initiative, InitiativeType, Collaborator, System, MilestoneTask, InitiativeComment } from '../types';
import { StatusIcon } from '../components/common/StatusIcon';
import { useAuth } from '../context/AuthContext';
import { useView } from '../context/ViewContext';
import { InitiativeProperties, InitiativeMilestones, getTypeIcon, renderAvatar } from '../components/initiative/SidebarComponents';
import { CreateInitiativeModal } from '../components/initiative/CreateInitiativeModal';
import { Edit3 } from 'lucide-react';

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
    return result; // Don't force lowercase, respect original casing
  }
  return result;
};




// --- Timeline Helper ---
const parseDateSafe = (dateStr?: string | Date | null) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  // Extract YYYY-MM-DD from ISO or simple strings to avoid UTC offset issues
  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = datePart.split('-');
  
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // 0-indexed
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  return new Date(dateStr);
};

const getYearDays = (year: number) => {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  return isLeap ? 366 : 365;
};

const Initiatives: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompany, currentDepartment, user } = useAuth();
  const { activeView, searchTerm: globalSearch, registerAddAction, setSelectedCount, registerDeleteAction } = useView();
  const [viewMode, setViewMode] = useState<'manager' | 'directorate' | 'type' | 'status' | 'system' | 'timeline' | 'table' | 'newTimeline'>(
    () => (localStorage.getItem('initiative_view_mode') as any) || 'manager'
  );
  const [timeDimension, setTimeDimension] = useState<'Ano' | 'Trimestre' | 'Mês' | 'Semana'>(
    () => (localStorage.getItem('initiative_time_dimension') as any) || 'Ano'
  );
  const [timelineManager, setTimelineManager] = useState<string>(
    () => localStorage.getItem('initiative_filter_manager') || 'Todos'
  );
  const [timelineStatus, setTimelineStatus] = useState<string>(
    () => localStorage.getItem('initiative_filter_status') || 'Todos'
  );
  const [timelineType, setTimelineType] = useState<string>(
    () => localStorage.getItem('initiative_filter_type') || 'Todos'
  );
  const [selectedYear, setSelectedYear] = useState(
    () => localStorage.getItem('initiative_selected_year') || '2026'
  );
  const [tableFilters, setTableFilters] = useState<Record<string, string[]>>(
    () => JSON.parse(localStorage.getItem('initiative_table_filters') || '{}')
  );
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    () => JSON.parse(localStorage.getItem('initiative_sort_config') || 'null')
  );

  const [isTimelineMenuOpen, setIsTimelineMenuOpen] = useState(false);
  const [isManagerMenuOpen, setIsManagerMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const timelineMenuRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInitiativeId, setActiveInitiativeId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [sidebarOpenSections, setSidebarOpenSections] = useState({ 
    overview: true, 
    properties: false, 
    milestones: true,
    comments: true,
    history: false 
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showPriorityMenu, setShowPriorityMenu] = useState<{ top: number; left: number } | null>(null);
  const [activeMilestoneTaskViewId, setActiveMilestoneTaskViewId] = useState<string | null>(null);
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [editMilestoneText, setEditMilestoneText] = useState('');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const [activeFilterMenu, setActiveFilterMenu] = useState<string | null>(null);
  const [priorityMenu, setPriorityMenu] = useState<{ initiativeId: string; position: { top: number; left: number } } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [milestoneDeleteId, setMilestoneDeleteId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalColumnId, setCreateModalColumnId] = useState<string | null>(null);
  
  // Atualizar o título da aba do navegador
  useEffect(() => {
    document.title = 'Iniciativas | Oráculo';
    return () => {
      document.title = 'Oráculo';
    };
  }, []);

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
    if (['manager', 'directorate', 'type', 'status', 'system', 'timeline', 'table', 'newTimeline'].includes(activeView)) {
      if (activeView !== viewMode) {
        setViewMode(activeView as any);
        // Auto-set timeDimension to 'Ano' when entering timeline view (newTimeline)
        if (activeView === 'newTimeline') {
          setTimeDimension('Ano');
        }
      }
    }
  }, [activeView, viewMode]);

  // Efeito para persistência de estado (Modo de visualização e filtros)
  useEffect(() => {
    localStorage.setItem('initiative_view_mode', viewMode);
    localStorage.setItem('initiative_time_dimension', timeDimension);
    localStorage.setItem('initiative_filter_manager', timelineManager);
    localStorage.setItem('initiative_filter_status', timelineStatus);
    localStorage.setItem('initiative_filter_type', timelineType);
    localStorage.setItem('initiative_selected_year', selectedYear);
    localStorage.setItem('initiative_table_filters', JSON.stringify(tableFilters));
    localStorage.setItem('initiative_sort_config', JSON.stringify(sortConfig));
  }, [viewMode, timeDimension, timelineManager, timelineStatus, timelineType, selectedYear, tableFilters, sortConfig]);

  const handleCloseSidebar = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveInitiativeId(null);
      setIsClosing(false);
    }, 300); // Match animation duration
  }, []);

  const handleInitiativeClick = React.useCallback((id: string) => {
    if (activeInitiativeId === id) {
      handleCloseSidebar();
    } else {
      setActiveInitiativeId(id);
      setIsClosing(false);
      setEditingField(null);
      setActiveMilestoneTaskViewId(null);
    }
  }, [activeInitiativeId, handleCloseSidebar]);

  const handleInitiativeDoubleClick = React.useCallback((id: string) => {
    const initiative = initiatives.find(it => it.id === id);
    navigate(`/iniciativas/${id}/edit`, { 
      state: { 
        initiative,
        collaborators,
        systems
      } 
    });
  }, [navigate, initiatives, collaborators, systems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseSidebar]);

  const handleAddNew = React.useCallback(() => {
    setCreateModalColumnId(null);
    setIsCreateModalOpen(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isTimelineMenuClick = timelineMenuRef.current && timelineMenuRef.current.contains(event.target as Node);
      const isFiltersClick = filtersRef.current && filtersRef.current.contains(event.target as Node);
      
      if (!isTimelineMenuClick && !isFiltersClick) {
        setIsTimelineMenuOpen(false);
        setIsManagerMenuOpen(false);
        setIsStatusMenuOpen(false);
        setIsTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (viewMode === 'newTimeline' || viewMode === 'timeline') {
      const timer = setTimeout(() => {
        const today = new Date();
        const yr = today.getFullYear();
        let start: Date;
        const pxPerDay =
          timeDimension === 'Semana' ? 60 :
          timeDimension === 'Mês' ? 15 :
          timeDimension === 'Trimestre' ? 6.5 : 3;

        if (timeDimension === 'Ano') {
          start = new Date(yr - 2, 0, 1);
        } else if (timeDimension === 'Trimestre') {
          const currentQ = Math.floor(today.getMonth() / 3);
          const startQ = currentQ - 8;
          const startQYear = yr + Math.floor(startQ / 4);
          const startQMon = ((startQ % 4) + 4) % 4;
          start = new Date(startQYear, startQMon * 3, 1);
        } else if (timeDimension === 'Mês') {
          start = new Date(today);
          start.setDate(today.getDate() - (52 * 7) - today.getDay()); 
          start.setHours(0, 0, 0, 0);
        } else { // Semana
          start = new Date(today);
          start.setDate(today.getDate() - 100 * 7);
          start.setHours(0, 0, 0, 0);
        }

        const diffDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        const todayPx = diffDays * pxPerDay;

        if (timelineScrollRef.current) {
          const viewportWidth = timelineScrollRef.current.clientWidth;
          timelineScrollRef.current.scrollTo({
            left: Math.max(0, todayPx - viewportWidth / 2),
            behavior: 'auto'
          });
        }
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [timeDimension, viewMode, loading]);

  useEffect(() => {
    registerAddAction(handleAddNew);
    return () => registerAddAction(() => null);
  }, [registerAddAction, handleAddNew]);

  const handleCreateSave = async (data: Partial<Initiative>) => {
    const payload: any = {
      ...data,
      companyId: currentCompany?.id || '',
      departmentId: currentDepartment?.id || '',
      status: data.status || (viewMode === 'status' ? createModalColumnId : '1- Backlog'),
      type: data.type || '1- Estratégico',
      createdAt: new Date().toISOString(),
      scope: '',
      customerOwner: '',
      originDirectorate: '',
      milestones: [],
      history: []
    };

    if (viewMode === 'directorate' && createModalColumnId) payload.originDirectorate = createModalColumnId;
    if (viewMode === 'manager' && createModalColumnId) payload.leaderId = createModalColumnId;
    if (viewMode === 'system' && createModalColumnId) payload.impactedSystemIds = [createModalColumnId];
    if (viewMode === 'type' && createModalColumnId) payload.type = createModalColumnId;

    try {
      const res = await fetch('/api/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newData = await res.json();
        setInitiatives(prev => [newData, ...prev]);
        setIsCreateModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to create initiative:', err);
    }
  };
  
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
    if (viewMode !== 'status' && viewMode !== 'timeline' && viewMode !== 'table' && viewMode !== 'newTimeline') {
      if (it.status === '6- Concluído' || it.status === 'Cancelado') return false;
    } else if (viewMode === 'timeline' || viewMode === 'newTimeline') {
      if (it.status === 'Cancelado' || it.status === '1- Backlog') return false;
      
      // Apply Timeline Specific Filters
      if (timelineManager !== 'Todos' && it.leaderId !== timelineManager) return false;
      
      if (timelineStatus === 'Em Andamento') {
        if (it.status === '6- Concluído') return false;
      } else if (timelineStatus === 'Concluído') {
        if (it.status !== '6- Concluído') return false;
      }

      if (timelineType !== 'Todos') {
        if (it.type !== timelineType) return false;
      }
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

    if (!sortConfig) {
      return [...list].sort((a, b) => {
        const da = parseDateSafe(a.startDate)?.getTime() || 0;
        const db = parseDateSafe(b.startDate)?.getTime() || 0;
        return da - db;
      });
    }

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
  }, [filteredInitiatives, sortConfig, collaborators, tableFilters, timelineManager, timelineStatus, timelineType]);

  const handleUpdateInitiative = async (updated: Initiative) => {
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
            return prev.map(i => i.id === updated.id ? data : i);
          }
          return prev.map(i => i.id === data.id ? data : i);
        });
      }
    } catch (err) {
      console.error('Failed to update initiative:', err);
    }
  };

  const handleTaskAdd = async (milestoneId: string, text: string) => {
    const initiative = initiatives.find(it => it.id === activeInitiativeId);
    if (!initiative) return;

    const newTask: MilestoneTask = {
      id: `t_${Date.now()}`,
      name: text,
      status: 'Backlog',
      milestoneId: milestoneId
    };

    const updatedMilestones = (initiative.milestones || []).map(m => {
      if (m.id === milestoneId) {
        return { ...m, tasks: [...(m.tasks || []), newTask] };
      }
      return m;
    });

    await handleUpdateInitiative({ ...initiative, milestones: updatedMilestones });
  };

  const handleTaskDelete = async (milestoneId: string, taskId: string) => {
    const initiative = initiatives.find(it => it.id === activeInitiativeId);
    if (!initiative) return;

    const updatedMilestones = (initiative.milestones || []).map(m => {
      if (m.id === milestoneId) {
        return { ...m, tasks: (m.tasks || []).filter(t => t.id !== taskId) };
      }
      return m;
    });

    await handleUpdateInitiative({ ...initiative, milestones: updatedMilestones });
  };

  const handleTaskUpdate = async (milestoneId: string, taskId: string, field: string, value: any) => {
    const initiative = initiatives.find(it => it.id === activeInitiativeId);
    if (!initiative) return;

    const updatedMilestones = (initiative.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedTasks = (m.tasks || []).map((t): MilestoneTask => {
          if (t.id === taskId) {
            return { ...t, [field]: value };
          }
          return t;
        });
        return { ...m, tasks: updatedTasks };
      }
      return m;
    });

    await handleUpdateInitiative({ ...initiative, milestones: updatedMilestones });
  };

  const handleTaskToggle = async (milestoneId: string, taskId: string) => {
    const initiative = initiatives.find(it => it.id === activeInitiativeId);
    if (!initiative) return;

    const updatedMilestones = (initiative.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedTasks = (m.tasks || []).map((t): MilestoneTask => {
          if (t.id === taskId) {
            const nextStatus: 'Backlog' | 'Done' = t.status === 'Done' ? 'Backlog' : 'Done';
            return { ...t, status: nextStatus };
          }
          return t;
        });
        return { ...m, tasks: updatedTasks };
      }
      return m;
    });

    await handleUpdateInitiative({ ...initiative, milestones: updatedMilestones });
  };

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
    
    // Help for initials fallback if no photo
    const getInitials = (name: string) => {
      if (!name) return '?';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
      <div 
        key={it.id} 
        className="initiative-kanban-card"
        onClick={() => handleInitiativeClick(it.id)}
        onDoubleClick={() => handleInitiativeDoubleClick(it.id)}
        style={{ 
          padding: '0.8rem 1rem', 
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          border: 'none',
          borderLeft: `3px solid ${TYPE_COLORS[(it as any).initiativeType] || TYPE_COLORS[it.type] || 'var(--glass-border-strong)'}`,
          marginBottom: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.02)',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: '1.4', color: '#1A1A1B', letterSpacing: '-0.01em' }}>
            {fixEncoding(it.title, true) || 'Sem título'}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {it.businessExpectationDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-tertiary)' }}>
                <Calendar size={12} />
                <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                  {formatDateShort(it.businessExpectationDate)}
                </span>
              </div>
            )}
            {['4- Execução', '5- Implantação', '6- Concluído'].includes(it.status) && (it.actualEndDate || it.endDate) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: it.actualEndDate && it.endDate && new Date(it.actualEndDate) > new Date(it.endDate) ? 'var(--status-red)' : 'var(--text-tertiary)' }}>
                <Calendar size={12} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    {it.actualEndDate ? formatDateShort(it.actualEndDate) : formatDateShort(it.endDate)}
                  </span>
                  {it.actualEndDate && it.endDate && new Date(it.actualEndDate) > new Date(it.endDate) && (
                    <span style={{ fontSize: '0.6rem', textDecoration: 'line-through', opacity: 0.6 }}>
                      {formatDateShort(it.endDate)}
                    </span>
                  )}
                </div>
              </div>
            )}
            {it.impactedSystemIds && it.impactedSystemIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-tertiary)' }}>
                <Database size={12} />
                <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                  {it.impactedSystemIds.length}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getPhaseIcon(it.status)}
            {manager ? (
              manager.photoUrl ? (
                <img 
                  src={manager.photoUrl} 
                  alt={manager.name}
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: '50%', 
                  background: '#F1F5F9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  border: '1px solid #E2E8F0'
                }}>
                  {getInitials(manager.name)}
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    // Current date for reference
    const today = new Date();
    const currentYear = today.getFullYear();

    // 1. Calculate dynamic date range based on timeDimension
    let startDate: Date;
    let endDate: Date;
    let totalDays: number;
    let gridHeaders: { label: string; width: string; isWeekend?: boolean }[] = [];
    let weekHeaders: { label: string; width: string }[] = [];

    // Pixels per day determines column density and total canvas width
    let pxPerDay = 3; // Ano default

    switch (timeDimension) {
      case 'Trimestre': {
        // 8 quarters back + current + 8 quarters forward = 17 quarters
        const currentQ = Math.floor(today.getMonth() / 3);
        const startQ = currentQ - 8;
        const startQYear = currentYear + Math.floor(startQ / 4);
        const startQMon = ((startQ % 4) + 4) % 4;
        startDate = new Date(startQYear, startQMon * 3, 1);
        const endQ = currentQ + 8;
        const endQYear = currentYear + Math.floor(endQ / 4);
        const endQMon = ((endQ % 4) + 4) % 4;
        endDate = new Date(endQYear, endQMon * 3 + 3, 0);
        totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        pxPerDay = 6.5;
        // Month-level grid headers (3 per quarter × 17 = 51 months)
        let cur = new Date(startDate);
        while (cur <= endDate) {
          const daysInM = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
          const yearSuffix = `'${cur.getFullYear().toString().slice(2)}`;
          gridHeaders.push({
            label: cur.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '') + ` ${yearSuffix}`,
            width: `${(daysInM / totalDays) * 100}%`
          });
          cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }
        // Quarter block headers on top
        let qCur = new Date(startDate);
        while (qCur <= endDate) {
          const qIdx = Math.floor(qCur.getMonth() / 3);
          const qEnd = new Date(qCur.getFullYear(), (qIdx + 1) * 3, 0);
          const qDays = Math.round((Math.min(qEnd.getTime(), endDate.getTime()) - qCur.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          weekHeaders.push({
            label: `Q${qIdx + 1} ${qCur.getFullYear()}`,
            width: `${(qDays / totalDays) * 100}%`
          });
          qCur = new Date(qCur.getFullYear(), (qIdx + 1) * 3, 1);
        }
        break;
      }
      case 'Mês': {
        // 104 weeks total view (2 years), starting 52 weeks back to allow scrolling
        const totalWeeks = 104;
        const weeksBack = 52;
        
        startDate = new Date(today);
        startDate.setDate(today.getDate() - (weeksBack * 7) - today.getDay()); 
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (totalWeeks * 7));
        
        totalDays = totalWeeks * 7;
        pxPerDay = 15; 

        // Weekly grid headers
        for (let i = 0; i < totalWeeks; i++) {
          const wStart = new Date(startDate);
          wStart.setDate(startDate.getDate() + i * 7);
          const day = wStart.getDate().toString().padStart(2, '0');
          const month = wStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toLowerCase();
          gridHeaders.push({ label: `${day}/${month}`, width: `${(7 / totalDays) * 100}%`, isWeekend: false });
        }

        // Month top row grouping the weeks
        let mCur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (mCur <= endDate) {
          const mEnd = new Date(mCur.getFullYear(), mCur.getMonth() + 1, 0);
          const clampedStart = new Date(Math.max(mCur.getTime(), startDate.getTime()));
          const clampedEnd = new Date(Math.min(mEnd.getTime(), endDate.getTime()));
          const span = Math.round((clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          if (span > 0) {
            const yearSuffix = `'${mCur.getFullYear().toString().slice(2)}`;
            weekHeaders.push({
              label: mCur.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '') + ` ${yearSuffix}`,
              width: `${(span / totalDays) * 100}%`
            });
          }
          mCur = new Date(mCur.getFullYear(), mCur.getMonth() + 1, 1);
        }
        break;
      }
      case 'Semana': {
        // 100 weeks back + current week + 100 weeks forward
        const TOTAL_WEEKS = 201;
        const HALF_WEEKS = 100;
        startDate = new Date(today);
        startDate.setDate(today.getDate() - HALF_WEEKS * 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + TOTAL_WEEKS * 7 - 1);
        endDate.setHours(23, 59, 59, 999);
        totalDays = TOTAL_WEEKS * 7;
        pxPerDay = 60;
        // Daily slots
        for (let i = 0; i < totalDays; i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          gridHeaders.push({
            label: d.getDate().toString(),
            width: `${(1 / totalDays) * 100}%`,
            isWeekend
          });
        }
        // Month top row
        let mCur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        while (mCur <= endDate) {
          const mEnd = new Date(mCur.getFullYear(), mCur.getMonth() + 1, 0);
          const clampedStart2 = new Date(Math.max(mCur.getTime(), startDate.getTime()));
          const clampedEnd2 = new Date(Math.min(mEnd.getTime(), endDate.getTime()));
          const span = Math.round((clampedEnd2.getTime() - clampedStart2.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const yearSuffix = `'${mCur.getFullYear().toString().slice(2)}`;
          weekHeaders.push({
            label: mCur.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '') + ` ${yearSuffix}`,
            width: `${(span / totalDays) * 100}%`
          });
          mCur = new Date(mCur.getFullYear(), mCur.getMonth() + 1, 1);
        }
        break;
      }
      default: { // Ano — 2 years back + current + 2 years forward = 5 years
        const startYear = currentYear - 2;
        const endYear = currentYear + 2;
        startDate = new Date(startYear, 0, 1);
        endDate = new Date(endYear, 11, 31);
        totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        pxPerDay = 3;
        // gridHeaders = month slots with year label
        for (let yr = startYear; yr <= endYear; yr++) {
          for (let mo = 0; mo < 12; mo++) {
            const daysInM = new Date(yr, mo + 1, 0).getDate();
            const d = new Date(yr, mo, 1);
            const isFirstOfYear = mo === 0;
            const label = isFirstOfYear
              ? d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '') + ` ${yr}`
              : d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
            gridHeaders.push({ label, width: `${(daysInM / totalDays) * 100}%` });
          }
        }
        // weekHeaders = year blocks (top row)
        for (let yr = startYear; yr <= endYear; yr++) {
          const yrDays = getYearDays(yr);
          weekHeaders.push({ label: yr.toString(), width: `${(yrDays / totalDays) * 100}%` });
        }
        break;
      }
    } // end switch

    const dynamicMinWidth = `${totalDays * pxPerDay}px`;

    const getXPos = (dateStr: string | Date | undefined) => {
      if (!dateStr) return -100;
      const date = parseDateSafe(dateStr);
      if (!date) return -100;
      const diffTime = date.getTime() - startDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return (diffDays / totalDays) * 100;
    };

    const getWidthPercent = (startStr: string | Date | undefined, endStr: string | Date | undefined) => {
      if (!startStr || !endStr) return 0;
      const start = parseDateSafe(startStr);
      const end = parseDateSafe(endStr);
      if (!start || !end) return 0;
      
      // Clamp to grid range
      const clampedStart = new Date(Math.max(start.getTime(), startDate.getTime()));
      const clampedEnd = new Date(Math.min(end.getTime(), endDate.getTime()));
      
      if (clampedEnd < clampedStart) return 0;
      
      const diffTime = clampedEnd.getTime() - clampedStart.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return (diffDays / totalDays) * 100;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', overflow: 'hidden', position: 'relative' }}>

        {/* Minimal Top Controls — Unified Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '6px 10px',
          background: 'white',
          borderBottom: '1px solid #EAECEF',
          position: 'relative',
          zIndex: 100,
          height: '40px',
          flexShrink: 0
        }}>
          {/* Left Filters */}
          <div ref={filtersRef} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Manager Filter */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setIsManagerMenuOpen(!isManagerMenuOpen); setIsStatusMenuOpen(false); setIsTimelineMenuOpen(false); setIsTypeMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #DDE1E7',
                  background: 'white',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  lineHeight: 1.6,
                  whiteSpace: 'nowrap'
                }}
              >
                <Users size={12} strokeWidth={2} style={{ opacity: 0.7 }} />
                {timelineManager === 'Todos' ? 'Gestor: Todos' : (collaborators.find(c => c.id === timelineManager)?.name || 'Todos')} 
                <ChevronDown size={12} strokeWidth={2} style={{ opacity: 0.5 }} />
              </button>
              {isManagerMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  background: 'white',
                  border: '1px solid #DDE1E7',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: '200px',
                  zIndex: 200,
                  padding: '4px 0',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div
                    onClick={() => { setTimelineManager('Todos'); setIsManagerMenuOpen(false); }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.72rem',
                      fontWeight: timelineManager === 'Todos' ? 700 : 400,
                      color: timelineManager === 'Todos' ? '#111827' : '#4B5563',
                      background: timelineManager === 'Todos' ? '#F3F4F6' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    Todos os Gestores
                  </div>
                  {Array.from(new Set(initiatives.map(it => it.leaderId).filter(Boolean))).map(id => {
                    const manager = collaborators.find(c => c.id === id);
                    if (!manager) return null;
                    return (
                      <div
                        key={id}
                        onClick={() => { setTimelineManager(id); setIsManagerMenuOpen(false); }}
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.72rem',
                          fontWeight: timelineManager === id ? 700 : 400,
                          color: timelineManager === id ? '#111827' : '#4B5563',
                          background: timelineManager === id ? '#F3F4F6' : 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        {manager.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Type Filter */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setIsTypeMenuOpen(!isTypeMenuOpen); setIsStatusMenuOpen(false); setIsManagerMenuOpen(false); setIsTimelineMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #DDE1E7',
                  background: 'white',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  lineHeight: 1.6,
                  whiteSpace: 'nowrap'
                }}
              >
                <Zap size={12} strokeWidth={2} style={{ opacity: 0.7 }} />
                Tipo: {timelineType === 'Todos' ? 'Todos' : timelineType === '1- Estratégico' ? 'Estratégico' : timelineType === '2- Projeto' ? 'Projeto' : 'Fast Track'} 
                <ChevronDown size={12} strokeWidth={2} style={{ opacity: 0.5 }} />
              </button>
              {isTypeMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  background: 'white',
                  border: '1px solid #DDE1E7',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: '160px',
                  zIndex: 200,
                  padding: '4px 0'
                }}>
                  {['Todos', '1- Estratégico', '2- Projeto', '3- Fast Track'].map(t => (
                    <div
                      key={t}
                      onClick={() => { setTimelineType(t); setIsTypeMenuOpen(false); }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.72rem',
                        fontWeight: timelineType === t ? 700 : 400,
                        color: timelineType === t ? '#111827' : '#4B5563',
                        background: timelineType === t ? '#F3F4F6' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {t === 'Todos' ? 'Todos os Tipos' : t === '1- Estratégico' ? 'Estratégico' : t === '2- Projeto' ? 'Projeto' : 'Fast Track'}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setIsStatusMenuOpen(!isStatusMenuOpen); setIsManagerMenuOpen(false); setIsTimelineMenuOpen(false); setIsTypeMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #DDE1E7',
                  background: 'white',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  lineHeight: 1.6,
                  whiteSpace: 'nowrap'
                }}
              >
                <Layers size={12} strokeWidth={2} style={{ opacity: 0.7 }} />
                Status: {timelineStatus === 'Todos' ? 'Todos' : timelineStatus} 
                <ChevronDown size={12} strokeWidth={2} style={{ opacity: 0.5 }} />
              </button>
              {isStatusMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  background: 'white',
                  border: '1px solid #DDE1E7',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: '140px',
                  zIndex: 200,
                  padding: '4px 0'
                }}>
                  {['Todos', 'Em Andamento', 'Concluído'].map(s => (
                    <div
                      key={s}
                      onClick={() => { setTimelineStatus(s); setIsStatusMenuOpen(false); }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.72rem',
                        fontWeight: timelineStatus === s ? 700 : 400,
                        color: timelineStatus === s ? '#111827' : '#4B5563',
                        background: timelineStatus === s ? '#F3F4F6' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      {s === 'Todos' ? 'Todos os Status' : s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                if (timelineScrollRef.current) {
                  const pxPerDay =
                    timeDimension === 'Semana' ? 60 :
                    timeDimension === 'Mês' ? 15 :
                    timeDimension === 'Trimestre' ? 6.5 : 3;
                  const start = new Date(today);
                  if (timeDimension === 'Ano') {
                    start.setFullYear(today.getFullYear() - 2, 0, 1);
                  } else if (timeDimension === 'Trimestre') {
                    const currentQ = Math.floor(today.getMonth() / 3);
                    const startQ = currentQ - 8;
                    const startQYear = today.getFullYear() + Math.floor(startQ / 4);
                    const startQMon = ((startQ % 4) + 4) % 4;
                    start.setFullYear(startQYear, startQMon * 3, 1);
                  } else if (timeDimension === 'Mês') {
                    start.setDate(today.getDate() - (52 * 7) - today.getDay());
                  } else { // Semana
                    start.setDate(today.getDate() - 100 * 7);
                  }
                  start.setHours(0, 0, 0, 0);

                  const diffDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                  const todayPx = diffDays * pxPerDay;
                  const viewportWidth = timelineScrollRef.current.clientWidth;
                  timelineScrollRef.current.scrollTo({ left: Math.max(0, todayPx - viewportWidth / 2), behavior: 'smooth' });
                }
              }}
              style={{
                padding: '3px 10px',
                borderRadius: '6px',
                border: '1px solid #DDE1E7',
                background: 'white',
                fontSize: '0.72rem',
                fontWeight: 500,
                color: '#374151',
                cursor: 'pointer',
                lineHeight: 1.6,
                whiteSpace: 'nowrap'
              }}
            >
              Hoje
            </button>

            <div style={{ position: 'relative' }} ref={timelineMenuRef}>
              <button
                onClick={() => { setIsTimelineMenuOpen(!isTimelineMenuOpen); setIsManagerMenuOpen(false); setIsStatusMenuOpen(false); setIsTypeMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  border: '1px solid #DDE1E7',
                  background: 'white',
                  fontSize: '0.72rem',
                  fontWeight: 500,
                  color: '#374151',
                  cursor: 'pointer',
                  lineHeight: 1.6,
                  whiteSpace: 'nowrap'
                }}
              >
                {timeDimension} <ChevronDown size={12} strokeWidth={2} style={{ opacity: 0.5 }} />
              </button>
              {isTimelineMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  background: 'white',
                  border: '1px solid #DDE1E7',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: '120px',
                  zIndex: 200,
                  padding: '4px 0'
                }}>
                  {['Ano', 'Trimestre', 'Mês', 'Semana'].map(p => (
                    <div
                      key={p}
                      onClick={() => { setTimeDimension(p as any); setIsTimelineMenuOpen(false); }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.72rem',
                        fontWeight: timeDimension === p ? 700 : 400,
                        color: timeDimension === p ? '#111827' : '#4B5563',
                        background: timeDimension === p ? '#F3F4F6' : 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        margin: '0 4px'
                      }}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Timeline Grid (100%) */}
          <div style={{ width: '100%', background: 'white', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div ref={timelineScrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', position: 'relative' }}>
              
              {/* CSS for weekend stripes + bar hover */}
              <style>{`
                .weekend-stripe {
                  background-image: repeating-linear-gradient(
                    45deg,
                    rgba(241, 245, 249, 0.5),
                    rgba(241, 245, 249, 0.5) 10px,
                    rgba(248, 250, 252, 0.5) 10px,
                    rgba(248, 250, 252, 0.5) 20px
                  );
                }
                .timeline-bar {
                  cursor: pointer;
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .timeline-bar:hover {
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05) !important;
                  border-color: #71717A !important;
                  z-index: 20 !important;
                  transform: translateY(-1px);
                }
                .timeline-bar:hover .timeline-bar-icon {
                  opacity: 1 !important;
                }
                .timeline-bar-icon {
                  opacity: 0;
                  transition: opacity 0.15s ease;
                }
                .timeline-bar-selected {
                  border: 2px solid #2563EB !important;
                  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15), 0 8px 20px rgba(0, 0, 0, 0.12) !important;
                  z-index: 50 !important;
                  transform: scale(1.01);
                }
              `}</style>

              {/* Grid Content Container - width computed from pxPerDay × totalDays */}
              <div style={{ 
                minWidth: dynamicMinWidth,
                width: timeDimension === 'Ano' ? dynamicMinWidth : undefined,
                minHeight: '100%', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Header Layers */}
                <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #EAECEF' }}>
                  {/* Top Layer: Month/Year/Quarter grouping */}
                  {(timeDimension === 'Mês' || timeDimension === 'Ano' || timeDimension === 'Trimestre' || timeDimension === 'Semana') && weekHeaders.length > 0 && (
                    <div style={{ height: '22px', display: 'flex', borderBottom: '1px solid #EAECEF', background: 'white' }}>
                      {weekHeaders.map((w, i) => (
                        <div key={i} style={{ 
                          flex: `0 0 ${w.width}`, 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          color: '#111827', 
                          display: 'flex', 
                          alignItems: 'center', 
                          paddingLeft: '6px', 
                          borderRight: '1px dashed #E2E8F0',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap'
                        }}>
                          {w.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Header: days / months */}
                  <div style={{ height: '24px', display: 'flex', background: 'white' }}>
                    {gridHeaders.map((h, i) => (
                      <div key={i} style={{ 
                        flex: `0 0 ${h.width}`, 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        color: h.isWeekend ? '#64748B' : '#1F2937', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRight: '1px dashed #E2E8F0', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden',
                        background: h.isWeekend ? '#F1F5F9' : '#F8FAFC'
                      }}>
                        {h.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today Line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${getXPos(today)}%`,
                  width: '1px',
                  borderLeft: '2px dotted #E11D48',
                  zIndex: 2,
                  pointerEvents: 'none'
                }} />

                {/* Grid Background */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
                  {gridHeaders.map((h, i) => (
                    <div key={i} className={h.isWeekend ? 'weekend-stripe' : ''} style={{ 
                      flex: `0 0 ${h.width}`, 
                      borderRight: '1px dashed #ECEFF2', 
                      height: '100%',
                      background: h.isWeekend ? 'rgba(248, 250, 252, 0.4)' : 'transparent'
                    }} />
                  ))}
                </div>

                {/* Initiative Bars */}
                <div style={{ position: 'relative', padding: '16px 0', zIndex: 3 }}>
                  {sortedInitiatives
                    .map((it) => {
                      const s = it.startDate ? parseDateSafe(it.startDate) || startDate : startDate;
                      const e = it.endDate ? parseDateSafe(it.endDate) || endDate : endDate;
                      const actualE = it.actualEndDate ? parseDateSafe(it.actualEndDate) : null;
                      const isDelayed = !!(actualE && actualE > e);
                      
                      const left = getXPos(s);
                      const barTotalPercent = getWidthPercent(s, isDelayed ? (actualE as Date) : e);
                      const solidWidthPercent = getWidthPercent(s, e);
                      const delayWidthPercent = (isDelayed && actualE) ? getWidthPercent(e, actualE) : 0;
                      
                      if (barTotalPercent <= 0) return null;


                      // Progress calculation based on tasks if available
                      const getAllTasks = () => {
                        return (it.milestones || []).flatMap(m => m.tasks || []);
                      };
                      const tasks = getAllTasks();
                      const doneTasks = tasks.filter(t => t.status === 'Done');
                      let progressPercent = tasks.length > 0 ? (doneTasks.length / tasks.length) * 100 : 0;
                      if (it.status === '6- Concluído') progressPercent = 100;

                      const formatDateShort = (dateStr?: string | null) => {
                        if (!dateStr) return '';
                        try {
                          const d = parseDateSafe(dateStr);
                          if (!d) return '';
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toLowerCase();
                          return `${day}/${month}`;
                        } catch(e) { return ''; }
                      };

                      return (
                        <div key={it.id} style={{ height: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', padding: '4px 0' }}>
                          {/* Title and Icons Layer above the bar */}
                          <div style={{ 
                            position: 'absolute', 
                            left: `${left}%`, 
                            top: '8px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            whiteSpace: 'nowrap',
                            zIndex: 4,
                            pointerEvents: 'none'
                          }}>
                            {/* Status Icon */}
                            <div 
                              title={`Status: ${it.status}`}
                              style={{ 
                                transform: 'scale(0.85)', 
                                transformOrigin: 'left center', 
                                opacity: 0.9, 
                                cursor: 'help',
                                pointerEvents: 'auto'
                              }}
                            >
                              {getPhaseIcon(it.status)}
                            </div>
                            
                            {/* Priority Icon */}
                            <div 
                              title={`Prioridade: ${it.priority === 4 ? 'Urgente' : it.priority === 3 ? 'Alta' : it.priority === 2 ? 'Média' : 'Baixa'}`}
                              style={{ 
                                opacity: 0.8, 
                                transform: 'scale(0.85)', 
                                transformOrigin: 'left center', 
                                cursor: 'help',
                                pointerEvents: 'auto'
                              }}
                            >
                              <PriorityIcon value={it.priority} />
                            </div>

                            {/* Initiative Title */}
                            <span style={{ 
                              fontSize: '0.78rem', 
                              fontWeight: 600, 
                              color: '#1F2937', 
                              letterSpacing: '-0.01em',
                              maxWidth: '400px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {fixEncoding(it.title, true) || 'Sem título'}
                            </span>

                            {/* Manager name small hint if available */}
                            {it.leaderId && (
                              <span style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: 400 }}>
                                • {collaborators.find(c => c.id === it.leaderId)?.name}
                              </span>
                            )}
                          </div>

                          {/* The Main Progress Bar Container */}
                          <div 
                            className={`timeline-bar ${activeInitiativeId === it.id ? 'timeline-bar-selected' : ''}`}
                            title={`${it.title} (${Math.round(progressPercent)}%)`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiativeClick(it.id);
                            }}
                            onDoubleClick={() => handleInitiativeDoubleClick(it.id)}
                            style={{ 
                              position: 'absolute',
                              left: `${left}%`,
                              top: '30px',
                              width: `${barTotalPercent}%`,
                              height: '20px', 
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                              zIndex: activeInitiativeId === it.id ? 50 : 3,
                              overflow: 'visible',
                              background: 'white',
                              border: activeInitiativeId === it.id ? `2px solid #2563EB` : `1px solid #64748B`,
                              boxShadow: activeInitiativeId === it.id ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.08)'
                            }}
                          >
                            {/* Type Icon inside the bar, left aligned */}
                            <div 
                              title={`Tipo: ${it.type}`}
                              style={{ 
                                position: 'absolute', 
                                left: '6px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                zIndex: 10,
                                pointerEvents: 'auto', // reactivate for title to work
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'help'
                              }}
                            >
                              {/* Override getTypeIcon with white if inside the bar for better contrast, 
                                  or use a neutral color if preferred. Using white since it's cleaner. */}
                              <div style={{ filter: progressPercent > 5 ? 'brightness(0) invert(1)' : 'none', opacity: 0.8 }}>
                                {getTypeIcon(it.type, 11)}
                              </div>
                            </div>
                            {/* Start Date Label */}
                            <span style={{ 
                              position: 'absolute', 
                              right: '100%',
                              marginRight: '6px',
                              fontSize: '0.62rem', 
                              color: '#9CA3AF', 
                              fontWeight: 500,
                              pointerEvents: 'none',
                              whiteSpace: 'nowrap'
                            }}>
                              {formatDateShort(it.startDate)}
                            </span>

                            {/* End Date Label */}
                            <div style={{ 
                              position: 'absolute', 
                              left: '100%',
                              marginLeft: '6px',
                              fontSize: '0.62rem', 
                              color: '#9CA3AF', 
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              pointerEvents: 'none',
                              display: 'flex',
                              gap: '4px',
                              alignItems: 'baseline'
                            }}>
                              {isDelayed ? (
                                <>
                                  <span style={{ color: '#EF4444' }}>{formatDateShort(it.actualEndDate)}</span>
                                  <span style={{ opacity: 0.6, fontSize: '0.58rem' }}> (<s>{formatDateShort(it.endDate)}</s>)</span>
                                </>
                              ) : (
                                formatDateShort(it.endDate)
                              )}
                            </div>
                            {/* The "Solid" portion representing planned duration (background) */}
                            <div style={{
                              height: '100%',
                              width: isDelayed ? `${(solidWidthPercent/barTotalPercent)*100}%` : '100%',
                              background: 'transparent', 
                              borderRadius: isDelayed ? '4px 0 0 4px' : '4px',
                              position: 'relative',
                              overflow: 'hidden',
                              borderRight: isDelayed ? 'none' : 'none'
                            }}>
                              {/* The Progress Fill - Consistent green bar */}
                              <div style={{ 
                                height: '100%', 
                                width: `${progressPercent}%`, 
                                background: '#10B981', 
                                opacity: 0.85,
                                transition: 'width 0.4s ease-out'
                              }} />


                              {/* Click Icon - visible on hover via global hover style */}
                              <div className="timeline-bar-icon" style={{ 
                                position: 'absolute', 
                                right: '6px', 
                                top: '50%', 
                                transform: 'translateY(-50%)' 
                              }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                  <polyline points="15 3 21 3 21 9"/>
                                  <line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                              </div>
                            </div>

                            {/* Delay Extension (Replanning) */}
                            {isDelayed && (
                              <div style={{
                                height: '100%',
                                width: `${(delayWidthPercent/barTotalPercent)*100}%`,
                                background: `repeating-linear-gradient(
                                  45deg,
                                  #F59E0B10,
                                  #F59E0B10 2px,
                                  #F59E0B25 2px,
                                  #F59E0B25 4px
                                )`, 
                                borderLeft: `1px dashed #F59E0B`,
                                borderRadius: '0 4px 4px 0',
                                position: 'relative'
                              }} />
                            )}

                          </div>

                          {/* Vertical lines indicating start/end if the bar is very long/off-screen? 
                              For now, keep simple. */}
                        </div>
                      );
                    })}
                </div>

              </div>
            </div>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '0.8rem' }}>
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
                <tr 
                  key={it.id} 
                  onClick={() => handleInitiativeClick(it.id)} 
                  onDoubleClick={() => handleInitiativeDoubleClick(it.id)}
                  className="table-row-premium"
                  style={{ 
                    cursor: 'pointer', 
                    background: selectedIds.has(it.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
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
                  <td style={{ fontWeight: 800, padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {fixEncoding(it.title, true) || 'Sem título'}
                  </td>
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
                      {getTypeIcon((it as any).initiativeType || it.type || '', 16)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', width: '75px', padding: '0.75rem 0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={it.status}>
                      {getPhaseIcon(it.status)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', width: '58px', padding: '0.75rem 0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 400, fontSize: '0.8rem', color: cycleTime > 30 ? 'var(--status-red)' : cycleTime > 15 ? 'var(--status-amber)' : 'var(--text-secondary)' }}>
                        {cycleTime >= 0 ? `${cycleTime} d` : '-'}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', width: '110px', padding: '0.75rem 1.5rem 0.75rem 0.5rem' }}>
                    {['4- Execução', '5- Implantação', '6- Concluído'].includes(it.status) && (it.actualEndDate || it.endDate) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.8rem', color: it.actualEndDate ? 'var(--status-red)' : 'var(--text-secondary)' }}>
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
      {viewMode === 'table' ? renderTableView() : viewMode === 'newTimeline' ? renderTimelineView() : (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    {column.photo && (
                      <img src={column.photo} alt={column.title} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    {column.icon && !column.photo && <span style={{ color: 'var(--text-tertiary)' }}>{column.icon}</span>}
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      {fixEncoding(column.title)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', background: '#E2E8F0', padding: '2px 8px', borderRadius: '12px' }}>
                    {colInits.length}
                  </div>
                </div>
                
                <div className="kanban-column-content" style={{ padding: '0 0.4rem' }}>
                  {colInits.map(renderInitiativeCard)}
                </div>

                {viewMode !== 'timeline' && (
                  <button 
                    className="add-card-btn-trello"
                    onClick={() => {
                      setCreateModalColumnId(column.id);
                      setIsCreateModalOpen(true);
                    }}
                  >
                    <Plus size={16} /> <span>Adicionar Iniciativa</span>
                  </button>
                )}
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

      {/* Side Panel placeholder - will be handled within the page layout */}

      <style>{`
        .kanban-board::-webkit-scrollbar { height: 10px; }
        .kanban-board::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 5px; }
        .kanban-board::-webkit-scrollbar-track { background: rgba(0,0,0,0.03); }
        
        .kanban-column-trello {
          min-width: 270px;
          max-width: 270px;
          background: #F8F9FA;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          max-height: 100%;
          border: none;
          flex-shrink: 0;
        }

        .kanban-column-header-trello {
          padding: 1rem 1rem 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .kanban-column-content {
          flex-grow: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0.5rem 0.75rem;
        }

        .kanban-column-content::-webkit-scrollbar { width: 5px; }
        .kanban-column-content::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .kanban-column-content::-webkit-scrollbar-track { background: transparent; }

        .add-card-btn-trello {
          width: calc(100% - 1.5rem);
          margin: 0 auto 0.75rem;
          padding: 0.6rem 0.75rem;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-tertiary);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          opacity: 0.4;
        }

        .add-card-btn-trello:hover {
          background: rgba(0,0,0,0.03);
          color: var(--text-primary);
          opacity: 1;
        }

        .initiative-kanban-card {
          transition: all 0.2s ease;
        }

        .initiative-kanban-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .peek-sidebar-container {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          height: 100vh;
          width: 380px;
          background: #FFFFFF;
          border-left: 1px solid #E5E7EB;
          box-shadow: -4px 0 24px rgba(0,0,0,0.1);
          z-index: 10000;
          display: flex;
          flex-direction: column;
          animation: sidebarSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .peek-sidebar-container.closing {
          animation: sidebarSlideOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes sidebarSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes sidebarSlideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }

        .linear-sidebar-card {
          background: white;
          border: none;
          border-bottom: 1px solid #E2E8F0;
          border-radius: 0;
          margin: 0;
          padding: 0;
          box-shadow: none;
          overflow: hidden;
        }

        .linear-property {
          display: flex;
          align-items: center;
          min-height: 32px;
          padding: 0.2rem 0;
        }

        .linear-prop-label {
          width: 110px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6B7280;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .linear-prop-value {
          flex: 1;
          display: flex;
          align-items: center;
          font-size: 0.85rem;
          color: #111827;
          min-width: 0;
        }

        .peek-sidebar-container select:focus, 
        .peek-sidebar-container input:focus, 
        .peek-sidebar-container textarea:focus {
          outline: none;
          border-color: #3B82F6;
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

      {/* Milestone Delete Confirmation Modal */}
      {milestoneDeleteId && activeInitiativeId && (() => {
        const currentInit = initiatives.find(it => it.id === activeInitiativeId);
        const milestone = currentInit?.milestones?.find(m => m.id === milestoneDeleteId);
        if (!milestone) return null;

        const confirmDeleteMilestone = () => {
          if (!currentInit) return;
          const list = (currentInit.milestones || []).filter(m => m.id !== milestoneDeleteId);
          handleUpdateInitiative({ ...currentInit, milestones: list });
          setMilestoneDeleteId(null);
        };

        return (
          <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: 'var(--shadow-lg)',
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
                Excluir Milestone
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                Tem certeza que deseja excluir o milestone <strong>"{milestone.name}"</strong>? 
                Esta ação removerá também todas as tarefas vinculadas.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setMilestoneDeleteId(null)}
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
                  onClick={confirmDeleteMilestone}
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
        );
      })()}
      {/* Peek Sidebar (Linear Style) */}
      {/* Peek Sidebar (Linear Style) */}
      {activeInitiativeId && (() => {
        const initiative = initiatives.find(it => it.id === activeInitiativeId);
        if (!initiative) return null;

        const isRequester = true; // For now simplified, or use useAuth if available
        const isNew = initiative.id.startsWith('new_');
        
        const demandantDirectorates = [
          'Operação FTTH', 'Operação B2B/Atacado', 'Comercial FTTH', 
          'Comercial B2B/Atacado', 'Engenharia', 'TI', 'Outros'
        ];

        const PASTEL_THEMES: Record<string, { bg: string; text: string; icon: string }> = {
          '1- Estratégico': { bg: '#DC2626', text: '#FFFFFF', icon: '#FFFFFF' },
          '2- Projeto': { bg: '#2563EB', text: '#FFFFFF', icon: '#FFFFFF' },
          '3- Fast Track': { bg: '#059669', text: '#FFFFFF', icon: '#FFFFFF' }
        };
        const theme = PASTEL_THEMES[initiative.type] || { bg: '#475569', text: '#FFFFFF', icon: '#FFFFFF' };

        return (
          <div className={`peek-sidebar-container ${isClosing ? 'closing' : ''}`}>
            {/* Header / Toolbar */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '0 1.25rem', 
              height: '44px',
              minHeight: '44px',
              flex: '0 0 44px',
              flexShrink: 0,
              width: '100%',
              backgroundColor: theme.bg,
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.3s ease',
              zIndex: 10,
              boxSizing: 'border-box',
              marginTop: 0
            }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', color: '#FFFFFF' }}>
                  {getTypeIcon(initiative.type, 20, '#FFFFFF')}
                </div>
                <h2 style={{ 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  color: '#FFFFFF', 
                  margin: 0, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                  flex: 1
                }}>
                  {initiative.title}
                </h2>
              </div>
              <button 
                onClick={handleCloseSidebar}
                style={{ background: 'transparent', border: 'none', color: '#FFFFFF', opacity: 0.8, cursor: 'pointer', display: 'flex', padding: '0.25rem', borderRadius: '4px' }}
                className="btn-icon-hover"
              >
                <X size={20} />
              </button>
            </div>


            <div style={{ flex: 1, overflowY: 'auto' }}>
              
              {/* Visão Geral Section */}
              <div className="linear-sidebar-card">
                <button 
                  onClick={() => setSidebarOpenSections(prev => ({ ...prev, overview: !prev.overview }))}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#F8FAFC', border: 'none', borderBottom: sidebarOpenSections.overview ? '1px solid #E2E8F0' : 'none', cursor: 'pointer' }}
                >
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>VISÃO GERAL</h3>
                  {sidebarOpenSections.overview ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                </button>
                {sidebarOpenSections.overview && (
                    <div style={{ 
                      fontSize: '0.825rem', 
                      lineHeight: '1.5', 
                      color: '#475569', 
                      fontFamily: "'Outfit', 'Inter', sans-serif",
                      fontWeight: 400,
                      whiteSpace: 'pre-wrap',
                      padding: '0.6rem 1rem 0 1rem',
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {initiative.benefit || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Sem objetivo definido</span>}
                    </div>
                )}
              </div>

              {/* Properties Section */}
              <div className="linear-sidebar-card">
                <button 
                  onClick={() => setSidebarOpenSections(prev => ({ ...prev, properties: !prev.properties }))}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#F8FAFC', border: 'none', borderBottom: sidebarOpenSections.properties ? '1px solid #E2E8F0' : 'none', cursor: 'pointer' }}
                >
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>PROPRIEDADES</h3>
                  {sidebarOpenSections.properties ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                </button>
                {sidebarOpenSections.properties && (
                  <InitiativeProperties 
                    formData={initiative}
                    setFormData={handleUpdateInitiative}
                    allCollaborators={collaborators}
                    allSystems={systems}
                    editingField={editingField}
                    setEditingField={setEditingField}
                    isRequester={isRequester}
                    isNew={isNew}
                    handleStatusChange={(s) => handleUpdateInitiative({ ...initiative, status: s })}
                    setShowPriorityMenu={setShowPriorityMenu}
                    demandantDirectorates={demandantDirectorates}
                  />
                )}
              </div>

              {/* Milestones Section */}
              <div className="linear-sidebar-card">
                <button 
                  onClick={() => setSidebarOpenSections(prev => ({ ...prev, milestones: !prev.milestones }))}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#F8FAFC', border: 'none', borderBottom: sidebarOpenSections.milestones ? '1px solid #E2E8F0' : 'none', cursor: 'pointer' }}
                >
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>MILESTONES</h3>
                  {sidebarOpenSections.milestones ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                </button>
                {sidebarOpenSections.milestones && (
                  <InitiativeMilestones 
                  formData={initiative}
                  setFormData={handleUpdateInitiative}
                  allCollaborators={collaborators}
                  allSystems={systems}
                  editingMilestoneId={editingMilestoneId}
                  setEditingMilestoneId={setEditingMilestoneId}
                  editMilestoneText={editMilestoneText}
                  setEditMilestoneText={setEditMilestoneText}
                  handleTaskAdd={handleTaskAdd}
                  handleTaskDelete={handleTaskDelete}
                  handleTaskUpdate={handleTaskUpdate}
                  handleTaskToggle={handleTaskToggle}
                  handleUpdateMilestoneName={() => {
                    if (!editingMilestoneId || !editMilestoneText.trim()) {
                      setEditingMilestoneId(null);
                      return;
                    }
                    const list = (initiative.milestones || []).map(m => 
                      m.id === editingMilestoneId ? { ...m, name: editMilestoneText } : m
                    );
                    handleUpdateInitiative({ ...initiative, milestones: list });
                    setEditingMilestoneId(null);
                  }}
                  handleRemoveMilestone={(id) => {
                    setMilestoneDeleteId(id);
                  }}
                  handleMilestoneReorder={(sourceId, targetId) => {
                    const newMilestones = [...(initiative.milestones || [])];
                    const sourceIdx = newMilestones.findIndex(m => m.id === sourceId);
                    const targetIdx = newMilestones.findIndex(m => m.id === targetId);
                    if (sourceIdx !== -1 && targetIdx !== -1) {
                      const [moved] = newMilestones.splice(sourceIdx, 1);
                      newMilestones.splice(targetIdx, 0, moved);
                      handleUpdateInitiative({ ...initiative, milestones: newMilestones });
                    }
                  }}
                  setActiveMilestoneTaskViewId={setActiveMilestoneTaskViewId}
                  activeMilestoneTaskViewId={activeMilestoneTaskViewId}
                  newMilestoneName={newMilestoneName}
                  setNewMilestoneName={setNewMilestoneName}
                  handleAddMilestone={(e) => {
                    if (e.key === 'Enter' && newMilestoneName.trim()) {
                      e.preventDefault();
                      const newM = {
                        id: `m_${Date.now()}`,
                        companyId: initiative.companyId,
                        departmentId: initiative.departmentId,
                        name: newMilestoneName.trim(),
                        systemId: 'N/A',
                        baselineDate: new Date().toISOString().split('T')[0]
                      };
                      handleUpdateInitiative({ 
                        ...initiative, 
                        milestones: [...(initiative.milestones || []), newM] 
                      });
                      setNewMilestoneName('');
                    }
                  }}
                  isRequester={isRequester}
                  isNew={isNew}
                  readOnlyMilestones={false}
                />
                )}
              </div>

              {/* Comments Section Placeholder */}
              <div className="linear-sidebar-card">
                <button 
                  onClick={() => setSidebarOpenSections(prev => ({ ...prev, comments: !prev.comments }))}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#F8FAFC', border: 'none', borderBottom: sidebarOpenSections.comments ? '1px solid #E2E8F0' : 'none', cursor: 'pointer' }}
                >
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>COMENTÁRIOS</h3>
                  {sidebarOpenSections.comments ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                </button>
                {sidebarOpenSections.comments && (
                  <div style={{ padding: '0.6rem 1rem 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <textarea 
                      placeholder="Adicione um comentário..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      style={{ width: '100%', minHeight: '80px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', resize: 'vertical', background: '#F8FAFC' }}
                    />
                    {commentText.trim() && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={async () => {
                            if (!commentText.trim()) return;
                            
                            const newComment: InitiativeComment = {
                              id: `c_${Date.now()}`,
                              userId: user?.id || 'anon',
                              userName: (user as any)?.fullName || (user as any)?.name || 'Usuário',
                              userPhoto: user?.photoUrl,
                              content: commentText.trim(),
                              timestamp: new Date().toISOString()
                            };

                            const updatedComments = [newComment, ...(initiative.comments || [])];
                            await handleUpdateInitiative({ ...initiative, comments: updatedComments });
                            setCommentText('');
                          }}
                          style={{
                            padding: '0.4rem 1rem',
                            background: '#1E293B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          Salvar Comentário
                        </button>
                      </div>
                    )}

                    {/* Comments List */}
                    {(initiative.comments || []).length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {(initiative.comments || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(c => (
                          <div key={c.id} style={{ display: 'flex', gap: '0.75rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ flexShrink: 0 }}>
                              {renderAvatar(c.userId, collaborators, 24)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>{c.userName}</span>
                                <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{new Date(c.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* History Section Placeholder */}
              <div className="linear-sidebar-card">
                <button 
                  onClick={() => setSidebarOpenSections(prev => ({ ...prev, history: !prev.history }))}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#F8FAFC', border: 'none', borderBottom: sidebarOpenSections.history ? '1px solid #E2E8F0' : 'none', cursor: 'pointer' }}
                >
                  <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>HISTÓRICO</h3>
                  {sidebarOpenSections.history ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                </button>
                {sidebarOpenSections.history && (
                  <div style={{ padding: '0.6rem 1rem 0 1rem', fontSize: '0.8rem', color: '#64748B' }}>
                    Nenhuma atividade registrada ainda.
                  </div>
                )}
              </div>

            </div>

            {/* Edit Button at Footer */}
            <div style={{ padding: '1rem', borderTop: '1px solid #E2E8F0', background: '#F1F5F9' }}>
              <button 
                onClick={() => navigate(`/iniciativas/${activeInitiativeId}/edit`)}
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  background: '#111827', 
                  color: '#FFF', 
                  border: 'none', 
                  padding: '0.75rem', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                className="btn-primary-hover"
              >
                <Edit3 size={16} /> Editar Iniciativa
              </button>
            </div>
          </div>
        );
      })()}

      {showPriorityMenu && (
        <div 
          style={{ position: 'fixed', top: showPriorityMenu.top, left: showPriorityMenu.left, zIndex: 1000001 }}
          onMouseLeave={() => setShowPriorityMenu(null)}
        >
          <PriorityPicker 
            value={initiatives.find(it => it.id === activeInitiativeId)?.priority || 0}
            onSelect={async (p) => {
              const it = initiatives.find(i => i.id === activeInitiativeId);
              if (it) {
                await handleUpdateInitiative({ ...it, priority: p });
              }
            }}
            onClose={() => setShowPriorityMenu(null)}
          />
        </div>
      )}

      {isCreateModalOpen && (
        <CreateInitiativeModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateSave}
          allCollaborators={collaborators}
          allSystems={systems}
          companyId={currentCompany?.id || ''}
          departmentId={currentDepartment?.id || ''}
          createdById={user?.id}
        />
      )}
    </div>
  );
};

export default Initiatives;
