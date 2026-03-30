import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  X, 
  Layers, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Target,
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
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  Lightbulb,
  Loader2
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
    macroScope: initiative.macroScope || ['']
  });
  const [comment, setComment] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
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

  const getTypeColor = (type: InitiativeType) => {
    switch (type) {
      case '1- Portfolio 26': return '#F97316'; // Vivid Orange
      case '2- Project': return '#2563EB';      // Royal Blue
      case '3- Feature': return '#7C3AED';      // Deep Purple
      case '4- Enhancements': return '#0891B2'; // Deep Teal
      case '5- Tech Debt': return '#BE123C';    // Deep Rose
      case '6- Enabler': return '#4F46E5';      // Indigo
      case '7- Bug': return '#DC2626';          // Red
      default: return '#64748B'; // Neutral Slate for undefined
    }
  };

  const getTypeIcon = (type: InitiativeType, color?: string) => {
    const iconStyle = { color: color || 'inherit' };
    switch (type) {
      case '1- Portfolio 26': return <Zap size={20} style={iconStyle} />;
      case '2- Project': return <Briefcase size={20} style={iconStyle} />;
      case '3- Feature': return <Layers size={20} style={iconStyle} />;
      case '4- Enhancements': return <TrendingUp size={20} style={iconStyle} />;
      case '5- Tech Debt': return <Code size={20} style={iconStyle} />;
      case '6- Enabler': return <Settings size={20} style={iconStyle} />;
      case '7- Bug': return <Bug size={20} style={iconStyle} />;
      default: return <LayoutGrid size={20} style={iconStyle} />;
    }
  };

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case '1- Criação': return <Plus size={16} style={{ color: '#64748B' }} />;
      case '2- Avaliação': return <AlertCircle size={16} style={{ color: '#64748B' }} />;
      case '3- Backlog': return <Clock size={16} style={{ color: '#64748B' }} />;
      case '4- Discovery': return <Target size={16} style={{ color: '#64748B' }} />;
      case '5- Planejamento': return <Calendar size={16} style={{ color: '#64748B' }} />;
      case '6- Execução': return <Activity size={16} style={{ color: '#64748B' }} />;
      case '7- Concluído': return <CheckCircle2 size={16} style={{ color: '#10B981' }} />;
      case 'Suspenso': return <Pause size={16} style={{ color: '#F59E0B' }} />;
      case 'Cancelado': return <XCircle size={16} style={{ color: '#EF4444' }} />;
      default: return <Clock size={16} style={{ color: '#64748B' }} />;
    }
  };

  const handleSave = async (extraPayload?: Partial<Initiative>) => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const payload = { ...formData, ...extraPayload };
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
        const extra: Partial<Initiative> = { status: '2- Avaliação' };
        
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
      } else {
        await handleStatusChange(statusFlow[currentIndex + 1], 'Avançar');
      }
    }
  };

  const handleRetrocede = async () => {
    const currentIndex = statusFlow.indexOf(formData.status);
    if (currentIndex > 0) {
      await handleStatusChange(statusFlow[currentIndex - 1], 'Retroceder');
    }
  };

  const handleFinalize = async () => await handleStatusChange('7- Concluído', 'Finalizar');
  const handleSuspend = async () => await handleStatusChange(formData.status === 'Suspenso' ? (formData.previousStatus || '1- Criação') : 'Suspenso', formData.status === 'Suspenso' ? 'Retomar' : 'Suspender');
  const handleCancelClick = () => setShowConfirmCancel(true);

  const confirmCancel = async () => {
    setShowConfirmCancel(false);
    await handleStatusChange('Cancelado', 'Cancelar');
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

  const calculateDelay = () => {
    if (!formData.businessExpectationDate) return 'No prazo';
    const target = new Date(formData.businessExpectationDate);
    const now = new Date();
    if (now > target && formData.status !== '7- Concluído') {
      const diff = Math.ceil((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
      return `${diff} dias de atraso`;
    }
    return 'No prazo';
  };

  const isNew = formData.id.startsWith('new_');
  const isCanceled = formData.status === 'Cancelado';
  const isCompleted = formData.status === '7- Concluído';

  const typeColor = getTypeColor(formData.type);
  const isCreation = formData.status === '1- Criação';
  const headerBg = isCreation ? '#EBEDF0' : typeColor;
  const headerTextColor = isCreation ? '#4B5563' : '#FFF';

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="trello-modal glass-panel" style={{ maxWidth: '1300px', width: '94%', background: '#EBEDF0', padding: '0', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '96vh', overflow: 'hidden' }}>
        {/* Header: [Icon/Badge] [Name] --- [Status] [Close] */}
        {/* Header: [Icon/Badge] [Name] --- [Status] [Close] */}
        <div style={{ display: 'flex', borderBottom: isCreation ? '1px solid #C1C7D0' : '1px solid rgba(255,255,255,0.1)', background: headerBg, boxSizing: 'border-box', color: headerTextColor, transition: 'all 0.2s ease' }}>
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
              <div style={{ display: 'flex', alignItems: 'center' }}>{getTypeIcon(formData.type, headerTextColor)}</div>
              {isCreation ? (
                <div style={{ 
                  textTransform: 'uppercase', 
                  fontWeight: 800, 
                  fontSize: '0.65rem', 
                  color: '#4B5563', 
                  whiteSpace: 'nowrap',
                  background: 'rgba(0,0,0,0.05)',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                  Qualificação pendente
                </div>
              ) : (
                <select 
                  className="trello-select-small" 
                  style={{ textTransform: 'uppercase', fontWeight: 800, border: 'none', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', color: '#FFF', borderRadius: '4px' }} 
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value as InitiativeType })}
                >
                  {(['1- Portfolio 26', '2- Project', '3- Feature', '4- Enhancements', '5- Tech Debt', '6- Enabler', '7- Bug', 'Indefinido'] as InitiativeType[]).map(t => <option key={t} value={t} style={{ color: '#000' }}>{t.includes('- ') ? t.split('- ')[1] : t}</option>)}
                </select>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input 
                className="trello-title-input" 
                style={{ 
                  fontSize: '1.4rem', 
                  fontWeight: 800, 
                  color: isCreation ? '#172B4D' : '#FFF', 
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
              style={{ background: isCreation ? 'transparent' : 'rgba(255,255,255,0.15)', border: isCreation ? '1px solid #C1C7D0' : 'none', color: isCreation ? '#6B7280' : '#FFF', padding: '0.4rem', alignSelf: 'center', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
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
                  {/* Row 1: Diretoria Demandante, Owner */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Building2 size={13} /> Diretoria Demandante</label>
                      <select value={formData.originDirectorate || ''} onChange={e => setFormData({ ...formData, originDirectorate: e.target.value })}>
                        <option value="">Selecione...</option>
                        {['Engenharia', 'Operação FTTH', 'Operação B2B/Atacado', 'Operação Logística', 'Operação CGR', 'Comercial FTTH', 'Comercial B2B/Atacado', 'Estratégia', 'TI'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><User size={13} /> Owner</label><input value={formData.customerOwner || ''} onChange={e => setFormData({ ...formData, customerOwner: e.target.value })} placeholder="Responsável de Negócio" /></div>
                  </div>

                  {/* Row 2: Descrição */}
                  <div className="trello-field"><label><FileText size={13} /> Descrição</label><textarea value={formData.benefit || ''} onChange={e => setFormData({ ...formData, benefit: e.target.value })} rows={4} placeholder="Descrição detalhada para campos maiores" /></div>

                  {/* Row 3: Tipo Benefício, Racional */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Zap size={13} /> Tipo Benefício</label>
                      <select value={formData.benefitType || ''} onChange={e => setFormData({ ...formData, benefitType: e.target.value as BenefitType })}>
                        <option value="">Selecione...</option>
                        {['Aumento Receita', 'Redução Despesa', 'Redução Custos', 'Estratégico', 'Regulatório', 'Risco de Continuidade'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><Lightbulb size={13} /> Racional</label><textarea value={formData.rationale || ''} onChange={e => setFormData({ ...formData, rationale: e.target.value })} rows={4} placeholder="Racional detalhado para campos maiores" /></div>
                  </div>

                  {/* Row 4: Escopo Macro */}
                  <div className="trello-field"><label><Layers size={13} /> Escopo Macro</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(formData.macroScope || []).map((req, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input style={{ flex: 1 }} value={req} onChange={e => handleUpdateRequirement(idx, e.target.value)} placeholder="Descreva aqui o Requisito..." />
                          {idx > 0 && (
                            <button onClick={() => handleRemoveRequirement(idx)} style={{ color: '#EF4444', border: 'none', background: 'transparent', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          )}
                        </div>
                      ))}
                      <button className="btn-trello-ghost" onClick={handleAddRequirement} style={{ justifyContent: 'center', border: '1px dashed #D1D5DB', width: 'fit-content' }}><Plus size={14} /> Adicionar Requisito</button>
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
                      >
                        <option value="">Selecione...</option>
                        {allTeams
                          .filter(t => t.receivesInitiatives && t.departmentId === (user as any)?.departmentId)
                          .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                // Full UI for other statuses
                <>
                  {/* Row 1: Demandante, Owner, Data Abertura */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Building2 size={13} /> Demandante</label>
                      <select value={formData.requesterId || ''} onChange={e => setFormData({ ...formData, requesterId: e.target.value })} onBlur={() => !isNew && handleSave()}>
                        <option value="">Selecione...</option>
                        {allCollaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><User size={13} /> Owner</label><input value={formData.customerOwner || ''} onChange={e => setFormData({ ...formData, customerOwner: e.target.value })} onBlur={() => !isNew && handleSave()} placeholder="Responsável de Negócio" /></div>
                    <div className="trello-field"><label><Calendar size={13} /> Data Abertura</label><input type="date" value={formData.createdAt ? new Date(formData.createdAt).toISOString().split('T')[0] : ''} disabled /></div>
                  </div>

                  {/* Row 2: Tipo Iniciativa, Descrição */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Zap size={13} /> Tipo Iniciativa</label>
                      <select value={formData.type} onChange={e => { const newType = e.target.value as InitiativeType; setFormData({ ...formData, type: newType }); if (!isNew) handleSave({ type: newType }); }}>
                        {(['1- Portfolio 26', '2- Project', '3- Feature', '4- Enhancements', '5- Tech Debt', '6- Enabler', '7- Bug'] as InitiativeType[]).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><FileText size={13} /> Descrição</label><textarea value={formData.benefit || ''} onChange={e => setFormData({ ...formData, benefit: e.target.value })} onBlur={() => !isNew && handleSave()} rows={3} placeholder="Descrição detalhada para campos maiores" /></div>
                  </div>

                  {/* Row 3: Tipo Benefício, Racional */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Zap size={13} /> Tipo Benefício</label>
                      <select value={formData.benefitType || ''} onChange={e => setFormData({ ...formData, benefitType: e.target.value as BenefitType })} onBlur={() => !isNew && handleSave()}>
                        <option value="">Selecione...</option>
                        {['Aumento Receita', 'Redução Custos', 'Risco Continuidade', 'Regulatório'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><Lightbulb size={13} /> Racional</label><textarea value={formData.rationale || ''} onChange={e => setFormData({ ...formData, rationale: e.target.value })} onBlur={() => !isNew && handleSave()} rows={3} placeholder="Racional detalhado para campos maiores" /></div>
                  </div>

                  {/* Row 4: Escopo Macro */}
                  <div className="trello-field"><label><Layers size={13} /> Escopo Macro</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(formData.macroScope || []).map((req, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                          <input style={{ flex: 1 }} value={req} onChange={e => handleUpdateRequirement(idx, e.target.value)} onBlur={() => !isNew && handleSave()} placeholder="Descreva aqui o Requisito..." />
                          <button onClick={() => handleRemoveRequirement(idx)} style={{ color: '#EF4444', border: 'none', background: 'transparent' }}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button className="btn-trello-ghost" onClick={handleAddRequirement} style={{ justifyContent: 'center', border: '1px dashed #D1D5DB', width: 'fit-content' }}><Plus size={14} /> Adicionar Requisito</button>
                    </div>
                  </div>

                  {/* Row 5: Diretoria, Gestor, Lider */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', borderTop: '1px solid #D1D5DB', paddingTop: '1.5rem' }}>
                    <div className="trello-field"><label><Target size={13} /> Diretoria</label>
                      <select value={formData.originDirectorate || ''} onChange={e => setFormData({ ...formData, originDirectorate: e.target.value })} onBlur={() => !isNew && handleSave()}>
                        <option value="">Selecione...</option>
                        {['Comercial FTTH', 'Comercial Atacado/B2B', 'Operações FTTH', 'Operações Atacado/B2B', 'Estratégia', 'Engenharia'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><Building2 size={13} /> Gestor</label>
                      <select value={formData.leaderId || ''} onChange={e => setFormData({ ...formData, leaderId: e.target.value })} onBlur={() => !isNew && handleSave()}>
                        <option value="">Selecione...</option>
                        {allCollaborators.filter(c => c.role === 'Manager').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="trello-field"><label><Code size={13} /> Líder</label>
                      <select value={formData.technicalLeadId || ''} onChange={e => setFormData({ ...formData, technicalLeadId: e.target.value })} onBlur={() => !isNew && handleSave()}>
                        <option value="">Selecione...</option>
                        {allCollaborators.filter(c => c.role === 'Lead Engineer').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                   {/* Row 6: Datas Planejada, Real e Apuração */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="trello-field"><label><Calendar size={13} /> Data Planejada</label><input type="date" value={formData.businessExpectationDate || ''} onChange={e => setFormData({ ...formData, businessExpectationDate: e.target.value })} onBlur={() => !isNew && handleSave()} /></div>
                    <div className="trello-field"><label><Calendar size={13} /> Data Real</label><input type="date" disabled placeholder="No fim" /></div>
                    <div className="trello-field"><label><Activity size={13} /> Apuração</label><div style={{ padding: '0.65rem', background: '#F9FAFB', borderRadius: '4px', border: '1px solid #D1D5DB', fontSize: '0.85rem', fontWeight: 700, color: calculateDelay() === 'No prazo' ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{calculateDelay()}</div></div>
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
        <div style={{ padding: '1.25rem 2.5rem', background: '#EBEDF0', borderTop: '1px solid #D1D5DB', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {formData.status === '1- Criação' ? (
            <>
              {(!isNew || formData.previousStatus === '2- Avaliação') && (
                <button className="btn-trello-ghost" style={{ background: '#FFF', color: '#EF4444' }} onClick={handleCancelClick} disabled={isCanceled || isSaving}><XCircle size={18} /> Cancelar Iniciativa</button>
              )}
              <button 
                className="btn-trello-primary" 
                style={{ background: '#3B82F6', color: '#FFF', width: isSaving ? '140px' : 'auto', justifyContent: 'center' }} 
                disabled={isSaving}
                onClick={async () => {
                  const historyItem: InitiativeHistory = {
                    id: `h_save_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    user: (user as any)?.fullName || (user as any)?.name || 'Usuário',
                    action: 'Salvo em rascunho'
                  };
                  const updated = { ...formData, history: [...(formData.history || []), historyItem] };
                  setFormData(updated);
                  await handleSave(updated);
                  onClose();
                }}
              >
                {isSaving ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <><Plus size={18} /> Salvar</>}
              </button>
              <button className="btn-trello-primary" style={{ background: '#FFD919', color: '#000' }} onClick={handleAdvance} disabled={isCanceled || isCompleted || isSaving}>
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Avançar Etapa'} <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-trello-ghost" style={{ background: '#FFF' }} onClick={handleSuspend} disabled={isCanceled || isCompleted || isSaving}>{formData.status === 'Suspenso' ? <><Play size={18} /> Retomar</> : <><Pause size={18} /> Suspender</>}</button>
                <button className="btn-trello-ghost" style={{ background: '#FFF', color: '#EF4444' }} onClick={handleCancelClick} disabled={isCanceled || isSaving}><XCircle size={18} /> Cancelar Iniciativa</button>
              </div>
              <div style={{ width: '2px', background: '#D1D5DB' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn-trello-ghost" style={{ background: '#FFF' }} onClick={handleRetrocede} disabled={isCanceled || isCompleted || formData.status === '2- Avaliação' || isSaving}>
                  <ChevronLeft size={18} /> Retroceder
                </button>
                {isNew ? (
                  <button className="btn-trello-primary" style={{ background: '#FFD919', color: '#000' }} onClick={() => handleSave()} disabled={isSaving}>
                    {isSaving ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <><Plus size={18} /> Criar Iniciativa</>}
                  </button>
                ) : (
                  <>
                    <button className="btn-trello-primary" style={{ background: '#FFD919', color: '#000' }} onClick={handleAdvance} disabled={isCanceled || isCompleted || isSaving}>
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Avançar Etapa'} <ChevronRight size={18} />
                    </button>
                    <button className="btn-trello-primary" style={{ background: '#10B981', color: '#FFF' }} onClick={handleFinalize} disabled={isCanceled || isCompleted || isSaving}>
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar'} <CheckCircle2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <style>{`
          .trello-modal input, .trello-modal select, .trello-modal textarea { padding: 0.65rem; border: 1px solid #D1D5DB; background: #FFFFFF; font-size: 0.85rem; outline: none; transition: border-color 0.2s; }
          .trello-modal input:focus, .trello-modal select:focus, .trello-modal textarea:focus { border-color: #3B82F6; }
          .trello-field label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem; font-weight: 800; color: #4B5563; text-transform: uppercase; }
          .trello-title-input { width: 100%; font-size: 1.5rem; font-weight: 700; color: #172B4D; background: transparent; border: none !important; outline: none; }
          .trello-field { display: flex; flex-direction: column; gap: 0.4rem; }
          .btn-trello-primary { padding: 0.6rem 1.25rem; border: none; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: opacity 0.2s; border-radius: 3px; }
          .btn-trello-ghost { padding: 0.6rem 1rem; background: transparent; color: #4B5563; border: 1px solid transparent; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-radius: 3px; }
          .btn-trello-ghost:hover:not(:disabled) { background: rgba(0,0,0,0.05); }
          .avatar-placeholder { width: 32px; height: 32px; border-radius: 50%; background: #D1D5DB; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: #4B5563; flex-shrink: 0; }
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
      </div>
    </div>
  );
};

export default InitiativeDetailModal;

