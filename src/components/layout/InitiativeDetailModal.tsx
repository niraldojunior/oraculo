import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  User, 
  Building2, 
  Calendar, 
  Database,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  History,
  FileText,
  Target,
  Edit2,
  Save
} from 'lucide-react';
import type { Initiative, Collaborator, System, MilestoneStatus, InitiativeType, BenefitType, Team } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface InitiativeDetailModalProps {
  initiative: Initiative;
  allCollaborators: Collaborator[];
  allSystems: System[];
  allTeams: Team[];
  onClose: () => void;
  onUpdateStatus?: (newStatus: MilestoneStatus) => void;
  onSave?: (updated: Initiative) => Promise<void>;
}

const fixEncoding = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/‡Æ/g, 'çã')
    .replace(/‡ä/g, 'çõ')
    .replace(/‡/g, 'ç')
    .replace(/Æ/g, 'ã')
    .replace(/€Ç/g, 'ÇÃO')
    .replace(/ÇO/g, 'ÃO')
    .replace(/€/g, 'Ç')
    .replace(/¡/g, 'í')
    .replace(/µ/g, 'Á')
    .replace(/à/g, 'ó')
    .replace(/¢/g, 'ó')
    .replace(/ˆ/g, 'ê')
    .replace(/ƒ/g, 'â')
    .replace(/‚/g, 'é')
    .replace(/ä/g, 'õ')
    .replace(/Ç /g, 'ã ');
};

