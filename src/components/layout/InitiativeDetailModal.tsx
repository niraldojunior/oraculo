import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  X, 
  Layers, 
  User, 
  Building2, 
  Clock,
  AlertCircle,
  MessageSquare,
  XCircle,
  Briefcase,
  Zap,
  LayoutGrid,
  Plus,
  Trash2,
  Loader2,
  Users,
  Lock,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
  Activity,
  ListTodo,
  Diamond,
  Edit2,
  UserPlus,
  Tag,
  Database,
  GripVertical,
  CalendarCheck
} from 'lucide-react';
import type { Initiative, Collaborator, System, MilestoneStatus, InitiativeType, BenefitType, InitiativeHistory, InitiativeMilestone, MilestoneTask } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StatusIcon } from '../common/StatusIcon';
import { PriorityIcon, PriorityPicker } from '../common/PriorityPicker';

interface InitiativeDetailModalProps {
  initiative: Initiative;
  allCollaborators: Collaborator[];
  allSystems: System[];
  onClose: () => void;
  onSave?: (updated: Initiative) => Promise<void>;
}

const InitiativeDetailModal: React.FC<InitiativeDetailModalProps> = ({ 
  initiative,
  allCollaborators, 
  allSystems,
  onClose,
  onSave
}) => {
  // Handled and defined below
  const { user } = useAuth();

  const [formData, setFormData] = useState<Initiative>({ 
    ...initiative,
    macroScope: initiative.macroScope || [''],
    memberIds: initiative.memberIds || [],
    createdById: initiative.createdById || user?.id
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState<{ top: number; left: number } | null>(null);

  const [activeTab, setActiveTab] = useState<'descricao' | 'escopo' | 'tarefas'>('descricao');
  const [activeMilestoneTaskViewId, setActiveMilestoneTaskViewId] = useState<string | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneText, setEditMilestoneText] = useState('');
  const [milestoneToDelete, setMilestoneToDelete] = useState<InitiativeMilestone | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [draggedMilestoneId, setDraggedMilestoneId] = useState<string | null>(null);
  const [draggedMilestoneSidebarId, setDraggedMilestoneSidebarId] = useState<string | null>(null);
  
  const benefitRef = useRef<HTMLTextAreaElement>(null);
  const rationaleRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement | null, minHeight: number = 24) => {
    if (textarea) {
      textarea.style.height = '0px'; 
      const scrollH = textarea.scrollHeight;
      // Use a smaller buffer for tasks (4px) vs document fields (12px)
      const buffer = minHeight > 30 ? 12 : 4;
      textarea.style.height = `${Math.max(scrollH + buffer, minHeight)}px`;
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      adjustTextareaHeight(benefitRef.current, 72);
      adjustTextareaHeight(rationaleRef.current, 72);
    };

    if (activeTab === 'descricao') {
      const timer = setTimeout(handleResize, 100);
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [activeTab, formData.benefit, formData.rationale, adjustTextareaHeight]);

  const allTasks = useMemo(() => {
    return (formData.milestones || []).flatMap(m => m.tasks || []);
  }, [formData.milestones]);

  const overallProgress = useMemo(() => {
    if (allTasks.length === 0) return 0;
    const doneTasksCount = allTasks.filter(t => t.status === 'Done').length;
    return Math.round((doneTasksCount / allTasks.length) * 100);
  }, [allTasks]);

  const handleTaskReorder = (milestoneId: string, sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    
    const milestone = (formData.milestones || []).find(m => m.id === milestoneId);
    if (!milestone || !milestone.tasks) return;
    
    const newTasks = [...milestone.tasks];
    const sourceIdx = newTasks.findIndex(t => t.id === sourceId);
    const targetIdx = newTasks.findIndex(t => t.id === targetId);
    
    if (sourceIdx === -1 || targetIdx === -1) return;
    
    const [movedTask] = newTasks.splice(sourceIdx, 1);
    newTasks.splice(targetIdx, 0, movedTask);
    
    const newList = (formData.milestones || []).map(m => 
      m.id === milestoneId ? { ...m, tasks: newTasks } : m
    );
    setFormData({ ...formData, milestones: newList });
  };

  const handleMilestoneReorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    
    const newMilestones = [...(formData.milestones || [])];
    const sourceIdx = newMilestones.findIndex(m => m.id === sourceId);
    const targetIdx = newMilestones.findIndex(m => m.id === targetId);
    
    if (sourceIdx === -1 || targetIdx === -1) return;
    
    const [movedMilestone] = newMilestones.splice(sourceIdx, 1);
    newMilestones.splice(targetIdx, 0, movedMilestone);
    
    setFormData({ ...formData, milestones: newMilestones });
  };


  const handleUpdateMilestoneName = () => {
    if (!editingMilestoneId || !editMilestoneText.trim()) {
      setEditingMilestoneId(null);
      return;
    }
    const list = (formData.milestones || []).map(m => 
      m.id === editingMilestoneId ? { ...m, name: editMilestoneText } : m
    );
    setFormData({ ...formData, milestones: list });
    setEditingMilestoneId(null);
  };

  const handleRemoveMilestone = (id: string) => {
    const milestone = (formData.milestones || []).find(m => m.id === id);
    if (milestone) {
      setMilestoneToDelete(milestone);
    }
  };

  const confirmDeleteMilestone = () => {
    if (!milestoneToDelete) return;
    setFormData({ 
      ...formData, 
      milestones: (formData.milestones || []).filter(m => m.id !== milestoneToDelete.id) 
    });
    setMilestoneToDelete(null);
    if (activeMilestoneTaskViewId === milestoneToDelete.id) {
      setActiveMilestoneTaskViewId(null);
    }
  };

  const handleTaskAdd = (milestoneId: string, initialName: string = 'Nova Tarefa') => {
    if (!initialName.trim()) return;
    const newTask: MilestoneTask = {
      id: `task_${Date.now()}`,
      name: initialName,
      status: 'Backlog',
      milestoneId
    };
    
    const list = (formData.milestones || []).map(m => {
      if (m.id === milestoneId) {
        return { ...m, tasks: [...(m.tasks || []), newTask] };
      }
      return m;
    });
    setFormData({ ...formData, milestones: list });
  };

  const handleTaskUpdate = (milestoneId: string, taskId: string, field: keyof MilestoneTask, val: any) => {
    const list = (formData.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedTasks = (m.tasks || []).map(t => t.id === taskId ? { ...t, [field]: val } : t);
        return { ...m, tasks: updatedTasks };
      }
      return m;
    });
    setFormData({ ...formData, milestones: list });
  };

  const handleTaskDelete = (milestoneId: string, taskId: string) => {
    const list = (formData.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedTasks = (m.tasks || []).filter(t => t.id !== taskId);
        return { ...m, tasks: updatedTasks };
      }
      return m;
    });
    setFormData({ ...formData, milestones: list });
  };

  // Linear sidebar accordions state
  const [openSections, setOpenSections] = useState({ properties: true, milestones: true, comentarios: true, history: false });
  const [newMilestoneName, setNewMilestoneName] = useState('');

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const demandantDirectorates = [
    'Operação FTTH',
    'Operação B2B/Atacado',
    'Comercial FTTH',
    'Comercial B2B/Atacado',
    'Engenharia',
    'TI',
    'Outros'
  ];


  // Deep comparison to detect changes
  const initialData = useMemo(() => ({
    ...initiative,
    macroScope: initiative.macroScope || ['']
  }), [initiative.id]);

  const handleCloseAttempt = useCallback(() => {
    if (showConfirmClose) {
      setShowConfirmClose(false);
      return;
    }

    const normalize = (obj: any) => {
      // Remove history and transient UI state from comparison
      const { history, ...rest } = obj;
      // Ensure arrays and strings are handled consistently for empty values
      return JSON.stringify(rest, (_, value) => {
        if (Array.isArray(value) && value.length === 0) return undefined;
        if (value === '' || value === null) return undefined;
        return value;
      });
    };

    const currentChanges = normalize(formData) !== normalize(initialData);

    if (currentChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }, [showConfirmClose, formData, initialData, onClose]);

  // Robust ESC key handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseAttempt();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleCloseAttempt]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case '1- Estratégico': return '#DC2626'; // Red-600
      case '2- Projeto': return '#2563EB';    // Blue-600
      case '3- Fast Track': return '#16A34A';  // Green-600
      default: return '#4B5563';
    }
  };

  const getActivityIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('comentário')) return <MessageSquare size={13} style={{ color: '#8B5CF6' }} />;
    if (act.includes('membro')) return <Users size={13} style={{ color: '#6B7280' }} />;
    if (act.includes('líder') || act.includes('owner')) return <User size={13} style={{ color: '#6B7280' }} />;
    if (act.includes('status') || act.includes('cancelado')) return <CheckCircle2 size={13} style={{ color: '#6B7280' }} />;
    if (act.includes('data')) return <Calendar size={13} style={{ color: '#6B7280' }} />;
    if (act.includes('prioridade')) return <AlertCircle size={13} style={{ color: '#6B7280' }} />;
    return <Activity size={13} style={{ color: '#6B7280' }} />;
  };

  const formatActionText = (action: string) => {
    if (action === 'Comentário') return 'adicionou um comentário';
    if (action.startsWith('Alterações: ')) return action.replace('Alterações: ', 'modificou ');
    if (action.startsWith('Edição rápida: ')) return action.replace('Edição rápida: ', '').toLowerCase();
    return action;
  };

  const getTypeIcon = (type: string, color?: string) => {
    const iconStyle = { color: color || 'inherit' };
    switch (type) {
      case '1- Estratégico': return <Zap size={20} style={iconStyle} />;
      case '2- Projeto': return <Briefcase size={20} style={iconStyle} />;
      case '3- Fast Track': return <Layers size={20} style={iconStyle} />;
      default: return <LayoutGrid size={20} style={iconStyle} />;
    }
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    return <StatusIcon status={status} size={16} />;
  };

  const renderAvatar = (collaboratorId: string | null | undefined, size: number = 20) => {
    const collaborator = allCollaborators.find(c => c.id === collaboratorId);
    if (!collaborator) return <div style={{ width: size, height: size, background: '#D1D5DB', borderRadius: '50%' }} />;
    
    if (collaborator.photoUrl) {
      return <img src={collaborator.photoUrl} alt={collaborator.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
    }
    
    const initials = collaborator.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div style={{ width: size, height: size, background: '#3B82F6', color: '#FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${size / 2.5}px`, fontWeight: 700 }}>
        {initials}
      </div>
    );
  };

  const isExecutingLeader = user?.id === formData.leaderId;
  const isRequester = user?.id === (formData as any).createdById;
  const isBacklog = formData.status === '1- Backlog';

  const handleSave = async (extraPayload?: Partial<Initiative>) => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const finalFormData = { ...formData, ...extraPayload };
      
      // Calculate diff for history
      const changes: string[] = [];
      const checkChange = (field: keyof Initiative, label: string) => {
        const oldVal = (initialData as any)[field];
        const newVal = (finalFormData as any)[field];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          if (field === 'leaderId') {
            const oldName = allCollaborators.find(c => c.id === oldVal)?.name || '-';
            const newName = allCollaborators.find(c => c.id === newVal)?.name || '-';
            changes.push(`Líder: ${oldName} → ${newName}`);
          } else if (field === 'status') {
            changes.push(`Status: ${oldVal} → ${newVal}`);
          } else if (field === 'priority') {
            const getPrioLabel = (p: any) => p === 1 ? 'Crítica' : p === 2 ? 'Alta' : p === 3 ? 'Média' : p === 4 ? 'Baixa' : 'Nenhuma';
            changes.push(`Prioridade: ${getPrioLabel(oldVal)} → ${getPrioLabel(newVal)}`);
          } else {
            changes.push(`${label} alterado`);
          }
        }
      };

      checkChange('status', 'Status');
      checkChange('priority', 'Prioridade');
      checkChange('leaderId', 'Líder');
      checkChange('executingDirectorate', 'Time');
      checkChange('customerOwner', 'Owner');
      checkChange('originDirectorate', 'Demandante');
      checkChange('title', 'Título');
      checkChange('benefit', 'Descrição');
      checkChange('memberIds', 'Membros');
      checkChange('macroScope', 'Escopo Macro');
      checkChange('milestones', 'Milestones');
      checkChange('actualEndDate', 'Fim Real');

      let payload = { ...finalFormData };

      if (changes.length > 0) {
        const historyItem: InitiativeHistory = {
          id: `h_save_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: (user as any)?.fullName || (user as any)?.name || 'Usuário',
          action: `Alterações: ${changes.join(', ')}`
        };
        payload.history = [...(payload.history || []), historyItem];
      }

      await onSave(payload);
    } catch (error) {
      console.error('Error saving initiative:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddRequirement = () => {
    const updated = { ...formData, macroScope: [...(formData.macroScope || []), ''] };
    setFormData(updated);
  };

  const handleUpdateRequirement = (index: number, val: string) => {
    const list = [...(formData.macroScope || [])];
    list[index] = val;
    setFormData({ ...formData, macroScope: list });
  };

  const handleRemoveRequirement = (index: number) => {
    const list = (formData.macroScope || []).filter((_, i) => i !== index);
    setFormData({ ...formData, macroScope: list });
  };

  const handleAddMilestone = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newMilestoneName.trim()) {
      e.preventDefault();
      const newM = {
        companyId: formData.companyId,
        departmentId: formData.departmentId,
        id: `m_${Date.now()}`,
        name: newMilestoneName.trim(),
        systemId: 'N/A',
        baselineDate: new Date().toISOString().split('T')[0]
      };
      setFormData({ ...formData, milestones: [...(formData.milestones || []), newM] });
      setNewMilestoneName('');
    }
  };


  const handleStatusChange = async (newStatus: MilestoneStatus, actionName: string, extra?: Partial<Initiative>) => {
    const historyItem: InitiativeHistory = {
      id: `h_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: (user as any)?.fullName || (user as any)?.name || 'Usuário',
      action: `${actionName}: Status alterado de ${formData.status} para ${newStatus}`,
      fromStatus: formData.status,
      toStatus: newStatus
    };

    const updated: Initiative = { 
      ...formData, 
      ...extra,
      status: newStatus,
      previousStatus: formData.status !== 'Suspenso' ? formData.status : formData.previousStatus,
      history: [...(formData.history || []), historyItem]
    };

    if (newStatus === '1- Backlog' && formData.status !== '1- Backlog') {
      updated.createdAt = '';
    }
    setFormData(updated);
    return updated;
  };

  const handleCancelClick = () => setShowConfirmCancel(true);

  const confirmCancel = async () => {
    setShowConfirmCancel(false);
    await handleStatusChange('Cancelado', 'Cancelar');
    onClose();
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    const newHistory: InitiativeHistory = {
      id: `h_comm_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: (user as any)?.fullName || (user as any)?.name || 'Usuário',
      action: 'Comentário',
      notes: comment
    };
    const updated = { ...formData, history: [...(formData.history || []), newHistory] };
    setFormData(updated);
    setComment('');
  };

  const handleUpdateComment = (id: string) => {
    if (!editCommentText.trim()) return;
    const list = (formData.history || []).map(h => 
      h.id === id ? { ...h, notes: editCommentText } : h
    );
    setFormData({ ...formData, history: list });
    setEditingHistoryId(null);
    setEditCommentText('');
  };

  const handleDeleteComment = (id: string) => {
    const list = (formData.history || []).filter(h => h.id !== id);
    setFormData({ ...formData, history: list });
  };

  const handleStartEditComment = (h: InitiativeHistory) => {
    setEditingHistoryId(h.id);
    setEditCommentText(h.notes || '');
  };

  const isNew = formData.id.startsWith('new_');
  const typeColor = getTypeColor(formData.type);
  
  const headerBg = typeColor;

  const headerTextColor = '#FFF';

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="trello-modal glass-panel" style={{ maxWidth: '1300px', width: '94%', background: '#EBEDF0', padding: '0', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '96vh', overflow: 'hidden' }}>
        {/* Header: [Icon/Badge] [Name] --- [Status] [Close] */}
        {/* Header: [Icon/Badge] [Name] --- [Status] [Close] */}
        <div style={{ display: 'flex', borderBottom: isBacklog ? '1px solid #D1D5DB' : '1px solid rgba(255,255,255,0.1)', background: headerBg, boxSizing: 'border-box', color: headerTextColor, transition: 'all 0.2s ease' }}>
          {/* Header Left - 70% (Matches Body Flex 7) */}
          <div style={{ 
            width: '70%',
            flexShrink: 0,
            flexGrow: 0,
            padding: '0.65rem 1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            borderRight: '1px solid transparent', 
            boxSizing: 'border-box',
            minWidth: 0 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>{getTypeIcon(formData.type, headerTextColor)}</div>
              <select 
                className="trello-select-small" 
                style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800, border: 'none', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', color: headerTextColor, borderRadius: '4px' }} 
                value={formData.type} 
                onChange={e => setFormData({ ...formData, type: e.target.value as InitiativeType })}
              >
                {(['1- Estratégico', '2- Projeto', '3- Fast Track'] as InitiativeType[]).map(t => <option key={t} value={t} style={{ color: '#000' }}>{t.includes('- ') ? t.split('- ')[1] : t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input 
                className="trello-title-input" 
                style={{ 
                  fontSize: '1.15rem', 
                  fontWeight: 800, 
                  color: headerTextColor, 
                  padding: isBacklog ? '0.3rem 0.6rem' : '0', 
                  background: isBacklog ? 'rgba(255,255,255,0.1)' : 'transparent', 
                  border: isBacklog ? '1px solid rgba(255,255,255,0.2)' : 'none', 
                  borderRadius: isBacklog ? '4px' : '0',
                  boxShadow: 'none',
                  width: '100%', 
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }} 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                placeholder="Nome da Iniciativa" 
              />
            </div>
          </div>

          {/* Header Right - 30% (Matches Body Flex 3) */}
          <div style={{ 
            width: '30%',
            flexShrink: 0,
            flexGrow: 0,
            padding: '0.65rem 1.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            justifyContent: 'flex-end',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {/* Removed redundant Prio and Etapa Atual info as they are now in the Properties sidebar */}
            </div>

            <button 
              onClick={handleCloseAttempt} 
              className="btn-icon" 
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: headerTextColor, padding: '0.3rem', alignSelf: 'center', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', background: '#FFFFFF', overflow: 'hidden', minHeight: 0 }}>
          {/* Left Column - Main Content (70%) */}
          <div style={{ width: '70%', flexShrink: 0, flexGrow: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #E5E7EB', boxSizing: 'border-box', overflowY: 'auto' }}>
            
            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '0 2.5rem', background: '#FAFAFA' }}>
              <button 
                onClick={() => setActiveTab('descricao')}
                style={{ padding: '1rem 0', marginRight: '2rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'descricao' ? '2px solid #2563EB' : '2px solid transparent', color: activeTab === 'descricao' ? '#2563EB' : '#4B5563', fontWeight: activeTab === 'descricao' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
              >
                Descrição
              </button>
              <button 
                onClick={() => setActiveTab('escopo')}
                style={{ padding: '1rem 0', marginRight: '2rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'escopo' ? '2px solid #2563EB' : '2px solid transparent', color: activeTab === 'escopo' ? '#2563EB' : '#4B5563', fontWeight: activeTab === 'escopo' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
              >
                Escopo
              </button>
              <button 
                onClick={() => {
                  setActiveTab('tarefas');
                  setActiveMilestoneTaskViewId(null);
                }}
                style={{ padding: '1rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === 'tarefas' ? '2px solid #2563EB' : '2px solid transparent', color: activeTab === 'tarefas' ? '#2563EB' : '#4B5563', fontWeight: activeTab === 'tarefas' ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}
              >
                Tarefas
              </button>
            </div>

            <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              {activeTab === 'descricao' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Document Style: Objective Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Objetivo</h2>
                    <textarea 
                      ref={benefitRef}
                      value={formData.benefit || ''} 
                      onChange={e => {
                        setFormData({ ...formData, benefit: e.target.value });
                        adjustTextareaHeight(e.target, 72);
                      }} 
                      placeholder="Pelo que estamos resolvendo? (O problema)" 
                      disabled={!isRequester && !isNew}
                      className="document-textarea"
                      style={{ overflow: 'hidden' }}
                    />
                  </div>

                  {/* Document Style: Expected Result / Rationale Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Resultado esperado</h2>
                    <textarea 
                      ref={rationaleRef}
                      value={formData.rationale || ''} 
                      onChange={e => {
                        setFormData({ ...formData, rationale: e.target.value });
                        adjustTextareaHeight(e.target, 72);
                      }} 
                      placeholder="Por que isso é importante? Qual o impacto esperado?" 
                      disabled={!isRequester && !isNew}
                      className="document-textarea"
                      style={{ overflow: 'hidden' }}
                    />
                  </div>

                  {/* Document Style: Benefit Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                    <Zap size={16} style={{ color: '#F59E0B' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.1rem' }}>Tipo de Benefício</div>
                      <select 
                        value={formData.benefitType || ''} 
                        onChange={e => setFormData({ ...formData, benefitType: e.target.value as BenefitType })} 
                        disabled={!isRequester && !isNew}
                        style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 600, color: '#111827', fontSize: '0.9rem', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="">Selecione...</option>
                        {['Aumento Receita', 'Redução Despesa', 'Redução Custos', 'Estratégico', 'Regulatório', 'Risco de Continuidade'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'escopo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="trello-field"><label><Layers size={13} /> Escopo Macro</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(formData.macroScope || []).map((req, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input style={{ flex: 1 }} value={req} onChange={e => handleUpdateRequirement(idx, e.target.value)} placeholder="Descreva aqui o requisito macro..." disabled={!isRequester && !isNew} />
                          {idx > 0 && (
                            <button onClick={() => handleRemoveRequirement(idx)} style={{ color: '#EF4444', border: 'none', background: 'transparent', cursor: 'pointer' }} disabled={!isRequester && !isNew}><Trash2 size={16} /></button>
                          )}
                        </div>
                      ))}
                      <button className="btn-trello-ghost" onClick={handleAddRequirement} disabled={!isRequester && !isNew} style={{ justifyContent: 'center', border: '1px dashed #D1D5DB', width: 'fit-content' }}><Plus size={14} /> Adicionar Requisito</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tarefas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', padding: '0 0.5rem', overflowY: 'auto' }}>
                  {/* General Progress Bar - Only if more than 1 milestone exists */}
                  {allTasks.length > 0 && !activeMilestoneTaskViewId && (formData.milestones || []).length > 1 && (
                    <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Progresso Geral</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366F1' }}>{overallProgress}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${overallProgress}%`, 
                          background: 'linear-gradient(90deg, #6366F1 0%, #818CF8 100%)',
                          borderRadius: '10px',
                          transition: 'width 0.4s ease-out'
                        }} />
                      </div>
                    </div>
                  )}

                  {(activeMilestoneTaskViewId 
                    ? (formData.milestones || []).filter(m => m.id === activeMilestoneTaskViewId)
                    : (formData.milestones || [])
                  ).map(milestone => {
                    const milestoneTasks = milestone.tasks || [];
                    const doneTasksCount = milestoneTasks.filter(t => t.status === 'Done').length;
                    const progress = milestoneTasks.length > 0 ? Math.round((doneTasksCount / milestoneTasks.length) * 100) : 0;
                    
                    return (
                      <div key={milestone.id} style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F4FB', paddingBottom: '0.2rem', marginBottom: '0.25rem', marginTop: '0.5rem' }}>
                          <h3 style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: 700, 
                            color: '#111827', 
                            margin: 0, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            <Diamond size={11} style={{ color: '#6366F1' }} /> {milestone.name}
                          </h3>
                          {milestoneTasks.length > 0 && (
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>{progress}%</span>
                          )}
                        </div>

                        {/* Milestone Progress Bar */}
                        {milestoneTasks.length > 0 && (
                          <div style={{ height: '3px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.5rem', width: '100%' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${progress}%`, 
                              background: progress === 100 ? '#10B981' : '#94A3B8',
                              transition: 'width 0.3s ease-out'
                            }} />
                          </div>
                        )}
                      
                      {((milestone.tasks || []).length === 0) && (
                        <div style={{ padding: '0.2rem 0.75rem', color: '#9CA3AF', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Nenhuma tarefa pendente.
                        </div>
                      )}

                      {(milestone.tasks || []).map(t => {
                        const taskAssignee = allCollaborators.find(c => c.id === t.assigneeId);
                        const hasDates = t.startDate || t.targetDate;
                        const formatDateLabel = (d?: string | null) => {
                          if (!d) return '';
                          const parts = d.split('-');
                          if (parts.length !== 3) return d;
                          const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                          return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
                        };
                        
                        return (
                          <div 
                            key={t.id} 
                            onMouseEnter={() => setHoveredTaskId(t.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                            draggable={true}
                            onDragStart={() => {
                              setDraggedTaskId(t.id);
                              setDraggedMilestoneId(milestone.id);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (draggedTaskId && draggedMilestoneId === milestone.id) {
                                handleTaskReorder(milestone.id, draggedTaskId, t.id);
                              }
                              setDraggedTaskId(null);
                              setDraggedMilestoneId(null);
                            }}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '0.4rem', 
                              padding: '0.1rem 0.6rem', 
                              borderRadius: '3px',
                              background: hoveredTaskId === t.id ? '#F1F5F9' : 'transparent',
                              opacity: draggedTaskId === t.id ? 0.4 : 1,
                              transition: 'all 0.1s ease',
                              border: '1px solid transparent',
                              borderColor: hoveredTaskId === t.id ? '#E2E8F0' : 'transparent',
                              minHeight: '26px',
                              cursor: 'default'
                            }}
                          >
                            <GripVertical 
                              size={14} 
                              style={{ 
                                color: '#CBD5E1', 
                                cursor: 'grab', 
                                opacity: hoveredTaskId === t.id ? 1 : 0,
                                marginLeft: '-0.4rem',
                                marginTop: '0.3rem', 
                                transition: 'opacity 0.1s',
                                flexShrink: 0
                              }} 
                            />
                            <input 
                              type="checkbox" 
                              checked={t.status === 'Done'}
                              onChange={(e) => handleTaskUpdate(milestone.id, t.id, 'status', e.target.checked ? 'Done' : 'Backlog')}
                              style={{ cursor: 'pointer', width: '0.85rem', height: '0.85rem', margin: 0, marginTop: '0.35rem', flexShrink: 0 }}
                            />
                            
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                              <textarea 
                                value={t.name}
                                onChange={(e) => handleTaskUpdate(milestone.id, t.id, 'name', e.target.value)}
                                onInput={(e) => adjustTextareaHeight(e.currentTarget as HTMLTextAreaElement, 20)}
                                ref={(el) => { if (el) adjustTextareaHeight(el, 20); }}
                                placeholder="Descrição da tarefa..."
                                rows={1}
                                style={{ 
                                  border: 'none', background: 'transparent', flex: 1, outline: 'none', 
                                  fontSize: '0.85rem', color: '#111827', textDecoration: t.status === 'Done' ? 'line-through' : 'none',
                                  opacity: t.status === 'Done' ? 0.6 : 1,
                                  padding: '0.1rem 0', // Compact padding
                                  minWidth: 0,
                                  resize: 'none',
                                  overflow: 'hidden',
                                  lineHeight: '1.5',
                                  fontFamily: 'inherit',
                                  fontWeight: 400
                                }}
                              />

                              {/* Persistent Info Badges */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                {t.type && (
                                  <span style={{ fontSize: '0.65rem', background: '#E0E7FF', color: '#4338CA', padding: '0 0.3rem', borderRadius: '3px', fontWeight: 600 }}>
                                    {t.type}
                                  </span>
                                )}
                                {taskAssignee && (
                                  <div title={taskAssignee.name} style={{ display: 'flex', alignItems: 'center' }}>
                                    {renderAvatar(taskAssignee.id, 16)}
                                  </div>
                                )}

                                {/* System Badge */}
                                {t.systemId && (
                                  <span style={{ 
                                    fontSize: '0.65rem', 
                                    padding: '0.1rem 0.35rem', 
                                    background: '#F0FDF4', 
                                    color: '#166534', 
                                    border: '1px solid #DCFCE7',
                                    borderRadius: '10px', 
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap',
                                    marginLeft: '0.2rem'
                                  }}>
                                    {allSystems.find(s => s.id === t.systemId)?.acronym || allSystems.find(s => s.id === t.systemId)?.name || 'SYS'}
                                  </span>
                                )}

                                {hasDates && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#64748B', fontSize: '0.75rem', fontWeight: 600, background: '#F1F5F9', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.2rem' }}>
                                    <Clock size={12} />
                                    <span>
                                      {t.startDate ? formatDateLabel(t.startDate) : ''}
                                      {t.startDate && t.targetDate ? ' → ' : ''}
                                      {t.targetDate ? formatDateLabel(t.targetDate) : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                                               {/* Hover Edit Tools (Trello Style Icons) */}
                            {hoveredTaskId === t.id && (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.1rem', 
                                animation: 'fadeIn 0.1s ease', 
                                background: '#F1F5F9', 
                                padding: '0 0.2rem',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                              }}>
                                
                                {/* 1. Assignee Tool */}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer', borderRadius: '3px' }} title="Atribuir Membro">
                                  <UserPlus size={14} style={{ color: '#4B5563' }} />
                                  <select 
                                    value={t.assigneeId || ''}
                                    onChange={(e) => handleTaskUpdate(milestone.id, t.id, 'assigneeId', e.target.value)}
                                    style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                  >
                                    <option value="">Ninguém</option>
                                    {(allCollaborators || [])
                                      .filter(c => formData.memberIds?.includes(c.id))
                                      .sort((a, b) => a.name.localeCompare(b.name))
                                      .map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                  </select>
                                </div>

                                {/* 2. Type Tool (Label) */}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer', borderRadius: '3px' }} title="Label (Tipo de entrega)">
                                  <Tag size={14} style={{ color: '#4B5563' }} />
                                  <select 
                                    value={t.type || ''}
                                    onChange={(e) => handleTaskUpdate(milestone.id, t.id, 'type', e.target.value)}
                                    style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                  >
                                    <option value="">Sem tipo</option>
                                    {['Feature', 'Melhoria', 'Bug', 'Debito Técnico', 'Enabler'].map(type => <option key={type} value={type}>{type}</option>)}
                                  </select>
                                </div>

                                {/* 3. System Selection Tool */}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '4px', cursor: 'pointer', borderRadius: '3px' }} title="Sistema Impactado">
                                  <Database size={14} style={{ color: '#4B5563' }} />
                                  <select 
                                    value={t.systemId || ''}
                                    onChange={(e) => handleTaskUpdate(milestone.id, t.id, 'systemId', e.target.value || null)}
                                    style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                  >
                                    <option value="">Nenhum Sistema</option>
                                    {(formData.impactedSystemIds || [])
                                      .map(sid => allSystems.find(s => s.id === sid))
                                      .filter((s): s is System => !!s)
                                      .sort((a, b) => a.name.localeCompare(b.name))
                                      .map(sys => (
                                        <option key={sys.id} value={sys.id}>{sys.name}{sys.acronym ? ` (${sys.acronym})` : ''}</option>
                                      ))}
                                  </select>
                                </div>

                                {/* 4. Start Date Tool */}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '6px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.1s' }} className="hover-bg-gray" title="Data Início">
                                  <Clock size={15} style={{ color: '#4B5563' }} />
                                  <input 
                                    type="date"
                                    value={t.startDate || ''}
                                    onChange={(e) => handleTaskUpdate(milestone.id, t.id, 'startDate', e.target.value)}
                                    title="Data Início"
                                    style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                  />
                                </div>

                                {/* 5. Target Date Tool (Data Fim) */}
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '6px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.1s' }} className="hover-bg-gray" title="Data Fim">
                                  <Calendar size={15} style={{ color: '#4B5563' }} />
                                  <input 
                                    type="date"
                                    value={t.targetDate || ''}
                                    onChange={(e) => handleTaskUpdate(milestone.id, t.id, 'targetDate', e.target.value)}
                                    title="Data Fim"
                                    style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                                  />
                                </div>

                                <div style={{ width: '1px', height: '18px', background: '#CBD5E1', margin: '0 4px' }} />

                                <button 
                                  onClick={() => handleTaskDelete(milestone.id, t.id)}
                                  style={{ color: '#EF4444', background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', opacity: 0.8, borderRadius: '4px', display: 'flex' }}
                                  title="Excluir tarefa"
                                  className="hover-bg-red"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.1rem 0.6rem', borderTop: '1px dashed #F1F5F9', marginTop: '0.1rem' }}>
                        <Plus size={12} color="#9CA3AF" />
                        <textarea 
                          defaultValue=""
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLTextAreaElement).value;
                              if (val.trim()) {
                                handleTaskAdd(milestone.id, val.trim());
                                (e.target as HTMLTextAreaElement).value = '';
                                adjustTextareaHeight(e.target as HTMLTextAreaElement, 20);
                              }
                            }
                          }}
                          onInput={(e) => adjustTextareaHeight(e.currentTarget as HTMLTextAreaElement, 20)}
                          placeholder="Nova tarefa..."
                          rows={1}
                          style={{ 
                            border: 'none', background: 'transparent', flex: 1, outline: 'none', 
                            fontSize: '0.85rem', color: '#111827',
                            resize: 'none',
                            overflow: 'hidden',
                            lineHeight: '1.5',
                            padding: '0.1rem 0',
                            fontFamily: 'inherit',
                            fontWeight: 400
                          }}
                        />
                      </div>
                        </div>
                      );
                    })}

                  {(formData.milestones || []).length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#9CA3AF', marginTop: '4rem', textAlign: 'center' }}>
                      <ListTodo size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: '#4B5563' }}>Mapeie seus Milestones</p>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', maxWidth: '300px' }}>
                        Adicione entregas no painel lateral para começar a gerenciar as tarefas por etapa.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Linear Accordions (30%) */}
          <div style={{ 
            width: '30%', 
            flexShrink: 0, 
            flexGrow: 0, 
            display: 'block', 
            background: '#F9FAFB', 
            overflowY: 'auto', 
            boxSizing: 'border-box', 
            padding: '1.25rem',
            maxHeight: '100%'
          }}>
            
            {/* Properties Accordion */}
            <div className="linear-sidebar-card" style={{ flexShrink: 0 }}>
              <button 
                onClick={() => toggleSection('properties')} 
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}
              >
                Propriedades {openSections.properties ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.properties && (
                <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  
                  {/* Status */}
                  <div className="linear-property">
                    <div className="linear-prop-label"><Clock size={14} /> Status</div>
                    <div className="linear-prop-value">
                      {editingField === 'status' ? (
                        <select 
                          autoFocus
                          value={formData.status}
                          onBlur={() => setEditingField(null)}
                          onChange={e => handleStatusChange(e.target.value as MilestoneStatus, 'Edição rápida')}
                          style={{ border: 'none', background: '#F1F5F9', fontSize: '0.8rem', padding: '2px 4px', borderRadius: '4px' }}
                        >
                          {['1- Backlog', '2- Discovery', '3- Planejamento', '4- Execução', '5- Implantação', '6- Concluído', 'Suspenso', 'Cancelado'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <div 
                          onClick={() => setEditingField('status')}
                          style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                        >
                          {getStatusIcon(formData.status)} {formData.status.split('- ')[1] || formData.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prioridade */}
                  <div className="linear-property">
                    <div className="linear-prop-label"><AlertCircle size={14} /> Prioridade</div>
                    <div className="linear-prop-value">
                      <div 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setShowPriorityMenu({ top: rect.top + rect.height + 5, left: rect.left });
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                      >
                        <PriorityIcon value={formData.priority} size={14} /> 
                        {formData.priority === 1 ? 'Crítica' : formData.priority === 2 ? 'Alta' : formData.priority === 3 ? 'Média' : formData.priority === 4 ? 'Baixa' : 'Nenhuma'}
                      </div>
                    </div>
                  </div>

                  {/* Demandante */}
                  <div className="linear-property">
                    <div className="linear-prop-label"><Building2 size={14} /> Demandante</div>
                    <div className="linear-prop-value">
                      {editingField === 'origin' ? (
                        <select 
                          autoFocus
                          value={formData.originDirectorate || ''}
                          onBlur={() => setEditingField(null)}
                          onChange={e => setFormData({ ...formData, originDirectorate: e.target.value })}
                          style={{ border: 'none', background: '#F1F5F9', fontSize: '0.8rem', padding: '2px 4px', width: '100%', borderRadius: '4px' }}
                        >
                          <option value="">Selecione...</option>
                          {demandantDirectorates.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      ) : (
                        <div onClick={() => setEditingField('origin')} style={{ cursor: 'pointer', width: '100%' }}>
                          {formData.originDirectorate || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="linear-property">
                    <div className="linear-prop-label"><User size={14} /> Owner</div>
                    <div className="linear-prop-value">
                      {editingField === 'owner' ? (
                        <input 
                          autoFocus
                          type="text"
                          value={formData.customerOwner || ''}
                          onBlur={() => setEditingField(null)}
                          onChange={e => setFormData({ ...formData, customerOwner: e.target.value })}
                          style={{ border: 'none', background: '#F1F5F9', fontSize: '0.8rem', padding: '2px 4px', width: '100%', borderRadius: '4px' }}
                        />
                      ) : (
                        <div onClick={() => setEditingField('owner')} style={{ cursor: 'pointer', width: '100%' }}>
                          {formData.customerOwner || '-'}
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Líder */}
                  <div className="linear-property">
                    <div className="linear-prop-label"><User size={14} /> Líder</div>
                    <div className="linear-prop-value">
                      {editingField === 'leader' ? (
                        <select 
                          autoFocus
                          value={formData.leaderId || ''}
                          onBlur={() => setEditingField(null)}
                          onChange={e => setFormData({ ...formData, leaderId: e.target.value })}
                          style={{ border: 'none', background: '#F1F5F9', fontSize: '0.8rem', padding: '2px 4px', borderRadius: '4px', width: '100%' }}
                        >
                          <option value="">Selecione...</option>
                          {allCollaborators.filter(c => ['Head', 'Director', 'Manager'].includes(c.role)).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div 
                          onClick={() => setEditingField('leader')}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%' }}
                        >
                          {renderAvatar(formData.leaderId)}
                          <span style={{ fontSize: '0.8rem' }}>{allCollaborators.find(c => c.id === formData.leaderId)?.name || '-'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Membros */}
                  <div className="linear-property" style={{ alignItems: 'flex-start', minHeight: 'auto' }}>
                    <div className="linear-prop-label" style={{ marginTop: '0.25rem' }}><Users size={14} /> Membros</div>
                    <div className="linear-prop-value" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {(formData.memberIds || []).map(mid => (
                          <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F3F4F6', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>
                            {renderAvatar(mid, 16)}
                            <span>{allCollaborators.find(c => c.id === mid)?.name.split(' ')[0]}</span>
                            <X size={10} style={{ cursor: 'pointer' }} onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, memberIds: (formData.memberIds || []).filter(id => id !== mid) });
                            }} />
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ display: 'flex', width: '100%' }}>
                        <select 
                          value=""
                          onChange={e => {
                            if (!e.target.value) return;
                            if (!(formData.memberIds || []).includes(e.target.value)) {
                              setFormData({ ...formData, memberIds: [...(formData.memberIds || []), e.target.value] });
                            }
                          }}
                          style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', color: '#6B7280', padding: 0, outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="">+ Adicionar Membro</option>
                          {allCollaborators
                            .filter(c => !(formData.memberIds || []).includes(c.id))
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Sistemas Envolvidos */}
                  <div className="linear-property" style={{ alignItems: 'flex-start', minHeight: 'auto', marginTop: '0.5rem' }}>
                    <div className="linear-prop-label" style={{ marginTop: '0.25rem' }}><Database size={14} /> Sistemas</div>
                    <div className="linear-prop-value" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {(formData.impactedSystemIds || []).map(sid => {
                          const sys = allSystems.find(s => s.id === sid);
                          return (
                            <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#EEF2FF', color: '#4F46E5', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', border: '1px solid #E0E7FF' }}>
                              <span style={{ fontWeight: 600 }}>{sys?.acronym || sys?.name || sid}</span>
                              <X size={10} style={{ cursor: 'pointer' }} onClick={(e) => {
                                e.stopPropagation();
                                setFormData({ ...formData, impactedSystemIds: (formData.impactedSystemIds || []).filter(id => id !== sid) });
                              }} />
                            </div>
                          );
                        })}
                      </div>
                      
                      <div style={{ display: 'flex', width: '100%' }}>
                        <select 
                          value=""
                          onChange={e => {
                            if (!e.target.value) return;
                            if (!(formData.impactedSystemIds || []).includes(e.target.value)) {
                              setFormData({ ...formData, impactedSystemIds: [...(formData.impactedSystemIds || []), e.target.value] });
                            }
                          }}
                          style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', color: '#6B7280', padding: 0, outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="">+ Adicionar Sistema</option>
                          {allSystems
                            .filter(s => !(formData.impactedSystemIds || []).includes(s.id))
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(s => (
                              <option key={s.id} value={s.id}>{s.name}{s.acronym ? ` (${s.acronym})` : ''}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="linear-property" style={{ marginTop: '0.5rem', paddingTop: '0.25rem' }}>
                    <div className="linear-prop-label"><Calendar size={14} /> Datas</div>
                    <div className="linear-prop-value" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                      <input 
                        type="date" 
                        value={formData.startDate || ''} 
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        disabled={(!isRequester && !isNew) || ['4- Execução', '5- Implantação', '6- Concluído', 'Suspenso', 'Cancelado'].includes(formData.status)}
                        style={{ border: 'none', background: 'transparent', color: '#111827', fontSize: '0.8rem', padding: 0, outline: 'none', cursor: ((isRequester || isNew) && !['4- Execução', '5- Implantação', '6- Concluído', 'Suspenso', 'Cancelado'].includes(formData.status)) ? 'pointer' : 'default', width: '90px' }}
                      />
                      <span style={{ color: '#9CA3AF' }}>→</span>
                      <input 
                        type="date" 
                        value={formData.endDate || ''} 
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        disabled={(!isRequester && !isNew) || ['4- Execução', '5- Implantação', '6- Concluído', 'Suspenso', 'Cancelado'].includes(formData.status)}
                        style={{ border: 'none', background: 'transparent', color: '#111827', fontSize: '0.8rem', padding: 0, outline: 'none', cursor: ((isRequester || isNew) && !['4- Execução', '5- Implantação', '6- Concluído', 'Suspenso', 'Cancelado'].includes(formData.status)) ? 'pointer' : 'default', width: '90px' }}
                      />
                    </div>
                  </div>

                  {/* Fim Real - Conditional visibility */}
                  {((['4- Execução', '5- Implantação'].includes(formData.status)) || 
                    (['6- Concluído', 'Suspenso', 'Cancelado'].includes(formData.status) && formData.actualEndDate)) && (
                    <div className="linear-property">
                      <div className="linear-prop-label"><CalendarCheck size={14} /> Fim Real</div>
                      <div className="linear-prop-value">
                        <input 
                          type="date" 
                          value={formData.actualEndDate || ''} 
                          onChange={e => setFormData({ ...formData, actualEndDate: e.target.value })}
                          disabled={!['4- Execução', '5- Implantação'].includes(formData.status)}
                          style={{ 
                            border: 'none', 
                            background: 'transparent', 
                            color: formData.actualEndDate ? '#EF4444' : '#111827', 
                            fontWeight: formData.actualEndDate ? 800 : 400,
                            fontSize: '0.8rem', 
                            padding: 0, 
                            outline: 'none', 
                            cursor: ['4- Execução', '5- Implantação'].includes(formData.status) ? 'pointer' : 'default', 
                            width: '90px' 
                          }}
                        />
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Milestones Accordion */}
            <div className="linear-sidebar-card" style={{ flexShrink: 0 }}>
              <button 
                onClick={() => toggleSection('milestones')} 
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}
              >
                Milestones {openSections.milestones ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.milestones && (
                <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(formData.milestones || []).map((m) => (
                    <div 
                      key={m.id} 
                      draggable={!editingMilestoneId}
                      onDragStart={() => setDraggedMilestoneSidebarId(m.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedMilestoneSidebarId) {
                          handleMilestoneReorder(draggedMilestoneSidebarId, m.id);
                        }
                        setDraggedMilestoneSidebarId(null);
                      }}
                      onClick={() => {
                        if (editingMilestoneId === m.id) return;
                        setActiveTab('tarefas');
                        setActiveMilestoneTaskViewId(prev => prev === m.id ? null : m.id);
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem', 
                        background: activeMilestoneTaskViewId === m.id ? '#EFF6FF' : '#F9FAFB', 
                        padding: '0.4rem 0.6rem', 
                        borderRadius: '4px', 
                        border: activeMilestoneTaskViewId === m.id ? '1px solid #BFDBFE' : '1px solid #E5E7EB',
                        cursor: 'pointer',
                        opacity: draggedMilestoneSidebarId === m.id ? 0.4 : 1,
                        transition: 'all 0.1s ease',
                        position: 'relative'
                      }}
                    >
                      <GripVertical 
                        size={12} 
                        style={{ 
                          color: '#CBD5E1', 
                          cursor: 'grab', 
                          marginLeft: '-0.3rem',
                          flexShrink: 0
                        }} 
                      />
                      {editingMilestoneId === m.id ? (
                        <div style={{ display: 'flex', flex: 1, gap: '0.4rem', alignItems: 'center' }}>
                          <input 
                            autoFocus
                            value={editMilestoneText}
                            onChange={e => setEditMilestoneText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleUpdateMilestoneName();
                              if (e.key === 'Escape') setEditingMilestoneId(null);
                            }}
                            onBlur={handleUpdateMilestoneName}
                            style={{ flex: 1, border: '1px solid #3B82F6', borderRadius: '4px', fontSize: '0.8rem', padding: '2px 4px', outline: 'none' }}
                          />
                        </div>
                      ) : (
                        <>
                          <CheckCircle2 size={14} style={{ color: activeMilestoneTaskViewId === m.id ? '#3B82F6' : '#D1D5DB' }} />
                          <span style={{ fontSize: '0.8rem', color: '#374151', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.name}</span>
                          {(m.tasks || []).length > 0 && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', marginRight: '0.5rem' }}>
                              {Math.round(((m.tasks || []).filter(t => t.status === 'Done').length / (m.tasks || []).length) * 100)}%
                            </span>
                          )}
                          {(isRequester || isNew) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditingMilestoneId(m.id); 
                                  setEditMilestoneText(m.name);
                                }} 
                                title="Editar milestone"
                                style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleRemoveMilestone(m.id); 
                                }} 
                                title="Excluir milestone"
                                style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  
                  {(isRequester || isNew) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0 0.5rem' }}>
                      <Plus size={14} style={{ color: '#9CA3AF' }} />
                      <input 
                        type="text" 
                        placeholder="Adicionar milestone..." 
                        value={newMilestoneName}
                        onChange={e => setNewMilestoneName(e.target.value)}
                        onKeyDown={handleAddMilestone}
                        style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none', width: '100%', color: '#111827' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comentários Accordion */}
            <div className="linear-sidebar-card" style={{ flexShrink: 0 }}>
              <button 
                onClick={() => toggleSection('comentarios')} 
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}
              >
                Comentários {openSections.comentarios ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.comentarios && (
                <div style={{ padding: '0 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <textarea 
                    className="comment-textarea" 
                    placeholder="Adicione um comentário..." 
                    value={comment} 
                    onChange={e => setComment(e.target.value)} 
                    style={{ background: '#F9FAFB', minHeight: '60px', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '4px', border: '1px solid #D1D5DB' }} 
                  />
                  {comment && (
                    <div style={{ alignSelf: 'flex-end' }}>
                      <button className="btn-trello-primary" style={{ background: '#111827', color: '#FFF', padding: '0.4rem 1.25rem', fontSize: '0.75rem', minHeight: 'auto' }} onClick={handleAddComment}>Comentar</button>
                    </div>
                  )}

                  <div className="activity-list" style={{ marginTop: '0.5rem', gap: '0.75rem' }}>
                    {(formData.history || [])
                      .filter(h => h.action === 'Comentário')
                      .slice().reverse().map(h => (
                      <div key={h.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div className="avatar-placeholder" style={{ background: '#3B82F6', color: '#FFF', width: '24px', height: '24px', fontSize: '0.65rem' }}>
                          {(h.user || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: '0.75rem', color: '#4B5563', lineHeight: 1.4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>{h.user || 'Usuário'}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>{new Date(h.timestamp).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}</span>
                              {(((user as any)?.fullName || (user as any)?.name) === h.user) && editingHistoryId !== h.id && (
                                <>
                                  <button 
                                    onClick={() => handleStartEditComment(h)}
                                    title="Editar comentário"
                                    style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(h.id)}
                                    title="Excluir comentário"
                                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {editingHistoryId === h.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <textarea 
                                value={editCommentText}
                                onChange={e => setEditCommentText(e.target.value)}
                                style={{ width: '100%', minHeight: '60px', fontSize: '0.75rem', padding: '0.4rem', borderRadius: '4px', border: '1px solid #3B82F6', outline: 'none' }}
                                autoFocus
                              />
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => setEditingHistoryId(null)}
                                  style={{ background: '#F3F4F6', color: '#4B5563', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }}
                                >
                                  Cancelar
                                </button>
                                <button 
                                  onClick={() => handleUpdateComment(h.id)}
                                  style={{ background: '#111827', color: '#FFF', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }}
                                >
                                  Salvar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{h.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* History Accordion */}
            <div className="linear-sidebar-card" style={{ display: 'flex', flexDirection: 'column', marginBottom: 0, flexShrink: 0 }}>
              <button 
                onClick={() => toggleSection('history')} 
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#374151' }}
              >
                Histórico {openSections.history ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.history && (
                <div style={{ padding: '0 1rem 1rem 1rem', flex: 1 }}>
                  <div className="activity-list" style={{ marginTop: 0 }}>
                    {(formData.history || [])
                      .filter(h => h.action !== 'Comentário')
                      .slice().reverse().map(h => (
                      <div key={h.id} className="activity-item" style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.8rem', alignItems: 'flex-start' }}>
                        <div style={{ paddingTop: '0.15rem' }}>
                          {getActivityIcon(h.action)}
                        </div>
                        <div className="activity-content" style={{ flex: 1, minWidth: 0, fontSize: '0.75rem', color: '#4B5563', lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{h.user || 'Usuário'}</span>
                          {' '}
                          {formatActionText(h.action)}
                          {' · '}
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600 }}>{new Date(h.timestamp).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}</span>
                          
                          {h.notes && (
                            <div className="activity-comment-box" style={{ 
                              marginTop: '0.3rem', 
                              padding: h.action === 'Comentário' ? '0.5rem 0.6rem' : '0', 
                              background: h.action === 'Comentário' ? '#F3F4F6' : 'transparent', 
                              color: h.action === 'Comentário' ? '#111827' : '#6B7280',
                              border: h.action === 'Comentário' ? '1px solid #E5E7EB' : 'none',
                              borderRadius: '6px',
                              fontStyle: h.action === 'Comentário' ? 'normal' : 'italic'
                            }}>
                              {h.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid #D1D5DB', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderRadius: '0 0 12px 12px' }}>
             {/* Left Actions - Destructive */}
             <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(isRequester || isNew || (isBacklog && isExecutingLeader)) && (
                <button onClick={handleCancelClick} className="btn-trello-ghost" style={{ color: '#EF4444', border: '1px solid #FEE2E2', background: '#FFF' }}>
                  <XCircle size={15} /> Cancelar Iniciativa
                </button>
              )}
             </div>

             {/* Right Actions - Progression */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {(isRequester || isExecutingLeader || isNew) ? (
                  <>
                    <button onClick={async () => { await handleSave(); onClose(); }} className="btn-trello" style={{ background: '#091E42' }} disabled={isSaving}>
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', color: '#64748B', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid #E2E8F0' }}>
                    <Lock size={15} /> SOMENTE LEITURA
                  </div>
                )}
              </div>
        </div>

        <style>{`
          .trello-modal input, .trello-modal select, .trello-modal textarea { padding: 0.65rem; border: 1px solid #D1D5DB; background: #FFFFFF; font-size: 0.85rem; outline: none; transition: border-color 0.2s; }
          .trello-modal input:focus, .trello-modal select:focus, .trello-modal textarea:focus { border-color: #3B82F6; }
          .trello-field label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem; font-weight: 800; color: #4B5563; text-transform: uppercase; }
          .trello-title-input { width: 100%; font-size: 1.5rem; font-weight: 700; color: #172B4D; background: transparent; border: none !important; outline: none; }
          .trello-field { display: flex; flex-direction: column; gap: 0.4rem; }
          .btn-trello { padding: 0.6rem 1.25rem; border: none; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 6px; color: white; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .btn-trello:hover:not(:disabled) { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
          .btn-trello:active:not(:disabled) { transform: translateY(0); }
          .btn-trello:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
          .btn-trello-primary { background: #2563EB; color: white; }
          .btn-trello-ghost { padding: 0.6rem 1.1rem; background: #FFFFFF; color: #475569; border: 1px solid #E2E8F0; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; border-radius: 6px; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .btn-trello-ghost:hover:not(:disabled) { background: #F8FAFC; color: #1E293B; border-color: #CBD5E1; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          
          /* Linear Style Sidebar Cards */
          .linear-sidebar-card { 
            border: 1px solid #E5E7EB; 
            border-radius: 8px; 
            background: #FFFFFF; 
            margin-bottom: 0.75rem; 
            overflow: hidden; 
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          }
          .linear-sidebar-card:hover { 
            border-color: #CBD5E1; 
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); 
          }

          .linear-property { display: flex; align-items: flex-start; justify-content: flex-start; padding: 0.35rem 0; min-height: 24px; }
          .linear-prop-label { display: flex; align-items: center; gap: 0.5rem; color: #6B7280; font-size: 0.75rem; width: 100px; flex-shrink: 0; padding-top: 2px; }
          .linear-prop-value { flex: 1; display: flex; flex-wrap: wrap; justify-content: flex-start; color: #111827; font-size: 0.8rem; min-width: 0; text-align: left; }
          .avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; background: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: #FFF; flex-shrink: 0; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2); }
          .comment-textarea { width: 100%; min-height: 40px; padding: 0.75rem; border-radius: 4px; border: 1px solid #D1D5DB; font-size: 0.85rem; resize: vertical; outline: none; }
          .activity-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
          .activity-item { display: flex; gap: 0.75rem; }
          .user-name { font-size: 0.85rem; font-weight: 700; color: #172B4D; }
          .timestamp { font-size: 0.7rem; color: #6B7280; margin-left: 0.5rem; }
          .activity-comment-box { padding: 0.75rem; background: #FFFFFF; border: 1px solid #E5E7EB; font-size: 0.85rem; line-height: 1.5; border-radius: 4px; }
          .activity-log { font-size: 0.8rem; color: #6B7280; font-style: italic; }

          .confirm-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000001;
            backdrop-filter: blur(2px);
          }
          .confirm-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            width: 400px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            text-align: center;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }

          .document-textarea {
            width: 100%;
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
            font-size: 0.95rem !important;
            line-height: 1.6 !important;
            color: #374151 !important;
            resize: none !important;
            outline: none !important;
          }
          .document-textarea:focus { border: none !important; }

          .document-milestone-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            background: #FFFFFF;
            border: 1px solid transparent;
            border-radius: 8px;
            transition: all 0.2s;
            cursor: pointer;
          }
          .document-milestone-item:hover {
            background: #F9FAFB;
            border-color: #E5E7EB;
          }
          .hover-bg-gray:hover {
            background: #E2E8F0 !important;
          }
          .hover-bg-red:hover {
            background: #FEE2E2 !important;
            color: #DC2626 !important;
          }
        `}</style>

        {showConfirmClose && (
          <div className="confirm-overlay">
            <div className="confirm-card">
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#FEE2E2', borderRadius: '50%', color: '#EF4444' }}>
                  <AlertCircle size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Alterações não salvas</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                  Você tem certeza que deseja fechar? Todos os dados alterados serão perdidos.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-trello-ghost" style={{ background: '#F3F4F6', color: '#374151', flex: 1, borderRadius: '24px' }} onClick={() => setShowConfirmClose(false)}>
                  Continuar Editando
                </button>
                <button className="btn-trello-primary" style={{ background: '#EF4444', color: '#FFF', flex: 1, borderRadius: '24px' }} onClick={onClose}>
                  Descartar e Sair
                </button>
              </div>
            </div>
          </div>
        )}
        {showConfirmCancel && (
          <div className="confirm-overlay">
            <div className="confirm-card">
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#FEE2E2', borderRadius: '50%', color: '#EF4444' }}>
                  <AlertCircle size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Atenção! Cancelar Iniciativa</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                  Tem certeza que deseja cancelar esta demanda? Esta ação é irreversível e será registrada no histórico.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-trello-ghost" style={{ background: '#F3F4F6', color: '#374151', flex: 1 }} onClick={() => setShowConfirmCancel(false)}>
                  Voltar
                </button>
                <button className="btn-trello-primary" style={{ background: '#EF4444', color: '#FFF', flex: 1 }} onClick={confirmCancel}>
                  Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        )}



        {milestoneToDelete && (
          <div className="confirm-overlay">
            <div className="confirm-card">
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#FEE2E2', borderRadius: '50%', color: '#EF4444' }}>
                  <Trash2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Excluir Milestone</h3>
                <div style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                  Tem certeza que deseja excluir o milestone <strong style={{ color: '#111827' }}>"{milestoneToDelete.name}"</strong>?
                  <p style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '4px', color: '#C2410C', fontSize: '0.8rem' }}>
                    <AlertCircle size={12} style={{ marginRight: '4px' }} />
                    Todas as tarefas associadas a este milestone também serão removidas.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-trello-ghost" style={{ background: '#F3F4F6', color: '#374151', flex: 1 }} onClick={() => setMilestoneToDelete(null)}>
                  Voltar
                </button>
                <button className="btn-trello-primary" style={{ background: '#EF4444', color: '#FFF', flex: 1 }} onClick={confirmDeleteMilestone}>
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        )}
        {showPriorityMenu && (
          <PriorityPicker
            value={formData.priority || 0}
            position={showPriorityMenu || undefined}
            onSelect={(val) => setFormData({ ...formData, priority: val })}
            onClose={() => setShowPriorityMenu(null)}
          />
        )}
      </div>
    </div>
  );
};

export default InitiativeDetailModal;

