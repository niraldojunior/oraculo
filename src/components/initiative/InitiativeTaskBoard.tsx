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
} from '../../types';
import { TASK_STATUS_ORDER } from '../../types';
import { renderAvatar } from './SidebarComponents';
import { PRIORITY_OPTIONS, PriorityPicker } from '../common/PriorityPicker';
import type { PriorityValue } from '../common/PriorityPicker';
import { useAuth } from '../../context/AuthContext';

type ImportChange =
  | { type: 'create'; milestoneId: string; taskData: Omit<MilestoneTask, 'id'> }
  | { type: 'update'; milestoneId: string; taskId: string; fields: Partial<MilestoneTask> };

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
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

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  'Feature':        { bg: '#EEF2FF', text: '#4F46E5', icon: <Star size={11} /> },
  'Melhoria':       { bg: '#F5F3FF', text: '#7C3AED', icon: <TrendingUp size={11} /> },
  'Bug':            { bg: '#FEF2F2', text: '#DC2626', icon: <Bug size={11} /> },
  'Debito Tecnico': { bg: '#EFF6FF', text: '#2563EB', icon: <Wrench size={11} /> },
  'Debito Técnico': { bg: '#EFF6FF', text: '#2563EB', icon: <Wrench size={11} /> },
  'Enabler':        { bg: '#F0FDFA', text: '#0D9488', icon: <Zap size={11} /> },
  'DRI':            { bg: '#FFF7ED', text: '#C2410C', icon: <FileText size={11} /> },
  'Ambiente':       { bg: '#F0FFF4', text: '#15803D', icon: <Server size={11} /> },
};

