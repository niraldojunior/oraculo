import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
  FileText,
  CheckSquare,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Trash2,
  Upload,
  Download
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
} from '../../types';
import { TASK_STATUS_ORDER } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PriorityPicker, PRIORITY_OPTIONS } from '../common/PriorityPicker';
import { InitiativeIndicators, InitiativeProperties, InitiativeMilestones } from '../initiative/SidebarComponents';
import { InitiativeTaskBoard } from './InitiativeTaskBoard';
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
  const [externalLinkDraft, setExternalLinkDraft] = useState({
    type: initiative.externalLinkType || 'Azure',
    name: initiative.externalLinkName || '',
    url: initiative.externalLinkUrl || ''
  });
  const [openTaskMenu, setOpenTaskMenu] = useState<'arquivo' | 'filtro' | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | TaskStatus>('all');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState<string>('all');
  const [taskRiskFilter, setTaskRiskFilter] = useState<'all' | 'late' | 'at-risk' | 'not-started'>('all');
  const benefitRef = useRef<HTMLTextAreaElement>(null);
  const rationaleRef = useRef<HTMLTextAreaElement>(null);
  const toolbarMenuRef = useRef<HTMLDivElement>(null);

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

  const activeTaskFilterCount = [taskStatusFilter !== 'all', taskAssigneeFilter !== 'all', taskRiskFilter !== 'all'].filter(Boolean).length;

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

      const ALL_TYPES: MilestoneTaskType[] = ['Feature', 'Melhoria', 'Bug', 'Debito Técnico', 'Enabler', 'DRI', 'Ambiente'];
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

  const demandantDirectorates = ['Operação FTTH', 'Operação B2B/Atacado', 'Comercial FTTH', 'Comercial B2B/Atacado', 'Engenharia', 'TI', 'Outros'];

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
              <div ref={toolbarMenuRef} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', position: 'relative' }}>
                <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                />

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenTaskMenu(prev => prev === 'arquivo' ? null : 'arquivo')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', padding: '0 4px' }}
                  >
                    Arquivo <ChevronDown size={13} />
                  </button>
                  {openTaskMenu === 'arquivo' && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: '150px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 14px 32px rgba(15,23,42,0.12)', padding: '0.35rem', zIndex: 30 }}>
                      <button
                        onClick={() => { fileInputRef.current?.click(); setOpenTaskMenu(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: '#475569', padding: '0.5rem 0.55rem', borderRadius: '8px', textAlign: 'left' }}
                      >
                        <Upload size={13} /> Importar
                      </button>
                      <button
                        onClick={() => { exportToExcel(); setOpenTaskMenu(null); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: '#475569', padding: '0.5rem 0.55rem', borderRadius: '8px', textAlign: 'left' }}
                      >
                        <Download size={13} /> Exportar
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenTaskMenu(prev => prev === 'filtro' ? null : 'filtro')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: '#64748B', padding: '0 4px' }}
                  >
                    Filtro
                    {activeTaskFilterCount > 0 && (
                      <span style={{ background: '#DBEAFE', color: '#1D4ED8', borderRadius: '999px', padding: '0 6px', fontSize: '0.65rem', fontWeight: 800 }}>
                        {activeTaskFilterCount}
                      </span>
                    )}
                    <ChevronDown size={13} />
                  </button>
                  {openTaskMenu === 'filtro' && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: '240px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 14px 32px rgba(15,23,42,0.12)', padding: '0.65rem', zIndex: 30 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>
                          Status
                          <select value={taskStatusFilter} onChange={e => setTaskStatusFilter(e.target.value as 'all' | TaskStatus)} style={{ width: '100%', marginTop: '0.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.45rem', fontSize: '0.72rem' }}>
                            <option value="all">Todos</option>
                            {TASK_STATUS_ORDER.map(status => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </label>

                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>
                          Responsável
                          <select value={taskAssigneeFilter} onChange={e => setTaskAssigneeFilter(e.target.value)} style={{ width: '100%', marginTop: '0.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.45rem', fontSize: '0.72rem' }}>
                            <option value="all">Todos</option>
                            <option value="unassigned">Sem responsável</option>
                            {filterableCollaborators.map(collab => <option key={collab.id} value={collab.id}>{collab.name}</option>)}
                          </select>
                        </label>

                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>
                          Risco
                          <select value={taskRiskFilter} onChange={e => setTaskRiskFilter(e.target.value as 'all' | 'late' | 'at-risk' | 'not-started')} style={{ width: '100%', marginTop: '0.25rem', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.45rem', fontSize: '0.72rem' }}>
                            <option value="all">Todos</option>
                            <option value="late">Atrasado</option>
                            <option value="at-risk">Risco de Atraso</option>
                            <option value="not-started">Não iniciado</option>
                          </select>
                        </label>

                        <button
                          onClick={() => { setTaskStatusFilter('all'); setTaskAssigneeFilter('all'); setTaskRiskFilter('all'); }}
                          style={{ border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', borderRadius: '8px', padding: '0.45rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Limpar filtros
                        </button>
                      </div>
                    </div>
                  )}
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: showSidebar ? '1px solid #E5E7EB' : 'none', overflowY: 'auto', background: '#FFFFFF' }}>
            <div style={{ padding: activeTab === 'tarefas' ? '0' : (activeTab === 'descricao' ? '0.5rem 1.25rem 1.25rem 1.25rem' : '1.25rem'), flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'min-content' }}>
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
