import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  X,
  MessageCircle,  
  FileText,
  Edit2,
  CheckCircle2,
  User,
  Bug,
  Star,
  TrendingUp,
  Wrench,
  Zap,
  Server,
  Download,
  Upload,
  AlertCircle,
  Calendar,
  Tag,
} from 'lucide-react';
import type {
  Initiative,
  Collaborator,
  System,
  MilestoneTaskType,
  MilestoneTask,
  TaskStatus,
  TaskComment,
  TaskHistoryEntry,
} from '../../types';
import { TASK_STATUS_ORDER } from '../../types';
import { renderAvatar } from './SidebarComponents';
import { PRIORITY_OPTIONS, PriorityPicker } from '../common/PriorityPicker';
import type { PriorityValue } from '../common/PriorityPicker';
import { useAuth } from '../../context/AuthContext';

type ImportChange =
  | { type: 'create'; milestoneId: string; taskData: Omit<MilestoneTask, 'id'> }
  | { type: 'update'; milestoneId: string; taskId: string; fields: Partial<MilestoneTask> };

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  'Backlog': {
    label: 'Backlog', color: '#94A3B8',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
  },
  'Todo': {
    label: 'Todo', color: '#64748B',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#64748B" strokeWidth="1.5" /></svg>
  },
  'In Progress': {
    label: 'In Progress', color: '#F59E0B',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#F59E0B" strokeWidth="1.5" /><path d="M7 1.5A5.5 5.5 0 0 1 12.5 7H7V1.5Z" fill="#F59E0B" /></svg>
  },
  'In Review': {
    label: 'In Review', color: '#10B981',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#10B981" strokeWidth="1.5" /><path d="M7 1.5A5.5 5.5 0 0 1 12.5 7A5.5 5.5 0 0 1 7 12.5V1.5Z" fill="#10B981" /></svg>
  },
  'Done': {
    label: 'Done', color: '#6366F1',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#6366F1" /><path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  },
  'Canceled': {
    label: 'Canceled', color: '#94A3B8',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#94A3B8" strokeWidth="1.5" /><path d="M5 5l4 4M9 5l-4 4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" /></svg>
  },
  'Duplicate': {
    label: 'Duplicate', color: '#CBD5E1',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#CBD5E1" strokeWidth="1.5" /><path d="M5 5l4 4M9 5l-4 4" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" /></svg>
  },
};