const ALL_TYPES: MilestoneTaskType[] = ['Feature', 'Melhoria', 'Bug', 'Debito Técnico', 'Enabler', 'DRI', 'Ambiente'];

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

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task, milestoneId, allCollaborators, allSystems, formData,
  onUpdate, onDelete, onClose, user,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draftName, setDraftName] = useState(task.name || '');
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
    const c: TaskComment = {
      id: `tc_${Date.now()}`,
      userId: user?.id || 'anon',
      userName: user?.name || 'Usuário',
      userPhoto: user?.photoUrl,
      content: commentText.trim(),
      timestamp: new Date().toISOString(),
    };
    onUpdate(milestoneId, task.id, 'comments', [c, ...(task.comments || [])]);
    setCommentText('');
    setIsAddingComment(false);
  };

  const sortedComments = [...(task.comments || [])].sort(
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.92rem 1.6rem 0.34rem' }}>
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

        <div style={{ overflowY: 'auto', flex: 1, padding: '0.86rem 1.6rem 1.44rem' }}>
          <div className="task-edit-modal-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: '1.6rem', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem', minWidth: 0 }}>
              <div>
                <FieldLabel label="Título" />
                <textarea
                  className="task-title-textarea"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  rows={2}
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

                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')} style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}>
                      {currentTypeStyle ? <span style={{ color: currentTypeStyle.text, display: 'flex', width: 14, justifyContent: 'center' }}>{currentTypeStyle.icon}</span> : <Tag size={14} color="#94A3B8" />}
                      <span>{task.type || 'Tipo'}</span>
                    </button>
                    {openDropdown === 'type' && (
                      <div style={{ ...dropdownStyle, minWidth: '190px', right: 'auto' }}>
                        <button
                          onClick={() => { onUpdate(milestoneId, task.id, 'type', null); setOpenDropdown(null); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: !task.type ? '#F1F5F9' : 'transparent', textAlign: 'left', width: '100%' }}
                          className="picker-item-hover"
                        >
                          <X size={12} color="#94A3B8" />
                          <span style={{ flex: 1 }}>Nenhum</span>
                          {!task.type && <span style={{ color: '#6366F1', fontSize: 11 }}>&#10003;</span>}
                        </button>
                        {ALL_TYPES.map(t => (
                          <button
                            key={t}
                            onClick={() => { onUpdate(milestoneId, task.id, 'type', t); setOpenDropdown(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.55rem 0.7rem', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: task.type === t ? '#F1F5F9' : 'transparent' }}
                            className="picker-item-hover"
                          >
                            <span style={{ color: (TYPE_STYLES[t] || TYPE_STYLES['Feature']).text, display: 'flex', width: 14, justifyContent: 'center' }}>{(TYPE_STYLES[t] || TYPE_STYLES['Feature']).icon}</span>
                            <span style={{ flex: 1 }}>{t}</span>
                            {task.type === t && <span style={{ color: '#6366F1', fontSize: 11 }}>&#10003;</span>}
                          </button>
                        ))}
                      </div>
                    )}
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

                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenDropdown(openDropdown === 'startDate' ? null : 'startDate')} style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}>
                      <Calendar size={14} color="#94A3B8" />
                      <span>{task.startDate ? formatShortDate(task.startDate) : 'Início'}</span>
                    </button>
                    {openDropdown === 'startDate' && (
                      <div style={{ ...dropdownStyle, minWidth: '240px', right: 'auto' }}>
                        <input
                          type="date"
                          value={task.startDate || ''}
                          onChange={e => onUpdate(milestoneId, task.id, 'startDate', e.target.value)}
                          style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.7rem 0.8rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                        />
                        <button onClick={() => { onUpdate(milestoneId, task.id, 'startDate', null); setOpenDropdown(null); }} style={{ width: '100%', border: 'none', background: '#F8FAFC', color: '#64748B', borderRadius: '10px', padding: '0.6rem 0.8rem', cursor: 'pointer', textAlign: 'left' }}>Limpar data</button>
                      </div>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setOpenDropdown(openDropdown === 'targetDate' ? null : 'targetDate')} style={{ ...triggerStyle, width: 'auto', minHeight: '34px', padding: '0.35rem 0.7rem', borderRadius: '999px', gap: '0.4rem' }}>
                      <Calendar size={14} color="#94A3B8" />
                      <span>{task.targetDate ? formatShortDate(task.targetDate) : 'Target'}</span>
                    </button>
                    {openDropdown === 'targetDate' && (
                      <div style={{ ...dropdownStyle, minWidth: '240px', right: 'auto' }}>
                        <input
                          type="date"
                          value={task.targetDate || ''}
                          onChange={e => onUpdate(milestoneId, task.id, 'targetDate', e.target.value)}
                          style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.7rem 0.8rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                        />
                        <button onClick={() => { onUpdate(milestoneId, task.id, 'targetDate', null); setOpenDropdown(null); }} style={{ width: '100%', border: 'none', background: '#F8FAFC', color: '#64748B', borderRadius: '10px', padding: '0.6rem 0.8rem', cursor: 'pointer', textAlign: 'left' }}>Limpar data</button>
                      </div>
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

            <div className="task-comments-panel" style={{ background: '#FBFDFF', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                    <MessageCircle size={16} color="#334155" />
                    Comentários
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', background: '#E2E8F0', padding: '0.25rem 0.55rem', borderRadius: '999px' }}>
                  {task.comments?.length || 0}
                </div>
              </div>

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
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0.45rem 0.15rem',
                    transition: 'color 0.2s',
                    width: 'fit-content'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#1E293B'}
                  onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                >
                  <Plus size={14} /> Adicionar comentário
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
                      resize: 'none',
                      padding: 0,
                      outline: 'none',
                      color: '#1E293B'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.6rem' }}>
                    <button
                      onClick={() => {
                        setIsAddingComment(false);
                        setCommentText('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 700
                      }}
                    >
                      <X size={14} /> Cancelar
                    </button>
                    <button
                      onClick={addComment}
                      className="btn-icon-hover"
                      style={{
                        background: '#1E293B',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 700
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Salvar
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', minHeight: '220px', maxHeight: '52vh', paddingRight: '0.2rem' }}>
                {sortedComments.length === 0 && (
                  <div style={{ border: '1px dashed #CBD5E1', borderRadius: '14px', padding: '1rem', color: '#94A3B8', background: '#FFFFFF' }}>
                    Nenhum comentário ainda. Use este espaço para registrar contexto, blockers e decisões.
                  </div>
                )}
                {sortedComments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '0.75rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ flexShrink: 0 }}>
                      {renderAvatar(c.userId, allCollaborators, 24)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#1E293B' }}>{c.userName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#94A3B8' }}>{new Date(c.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
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
                                const filtered = (task.comments || []).filter(item => item.id !== c.id);
                                onUpdate(milestoneId, task.id, 'comments', filtered);
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                              title="Excluir"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
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
                              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 700 }}
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => {
                                const updated = (task.comments || []).map(item =>
                                  item.id === c.id ? { ...item, content: editCommentText.trim(), timestamp: new Date().toISOString() } : item
                                );
                                onUpdate(milestoneId, task.id, 'comments', updated);
                                setEditingCommentId(null);
                              }}
                              style={{ background: '#1E293B', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontWeight: 700 }}
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#475569', margin: 0, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{c.content}</p>
                      )}
                    </div>
                  </div>
                ))}
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
  onMilestoneUpdate: () => void;
  onMilestoneDelete: (id: string) => void;
  onMilestoneReorder: (s: string, t: string) => void;
  setEditingMilestoneId: (id: string | null) => void;
  editingMilestoneId: string | null;
  setEditMilestoneText: (text: string) => void;
  editMilestoneText: string;
  activeMilestoneId?: string | null;
  statusFilter?: 'all' | TaskStatus;
  assigneeFilter?: string;
  riskFilter?: 'all' | 'late' | 'at-risk' | 'not-started';
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
  onMilestoneUpdate,
  onMilestoneDelete,
  onMilestoneReorder,
  setEditingMilestoneId,
  editingMilestoneId,
  setEditMilestoneText,
  editMilestoneText,
  activeMilestoneId,
  statusFilter = 'all',
  assigneeFilter = 'all',
  riskFilter = 'all',
  onBulkImport,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<{ milestoneId: string; taskId: string } | null>(null);
  const [draggedMilestoneId, setDraggedMilestoneId] = useState<string | null>(null);
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

  const hasActiveFilters = statusFilter !== 'all' || assigneeFilter !== 'all' || riskFilter !== 'all';

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
          if (statusFilter !== 'all' && task.status !== statusFilter) return false;
          if (assigneeFilter === 'unassigned' && task.assigneeId) return false;
          if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned' && task.assigneeId !== assigneeFilter) return false;
          if (!matchesRiskFilter(task)) return false;
          return true;
        })
      }))
      .filter(milestone => !hasActiveFilters || (milestone.tasks || []).length > 0);
  }, [activeMilestoneId, assigneeFilter, formData.milestones, hasActiveFilters, riskFilter, statusFilter]);

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
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (draggedMilestoneId && draggedMilestoneId !== milestone.id) {
                  onMilestoneReorder(draggedMilestoneId, milestone.id);
                }
                setDraggedMilestoneId(null);
              }}
              className="milestone-card"
              onClick={() => toggleMilestone(milestone.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                background: '#F8FAFC', padding: '0.25rem 0.85rem',
                borderRadius: '10px',
                border: isExpanded ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                cursor: 'pointer', transition: 'all 0.2s ease',
                opacity: draggedMilestoneId === milestone.id ? 0.4 : 1,
                boxShadow: isExpanded ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                marginLeft: '1rem', marginRight: '1rem',
              }}
            >
              <div style={{ color: '#94A3B8', cursor: 'grab', display: 'flex' }} className="milestone-drag">
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B' }}>{progress}%</span>
                <div className="milestone-actions" style={{ display: 'flex', gap: '0.4rem', opacity: 0, transition: 'opacity 0.2s' }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingMilestoneId(milestone.id); setEditMilestoneText(milestone.name); }}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    className="btn-icon-hover"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
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
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => {
                          if (draggedTaskId && draggedTaskId.milestoneId === milestone.id) {
                            onTaskReorder(milestone.id, draggedTaskId.taskId, task.id);
                          }
                          setDraggedTaskId(null);
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
                        <div className="drag-handle" style={{ color: '#CBD5E1', cursor: 'grab', opacity: 0, flexShrink: 0, width: 13, display: 'flex' }}>
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
                          className="icon-btn-hover"
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
                        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: '6px', marginLeft: '8px' }}>
                          {/* Inline indicators */}
                          {(task.notes || (task.comments?.length ?? 0) > 0) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                            className="icon-btn-hover"
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
                            className="icon-btn-hover"
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
                            className="icon-btn-hover"
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
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActivePicker({ taskId: task.id, milestoneId: milestone.id, type: 'startDate', position: { top: rect.bottom + 4, right: window.innerWidth - rect.right } });
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            className="icon-btn-hover"
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
                          </div>

                          {/* Target Date */}
                          <span style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>{'\u2192'}</span>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActivePicker({ taskId: task.id, milestoneId: milestone.id, type: 'targetDate', position: { top: rect.bottom + 4, right: window.innerWidth - rect.right } });
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
              background: 'white', borderRadius: '8px', padding: '4px', minWidth: '170px', zIndex: 1000002,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'scaleIn 0.1s ease-out',
            }}>
              <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
                Altere o Tipo
              </div>
              <button
                onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'type', null); setActivePicker(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', border: 'none', background: !currentType ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#94A3B8' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = !currentType ? '#F1F5F9' : 'transparent'}
              >
                <X size={12} />
                <span style={{ flex: 1 }}>Nenhum</span>
                {!currentType && <span style={{ color: '#2563EB', fontSize: 14 }}>&#10003;</span>}
              </button>
              {ALL_TYPES.map(t => {
                const style = TYPE_STYLES[t] || TYPE_STYLES['Feature'];
                const isSelected = currentType === t;
                return (
                  <button
                    key={t}
                    onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'type', t); setActivePicker(null); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', border: 'none', background: isSelected ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#1E293B' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#F1F5F9' : 'transparent'}
                  >
                    <span style={{ color: style.text, display: 'flex', flexShrink: 0 }}>{style.icon}</span>
                    <span style={{ flex: 1 }}>{t}</span>
                    {isSelected && <span style={{ color: '#2563EB', fontSize: 14 }}>&#10003;</span>}
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
              background: 'white', borderRadius: '8px', padding: '4px', minWidth: '180px', zIndex: 1000002,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'scaleIn 0.1s ease-out', maxHeight: '260px', overflowY: 'auto',
            }}>
              <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
                Altere o Responsável
              </div>
              <button
                onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'assigneeId', null); setActivePicker(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', border: 'none', background: !currentAssignee ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#94A3B8' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = !currentAssignee ? '#F1F5F9' : 'transparent'}
              >
                <User size={14} />
                <span style={{ flex: 1 }}>Nenhum</span>
                {!currentAssignee && <span style={{ color: '#2563EB', fontSize: 14 }}>&#10003;</span>}
              </button>
              {members.map(c => {
                const isSelected = currentAssignee === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'assigneeId', c.id); setActivePicker(null); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', border: 'none', background: isSelected ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#1E293B' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#F1F5F9' : 'transparent'}
                  >
                    {renderAvatar(c.id, allCollaborators, 18)}
                    <span style={{ flex: 1 }}>{c.name}</span>
                    {isSelected && <span style={{ color: '#2563EB', fontSize: 14 }}>&#10003;</span>}
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
              background: 'white', borderRadius: '8px', padding: '4px', minWidth: '180px', zIndex: 1000002,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'scaleIn 0.1s ease-out', maxHeight: '260px', overflowY: 'auto',
            }}>
              <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>
                Altere os Sistemas
              </div>
              <button
                onClick={() => {
                  onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'systemIds', []);
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', border: 'none', background: currentIds.length === 0 ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#94A3B8' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = currentIds.length === 0 ? '#F1F5F9' : 'transparent'}
              >
                <X size={12} />
                <span style={{ flex: 1 }}>Nenhum</span>
                {currentIds.length === 0 && <span style={{ color: '#2563EB', fontSize: 14 }}>&#10003;</span>}
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
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', border: 'none', background: sel ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#1E293B' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = sel ? '#F1F5F9' : 'transparent'}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: '3px', border: `1.5px solid ${sel ? '#6366F1' : '#CBD5E1'}`, background: sel ? '#6366F1' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>&#10003;</span>}
                    </div>
                    <span style={{ flex: 1 }}>{s.acronym || s.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* Floating Start Date Picker */}
      {activePicker?.type === 'startDate' && (() => {
        const ms = (formData.milestones || []).find(m => m.id === activePicker.milestoneId);
        const currentDate = ms?.tasks?.find(t => t.id === activePicker.taskId)?.startDate || '';
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{
              position: 'fixed', top: activePicker.position.top, right: activePicker.position.right,
              background: 'white', borderRadius: '8px', padding: '14px 16px', zIndex: 1000002, minWidth: '220px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'scaleIn 0.1s ease-out',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Data Início</div>
              <input
                type="date"
                defaultValue={currentDate}
                onChange={e => {
                  onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'startDate', e.target.value || null);
                }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setActivePicker(null); }}
                style={{ fontSize: '13px', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1E293B' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                {currentDate ? (
                  <button
                    onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'startDate', null); setActivePicker(null); }}
                    style={{ fontSize: '12px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                  >
                    Limpar data
                  </button>
                ) : <span />}
                <button
                  onClick={() => setActivePicker(null)}
                  style={{ fontSize: '12px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* Floating Target Date Picker */}
      {activePicker?.type === 'targetDate' && (() => {
        const ms = (formData.milestones || []).find(m => m.id === activePicker.milestoneId);
        const currentDate = ms?.tasks?.find(t => t.id === activePicker.taskId)?.targetDate || '';
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{
              position: 'fixed', top: activePicker.position.top, right: activePicker.position.right,
              background: 'white', borderRadius: '8px', padding: '14px 16px', zIndex: 1000002, minWidth: '220px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
              animation: 'scaleIn 0.1s ease-out',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Data Fim</div>
              <input
                type="date"
                defaultValue={currentDate}
                onChange={e => {
                  onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'targetDate', e.target.value || null);
                }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setActivePicker(null); }}
                style={{ fontSize: '13px', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1E293B' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                {currentDate ? (
                  <button
                    onClick={() => { onTaskUpdate(activePicker.milestoneId, activePicker.taskId, 'targetDate', null); setActivePicker(null); }}
                    style={{ fontSize: '12px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                  >
                    Limpar data
                  </button>
                ) : <span />}
                <button
                  onClick={() => setActivePicker(null)}
                  style={{ fontSize: '12px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Confirmar
                </button>
              </div>
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
        .btn-icon-hover:hover { background: #F1F5F9 !important; }
        .picker-item-hover:hover { background: #F8FAFC !important; }
        .icon-btn-hover:hover { background: #F1F5F9 !important; }
      `}</style>
    </div>
  );
};
