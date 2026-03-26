import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Info,
  Layers,
  Zap,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import type { Initiative, InitiativeMilestone, InitiativeType, MilestoneStatus, Collaborator, System, Team, InitiativeHistory, BenefitType, Department } from '../types';
import { useAuth } from '../context/AuthContext';

const INITIATIVE_TYPES: InitiativeType[] = ['Estratégico', 'Projeto', 'Fast Track', 'Vulnerabilidade', 'Problema', 'PBI', 'Roadmap Tecnológico'];
const BENEFIT_TYPES: BenefitType[] = ['Aumento Receita', 'Redução Custos', 'Risco Continuidade', 'Regulatório'];

const InitiativeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, currentCompany, currentDepartment, canManageEntities } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading && !canManageEntities) {
      navigate('/iniciativas');
    }
  }, [loading, canManageEntities, navigate]);

  const [formData, setFormData] = useState<Initiative>({
    companyId: '',
    id: '',
    title: '',
    type: 'Projeto',
    benefit: '',
    benefitType: undefined,
    scope: '',
    customerOwner: '',
    originDirectorate: '',
    leaderId: '',
    technicalLeadId: '',
    impactedSystemIds: [],
    milestones: [],
    createdAt: new Date().toISOString(),
    businessExpectationDate: '',
    status: '1- Em Avaliação',
    departmentId: '',
    history: []
  });

  const isSimplType = ['Fast Track', 'Vulnerabilidade', 'Problema', 'PBI', 'Roadmap Tecnológico'].includes(formData.type);



  // Helper for role permissions
  const isManagerOrDirector = canManageEntities; 

  const canEditGeneral = !isEditMode || isManagerOrDirector || 
    (formData.status === '1- Em Avaliação' && isManagerOrDirector) ||
    (formData.status === '2- Em Backlog' && isManagerOrDirector);

  const canEditImpact = !isEditMode || isManagerOrDirector ||
    (formData.status === '1- Em Avaliação' && isManagerOrDirector) ||
    (formData.status === '2- Em Backlog' && isManagerOrDirector) ||
    (formData.status === '3- Em Planejamento' && (user?.role === 'Lead Engineer' || isManagerOrDirector));

  const canEditMilestones = !isEditMode || isManagerOrDirector ||
    (formData.status === '3- Em Planejamento' && (user?.role === 'Lead Engineer' || isManagerOrDirector)) ||
    (formData.status === '4- Em Execução' && user?.role === 'Lead Engineer');

  const canAdvanceStatus = !isEditMode || isManagerOrDirector || (
    (formData.status === '1- Em Avaliação' && isManagerOrDirector && !!formData.leaderId) ||
    (formData.status === '2- Em Backlog' && isManagerOrDirector) ||
    (formData.status === '3- Em Planejamento' && (user?.role === 'Lead Engineer' || isManagerOrDirector))
  );

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    Promise.all([
      fetch(`/api/collaborators${query}`).then(res => res.json()),
      fetch(`/api/systems${query}`).then(res => res.json()),
      fetch(`/api/teams${query}`).then(res => res.json()),
      fetch('/api/departments').then(res => res.json())
    ])
    .then(([collabsData, systemsData, teamsData, deptsData]) => {
      setCollaborators(Array.isArray(collabsData) ? collabsData : []);
      setSystems(Array.isArray(systemsData) ? systemsData : []);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
      
      if (!id || id === 'nova') {
        setFormData(prev => ({ 
          ...prev, 
          companyId: currentCompany?.id || '',
          departmentId: currentDepartment?.id || deptsData[0]?.id || '' 
        }));
      }
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch form dependencies:', err);
      setCollaborators([]);
      setSystems([]);
      setTeams([]);
      setDepartments([]);
      setLoading(false);
    });
  }, [currentCompany, currentDepartment]);

  useEffect(() => {
    if (id && id !== 'nova') {
      setIsEditMode(true);
      fetch(`/api/initiatives/${id}`)
        .then(res => res.json())
        .then(found => {
          if (found) {
            if (!found.history) found.history = [];
            setFormData({
              ...found,
              milestones: found.milestones || []
            });
          }
        })
        .catch(err => console.error('Error fetching initiative:', err));
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const isNew = !isEditMode || id === 'nova';
      const url = isNew ? '/api/initiatives' : `/api/initiatives/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const historyItem: InitiativeHistory = {
        id: `h_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: (user as any)?.fullName || (user as any)?.name || 'Sistema',
        action: isNew ? 'Criação da iniciativa' : 'Edição de informações'
      };

      // Note: Backend might need to handle history merging or the frontend sends the whole object
      const payload = {
        ...formData,
        companyId: currentCompany?.id || '',
        id: isNew ? undefined : formData.id, // Let DB generate ID if new, or use existing
        history: [...(formData.history || []), historyItem]
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save initiative');

      navigate('/iniciativas');
    } catch (error) {
      console.error('Error saving initiative:', error);
      alert('Erro ao salvar iniciativa no servidor.');
    }
  };

  const advanceStatus = () => {
    const statusMap: Record<MilestoneStatus, MilestoneStatus> = {
      '1- Em Avaliação': '2- Em Backlog',
      '2- Em Backlog': '3- Em Planejamento',
      '3- Em Planejamento': '4- Em Execução',
      '4- Em Execução': '5- Entregue',
      '5- Entregue': '5- Entregue',
      'Suspenso': '2- Em Backlog',
      'Cancelado': 'Cancelado'
    };

    if (formData.status === '1- Em Avaliação' && !formData.leaderId) {
      alert('Favor indicar o Gerente Líder antes de avançar.');
      return;
    }
    if (formData.status === '2- Em Backlog' && (!formData.technicalLeadId || formData.impactedSystemIds.length === 0)) {
      alert('Favor indicar o Líder Técnico e o Sistema antes de avançar.');
      return;
    }

    setFormData(prev => ({ ...prev, status: statusMap[prev.status] }));
  };

  const addMilestone = () => {
    const newMilestone: InitiativeMilestone = {
      companyId: currentCompany?.id || '',
      departmentId: formData.departmentId || '',
      id: `m_${Date.now()}`,
      name: '',
      systemId: formData.impactedSystemIds[0] || '',
      baselineDate: ''
    };
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
  };

  const updateMilestone = (mId: string, updates: Partial<InitiativeMilestone>) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => m.id === mId ? { ...m, ...updates } : m)
    }));
  };

  const removeMilestone = (mId: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== mId)
    }));
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div><span>Carregando Formulário...</span></div>;

  return (
    <div className="page-layout" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-glass" onClick={() => navigate('/iniciativas')} type="button">
            <ArrowLeft size={18} />
          </button>
          <h1>{isEditMode ? 'Editar Iniciativa' : 'Nova Iniciativa'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {canAdvanceStatus && isEditMode && (
            <button 
              className="btn" 
              onClick={advanceStatus} 
              type="button" 
              style={{ 
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                color: 'white', 
                border: 'none',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.6rem 1.25rem'
              }}
            >
              <TrendingUp size={18} /> Avançar para Próxima Etapa
            </button>
          )}
        </div>
      </div>

      {isEditMode && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '1.25rem', 
            marginBottom: '1.5rem', 
            background: '#E2E8F0', 
            border: '1px solid var(--glass-border-strong)',
            borderRadius: '12px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
          }}
        >
          {['Fast Track', 'Vulnerabilidade', 'Problema', 'PBI', 'Roadmap Tecnológico'].includes(formData.type) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              {[
                '1- Em Avaliação',
                '2- Em Backlog',
                '3- Em Planejamento',
                '4- Em Execução',
                '5- Entregue'
              ].map((status, index, arr) => {
                const statuses = [
                  '1- Em Avaliação',
                  '2- Em Backlog',
                  '3- Em Planejamento',
                  '4- Em Execução',
                  '5- Entregue'
                ];
                const currentIndex = statuses.indexOf(formData.status);
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isFuture = index > currentIndex;

                let bgColor = '#FFFFFF'; // Future
                let textColor = 'var(--text-tertiary)';
                let borderColor = 'var(--glass-border)';

                if (isCompleted) {
                  bgColor = '#10B981'; // Green (Success)
                  textColor = '#FFFFFF';
                  borderColor = '#059669';
                } else if (isCurrent) {
                  bgColor = 'var(--accent-base)'; // Yellow (Current)
                  textColor = 'var(--accent-text)';
                  borderColor = 'var(--accent-base)';
                }

                return (
                  <React.Fragment key={status}>
                    <div 
                      style={{ 
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: bgColor,
                        color: textColor,
                        border: `1px solid ${borderColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        boxShadow: isCurrent ? '0 0 15px rgba(255, 217, 25, 0.3)' : 'none',
                        opacity: isFuture ? 0.6 : 1
                      }}
                    >
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px', opacity: isCurrent ? 0.7 : 0.9 }}>
                        Etapa {index + 1}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        {status.split('- ')[1]}
                      </span>
                    </div>
                    {index < arr.length - 1 && (
                      <ChevronRight size={20} color="var(--glass-border-strong)" style={{ flexShrink: 0 }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Activity size={20} className="text-secondary" />
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Status Atual</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-base)' }}>{formData.status}</p>
                </div>
              </div>
              <div style={{ height: '30px', width: '1px', background: 'var(--glass-border)' }} />
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6 }}>Responsável pela Etapa</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {formData.status === '1- Em Avaliação' ? 'Head' : 
                   formData.status === '2- Em Backlog' ? 'Gerente Líder' : 
                   'Líder Técnico'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Core Info Card */}
        <section className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={20} className="text-tertiary" /> Informações Gerais
          </h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Título da Iniciativa</label>
              <input 
                required 
                disabled={!canEditGeneral}
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                placeholder="Ex: Expansão FTTH Nordeste"
              />
            </div>
            <div className="form-group">
              <label>Tipo de Demanda</label>
              <select 
                disabled={!canEditGeneral}
                value={formData.type} 
                onChange={e => {
                  const newType = e.target.value as InitiativeType;
                  const simplifiedTypes: InitiativeType[] = ['Fast Track', 'Vulnerabilidade', 'Problema', 'PBI', 'Roadmap Tecnológico'];
                  let updatedMilestones = formData.milestones;
                  let updatedSystems = formData.impactedSystemIds;

                  if (simplifiedTypes.includes(newType)) {
                    // Force 1 system max
                    if (updatedSystems.length > 1) {
                      updatedSystems = [updatedSystems[0]];
                    }
                    
                    // Default 2 milestones
                    updatedMilestones = [
                      { companyId: currentCompany?.id || '', departmentId: formData.departmentId || '', id: `m1_${Date.now()}`, name: 'Desenvolvimento', systemId: updatedSystems[0] || '', baselineDate: '' },
                      { companyId: currentCompany?.id || '', departmentId: formData.departmentId || '', id: `m2_${Date.now()}`, name: 'Implantação', systemId: updatedSystems[0] || '', baselineDate: '' }
                    ];
                  }

                  setFormData({ 
                    ...formData, 
                    type: newType, 
                    milestones: updatedMilestones,
                    impactedSystemIds: updatedSystems
                  });
                }}
              >
                {INITIATIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ background: 'rgba(var(--accent-rgb), 0.05)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
                Departamento: <span style={{ color: 'var(--text-primary)' }}>{departments.find(d => d.id === formData.departmentId)?.name}</span>
              </p>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Diretoria de Origem</label>
              <select 
                disabled={!canEditGeneral}
                value={formData.originDirectorate} 
                onChange={e => setFormData({ ...formData, originDirectorate: e.target.value })}
              >
                <option value="">Selecione a diretoria</option>
                <option value="Comercial FTTH">Comercial FTTH</option>
                <option value="Comercial Atacado/B2B">Comercial Atacado/B2B</option>
                <option value="Operações FTTH">Operações FTTH</option>
                <option value="Operações Atacado/B2B">Operações Atacado/B2B</option>
                <option value="Estratégia">Estratégia</option>
                <option value="Engenharia">Engenharia</option>
              </select>
            </div>
            <div className="form-group">
              <label>Owner / Solicitante (Negócio)</label>
              <input 
                disabled={!canEditGeneral}
                value={formData.customerOwner} 
                onChange={e => setFormData({ ...formData, customerOwner: e.target.value })} 
                placeholder="Nome do solicitante da demanda"
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Benefício / Valor de Negócio</label>
              <textarea 
                disabled={!canEditGeneral}
                value={formData.benefit} 
                onChange={e => setFormData({ ...formData, benefit: e.target.value })} 
                rows={3}
                placeholder="Descreva o retorno esperado (Ex: Redução de 10% no churn...)"
              />
            </div>
            <div className="form-group">
              <label>Escopo Resumido</label>
              <textarea 
                disabled={!canEditGeneral}
                value={formData.scope} 
                onChange={e => setFormData({ ...formData, scope: e.target.value })} 
                rows={3}
                placeholder="Principais entregas e fronteiras do projeto..."
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Tipo de Benefício</label>
              <select
                disabled={!canEditGeneral}
                value={formData.benefitType || ''}
                onChange={e => setFormData({ ...formData, benefitType: e.target.value as BenefitType })}
              >
                <option value="">Selecione o tipo de benefício</option>
                {BENEFIT_TYPES.map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Data Expectativa (Área de Negócio)</label>
              <input 
                disabled={!canEditGeneral}
                type="date"
                value={formData.businessExpectationDate || ''} 
                onChange={e => setFormData({ ...formData, businessExpectationDate: e.target.value })} 
              />
            </div>
          </div>
        </section>

        {/* Impact Card - Show for Evaluation (Stage 1 Edit) or Stage 2+ */}
        {((formData.status === '1- Em Avaliação' && isEditMode) || (formData.status !== '1- Em Avaliação' && formData.status !== 'Cancelado')) && (
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} className="text-tertiary" /> Impacto e Execução
            </h3>
            <div className="grid-2">
              <div className="form-group">
                <label>Gestor Responsável (Líder TI)</label>
                <select 
                  disabled={!canEditImpact}
                  value={formData.leaderId || ''} 
                  onChange={e => setFormData({ ...formData, leaderId: e.target.value })}
                >
                  <option value="">Selecione o gestor</option>
                  {collaborators.filter(c => c.role === 'Manager' || c.role === 'Director' || c.role === 'Head').map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {formData.status !== '1- Em Avaliação' && (
                <div className="form-group">
                  <label>Líder Técnico</label>
                  <select 
                    disabled={!canEditImpact}
                    value={formData.technicalLeadId} 
                    onChange={e => setFormData({ ...formData, technicalLeadId: e.target.value })}
                  >
                    <option value="">Selecione o líder técnico</option>
                    {(() => {
                      const manager = collaborators.find(c => c.id === formData.leaderId);
                      if (!manager) return collaborators.filter(c => c.role === 'Lead Engineer').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ));
                      
                      const getSubTeamIds = (parentID: string): string[] => {
                        const children = teams.filter(t => t.parentTeamId === parentID);
                        return [parentID, ...children.flatMap(cx => getSubTeamIds(cx.id))];
                      };
                      
                      const managerTeamId = manager.squadId || '';
                      const relevantTeamIds = getSubTeamIds(managerTeamId);
                      
                      return collaborators.filter(c => 
                        c.role === 'Lead Engineer' && 
                        relevantTeamIds.includes(c.squadId || '')
                      ).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ));
                    })()}
                  </select>
                </div>
              )}
            </div>

            {formData.status !== '1- Em Avaliação' && (
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Sistemas Impactados</label>
                <div className={`multi-select-box glass-panel ${['Fast Track', 'Vulnerabilidade', 'Problema', 'PBI', 'Roadmap Tecnológico'].includes(formData.type) ? 'simplified-mode' : ''}`}>
                  {[...systems].sort((a, b) => a.name.localeCompare(b.name)).map(sys => {
                    const isSimpl = ['Fast Track', 'Vulnerabilidade', 'Problema', 'PBI', 'Roadmap Tecnológico'].includes(formData.type);
                    const isChecked = formData.impactedSystemIds.includes(sys.id);
                    const isDisabled = !canEditImpact || (isSimpl && !isChecked && formData.impactedSystemIds.length >= 1);
                    
                    return (
                      <label key={sys.id} className={`checkbox-item ${isDisabled ? 'disabled' : ''} ${isChecked ? 'selected' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={e => {
                            const ids = formData.impactedSystemIds;
                            let newIds = ids;
                            if (e.target.checked) {
                              newIds = isSimpl ? [sys.id] : [...ids, sys.id];
                            } else {
                              newIds = ids.filter(id => id !== sys.id);
                            }
                            
                            const updatedMilestones = (formData.milestones || []).map(m => ({
                              ...m,
                              systemId: newIds[0] || ''
                            }));

                            setFormData({ 
                              ...formData, 
                              impactedSystemIds: newIds,
                              milestones: updatedMilestones
                            });
                          }}
                        />
                        <span className="text-secondary">{sys.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Milestones Card - Show for Stage 3+ */}
        {!['1- Em Avaliação', '2- Em Backlog'].includes(formData.status) && (
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Layers size={20} className="text-tertiary" /> Cronograma e Milestones
              </h3>
              {!isSimplType && canEditMilestones && (
                <button type="button" className="btn btn-glass btn-small" onClick={addMilestone}>
                  <Plus size={16} /> Adicionar Marco
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(formData.milestones || []).map((m) => {
                const isDevMilestone = m.name === 'Desenvolvimento';
                
                return (
                  <div key={m.id} className="milestone-form-card glass-panel-interactive">
                    <div className={`milestone-grid ${isSimplType ? 'simplified' : ''} ${isDevMilestone && isSimplType ? 'has-engineer' : ''}`}>
                      <div className="form-group">
                        <label>Título do Marco</label>
                        <input 
                          disabled={!canEditMilestones}
                          value={m.name} 
                          onChange={e => updateMilestone(m.id, { name: e.target.value })}
                          placeholder="Ex: Entrega MVP, Go-Live..."
                          readOnly={isSimplType}
                          style={isSimplType ? { opacity: 0.8, color: 'var(--accent-base)', fontWeight: 600, border: 'none', background: 'rgba(0,0,0,0.02)' } : {}}
                        />
                      </div>
                      
                      {!isSimplType && (
                        <div className="form-group">
                          <label>Sistema</label>
                          <select 
                            disabled={!canEditMilestones}
                            value={m.systemId} 
                            onChange={e => updateMilestone(m.id, { systemId: e.target.value })}
                          >
                            <option value="">Ref. Sistema</option>
                            {systems.filter(s => formData.impactedSystemIds.includes(s.id)).map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {isDevMilestone && isSimplType && (
                        <div className="form-group">
                          <label>Engenheiro Alocado</label>
                          <select 
                            disabled={!canEditMilestones}
                            value={m.assignedEngineerId || ''} 
                            onChange={e => updateMilestone(m.id, { assignedEngineerId: e.target.value })}
                          >
                            <option value="">Selecione...</option>
                            {collaborators.filter(c => c.role === 'Engineer/Analyst' || c.role === 'Lead Engineer').map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="form-group">
                        <label>{isSimplType ? 'Início' : 'Baseline'}</label>
                        <input 
                          disabled={!canEditMilestones}
                          type="date" 
                          value={m.startDate || m.baselineDate || ''} 
                          onChange={e => updateMilestone(m.id, isSimplType ? { startDate: e.target.value } : { baselineDate: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>{isSimplType ? 'Fim (Entrega)' : 'Real'}</label>
                        <input 
                          disabled={!canEditMilestones}
                          type="date" 
                          value={m.baselineDate} 
                          onChange={e => updateMilestone(m.id, { baselineDate: e.target.value })}
                        />
                      </div>

                      {!isSimplType && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '0.5rem' }}>
                          <button type="button" className="btn-icon" onClick={() => removeMilestone(m.id)} style={{ color: 'var(--status-red)', opacity: !canEditMilestones ? 0.3 : 1 }} disabled={!canEditMilestones}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {formData.milestones.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--glass-border)', borderRadius: '12px', color: 'var(--text-tertiary)' }}>
                  Nenhum milestone definido para esta iniciativa.
                </div>
              )}
            </div>
          </section>
        )}

        <div className="form-actions" style={{ marginBottom: '4rem' }}>
          <button type="button" className="btn btn-glass" onClick={() => navigate('/iniciativas')} style={{ flex: 1 }}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
            <Save size={18} /> {isEditMode ? 'Atualizar Iniciativa' : 'Criar Iniciativa'}
          </button>
        </div>
      </form>

      <style>{`
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem 2.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .form-group label {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.2rem;
        }

        @media (max-width: 800px) {
          .grid-2 { grid-template-columns: 1fr; gap: 1.75rem; }
        }

        .multi-select-box {
          min-height: 100px;
          max-height: 300px;
          overflow-y: auto;
          padding: 1.25rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.8rem 1.5rem;
          background: rgba(0,0,0,0.2) !important;
        }
        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        .checkbox-item:hover { color: var(--accent-base); }
        .checkbox-item.selected { 
          color: #000000 !important; 
          font-weight: 800;
          text-shadow: 0 0 1px rgba(0,0,0,0.3);
        }
        .checkbox-item input { width: auto !important; margin: 0; }
        
        .milestone-form-card {
          padding: 1.5rem;
          background: rgba(255,255,255,0.03) !important;
          border-left: 4px solid var(--accent-base);
        }
        .milestone-grid {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.2fr 1.2fr 40px;
          gap: 1.25rem;
        }
        .milestone-grid.simplified {
          grid-template-columns: 2fr 1.2fr 1.2fr;
        }
        .milestone-grid.simplified.has-engineer {
          grid-template-columns: 2fr 1.5fr 1.2fr 1.2fr;
        }
        .checkbox-item.disabled {
          opacity: 0.3;
          cursor: not-allowed;
          pointer-events: none;
        }
        @media (max-width: 900px) {
          .milestone-grid, .milestone-grid.simplified, .milestone-grid.simplified.has-engineer { 
            grid-template-columns: 1fr; 
          }
        }
      `}</style>
    </div>
  );
};

export default InitiativeForm;
