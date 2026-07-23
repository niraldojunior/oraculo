import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, X, Trash2, Plus, Edit3 } from 'lucide-react';
import { PriorityPicker } from '@/components/common/PriorityPicker';
import type { Initiative, Collaborator, System, InitiativeComment, MilestoneTask } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useClientAreas } from '@/modules/initiatives/useClientAreas';
import { InitiativeProperties, InitiativeMilestones, getTypeIcon, renderAvatar } from '@/components/initiative/SidebarComponents';
import { getExternalLinkMeta, ExternalToolIcon, resolveExternalUrl } from '@/components/initiative/externalLinkMeta';
import { saveInitiativeWithHistory } from '@/modules/initiatives/services/saveInitiative';
import {
  createInitiativeComment as createInitiativeCommentApi,
  deleteInitiativeComment as deleteInitiativeCommentApi,
  updateInitiativeComment as updateInitiativeCommentApi,
  createMilestone as createMilestoneApi,
  updateMilestone as updateMilestoneApi,
  deleteMilestone as deleteMilestoneApi,
  fetchInitiativeById
} from '@/modules/initiatives/services/initiativesApi';

const PASTEL_THEMES: Record<string, { bg: string; text: string; icon: string }> = {
  '1- Estratégico': { bg: '#DC2626', text: '#FFFFFF', icon: '#FFFFFF' },
  '2- Projeto': { bg: '#2563EB', text: '#FFFFFF', icon: '#FFFFFF' },
  '3- Fast Track': { bg: '#059669', text: '#FFFFFF', icon: '#FFFFFF' },
  '4- PBI': { bg: '#D97706', text: '#FFFFFF', icon: '#FFFFFF' }
};

export interface InitiativePeekPanelHandle {
  requestClose: () => void;
}

interface InitiativePeekPanelProps {
  initiative: Initiative;
  collaborators: Collaborator[];
  systems: System[];
  onChange: (updated: Initiative) => void;
  onClose: () => void;
  returnPath?: string;
}

/**
 * Painel de espiada rápida de iniciativa (estilo Linear), com edição inline de
 * propriedades, milestones/tarefas e comentários. Compartilhado pela página de
 * Iniciativas e pelas visões de Portfólio/Roadmap do Dashboard — ver D15 em
 * docs/00-visao-geral/business-rules.md.
 */
