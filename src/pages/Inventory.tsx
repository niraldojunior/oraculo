import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

type InventoryViewMode = 'landscape' | 'table';

const TABLE_COLUMNS: {
  key: keyof System | 'techStackCsv';
  label: string;
  type: 'text' | 'textarea' | 'select' | 'csv';
  options?: ((ctx: { teams: Team[]; collaborators: Collaborator[]; vendors: Vendor[] }) => { value: string; label: string }[]) | { value: string; label: string }[];
  width?: number;
}[] = [
  { key: 'name', label: 'Nome', type: 'text', width: 200 },
  { key: 'platformName', label: 'Plataforma', type: 'text', width: 180 },
  { key: 'domain', label: 'Domínio', type: 'select', options: DOMAINS.map(d => ({ value: d, label: d })), width: 200 },
  { key: 'subDomain', label: 'Subdomínio', type: 'text', width: 160 },
  {
    key: 'platformCategory', label: 'Categoria', type: 'select', width: 170,
    options: ['Dados/IA', 'Middleware', 'Plataforma Negócio', 'Plataforma Serviços', 'Mobile', 'Portais', 'Engenharia'].map(c => ({ value: c, label: c })),
  },
  {
    key: 'criticality', label: 'Criticidade', type: 'select', width: 110,
    options: ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'].map(t => ({ value: t, label: t })),
  },
  {
    key: 'lifecycleStatus', label: 'Ciclo de Vida', type: 'select', width: 170,
    options: ['Ativo Greenfield', 'Fim de Vida (Freezing)', 'Planejado'].map(s => ({ value: s, label: s })),
  },
  {
    key: 'ownerTeamId', label: 'Time Responsável', type: 'select', width: 180,
    options: ({ teams }) => [{ value: '', label: '—' }, ...teams.map(t => ({ value: t.id, label: t.name }))],
  },
  {
    key: 'smeId', label: 'SME', type: 'select', width: 180,
    options: ({ collaborators }) => [{ value: '', label: '—' }, ...collaborators.map(c => ({ value: c.id, label: c.name }))],
  },
  {
    key: 'vendorId', label: 'Fornecedor', type: 'select', width: 170,
    options: ({ vendors }) => [{ value: '', label: '—' }, ...vendors.map(v => ({ value: v.id, label: v.companyName }))],
  },
  { key: 'techStackCsv', label: 'Stack (csv)', type: 'csv', width: 200 },
  { key: 'repoUrl', label: 'Repositório', type: 'text', width: 200 },
  { key: 'description', label: 'Descrição', type: 'textarea', width: 280 },
];