const formatTaskDate = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const [, month, day] = String(dateStr).split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${parseInt(day)} ${months[parseInt(month, 10) - 1]}`;
  } catch { return dateStr; }
};

export const TYPE_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  'Feature':        { bg: '#EEF2FF', text: '#4F46E5', icon: <Star size={11} /> },
  'Melhoria':       { bg: '#F5F3FF', text: '#7C3AED', icon: <TrendingUp size={11} /> },
  'Bug':            { bg: '#FEF2F2', text: '#DC2626', icon: <Bug size={11} /> },
  'Debito Tecnico': { bg: '#EFF6FF', text: '#2563EB', icon: <Wrench size={11} /> },
  'Debito Técnico': { bg: '#EFF6FF', text: '#2563EB', icon: <Wrench size={11} /> },
  'Enabler':        { bg: '#F0FDFA', text: '#0D9488', icon: <Zap size={11} /> },
  'DRI':            { bg: '#FFF7ED', text: '#C2410C', icon: <FileText size={11} /> },
  'Ambiente':       { bg: '#F0FFF4', text: '#15803D', icon: <Server size={11} /> },
  'Release':        { bg: '#FDF4FF', text: '#9333EA', icon: <Tag size={11} /> },
};

export const ALL_TYPES: MilestoneTaskType[] = ['Feature', 'Melhoria', 'Bug', 'Debito Técnico', 'Enabler', 'DRI', 'Ambiente', 'Release'];

// ─── Task Edit Modal ─────────────────────────────────────────────────────────

interface TaskEditModalProps {
  task: MilestoneTask;
  milestoneId: string;
  allCollaborators: Collaborator[];
  allSystems: System[];
  formData: Initiative;
  onUpdate: (milestoneId: string, taskId: string, field: string, value: any) => void;
  onDelete: (milestoneId: string, taskId: string) => void;
  onClose: () => void;
  user: Collaborator | null;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task, milestoneId, allCollaborators, allSystems, formData,
  onUpdate, onDelete, onClose, user,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [typeDropRect, setTypeDropRect] = useState<{ top: number; left: number; bottom: number } | null>(null);
  const typeButtonRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draftName, setDraftName] = useState(task.name || '');
  const titleTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [draftName]);
  const [draftNotes, setDraftNotes] = useState(task.notes || '');

  useEffect(() => {
    setDraftName(task.name || '');
    setDraftNotes(task.notes || '');
  }, [task.id]);

  const commitTextChanges = () => {
    const updates: Record<string, any> = {};
    if (draftName !== (task.name || '')) updates.name = draftName;
    if (draftNotes !== (task.notes || '')) updates.notes = draftNotes;
    if (Object.keys(updates).length > 0) {
      onUpdate(milestoneId, task.id, '__textFields', updates);
    }
  };

  const handleRequestClose = () => {
    commitTextChanges();
    onClose();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleRequestClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [draftName, draftNotes, task.id, task.name, task.notes]);

  const getSystemIds = (): string[] => {
    if (task.systemIds && task.systemIds.length > 0) return task.systemIds;
    if (task.systemId) return [task.systemId];
    return [];
  };

  const toggleSystem = (sid: string) => {
    const ids = getSystemIds();
    const next = ids.includes(sid) ? ids.filter(i => i !== sid) : [...ids, sid];
    onUpdate(milestoneId, task.id, 'systemIds', next);
  };

  const addComment = () => {
    if (!commentText.trim()) return;
    const entry: TaskHistoryEntry = {
      id: `th_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'anon',
      userName: user?.name || 'Usuário',
      userPhoto: user?.photoUrl,
      type: 'comment',
      content: commentText.trim(),
    };
    onUpdate(milestoneId, task.id, 'taskHistory', [entry, ...(task.taskHistory || [])]);
    setCommentText('');
    setIsAddingComment(false);
  };

  const sortedHistory = [...(task.taskHistory || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const FieldLabel: React.FC<{ label: string }> = ({ label }) => (
    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>{label}</div>
  );

  const impactedSystems = allSystems.filter(s => (formData.impactedSystemIds || []).includes(s.id));
  const assignableCollaborators = (() => {
    const scoped = allCollaborators.filter(c => (formData.memberIds || []).includes(c.id));
    return scoped.length > 0 ? scoped : allCollaborators;
  })();
  const currentSystemIds = getSystemIds();
  const currentPriority = PRIORITY_OPTIONS.find(o => o.value === (task.priority ?? 0)) || PRIORITY_OPTIONS[0];
  const currentAssignee = task.assigneeId ? allCollaborators.find(c => c.id === task.assigneeId) : null;
  const currentTypeStyle = task.type ? (TYPE_STYLES[task.type] || TYPE_STYLES['Feature']) : null;

  const formatShortDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Sem data';
    try {
      const [, month, day] = String(dateStr).split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${parseInt(day)} ${months[parseInt(month, 10) - 1]}`;
    } catch {
      return dateStr;
    }
  };

  const triggerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    minHeight: '46px',
    padding: '0.78rem 0.9rem',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    cursor: 'pointer',
    textAlign: 'left',
    boxSizing: 'border-box',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    zIndex: 20,
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 14px 32px rgba(15,23,42,0.12)',
    padding: '6px',
    maxHeight: '260px',
    overflowY: 'auto',
  };

  return ReactDOM.createPortal(
    <div
      onClick={handleRequestClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000004, backdropFilter: 'blur(3px)',
      }}
    >
      <div
        className="task-edit-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '26px', width: 'min(1140px, 97vw)',
          maxWidth: '97vw', maxHeight: '93vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1000005,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.6rem 1.1rem 0.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.14rem', fontWeight: 700, color: '#0F172A' }}>
              <Edit2 size={18} color="#334155" />
              Editar Tarefa
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              title="Excluir tarefa"
              aria-label="Excluir tarefa"
              style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#E11D48', cursor: 'pointer', width: '2.05rem', height: '2.05rem', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              className="btn-icon-hover"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={handleRequestClose}
              style={{ background: 'rgba(0,0,0,0.05)', border: 'none', color: '#64748B', cursor: 'pointer', padding: '0.45rem', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="btn-icon-hover"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 1.1rem 1rem' }}>
          <div className="task-edit-modal-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: '1.1rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', minWidth: 0 }}>
              <div>
                <FieldLabel label="Título" />
                <textarea
                  ref={titleTextareaRef}
                  className="task-title-textarea"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  rows={1}
                  placeholder="Nome da tarefa"
                  style={{
                    width: '100%',
                    border: '1px solid var(--glass-border)',
                    outline: 'none',
                    resize: 'none',
                    padding: '0.68rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    background: 'var(--bg-app)',
                    color: task.status === 'Done' ? '#94A3B8' : 'var(--text-primary)',
                    textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <FieldLabel label="Propriedades" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')} style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}>
                      {TASK_STATUS_CONFIG[task.status || 'Backlog'].icon}
                      <span>{TASK_STATUS_CONFIG[task.status || 'Backlog'].label}</span>
                    </button>
                    {openDropdown === 'status' && (
                      <div style={{ ...dropdownStyle, minWidth: '200px', right: 'auto' }}>
                        {TASK_STATUS_ORDER.map(s => (
                          <button
                            key={s}
                            onClick={() => { onUpdate(milestoneId, task.id, 'status', s); setOpenDropdown(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: (task.status || 'Backlog') === s ? '#F1F5F9' : 'transparent' }}
                            className="picker-item-hover"
                          >
                            {TASK_STATUS_CONFIG[s].icon}
                            <span style={{ flex: 1 }}>{TASK_STATUS_CONFIG[s].label}</span>
                            {(task.status || 'Backlog') === s && <span style={{ color: '#6366F1', fontSize: 11 }}>&#10003;</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')} style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}>
                      <span style={{ color: currentPriority.color, display: 'flex', width: 14, justifyContent: 'center' }}>{currentPriority.icon}</span>
                      <span>{currentPriority.label}</span>
                    </button>
                    {openDropdown === 'priority' && (
                      <div style={{ ...dropdownStyle, minWidth: '190px', right: 'auto' }}>
                        {PRIORITY_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { onUpdate(milestoneId, task.id, 'priority', opt.value); setOpenDropdown(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: (task.priority ?? 0) === opt.value ? '#F1F5F9' : 'transparent' }}
                            className="picker-item-hover"
                          >
                            <span style={{ color: opt.color, display: 'flex', width: 14, justifyContent: 'center' }}>{opt.icon}</span>
                            <span style={{ flex: 1 }}>{opt.label}</span>
                            {(task.priority ?? 0) === opt.value && <span style={{ color: '#6366F1', fontSize: 11 }}>&#10003;</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div ref={typeButtonRef} style={{ position: 'relative' }}>
                    <button onClick={() => {
                      if (openDropdown === 'type') { setOpenDropdown(null); setTypeDropRect(null); return; }
                      const rect = typeButtonRef.current?.getBoundingClientRect();
                      if (rect) setTypeDropRect({ top: rect.bottom + 6, left: rect.left, bottom: rect.top - 6 });
                      setOpenDropdown('type');
                    }} style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}>
                      {currentTypeStyle ? <span style={{ color: currentTypeStyle.text, display: 'flex', width: 14, justifyContent: 'center' }}>{currentTypeStyle.icon}</span> : <Tag size={14} color="#94A3B8" />}
                      <span>{task.type || 'Tipo'}</span>
                    </button>
                    {openDropdown === 'type' && typeDropRect && (() => {
                      const dropH = Math.min(220, (ALL_TYPES.length + 1) * 26 + 8);
                      const openUp = typeDropRect.top + dropH > window.innerHeight;
                      const fixedStyle: React.CSSProperties = {
                        position: 'fixed',
                        left: typeDropRect.left,
                        zIndex: 1000010,
                        background: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 6px 14px rgba(15,23,42,0.09)',
                        padding: '2px',
                        minWidth: '120px',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        ...(openUp
                          ? { bottom: window.innerHeight - typeDropRect.bottom, top: 'auto' }
                          : { top: typeDropRect.top }),
                      };
                      return (
                        <div style={fixedStyle}>
                          <button
                            onClick={() => { onUpdate(milestoneId, task.id, 'type', null); setOpenDropdown(null); setTypeDropRect(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: !task.type ? '#F1F5F9' : 'transparent', textAlign: 'left', width: '100%', fontSize: '0.65rem', color: '#64748B' }}
                            className="picker-item-hover"
                          >
                            <X size={9} color="#94A3B8" />
                            <span style={{ flex: 1 }}>Nenhum</span>
                            {!task.type && <span style={{ color: '#6366F1', fontSize: 9 }}>&#10003;</span>}
                          </button>
                          {ALL_TYPES.map(t => (
                            <button
                              key={t}
                              onClick={() => { onUpdate(milestoneId, task.id, 'type', t); setOpenDropdown(null); setTypeDropRect(null); }}
                              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: task.type === t ? '#F1F5F9' : 'transparent', fontSize: '0.65rem', color: '#374151' }}
                              className="picker-item-hover"
                            >
                              <span style={{ color: (TYPE_STYLES[t] || TYPE_STYLES['Feature']).text, display: 'flex', width: 10, justifyContent: 'center' }}>{(TYPE_STYLES[t] || TYPE_STYLES['Feature']).icon}</span>
                              <span style={{ flex: 1 }}>{t}</span>
                              {task.type === t && <span style={{ color: '#6366F1', fontSize: 9 }}>&#10003;</span>}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee')} style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}>
                      {currentAssignee ? renderAvatar(currentAssignee.id, allCollaborators, 18) : <User size={13} color="#94A3B8" />}
                      <span>{currentAssignee?.name || 'Responsável'}</span>
                    </button>
                    {openDropdown === 'assignee' && (
                      <div style={{ ...dropdownStyle, minWidth: '230px', right: 'auto' }}>
                        <button
                          onClick={() => { onUpdate(milestoneId, task.id, 'assigneeId', null); setOpenDropdown(null); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: !task.assigneeId ? '#F1F5F9' : 'transparent', textAlign: 'left', width: '100%' }}
                          className="picker-item-hover"
                        >
                          <User size={12} color="#94A3B8" />
                          <span style={{ flex: 1 }}>Nenhum</span>
                          {!task.assigneeId && <span style={{ color: '#6366F1', fontSize: 11 }}>&#10003;</span>}
                        </button>
                        {assignableCollaborators.map(c => (
                          <button
                            key={c.id}
                            onClick={() => { onUpdate(milestoneId, task.id, 'assigneeId', c.id); setOpenDropdown(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: task.assigneeId === c.id ? '#F1F5F9' : 'transparent' }}
                            className="picker-item-hover"
                          >
                            {renderAvatar(c.id, allCollaborators, 18)}
                            <span style={{ flex: 1 }}>{c.name}</span>
                            {task.assigneeId === c.id && <span style={{ color: '#6366F1', fontSize: 11 }}>&#10003;</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {impactedSystems.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setOpenDropdown(openDropdown === 'systems' ? null : 'systems')} style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}>
                        <Server size={14} color="#94A3B8" />
                        <span>
                          {currentSystemIds.length > 0
                            ? (() => {
                                const first = impactedSystems.find(s => String(s.id) === currentSystemIds[0]);
                                const label = first ? (first.acronym || first.name) : currentSystemIds[0];
                                return currentSystemIds.length > 1 ? `${label} +${currentSystemIds.length - 1}` : label;
                              })()
                            : 'Sistemas'}
                        </span>
                      </button>
                      {openDropdown === 'systems' && (
                        <div style={{ ...dropdownStyle, minWidth: '230px', right: 'auto' }}>
                          <button
                            onClick={() => { onUpdate(milestoneId, task.id, 'systemIds', []); setOpenDropdown(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: currentSystemIds.length === 0 ? '#F1F5F9' : 'transparent' }}
                            className="picker-item-hover"
                          >
                            <X size={12} color="#94A3B8" />
                            <span style={{ flex: 1 }}>Nenhum</span>
                            {currentSystemIds.length === 0 && <span style={{ color: '#6366F1', fontSize: 11 }}>&#10003;</span>}
                          </button>
                          {impactedSystems.map(s => {
                            const sel = currentSystemIds.includes(String(s.id));
                            return (
                              <button
                                key={s.id}
                                onClick={() => toggleSystem(String(s.id))}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: sel ? '#F1F5F9' : 'transparent' }}
                                className="picker-item-hover"
                              >
                                <div style={{ width: 16, height: 16, borderRadius: '4px', border: `1.5px solid ${sel ? '#6366F1' : '#CBD5E1'}`, background: sel ? '#6366F1' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {sel && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>&#10003;</span>}
                                </div>
                                <span style={{ flex: 1 }}>{s.acronym || s.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => { (e.currentTarget.nextElementSibling as HTMLInputElement)?.showPicker?.(); }}
                        style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}
                      >
                        <Calendar size={14} color="#94A3B8" />
                        <span>{task.startDate ? formatShortDate(task.startDate) : 'Início'}</span>
                      </button>
                      <input
                        key={task.startDate || 'sd-empty'}
                        type="date"
                        defaultValue={task.startDate || ''}
                        onChange={e => onUpdate(milestoneId, task.id, 'startDate', e.target.value || null)}
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                      />
                    </div>
                    {task.startDate && (
                      <button
                        onClick={() => onUpdate(milestoneId, task.id, 'startDate', null)}
                        style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')}
                        title="Limpar data"
                      ><X size={11} /></button>
                    )}
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => { (e.currentTarget.nextElementSibling as HTMLInputElement)?.showPicker?.(); }}
                        style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}
                      >
                        <Calendar size={14} color="#94A3B8" />
                        <span>{task.targetDate ? formatShortDate(task.targetDate) : 'Target'}</span>
                      </button>
                      <input
                        key={task.targetDate || 'td-empty'}
                        type="date"
                        defaultValue={task.targetDate || ''}
                        onChange={e => onUpdate(milestoneId, task.id, 'targetDate', e.target.value || null)}
                        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                      />
                    </div>
                    {task.targetDate && (
                      <button
                        onClick={() => onUpdate(milestoneId, task.id, 'targetDate', null)}
                        style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: '4px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')}
                        title="Limpar data"
                      ><X size={11} /></button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <FieldLabel label="Descrição" />
                <textarea
                  className="task-desc-textarea"
                  value={draftNotes}
                  onChange={e => setDraftNotes(e.target.value)}
                  placeholder="Descreva o objetivo, o contexto e o que precisa ser entregue."
                  rows={7}
                  style={{
                    width: '100%',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0.68rem',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                    background: 'var(--bg-app)',
                    minHeight: '200px',
                  }}
                />
              </div>
            </div>

            <div className="task-comments-panel" style={{ background: '#FBFDFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '100%' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>
                  <MessageCircle size={13} color="#94A3B8" />
                  Histórico
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                  {sortedHistory.length}
                </div>
              </div>

              {/* Add comment */}
              {!isAddingComment ? (
                <button
                  onClick={() => setIsAddingComment(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: 'none', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', padding: '0.2rem 0', width: 'fit-content' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                >
                  <Plus size={12} /> Adicionar comentário
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: '#F8FAFC', padding: '0.55rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <textarea
                    autoFocus
                    placeholder="Registre um contexto, decisão ou blocker..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    style={{ width: '100%', minHeight: '52px', border: 'none', background: 'transparent', resize: 'none', padding: 0, outline: 'none', fontSize: '0.78rem', color: '#1E293B', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.4rem' }}>
                    <button onClick={() => { setIsAddingComment(false); setCommentText(''); }} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <X size={11} /> Cancelar
                    </button>
                    <button onClick={addComment} style={{ background: '#1E293B', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Salvar
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, minHeight: '180px', maxHeight: '52vh', paddingRight: '0.1rem' }}>
                {sortedHistory.length === 0 ? (
                  <div style={{ border: '1px dashed #E2E8F0', borderRadius: '8px', padding: '0.9rem', color: '#CBD5E1', background: '#FAFAFA', fontSize: '0.72rem', lineHeight: 1.5 }}>
                    Nenhuma alteração registrada ainda. Mudanças de status, responsável, datas e comentários aparecerão aqui.
                  </div>
                ) : (
                  <div style={{ position: 'relative', paddingLeft: '1.2rem' }}>
                    {/* Vertical line */}
                    <div style={{ position: 'absolute', left: '5px', top: '7px', bottom: '7px', width: '1px', background: '#E2E8F0' }} />
                    {sortedHistory.map((entry, idx) => {
                      const isComment = entry.type === 'comment';
                      const fmtTime = new Date(entry.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                      const fieldLabels: Record<string, string> = {
                        status: 'Status', priority: 'Prioridade', assigneeId: 'Responsável',
                        startDate: 'Data início', targetDate: 'Data fim', type: 'Tipo',
                      };
                      return (
                        <div key={entry.id} style={{ position: 'relative', paddingBottom: idx < sortedHistory.length - 1 ? '0.75rem' : 0 }}>
                          {/* Dot */}
                          <div style={{
                            position: 'absolute', left: '-1.2rem', top: '4px',
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: isComment ? '#6366F1' : '#fff',
                            border: isComment ? '2px solid #6366F1' : '1.5px solid #CBD5E1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1,
                          }}>
                            {isComment
                              ? <MessageCircle size={5} color="white" />
                              : <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#CBD5E1' }} />
                            }
                          </div>

                          {isComment ? (
                            <div style={{ background: '#FAFAFA', border: '1px solid #F1F5F9', borderRadius: '6px', padding: '0.45rem 0.55rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.7rem' }}>{entry.userName}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ color: '#CBD5E1', fontSize: '0.65rem' }}>{fmtTime}</span>
                                  <button
                                    onClick={() => {
                                      const updated = (task.taskHistory || []).filter(e => e.id !== entry.id);
                                      onUpdate(milestoneId, task.id, 'taskHistory', updated);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 0, display: 'flex' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')}
                                    title="Excluir"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                              {editingCommentId === entry.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  <textarea
                                    autoFocus
                                    value={editCommentText}
                                    onChange={e => setEditCommentText(e.target.value)}
                                    style={{ width: '100%', minHeight: '48px', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '0.35rem', resize: 'none', outline: 'none', fontSize: '0.75rem', color: '#1E293B', fontFamily: 'inherit' }}
                                  />
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                                    <button onClick={() => setEditingCommentId(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem' }}>Cancelar</button>
                                    <button onClick={() => {
                                      const updated = (task.taskHistory || []).map(e => e.id === entry.id ? { ...e, content: editCommentText.trim() } : e);
                                      onUpdate(milestoneId, task.id, 'taskHistory', updated);
                                      setEditingCommentId(null);
                                    }} style={{ background: '#1E293B', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem' }}>Salvar</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.3rem' }}>
                                  <p style={{ color: '#64748B', margin: 0, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap', flex: 1, fontSize: '0.75rem' }}>{entry.content}</p>
                                  <button onClick={() => { setEditingCommentId(entry.id); setEditCommentText(entry.content || ''); }} style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: 0, flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.color = '#64748B')} onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')} title="Editar"><Edit2 size={10} /></button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ paddingTop: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', flexWrap: 'wrap', lineHeight: 1.4 }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B' }}>{entry.userName}</span>
                                <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>alterou</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569' }}>{fieldLabels[entry.field || ''] || entry.field}</span>
                              </div>
                              {entry.from && entry.to && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '0.65rem', color: '#94A3B8', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '3px', padding: '0 5px', lineHeight: '1.6' }}>{entry.from}</span>
                                  <span style={{ fontSize: '0.62rem', color: '#CBD5E1' }}>→</span>
                                  <span style={{ fontSize: '0.65rem', color: '#334155', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '3px', padding: '0 5px', fontWeight: 600, lineHeight: '1.6' }}>{entry.to}</span>
                                </div>
                              )}
                              <span style={{ fontSize: '0.62rem', color: '#CBD5E1', display: 'block', marginTop: '0.1rem' }}>{fmtTime}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <style>{`
            .task-edit-modal {
              font-size: 0.88rem;
            }
            .task-edit-modal .task-desc-textarea:focus,
            .task-edit-modal .task-title-textarea:focus {
              border-color: var(--accent-base) !important;
              box-shadow: 0 0 0 2px var(--accent-dim) !important;
              background: var(--bg-card) !important;
            }
            .task-edit-modal div,
            .task-edit-modal span,
            .task-edit-modal p,
            .task-edit-modal label,
            .task-edit-modal button,
            .task-edit-modal input,
            .task-edit-modal textarea {
              font-size: inherit !important;
            }
            @media (max-width: 920px) {
              .task-edit-modal-layout {
                grid-template-columns: 1fr !important;
              }
            }
            @media (max-width: 680px) {
              .task-edit-detail-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>

        {showDeleteConfirm && (
          <div
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.42)',
              zIndex: 1000006,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: 'min(420px, 92vw)',
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 18px 40px rgba(15,23,42,0.2)',
                padding: '1rem 1.1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#0F172A', fontWeight: 700, marginBottom: '0.5rem' }}>
                <AlertCircle size={16} color="#E11D48" />
                Confirmar exclusão
              </div>
              <p style={{ margin: 0, color: '#64748B', lineHeight: 1.45 }}>
                Deseja realmente excluir esta tarefa? Esta ação não pode ser desfeita.
              </p>
              <div style={{ marginTop: '0.95rem', display: 'flex', justifyContent: 'flex-end', gap: '0.55rem' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', borderRadius: '10px', padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { onDelete(milestoneId, task.id); setShowDeleteConfirm(false); onClose(); }}
                  style={{ border: '1px solid #FECDD3', background: '#FFF1F2', color: '#E11D48', borderRadius: '10px', padding: '0.5rem 0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Excluir tarefa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ─── Main Board ──────────────────────────────────────────────────────────────

interface InitiativeTaskBoardProps {
  formData: Initiative;
  allCollaborators: Collaborator[];
  allSystems: System[];
  onTaskUpdate: (milestoneId: string, taskId: string, field: string, value: any) => void;
  onTaskDelete: (milestoneId: string, taskId: string) => void;
  onTaskAdd: (milestoneId: string, name: string) => void;
  onTaskReorder: (milestoneId: string, sourceId: string, targetId: string) => void;
  onTaskMoveToMilestone: (sourceMilestoneId: string, targetMilestoneId: string, taskId: string) => void;
  onMilestoneUpdate: () => void;
  onMilestoneDelete: (id: string) => void;
  onMilestoneReorder: (s: string, t: string) => void;
  setEditingMilestoneId: (id: string | null) => void;
  editingMilestoneId: string | null;
  setEditMilestoneText: (text: string) => void;
  editMilestoneText: string;
  activeMilestoneId?: string | null;
  statusFilter?: TaskStatus[];
  assigneeFilter?: string;
  riskFilter?: 'all' | 'late' | 'at-risk' | 'not-started';
  viewMode?: 'list' | 'board' | 'timeline';
  onBulkImport?: (changes: ImportChange[]) => void;
}

export const InitiativeTaskBoard: React.FC<InitiativeTaskBoardProps> = ({
  formData,
  allCollaborators,
  allSystems,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
  onTaskReorder,
  onTaskMoveToMilestone,
  onMilestoneUpdate,
  onMilestoneDelete,
  onMilestoneReorder,
  setEditingMilestoneId,
  editingMilestoneId,
  setEditMilestoneText,
  editMilestoneText,
  activeMilestoneId,
  statusFilter = [] as TaskStatus[],
  assigneeFilter = 'all',
  riskFilter = 'all',
  viewMode = 'list',
  onBulkImport,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<{ milestoneId: string; taskId: string } | null>(null);
  const [draggedMilestoneId, setDraggedMilestoneId] = useState<string | null>(null);
  const [milestoneDropTarget, setMilestoneDropTarget] = useState<string | null>(null);
  const [expandedMilestoneIds, setExpandedMilestoneIds] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<{ milestoneId: string; task: MilestoneTask } | null>(null);
  const [activePicker, setActivePicker] = useState<{ taskId: string; milestoneId: string; type: 'priority' | 'status' | 'type' | 'assignee' | 'systems' | 'startDate' | 'targetDate'; position: { top: number; left?: number; right?: number } } | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (formData.milestones && expandedMilestoneIds.size === 0) {
      // Só abre milestones que NÃO estão 100% concluídos
      const openIds = formData.milestones
        .filter(m => {
          const total = (m.tasks || []).length;
          const done = (m.tasks || []).filter(t => t.status === 'Done').length;
          return !(total > 0 && done === total);
        })
        .map(m => m.id);
      setExpandedMilestoneIds(new Set(openIds));
    }
  }, [formData.milestones]);

  useEffect(() => {
    if (activeMilestoneId) {
      setExpandedMilestoneIds(prev => {
        const next = new Set(prev);
        next.add(activeMilestoneId);
        return next;
      });
    }
  }, [activeMilestoneId]);

  // Keep modal in sync with formData changes
  useEffect(() => {
    if (!editingTask) return;
    const ms = (formData.milestones || []).find(m => m.id === editingTask.milestoneId);
    const t = ms?.tasks?.find(t => t.id === editingTask.task.id);
    if (t) setEditingTask({ milestoneId: editingTask.milestoneId, task: t });
  }, [formData]);

  // Close any active picker on Escape
  useEffect(() => {
    if (!activePicker) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setActivePicker(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activePicker]);

  const toggleMilestone = (id: string) => {
    setExpandedMilestoneIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [, month, day] = dateStr.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
    } catch { return dateStr; }
  };

  const getTaskSystemIds = (task: MilestoneTask): string[] => {
    if (task.systemIds && task.systemIds.length > 0) return task.systemIds;
    if (task.systemId) return [task.systemId];
    return [];
  };

  // ─── Export to Excel ─────────────────────────────────────────────────────
  const exportToExcel = () => {
    const headers = [
      'Milestone', 'Tarefa', 'Status', 'Prioridade', 'Tipo',
      'Responsável', 'Sistemas', 'Data Início', 'Data Fim', 'Observação',
    ];
    const rows: (string | null)[][] = [headers];

    (formData.milestones || []).forEach(milestone => {
      (milestone.tasks || []).forEach(task => {
        const assignee = allCollaborators.find(c => c.id === task.assigneeId);
        const sysIds = getTaskSystemIds(task);
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

  // ─── Import from Excel ───────────────────────────────────────────────────
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

      const priorityMap: Record<string, number> = {};
      PRIORITY_OPTIONS.forEach(o => { priorityMap[o.label.toLowerCase()] = o.value; });

      const validStatuses: string[] = TASK_STATUS_ORDER as unknown as string[];
      const validTypes: string[] = ALL_TYPES as unknown as string[];
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
        if (!milestone) {
          errors.push(`Linha ${i + 1}: milestone "${milestoneName}" não encontrado`);
          skipped++;
          continue;
        }

        const assignee = responsavelName
          ? allCollaborators.find(c => c.name.toLowerCase().trim() === responsavelName.toLowerCase())
          : null;

        const systemIds = sistemasStr
          ? sistemasStr.split(',').map(s => s.trim()).map(name => {
              const sys = allSystems.find(s =>
                (s.acronym || '').toLowerCase() === name.toLowerCase() ||
                s.name.toLowerCase() === name.toLowerCase()
              );
              return sys ? String(sys.id) : null;
            }).filter(Boolean) as string[]
          : [];

        const finalStatus = (validStatuses.includes(statusStr) ? statusStr : 'Backlog') as TaskStatus;
        const finalPriority = priorityMap[priorityStr.toLowerCase()] ?? 0;
        const finalType = (validTypes.includes(typeStr) ? typeStr : null) as MilestoneTaskType | null;

        const existingTask = (milestone.tasks || []).find(
          t => t.name.toLowerCase().trim() === taskName.toLowerCase()
        );

        if (existingTask) {
          const fields: Partial<MilestoneTask> = {};
          if (statusStr && existingTask.status !== finalStatus) fields.status = finalStatus;
          if (priorityStr && (existingTask.priority ?? 0) !== finalPriority) fields.priority = finalPriority;
          if (typeStr && existingTask.type !== finalType) fields.type = finalType;
          if (responsavelName && existingTask.assigneeId !== (assignee?.id ?? null)) fields.assigneeId = assignee?.id ?? null;
          if (sistemasStr) {
            const cur = getTaskSystemIds(existingTask);
            if (JSON.stringify(cur.sort()) !== JSON.stringify(systemIds.sort())) fields.systemIds = systemIds;
          }
          if (startDate !== (existingTask.startDate || '')) fields.startDate = startDate || null;
          if (targetDate !== (existingTask.targetDate || '')) fields.targetDate = targetDate || null;
          if (notes !== (existingTask.notes || '')) fields.notes = notes || undefined;

          if (Object.keys(fields).length > 0) {
            changes.push({ type: 'update', milestoneId: milestone.id, taskId: existingTask.id, fields });
            updated++;
          }
        } else {
          changes.push({
            type: 'create',
            milestoneId: milestone.id,
            taskData: {
              name: taskName,
              status: finalStatus,
              milestoneId: milestone.id,
              priority: finalPriority,
              type: finalType,
              assigneeId: assignee?.id ?? null,
              systemIds,
              startDate: startDate || null,
              targetDate: targetDate || null,
              notes: notes || undefined,
            }
          });
          created++;
        }
      }

      if (changes.length > 0 && onBulkImport) onBulkImport(changes);

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

  const hasActiveFilters = statusFilter.length > 0 || assigneeFilter !== 'all' || riskFilter !== 'all';

  const matchesRiskFilter = (task: MilestoneTask) => {
    if (riskFilter === 'all') return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCompleted = ['Done', 'Canceled', 'Duplicate'].includes(task.status);
    const target = task.targetDate ? new Date(task.targetDate) : null;
    if (target) target.setHours(0, 0, 0, 0);

    if (riskFilter === 'late') {
      return !!target && target < today && !isCompleted;
    }

    if (riskFilter === 'at-risk') {
      if (!target || isCompleted) return false;
      const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }

    if (riskFilter === 'not-started') {
      return task.status === 'Backlog' || task.status === 'Todo';
    }

    return true;
  };

  const milestonesToRender = useMemo(() => {
    const baseMilestones = activeMilestoneId
      ? (formData.milestones || []).filter(m => m.id === activeMilestoneId)
      : (formData.milestones || []);

    return baseMilestones
      .map(milestone => ({
        ...milestone,
        tasks: (milestone.tasks || []).filter(task => {
          if (statusFilter.length > 0 && !statusFilter.includes(task.status || 'Backlog')) return false;
          if (assigneeFilter === 'unassigned' && task.assigneeId) return false;
          if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned' && task.assigneeId !== assigneeFilter) return false;
          if (!matchesRiskFilter(task)) return false;
          return true;
        })
      }))
      .filter(milestone => !hasActiveFilters || (milestone.tasks || []).length > 0);
  }, [activeMilestoneId, assigneeFilter, formData.milestones, hasActiveFilters, riskFilter, statusFilter]);

  const BOARD_STATUS_ORDER: TaskStatus[] = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done'];

  const allFilteredTasks = useMemo(() => {
    return milestonesToRender.flatMap(m =>
      (m.tasks || []).map(t => ({ ...t, milestoneName: m.name, milestoneId: m.id }))
    );
  }, [milestonesToRender]);

  if (viewMode === 'board') {
    const dragRef = { taskId: '' as string, milestoneId: '' as string };

    const handleDragStart = (e: React.DragEvent, taskId: string, milestoneId: string) => {
      dragRef.taskId = taskId;
      dragRef.milestoneId = milestoneId;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', taskId);
      (e.currentTarget as HTMLElement).style.opacity = '0.4';
    };

    const handleDragEnd = (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      (e.currentTarget as HTMLElement).style.background = '#EEF2FF';
    };

    const handleDragLeave = (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.background = '#F8F9FA';
    };

    const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).style.background = '#F8F9FA';
      if (dragRef.taskId && dragRef.milestoneId) {
        onTaskUpdate(dragRef.milestoneId, dragRef.taskId, 'status', targetStatus);
        dragRef.taskId = '';
        dragRef.milestoneId = '';
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {editingTask && (
          <TaskEditModal
            task={editingTask.task}
            milestoneId={editingTask.milestoneId}
            allCollaborators={allCollaborators}
            allSystems={allSystems}
            formData={formData}
            onUpdate={onTaskUpdate}
            onDelete={onTaskDelete}
            onClose={() => setEditingTask(null)}
            user={user}
          />
        )}
        <div style={{
          display: 'flex',
          gap: '0.8rem',
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '100%',
          padding: '0.75rem 1rem 1rem',
          alignItems: 'flex-start',
          boxSizing: 'border-box',
        }}>
          {BOARD_STATUS_ORDER.map(status => {
            const cfg = TASK_STATUS_CONFIG[status];
            const colTasks = allFilteredTasks.filter(t => (t.status || 'Backlog') === status);
            return (
              <div key={status} style={{
                minWidth: 219, maxWidth: 219, flexShrink: 0,
                background: '#F8F9FA', borderRadius: 12,
                display: 'flex', flexDirection: 'column',
                maxHeight: '100%', border: 'none',
                transition: 'background 0.15s',
              }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, status)}
              >
                {/* Column header */}
                <div style={{ padding: '0.85rem 1rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'flex' }}>{cfg.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#1E293B' }}>{cfg.label}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', background: '#E2E8F0', borderRadius: '20px', padding: '1px 8px' }}>{colTasks.length}</span>
                </div>
                {/* Column cards */}
                <div style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.25rem 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {colTasks.map(task => {
                    const priorityOpt = PRIORITY_OPTIONS[task.priority ?? 0];
                    const typeStyle = task.type ? (TYPE_STYLES[task.type] || null) : null;
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => handleDragStart(e, task.id, task.milestoneId)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setEditingTask({ milestoneId: task.milestoneId, task })}
                        style={{
                          background: '#FFFFFF', borderRadius: 10,
                          border: '1px solid #E2E8F0',
                          padding: '0.65rem 0.75rem',
                          cursor: 'grab', transition: 'box-shadow 0.15s, opacity 0.15s',
                          display: 'flex', flexDirection: 'column', gap: '0.45rem',
                          position: 'relative',
                        }}
                        className="task-board-card"
                      >
                        {/* Target date — top right */}
                        {task.targetDate && (
                          <span style={{
                            position: 'absolute', top: '0.55rem', right: '0.65rem',
                            fontSize: '0.6rem', fontWeight: 600,
                            color: task.status === 'Done' ? '#94A3B8' : '#64748B',
                            background: '#F1F5F9', borderRadius: '5px', padding: '1px 5px',
                            whiteSpace: 'nowrap',
                          }}>
                            {formatTaskDate(task.targetDate)}
                          </span>
                        )}
                        {/* Type badge */}
                        {task.type && typeStyle && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start',
                            background: '#F1F5F9', border: '1px solid #E2E8F0',
                            padding: '2px 8px', borderRadius: '20px',
                            fontSize: '0.65rem', fontWeight: 500, color: '#475569',
                          }}>
                            <span style={{ color: typeStyle.text, display: 'flex' }}>{typeStyle.icon}</span>
                            {task.type}
                          </span>
                        )}
                        {/* Name */}
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: task.status === 'Done' ? '#94A3B8' : '#1E293B', lineHeight: 1.4, textDecoration: task.status === 'Done' ? 'line-through' : 'none' }}>{task.name}</span>
                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 500, background: '#F1F5F9', borderRadius: '6px', padding: '1px 6px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.milestoneName}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {task.priority != null && task.priority > 0 && (
                              <span style={{ color: priorityOpt?.color, display: 'flex' }}>{priorityOpt?.icon}</span>
                            )}
                            {task.assigneeId && renderAvatar(task.assigneeId, allCollaborators, 20)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <style>{`
          .task-board-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; border-color: #CBD5E1 !important; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '0.75rem 0', paddingBottom: '4rem' }}>

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask.task}
          milestoneId={editingTask.milestoneId}
          allCollaborators={allCollaborators}
          allSystems={allSystems}
          formData={formData}
          onUpdate={onTaskUpdate}
          onDelete={onTaskDelete}
          onClose={() => setEditingTask(null)}
          user={user}
        />
      )}

      {milestonesToRender.map(milestone => {
        const isExpanded = expandedMilestoneIds.has(milestone.id);
        const allTasks = (formData.milestones || []).find(m => m.id === milestone.id)?.tasks || [];
        const tasks = milestone.tasks || [];
        const doneTasks = allTasks.filter(t => t.status === 'Done').length;
        const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

        return (
          <div key={milestone.id}>
            {/* Milestone Header */}
            <div
              draggable
              onDragStart={() => setDraggedMilestoneId(milestone.id)}
              onDragOver={e => {
                e.preventDefault();
                if (draggedTaskId) setMilestoneDropTarget(milestone.id);
              }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setMilestoneDropTarget(null);
              }}
              onDrop={e => {
                if (draggedTaskId && draggedTaskId.milestoneId !== milestone.id) {
                  onTaskMoveToMilestone(draggedTaskId.milestoneId, milestone.id, draggedTaskId.taskId);
                  setDraggedTaskId(null);
                  setMilestoneDropTarget(null);
                } else if (draggedMilestoneId && draggedMilestoneId !== milestone.id) {
                  onMilestoneReorder(draggedMilestoneId, milestone.id);
                  setDraggedMilestoneId(null);
                }
              }}
              className="milestone-card"
              onClick={e => { if ((e.target as HTMLElement).closest('button')) return; toggleMilestone(milestone.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: milestoneDropTarget === milestone.id && draggedTaskId ? '#EEF2FF' : '#F8FAFC',
                padding: '0.25rem 0.85rem',
                borderRadius: '10px',
                border: milestoneDropTarget === milestone.id && draggedTaskId ? '1.5px dashed #6366F1' : isExpanded ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                cursor: 'pointer', transition: 'all 0.2s ease',
                opacity: draggedMilestoneId === milestone.id ? 0.4 : 1,
                boxShadow: isExpanded ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                marginLeft: '1rem', marginRight: '1rem',
              }}
            >
              <div style={{ color: '#94A3B8', cursor: 'grab', display: 'flex' }} className="milestone-drag mobile-task-hide">
                <GripVertical size={14} />
              </div>
              <div style={{ color: progress === 100 ? '#10B981' : '#3B82F6', display: 'flex' }}>
                <CheckCircle2 size={18} fill={progress === 100 ? '#10B981' : 'transparent'} color={progress === 100 ? '#FFF' : '#3B82F6'} strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1 }}>
                {editingMilestoneId === milestone.id ? (
                  <input
                    autoFocus
                    value={editMilestoneText}
                    onChange={e => setEditMilestoneText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') onMilestoneUpdate();
                      if (e.key === 'Escape') setEditingMilestoneId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    onBlur={onMilestoneUpdate}
                    style={{ border: '1px solid #3B82F6', borderRadius: '4px', fontSize: '0.9rem', padding: '2px 8px', width: '100%', outline: 'none' }}
                  />
                ) : (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>{milestone.name}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>{progress}%</span>
                <div className="milestone-actions mobile-task-hide" draggable={false} onDragStart={e => e.stopPropagation()} style={{ display: 'flex', gap: '0.4rem', opacity: 0, transition: 'opacity 0.2s' }}>
                  <button
                    draggable={false}
                    onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
                    onClick={e => { e.stopPropagation(); setEditingMilestoneId(milestone.id); setEditMilestoneText(milestone.name); }}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    className="btn-icon-hover"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    draggable={false}
                    onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
                    onClick={e => { e.stopPropagation(); onMilestoneDelete(milestone.id); }}
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    className="btn-icon-hover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {isExpanded ? <ChevronDown size={16} color="#94A3B8" /> : <ChevronRight size={16} color="#94A3B8" />}
              </div>
            </div>

            {/* Tasks */}
            {isExpanded && (
              <div style={{ paddingLeft: '1rem', marginTop: '2px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {tasks.map(task => {
                    const typeStyle = task.type ? (TYPE_STYLES[task.type] || null) : null;
                    const systemIds = getTaskSystemIds(task);
                    const priorityOpt = PRIORITY_OPTIONS[task.priority ?? 0];
                    const statusCfg = TASK_STATUS_CONFIG[(task.status as TaskStatus) || 'Backlog'];

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTaskId({ milestoneId: milestone.id, taskId: task.id })}
                        onDragOver={e => { e.preventDefault(); e.stopPropagation(); setMilestoneDropTarget(null); }}
                        onDrop={e => {
                          e.stopPropagation();
                          if (draggedTaskId) {
                            if (draggedTaskId.milestoneId === milestone.id) {
                              onTaskReorder(milestone.id, draggedTaskId.taskId, task.id);
                            } else {
                              onTaskMoveToMilestone(draggedTaskId.milestoneId, milestone.id, draggedTaskId.taskId);
                            }
                          }
                          setDraggedTaskId(null);
                          setMilestoneDropTarget(null);
                        }}
                        className="task-row"
                        onClick={() => setEditingTask({ milestoneId: milestone.id, task })}
                        style={{
                          display: 'flex', alignItems: 'center',
                          padding: '0 0.5rem',
                          background: draggedTaskId?.taskId === task.id ? '#F1F5F9' : 'transparent',
                          opacity: draggedTaskId?.taskId === task.id ? 0.5 : 1,
                          minHeight: '32px', borderRadius: '6px',
                          transition: 'background 0.1s',
                          cursor: 'pointer',
                        }}
                      >
                        {/* Drag handle */}
                        <div className="drag-handle mobile-task-hide" style={{ color: '#CBD5E1', cursor: 'grab', opacity: 0, flexShrink: 0, width: 13, display: 'flex' }}>
                          <GripVertical size={13} />
                        </div>

                        {/* Priority icon */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActivePicker({ taskId: task.id, milestoneId: milestone.id, type: 'priority', position: { top: rect.bottom + 4, left: rect.left } });
                          }}
                          style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center', margin: '0 6px 0 6px', cursor: 'pointer', borderRadius: '3px' }}
                          title={priorityOpt?.label}
                          className="icon-btn-hover mobile-task-hide"
                        >
                          {task.priority != null && task.priority > 0
                            ? <span style={{ color: priorityOpt?.color, display: 'flex' }}>{priorityOpt?.icon}</span>
                            : <span style={{ color: '#E2E8F0', display: 'flex' }}>{PRIORITY_OPTIONS[0]?.icon}</span>
                          }
                        </div>

                        {/* Status icon */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActivePicker({ taskId: task.id, milestoneId: milestone.id, type: 'status', position: { top: rect.bottom + 4, left: rect.left } });
                          }}
                          style={{ width: 14, flexShrink: 0, display: 'flex', alignItems: 'center', marginRight: '8px', cursor: 'pointer', borderRadius: '3px' }}
                          title={statusCfg.label}
                          className="icon-btn-hover"
                        >
                          {statusCfg.icon}
                        </div>

                        {/* Title */}
                        <span
                          title={task.name}
                          style={{
                            flex: 1, fontSize: '0.78rem', fontWeight: 450, lineHeight: 1.4,
                            color: task.status === 'Done' ? '#94A3B8' : '#1E293B',
                            textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {task.name}
                        </span>

                        {/* Right metadata */}
                        <div className="task-meta-right" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: '6px', marginLeft: '8px' }}>
                          {/* Inline indicators */}
                          {(task.notes || (task.comments?.length ?? 0) > 0) && (
                            <div className="mobile-task-hide" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {task.notes && (
                                <span title={task.notes} style={{ display: 'inline-flex' }}>
                                  <FileText size={12} color="#3B82F6" />
                                </span>
                              )}
                              {(task.comments?.length ?? 0) > 0 && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#3B82F6' }}>
                                  <MessageCircle size={12} />
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{task.comments!.length}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Type */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActivePicker({ taskId: task.id, milestoneId: milestone.id, type: 'type', position: { top: rect.bottom + 4, left: rect.left } });
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            className="icon-btn-hover mobile-task-hide"
                            title={task.type || 'Definir tipo'}
                          >
                            {task.type && typeStyle ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                padding: '2px 10px 2px 8px', borderRadius: '20px',
                                fontSize: '0.68rem', fontWeight: 500, color: '#475569',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              }}>
                                <span style={{ color: typeStyle.text, display: 'flex', flexShrink: 0 }}>{typeStyle.icon}</span>
                                {task.type}
                              </span>
                            ) : (
                              <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}>
                                <Tag size={14} color="#CBD5E1" />
                              </span>
                            )}
                          </div>

                          {/* Systems */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActivePicker({ taskId: task.id, milestoneId: milestone.id, type: 'systems', position: { top: rect.bottom + 4, left: rect.left } });
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                            className="icon-btn-hover mobile-task-hide"
                            title={systemIds.length > 0 ? systemIds.map(sid => { const sys = allSystems.find(s => String(s.id) === String(sid)); return sys ? (sys.acronym || sys.name) : sid; }).join(', ') : 'Definir sistema'}
                          >
                            {systemIds.length > 0 ? (
                              <>
                                {systemIds.slice(0, 1).map(sid => {
                                  const sys = allSystems.find(s => String(s.id) === String(sid));
                                  return sys ? (
                                    <span key={sid} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                                      background: '#FFFFFF', border: '1px solid #E2E8F0',
                                      padding: '2px 10px 2px 8px', borderRadius: '20px',
                                      fontSize: '0.68rem', fontWeight: 500, color: '#475569',
                                      whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                    }}>
                                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
                                      {sys.acronym || sys.name}
                                    </span>
                                  ) : null;
                                })}
                                {systemIds.length > 1 && (
                                  <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>+{systemIds.length - 1}</span>
                                )}
                              </>
                            ) : (
                              <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}>
                                <Server size={14} color="#CBD5E1" />
                              </span>
                            )}
                          </div>

                          {/* Assignee */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActivePicker({ taskId: task.id, milestoneId: milestone.id, type: 'assignee', position: { top: rect.bottom + 4, left: rect.left } });
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            className="icon-btn-hover mobile-task-hide"
                            title={task.assigneeId ? (allCollaborators.find(c => c.id === task.assigneeId)?.name || 'Responsável') : 'Definir responsável'}
                          >
                            {task.assigneeId ? (
                              renderAvatar(task.assigneeId, allCollaborators, 20)
                            ) : (
                              <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}>
                                <User size={14} color="#CBD5E1" />
                              </span>
                            )}
                          </div>

                          {/* Start Date */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              (e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement)?.showPicker?.();
                            }}
                            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            className="icon-btn-hover mobile-task-hide"
                            title={task.startDate ? `Início: ${formatDate(task.startDate)}` : 'Definir data início'}
                          >
                            {task.startDate ? (
                              <span style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Calendar size={11} color="#94A3B8" />
                                {formatDate(task.startDate)}
                              </span>
                            ) : (
                              <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}>
                                <Calendar size={14} color="#CBD5E1" />
                              </span>
                            )}
                            <input key={task.startDate || 'sd-empty'} type="date" defaultValue={task.startDate || ''} onChange={e => onTaskUpdate(milestone.id, task.id, 'startDate', e.target.value || null)} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />
                          </div>

                          {/* Target Date */}
                          <span className="mobile-task-hide" style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>{'\u2192'}</span>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              (e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement)?.showPicker?.();
                            }}
                            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            className="icon-btn-hover"
                            title={task.targetDate ? `Fim: ${formatDate(task.targetDate)}` : 'Definir data fim'}
                          >
                            {task.targetDate ? (
                              <span style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                                {formatDate(task.targetDate)}
                              </span>
                            ) : (
                              <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}>
                                <Calendar size={14} color="#CBD5E1" />
                              </span>
                            )}
                            <input key={task.targetDate || 'td-empty'} type="date" defaultValue={task.targetDate || ''} onChange={e => onTaskUpdate(milestone.id, task.id, 'targetDate', e.target.value || null)} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />
                          </div>

                          {/* Delete (visible on hover) */}
                          <div className="task-actions" style={{ display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); onTaskDelete(milestone.id, task.id); }}
                              title="Excluir"
                              style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '4px', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
                              className="btn-icon-hover"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add task row */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0.5rem 1.25rem 0.5rem', gap: '6px' }}>
                  <div style={{ width: 13, flexShrink: 0 }} />
                  <Plus size={13} color="#CBD5E1" style={{ flexShrink: 0, margin: '0 6px 0 6px' }} />
                  <input
                    placeholder="Nova tarefa..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        onTaskAdd(milestone.id, e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                    style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: '0.75rem', color: '#94A3B8' }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Floating Priority Picker */}
      {activePicker?.type === 'priority' && (
        <PriorityPicker
          value={(() => {
            const ms = (formData.milestones || []).find(m => m.id === activePicker.milestoneId);
            const t = ms?.tasks?.find(t => t.id === activePicker.taskId);
            return t?.priority ?? 0;
          })()}
          onSelect={(v: PriorityValue) => {
            onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'priority', v);
            setActivePicker(null);
          }}
          onClose={() => setActivePicker(null)}
          position={{ top: activePicker.position.top, left: activePicker.position.left ?? 0 }}
        />
      )}

      <div style={{ display: 'none' }} aria-hidden="true">
        <button type="button" onClick={exportToExcel}>
          <Download size={12} /> Exportar
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          <Upload size={12} /> Importar
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportFile} />
        <span>{importSummary || ''}</span>
      </div>

      {/* Floating Status Picker */}
      {activePicker?.type === 'status' && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000001 }}
            onClick={() => setActivePicker(null)}
          />
          <div
            style={{
              position: 'fixed',
              top: activePicker.position.top,
              left: activePicker.position.left,
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
              padding: '4px',
              minWidth: '170px',
              zIndex: 1000002,
              animation: 'scaleIn 0.1s ease-out',
            }}
          >
            <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
              Altere o Status
            </div>
            {TASK_STATUS_ORDER.map(s => {
              const cfg = TASK_STATUS_CONFIG[s];
              const ms = (formData.milestones || []).find(m => m.id === activePicker.milestoneId);
              const currentStatus = ms?.tasks?.find(t => t.id === activePicker.taskId)?.status || 'Backlog';
              const isSelected = currentStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'status', s);
                    setActivePicker(null);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 10px', border: 'none',
                    background: isSelected ? '#F1F5F9' : 'transparent',
                    borderRadius: '4px', cursor: 'pointer', textAlign: 'left',
                    fontSize: '13px', color: '#1E293B', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#F1F5F9' : 'transparent'}
                >
                  {cfg.icon}
                  <span style={{ flex: 1 }}>{cfg.label}</span>
                  {isSelected && <span style={{ color: '#2563EB', fontSize: 14 }}>&#10003;</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Floating Type Picker */}
      {activePicker?.type === 'type' && (() => {
        const ms = (formData.milestones || []).find(m => m.id === activePicker.milestoneId);
        const currentType = ms?.tasks?.find(t => t.id === activePicker.taskId)?.type || null;
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{
              position: 'fixed', top: activePicker.position.top, left: activePicker.position.left,
              background: 'white', borderRadius: '6px', padding: '2px', minWidth: '120px', zIndex: 1000002,
              boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'scaleIn 0.1s ease-out',
            }}>
              <div style={{ padding: '4px 8px', fontSize: '10px', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}>
                Altere o Tipo
              </div>
              <button
                onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'type', null); setActivePicker(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: !currentType ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#94A3B8' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = !currentType ? '#F1F5F9' : 'transparent'}
              >
                <X size={9} />
                <span style={{ flex: 1 }}>Nenhum</span>
                {!currentType && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
              </button>
              {ALL_TYPES.map(t => {
                const style = TYPE_STYLES[t] || TYPE_STYLES['Feature'];
                const isSelected = currentType === t;
                return (
                  <button
                    key={t}
                    onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'type', t); setActivePicker(null); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: isSelected ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#1E293B' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#F1F5F9' : 'transparent'}
                  >
                    <span style={{ color: style.text, display: 'flex', flexShrink: 0 }}>{style.icon}</span>
                    <span style={{ flex: 1 }}>{t}</span>
                    {isSelected && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* Floating Assignee Picker */}
      {activePicker?.type === 'assignee' && (() => {
        const ms = (formData.milestones || []).find(m => m.id === activePicker.milestoneId);
        const currentAssignee = ms?.tasks?.find(t => t.id === activePicker.taskId)?.assigneeId || null;
        const scopedMembers = allCollaborators.filter(c => (formData.memberIds || []).includes(c.id));
        const members = scopedMembers.length > 0 ? scopedMembers : allCollaborators;
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{
              position: 'fixed', top: activePicker.position.top, left: activePicker.position.left,
              background: 'white', borderRadius: '6px', padding: '2px', minWidth: '140px', zIndex: 1000002,
              boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'scaleIn 0.1s ease-out', maxHeight: '260px', overflowY: 'auto',
            }}>
              <div style={{ padding: '4px 8px', fontSize: '10px', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}>
                Altere o Responsável
              </div>
              <button
                onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'assigneeId', null); setActivePicker(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: !currentAssignee ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#94A3B8' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = !currentAssignee ? '#F1F5F9' : 'transparent'}
              >
                <User size={10} />
                <span style={{ flex: 1 }}>Nenhum</span>
                {!currentAssignee && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
              </button>
              {members.map(c => {
                const isSelected = currentAssignee === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'assigneeId', c.id); setActivePicker(null); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: isSelected ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#1E293B' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#F1F5F9' : 'transparent'}
                  >
                    {renderAvatar(c.id, allCollaborators, 16)}
                    <span style={{ flex: 1 }}>{c.name}</span>
                    {isSelected && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* Floating Systems Picker */}
      {activePicker?.type === 'systems' && (() => {
        const ms = (formData.milestones || []).find(m => m.id === activePicker.milestoneId);
        const task = ms?.tasks?.find(t => t.id === activePicker.taskId);
        const currentIds = task ? getTaskSystemIds(task) : [];
        const impactedSystems = allSystems.filter(s => (formData.impactedSystemIds || []).includes(s.id));
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{
              position: 'fixed', top: activePicker.position.top, left: activePicker.position.left,
              background: 'white', borderRadius: '6px', padding: '2px', minWidth: '140px', zIndex: 1000002,
              boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'scaleIn 0.1s ease-out', maxHeight: '260px', overflowY: 'auto',
            }}>
              <div style={{ padding: '4px 8px', fontSize: '10px', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}>
                Altere os Sistemas
              </div>
              <button
                onClick={() => {
                  onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'systemIds', []);
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: currentIds.length === 0 ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#94A3B8' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = currentIds.length === 0 ? '#F1F5F9' : 'transparent'}
              >
                <X size={9} />
                <span style={{ flex: 1 }}>Nenhum</span>
                {currentIds.length === 0 && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
              </button>
              {impactedSystems.map(s => {
                const sel = currentIds.includes(String(s.id));
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      const newIds = sel ? currentIds.filter(id => id !== String(s.id)) : [...currentIds, String(s.id)];
                      onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'systemIds', newIds);
                    }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: sel ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#1E293B' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = sel ? '#F1F5F9' : 'transparent'}
                  >
                    <div style={{ width: 13, height: 13, borderRadius: '3px', border: `1.5px solid ${sel ? '#6366F1' : '#CBD5E1'}`, background: sel ? '#6366F1' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>&#10003;</span>}
                    </div>
                    <span style={{ flex: 1 }}>{s.acronym || s.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}



      <style>{`
        .milestone-card:hover { border-color: #3B82F6 !important; background: #FFF !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .milestone-card:hover .milestone-actions { opacity: 1 !important; }
        .task-row:hover { background: #F8FAFC !important; }
        .task-row:hover .drag-handle { opacity: 1 !important; }
        .task-row:hover .task-actions { opacity: 1 !important; }
        @media (pointer: coarse) { .mobile-task-hide { display: none !important; } }
        .btn-icon-hover:hover { background: #F1F5F9 !important; }
        .picker-item-hover:hover { background: #F8FAFC !important; }
        .icon-btn-hover:hover { background: #F1F5F9 !important; }
      `}</style>
    </div>
  );
};
