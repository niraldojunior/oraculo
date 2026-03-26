import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DOMAIN_HIERARCHY, VENDOR_LOGOS } from '../data/mockDb';
import { 
  ArrowLeft, Edit2, Trash2, Server, ShieldAlert, 
  Users, User, Code, Info, X, Building2, Skull
} from 'lucide-react';
import type { System, Team, Collaborator, SLA, Vendor, SystemContextFile } from '../types';

const SystemModal: React.FC<{
  system: System | Partial<System>;
  allTeams: Team[];
  allCollaborators: Collaborator[];
  allVendors: Vendor[];
  onClose: () => void;
  onSave: (updated: System) => void;
  onDelete?: (id: string) => void;
  isDeletingInitial?: boolean;
  canManageEntities: boolean;
}> = ({ system, allTeams, allCollaborators, allVendors, onClose, onSave, onDelete, isDeletingInitial, canManageEntities }) => {
  const [formData, setFormData] = useState({
    name: system.name || '',
    platformName: system.platformName || '',
    domain: system.domain || 'Fulfillment & Assurance',
    subDomain: system.subDomain || 'Ordem Serviço',
    platformCategory: system.platformCategory || 'Plataforma Serviços',
    criticality: system.criticality || 'Tier 3',
    lifecycleStatus: system.lifecycleStatus || 'Ativo Greenfield',
    techStack: (system.techStack || []).join(', '),
    ownerTeamId: system.ownerTeamId || '',
    smeId: system.smeId || '',
    vendorId: system.vendorId || '',
    description: system.description || '',
    repoUrl: system.repoUrl || '',
    environments: {
      dev: system.environments?.dev || '',
      ti: system.environments?.ti || '',
      hml: system.environments?.hml || '',
      prd: system.environments?.prd || ''
    }
  });
  const [contextFiles, setContextFiles] = useState<SystemContextFile[]>(system.contextFiles || []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setContextFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          dataUrl: ev.target?.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(isDeletingInitial || false);

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={{ maxWidth: '1100px', width: '95%' }}>
        <button onClick={onClose} className="btn-close"><X size={20} /></button>
        <h2 className="modal-title">{showDeleteConfirm ? <Trash2 size={20} /> : <Edit2 size={20} />} {showDeleteConfirm ? 'Excluir Ativo' : 'Editar Detalhes'}</h2>

        {!showDeleteConfirm ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            onSave({
              ...(system as System),
              ...formData,
              id: system.id || `s_${Date.now()}`,
              techStack: formData.techStack.split(',').map(s => s.trim()).filter(Boolean),
              repoUrl: formData.repoUrl || undefined,
              contextFiles: contextFiles.length > 0 ? contextFiles : undefined
            } as System);
          }} className="form-container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
              {/* Coluna 1: Informações Gerais */}
              <div className="form-container">
                <div className="grid-2">
                  <div className="form-group">
                    <label>Nome Fantasia</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Nome Plataforma</label>
                    <input value={formData.platformName} onChange={e => setFormData({ ...formData, platformName: e.target.value })} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Criticidade</label>
                    <select value={formData.criticality} onChange={e => setFormData({ ...formData, criticality: e.target.value as SLA })}>
                      <option value="Tier 1">Tier 1 (Crítico)</option>
                      <option value="Tier 2">Tier 2 (Importante)</option>
                      <option value="Tier 3">Tier 3 (Normal)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status Ciclo de Vida</label>
                    <select value={formData.lifecycleStatus} onChange={e => setFormData({ ...formData, lifecycleStatus: e.target.value as any })}>
                      <option value="Ativo Greenfield">Ativo Greenfield</option>
                      <option value="Fim de Vida (Freezing)">Fim de Vida (Freezing)</option>
                      <option value="Planejado">Planejado</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Domínio</label>
                    <select 
                      value={formData.domain} 
                      onChange={e => {
                        const newDomain = e.target.value;
                        const firstSub = DOMAIN_HIERARCHY[newDomain]?.[0] || '';
                        setFormData({ ...formData, domain: newDomain, subDomain: firstSub });
                      }}
                    >
                      {Object.keys(DOMAIN_HIERARCHY).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subdomínio (Categoria)</label>
                    <select 
                      value={formData.subDomain} 
                      onChange={e => setFormData({ ...formData, subDomain: e.target.value })}
                    >
                      {(DOMAIN_HIERARCHY[formData.domain] || []).map(sd => (
                        <option key={sd} value={sd}>{sd}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Categoria de Plataforma</label>
                    <select value={formData.platformCategory} onChange={e => setFormData({ ...formData, platformCategory: e.target.value })}>
                      {['Dados/IA', 'Middleware', 'Plataforma Negócio', 'Plataforma Serviços', 'Mobile', 'Portais', 'Engenharia'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fornecedor</label>
                    <select value={formData.vendorId} onChange={e => setFormData({ ...formData, vendorId: e.target.value })}>
                      <option value="">Sem fornecedor</option>
                      {allVendors.map(v => (
                        <option key={v.id} value={v.id}>{v.companyName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição / Finalidade</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    rows={6} 
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>

              {/* Coluna 2: Governança e Detalhes Técnicos */}
              <div className="form-container">
                <div className="grid-2">
                  <div className="form-group">
                    <label>Custódia (Time)</label>
                    <select value={formData.ownerTeamId} onChange={e => setFormData({ ...formData, ownerTeamId: e.target.value, smeId: '' })}>
                      <option value="">Sem equipe</option>
                      {allTeams.filter(t => t.type === 'Lideranca').map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>SME (Pessoa)</label>
                    <select value={formData.smeId} onChange={e => setFormData({ ...formData, smeId: e.target.value })}>
                      <option value="">Sem SME</option>
                      {allCollaborators
                        .filter(c => !formData.ownerTeamId || c.squadId === formData.ownerTeamId)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Stack Tecnológica (separada por vírgula)</label>
                  <input value={formData.techStack} onChange={e => setFormData({ ...formData, techStack: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>🔗 Repositório de Código (GitHub / Azure DevOps)</label>
                  <input 
                    type="url"
                    placeholder="https://github.com/org/repo ou https://dev.azure.com/..."
                    value={formData.repoUrl} 
                    onChange={e => setFormData({ ...formData, repoUrl: e.target.value })} 
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <h3 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--accent-base)' }}>🌐 Endpoints e Ambientes</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>DEV</label>
                      <input style={{ padding: '0.5rem' }} placeholder="Ex: https://dev-api..." value={formData.environments.dev} onChange={e => setFormData({ ...formData, environments: { ...formData.environments, dev: e.target.value } })} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>TI</label>
                      <input style={{ padding: '0.5rem' }} placeholder="Ex: https://ti-api..." value={formData.environments.ti} onChange={e => setFormData({ ...formData, environments: { ...formData.environments, ti: e.target.value } })} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>HML</label>
                      <input style={{ padding: '0.5rem' }} placeholder="Ex: https://hml-api..." value={formData.environments.hml} onChange={e => setFormData({ ...formData, environments: { ...formData.environments, hml: e.target.value } })} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>PRD</label>
                      <input style={{ padding: '0.5rem' }} placeholder="Ex: https://api..." value={formData.environments.prd} onChange={e => setFormData({ ...formData, environments: { ...formData.environments, prd: e.target.value } })} />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>📎 Arquivos de Contexto</label>
                  <input type="file" multiple onChange={handleFileUpload} style={{ fontSize: '0.85rem' }} />
                  {contextFiles.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {contextFiles.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                          {f.name}
                          <button type="button" onClick={() => setContextFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {canManageEntities && (
                  <div className="form-actions" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    {onDelete && (
                      <button type="button" className="btn btn-danger-dim" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={18} /></button>
                    )}
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar Alterações</button>
                  </div>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="confirm-delete">
            <Trash2 size={48} color="var(--status-red)" />
            <h3>Excluir Ativo?</h3>
            <p>O registro deste sistema será removido permanentemente do inventário.</p>
            <div className="form-actions-stack">
              <button onClick={() => system.id && onDelete!(system.id)} className="btn btn-danger">Sim, Remover Registro</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-glass">Cancelar</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .modal-content {
          padding: 2.5rem !important;
          overflow-y: auto;
          max-height: 90vh;
        }
        .grid-2 { 
          display: grid; 
          grid-template-columns: repeat(2, minmax(0, 1fr)); 
          gap: 1.5rem; 
          width: 100%;
        }
        .form-group {
          margin-bottom: 1rem;
          width: 100%;
          min-width: 0;
        }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          box-sizing: border-box;
          font-size: 0.95rem;
        }
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

const InventoryDetail: React.FC = () => {
  const { canManageEntities } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [system, setSystem] = useState<System | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [teams, setTeams] = useState<Team[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sysRes, teamsRes, collabsRes, vendorsRes] = await Promise.all([
          fetch(`/api/systems/${id}`),
          fetch('/api/teams'),
          fetch('/api/collaborators'),
          fetch('/api/vendors')
        ]);

        if (sysRes.ok) {
          const sysData = await sysRes.json();
          setSystem(sysData);
        }

        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(Array.isArray(teamsData) ? teamsData : []);
        }

        if (collabsRes.ok) {
          const collabsData = await collabsRes.json();
          setCollaborators(Array.isArray(collabsData) ? collabsData : []);
        }

        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json();
          setVendors(Array.isArray(vendorsData) ? vendorsData : []);
        }

      } catch (err) {
        console.error('Failed to fetch detail data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSave = async (updated: System) => {
    if (!system) return;
    
    try {
      const res = await fetch(`/api/systems/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      
      if (!res.ok) {
        let errorMsg = 'Failed to update system in database';
        try {
          const text = await res.text();
          const errorData = JSON.parse(text);
          errorMsg = errorData.details || errorData.error || errorMsg;
        } catch (e) {
          console.error('Non-JSON error from server');
        }
        throw new Error(errorMsg);
      }
      
      setSystem(updated);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving system:', err);
      alert(err.message || 'Erro ao salvar no banco de dados. A alteração pode não ser persistente.');
    }
  };

  const handleDelete = async () => {
    if (!system) return;
    
    try {
      const res = await fetch(`/api/systems/${system.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete system from database');

      navigate('/inventario');
    } catch (err) {
      console.error('Error deleting system:', err);
      alert('Erro ao excluir do banco de dados.');
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <span>Carregando Detalhes do Sistema...</span>
      </div>
    );
  }

  if (!system) {
    return (
      <div className="page-layout flex-center" style={{ height: '60vh', flexDirection: 'column' }}>
        <ShieldAlert size={48} color="var(--status-red)" style={{ marginBottom: '1rem' }} />
        <h2>Sistema não encontrado</h2>
        <button className="btn btn-glass" onClick={() => navigate('/inventario')} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={18} /> Voltar ao Inventário
        </button>
      </div>
    );
  }

  const ownerTeam = teams.find(t => t.id === system.ownerTeamId);
  const sme = collaborators.find(c => c.id === system.smeId);
  const vendor = vendors.find(v => v.id === system.vendorId);

  const GovernanceField = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
        {icon} {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="page-layout">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <button className="btn btn-glass" onClick={() => navigate('/inventario')}>
          <ArrowLeft size={18} /> Voltar
        </button>
        {canManageEntities && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-glass" onClick={() => setIsEditing(true)}>
              <Edit2 size={18} /> Editar
            </button>
            <button className="btn btn-danger-dim" onClick={() => setIsDeleting(true)}>
               <Trash2 size={18} /> Excluir
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Header + Description + Tech Stack side by side */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="icon-badge" style={{ background: 'var(--accent-gradient)', color: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                <Server size={28} />
              </div>
              <div>
                <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>{system.name}</h1>
                {system.platformName && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{system.platformName}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className="badge" style={{ 
                    borderColor: system.lifecycleStatus === 'Fim de Vida (Freezing)' ? 'var(--status-red)' : 'var(--status-green)',
                    color: system.lifecycleStatus === 'Fim de Vida (Freezing)' ? 'var(--status-red)' : 'var(--status-green)',
                    textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem'
                  }}>
                    {system.lifecycleStatus === 'Fim de Vida (Freezing)' && <Skull size={12} />}
                    {system.lifecycleStatus}
                  </span>
                  <span className="badge badge-dark" style={{ textTransform: 'uppercase' }}>{system.domain}</span>
                  {system.subDomain && <span className="badge" style={{ color: 'var(--text-secondary)', borderColor: 'rgba(255,255,255,0.15)' }}>{system.subDomain}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>DESCRIÇÃO</div>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>
                  {system.description || 'Nenhuma descrição detalhada disponível para este sistema.'}
                </p>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Code size={13} /> STACK TECNOLÓGICA
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(system.techStack || []).map(tech => (
                    <div key={tech} className="tech-pill glass-panel" style={{ padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)', fontWeight: 500, fontSize: '0.85rem' }}>
                      {tech}
                    </div>
                  ))}
                  {(!system.techStack || system.techStack.length === 0) && <span className="text-tertiary">Nenhuma tecnologia registrada.</span>}
                </div>
              </div>
            </div>
          </section>

          {/* Repo & Context Files */}
          {(system.repoUrl || (system.contextFiles && system.contextFiles.length > 0)) && (
            <section className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1rem' }}>
                📁 Repositório &amp; Contexto
              </h3>
              {system.repoUrl && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>🔗 CÓDIGO FONTE</div>
                  <a href={system.repoUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-light)', wordBreak: 'break-all', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                      {system.repoUrl.includes('azure') ? 'AZURE' : 'GITHUB'}
                    </span>
                    {system.repoUrl}
                  </a>
                </div>
              )}
              {system.contextFiles && system.contextFiles.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>📎 ARQUIVOS</div>
                  {system.contextFiles.some(f => f.type.startsWith('image/')) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                      {system.contextFiles.filter(f => f.type.startsWith('image/')).map((f, i) => (
                        <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={f.dataUrl} alt={f.name} style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                          <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)' }}>{f.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {system.contextFiles.filter(f => !f.type.startsWith('image/')).map((f, i) => (
                    <a key={i} href={f.dataUrl} download={f.name}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-light)', fontSize: '0.9rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
                      📄 {f.name}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Environment Endpoints */}
          {system.environments && (Object.values(system.environments).some(v => v)) && (
            <section className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1rem' }}>
                🌐 Endpoints por Ambiente
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {['dev', 'ti', 'hml', 'prd'].map(env => {
                  const url = system.environments?.[env as keyof typeof system.environments];
                  if (!url) return null;
                  return (
                    <div key={env} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: env === 'prd' ? 'var(--status-green)' : 'var(--accent-base)' }}></div>
                        {env}
                      </div>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontSize: '0.9rem', wordBreak: 'break-all', fontWeight: 500 }}>
                        {url}
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Governance Sidebar */}
        <div>
          <section className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Governança e Apoio
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              
              <GovernanceField icon={<Users size={13} />} label="Custódia (Time)">
                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{ownerTeam?.name || 'Não atribuído'}</div>
              </GovernanceField>

              <GovernanceField icon={<User size={13} />} label="SME">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sme?.photoUrl ? (
                    <img src={sme.photoUrl} alt={sme.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={14} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{sme?.name || 'Não atribuído'}</div>
                    {sme?.role && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{sme.role}</div>}
                  </div>
                </div>
              </GovernanceField>

              <GovernanceField icon={<Building2 size={13} />} label="Fornecedor">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {(vendor?.logoUrl || (vendor && VENDOR_LOGOS[vendor.id])) ? (
                    <div style={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '4px', 
                      background: '#FFFFFF', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      padding: '2px',
                      border: '1px solid var(--glass-border)',
                      flexShrink: 0
                    }}>
                      <img 
                        src={vendor.logoUrl || VENDOR_LOGOS[vendor.id] || ''} 
                        alt={vendor.companyName} 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={14} color="var(--text-tertiary)" />
                    </div>
                  )}
                  <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{vendor?.companyName || 'Interno'}</div>
                </div>
              </GovernanceField>

              <GovernanceField icon={<ShieldAlert size={13} />} label="Criticidade">
                <span className={`badge ${system.criticality === 'Tier 1' ? 'badge-red' : system.criticality === 'Tier 2' ? 'badge-amber' : ''}`}
                  style={{ fontSize: '0.85rem', padding: '0.25rem 0.65rem', fontWeight: 700 }}>
                  {system.criticality}
                </span>
              </GovernanceField>

              <GovernanceField icon={<Info size={13} />} label="Domínio">
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{system.domain}</div>
              </GovernanceField>

              <GovernanceField icon={<Info size={13} />} label="Subdomínio">
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{system.subDomain || '—'}</div>
              </GovernanceField>

              <GovernanceField icon={<Server size={13} />} label="Plataforma">
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{system.platformCategory || '—'}</div>
              </GovernanceField>

              <GovernanceField icon={<Info size={13} />} label="Ciclo de Vida">
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: system.lifecycleStatus === 'Fim de Vida (Freezing)' ? 'var(--status-red)' : 'var(--status-green)' }}>
                  {system.lifecycleStatus}
                </div>
              </GovernanceField>

            </div>
          </section>
        </div>
      </div>


      {(isEditing || isDeleting) && (
        <SystemModal 
          system={system}
          allTeams={teams}
          allCollaborators={collaborators}
          allVendors={vendors}
          onClose={() => { setIsEditing(false); setIsDeleting(false); }}
          onSave={handleSave}
          onDelete={handleDelete}
          isDeletingInitial={isDeleting}
          canManageEntities={canManageEntities}
        />
      )}
    </div>
  );
};

export default InventoryDetail;
