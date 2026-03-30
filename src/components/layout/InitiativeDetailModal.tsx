import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  X, 
  Layers, 
  User, 
  Building2, 
  Clock,
  AlertCircle,
  Activity,
  MessageSquare,
  TrendingUp,
  XCircle,
  Pause,
  Play,
  Briefcase,
  Zap,
  Code,
  Settings,
  Bug,
  LayoutGrid,
  ChevronLeft,
  Plus,
  Trash2,
  FileText,
  Lightbulb,
  Loader2,
  Users,
  Lock
} from 'lucide-react';
import type { Team, Initiative, Collaborator, MilestoneStatus, InitiativeType, BenefitType, InitiativeHistory } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface InitiativeDetailModalProps {
  initiative: Initiative;
  allCollaborators: Collaborator[];
  allTeams: Team[];
  onClose: () => void;
  onSave?: (updated: Initiative) => Promise<void>;
}

const InitiativeDetailModal: React.FC<InitiativeDetailModalProps> = ({ 
  initiative, 
  allCollaborators, 
  allTeams,
  onClose,
  onSave
}) => {
  // Handled and defined below
  const { user } = useAuth();

  const [formData, setFormData] = useState<Initiative>({ 
    ...initiative,
    macroScope: initiative.macroScope || [''],
    createdById: initiative.createdById || user?.id
  });
  const [comment, setComment] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showRetrocedeModal, setShowRetrocedeModal] = useState(false);
  const [retrocedeReason, setRetrocedeReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
      const { history, ...rest } = obj;
      return JSON.stringify(rest);
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

  const statusFlow: MilestoneStatus[] = [
    '1- Criação',
    '2- Avaliação',
    '3- Backlog',
    '4- Discovery',
    '5- Planejamento',
    '6- Execução',
    '7- Concluído'
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case '1- Portfolio 26': 
      case 'Portifólio 26': return '#E11D48'; 
      case '2- Project': 
      case 'Projeto': return '#2563EB';      
      case '3- Feature': 
      case 'Nova Funcionalidade': return '#059669'; 
      case '4- Enhancements': 
      case 'Melhoria': return '#D97706'; 
      case '5- Tech Debt': 
      case 'Débito Técnico': return '#4B5563';    
      case '6- Enabler': 
      case 'Enabler': return '#4F46E5';      
      case '7- Bug': 
      case 'Bug': return '#DC2626';          
      default: return '#64748B'; 
    }
  };

  const getTypeIcon = (type: string, color?: string) => {
    const iconStyle = { color: color || 'inherit' };
    switch (type) {
      case '1- Portfolio 26': 
      case 'Portifólio 26': return <Zap size={20} style={iconStyle} />;
      case '2- Project': 
      case 'Projeto': return <Briefcase size={20} style={iconStyle} />;
      case '3- Feature': 
      case 'Nova Funcionalidade': return <Layers size={20} style={iconStyle} />;
      case '4- Enhancements': 
      case 'Melhoria': return <TrendingUp size={20} style={iconStyle} />;
      case '5- Tech Debt': 
      case 'Débito Técnico': return <Code size={20} style={iconStyle} />;
      case '6- Enabler': 
      case 'Enabler': return <Settings size={20} style={iconStyle} />;
      case '7- Bug': 
      case 'Bug': return <Bug size={20} style={iconStyle} />;
      default: return <LayoutGrid size={20} style={iconStyle} />;
    }
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case '1- Criação': return <Plus size={16} style={{ color: '#64748B' }} />;
      case '2- Avaliação': return <AlertCircle size={16} style={{ color: '#64748B' }} />;
      case '3- Backlog': return <Clock size={16} style={{ color: '#64748B' }} />;
      default: return <Clock size={16} style={{ color: '#64748B' }} />;
    }
  };

  const isExecutingLeader = user?.id === formData.leaderId;
  const isRequester = user?.id === (formData as any).createdById;
  const isEvaluation = formData.status === '2- Avaliação';

  const evaluationManagers = useMemo(() => {
    if (!formData.executingTeamId) return [];
    const mainTeam = allTeams.find(t => t.id === formData.executingTeamId);
    if (!mainTeam) return [];

    // Find all child teams belonging to this executing team
    const childTeamIds = allTeams.filter(t => t.parentTeamId === mainTeam.id).map(ct => ct.id);
    const relevantTeamIds = [mainTeam.id, ...childTeamIds];

    // Managers/Leaders are:
    // 1. Members of the main team or child teams who have a "Manager" or "Lead" role
    // 2. The explicit leader of the main team or any child team
    const childLeaders = allTeams.filter(t => t.parentTeamId === mainTeam.id).map(t => t.leaderId).filter(Boolean);
    const relevantLeaders = [mainTeam.leaderId, ...childLeaders];

    return allCollaborators.filter(c => 
      relevantLeaders.includes(c.id) || 
      (relevantTeamIds.includes(c.squadId || '') && (c.role === 'Manager' || c.role === 'Lead Engineer' || c.role === 'Head'))
    );
  }, [formData.executingTeamId, allCollaborators, allTeams]);

  const EVAL_TO_TYPE: Record<string, string> = {
    'Portifólio 26': '1- Portfolio 26',
    'Projeto': '2- Project',
    'Nova Funcionalidade': '3- Feature',
    'Melhoria': '4- Enhancements',
    'Débito Técnico': '5- Tech Debt',
    'Enabler': '6- Enabler',
    'Bug': '7- Bug'
  };

  const handleSave = async (extraPayload?: Partial<Initiative>) => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      let payload = { 
        ...formData, 
        ...extraPayload,
        createdById: formData.createdById || user?.id
      };

      // Add audit history for Evaluation stage saves
      if (formData.status === '2- Avaliação' && !extraPayload?.status) {
        const mgr = allCollaborators.find(c => c.id === (payload as any).assignedManagerId);
        const historyItem: InitiativeHistory = {
          id: `h_save_${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: (user as any)?.fullName || (user as any)?.name || 'Usuário',
          action: `Atualização de Qualificação: Tipo ${(payload as any).initiativeType || 'Não definido'}, Gestor ${mgr?.name || 'Não definido'}`
        };
        payload.history = [...(payload.history || []), historyItem];
        setFormData(payload);
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

    if (newStatus === '1- Criação' && formData.status === '2- Avaliação') {
      updated.createdAt = '';
    }
    setFormData(updated);
    if (!isNew) await handleSave(updated);
    return updated;
  };

  const handleAdvance = async () => {
    const currentIndex = statusFlow.indexOf(formData.status);
    if (currentIndex < statusFlow.length - 1 && currentIndex !== -1) {
      if (formData.status === '1- Criação') {
        // Validation
        const missing = [];
        if (!formData.title) missing.push('Nome da Iniciativa');
        if (!formData.originDirectorate) missing.push('Diretoria Solicitante');
        if (!formData.customerOwner) missing.push('Owner');
        if (!formData.benefit) missing.push('Descrição');
        if (!formData.benefitType) missing.push('Tipo Benefício');
        if (!formData.rationale) missing.push('Racional');
        
        const hasRequirements = formData.macroScope && formData.macroScope.some(s => s && s.trim().length > 0);
        if (!hasRequirements) {
          missing.push('Pelo menos um requisito no Escopo Macro');
        }

        if (missing.length > 0) {
          alert(`Por favor, preencha os seguintes campos obrigatórios:\n- ${missing.join('\n- ')}`);
          return;
        }

        // Set date only if moving out of Creation for the first time
        const extra: any = { status: '2- Avaliação', createdById: formData.createdById || user?.id };
        
        // Auto-assign responsibility to the executing team leader
        if (formData.executingTeamId) {
          const executingTeam = allTeams.find(t => t.id === formData.executingTeamId);
          if (executingTeam?.leaderId) {
            extra.leaderId = executingTeam.leaderId;
          }
        }

        if (!formData.createdAt || formData.previousStatus === '2- Avaliação') {
           extra.createdAt = new Date().toISOString();
        }
        await handleStatusChange('2- Avaliação', 'Avançar', extra);
        onClose();
      } else if (formData.status === '2- Avaliação') {
        if (!isExecutingLeader) return;
        if (!(formData as any).initiativeType || !(formData as any).assignedManagerId) {
          alert('Por favor, preencha o Tipo de Iniciativa e o Gestor Responsável.');
          return;
        }

        // Map the evaluation string to formal type
        const newType = EVAL_TO_TYPE[(formData as any).initiativeType] || formData.type;
        const extra: Partial<Initiative> = {
          type: newType as InitiativeType,
          leaderId: (formData as any).assignedManagerId
        };

        await handleStatusChange('3- Backlog', 'Aprovar Avaliação', extra);
        onClose();
      } else {
        await handleStatusChange(statusFlow[currentIndex + 1], 'Avançar');
        onClose();
      }
    }
  };

  const handleRetrocedeClick = () => {
    if (formData.status === '2- Avaliação') {
      setShowRetrocedeModal(true);
    } else {
      handleRetrocede();
    }
  };

  const confirmRetrocede = async () => {
    if (!retrocedeReason.trim()) {
      alert('Por favor, descreva o motivo do retrocesso.');
      return;
    }
    const historyItem: InitiativeHistory = {
      id: `h_ret_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: (user as any)?.fullName || (user as any)?.name || 'Usuário',
      action: `Retroceder: De Avaliação para Criação`,
      notes: `Motivo: ${retrocedeReason}`
    };
    const updated = { ...formData, status: '1- Criação' as MilestoneStatus, history: [...(formData.history || []), historyItem] };
    setFormData(updated);
    await handleSave(updated);
    setShowRetrocedeModal(false);
    onClose();
  };

  const handleRetrocede = async () => {
    const currentIndex = statusFlow.indexOf(formData.status);
    if (currentIndex > 0) {
      await handleStatusChange(statusFlow[currentIndex - 1], 'Retroceder');
    }
  };

  const handleSuspend = async () => {
    await handleStatusChange(formData.status === 'Suspenso' ? (formData.previousStatus || '1- Criação') : 'Suspenso', formData.status === 'Suspenso' ? 'Retomar' : 'Suspender');
    onClose();
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
    handleSave(updated);
  };

  const isNew = formData.id.startsWith('new_');

  const typeColor = getTypeColor(isEvaluation ? ((formData as any).initiativeType || '') : formData.type);
  const isCreation = formData.status === '1- Criação';
  
  // Header logic:
  // - Creation: Light Gray
  // - Evaluation + No Type: White/Footer Background (#F8FAFC)
  // - Selected Type: Type Color
  const headerBg = isCreation 
    ? '#EBEDF0' 
    : (isEvaluation && !(formData as any).initiativeType) 
      ? '#F8FAFC' 
      : typeColor;

  const headerTextColor = (isCreation || (isEvaluation && !(formData as any).initiativeType)) 
    ? '#000000' 
    : '#FFF';

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="trello-modal glass-panel" style={{ maxWidth: '1300px', width: '94%', background: '#EBEDF0', padding: '0', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '96vh', overflow: 'hidden' }}>
        {/* Header: [Icon/Badge] [Name] --- [Status] [Close] */}
        {/* Header: [Icon/Badge] [Name] --- [Status] [Close] */}
        <div style={{ display: 'flex', borderBottom: (isCreation || (isEvaluation && !(formData as any).initiativeType)) ? '1px solid #D1D5DB' : '1px solid rgba(255,255,255,0.1)', background: headerBg, boxSizing: 'border-box', color: headerTextColor, transition: 'all 0.2s ease' }}>
          {/* Header Left - 70% (Matches Body Flex 7) */}
          <div style={{ 
            width: '70%',
            flexShrink: 0,
            flexGrow: 0,
            padding: '1.25rem 2rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            borderRight: '1px solid transparent', 
            boxSizing: 'border-box',
            minWidth: 0 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>{getTypeIcon(isEvaluation ? ((formData as any).initiativeType || '') : formData.type, headerTextColor)}</div>
              {isCreation ? (
                <div style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: '0.65rem', color: '#4B5563', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.05)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)' }}>
                  Qualificação pendente
                </div>
              ) : isEvaluation ? (
                <select 
                  className="trello-select-small" 
                  style={{ textTransform: 'uppercase', fontWeight: 800, border: 'none', background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.4rem', color: headerTextColor, borderRadius: '4px' }} 
                  value={(formData as any).initiativeType || ''} 
                  onChange={e => setFormData({ ...formData, initiativeType: e.target.value } as any)}
                  disabled={!isExecutingLeader}
                >
                  <option value="">Selecione o Tipo...</option>
                  {['Portifólio 26', 'Projeto', 'Nova Funcionalidade', 'Melhoria', 'Débito Técnico', 'Enabler', 'Bug'].map(t => <option key={t} value={t} style={{ color: '#000' }}>{t}</option>)}
                </select>
              ) : (
                <select 
                  className="trello-select-small" 
                  style={{ textTransform: 'uppercase', fontWeight: 800, border: 'none', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', color: '#FFF', borderRadius: '4px' }} 
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value as InitiativeType })}
                >
                  {(['1- Portfolio 26', '2- Project', '3- Feature', '4- Enhancements', '5- Tech Debt', '6- Enabler', '7- Bug'] as InitiativeType[]).map(t => <option key={t} value={t} style={{ color: '#000' }}>{t.includes('- ') ? t.split('- ')[1] : t}</option>)}
                </select>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input 
                className="trello-title-input" 
                style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 800, 
                  color: headerTextColor, 
                  padding: isCreation ? '0.4rem 0.8rem' : '0', 
                  background: isCreation ? '#FFF' : 'transparent', 
                  border: isCreation ? '1px solid #C1C7D0' : 'none', 
                  borderRadius: isCreation ? '4px' : '0',
                  boxShadow: isCreation ? 'inset 0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  width: '100%', 
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }} 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                disabled={!isCreation}
                placeholder="Nome da Iniciativa" 
              />
            </div>
          </div>

          {/* Header Right - 30% (Matches Body Flex 3) */}
          <div style={{ 
            width: '30%',
            flexShrink: 0,
            flexGrow: 0,
            padding: '1.25rem 2rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isCreation ? '#6B7280' : 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>Etapa Atual:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
                {getStatusIcon(formData.status)}
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#172B4D' }}>{formData.status}</span>
              </div>
            </div>
            <button 
              onClick={handleCloseAttempt} 
              className="btn-icon" 
              style={{ background: isCreation ? 'transparent' : 'rgba(255,255,255,0.15)', border: isCreation ? '1px solid #C1C7D0' : 'none', color: headerTextColor, padding: '0.4rem', alignSelf: 'center', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', background: '#FFFFFF', overflow: 'hidden' }}>
          {/* Left Column - Geral Section */}
          <div style={{ width: '70%', flexShrink: 0, flexGrow: 0, padding: '1.5rem 2rem', borderRight: '1px solid #D1D5DB', boxSizing: 'border-box', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Geral Header */}
              <div style={{ display: 'inline-flex', padding: '0.25rem 0.75rem', border: '1.5px solid #D1D5DB', borderRadius: '4px', alignSelf: 'flex-start', background: '#EBEDF0' }}>
                <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: '#4B5563' }}>Geral</span>
              </div>

              {formData.status === '1- Criação' ? (
                // UI for "1- Criação" status
                <>
                  {/* Row 1: Diretoria Demandante, Owner, Usuário Solicitante */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Building2 size={13} /> Diretoria Demandante</label>
                      <select value={formData.originDirectorate || ''} onChange={e => setFormData({ ...formData, originDirectorate: e.target.value })} disabled={!isRequester && !isNew}>
                        <option value="">Selecione...</option>
                        {['Engenharia', 'Operação FTTH', 'Operação B2B/Atacado', 'Operação Logística', 'Operação CGR', 'Comercial FTTH', 'Comercial B2B/Atacado', 'Estratégia', 'TI'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><User size={13} /> Owner</label><input value={formData.customerOwner || ''} onChange={e => setFormData({ ...formData, customerOwner: e.target.value })} placeholder="Responsável de Negócio" disabled={!isRequester && !isNew} /></div>
                    <div className="trello-field">
                      <label><User size={13} /> Usuário Solicitante</label>
                      <div style={{ background: '#F8FAFC', padding: '0.65rem 0.8rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                        {allCollaborators.find(c => c.id === (formData.createdById || user?.id))?.name || 'Sistema'}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Descrição */}
                  <div className="trello-field"><label><FileText size={13} /> Descrição</label><textarea value={formData.benefit || ''} onChange={e => setFormData({ ...formData, benefit: e.target.value })} rows={4} placeholder="Descrição detalhada para campos maiores" disabled={!isRequester && !isNew} /></div>

                  {/* Row 3: Tipo Benefício, Racional */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Zap size={13} /> Tipo Benefício</label>
                      <select value={formData.benefitType || ''} onChange={e => setFormData({ ...formData, benefitType: e.target.value as BenefitType })} disabled={!isRequester && !isNew}>
                        <option value="">Selecione...</option>
                        {['Aumento Receita', 'Redução Despesa', 'Redução Custos', 'Estratégico', 'Regulatório', 'Risco de Continuidade'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><Lightbulb size={13} /> Racional</label><textarea value={formData.rationale || ''} onChange={e => setFormData({ ...formData, rationale: e.target.value })} rows={4} placeholder="Racional detalhado para campos maiores" disabled={!isRequester && !isNew} /></div>
                  </div>

                  {/* Row 4: Escopo Macro */}
                  <div className="trello-field"><label><Layers size={13} /> Escopo Macro</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(formData.macroScope || []).map((req, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input style={{ flex: 1 }} value={req} onChange={e => handleUpdateRequirement(idx, e.target.value)} placeholder="Descreva aqui o Requisito..." disabled={!isRequester && !isNew} />
                          {idx > 0 && (
                            <button onClick={() => handleRemoveRequirement(idx)} style={{ color: '#EF4444', border: 'none', background: 'transparent', cursor: 'pointer' }} disabled={!isRequester && !isNew}><Trash2 size={16} /></button>
                          )}
                        </div>
                      ))}
                      <button className="btn-trello-ghost" onClick={handleAddRequirement} disabled={!isRequester && !isNew} style={{ justifyContent: 'center', border: '1px dashed #D1D5DB', width: 'fit-content' }}><Plus size={14} /> Adicionar Requisito</button>
                    </div>
                  </div>

                  {/* Row 5: Time Executor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Code size={13} /> Time Executor</label>
                      <select 
                        value={formData.executingTeamId || ''} 
                        onChange={e => {
                          const selectedTeam = allTeams.find(t => t.id === e.target.value);
                          setFormData({ 
                            ...formData, 
                            executingTeamId: e.target.value,
                            executingDirectorate: selectedTeam?.name || ''
                          });
                        }}
                        disabled={!isRequester && !isNew}
                      >
                        <option value="">Selecione...</option>
                        {allTeams
                          .filter(t => t.receivesInitiatives && t.departmentId === (user as any)?.departmentId)
                          .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              ) : isEvaluation ? (
                <>
                  {/* Evaluation Layout: Read Only creation fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="trello-field readonly">
                      <label><Building2 size={12} /> Diretoria Demandante</label>
                      <div className="readonly-val" style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{formData.originDirectorate}</div>
                    </div>
                    <div className="trello-field readonly">
                      <label><User size={12} /> Owner</label>
                      <div className="readonly-val" style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{formData.customerOwner}</div>
                    </div>
                    <div className="trello-field readonly">
                      <label><User size={12} /> Usuário Solicitante</label>
                      <div className="readonly-val" style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {allCollaborators.find(c => c.id === formData.createdById)?.name || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="trello-field readonly">
                    <label><FileText size={12} /> Descrição</label>
                    <div className="readonly-val" style={{ background: '#F1F5F9', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', whiteSpace: 'pre-wrap', minHeight: '60px' }}>{formData.benefit}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div className="trello-field readonly">
                      <label><Zap size={12} /> Tipo Benefício</label>
                      <div className="readonly-val" style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>{formData.benefitType}</div>
                    </div>
                    <div className="trello-field readonly">
                      <label><Lightbulb size={12} /> Racional</label>
                      <div className="readonly-val" style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', whiteSpace: 'pre-wrap', minHeight: '60px' }}>{(formData as any).rationale}</div>
                    </div>
                  </div>

                  <div className="trello-field readonly">
                    <label><Layers size={12} /> Escopo Macro</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.5rem', background: '#F1F5F9', borderRadius: '4px' }}>
                      {formData.macroScope?.filter(s => s.trim()).map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                          <div style={{ width: '6px', height: '6px', background: '#94A3B8', borderRadius: '50%' }} /> {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', padding: '1.25rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                     <div className="trello-field">
                       <label style={{ color: '#2563EB', fontWeight: 700 }}><Users size={13} /> Time Executor</label>
                       <div className="readonly-val" style={{ fontWeight: 800, color: '#1E293B', fontSize: '1rem', padding: '0.5rem 0' }}>{formData.executingDirectorate || 'Não definido'}</div>
                     </div>
                     <div className="trello-field">
                       <label style={{ color: '#2563EB', fontWeight: 700 }}><User size={13} /> Gestor Responsável</label>
                       <select 
                        value={(formData as any).assignedManagerId || ''} 
                        onChange={e => setFormData({ ...formData, assignedManagerId: e.target.value } as any)}
                        disabled={!isExecutingLeader}
                        style={{ 
                          width: '100%',
                          padding: '0.6rem',
                          borderRadius: '4px',
                          border: isExecutingLeader ? '2px solid #2563EB' : '1px solid #CBD5E1',
                          background: isExecutingLeader ? '#FFF' : '#F8FAFC',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                       >
                         <option value="">Selecione o Gestor...</option>
                         {evaluationManagers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                     </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Catch-all for other statuses - Read Only Placeholder */}
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    Visualização detalhada para o status <strong>{formData.status}</strong> em desenvolvimento.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Comments and History */}
          <div style={{ width: '30%', flexShrink: 0, flexGrow: 0, display: 'flex', flexDirection: 'column', background: '#F3F4F6', overflow: 'hidden', boxSizing: 'border-box' }}>
            {/* Comments Section */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #D1D5DB' }}>
              <div className="trello-section-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={16} /><h3 style={{ margin: 0, fontSize: '0.9rem', color: '#172B4D' }}>Comentários</h3></div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="avatar-placeholder" style={{ background: '#3B82F6', color: '#FFF' }}>{((user as any)?.fullName || (user as any)?.name || 'U').charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <textarea className="comment-textarea" placeholder="Adicionar comentário..." value={comment} onChange={e => setComment(e.target.value)} style={{ background: '#FFF' }} />
                  {comment && <button className="btn-trello-primary" style={{ marginTop: '0.5rem', background: '#3B82F6', height: '32px', fontSize: '0.75rem' }} onClick={handleAddComment}>Salvar Comentário</button>}
                </div>
              </div>
            </div>
            {/* History Section */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
              <div className="trello-section-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={16} /><h3 style={{ margin: 0, fontSize: '0.9rem', color: '#172B4D' }}>Histórico</h3></div>
              <div className="activity-list" style={{ marginTop: 0 }}>
                {(formData.history || []).slice().reverse().map(h => (
                  <div key={h.id} className="activity-item" style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Bullet representation */}
                    <div style={{ position: 'absolute', left: '2px', top: '5px', width: '10px', height: '10px', borderRadius: '50%', background: h.action === 'Comentário' ? '#3B82F6' : '#94A3B8', border: '2px solid #FFF', zIndex: 1 }} />
                    {/* Timeline Line */}
                    <div style={{ position: 'absolute', left: '6px', top: '15px', bottom: '-20px', width: '2px', background: '#D1D5DB' }} />
                    <div className="activity-content" style={{ paddingLeft: 0 }}>
                      <div className="activity-header"><span className="user-name" style={{ fontSize: '0.8rem' }}>{h.user || 'Usuário'}</span> <span className="timestamp">{new Date(h.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span></div>
                      <div className={h.action === 'Comentário' ? 'activity-comment-box' : 'activity-log'} style={{ background: h.action === 'Comentário' ? '#FFF' : 'transparent', marginTop: '0.25rem' }}>{h.notes || h.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid #D1D5DB', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderRadius: '0 0 12px 12px' }}>
             {/* Left Actions - Destructive */}
             <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(isRequester || isNew || (isEvaluation && isExecutingLeader)) && (
                <button onClick={handleCancelClick} className="btn-trello-ghost" style={{ color: '#EF4444', border: '1px solid #FEE2E2', background: '#FFF' }}>
                  <XCircle size={15} /> Cancelar Iniciativa
                </button>
              )}
             </div>

             {/* Right Actions - Progression */}
             <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {isEvaluation ? (
                  <>
                    {(isExecutingLeader || isRequester) && (
                      <button onClick={handleSuspend} className="btn-trello-ghost" style={{ background: '#FFF', border: '1px solid #E2E8F0' }}>
                        {formData.status === 'Suspenso' ? <Play size={15} style={{ color: '#10B981' }} /> : <Pause size={15} style={{ color: '#F59E0B' }} />}
                        {formData.status === 'Suspenso' ? 'Retomar' : 'Suspender'}
                      </button>
                    )}
                    {(isExecutingLeader || isRequester) && (
                      <button onClick={handleRetrocedeClick} className="btn-trello-ghost" style={{ background: '#FFF', border: '1px solid #E2E8F0' }}>
                        <ChevronLeft size={15} /> Retroceder
                      </button>
                    )}
                    {isExecutingLeader && (
                      <button onClick={async () => { await handleSave(); onClose(); }} className="btn-trello" style={{ background: '#475569' }} disabled={isSaving}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                      </button>
                    )}
                    {isExecutingLeader && (
                      <button onClick={handleAdvance} className="btn-trello" style={{ background: '#F59E0B', color: '#172B4D' }} disabled={isSaving}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Avançar Etapa >"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {(isRequester || isNew) ? (
                      <>
                        <button onClick={async () => { await handleSave(); onClose(); }} className="btn-trello" style={{ background: '#091E42' }} disabled={isSaving}>
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                        </button>
                        <button onClick={handleAdvance} className="btn-trello" style={{ background: '#F59E0B', color: '#172B4D' }} disabled={isSaving}>
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : "Avançar Etapa >"}
                        </button>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', color: '#64748B', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid #E2E8F0' }}>
                        <Lock size={15} /> SOMENTE LEITURA
                      </div>
                    )}
                  </>
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
                <button className="btn-trello-ghost" style={{ background: '#F3F4F6', color: '#374151', flex: 1 }} onClick={() => setShowConfirmClose(false)}>
                  Continuar Editando
                </button>
                <button className="btn-trello-primary" style={{ background: '#EF4444', color: '#FFF', flex: 1 }} onClick={onClose}>
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

        {showRetrocedeModal && (
          <div className="confirm-overlay" style={{ zIndex: 1000002 }}>
            <div className="confirm-card" style={{ width: '500px' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#FEF3C7', borderRadius: '50%', color: '#D97706' }}>
                  <AlertCircle size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>Retroceder para Criação</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>
                  Informe o motivo pelo qual esta iniciativa está voltando para a etapa de criação:
                </p>
              </div>
              <textarea 
                value={retrocedeReason} 
                onChange={e => setRetrocedeReason(e.target.value)} 
                rows={4} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #D1D5DB', marginBottom: '1.5rem', outline: 'none', background: '#FFF' }}
                placeholder="Ex: Dados incompletos no racional técnico..."
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-trello-ghost" style={{ background: '#F3F4F6', color: '#374151', flex: 1 }} onClick={() => setShowRetrocedeModal(false)}>
                  Cancelar
                </button>
                <button className="btn-trello" style={{ background: '#F59E0B', color: '#FFF', flex: 1 }} onClick={confirmRetrocede}>
                  Confirmar Retrocesso
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitiativeDetailModal;

