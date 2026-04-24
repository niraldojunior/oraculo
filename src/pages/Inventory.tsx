import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useView } from '../context/ViewContext';
import { DOMAIN_HIERARCHY } from '../data/mockDb';
import { X, Plus, Skull } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import type { System, Team, Collaborator, SLA, Vendor, SystemContextFile, Department } from '../types';

const SystemModal: React.FC<{
  onClose: () => void;
  onSave: (updated: System) => void;
  allTeams: Team[];
  allCollaborators: Collaborator[];
  allVendors: Vendor[];
  allDepartments: Department[];
  defaultDepartmentId?: string;
}> = ({ onClose, onSave, allTeams, allCollaborators, allVendors, allDepartments, defaultDepartmentId }) => {
  useEscapeKey(onClose);
  const [formData, setFormData] = useState({
    name: '',
    platformName: '',
    domain: 'Fulfillment & Assurance',
    departmentId: defaultDepartmentId || allDepartments[0]?.id || '',
    subDomain: 'Ordem Serviço',
    platformCategory: 'Plataforma Serviços',
    criticality: 'Tier 3' as SLA,
    lifecycleStatus: 'Ativo Greenfield' as any,
    techStack: '',
    ownerTeamId: '',
    smeId: '',
    vendorId: '',
    description: '',
    repoUrl: '',
    environments: {
      dev: '',
      ti: '',
      hml: '',
      prd: ''
    }
  });
  const [contextFiles, setContextFiles] = useState<SystemContextFile[]>([]);

  useEffect(() => {
    if (!defaultDepartmentId) return;
    setFormData(prev => prev.departmentId === defaultDepartmentId ? prev : { ...prev, departmentId: defaultDepartmentId });
  }, [defaultDepartmentId]);

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

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div className="glass-panel modal-content" style={{ maxWidth: '1100px', width: '95%' }}>
        <button onClick={onClose} className="btn-close"><X size={20} /></button>
        <h2 className="modal-title"><Plus size={20} /> Registrar Novo Sistema</h2>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: `s_${Date.now()}`,
            ...formData,
            acronym: '',
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
                <div style={{ background: 'rgba(var(--accent-rgb), 0.05)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
                Departamento: <span style={{ color: 'var(--text-primary)' }}>{allDepartments.find(d => d.id === formData.departmentId)?.name}</span>
              </p>
            </div>
              </div>
              
              <div className="grid-2">
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
                <div className="form-group">
                  <label>Categoria de Plataforma</label>
                  <select value={formData.platformCategory} onChange={e => setFormData({ ...formData, platformCategory: e.target.value })}>
                    {['Dados/IA', 'Middleware', 'Plataforma Negócio', 'Plataforma Serviços', 'Mobile', 'Portais', 'Engenharia'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={{ background: 'rgba(var(--accent-rgb), 0.05)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
                    Departamento: <span style={{ color: 'var(--text-primary)' }}>{allDepartments.find(d => d.id === formData.departmentId)?.name}</span>
                  </p>
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
                <label>ðŸ”— Repositório de Código (GitHub / Azure DevOps)</label>
                <input 
                  type="url"
                  placeholder="https://github.com/org/repo ou https://dev.azure.com/..."
                  value={formData.repoUrl} 
                  onChange={e => setFormData({ ...formData, repoUrl: e.target.value })} 
                />
              </div>

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--accent-base)' }}>ðŸŒ Endpoints e Ambientes</h3>
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
                <label>ðŸ“Ž Arquivos de Contexto</label>
                <input type="file" multiple onChange={handleFileUpload} style={{ fontSize: '0.85rem' }} />
                {contextFiles.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {contextFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                        {f.name}
                        <button type="button" onClick={() => setContextFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--status-red)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>âœ•</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

               <div className="form-actions" style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Registrar Sistema</button>
              </div>
            </div>
          </div>
        </form>
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

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'Dados/IA': return '#673ab7'; // Purple
    case 'Middleware': return '#e67e22'; // Orange
    case 'Plataforma Negócio': return '#1e3a8a'; // Dark Blue
    case 'Plataforma Serviços': return '#3498db'; // Light Blue
    case 'Mobile': return '#16a085'; // Green
    case 'Portais': return '#d4ac0d'; // Yellow
    case 'Engenharia': return '#4b5563'; // Grey
    default: return '#374151'; // Default dark grey
  }
};

const DOMAINS = [
  'Fulfillment & Assurance',
  'Network Management',
  'Workforce Management'
];

interface LandscapeGroup {
  domain: string;
  subDomains: {
    [key: string]: System[];
  };
}

const Inventory: React.FC = () => {
  const { currentCompany, currentDepartment, canManageEntities } = useAuth();
  const { setHeaderContent, searchTerm: globalSearch, registerAddAction } = useView();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm(globalSearch);
  }, [globalSearch]);
  const [tooltipInfo, setTooltipInfo] = useState<{ visible: boolean; x: number; y: number; text: string; name: string } | null>(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState<Team[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (!currentCompany) {
      setSystems([]);
      setTeams([]);
      setCollaborators([]);
      setVendors([]);
      setDepartments([]);
      setLoading(true);
      return;
    }

    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    fetch(`/api/inventory-context${query}`)
      .then(res => res.json())
      .then(data => {
        setSystems(Array.isArray(data.systems) ? data.systems : []);
        setTeams(Array.isArray(data.teams) ? data.teams : []);
        setCollaborators(Array.isArray(data.collaborators) ? data.collaborators : []);
        setVendors(Array.isArray(data.vendors) ? data.vendors : []);
        setDepartments(Array.isArray(data.departments) ? data.departments : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch data', err);
        setLoading(false);
      });
  }, [currentCompany, currentDepartment]);

  // Atualizar o título da aba do navegador
  useEffect(() => {
    document.title = 'Sistemas | Oráculo';
    return () => {
      document.title = 'Oráculo';
    };
  }, []);

  useEffect(() => {
    setHeaderContent(
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Sistemas
        </span>
        {!loading && (
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
            {systems.length} {systems.length === 1 ? 'sistema' : 'sistemas'}
          </span>
        )}
      </div>
    );
    return () => setHeaderContent(null);
  }, [systems, loading, setHeaderContent]);

  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!canManageEntities) return;
    registerAddAction(() => setIsRegistering(true));
    return () => registerAddAction(() => null);
  }, [registerAddAction, canManageEntities]);



  const filteredSystems = systems.filter(sys => 

    sys.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sys.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (newSystem: System) => {
    try {
      const payload = {
        ...newSystem,
        companyId: currentCompany?.id || '',
        departmentId: currentDepartment?.id || newSystem.departmentId || ''
      };

      const res = await fetch('/api/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        let errorMsg = 'Failed to create system in database';
        try {
          const text = await res.text();
          const errorData = JSON.parse(text);
          errorMsg = errorData.details || errorData.error || errorMsg;
        } catch (e) {
          console.error('Non-JSON error from server');
        }
        throw new Error(errorMsg);
      }
      
      const createdSystem = await res.json();
      setSystems(prev => [...prev, createdSystem]);
      setIsRegistering(false);
    } catch (err: any) {
      console.error('Error creating system:', err);
      alert(err.message || 'Erro ao registrar no banco de dados.');
    }
  };

  // Group systems by Domain and Subdomain
  const landscapeData: LandscapeGroup[] = DOMAINS.map(domain => {
    const domainSystems = filteredSystems.filter(s => s.domain === domain);
    const subDomainsMap: { [key: string]: System[] } = {};
    
    // Default to 'Sem Categoria' if no subdomain
    domainSystems.forEach(sys => {
      const sd = sys.subDomain || 'Sem Categoria';
      if (!subDomainsMap[sd]) subDomainsMap[sd] = [];
      subDomainsMap[sd].push(sys);
    });

    return {
      domain,
      subDomains: subDomainsMap
    };
  });

  if (loading) return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <span>Carregando Inventário Estrutural...</span>
    </div>
  );

  return (
    <div className="page-layout" style={{ paddingTop: 0 }}>
      <div className="flex-between" style={{ gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        
        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-glass)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Legenda:</span>
          {['Dados/IA', 'Middleware', 'Plataforma Negócio', 'Plataforma Serviços', 'Mobile', 'Portais', 'Engenharia'].map(cat => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: getCategoryColor(cat) }} />
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* LANDSCAPE VIEW */}
      <div style={{ overflowX: 'auto', paddingBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(380px, 1fr))', gap: '1.5rem', minWidth: '1200px' }}>
          
          {landscapeData.map(group => (
            <div key={group.domain} style={{ 
              background: '#CBD5E1', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '12px', 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, color: '#181919', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group.domain}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.entries(group.subDomains).map(([subDomainName, sysList]) => (
                  <div key={subDomainName} style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    position: 'relative'
                  }}>
                    <div style={{ textAlign: 'center', marginTop: '-2.1rem' }}>
                      <span style={{
                        background: '#181919',
                        color: '#fff',
                        padding: '0.25rem 1.25rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid #000',
                        display: 'inline-block',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {subDomainName}
                      </span>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '0.75rem',
                      justifyContent: 'center'
                    }}>
                      {sysList.map(system => {
                        const isDashed = system.lifecycleStatus === 'Planejado';
                        const isFimDeVida = system.lifecycleStatus === 'Fim de Vida (Freezing)';
                        
                        return (
                          <div 
                            key={system.id}
                            onClick={() => navigate(`/inventario/${system.id}`)}
                            style={{
                               backgroundColor: isDashed ? 'transparent' : isFimDeVida ? '#b91c1c' : getCategoryColor(system.platformCategory),
                              border: isDashed ? `2px dashed var(--text-secondary)` : isFimDeVida ? '1px solid #ef4444' : `1px solid rgba(255,255,255,0.1)`,
                              borderRadius: '6px',
                              padding: '0.5rem',
                              color: isDashed ? 'var(--text-primary)' : '#fff',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              textAlign: 'center',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '60px',
                              minHeight: '60px',
                              boxSizing: 'border-box',
                              boxShadow: isDashed ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
                              transition: 'transform 0.1s',
                              userSelect: 'none',
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.filter = 'brightness(1.1)';
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltipInfo({
                                visible: true,
                                x: rect.right + 10,
                                y: rect.top + (rect.height / 2),
                                text: system.description || 'Nenhuma descrição detalhada disponível.',
                                name: system.name
                              });
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.filter = 'brightness(1)';
                              setTooltipInfo(null);
                            }}
                          >
                            {system.name}
                            {system.lifecycleStatus === 'Fim de Vida (Freezing)' && (
                              <Skull 
                                size={14} 
                                style={{ 
                                  position: 'absolute', 
                                  bottom: '4px', 
                                  right: '4px', 
                                  opacity: 0.7,
                                  color: '#fff'
                                }} 
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {Object.keys(group.subDomains).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    Nenhum sistema encontrado neste domínio.
                  </div>
                )}
              </div>
            </div>
          ))}
          
        </div>
      </div>

      {tooltipInfo && tooltipInfo.visible && (
        <div style={{
          position: 'fixed',
          left: tooltipInfo.x,
          top: tooltipInfo.y,
          transform: 'translateY(-50%)',
          width: '320px',
          backgroundColor: 'rgba(50, 50, 60, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderLeft: '4px solid var(--accent-base)',
          borderRadius: '8px',
          padding: '1rem',
          color: '#FFFFFF',
          fontSize: '0.85rem',
          zIndex: 9999,
          boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.7)',
          pointerEvents: 'none',
          textAlign: 'left',
          fontWeight: 'normal',
          lineHeight: '1.4'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--accent-base)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            {tooltipInfo.name}
          </div>
          {tooltipInfo.text}
        </div>
      )}

       {isRegistering && (
        <SystemModal 
          onClose={() => setIsRegistering(false)}
          onSave={handleSave}
          allTeams={teams}
          allCollaborators={collaborators}
          allVendors={vendors}
          allDepartments={departments}
          defaultDepartmentId={currentDepartment?.id}
        />
      )}
    </div>
  );
};

export default Inventory;

