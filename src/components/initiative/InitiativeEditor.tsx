import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit2,
  FileText,
  CheckSquare,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Trash2,
  Upload,
  Download,
  List,
  Rows3,
  SlidersHorizontal,
  Circle,
  Clock,
  Eye,
  Check,
  X as XIcon,
  Minus
} from 'lucide-react';
import type {
  Initiative,
  Collaborator,
  System,
  MilestoneStatus,
  InitiativeHistory,
  InitiativeMilestone,
  MilestoneTask,
  MilestoneTaskType,
  TaskStatus,
  ClientTeam,
} from '../../types';
import { TASK_STATUS_ORDER } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PriorityPicker, PRIORITY_OPTIONS } from '../common/PriorityPicker';
import { InitiativeIndicators, InitiativeProperties, InitiativeMilestones, renderAvatar } from '../initiative/SidebarComponents';
import { InitiativeTaskBoard, TaskEditModal } from './InitiativeTaskBoard';
import { useView } from '../../context/ViewContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

type ImportChange =
  | { type: 'createMilestone'; milestoneId: string; milestoneName: string }
  | { type: 'create'; milestoneId: string; taskData: Omit<MilestoneTask, 'id'> }
  | { type: 'update'; milestoneId: string; taskId: string; fields: Partial<MilestoneTask> };

interface InitiativeEditorProps {
  initiative: Initiative;
  allCollaborators: Collaborator[];
  allSystems: System[];
  onSave?: (updated: Initiative) => Promise<void>;
}