function useSystemsEditor(systems: System[], onSavedAll: (updated: System[]) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, Partial<System> & { techStackCsv?: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const enterEdit = useCallback(() => {
    const init: Record<string, Partial<System> & { techStackCsv?: string }> = {};
    systems.forEach(s => {
      init[s.id] = {
        ...s,
        techStackCsv: Array.isArray(s.techStack) ? s.techStack.join(', ') : (s.techStack as any) || ''
      };
    });
    setDraft(init);
    setSaveError(null);
    setIsEditing(true);
  }, [systems]);

  const cancelEdit = useCallback(() => {
    setDraft({});
    setIsEditing(false);
    setSaveError(null);
  }, []);

  const updateField = useCallback((id: string, key: string, value: any) => {
    setDraft(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: value }
    }));
  }, []);

  const valueOf = useCallback((sys: System, key: string): any => {
    const d = draft[sys.id];
    if (key === 'techStackCsv') {
      if (d && d.techStackCsv !== undefined) return d.techStackCsv;
      return Array.isArray(sys.techStack) ? sys.techStack.join(', ') : '';
    }
    if (d && key in d) return (d as any)[key];
    return (sys as any)[key];
  }, [draft]);

  const isRowDirty = useCallback((sys: System): boolean => {
    const d = draft[sys.id];
    if (!d) return false;
    return TABLE_COLUMNS.some(col => {
      if (col.key === 'techStackCsv') {
        const original = Array.isArray(sys.techStack) ? sys.techStack.join(', ') : '';
        return (d.techStackCsv ?? original) !== original;
      }
      const k = col.key as keyof System;
      const cur = (d as any)[k];
      if (cur === undefined) return false;
      return (sys as any)[k] !== cur;
    });
  }, [draft]);

  const handleSave = useCallback(async () => {
    const dirtyRows = systems.filter(isRowDirty);
    if (dirtyRows.length === 0) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const updated: System[] = [];
    try {
      for (const sys of dirtyRows) {
        const d = draft[sys.id];
        const payload: Partial<System> = {};
        TABLE_COLUMNS.forEach(col => {
          if (col.key === 'techStackCsv') {
            const csv = d.techStackCsv ?? '';
            const arr = csv.split(',').map(s => s.trim()).filter(Boolean);
            payload.techStack = arr;
          } else {
            const k = col.key as keyof System;
            if ((d as any)[k] !== undefined) (payload as any)[k] = (d as any)[k];
          }
        });
        const res = await fetch(`/api/systems/${sys.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let msg = `Falha ao salvar "${sys.name}"`;
          try {
            const err = await res.json();
            msg = err.details || err.error || msg;
          } catch {}
          throw new Error(msg);
        }
        const saved = await res.json();
        updated.push(saved);
      }
      onSavedAll(updated);
      setDraft({});
      setIsEditing(false);
    } catch (e: any) {
      setSaveError(e.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  }, [systems, isRowDirty, draft, onSavedAll]);

  const dirtyCount = useMemo(() => systems.filter(isRowDirty).length, [systems, isRowDirty]);

  return { isEditing, isSaving, saveError, dirtyCount, enterEdit, cancelEdit, handleSave, updateField, valueOf, isRowDirty };
}

const SystemsTable: React.FC<{
  systems: System[];
  teams: Team[];
  collaborators: Collaborator[];
  vendors: Vendor[];
  editor: ReturnType<typeof useSystemsEditor>;
}> = ({ systems, teams, collaborators, vendors, editor }) => {
  const { isEditing, saveError, updateField, valueOf, isRowDirty } = editor;

  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #CBD5E1',
    borderRadius: 4,
    padding: '4px 6px',
    fontSize: '0.75rem',
    background: 'white',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#1E293B',
  };
  const readonlyCellStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#1E293B',
    padding: '6px 8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const labelFor = (col: typeof TABLE_COLUMNS[number], val: any): string => {
    if (val === undefined || val === null || val === '') return '—';
    if (col.type === 'select') {
      const opts = typeof col.options === 'function' ? col.options({ teams, collaborators, vendors }) : (col.options || []);
      const found = opts.find(o => o.value === String(val));
      return found ? found.label : String(val);
    }
    if (col.key === 'techStackCsv') {
      return Array.isArray(val) ? val.join(', ') : String(val);
    }
    return String(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minHeight: 0 }}>
      {saveError && (
        <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: 6, fontSize: '0.78rem' }}>
          {saveError}
        </div>
      )}

      <div style={{ overflow: 'auto', border: '1px solid var(--glass-border)', borderRadius: 8, background: 'white', flex: 1, minHeight: 0 }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'max-content', minWidth: '100%' }}>
          <thead>
            <tr>
              {TABLE_COLUMNS.map(col => (
                <th
                  key={String(col.key)}
                  style={{
                    position: 'sticky', top: 0, zIndex: 5,
                    background: '#F1F5F9', color: '#1E293B',
                    borderBottom: '1px solid #CBD5E1', borderRight: '1px solid #E2E8F0',
                    textAlign: 'left', padding: '8px 10px',
                    fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em',
                    minWidth: col.width || 140, width: col.width || 140,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {systems.map((sys, ri) => {
              const dirty = isEditing && isRowDirty(sys);
              return (
                <tr key={sys.id} style={{ background: dirty ? '#FFFBEB' : (ri % 2 ? '#FAFBFC' : 'white') }}>
                  {TABLE_COLUMNS.map(col => {
                    const val = valueOf(sys, String(col.key));
                    const cellStyle: React.CSSProperties = {
                      borderBottom: '1px solid #E2E8F0',
                      borderRight: '1px solid #F1F5F9',
                      verticalAlign: 'top',
                      padding: isEditing ? 4 : 0,
                      minWidth: col.width || 140,
                      width: col.width || 140,
                    };
                    if (!isEditing) {
                      return (
                        <td key={String(col.key)} style={cellStyle}>
                          <div style={readonlyCellStyle} title={labelFor(col, val)}>
                            {labelFor(col, val)}
                          </div>
                        </td>
                      );
                    }
                    if (col.type === 'select') {
                      const opts = typeof col.options === 'function' ? col.options({ teams, collaborators, vendors }) : (col.options || []);
                      return (
                        <td key={String(col.key)} style={cellStyle}>
                          <select
                            value={val ?? ''}
                            onChange={e => updateField(sys.id, String(col.key), e.target.value)}
                            style={baseInputStyle}
                          >
                            {!opts.some(o => o.value === '') && <option value="">—</option>}
                            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </td>
                      );
                    }
                    if (col.type === 'textarea') {
                      return (
                        <td key={String(col.key)} style={cellStyle}>
                          <textarea
                            value={val ?? ''}
                            onChange={e => updateField(sys.id, String(col.key), e.target.value)}
                            rows={2}
                            style={{ ...baseInputStyle, resize: 'vertical', minHeight: 32 }}
                          />
                        </td>
                      );
                    }
                    return (
                      <td key={String(col.key)} style={cellStyle}>
                        <input
                          type="text"
                          value={val ?? ''}
                          onChange={e => updateField(sys.id, String(col.key), e.target.value)}
                          style={baseInputStyle}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {systems.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  Nenhum sistema cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Inventory: React.FC = () => {
  const { currentCompany, currentDepartment, canManageEntities } = useAuth();
  const { searchTerm: globalSearch, registerAddAction, activeView, setActiveView } = useView();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm(globalSearch);
  }, [globalSearch]);
  const [tooltipInfo, setTooltipInfo] = useState<{ visible: boolean; x: number; y: number; text: string; name: string } | null>(null);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  const viewMode: InventoryViewMode = activeView === 'table' ? 'table' : 'landscape';
  // Ensure activeView is one of inventory views when entering page
  useEffect(() => {
    if (activeView !== 'landscape' && activeView !== 'table') {
      setActiveView('landscape');
    }
     
  }, []);

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

  // Header title/actions are handled by the shared Header route mapping.

  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!canManageEntities) return;
    registerAddAction(() => setIsRegistering(true));
    return () => registerAddAction(() => null);
  }, [registerAddAction, canManageEntities]);

  const filteredSystems = useMemo(() => (
    systems.filter(sys =>
      sys.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sys.domain.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ), [systems, searchTerm]);

  const editor = useSystemsEditor(filteredSystems, (updated) => {
    setSystems(prev => prev.map(s => updated.find(u => u.id === s.id) || s));
  });
  

  // Inventory-specific header actions disabled to avoid route-level render loops.

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
    <div className="page-layout" style={{ paddingTop: 0, display: 'flex', flexDirection: 'column', height: '100%', gap: viewMode === 'table' ? 0 : undefined }}>
      {/* Legend (only in landscape view) */}
      {viewMode === 'landscape' && (
        <div className="flex-between" style={{ gap: '1.5rem', marginBottom: '1rem', alignItems: 'center' }}>
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
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <SystemsTable
          systems={filteredSystems}
          teams={teams}
          collaborators={collaborators}
          vendors={vendors}
          editor={editor}
        />
      )}

      {/* LANDSCAPE VIEW */}
      {viewMode === 'landscape' && (
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
      )}

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