const InitiativeDetailModal: React.FC<InitiativeDetailModalProps> = ({ 
  initiative, 
  allCollaborators, 
  allSystems, 
  allTeams,
  onClose,
  onUpdateStatus,
  onSave
}) => {
  useEscapeKey(onClose);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Initiative>({ ...initiative });
  const [isSaving, setIsSaving] = useState(false);

  const manager = allCollaborators.find(c => c.id === formData.leaderId);
  const techLead = allCollaborators.find(c => c.id === formData.technicalLeadId);
  const impactedSystems = allSystems.filter(s => formData.impactedSystemIds?.includes(s.id));

  const statusOptions: MilestoneStatus[] = [
    '1- Em Avaliação',
    '2- Em Backlog',
    '3- Em Planejamento',
    '4- Em Execução',
    '5- Entregue',
    'Suspenso',
    'Cancelado'
  ];

  const typeOptions: InitiativeType[] = [
    'Estratégico',
    'Projeto',
    'Fast Track',
    'Vulnerabilidade',
    'Problema',
    'PBI',
    'Roadmap Tecnológico'
  ];

  const benefitTypeOptions: BenefitType[] = [
    'Aumento Receita',
    'Redução Custos',
    'Risco Continuidade',
    'Regulatório'
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '1- Em Avaliação': return <AlertCircle size={18} className="text-secondary" />;
      case '2- Em Backlog': return <Clock size={18} className="text-secondary" />;
      case '3- Em Planejamento': return <Layers size={18} className="text-secondary" />;
      case '4- Em Execução': return <Activity size={18} className="text-secondary" />;
      case '5- Entregue': return <CheckCircle2 size={18} style={{ color: 'var(--status-green)' }} />;
      default: return <AlertCircle size={18} />;
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving initiative:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSystem = (sysId: string) => {
    const current = new Set(formData.impactedSystemIds || []);
    if (current.has(sysId)) current.delete(sysId);
    else current.add(sysId);
    setFormData({ ...formData, impactedSystemIds: Array.from(current) });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ 
        maxWidth: '960px', 
        width: '95%', 
        background: 'white',
        padding: '0',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '96vh'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '1.25rem 2rem', 
          background: 'var(--bg-app)', 
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px', 
              background: 'var(--accent-base)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Layers size={24} color="#000" />
            </div>
            <div style={{ flex: 1 }}>
              {isEditing ? (
                <input 
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 800, 
                    border: '1px solid var(--accent-base)', 
                    borderRadius: '4px',
                    width: '100%',
                    padding: '0.25rem 0.5rem',
                    background: 'white',
                    outline: 'none'
                  }}
                  autoFocus
                />
              ) : (
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  {fixEncoding(formData.title)}
                </h2>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                {isEditing ? (
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as InitiativeType })}
                    style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--glass-border-strong)' }}
                  >
                    {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <span className="badge badge-dark" style={{ fontSize: '0.65rem' }}>{formData.type}</span>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {getStatusIcon(formData.status)}
                  {formData.status}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!isEditing ? (
              <button 
                className="btn btn-glass" 
                onClick={() => setIsEditing(true)}
                style={{ height: '36px', padding: '0 1rem' }}
              >
                <Edit2 size={16} /> Editar
              </button>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={isSaving}
                style={{ height: '36px', padding: '0 1.5rem' }}
              >
                {isSaving ? 'Salvando...' : <><Save size={16} /> Salvar</>}
              </button>
            )}
            <button onClick={onClose} className="btn-icon" style={{ background: 'white', border: '1px solid var(--glass-border)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '3rem' }}>
            
            {/* Left Column: Core Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={14} /> Origem e Responsáveis
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="info-item">
                    <label>Diretoria de Origem</label>
                    {isEditing ? (
                      <input className="edit-input" value={formData.originDirectorate || ''} onChange={e => setFormData({ ...formData, originDirectorate: e.target.value })} />
                    ) : (
                      <div className="value-box">{formData.originDirectorate || 'Não informada'}</div>
                    )}
                  </div>

                  <div className="info-item">
                    <label>Business Owner / Solicitante</label>
                    {isEditing ? (
                      <input className="edit-input" value={formData.customerOwner || ''} onChange={e => setFormData({ ...formData, customerOwner: e.target.value })} />
                    ) : (
                      <div className="value-box">{formData.customerOwner || 'Não informado'}</div>
                    )}
                  </div>

                  <div className="info-item">
                    <label>Gerente da Iniciativa</label>
                    {isEditing ? (
                      <div style={{ position: 'relative', marginTop: '0.4rem' }}>
                        <select 
                          className="edit-input" 
                          value={formData.leaderId} 
                          onChange={e => {
                            const newLeaderId = e.target.value;
                            // Clear technical lead if changing manager to a new one
                            setFormData({ ...formData, leaderId: newLeaderId, technicalLeadId: '' });
                          }}
                        >
                          <option value="">Selecione um gerente</option>
                          {allCollaborators.filter(c => c.role === 'Manager').map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                        {manager?.photoUrl ? (
                          <img src={manager.photoUrl} alt={manager.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar-small" style={{ width: 28, height: 28 }}><User size={12} /></div>
                        )}
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{manager?.name || 'Não atribuído'}</span>
                      </div>
                    )}
                  </div>

                  <div className="info-item">
                    <label>Líder Técnico</label>
                    {isEditing ? (
                      <select 
                        className="edit-input" 
                        value={formData.technicalLeadId || ''} 
                        onChange={e => setFormData({ ...formData, technicalLeadId: e.target.value })}
                        disabled={!formData.leaderId}
                      >
                        <option value="">{formData.leaderId ? 'Selecione um líder técnico' : 'Selecione um gerente primeiro'}</option>
                        {(() => {
                          if (!formData.leaderId) return [];
                          
                          // 1. Find manager's teams (where they are leader)
                          const managerTeams = allTeams.filter(t => t.leaderId === formData.leaderId);
                          if (managerTeams.length === 0) return [];

                          // 2. Find all sub-teams (recursively)
                          const getSubTeamIds = (parentId: string): string[] => {
                            const directSubs = allTeams.filter(t => t.parentTeamId === parentId);
                            return [parentId, ...directSubs.flatMap(s => getSubTeamIds(s.id))];
                          };

                          const allManagedTeamIds = managerTeams.flatMap(mt => getSubTeamIds(mt.id));

                          // 3. Find lead engineers in those teams
                          return allCollaborators.filter(c => 
                            c.role === 'Lead Engineer' && 
                            c.squadId && 
                            allManagedTeamIds.includes(c.squadId)
                          );
                        })().map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                        {techLead?.photoUrl ? (
                          <img src={techLead.photoUrl} alt={techLead.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div className="avatar-small" style={{ width: 28, height: 28 }}><User size={12} /></div>
                        )}
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{techLead?.name || 'Não atribuído'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} /> Prazos e Status
                </h3>
                <div className="info-item">
                  <label>Expectativa de Entrega</label>
                  {isEditing ? (
                    <input 
                      type="date"
                      className="edit-input" 
                      value={formData.businessExpectationDate || ''} 
                      onChange={e => setFormData({ ...formData, businessExpectationDate: e.target.value })} 
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                      <Calendar size={18} className="text-tertiary" />
                      {formData.businessExpectationDate || 'TBD'}
                    </div>
                  )}
                </div>
                
                <div className="info-item" style={{ marginTop: '1.25rem' }}>
                  <label>Status Atual</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => {
                      const newStatus = e.target.value as MilestoneStatus;
                      setFormData({ ...formData, status: newStatus });
                      if (!isEditing && onUpdateStatus) onUpdateStatus(newStatus);
                    }}
                    style={{ 
                      width: '100%', 
                      marginTop: '0.5rem',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border-strong)',
                      background: 'var(--bg-app)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {statusOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </section>
            </div>

            {/* Right Column: Values & Impact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={14} /> Valor de Negócio
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="info-item">
                    <label>Tipo de Benefício</label>
                    {isEditing ? (
                      <select 
                        className="edit-input" 
                        value={formData.benefitType || ''} 
                        onChange={e => setFormData({ ...formData, benefitType: e.target.value as BenefitType })}
                      >
                        <option value="">Não definido</option>
                        {benefitTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <div className="badge badge-accent" style={{ marginTop: '0.4rem', fontSize: '0.7rem' }}>{formData.benefitType || 'Não definido'}</div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>Descrição do Benefício</label>
                    {isEditing ? (
                      <textarea 
                        className="edit-textarea" 
                        value={formData.benefit} 
                        onChange={e => setFormData({ ...formData, benefit: e.target.value })} 
                        rows={3}
                      />
                    ) : (
                      <div className="description-box">{fixEncoding(formData.benefit)}</div>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={14} /> Escopo
                </h3>
                {isEditing ? (
                  <textarea 
                    className="edit-textarea" 
                    value={formData.scope} 
                    onChange={e => setFormData({ ...formData, scope: e.target.value })} 
                    rows={4}
                  />
                ) : (
                  <div className="description-box" style={{ minHeight: '80px' }}>{fixEncoding(formData.scope)}</div>
                )}
              </section>

              <section>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={14} /> Sistemas Impactados
                </h3>
                {isEditing ? (
                  <div style={{ 
                    maxHeight: '150px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--glass-border-strong)', 
                    borderRadius: '8px', 
                    padding: '0.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '0.4rem'
                  }}>
                    {allSystems.map(sys => (
                      <label key={sys.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.impactedSystemIds?.includes(sys.id)} 
                          onChange={() => toggleSystem(sys.id)} 
                        />
                        {sys.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {impactedSystems.map(sys => (
                      <span key={sys.id} className="badge" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                        {sys.name}
                      </span>
                    ))}
                    {impactedSystems.length === 0 && (
                      <div className="text-secondary" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Nenhum sistema mapeado.</div>
                    )}
                  </div>
                )}
              </section>

              {!isEditing && formData.history && formData.history.length > 0 && (
                <section>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={14} /> Última Atualização
                  </h3>
                  <div style={{ fontSize: '0.8rem', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>
                      {formData.history[formData.history.length - 1].action}
                    </div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                      Por {formData.history[formData.history.length - 1].user} em {new Date(formData.history[formData.history.length - 1].timestamp).toLocaleString()}
                    </div>
                  </div>
                </section>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1rem 2rem', 
          background: 'var(--bg-app)', 
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          {isEditing ? (
            <>
              <button className="btn btn-glass" onClick={() => { setFormData({...initiative}); setIsEditing(false); }} style={{ fontSize: '0.85rem' }}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving} style={{ fontSize: '0.85rem' }}>
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-glass" onClick={onClose} style={{ fontSize: '0.85rem' }}>Fechar</button>
              <button className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }} onClick={() => window.location.href = `/iniciativas/${formData.id}`}>
                Acesso Completo
              </button>
            </>
          )}
        </div>

        <style>{`
          .info-item label { 
            font-size: 0.7rem; 
            font-weight: 700; 
            color: var(--text-tertiary); 
            text-transform: uppercase; 
            letter-spacing: 0.02em;
          }
          .value-box {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-top: 0.2rem;
          }
          .description-box {
            font-size: 0.85rem;
            line-height: 1.6;
            color: var(--text-secondary);
            background: #F8FAFC;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            border: 1px solid #E2E8F0;
          }
          .edit-input {
            width: 100%;
            margin-top: 0.35rem;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            border: 1px solid var(--glass-border-strong);
            background: white;
            font-size: 0.85rem;
            font-weight: 500;
            outline: none;
            transition: border-color 0.2s;
          }
          .edit-input:focus {
            border-color: var(--accent-base);
          }
          .edit-textarea {
            width: 100%;
            margin-top: 0.35rem;
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid var(--glass-border-strong);
            background: white;
            font-size: 0.85rem;
            line-height: 1.5;
            font-family: inherit;
            outline: none;
            resize: vertical;
          }
          .edit-textarea:focus {
            border-color: var(--accent-base);
          }
        `}</style>
      </div>
    </div>
  );
};

export default InitiativeDetailModal;