const ScopeEditor: React.FC<{ value: string; onChange: (html: string) => void }> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const ToolbarBtn = ({ onClick, active, title, children }: { onClick: () => void; active: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        padding: '3px 8px', border: 'none', borderRadius: '4px', cursor: 'pointer',
        background: active ? '#E2E8F0' : 'transparent',
        color: active ? '#1E293B' : '#64748B',
        fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.4,
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="scope-editor">
      <div style={{ display: 'flex', gap: '2px', padding: '4px 6px', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', flexWrap: 'wrap', alignItems: 'center' }}>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito (Ctrl+B)"><b>N</b></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico (Ctrl+I)"><i>I</i></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado (Ctrl+U)"><u>S</u></ToolbarBtn>
        <div style={{ width: '1px', height: '16px', background: '#E2E8F0', margin: '0 4px' }} />
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista com bullets">• Bullets</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">1. Numerada</ToolbarBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

const getTypeColor = (type: string) => {
  switch (type) {
    case '1- Estratégico': return '#EF4444';
    case '2- Projeto': return '#3B82F6';
    case '3- Fast Track': return '#10B981';
    default: return '#64748B';
  }
};

const parseDateSafe = (dateStr?: string | Date | null) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return Number.isNaN(dateStr.getTime()) ? null : dateStr;
  }
  const normalized = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
  const parts = normalized.split('-');
  if (parts.length === 3) {
    const parsed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatShortDate = (dateStr?: string | Date | null) => {
  if (!dateStr) return '';
  const date = parseDateSafe(dateStr);
  if (!date) return '';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

const getBarIcon = (status: TaskStatus | undefined, size: number): React.ReactNode => {
  const s = Math.max(7, size);
  switch (status) {
    case 'Done':        return <Check size={s} color="#FFFFFF" strokeWidth={2.5} />;
    case 'In Review':   return <Eye size={s} color="#FFFFFF" strokeWidth={2.5} />;
    case 'In Progress': return <Clock size={s} color="#78350F" strokeWidth={2.5} />;
    case 'Todo':        return <Circle size={s} color="#94A3B8" strokeWidth={2} />;
    case 'Canceled':    return <XIcon size={s} color="#94A3B8" strokeWidth={2.5} />;
    default:            return <Minus size={s} color="#94A3B8" strokeWidth={2} />;
  }
};

const getTaskTimelineBarStyle = (status?: TaskStatus): React.CSSProperties => {
  switch (status) {
    case 'In Progress':
      return { background: '#F59E0B', border: '1px solid #D97706' };
    case 'In Review':
      return { background: '#10B981', border: '1px solid #059669' };
    case 'Done':
      return { background: '#3B82F6', border: '1px solid #2563EB' };
    case 'Backlog':
    case 'Todo':
    default:
      return { background: '#FFFFFF', border: '1px solid #CBD5E1' };
  }
};

const getExternalLinkMeta = (type?: string) => {
  switch (type) {
    case 'Azure':
      return { label: 'Azure', short: 'Az', background: '#DBEAFE', color: '#1D4ED8', kind: 'azure' as const };
    case 'Jira':
      return { label: 'Jira', short: 'Ji', background: '#E0E7FF', color: '#4338CA', kind: 'text' as const };
    default:
      return { label: type || 'Outra ferramenta', short: 'Ln', background: '#F1F5F9', color: '#475569', kind: 'text' as const };
  }
};

const normalizeExternalUrl = (url?: string) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const InitiativeEditor: React.FC<InitiativeEditorProps> = ({ 
  initiative,
  allCollaborators, 
  allSystems,
  onSave
}) => {
  const { user } = useAuth();
  const { setHeaderContent } = useView();

  const [formData, setFormData] = useState<Initiative>({ 
    ...initiative,
    macroScope: initiative.macroScope || [''],
    memberIds: initiative.memberIds || [],
    createdById: (initiative as any).createdById || user?.id
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState<{ top: number; left: number } | null>(null);

  const [activeTab, setActiveTab] = useState<'descricao' | 'tarefas'>('descricao');
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMilestoneTaskViewId, setActiveMilestoneTaskViewId] = useState<string | null>(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneText, setEditMilestoneText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [milestoneToDelete, setMilestoneToDelete] = useState<InitiativeMilestone | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'timeline'>('list');
  const [taskTimelineZoom, setTaskTimelineZoom] = useState(1);
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(new Set());
  const [hoveredTimelineTask, setHoveredTimelineTask] = useState<{
    task: MilestoneTask & { milestoneName?: string };
    x: number;
    y: number;
  } | null>(null);
  const [timelineEditingTask, setTimelineEditingTask] = useState<{ milestoneId: string; task: MilestoneTask } | null>(null);
  const [externalLinkDraft, setExternalLinkDraft] = useState({
    type: initiative.externalLinkType || 'Azure',
    name: initiative.externalLinkName || '',
    url: initiative.externalLinkUrl || ''
  });
  const [openTaskMenu, setOpenTaskMenu] = useState<'arquivo' | 'filtro' | 'exibir' | null>(null);
  const [openFilterSubmenu, setOpenFilterSubmenu] = useState<'status' | 'responsavel' | 'risco' | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus[]>([]);
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>('all');
  const [taskRiskFilter, setTaskRiskFilter] = useState<'all' | 'late' | 'at-risk' | 'not-started'>('all');
  const benefitRef = useRef<HTMLTextAreaElement>(null);
  const rationaleRef = useRef<HTMLTextAreaElement>(null);
  const toolbarMenuRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const barResizeDragRef = useRef<{
    taskId: string;
    milestoneId: string;
    handle: 'left' | 'right';
    startX: number;
    initDateStr: string;
    totalDays: number;
    containerWidth: number;
  } | null>(null);
  const [barResizePreview, setBarResizePreview] = useState<{ taskId: string; startDate?: string; endDate?: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTaskUpdateRef = useRef<(...args: any[]) => void>(() => {});

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement | null, minHeight: number = 28) => {
    if (textarea) {
      textarea.style.height = '0px';
      const scrollH = textarea.scrollHeight;
      textarea.style.height = `${Math.max(scrollH, minHeight)}px`;
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      adjustTextareaHeight(benefitRef.current, 28);
      adjustTextareaHeight(rationaleRef.current, 28);
    };

    if (activeTab === 'descricao') {
      const timer = setTimeout(handleResize, 50);
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [activeTab, formData.benefit, formData.rationale, adjustTextareaHeight]);
  useEffect(() => {
    if (formData.title) {
      document.title = `${formData.title} | Oráculo`;
    }
  }, [formData.title]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = barResizeDragRef.current;
      if (!drag) return;
      const pxPerDay = drag.containerWidth / drag.totalDays;
      const deltaDays = Math.round((e.clientX - drag.startX) / pxPerDay);
      const initDate = new Date(drag.initDateStr);
      const newDate = new Date(initDate);
      newDate.setDate(newDate.getDate() + deltaDays);
      const newDateStr = newDate.toISOString().slice(0, 10);
      setBarResizePreview(prev => ({
        taskId: drag.taskId,
        ...(drag.handle === 'left'
          ? { startDate: newDateStr, endDate: prev?.taskId === drag.taskId ? prev.endDate : undefined }
          : { endDate: newDateStr, startDate: prev?.taskId === drag.taskId ? prev.startDate : undefined }),
      }));
    };
    const onMouseUp = (e: MouseEvent) => {
      const drag = barResizeDragRef.current;
      if (!drag) return;
      const pxPerDay = drag.containerWidth / drag.totalDays;
      const deltaDays = Math.round((e.clientX - drag.startX) / pxPerDay);
      const initDate = new Date(drag.initDateStr);
      const newDate = new Date(initDate);
      newDate.setDate(newDate.getDate() + deltaDays);
      const newDateStr = newDate.toISOString().slice(0, 10);
      const field = drag.handle === 'left' ? 'startDate' : 'targetDate';
      handleTaskUpdateRef.current(drag.milestoneId, drag.taskId, field, newDateStr);
      barResizeDragRef.current = null;
      setBarResizePreview(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarMenuRef.current && !toolbarMenuRef.current.contains(event.target as Node)) {
        setOpenTaskMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterableCollaborators = useMemo(() => {
    const scoped = allCollaborators.filter(c => (formData.memberIds || []).includes(c.id));
    return scoped.length > 0 ? scoped : allCollaborators;
  }, [allCollaborators, formData.memberIds]);

  const activeTaskFilterCount = [taskStatusFilter.length > 0, taskAssigneeFilter !== 'all', taskRiskFilter !== 'all'].filter(Boolean).length;

  const showTimelineTooltip = useCallback((event: React.MouseEvent, task: MilestoneTask & { milestoneName?: string }) => {
    setHoveredTimelineTask({
      task,
      x: Math.min(window.innerWidth - 320, event.clientX + 18),
      y: Math.min(window.innerHeight - 180, event.clientY + 18),
    });
  }, []);

  const hideTimelineTooltip = useCallback(() => setHoveredTimelineTask(null), []);

  const filteredTimelineTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (formData.milestones || []).flatMap((milestone, milestoneIndex) =>
      (milestone.tasks || [])
        .filter(task => {
          if (taskStatusFilter.length > 0 && !taskStatusFilter.includes(task.status || 'Backlog')) return false;
          if (taskAssigneeFilter === 'unassigned' && task.assigneeId) return false;
          if (taskAssigneeFilter !== 'all' && taskAssigneeFilter !== 'unassigned' && task.assigneeId !== taskAssigneeFilter) return false;

          const target = parseDateSafe(task.targetDate || null);
          const start = parseDateSafe(task.startDate || null);
          const diffDays = target ? Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
          const effectiveStart = start || target;

          if (taskRiskFilter === 'late') {
            if (!target || task.status === 'Done' || target.getTime() >= today.getTime()) return false;
          }
          if (taskRiskFilter === 'at-risk') {
            if (task.status === 'Done' || diffDays === null || diffDays < 0 || diffDays > 7) return false;
          }
          if (taskRiskFilter === 'not-started') {
            if (!(task.status === 'Backlog' || task.status === 'Todo') || effectiveStart !== null) return false;
          }

          return true;
        })
        .map((task, taskIndex) => ({
          ...task,
          milestoneName: milestone.name,
          milestoneIndex,
          taskIndex,
        }))
    );
  }, [formData.milestones, taskStatusFilter, taskAssigneeFilter, taskRiskFilter]);

  const openExternalLinkModal = useCallback(() => {
    setExternalLinkDraft({
      type: formData.externalLinkType || 'Azure',
      name: formData.externalLinkName || '',
      url: formData.externalLinkUrl || ''
    });
    setShowExternalLinkModal(true);
  }, [formData.externalLinkName, formData.externalLinkType, formData.externalLinkUrl]);

  const saveExternalLink = useCallback(() => {
    const normalizedUrl = normalizeExternalUrl(externalLinkDraft.url);
    setFormData(prev => ({
      ...prev,
      externalLinkType: externalLinkDraft.type || 'Outra ferramenta',
      externalLinkName: externalLinkDraft.name.trim(),
      externalLinkUrl: normalizedUrl
    }));
    setShowExternalLinkModal(false);
  }, [externalLinkDraft]);

  const handleMilestoneReorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const newMilestones = [...(formData.milestones || [])];
    const sourceIdx = newMilestones.findIndex(m => m.id === sourceId);
    const targetIdx = newMilestones.findIndex(m => m.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;
    const [movedMilestone] = newMilestones.splice(sourceIdx, 1);
    newMilestones.splice(targetIdx, 0, movedMilestone);
    setFormData({ ...formData, milestones: newMilestones.map((m, index) => ({ ...m, order: index })) });
  };

  const handleUpdateMilestoneName = () => {
    if (!editingMilestoneId || !editMilestoneText.trim()) {
      setEditingMilestoneId(null);
      return;
    }
    const list = (formData.milestones || []).map(m => m.id === editingMilestoneId ? { ...m, name: editMilestoneText } : m);
    setFormData({ ...formData, milestones: list });
    setEditingMilestoneId(null);
  };

  const handleRemoveMilestone = (id: string) => {
    const milestone = (formData.milestones || []).find(m => m.id === id);
    if (milestone) setMilestoneToDelete(milestone);
  };

  const confirmDeleteMilestone = () => {
    if (!milestoneToDelete) return;
    setFormData({ ...formData, milestones: (formData.milestones || []).filter(m => m.id !== milestoneToDelete.id) });
    setMilestoneToDelete(null);
    if (activeMilestoneTaskViewId === milestoneToDelete.id) setActiveMilestoneTaskViewId(null);
  };

  const handleTaskAdd = (milestoneId: string, initialName: string = 'Nova Tarefa') => {
    if (!initialName.trim()) return;
    const milestone = (formData.milestones || []).find(m => m.id === milestoneId);
    const nextOrder = milestone?.tasks?.length || 0;
    const newTask: MilestoneTask = { id: `task_${Date.now()}`, name: initialName, status: 'Backlog', milestoneId, order: nextOrder };
    const list = (formData.milestones || []).map(m => {
      if (m.id === milestoneId) return { ...m, tasks: [...(m.tasks || []), newTask] };
      return m;
    });
    const updated = { ...formData, milestones: list };
    setFormData(updated);
  };

  const handleTaskUpdate = (milestoneId: string, taskId: string, field: string, val: any) => {
    const list = (formData.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedTasks = (m.tasks || []).map(t => {
          if (t.id !== taskId) return t;
          const updates: any = (field === '__textFields' && val && typeof val === 'object')
            ? { ...val }
            : { [field]: val };
          // keep systemId in sync with systemIds
          if (Object.prototype.hasOwnProperty.call(updates, 'systemIds')) {
            updates.systemId = Array.isArray(updates.systemIds) && updates.systemIds.length > 0 ? updates.systemIds[0] : null;
          }
          return { ...t, ...updates };
        });
        return { ...m, tasks: updatedTasks };
      }
      return m;
    });
    const updated = { ...formData, milestones: list };
    setFormData(updated);
  };
  handleTaskUpdateRef.current = handleTaskUpdate;

  const handleTaskDelete = (milestoneId: string, taskId: string) => {
    const list = (formData.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const updatedTasks = (m.tasks || []).filter(t => t.id !== taskId);
        return { ...m, tasks: updatedTasks };
      }
      return m;
    });
    const updated = { ...formData, milestones: list };
    setFormData(updated);
  };
  const handleBulkImport = (changes: { type: 'createMilestone' | 'create' | 'update'; milestoneId: string; milestoneName?: string; taskId?: string; taskData?: any; fields?: any }[]) => {
    let updated = { ...formData, milestones: [...(formData.milestones || [])] };
    for (const change of changes) {
      if (change.type === 'createMilestone') {
        const newMilestone: InitiativeMilestone = {
          id: change.milestoneId,
          name: change.milestoneName || 'Novo Milestone',
          companyId: formData.companyId,
          departmentId: formData.departmentId,
          tasks: []
        };
        updated = { ...updated, milestones: [...updated.milestones, newMilestone] };
      } else if (change.type === 'create') {
        const newTask: MilestoneTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          ...change.taskData
        };
        updated = {
          ...updated,
          milestones: updated.milestones.map(m =>
            m.id === change.milestoneId
              ? { ...m, tasks: [...(m.tasks || []), newTask] }
              : m
          )
        };
      } else if (change.type === 'update' && change.taskId) {
        updated = {
          ...updated,
          milestones: updated.milestones.map(m =>
            m.id === change.milestoneId
              ? {
                  ...m,
                  tasks: (m.tasks || []).map(t =>
                    t.id === change.taskId ? { ...t, ...change.fields } : t
                  )
                }
              : m
          )
        };
      }
    }
    setFormData(updated);
  };

  const exportToExcel = () => {
    const headers = ['Milestone', 'Tarefa', 'Status', 'Prioridade', 'Tipo', 'Responsável', 'Sistemas', 'Data Início', 'Data Fim', 'Observação'];
    const rows: (string | null)[][] = [headers];
    (formData.milestones || []).forEach(milestone => {
      (milestone.tasks || []).forEach(task => {
        const assignee = allCollaborators.find(c => c.id === task.assigneeId);
        const sysIds = task.systemIds?.length ? task.systemIds : task.systemId ? [task.systemId] : [];
        const systemNames = sysIds
          .map(sid => allSystems.find(s => String(s.id) === String(sid)))
          .filter(Boolean)
          .map(s => s!.acronym || s!.name)
          .join(', ');
        const priorityLabel = PRIORITY_OPTIONS.find(o => o.value === (task.priority ?? 0))?.label || 'Sem Prioridade';
        rows.push([
          milestone.name,
          task.name,
          task.status || 'Backlog',
          priorityLabel,
          task.type || '',
          assignee?.name || '',
          systemNames,
          task.startDate ? task.startDate.split('-').reverse().join('/') : '',
          task.targetDate ? task.targetDate.split('-').reverse().join('/') : '',
          task.notes || '',
        ]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 30 }, { wch: 60 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
      { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 40 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
    const safeTitle = (formData.title || 'iniciativa').replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `${safeTitle}_tarefas.xlsx`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
      if (rows.length < 2) { setImportSummary('Arquivo vazio ou sem dados.'); return; }

      const changes: ImportChange[] = [];
      let updated = 0, created = 0, skipped = 0;
      const errors: string[] = [];
      const newMilestoneMap: Record<string, string> = {};

      const ALL_TYPES: MilestoneTaskType[] = ['Feature', 'Melhoria', 'Bug', 'Debito Técnico', 'Enabler', 'DRI', 'Ambiente', 'Release'];
      const priorityMap: Record<string, number> = {};
      PRIORITY_OPTIONS.forEach(o => { priorityMap[o.label.toLowerCase()] = o.value; });
      const validStatuses: string[] = TASK_STATUS_ORDER as unknown as string[];
      const parseDate = (d: string) => d.includes('/') ? d.split('/').reverse().join('-') : d;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0] || !row[1]) continue;
        const milestoneName = String(row[0]).trim();
        const taskName = String(row[1]).trim();
        const statusStr = String(row[2] || '').trim();
        const priorityStr = String(row[3] || '').trim();
        const typeStr = String(row[4] || '').trim();
        const responsavelName = String(row[5] || '').trim();
        const sistemasStr = String(row[6] || '').trim();
        const startDate = parseDate(String(row[7] || '').trim());
        const targetDate = parseDate(String(row[8] || '').trim());
        const notes = String(row[9] || '').trim();

        const milestone = (formData.milestones || []).find(
          m => m.name.toLowerCase().trim() === milestoneName.toLowerCase()
        );
        let milestoneId: string;
        if (!milestone) {
          if (!newMilestoneMap[milestoneName.toLowerCase()]) {
            const newId = `milestone_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            newMilestoneMap[milestoneName.toLowerCase()] = newId;
            changes.push({ type: 'createMilestone', milestoneId: newId, milestoneName });
          }
          milestoneId = newMilestoneMap[milestoneName.toLowerCase()];
        } else {
          milestoneId = milestone.id;
        }

        const assignee = responsavelName
          ? allCollaborators.find(c => c.name.toLowerCase().trim() === responsavelName.toLowerCase()) : null;

        const systemIds = sistemasStr
          ? sistemasStr.split(',').map(s => s.trim()).filter(Boolean).map(token => {
              const sys = allSystems.find(s =>
                (s.acronym || '').toLowerCase() === token.toLowerCase() ||
                s.name.toLowerCase() === token.toLowerCase()
              );
              return sys ? String(sys.id) : null;
            }).filter(Boolean) as string[]
          : [];

        const finalStatus = (validStatuses.includes(statusStr) ? statusStr : 'Backlog') as TaskStatus;
        const finalPriority = priorityMap[priorityStr.toLowerCase()] ?? 0;
        const finalType = (ALL_TYPES.includes(typeStr as any) ? typeStr : null) as MilestoneTaskType | null;

        const existingTask = (milestone?.tasks || []).find(
          t => t.name.toLowerCase().trim() === taskName.toLowerCase()
        );
        if (existingTask) {   
          const fields: Partial<MilestoneTask> = {};
          if (statusStr && existingTask.status !== finalStatus) fields.status = finalStatus;
          if (priorityStr && (existingTask.priority ?? 0) !== finalPriority) fields.priority = finalPriority as any;
          if (typeStr && existingTask.type !== finalType) fields.type = finalType;
          if (responsavelName && existingTask.assigneeId !== (assignee?.id ?? null)) fields.assigneeId = assignee?.id ?? null;
          if (sistemasStr && JSON.stringify(existingTask.systemIds || []) !== JSON.stringify(systemIds)) {
            fields.systemIds = systemIds;
            fields.systemId = systemIds[0] || null;
          }
          if (startDate !== (existingTask.startDate || '')) fields.startDate = startDate || null;
          if (targetDate !== (existingTask.targetDate || '')) fields.targetDate = targetDate || null;
          if (notes !== (existingTask.notes || '')) fields.notes = notes || undefined;
          if (Object.keys(fields).length > 0) {
            changes.push({ type: 'update', milestoneId, taskId: existingTask.id, fields });
            updated++;
          }
        } else {
          changes.push({
            type: 'create', milestoneId,
            taskData: {
              name: taskName, status: finalStatus, priority: finalPriority as any, type: finalType,
              milestoneId, assigneeId: assignee?.id ?? null,
              systemId: systemIds[0] || null, systemIds,
              startDate: startDate || null, targetDate: targetDate || null,
              notes: notes || undefined,
            }
          });
          created++;
        }
      }

      if (changes.length > 0) handleBulkImport(changes);
      const summaryLines = [
        `Importação concluída:`,
        `• ${updated} tarefa(s) atualizada(s)`,
        `• ${created} tarefa(s) criada(s)`,
        skipped > 0 ? `• ${skipped} linha(s) ignorada(s)` : null,
        errors.length > 0 ? `\nAvisos:\n${errors.slice(0, 5).join('\n')}` : null,
      ].filter(Boolean).join('\n');
      setImportSummary(summaryLines);
    } catch {
      setImportSummary('Erro ao processar o arquivo. Verifique o formato.');
    }
    e.target.value = '';
  };

  const handleTaskReorder = (milestoneId: string, sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const list = (formData.milestones || []).map(m => {
      if (m.id === milestoneId) {
        const newTasks = [...(m.tasks || [])];
        const sourceIdx = newTasks.findIndex(t => t.id === sourceId);
        const targetIdx = newTasks.findIndex(t => t.id === targetId);
        if (sourceIdx !== -1 && targetIdx !== -1) {
          const [moved] = newTasks.splice(sourceIdx, 1);
          newTasks.splice(targetIdx, 0, moved);
        }
        return { ...m, tasks: newTasks.map((task, index) => ({ ...task, order: index })) };
      }
      return m;
    });
    const updated = { ...formData, milestones: list };
    setFormData(updated);
  };

  const [openSections, setOpenSections] = useState<{ indicators: boolean; properties: boolean; milestones: boolean; comments: boolean; history: boolean }>(() => {
    try {
      const saved = localStorage.getItem('oraculo_sidebar_sections');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { indicators: true, properties: true, milestones: true, comments: true, history: false };
  });
  const [newMilestoneName, setNewMilestoneName] = useState('');

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => {
      const next = { ...prev, [section]: !prev[section] };
      localStorage.setItem('oraculo_sidebar_sections', JSON.stringify(next));
      return next;
    });
  };

  const demandantDirectorates = (() => {
    try {
      const raw = localStorage.getItem('oraculo_client_teams');
      if (raw) return (JSON.parse(raw) as ClientTeam[]).map(t => t.name);
    } catch {}
    return ['Operação FTTH', 'Operação B2B/Atacado', 'Comercial FTTH', 'Comercial B2B/Atacado', 'Engenharia', 'TI', 'Outros'];
  })();

  const isDirty = useMemo(() => {
    const cleanOrig = {
      ...initiative,
      macroScope: initiative.macroScope || [''],
      memberIds: initiative.memberIds || []
    };
    const cleanForm = {
      ...formData,
      macroScope: formData.macroScope || [''],
      memberIds: formData.memberIds || []
    };
    
    const fieldsToCompare: (keyof Initiative)[] = [
      'title', 'status', 'priority', 'leaderId', 'customerOwner', 
      'originDirectorate', 'benefit', 'rationale', 'externalLinkType', 'externalLinkName', 'externalLinkUrl', 'scope', 'macroScope', 
      'premises', 'requirements', 'memberIds', 'milestones', 'actualEndDate', 'requestDate', 'comments'
    ];
    
    return fieldsToCompare.some(f => JSON.stringify(cleanOrig[f]) !== JSON.stringify(cleanForm[f]));
  }, [formData, initiative]);

  // Push name to global header
  useEffect(() => {
    setHeaderContent(
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          Iniciativa:
        </span>
        <input 
          style={{ 
            fontSize: '0.95rem', 
            fontWeight: 400, 
            color: '#475569', 
            background: 'transparent', 
            border: 'none', 
            width: '600px', 
            outline: 'none',
            letterSpacing: '-0.01em',
            padding: '4px 0'
          }} 
          value={formData.title} 
          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
          placeholder="Nome da Iniciativa" 
        />
      </div>
    );
    return () => setHeaderContent(null);
  }, [formData.title, setHeaderContent]);


  const handleSave = async (extraPayload?: Partial<Initiative>) => {
    if (!onSave || isSaving) return;
    const startedAt = Date.now();
    setIsSaving(true);
    try {
      const cleanOrig = {
        ...initiative,
        macroScope: initiative.macroScope || [''],
        memberIds: initiative.memberIds || []
      };
      const finalFormData = { ...formData, ...extraPayload };
      const payload: Record<string, any> = {};
      const changes: string[] = [];

      const scalarFields: Array<{ field: keyof Initiative; label: string }> = [
        { field: 'status', label: 'Status' },
        { field: 'priority', label: 'Prioridade' },
        { field: 'leaderId', label: 'Líder' },
        { field: 'customerOwner', label: 'Owner' },
        { field: 'originDirectorate', label: 'Demandante' },
        { field: 'title', label: 'Título' },
        { field: 'type', label: 'Tipo' },
        { field: 'benefit', label: 'Descrição' },
        { field: 'benefitType', label: 'Tipo de benefício' },
        { field: 'rationale', label: 'Justificativa' },
        { field: 'externalLinkType', label: 'Tipo do link externo' },
        { field: 'externalLinkName', label: 'Nome do link externo' },
        { field: 'externalLinkUrl', label: 'URL do link externo' },
        { field: 'scope', label: 'Escopo' },
        { field: 'macroScope', label: 'Escopo Macro' },
        { field: 'premises', label: 'Premissas' },
        { field: 'requirements', label: 'Requisitos' },
        { field: 'memberIds', label: 'Membros' },
        { field: 'impactedSystemIds', label: 'Sistemas impactados' },
        { field: 'businessExpectationDate', label: 'Expectativa' },
        { field: 'requestDate', label: 'Data de solicitação' },
        { field: 'startDate', label: 'Início' },
        { field: 'endDate', label: 'Fim' },
        { field: 'actualEndDate', label: 'Fim Real' },
        { field: 'technicalLeadId', label: 'Líder técnico' },
        { field: 'executingDirectorate', label: 'Diretoria executora' },
        { field: 'executingTeamId', label: 'Time executor' },
        { field: 'assignedManagerId', label: 'Manager' },
        { field: 'initiativeType', label: 'Classificação' },
        { field: 'previousStatus', label: 'Status anterior' },
      ];

      for (const { field, label } of scalarFields) {
        const oldVal = (cleanOrig as any)[field];
        const newVal = (finalFormData as any)[field];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          payload[field] = newVal;
          changes.push(label);
        }
      }

      const normalizeMilestoneForCompare = (milestone: InitiativeMilestone, milestoneIndex: number) => ({
        ...milestone,
        order: typeof milestone.order === 'number' ? milestone.order : milestoneIndex,
        tasks: (milestone.tasks || []).map((task, index) => ({
          ...task,
          order: typeof task.order === 'number' ? task.order : index,
        }))
      });

      const originalMilestones = (cleanOrig.milestones || []).map(normalizeMilestoneForCompare);
      const currentMilestones = (finalFormData.milestones || []).map(normalizeMilestoneForCompare);
      const originalMilestonesById = new Map(originalMilestones.map(m => [m.id, m]));
      const currentMilestoneIds = new Set(currentMilestones.map(m => m.id));

      const changedMilestones = currentMilestones.filter(m => {
        const original = originalMilestonesById.get(m.id);
        return !original || JSON.stringify(original) !== JSON.stringify(m);
      });

      const removedMilestoneIds = originalMilestones
        .filter(m => !currentMilestoneIds.has(m.id))
        .map(m => m.id);

      if (changedMilestones.length > 0 || removedMilestoneIds.length > 0) {
        payload.milestones = changedMilestones;
        payload.removedMilestoneIds = removedMilestoneIds;
        changes.push('Milestones');
      }

      if (JSON.stringify(initiative.comments || []) !== JSON.stringify(finalFormData.comments || [])) {
        payload.comments = finalFormData.comments || [];
        changes.push('Comentários');
      }

      if (Object.keys(payload).length === 0) return;

      const historyItem: InitiativeHistory = {
        id: `h_save_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: (user as any)?.name || 'Usuário',
        action: `Alterações: ${changes.join(', ')}`
      };

      payload.history = [historyItem];

      await onSave({
        id: initiative.id,
        ...payload,
        updatedBy: (user as any)?.name || 'Usuário'
      } as any);
    } catch (err: any) {
      console.error('Error saving initiative:', err);
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 350) {
        await new Promise(resolve => setTimeout(resolve, 350 - elapsed));
      }
      setIsSaving(false);
    }
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
        baselineDate: new Date().toISOString().split('T')[0],
        order: (formData.milestones || []).length
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
    if (newStatus === '1- Backlog' && formData.status !== '1- Backlog') updated.createdAt = '';
    setFormData(updated);
    return updated;
  };

  const typeColor = getTypeColor(formData.type);

  return (
    <div style={{ height: '100%', width: '100%', background: 'transparent', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
        {/* Type indicator stripe at the top */}
        <div style={{ height: '4px', background: typeColor, width: '100%' }} />

        {/* Header - Action Buttons & Tabs (Name/Type moved to Global Header) */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0.4rem 1.25rem', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexShrink: 0, minHeight: '36px' }}>
          {/* Left Side: Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button 
              onClick={() => setActiveTab('descricao')}
              className={`header-nav-btn ${activeTab === 'descricao' ? 'active' : ''}`}
            >
              <FileText size={14} /> Descrição
            </button>
            <button 
              onClick={() => setActiveTab('tarefas')}
              className={`header-nav-btn ${activeTab === 'tarefas' ? 'active' : ''}`}
            >
              <CheckSquare size={14} /> Tarefas
            </button>

            {activeTab === 'tarefas' && (
              <div ref={toolbarMenuRef} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', position: 'relative' }}>
                <div style={{ width: '1px', height: '16px', background: '#E2E8F0', marginRight: '0.15rem' }} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                />

                {/* Importar */}
                <button
                  title="Importar Excel"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', color: '#64748B' }}
                  className="icon-toolbar-btn"
                >
                  <Upload size={15} />
                </button>

                {/* Exportar */}
                <button
                  title="Exportar Excel"
                  onClick={() => exportToExcel()}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', color: '#64748B' }}
                  className="icon-toolbar-btn"
                >
                  <Download size={15} />
                </button>

                <div style={{ width: '1px', height: '16px', background: '#E2E8F0', margin: '0 0.1rem' }} />

                {/* Filtro */}
                <div style={{ position: 'relative' }}>
                  <button
                    title="Filtros"
                    onClick={() => setOpenTaskMenu(prev => prev === 'filtro' ? null : 'filtro')}
                    style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: openTaskMenu === 'filtro' ? '#F1F5F9' : 'transparent', border: 'none', cursor: 'pointer', borderRadius: '6px', color: activeTaskFilterCount > 0 ? '#2563EB' : '#64748B' }}
                    className="icon-toolbar-btn"
                  >
                    <SlidersHorizontal size={15} />
                    {activeTaskFilterCount > 0 && (
                      <span style={{ position: 'absolute', top: 2, right: 2, width: 7, height: 7, background: '#2563EB', borderRadius: '50%', border: '1.5px solid #fff' }} />
                    )}
                  </button>
                  {openTaskMenu === 'filtro' && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 14px 32px rgba(15,23,42,0.12)', padding: '0.4rem', zIndex: 30, minWidth: '180px' }}>
                      {/* Status submenu */}
                      <div style={{ position: 'relative' }}
                        onMouseEnter={() => setOpenFilterSubmenu('status')}
                        onMouseLeave={() => setOpenFilterSubmenu(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.6rem', borderRadius: '7px', cursor: 'pointer', background: openFilterSubmenu === 'status' ? '#F1F5F9' : 'transparent', fontSize: '0.75rem', fontWeight: 600, color: taskStatusFilter.length > 0 ? '#2563EB' : '#1E293B', gap: '0.5rem' }}>
                          <span>Status</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {taskStatusFilter.length > 0 && <span style={{ background: '#2563EB', color: '#fff', borderRadius: '10px', padding: '0 5px', fontSize: '0.62rem', fontWeight: 700 }}>{taskStatusFilter.length}</span>}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3L7.5 6L4.5 9" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </div>
                        </div>
                        {openFilterSubmenu === 'status' && (
                          <div style={{ position: 'absolute', top: 0, left: 'calc(100% + 4px)', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 14px 32px rgba(15,23,42,0.12)', padding: '0.4rem', zIndex: 40, minWidth: '160px' }}>
                            {TASK_STATUS_ORDER.map(status => {
                              const checked = taskStatusFilter.includes(status);
                              return (
                                <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderRadius: '6px', cursor: 'pointer', background: checked ? '#EFF6FF' : 'transparent', fontSize: '0.73rem', color: checked ? '#2563EB' : '#1E293B', userSelect: 'none' }}>
                                  <input type="checkbox" checked={checked} onChange={() => setTaskStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])} style={{ accentColor: '#2563EB', width: 13, height: 13, cursor: 'pointer' }} />
                                  {status}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Responsável submenu */}
                      <div style={{ position: 'relative' }}
                        onMouseEnter={() => setOpenFilterSubmenu('responsavel')}
                        onMouseLeave={() => setOpenFilterSubmenu(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.6rem', borderRadius: '7px', cursor: 'pointer', background: openFilterSubmenu === 'responsavel' ? '#F1F5F9' : 'transparent', fontSize: '0.75rem', fontWeight: 600, color: taskAssigneeFilter !== 'all' ? '#2563EB' : '#1E293B', gap: '0.5rem' }}>
                          <span>Responsável</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3L7.5 6L4.5 9" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </div>
                        {openFilterSubmenu === 'responsavel' && (
                          <div style={{ position: 'absolute', top: 0, left: 'calc(100% + 4px)', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 14px 32px rgba(15,23,42,0.12)', padding: '0.4rem', zIndex: 40, minWidth: '180px' }}>
                            {[{ id: 'all', name: 'Todos' }, { id: 'unassigned', name: 'Sem responsável' }, ...filterableCollaborators].map(opt => (
                              <div key={opt.id} onClick={() => setTaskAssigneeFilter(opt.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: '6px', cursor: 'pointer', background: taskAssigneeFilter === opt.id ? '#EFF6FF' : 'transparent', fontSize: '0.73rem', color: taskAssigneeFilter === opt.id ? '#2563EB' : '#1E293B' }}>
                                {opt.name}
                                {taskAssigneeFilter === opt.id && <span style={{ color: '#2563EB', fontSize: 11 }}>&#10003;</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Risco submenu */}
                      <div style={{ position: 'relative' }}
                        onMouseEnter={() => setOpenFilterSubmenu('risco')}
                        onMouseLeave={() => setOpenFilterSubmenu(null)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.6rem', borderRadius: '7px', cursor: 'pointer', background: openFilterSubmenu === 'risco' ? '#F1F5F9' : 'transparent', fontSize: '0.75rem', fontWeight: 600, color: taskRiskFilter !== 'all' ? '#2563EB' : '#1E293B', gap: '0.5rem' }}>
                          <span>Risco</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 3L7.5 6L4.5 9" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </div>
                        {openFilterSubmenu === 'risco' && (
                          <div style={{ position: 'absolute', top: 0, left: 'calc(100% + 4px)', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 14px 32px rgba(15,23,42,0.12)', padding: '0.4rem', zIndex: 40, minWidth: '170px' }}>
                            {([['all', 'Todos'], ['late', 'Atrasado'], ['at-risk', 'Risco de Atraso'], ['not-started', 'Não iniciado']] as const).map(([val, label]) => (
                              <div key={val} onClick={() => setTaskRiskFilter(val)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.5rem', borderRadius: '6px', cursor: 'pointer', background: taskRiskFilter === val ? '#EFF6FF' : 'transparent', fontSize: '0.73rem', color: taskRiskFilter === val ? '#2563EB' : '#1E293B' }}>
                                {label}
                                {taskRiskFilter === val && <span style={{ color: '#2563EB', fontSize: 11 }}>&#10003;</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ height: '1px', background: '#F1F5F9', margin: '0.3rem 0' }} />
                      <div onClick={() => { setTaskStatusFilter([]); setTaskAssigneeFilter('all'); setTaskRiskFilter('all'); }} style={{ padding: '0.45rem 0.6rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600, color: '#64748B', textAlign: 'center' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Limpar filtros
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ width: '1px', height: '16px', background: '#E2E8F0', margin: '0 0.1rem' }} />

                {/* View toggle */}
                <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', borderRadius: '8px', padding: '2px', gap: '1px' }}>
                  <button
                    title="Visualização em lista"
                    onClick={() => setTaskViewMode('list')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24, border: 'none', cursor: 'pointer', borderRadius: '6px', background: taskViewMode === 'list' ? '#FFFFFF' : 'transparent', color: taskViewMode === 'list' ? '#1E293B' : '#94A3B8', boxShadow: taskViewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}
                  >
                    <List size={14} />
                  </button>
                  <button
                    title="Visualização em timeline"
                    onClick={() => setTaskViewMode('timeline')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24, border: 'none', cursor: 'pointer', borderRadius: '6px', background: taskViewMode === 'timeline' ? '#FFFFFF' : 'transparent', color: taskViewMode === 'timeline' ? '#1E293B' : '#94A3B8', boxShadow: taskViewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}
                  >
                    <Rows3 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Side: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className={`header-nav-btn ${!showSidebar ? 'active' : ''}`}
              title={showSidebar ? "Fechar Lateral" : "Abrir Lateral"}
            >
              {showSidebar ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>

            {(isDirty || isSaving) && (
              <>
                <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />

                <button 
                  onClick={() => handleSave()}
                  className="btn-trello-primary"
                  style={{ 
                    padding: '0 12px', 
                    fontSize: '0.75rem', 
                    height: '26px', 
                    whiteSpace: 'nowrap',
                    opacity: isSaving ? 0.6 : 1,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Save size={14} /> Salvar</>}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', background: '#FFFFFF', overflow: 'hidden' }}>
          {/* Main Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: showSidebar ? '1px solid #E5E7EB' : 'none', overflowY: (activeTab === 'tarefas' && taskViewMode === 'timeline') ? 'hidden' : 'auto', background: '#FFFFFF', minHeight: 0 }}>
            <div style={{ padding: activeTab === 'tarefas' ? '0' : (activeTab === 'descricao' ? '0.5rem 1.25rem 1.25rem 1.25rem' : '1.25rem'), flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {activeTab === 'descricao' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', margin: 0 }}>Objetivo</h2>
                    <textarea
                      ref={benefitRef}
                      value={formData.benefit || ''}
                      onChange={e => { setFormData({ ...formData, benefit: e.target.value }); adjustTextareaHeight(e.target, 28); }}
                      className="document-textarea"
                      placeholder="Descreva o objetivo principal desta iniciativa..."
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', margin: 0 }}>Benefícios</h2>
                    <textarea 
                      ref={rationaleRef}
                      value={formData.rationale || ''}
                      onChange={e => { setFormData({ ...formData, rationale: e.target.value }); adjustTextareaHeight(e.target, 28); }}
                      className="document-textarea"
                      placeholder="Quais os principais benefícios esperados com este projeto?"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', margin: 0 }}>Link Externo</h2>
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>Tipo:</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: getExternalLinkMeta(formData.externalLinkType).background, color: getExternalLinkMeta(formData.externalLinkType).color, borderRadius: '999px', padding: '0.2rem 0.5rem', fontSize: '0.72rem', fontWeight: 700 }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.75)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, overflow: 'hidden' }}>
                            {getExternalLinkMeta(formData.externalLinkType).kind === 'azure' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M13.8 2 6.2 15.2h4.5L18.3 2h-4.5Z" fill="#0078D4" />
                                <path d="M14.5 12.1 19.1 20H9.4l2.6-4.5h4.7l-2.2-3.4Z" fill="#50A9F8" />
                              </svg>
                            ) : (
                              getExternalLinkMeta(formData.externalLinkType).short
                            )}
                          </span>
                          {getExternalLinkMeta(formData.externalLinkType).label}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 700 }}>Valor:</span>
                        {formData.externalLinkName && formData.externalLinkUrl ? (
                          <a
                            href={formData.externalLinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#2563EB', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '460px' }}
                          >
                            {formData.externalLinkName} ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>Nenhum link cadastrado</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={openExternalLinkModal}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: '1px solid #D1D5DB', background: '#FFFFFF', color: '#475569', borderRadius: '8px', padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', margin: 0 }}>Escopo</h2>
                    <ScopeEditor
                      key={initiative.id}
                      value={formData.scope || ''}
                      onChange={val => setFormData(prev => ({ ...prev, scope: val }))}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'tarefas' && (
                <>
                  {importSummary && (
                    <div style={{ margin: '0.75rem 1rem 0', padding: '0.6rem 0.85rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <AlertCircle size={14} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <pre style={{ margin: 0, fontSize: '0.72rem', color: '#166534', fontFamily: 'inherit', whiteSpace: 'pre-wrap', flex: 1 }}>
                        {importSummary}
                      </pre>
                      <button onClick={() => setImportSummary(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', padding: 0, flexShrink: 0 }}>
                        ×
                      </button>
                    </div>
                  )}

                  {taskViewMode === 'list' ? (
                    <InitiativeTaskBoard 
                      formData={formData}
                      allCollaborators={allCollaborators}
                      allSystems={allSystems}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDelete}
                      onTaskAdd={handleTaskAdd}
                      onTaskReorder={handleTaskReorder}
                      onMilestoneUpdate={handleUpdateMilestoneName}
                      onMilestoneDelete={handleRemoveMilestone}
                      onMilestoneReorder={handleMilestoneReorder}
                      setEditingMilestoneId={setEditingMilestoneId}
                      editingMilestoneId={editingMilestoneId}
                      setEditMilestoneText={setEditMilestoneText}
                      editMilestoneText={editMilestoneText}
                      activeMilestoneId={activeMilestoneTaskViewId}
                      statusFilter={taskStatusFilter}
                      assigneeFilter={taskAssigneeFilter}
                      riskFilter={taskRiskFilter}
                    />
                  ) : (
                    <div style={{ padding: '0.8rem 1rem 1rem', flex: 1, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      {filteredTimelineTasks.length === 0 ? (
                        <div style={{ border: '1px dashed #CBD5E1', borderRadius: '14px', padding: '1.25rem', color: '#94A3B8', background: '#FFFFFF' }}>
                          Nenhuma tarefa encontrada para exibir na timeline.
                        </div>
                      ) : (() => {
                        const datedTasks = filteredTimelineTasks.map(task => {
                          const todayAnchor = new Date();
                          todayAnchor.setHours(0, 0, 0, 0);
                          const start = parseDateSafe(task.startDate || null) || parseDateSafe(task.targetDate || null) || todayAnchor;
                          const explicitTarget = parseDateSafe(task.targetDate || null);
                          const explicitStart = parseDateSafe(task.startDate || null);
                          const hasExplicitDates = Boolean(task.startDate || task.targetDate);
                          const defaultEnd = new Date(start);
                          defaultEnd.setDate(defaultEnd.getDate() + 4);
                          const end = explicitTarget || explicitStart || defaultEnd;
                          return { ...task, start, end: end < start ? start : end, hasExplicitDates };
                        });

                        // Group by milestone, preserving milestone order from formData
                        const milestoneOrder = (formData.milestones || []).map(m => m.id);
                        const groupMap = new Map<string, { milestoneId: string; milestoneName: string; tasks: typeof datedTasks }>();
                        datedTasks.forEach(task => {
                          if (!groupMap.has(task.milestoneId)) {
                            groupMap.set(task.milestoneId, { milestoneId: task.milestoneId, milestoneName: task.milestoneName || '', tasks: [] });
                          }
                          groupMap.get(task.milestoneId)!.tasks.push(task);
                        });
                        const milestoneGroups = [...groupMap.values()].sort((a, b) => {
                          const ai = milestoneOrder.indexOf(a.milestoneId);
                          const bi = milestoneOrder.indexOf(b.milestoneId);
                          return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
                        });

                        const minStart = new Date(Math.min(...datedTasks.map(t => t.start.getTime())));
                        const maxEnd = new Date(Math.max(...datedTasks.map(t => t.end.getTime())));
                        minStart.setDate(minStart.getDate() - 7);
                        maxEnd.setDate(maxEnd.getDate() + 7);
                        const totalDays = Math.max(1, Math.round((maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                        const monthHeaders: { label: string; width: string }[] = [];
                        const cursor = new Date(minStart.getFullYear(), minStart.getMonth(), 1);
                        while (cursor <= maxEnd) {
                          const monthStart = new Date(Math.max(cursor.getTime(), minStart.getTime()));
                          const monthEnd = new Date(Math.min(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getTime(), maxEnd.getTime()));
                          const span = Math.max(1, Math.round((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                          monthHeaders.push({
                            label: cursor.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').toUpperCase(),
                            width: `${(span / totalDays) * 100}%`
                          });
                          cursor.setMonth(cursor.getMonth() + 1, 1);
                        }

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const todayOffsetPct = ((today.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24 * totalDays)) * 100;

                        const weekHeaders: { label: string; width: string; offsetPct: number; isCurrentWeek: boolean }[] = [];
                        const weekCursor = new Date(minStart);
                        while (weekCursor.getDay() !== 1) weekCursor.setDate(weekCursor.getDate() - 1);
                        while (weekCursor <= maxEnd) {
                          const weekStart = new Date(Math.max(weekCursor.getTime(), minStart.getTime()));
                          const weekEnd = new Date(Math.min(weekCursor.getTime() + 6 * 24 * 60 * 60 * 1000, maxEnd.getTime()));
                          const span = Math.max(1, Math.round((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                          const offsetPct = ((weekStart.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24 * totalDays)) * 100;
                          const isCurrentWeek = today >= new Date(weekCursor.getTime()) && today <= new Date(weekCursor.getTime() + 6 * 24 * 60 * 60 * 1000);
                          weekHeaders.push({
                            label: weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                            width: `${(span / totalDays) * 100}%`,
                            offsetPct,
                            isCurrentWeek,
                          });
                          weekCursor.setDate(weekCursor.getDate() + 7);
                        }
                        const pxPerDay = 18 * taskTimelineZoom;
                        const LEFT_COL = 162;
                        const chartMinWidth = Math.max(900, totalDays * pxPerDay);
                        const totalMinWidth = LEFT_COL + chartMinWidth;
                        const rowMinH = Math.max(58, 58 * taskTimelineZoom);

                        // helper: bar position % within chart area
                        const barLeft = (d: Date) => ((d.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24 * totalDays)) * 100;
                        const barWidth = (s: Date, e: Date) => (Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1) / totalDays) * 100;

                        return (
                          <div style={{ border: '1px solid #E2E8F0', borderRadius: '14px', background: '#FFFFFF', overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            {/* Zoom controls — floating top-right */}
                            <div style={{ position: 'absolute', top: '6px', right: '10px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', padding: '2px 4px', border: '1px solid #E2E8F0', backdropFilter: 'blur(4px)' }}>
                              <button type="button" onClick={() => setTaskTimelineZoom(prev => Math.max(0.25, Number((prev - 0.15).toFixed(2))))} style={{ width: '20px', height: '20px', borderRadius: '5px', border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Diminuir zoom">−</button>
                              <span style={{ minWidth: '36px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>{Math.round(taskTimelineZoom * 100)}%</span>
                              <button type="button" onClick={() => setTaskTimelineZoom(prev => Math.min(2, Number((prev + 0.15).toFixed(2))))} style={{ width: '20px', height: '20px', borderRadius: '5px', border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Aumentar zoom">+</button>
                            </div>

                            <div style={{ overflow: 'auto', flex: 1, minHeight: 0 }} ref={timelineContentRef}>
                              <div style={{ minWidth: `${totalMinWidth}px`, position: 'relative', display: 'flex', flexDirection: 'column' }}>

                                {/* ── Sticky header ── */}
                                <div style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                                  {/* left-col label header */}
                                  <div style={{ width: `${LEFT_COL}px`, flexShrink: 0, position: 'sticky', left: 0, zIndex: 6, background: '#F8FAFC', borderRight: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Milestone</span>
                                  </div>
                                  {/* month + week header */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0' }}>
                                      {monthHeaders.map((h, i) => (
                                        <div key={`m-${i}`} style={{ flex: `0 0 ${h.width}`, padding: '0.42rem 0.35rem', fontSize: '0.7rem', fontWeight: 800, color: '#334155', borderRight: '1px dashed #E2E8F0', background: '#F8FAFC' }}>{h.label}</div>
                                      ))}
                                    </div>
                                    <div style={{ display: 'flex', background: '#FFFFFF' }}>
                                      {weekHeaders.map((h, i) => (
                                        <div key={`w-${i}`} style={{ flex: `0 0 ${h.width}`, padding: '0.28rem 0.3rem', fontSize: '0.62rem', fontWeight: h.isCurrentWeek ? 800 : 700, color: h.isCurrentWeek ? '#6366F1' : '#64748B', borderRight: '1px dashed #E2E8F0', background: h.isCurrentWeek ? 'rgba(99,102,241,0.08)' : undefined }}>{h.label}</div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* ── Body ── */}
                                <div style={{ position: 'relative' }}>
                                  {/* current week background highlight */}
                                  {weekHeaders.filter(h => h.isCurrentWeek).map((h, i) => {
                                    const leftPx = LEFT_COL + (h.offsetPct / 100) * chartMinWidth;
                                    const widthPx = (parseFloat(h.width) / 100) * chartMinWidth;
                                    return (
                                      <div key={`cw-${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${leftPx}px`, width: `${widthPx}px`, background: 'rgba(99,102,241,0.05)', borderLeft: '1px solid rgba(99,102,241,0.18)', borderRight: '1px solid rgba(99,102,241,0.18)', zIndex: 0, pointerEvents: 'none' }} />
                                    );
                                  })}
                                  {/* vertical week lines – relative to chart area, offset by LEFT_COL */}
                                  {weekHeaders.map((h, i) => {
                                    const leftPx = LEFT_COL + (h.offsetPct / 100) * chartMinWidth;
                                    return (
                                      <div key={`wl-${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${leftPx}px`, width: '1px', borderLeft: '1px dashed rgba(148,163,184,0.45)', zIndex: 0, pointerEvents: 'none' }} />
                                    );
                                  })}
                                  {/* today line */}
                                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${LEFT_COL + (todayOffsetPct / 100) * chartMinWidth}px`, width: '2px', background: '#F43F5E', opacity: 0.7, zIndex: 1, pointerEvents: 'none' }} />

                                  {/* milestone groups */}
                                  {milestoneGroups.map(group => {
                                    const isCollapsed = collapsedMilestones.has(group.milestoneId);
                                    const msStart = new Date(Math.min(...group.tasks.map(t => t.start.getTime())));
                                    const msEnd = new Date(Math.max(...group.tasks.map(t => t.end.getTime())));
                                    const msLeft = barLeft(msStart);
                                    const msWidth = barWidth(msStart, msEnd);
                                    const msDuration = Math.max(1, Math.round((msEnd.getTime() - msStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                                    return (
                                      <React.Fragment key={group.milestoneId}>
                                        {/* Milestone header row */}
                                        <div style={{ display: 'flex', minHeight: '36px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', position: 'relative', zIndex: 2 }}>
                                          {/* sticky label */}
                                          <div style={{ position: 'sticky', left: 0, width: `${LEFT_COL}px`, flexShrink: 0, zIndex: 3, background: '#F8FAFC', borderRight: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '5px', padding: '0 8px', overflow: 'hidden' }}>
                                            <button
                                              type="button"
                                              onClick={() => setCollapsedMilestones(prev => {
                                                const next = new Set(prev);
                                                next.has(group.milestoneId) ? next.delete(group.milestoneId) : next.add(group.milestoneId);
                                                return next;
                                              })}
                                              style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '4px', border: '1px solid #E2E8F0', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                              title={isCollapsed ? 'Expandir' : 'Recolher'}
                                            >
                                              {isCollapsed ? <ChevronRight size={11} color="#64748B" /> : <ChevronDown size={11} color="#64748B" />}
                                            </button>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={group.milestoneName}>{group.milestoneName}</span>
                                          </div>
                                          {/* chart area – collapsed bar */}
                                          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                                            {isCollapsed && (
                                              <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `${Math.max(0, msLeft)}%`, width: `${Math.min(msWidth, 100)}%`, minWidth: `${Math.max(36, msDuration * pxPerDay)}px` }}>
                                                <div style={{ height: '10px', background: 'linear-gradient(90deg,#6366F1,#818CF8)', borderRadius: '5px', opacity: 0.85 }} />
                                                <span style={{ position: 'absolute', right: 'calc(100% + 5px)', top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: '#6366F1', whiteSpace: 'nowrap', fontWeight: 700 }}>{formatShortDate(msStart)}</span>
                                                <span style={{ position: 'absolute', left: 'calc(100% + 5px)', top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: '#6366F1', whiteSpace: 'nowrap', fontWeight: 700 }}>{formatShortDate(msEnd)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Task rows (hidden when collapsed) */}
                                        {!isCollapsed && group.tasks.map(task => {
                                          const preview = barResizePreview?.taskId === task.id ? barResizePreview : null;
                                          const previewStart = preview?.startDate ? new Date(preview.startDate + 'T00:00:00') : null;
                                          const previewEnd = preview?.endDate ? new Date(preview.endDate + 'T00:00:00') : null;
                                          const displayStart = previewStart || task.start;
                                          const displayEnd = previewEnd || task.end;
                                          const left = barLeft(displayStart);
                                          const durationDays = Math.max(1, Math.round((displayEnd.getTime() - displayStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                          const width = barWidth(displayStart, displayEnd);
                                          const assignee = task.assigneeId ? allCollaborators.find(c => c.id === task.assigneeId) : null;
                                          const bStyle = getTaskTimelineBarStyle(task.status);

                                          return (
                                            <div key={task.id} style={{ display: 'flex', minHeight: `${rowMinH}px`, borderBottom: '1px solid #F1F5F9', position: 'relative', zIndex: 2 }}>
                                              {/* sticky label */}
                                              <div style={{ position: 'sticky', left: 0, width: `${LEFT_COL}px`, flexShrink: 0, zIndex: 3, background: '#FFFFFF', borderRight: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', padding: '0 8px 0 28px', overflow: 'hidden' }}>
                                                <span style={{ fontSize: '0.65rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={task.name}>{task.name}</span>
                                              </div>
                                              {/* chart cell */}
                                              <div style={{ flex: 1, position: 'relative', padding: '0.75rem 0.9rem 0.85rem' }}>
                                                <div
                                                  style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%) translateY(-10px)', left: `${Math.max(0, left)}%`, width: `${Math.min(width, 100)}%`, minWidth: `${Math.max(36, durationDays * pxPerDay)}px` }}
                                                  onMouseEnter={e => showTimelineTooltip(e, task)}
                                                  onMouseMove={e => showTimelineTooltip(e, task)}
                                                  onMouseLeave={hideTimelineTooltip}
                                                  onClick={() => setTimelineEditingTask({ milestoneId: task.milestoneId, task })}
                                                >
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.32rem', minWidth: 0 }}>
                                                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', cursor: 'pointer' }}>{task.name}</span>
                                                    {assignee ? <span style={{ flexShrink: 0, display: 'flex' }}>{renderAvatar(assignee.id, allCollaborators, 18)}</span> : null}
                                                  </div>
                                                  {(() => {
                                                    const barH = Math.max(10, 10 * taskTimelineZoom);
                                                    const iconSize = Math.max(7, Math.min(10, barH - 2));
                                                    return (
                                                      <div style={{ position: 'relative', cursor: 'pointer' }}>
                                                        <div style={{ ...bStyle, position: 'relative', width: '100%', height: `${barH}px`, borderRadius: '5px', boxSizing: 'border-box', boxShadow: task.status === 'Backlog' || task.status === 'Todo' ? 'inset 0 0 0 1px #CBD5E1' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '3px' }}>
                                                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize', zIndex: 10, borderRadius: '5px 0 0 5px' }}
                                                            onMouseDown={e => { e.stopPropagation(); e.preventDefault(); const el = timelineContentRef.current; if (!el) return; barResizeDragRef.current = { taskId: task.id, milestoneId: task.milestoneId, handle: 'left', startX: e.clientX, initDateStr: task.startDate || task.start.toISOString().slice(0, 10), totalDays, containerWidth: el.scrollWidth - LEFT_COL }; document.body.style.cursor = 'ew-resize'; document.body.style.userSelect = 'none'; }} />
                                                          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'ew-resize', zIndex: 10, borderRadius: '0 5px 5px 0' }}
                                                            onMouseDown={e => { e.stopPropagation(); e.preventDefault(); const el = timelineContentRef.current; if (!el) return; barResizeDragRef.current = { taskId: task.id, milestoneId: task.milestoneId, handle: 'right', startX: e.clientX, initDateStr: task.targetDate || task.end.toISOString().slice(0, 10), totalDays, containerWidth: el.scrollWidth - LEFT_COL }; document.body.style.cursor = 'ew-resize'; document.body.style.userSelect = 'none'; }} />
                                                          <span style={{ display: 'flex', lineHeight: 0, flexShrink: 0 }}>{getBarIcon(task.status, iconSize)}</span>
                                                        </div>
                                                        <span style={{ position: 'absolute', right: 'calc(100% + 5px)', top: '50%', transform: 'translateY(-50%)', fontSize: '0.62rem', color: preview ? '#3B82F6' : '#94A3B8', whiteSpace: 'nowrap', fontWeight: preview ? 700 : 400 }}>{formatShortDate(displayStart)}</span>
                                                        <span style={{ position: 'absolute', left: 'calc(100% + 5px)', top: '50%', transform: 'translateY(-50%)', fontSize: '0.62rem', color: preview ? '#3B82F6' : '#94A3B8', whiteSpace: 'nowrap', fontWeight: preview ? 700 : 400 }}>{formatShortDate(displayEnd)}</span>
                                                      </div>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Sidebar - Integrated into the page grid */}
          {showSidebar && (
            <div style={{ 
              width: '380px', 
              borderLeft: '1px solid #E2E8F0', 
              background: '#FFFFFF', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '100%'
            }}>
              {/* Indicators Section */}
              <div className="linear-sidebar-card">
                  <div
                    onClick={() => toggleSection('indicators')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', cursor: 'pointer', borderBottom: openSections.indicators ? '1px solid #E2E8F0' : 'none', background: '#F8FAFC' }}
                  >
                    <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>INDICADORES</h3>
                    {openSections.indicators ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                  </div>
                  {openSections.indicators && <InitiativeIndicators formData={formData} />}
              </div>

              {/* Initiative Properties Section */}
              <div className="linear-sidebar-card">
                  <div 
                    onClick={() => toggleSection('properties')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', cursor: 'pointer', borderBottom: openSections.properties ? '1px solid #E2E8F0' : 'none', background: '#F8FAFC' }}
                  >
                    <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>PROPRIEDADES</h3>
                    {openSections.properties ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                  </div>
                  {openSections.properties && (
                    <div style={{ paddingTop: '0.4rem', paddingBottom: '0.75rem' }}>
                      <InitiativeProperties 
                        formData={formData}
                        setFormData={setFormData}
                        allCollaborators={allCollaborators}
                        allSystems={allSystems}
                        editingField={editingField}
                        setEditingField={setEditingField}
                        handleStatusChange={handleStatusChange}
                        setShowPriorityMenu={setShowPriorityMenu}
                        demandantDirectorates={demandantDirectorates}
                      />
                    </div>
                  )}
              </div>

              {/* Milestones Section */}
              <div className="linear-sidebar-card">
                  <div 
                    onClick={() => toggleSection('milestones')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', cursor: 'pointer', borderBottom: openSections.milestones ? '1px solid #E2E8F0' : 'none', background: '#F8FAFC' }}
                  >
                    <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>MILESTONES</h3>
                    {openSections.milestones ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                  </div>
                  {openSections.milestones && (
                    <div style={{ paddingTop: '0.4rem', paddingBottom: '0.75rem' }}>
                      <InitiativeMilestones 
                        formData={formData}
                        setFormData={setFormData}
                        allCollaborators={allCollaborators}
                        allSystems={allSystems}
                        editingMilestoneId={editingMilestoneId}
                        setEditingMilestoneId={setEditingMilestoneId}
                        editMilestoneText={editMilestoneText}
                        setEditMilestoneText={setEditMilestoneText}
                        handleUpdateMilestoneName={handleUpdateMilestoneName}
                        handleRemoveMilestone={handleRemoveMilestone}
                        handleMilestoneReorder={handleMilestoneReorder}
                        setActiveTab={setActiveTab}
                        setActiveMilestoneTaskViewId={setActiveMilestoneTaskViewId}
                        activeMilestoneTaskViewId={activeMilestoneTaskViewId}
                        newMilestoneName={newMilestoneName}
                        setNewMilestoneName={setNewMilestoneName}
                        handleAddMilestone={handleAddMilestone}
                        handleTaskAdd={handleTaskAdd}
                        handleTaskDelete={handleTaskDelete}
                        handleTaskUpdate={handleTaskUpdate}
                        handleTaskToggle={(mid, tid) => {
                          const m = formData.milestones?.find(m => m.id === mid);
                          const t = m?.tasks?.find(t => t.id === tid);
                          if (t) handleTaskUpdate(mid, tid, 'status', t.status === 'Done' ? 'Backlog' : 'Done');
                        }}
                        isRequester={true} // Forcing true in editor to allow adding
                        isNew={false}
                      />
                    </div>
                  )}
              </div>

                {/* Comments Section */}
                <div className="linear-sidebar-card">
                  <div 
                    onClick={() => toggleSection('comments')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', cursor: 'pointer', borderBottom: openSections.comments ? '1px solid #E2E8F0' : 'none', background: '#F8FAFC' }}
                  >
                    <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>COMENTÁRIOS</h3>
                    {openSections.comments ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                  </div>
                  {openSections.comments && (
                    <div style={{ padding: '0.6rem 1rem 1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {!isAddingComment ? (
                        <button 
                          onClick={() => setIsAddingComment(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'transparent',
                            border: 'none',
                            color: '#64748B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '0.5rem 0.2rem',
                            transition: 'color 0.2s',
                            width: 'fit-content'
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>+</span> Adicionar comentário
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <textarea 
                            autoFocus
                            placeholder="Adicione um comentário..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            style={{ 
                              width: '100%', 
                              minHeight: '60px', 
                              border: 'none', 
                              background: 'transparent', 
                              fontSize: '0.8rem', 
                              resize: 'none', 
                              padding: 0,
                              outline: 'none',
                              color: '#1E293B'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.6rem' }}>
                            <button 
                              onClick={() => { setIsAddingComment(false); setCommentText(''); }}
                              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={() => {
                                if (!commentText.trim()) return;
                                const newComment = {
                                  id: `c_${Date.now()}`,
                                  userId: user?.id || 'anon',
                                  userName: (user as any)?.fullName || (user as any)?.name || 'Usuário',
                                  userPhoto: user?.photoUrl,
                                  content: commentText.trim(),
                                  timestamp: new Date().toISOString()
                                };
                                const updatedComments = [newComment, ...(formData.comments || [])];
                                setFormData({ ...formData, comments: updatedComments });
                                setCommentText('');
                                setIsAddingComment(false);
                              }}
                              className="btn-icon-hover"
                              style={{ 
                                background: '#1E293B', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px',
                                padding: '2px 8px',
                                cursor: 'pointer', 
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Salvar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Comments List */}
                      {(formData.comments || []).length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                          {(formData.comments || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(c => (
                            <div key={c.id} style={{ display: 'flex', gap: '0.75rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', position: 'relative' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>{c.userName}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{new Date(c.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                    {user?.id === c.userId && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <button 
                                          onClick={() => {
                                            setEditingCommentId(c.id);
                                            setEditCommentText(c.content);
                                          }}
                                          style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: 0 }}
                                          title="Editar"
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button 
                                          onClick={() => {
                                            const filtered = (formData.comments || []).filter(item => item.id !== c.id);
                                            setFormData({ ...formData, comments: filtered });
                                          }}
                                          style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                                          title="Excluir"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {editingCommentId === c.id ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
                                    <textarea 
                                      autoFocus
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      style={{ 
                                        width: '100%', 
                                        minHeight: '60px', 
                                        border: '1px solid #CBD5E1', 
                                        background: '#F8FAFC', 
                                        fontSize: '0.75rem', 
                                        resize: 'none', 
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        outline: 'none',
                                        color: '#1E293B'
                                      }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                      <button 
                                        onClick={() => setEditingCommentId(null)}
                                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                                      >
                                        Cancelar
                                      </button>
                                      <button 
                                        onClick={() => {
                                          const updated = (formData.comments || []).map(item => 
                                            item.id === c.id ? { ...item, content: editCommentText.trim(), timestamp: new Date().toISOString() } : item
                                          );
                                          setFormData({ ...formData, comments: updated });
                                          setEditingCommentId(null);
                                        }}
                                        style={{ background: '#1E293B', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                                      >
                                        Salvar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>{c.content}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="linear-sidebar-card">
                  <div 
                    onClick={() => toggleSection('history')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', cursor: 'pointer', borderBottom: openSections.history ? '1px solid #E2E8F0' : 'none', background: '#F8FAFC' }}
                  >
                    <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>HISTÓRICO</h3>
                    {openSections.history ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                  </div>
                  {openSections.history && (
                    <div style={{ padding: '0.6rem 1rem 0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(formData.history || []).length > 0 ? (
                        (formData.history || []).slice().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10).map(h => (
                        <div key={h.id} style={{ display: 'flex', gap: '0.65rem' }}>
                          <div style={{ padding: '0.2rem', background: '#F1F5F9', borderRadius: '4px', height: 'fit-content' }}>
                            <Edit2 size={12} color="#64748B" />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#1E293B', fontWeight: 600 }}>{h.user}</span>
                            <span style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>{h.action}</span>
                            <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{new Date(h.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>Nenhuma atividade registrada.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .document-textarea {
          width: 100%;
          border: 1px solid #E5E7EB;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          min-height: 28px;
          font-family: inherit;
          resize: none;
          overflow: hidden;
          outline: none;
          font-size: 0.82rem;
          line-height: 1.6;
          box-sizing: border-box;
        }
        .document-textarea:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08); }
        .scope-editor { border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
        .scope-editor:focus-within { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08); }
        .scope-editor .ProseMirror { padding: 0.25rem 0.5rem; min-height: 28px; font-size: 0.82rem; line-height: 1.6; color: inherit; font-family: inherit; outline: none; }
        .scope-editor .ProseMirror p { margin: 0; }
        .scope-editor .ProseMirror p + p { margin-top: 0.25em; }
        .scope-editor .ProseMirror ul { padding-left: 1.4em; margin: 0.2em 0; list-style-type: disc; }
        .scope-editor .ProseMirror ol { padding-left: 1.4em; margin: 0.2em 0; list-style-type: decimal; }
        .scope-editor .ProseMirror li { margin: 0.1em 0; }
        .scope-editor .ProseMirror p.is-editor-empty:first-child::before { content: "Descreva o escopo, premissas e requisitos..."; color: #9CA3AF; pointer-events: none; float: left; height: 0; }
        .linear-sidebar-card { border-bottom: 1px solid #E2E8F0; }
        .btn-trello-primary { background: #2563EB; color: white; border: none; border-radius: 8px; padding: 0 12px; height: 26px; font-weight: 700; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .btn-trello-ghost { background: white; color: #4B5563; border: 1px solid #D1D5DB; border-radius: 6px; padding: 0.6rem 1.25rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <style>{`
        .header-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0 10px; /* Removed vertical padding, using height instead */
          height: 26px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: white;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .header-nav-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #1E293B;
        }
        .header-nav-btn.active {
          background: #F1F5F9;
          color: #1E293B;
          border-color: #CBD5E1;
          font-weight: 700;
        }
      `}</style>


      {timelineEditingTask && (
        <TaskEditModal
          task={timelineEditingTask.task}
          milestoneId={timelineEditingTask.milestoneId}
          allCollaborators={allCollaborators}
          allSystems={allSystems}
          formData={formData}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onClose={() => setTimelineEditingTask(null)}
          user={user}
        />
      )}

      {hoveredTimelineTask && !timelineEditingTask && (
        <div
          style={{
            position: 'fixed',
            left: hoveredTimelineTask.x,
            top: hoveredTimelineTask.y,
            zIndex: 1300,
            pointerEvents: 'none',
            width: '300px',
            background: '#0F172A',
            color: '#F8FAFC',
            borderRadius: '12px',
            boxShadow: '0 18px 40px rgba(15,23,42,0.28)',
            padding: '0.8rem 0.9rem',
            fontSize: '0.72rem',
            lineHeight: 1.45,
            border: '1px solid rgba(148,163,184,0.25)'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.45rem', color: '#FFFFFF' }}>
            {hoveredTimelineTask.task.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr', gap: '0.25rem 0.45rem' }}>
            <span style={{ color: '#93C5FD', fontWeight: 700 }}>Tipo</span>
            <span>{hoveredTimelineTask.task.type || '—'}</span>
            <span style={{ color: '#93C5FD', fontWeight: 700 }}>Status</span>
            <span>{hoveredTimelineTask.task.status || '—'}</span>
            <span style={{ color: '#93C5FD', fontWeight: 700 }}>Sistemas</span>
            <span>{(() => {
              const systemIds = hoveredTimelineTask.task.systemIds?.length
                ? hoveredTimelineTask.task.systemIds
                : hoveredTimelineTask.task.systemId
                  ? [hoveredTimelineTask.task.systemId]
                  : [];
              const names = systemIds.map(id => allSystems.find(system => system.id === id)?.name || id).filter(Boolean);
              return names.length > 0 ? names.join(', ') : '—';
            })()}</span>
            <span style={{ color: '#93C5FD', fontWeight: 700 }}>Milestone</span>
            <span>{hoveredTimelineTask.task.milestoneName || '—'}</span>
            <span style={{ color: '#93C5FD', fontWeight: 700 }}>Descrição</span>
            <span>{hoveredTimelineTask.task.notes || 'Sem descrição'}</span>
          </div>
        </div>
      )}

      {showPriorityMenu && (
        <PriorityPicker
          value={formData.priority || 0}
          position={showPriorityMenu}
          onSelect={(val) => { setFormData({ ...formData, priority: val }); setShowPriorityMenu(null); }}
          onClose={() => setShowPriorityMenu(null)}
        />
      )}

      {showExternalLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '520px', background: '#FFFFFF', borderRadius: '14px', boxShadow: '0 24px 48px rgba(15,23,42,0.18)', overflow: 'hidden' }}>
            <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>Editar Link Externo</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>Defina o tipo, o nome exibido e o endereço do link.</div>
              </div>
              <button onClick={() => setShowExternalLinkModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '1rem' }}>×</button>
            </div>

            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                Tipo
                <select
                  value={externalLinkDraft.type}
                  onChange={e => setExternalLinkDraft(prev => ({ ...prev, type: e.target.value }))}
                  style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.6rem 0.7rem', fontSize: '0.78rem', outline: 'none' }}
                >
                  <option value="Azure">Azure</option>
                  <option value="Jira">Jira</option>
                  <option value="Outra ferramenta">Outra ferramenta</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                Nome
                <input
                  type="text"
                  value={externalLinkDraft.name}
                  onChange={e => setExternalLinkDraft(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex.: Board do projeto"
                  style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.6rem 0.7rem', fontSize: '0.78rem', outline: 'none' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                Endereço
                <input
                  type="url"
                  value={externalLinkDraft.url}
                  onChange={e => setExternalLinkDraft(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                  style={{ border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0.6rem 0.7rem', fontSize: '0.78rem', outline: 'none' }}
                />
              </label>
            </div>

            <div style={{ padding: '0.85rem 1rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={() => {
                  setExternalLinkDraft({ type: 'Azure', name: '', url: '' });
                  setFormData(prev => ({ ...prev, externalLinkType: '', externalLinkName: '', externalLinkUrl: '' }));
                  setShowExternalLinkModal(false);
                }}
                className="btn-trello-ghost"
                style={{ padding: '0.55rem 0.9rem' }}
              >
                Limpar
              </button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setShowExternalLinkModal(false)} className="btn-trello-ghost" style={{ padding: '0.55rem 0.9rem' }}>Cancelar</button>
                <button onClick={saveExternalLink} className="btn-trello-primary" style={{ padding: '0.55rem 0.9rem', height: 'auto' }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {milestoneToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '12px', maxWidth: '400px', textAlign: 'center' }}>
            <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
            <h3>Excluir Milestone?</h3>
            <p>Deseja realmente excluir o milestone <strong>{milestoneToDelete.name}</strong>? Esta ação excluirá todas as tarefas vinculadas a ele.</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={() => setMilestoneToDelete(null)} className="btn-trello-ghost" style={{ flex: 1 }}>Voltar</button>
              <button onClick={confirmDeleteMilestone} className="btn-trello-primary" style={{ flex: 1, background: '#EF4444' }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InitiativeEditor;