export const InitiativePeekPanel = forwardRef<InitiativePeekPanelHandle, InitiativePeekPanelProps>(
  ({ initiative, collaborators, systems, onChange, onClose, returnPath }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { options: demandantOptions } = useClientAreas();

    const [isClosing, setIsClosing] = useState(false);
    const peekSidebarRef = useRef<HTMLDivElement>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [sidebarOpenSections, setSidebarOpenSections] = useState<{ overview: boolean; properties: boolean; milestones: boolean; comments: boolean; history: boolean }>(() => {
      try {
        const saved = localStorage.getItem('oraculo_peek_sections');
        if (saved) return JSON.parse(saved);
      } catch {}
      return { overview: true, properties: true, milestones: true, comments: true, history: false };
    });
    const [editingField, setEditingField] = useState<string | null>(null);
    const [showPriorityMenu, setShowPriorityMenu] = useState<{ top: number; left: number } | null>(null);
    const [activeMilestoneTaskViewId, setActiveMilestoneTaskViewId] = useState<string | null>(null);
    const [newMilestoneName, setNewMilestoneName] = useState('');
    const [editMilestoneText, setEditMilestoneText] = useState('');
    const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [milestoneDeleteId, setMilestoneDeleteId] = useState<string | null>(null);
    const [commentDeleteTarget, setCommentDeleteTarget] = useState<{ initiativeId: string; comment: InitiativeComment } | null>(null);

    const handleClose = React.useCallback(() => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      setIsClosing(true);
      closeTimeoutRef.current = setTimeout(() => {
        onClose();
        closeTimeoutRef.current = null;
      }, 300);
    }, [onClose]);

    useImperativeHandle(ref, () => ({ requestClose: handleClose }), [handleClose]);

    useEffect(() => {
      return () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      };
    }, []);

    // Quando o painel abre, carrega milestones e comentários (não vêm na listagem)
    useEffect(() => {
      const alreadyHydrated = (initiative.milestones?.length || 0) > 0 && initiative.comments !== undefined;
      if (alreadyHydrated) return;

      fetchInitiativeById(initiative.id).catch(() => null).then(fullInit => {
        onChange({
          ...initiative,
          ...(fullInit || {}),
          milestones: fullInit?.milestones || initiative.milestones || [],
          comments: fullInit?.comments || []
        });
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initiative.id]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (commentDeleteTarget) {
          if (e.key === 'Escape') setCommentDeleteTarget(null);
          return;
        }
        if (e.key === 'Escape') handleClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose, commentDeleteTarget]);

    useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
        if (commentDeleteTarget) return;
        if (peekSidebarRef.current && !peekSidebarRef.current.contains(e.target as Node)) {
          handleClose();
        }
      };
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }, [handleClose, commentDeleteTarget]);

    const handleUpdateInitiative = async (updated: Initiative, actionName = 'Edição rápida') => {
      const data = await saveInitiativeWithHistory(initiative, updated, actionName, (user as any)?.name || 'Usuário');
      if (data) onChange(data);
      return data;
    };

    const handleTaskAdd = async (milestoneId: string, text: string) => {
      const newTask: MilestoneTask = {
        id: `t_${Date.now()}`,
        name: text,
        status: 'Backlog',
        milestoneId
      };
      const updatedMilestones = (initiative.milestones || []).map(m =>
        m.id === milestoneId ? { ...m, tasks: [...(m.tasks || []), newTask] } : m
      );
      await handleUpdateInitiative({ ...initiative, milestones: updatedMilestones });
    };

    const handleTaskDelete = async (milestoneId: string, taskId: string) => {
      const updatedMilestones = (initiative.milestones || []).map(m =>
        m.id === milestoneId ? { ...m, tasks: (m.tasks || []).filter(t => t.id !== taskId) } : m
      );
      await handleUpdateInitiative({ ...initiative, milestones: updatedMilestones });
    };

    const handleTaskUpdate = async (milestoneId: string, taskId: string, field: string, value: any) => {
      const updatedMilestones = (initiative.milestones || []).map(m => {
        if (m.id === milestoneId) {
          const updatedTasks = (m.tasks || []).map((t): MilestoneTask => {
            if (t.id === taskId) {
              const updates: any = (field === '__textFields' && value && typeof value === 'object')
                ? { ...value }
                : { [field]: value };
              return { ...t, ...updates };
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

    const isRequester = true; // For now simplified, or use useAuth if available
    const isNew = initiative.id.startsWith('new_');
    const theme = PASTEL_THEMES[initiative.type] || { bg: '#475569', text: '#FFFFFF', icon: '#FFFFFF' };
    const effectiveReturnPath = returnPath ?? location.pathname;

    // Portal para o `body`: `.page-content` tem `z-index: 0`, criando um
    // stacking context que prendia o peek atrás dos dois cabeçalhos (D14)
    // por mais alto que fosse o seu z-index.
    return createPortal(
      <>
        <div ref={peekSidebarRef} className={`peek-sidebar-container ${isClosing ? 'closing' : ''}`}>
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
              onClick={handleClose}
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
                onClick={() => setSidebarOpenSections(prev => { const next = { ...prev, overview: !prev.overview }; localStorage.setItem('oraculo_peek_sections', JSON.stringify(next)); return next; })}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#F8FAFC', border: 'none', borderBottom: sidebarOpenSections.overview ? '1px solid #E2E8F0' : 'none', cursor: 'pointer' }}
              >
                <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>VISÃO GERAL</h3>
                {sidebarOpenSections.overview ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
              </button>
              {sidebarOpenSections.overview && (
                  <div style={{ padding: '0.6rem 1rem 0.75rem 1rem' }}>
                    <div style={{
                      fontSize: '0.825rem',
                      lineHeight: '1.5',
                      color: '#475569',
                      fontFamily: "'Outfit', 'Inter', sans-serif",
                      fontWeight: 400,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {initiative.benefit || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Sem objetivo definido</span>}
                    </div>

                    {(initiative.externalLinkName || initiative.externalLinkUrl || resolveExternalUrl((initiative as any).externalLinkType, (initiative as any).externalLinkName, (initiative as any).externalLinkUrl)) && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.65rem', minHeight: '1.9rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#64748B', minWidth: '110px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Link Externo</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', flex: 1 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: getExternalLinkMeta((initiative as any).externalLinkType).background, color: getExternalLinkMeta((initiative as any).externalLinkType).color, borderRadius: '999px', padding: '0.18rem 0.45rem', fontSize: '0.68rem', fontWeight: 700 }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255,255,255,0.78)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 800, overflow: 'hidden' }}>
                              {getExternalLinkMeta((initiative as any).externalLinkType).kind === 'azure' || getExternalLinkMeta((initiative as any).externalLinkType).kind === 'bmc' ? (
                                <ExternalToolIcon kind={getExternalLinkMeta((initiative as any).externalLinkType).kind} size={12} />
                              ) : (
                                getExternalLinkMeta((initiative as any).externalLinkType).short
                              )}
                            </span>
                            {getExternalLinkMeta((initiative as any).externalLinkType).label}
                          </span>
                          <a
                            href={resolveExternalUrl((initiative as any).externalLinkType, (initiative as any).externalLinkName, (initiative as any).externalLinkUrl)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#2563EB', fontSize: '0.76rem', fontWeight: 500, textDecoration: 'none' }}
                          >
                            {(initiative as any).externalLinkName || 'Abrir link'} ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
              )}
            </div>

            {/* Properties Section */}
            <div className="linear-sidebar-card">
              <button
                onClick={() => setSidebarOpenSections(prev => { const next = { ...prev, properties: !prev.properties }; localStorage.setItem('oraculo_peek_sections', JSON.stringify(next)); return next; })}
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
                  handleStatusChange={(s, action) => handleUpdateInitiative({ ...initiative, status: s }, action)}
                  setShowPriorityMenu={setShowPriorityMenu}
                  demandantOptions={demandantOptions}
                />
              )}
            </div>

            {/* Milestones Section */}
            <div className="linear-sidebar-card">
              <button
                onClick={() => setSidebarOpenSections(prev => { const next = { ...prev, milestones: !prev.milestones }; localStorage.setItem('oraculo_peek_sections', JSON.stringify(next)); return next; })}
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
                handleUpdateMilestoneName={async () => {
                  if (!editingMilestoneId || !editMilestoneText.trim()) {
                    setEditingMilestoneId(null);
                    return;
                  }
                  const newName = editMilestoneText.trim();
                  onChange({
                    ...initiative,
                    milestones: (initiative.milestones || []).map(m => m.id === editingMilestoneId ? { ...m, name: newName } : m)
                  });
                  setEditingMilestoneId(null);
                  try {
                    await updateMilestoneApi(initiative.id, editingMilestoneId, { name: newName });
                  } catch (err) {
                    console.error('Erro ao renomear milestone:', err);
                  }
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
                handleAddMilestone={async (e) => {
                  if (e.key === 'Enter' && newMilestoneName.trim()) {
                    e.preventDefault();
                    const name = newMilestoneName.trim();
                    try {
                      const created = await createMilestoneApi(initiative.id, {
                        name,
                        systemId: 'N/A',
                        baselineDate: new Date().toISOString().split('T')[0],
                        order: (initiative.milestones || []).length
                      });

                      const milestoneForUi = {
                        ...created,
                        companyId: initiative.companyId,
                        departmentId: initiative.departmentId,
                        tasks: []
                      };

                      onChange({ ...initiative, milestones: [...(initiative.milestones || []), milestoneForUi] });
                      setNewMilestoneName('');
                    } catch (err) {
                      console.error('Erro ao criar milestone:', err);
                      alert('Não foi possível criar o milestone.');
                    }
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
                onClick={() => setSidebarOpenSections(prev => { const next = { ...prev, comments: !prev.comments }; localStorage.setItem('oraculo_peek_sections', JSON.stringify(next)); return next; })}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: '#F8FAFC', border: 'none', borderBottom: sidebarOpenSections.comments ? '1px solid #E2E8F0' : 'none', cursor: 'pointer' }}
              >
                <h3 style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', margin: 0, letterSpacing: '0.05em' }}>COMENTÁRIOS</h3>
                {sidebarOpenSections.comments ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
              </button>
              {sidebarOpenSections.comments && (
                <div style={{ padding: '0.6rem 1rem 1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* New Comment Flow */}
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
                          fontSize: '0.8rem',
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
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}
                        >
                          <X size={14} /> Cancelar
                        </button>
                        <button
                          onClick={async () => {
                            if (!commentText.trim()) return;

                            const newComment: InitiativeComment = {
                              id: `c_${Date.now()}`,
                              userId: user?.id || 'anon',
                              userName: (user as any)?.fullName || (user as any)?.name || 'Usuário',
                              content: commentText.trim(),
                              timestamp: new Date().toISOString()
                            };

                            try {
                              const savedComment = await createInitiativeCommentApi(initiative.id, {
                                content: newComment.content,
                                userId: newComment.userId,
                                userName: newComment.userName
                              });
                              onChange({ ...initiative, comments: [savedComment, ...(initiative.comments || [])] });
                              setCommentText('');
                              setIsAddingComment(false);
                            } catch (err) {
                              console.error('Erro ao criar comentário:', err);
                              alert('Não foi possível salvar o comentário.');
                            }
                          }}
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
                            fontSize: '0.7rem',
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

                  {/* Comments List */}
                  {(initiative.comments || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {(initiative.comments || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: '0.75rem', background: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ flexShrink: 0 }}>
                            {renderAvatar(c.userId, collaborators, 24)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E293B' }}>{c.userName}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{new Date(c.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditCommentText(c.content);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: 0 }}
                                    title="Editar"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button
                                    onClick={() => setCommentDeleteTarget({ initiativeId: initiative.id, comment: c })}
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
                                    onClick={async () => {
                                      const nextContent = editCommentText.trim();
                                      if (!nextContent) return;
                                      try {
                                        const updatedComment = await updateInitiativeCommentApi(initiative.id, c.id, {
                                          content: nextContent
                                        });
                                        onChange({
                                          ...initiative,
                                          comments: (initiative.comments || []).map(item => item.id === c.id ? updatedComment : item)
                                        });
                                        setEditingCommentId(null);
                                      } catch (err) {
                                        console.error('Erro ao atualizar comentário:', err);
                                        alert('Não foi possível atualizar o comentário.');
                                      }
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

          </div>

          {/* Edit Button at Footer */}
          <div style={{ padding: '1rem', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid #E2E8F0', background: '#F1F5F9' }}>
            <button
              onClick={() => navigate(`/iniciativas/${initiative.id}/edit`, { state: { returnPath: effectiveReturnPath } })}
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

        {showPriorityMenu && (
          <PriorityPicker
            value={initiative.priority || 0}
            position={showPriorityMenu}
            onSelect={async (p) => {
              await handleUpdateInitiative({ ...initiative, priority: p });
            }}
            onClose={() => setShowPriorityMenu(null)}
          />
        )}

        {/* Milestone Delete Confirmation Modal */}
        {milestoneDeleteId && (() => {
          const milestone = initiative.milestones?.find(m => m.id === milestoneDeleteId);
          if (!milestone) return null;

          const confirmDeleteMilestone = async () => {
            try {
              await deleteMilestoneApi(initiative.id, milestoneDeleteId);
              onChange({ ...initiative, milestones: (initiative.milestones || []).filter(m => m.id !== milestoneDeleteId) });
              if (activeMilestoneTaskViewId === milestoneDeleteId) setActiveMilestoneTaskViewId(null);
              setMilestoneDeleteId(null);
            } catch (err) {
              console.error('Erro ao excluir milestone:', err);
              alert('Não foi possível excluir o milestone.');
            }
          };

          return (
            <div className="modal-overlay">
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

        {commentDeleteTarget && (
          <div className="modal-overlay">
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '460px',
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
                Excluir Comentário
              </h3>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '0.75rem' }}>
                Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
              </p>

              <div style={{
                marginBottom: '1.5rem',
                padding: '0.65rem 0.8rem',
                borderRadius: '8px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                textAlign: 'left',
                maxHeight: '120px',
                overflow: 'auto'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>{commentDeleteTarget.comment.content}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setCommentDeleteTarget(null)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { initiativeId, comment } = commentDeleteTarget;
                      await deleteInitiativeCommentApi(initiativeId, comment.id);
                      onChange({ ...initiative, comments: (initiative.comments || []).filter(item => item.id !== comment.id) });
                      if (editingCommentId === comment.id) {
                        setEditingCommentId(null);
                        setEditCommentText('');
                      }
                      setCommentDeleteTarget(null);
                    } catch (err) {
                      console.error('Erro ao excluir comentário:', err);
                      alert('Não foi possível excluir o comentário.');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </>,
      document.body
    );
  }
);

InitiativePeekPanel.displayName = 'InitiativePeekPanel';
