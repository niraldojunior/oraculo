import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit2,
  FileText,
  LayoutList,
  CheckSquare,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Trash2
} from 'lucide-react';
import type { 
  Initiative, 
  Collaborator, 
  System, 
  MilestoneStatus, 
  InitiativeHistory, 
  InitiativeMilestone, 
  MilestoneTask 
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PriorityPicker } from '../common/PriorityPicker';
import { InitiativeProperties, InitiativeMilestones } from '../initiative/SidebarComponents';
import { InitiativeTaskBoard } from './InitiativeTaskBoard';
import { useView } from '../../context/ViewContext';

interface InitiativeEditorProps {
  initiative: Initiative;
  allCollaborators: Collaborator[];
  allSystems: System[];
  onSave?: (updated: Initiative) => Promise<void>;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case '1- Estratégico': return '#EF4444';
    case '2- Projeto': return '#3B82F6';
    case '3- Fast Track': return '#10B981';
    default: return '#64748B';
  }
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
  const [activeMilestoneTaskViewId, setActiveMilestoneTaskViewId] = useState<string | null>(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneText, setEditMilestoneText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [milestoneToDelete, setMilestoneToDelete] = useState<InitiativeMilestone | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  
  const benefitRef = useRef<HTMLTextAreaElement>(null);
  const rationaleRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement | null, minHeight: number = 24) => {
    if (textarea) {
      textarea.style.height = '0px'; 
      const scrollH = textarea.scrollHeight;
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

  // Atualizar o título da aba do navegador em tempo real enquanto digita
  useEffect(() => {
    if (formData.title) {
      document.title = `${formData.title} | Oráculo`;
    }
  }, [formData.title]);

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
    const newTask: MilestoneTask = { id: `task_${Date.now()}`, name: initialName, status: 'Backlog', milestoneId };
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
        const updatedTasks = (m.tasks || []).map(t => t.id === taskId ? { ...t, [field]: val } : t);
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
        return { ...m, tasks: newTasks };
      }
      return m;
    });
    const updated = { ...formData, milestones: list };
    setFormData(updated);
  };

  const [openSections, setOpenSections] = useState({ properties: true, milestones: true, comments: true, history: false });
  const [newMilestoneName, setNewMilestoneName] = useState('');

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
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
      'originDirectorate', 'benefit', 'rationale', 'scope', 'macroScope', 
      'premises', 'requirements', 'memberIds', 'milestones', 'actualEndDate', 'comments'
    ];
    
    return fieldsToCompare.some(f => JSON.stringify(cleanOrig[f]) !== JSON.stringify(cleanForm[f]));
  }, [formData, initiative]);

  // Push name to global header
  useEffect(() => {
    setHeaderContent(
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
          Iniciativa:
        </span>
        <input 
          style={{ 
            fontSize: '1.2rem', 
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

  const isRequester = user?.id === (formData as any).createdById;

  const handleSave = async (extraPayload?: Partial<Initiative>) => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const cleanOrig = {
        ...initiative,
        macroScope: initiative.macroScope || [''],
        memberIds: initiative.memberIds || []
      };
      const finalFormData = { ...formData, ...extraPayload };
      const changes: string[] = [];
      const checkChange = (field: keyof Initiative, label: string) => {
        const oldVal = (cleanOrig as any)[field];
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
      
      if (onSave) await onSave({
        ...payload,
        updatedBy: user?.fullName || (user as any)?.name || 'Usuário'
      } as any);
    } catch (err: any) {
      console.error('Error saving initiative:', err);
    } finally {
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
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Salvar</>}
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
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Objetivo</h2>
                    <textarea 
                      ref={benefitRef}
                      value={formData.benefit || ''} 
                      onChange={e => setFormData({ ...formData, benefit: e.target.value })} 
                      className="document-textarea"
                      style={{ minHeight: '100px' }}
                      placeholder="Descreva o objetivo principal desta iniciativa..."
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Benefícios</h2>
                    <textarea 
                      ref={rationaleRef}
                      value={formData.rationale || ''} 
                      onChange={e => setFormData({ ...formData, rationale: e.target.value })} 
                      className="document-textarea"
                      style={{ minHeight: '100px' }}
                      placeholder="Quais os principais benefícios esperados com este projeto?"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, minHeight: 0 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', margin: 0 }}>Escopo</h2>
                    <textarea 
                      value={formData.scope || ''} 
                      onChange={e => setFormData({ ...formData, scope: e.target.value })} 
                      className="document-textarea"
                      placeholder="Descreva aqui o escopo detalhado, premissas, requisitos e restrições da iniciativa. Utilize este espaço para documentar todos os detalhes relevantes para a execução do projeto."
                      style={{ flex: 1, minHeight: '300px', resize: 'none' }}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'tarefas' && (
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
                />
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
          padding: 1rem;
          border-radius: 8px;
          min-height: 120px;
          font-family: inherit;
          resize: vertical;
          outline: none;
          font-size: 1rem;
          line-height: 1.6;
        }
        .document-textarea:focus { border-color: #2563EB; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
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
