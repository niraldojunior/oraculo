import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useView } from '@/context/ViewContext';
import { DOMAIN_HIERARCHY } from '@/data/mockDb'; // used for category options
import { X, Plus, Skull, Pencil, Save, Loader2 } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { System, Team, Collaborator, SLA, SystemContextFile, Department } from '../../../types';
import {
  createSystem,
  fetchInventoryContext,
  updateSystem
} from '../services/inventoryApi';

const SystemModal: React.FC<{
  onClose: () => void;
  onSave: (updated: System) => void;
  allTeams: Team[];
  allDepartments: Department[];
  defaultDepartmentId?: string;
}> = ({ onClose, onSave, allTeams, allDepartments, defaultDepartmentId }) => {
  useEscapeKey(onClose);
  const [formData, setFormData] = useState({
    name: '',
    departmentId: defaultDepartmentId || allDepartments[0]?.id || '',
    category: 'Ordem Serviço',
    criticality: 'Tier 3' as SLA,
    lifecycleStatus: 'Ativo Greenfield' as any,
    ownerTeamId: '',
    description: '',
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
            contextFiles: contextFiles.length > 0 ? contextFiles : undefined
          } as System);
        }} className="form-container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            {/* Coluna 1: Informações Gerais */}
            <div className="form-container">
              <div className="form-group">
                <label>Nome Fantasia</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
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
                    <option value="Não TI">Não TI</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {Array.from(new Set(Object.values(DOMAIN_HIERARCHY).flat())).map(sd => (
                    <option key={sd} value={sd}>{sd}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: 'rgba(var(--accent-rgb), 0.05)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>
                  Departamento: <span style={{ color: 'var(--text-primary)' }}>{allDepartments.find(d => d.id === formData.departmentId)?.name}</span>
                </p>
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

            {/* Coluna 2: Governança e Ambientes */}
            <div className="form-container">
              <div className="form-group">
                <label>Time Responsável</label>
                <select value={formData.ownerTeamId} onChange={e => setFormData({ ...formData, ownerTeamId: e.target.value })}>
                  <option value="">Sem equipe</option>
                  {allTeams.filter(t => t.type === 'Lideranca').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
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
                <label>ðŸ"Ž Arquivos de Contexto</label>
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



interface LandscapeGroup {
  teamId: string;
  teamName: string;
  domains: {
    [key: string]: System[];
  };
}

type InventoryViewMode = 'landscape' | 'table';

const TABLE_COLUMNS: {
  key: keyof System;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: ((ctx: { teams: Team[]; collaborators: Collaborator[] }) => { value: string; label: string }[]) | { value: string; label: string }[];
  width?: number;
}[] = [
  { key: 'name', label: 'Nome', type: 'text', width: 200 },
  { key: 'category', label: 'Categoria', type: 'text', width: 160 },
  {
    key: 'criticality', label: 'Criticidade', type: 'select', width: 110,
    options: ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'].map(t => ({ value: t, label: t })),
  },
  {
    key: 'lifecycleStatus', label: 'Ciclo de Vida', type: 'select', width: 130,
    options: [
      { value: 'Ativo Greenfield', label: 'Ativo' },
      { value: 'Fim de Vida (Freezing)', label: 'Fim de Vida' },
      { value: 'Planejado', label: 'Planejado' },
      { value: 'Não TI', label: 'Não TI' },
    ],
  },
  {
    key: 'ownerTeamId', label: 'Time Responsável', type: 'select', width: 180,
    options: ({ teams }) => [{ value: '', label: '—' }, ...teams.map(t => ({ value: t.id, label: t.name }))],
  },
  { key: 'description', label: 'Descrição', type: 'textarea', width: 280 },
];

function useSystemsEditor(systems: System[], onSavedAll: (updated: System[]) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, Partial<System>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const enterEdit = useCallback(() => {
    const init: Record<string, Partial<System>> = {};
    systems.forEach(s => { init[s.id] = { ...s }; });
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
    if (d && key in d) return (d as any)[key];
    return (sys as any)[key];
  }, [draft]);

  const isRowDirty = useCallback((sys: System): boolean => {
    const d = draft[sys.id];
    if (!d) return false;
    return TABLE_COLUMNS.some(col => {
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
          const k = col.key as keyof System;
          if ((d as any)[k] !== undefined) (payload as any)[k] = (d as any)[k];
        });
        try {
          const saved = await updateSystem(sys.id, payload);
          updated.push(saved);
        } catch (err: any) {
          throw new Error(err?.message || `Falha ao salvar "${sys.name}"`);
        }
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
  editor: ReturnType<typeof useSystemsEditor>;
  canEdit?: boolean;
}> = ({ systems, teams, collaborators, editor }) => {
  const [sortKey, setSortKey] = useState<keyof System>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof System) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sortedSystems = useMemo(() => {
    return [...systems].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'pt-BR', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [systems, sortKey, sortDir]);
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
      const opts = typeof col.options === 'function' ? col.options({ teams, collaborators }) : (col.options || []);
      const found = opts.find(o => o.value === String(val));
      return found ? found.label : String(val);
    }
    return String(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

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
                  onClick={() => handleSort(col.key)}
                  style={{
                    position: 'sticky', top: 0, zIndex: 5,
                    background: '#F1F5F9', color: '#1E293B',
                    borderBottom: '1px solid #CBD5E1', borderRight: '1px solid #E2E8F0',
                    textAlign: 'left', padding: '8px 10px',
                    fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em',
                    minWidth: col.width || 140, width: col.width || 140,
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {col.label}{' '}
                  {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.25 }}>↕</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSystems.map((sys, ri) => {
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
                      const isDesc = col.key === 'description';
                      return (
                        <td key={String(col.key)} style={cellStyle}>
                          <div style={isDesc
                            ? { ...readonlyCellStyle, whiteSpace: 'normal', wordBreak: 'break-word', minWidth: col.width || 140 }
                            : readonlyCellStyle}
                            title={isDesc ? undefined : labelFor(col, val)}
                          >
                            {labelFor(col, val)}
                          </div>
                        </td>
                      );
                    }
                    if (col.type === 'select') {
                      const opts = typeof col.options === 'function' ? col.options({ teams, collaborators }) : (col.options || []);
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

function getSubdomainCols(n: number): number {
  if (n <= 2) return 1;  // 1-2 sistemas: coluna única estreita, cabe ao lado de outras
  if (n <= 3) return 3;  // 3 em 1 linha, sem células vazias
  if (n <= 4) return 2;  // 2×2
  if (n <= 6) return 3;  // 2 linhas de 3
  if (n <= 9) return 3;  // 3×3
  return 4;
}

const Inventory: React.FC = () => {
  const { currentCompany, currentDepartment, canManageEntities } = useAuth();
  const { searchTerm: globalSearch, registerAddAction, activeView, setActiveView, setHeaderActions } = useView();
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
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (!currentCompany) {
      setSystems([]);
      setTeams([]);
      setCollaborators([]);
      setDepartments([]);
      setLoading(true);
      return;
    }

    fetchInventoryContext({
      companyId: currentCompany.id,
      departmentId: currentDepartment?.id
    })
      .then(data => {
        setSystems(data.systems);
        setTeams(data.teams);
        setCollaborators(data.collaborators);
        setDepartments(data.departments);
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
      sys.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ), [systems, searchTerm]);

  const editor = useSystemsEditor(filteredSystems, (updated) => {
    setSystems(prev => prev.map(s => updated.find(u => u.id === s.id) || s));
  });

  const { isEditing: editorIsEditing, isSaving: editorIsSaving, dirtyCount: editorDirtyCount, handleSave: editorHandleSave, cancelEdit: editorCancelEdit, enterEdit: editorEnterEdit } = editor;

  useEffect(() => {
    if (viewMode !== 'table' || !canManageEntities) {
      setHeaderActions(null);
      return () => { setHeaderActions(null); };
    }
    if (editorIsEditing) {
      setHeaderActions(
        <>
          {editorDirtyCount > 0 && (
            <span style={{ fontSize: '0.72rem', color: '#92400E', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 20, padding: '2px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {editorDirtyCount} modificada{editorDirtyCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={editorCancelEdit}
            disabled={editorIsSaving}
            title="Cancelar edição"
            style={{
              width: 32, height: 32,
              background: '#F1F5F9',
              color: '#475569',
              border: 'none',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: editorIsSaving ? 'not-allowed' : 'pointer',
              opacity: editorIsSaving ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
          <button
            onClick={editorHandleSave}
            disabled={editorIsSaving}
            title="Salvar alterações"
            style={{
              width: 32, height: 32,
              background: '#1D4ED8',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: editorIsSaving ? 'not-allowed' : 'pointer',
              opacity: editorIsSaving ? 0.7 : 1,
              boxShadow: '0 0 0 3px rgba(29,78,216,0.3)',
              flexShrink: 0,
              transition: 'opacity 0.15s',
            }}
          >
            {editorIsSaving
              ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              : <Save size={16} />}
          </button>
        </>
      );
    } else {
      setHeaderActions(
        <button
          onClick={editorEnterEdit}
          title="Editar sistemas"
          style={{
            width: 32, height: 32,
            background: '#F1F5F9',
            color: '#64748B',
            border: 'none',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Pencil size={16} />
        </button>
      );
    }
    return () => { setHeaderActions(null); };
  }, [viewMode, canManageEntities, editorIsEditing, editorIsSaving, editorDirtyCount, editorHandleSave, editorCancelEdit, editorEnterEdit, setHeaderActions]);


  const handleSave = async (newSystem: System) => {
    try {
      const payload = {
        ...newSystem,
        companyId: currentCompany?.id || '',
        departmentId: currentDepartment?.id || newSystem.departmentId || ''
      };

      const createdSystem = await createSystem(payload);
      setSystems(prev => [...prev, createdSystem]);
      setIsRegistering(false);
    } catch (err: any) {
      console.error('Error creating system:', err);
      alert(err.message || 'Erro ao registrar no banco de dados.');
    }
  };

  // Group systems by responsible team, then by domain
  const landscapeData: LandscapeGroup[] = useMemo(() => {
    const teamMap: { [teamId: string]: LandscapeGroup } = {};

    filteredSystems.forEach(sys => {
      const teamId = sys.ownerTeamId || '__sem_time__';
      const teamName = teams.find(t => t.id === teamId)?.name || 'Sem Time Responsável';

      if (!teamMap[teamId]) {
        teamMap[teamId] = { teamId, teamName, domains: {} };
      }

      const subDomain = sys.category || 'Sem Categoria';
      if (!teamMap[teamId].domains[subDomain]) {
        teamMap[teamId].domains[subDomain] = [];
      }
      teamMap[teamId].domains[subDomain].push(sys);
    });

    return Object.values(teamMap).sort((a, b) => {
      if (a.teamId === '__sem_time__') return 1;
      if (b.teamId === '__sem_time__') return -1;
      return a.teamName.localeCompare(b.teamName);
    });
  }, [filteredSystems, teams]);

  if (loading) return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <span>Carregando Inventário Estrutural...</span>
    </div>
  );

  return (
    <div className="page-layout" style={{ paddingTop: viewMode === 'table' ? '8px' : 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <SystemsTable
          systems={filteredSystems}
          teams={teams}
          collaborators={collaborators}
          editor={editor}
          canEdit={canManageEntities}
        />
      )}

      {/* LANDSCAPE VIEW */}
      {viewMode === 'landscape' && (
      <div style={{ overflowX: 'auto', paddingBottom: '1.4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(266px, 1fr))', gap: '1rem', minWidth: '840px' }}>

          {landscapeData.map(group => (
            <div key={group.teamId} style={{
              background: '#CBD5E1',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#181919', margin: 0, letterSpacing: '0.02em' }}>
                {group.teamName}
              </h3>

              <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '1.4rem', columnGap: '0.7rem', alignItems: 'flex-start' }}>
                {Object.entries(group.domains).map(([domainName, sysList]) => {
                  const cols = getSubdomainCols(sysList.length);
                  return (
                  <div key={domainName} style={{
                    width: 'fit-content',
                    background: '#FFFFFF',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '11px',
                    padding: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.7rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    position: 'relative',
                    boxSizing: 'border-box',
                  }}>
                    <div style={{ textAlign: 'center', marginTop: '-1.5rem' }}>
                      <span style={{
                        background: '#181919',
                        color: '#fff',
                        padding: '0.175rem 0.875rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid #000',
                        display: 'inline-block',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {domainName}
                      </span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cols}, 70px)`,
                      gap: '0.525rem',
                      alignContent: 'start'
                    }}>
                      {sysList.map(system => {
                        const isDashed = system.lifecycleStatus === 'Planejado';
                        const isFimDeVida = system.lifecycleStatus === 'Fim de Vida (Freezing)';

                        return (
                          <div
                            key={system.id}
                            onClick={() => navigate(`/inventario/${system.id}`)}
                            style={{
                              backgroundColor: isDashed ? 'transparent' : isFimDeVida ? '#b91c1c' : '#3498db',
                              border: isDashed ? `2px dashed var(--text-secondary)` : isFimDeVida ? '1px solid #ef4444' : `1px solid rgba(255,255,255,0.1)`,
                              borderRadius: '4px',
                              padding: '0.35rem',
                              color: isDashed ? 'var(--text-primary)' : '#fff',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '52px',
                              minHeight: '52px',
                              overflow: 'hidden',
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
                                size={9}
                                style={{
                                  position: 'absolute',
                                  bottom: '3px',
                                  right: '3px',
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
                  );
                })}

                {Object.keys(group.domains).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    Nenhum sistema encontrado para este time.
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
          allDepartments={departments}
          defaultDepartmentId={currentDepartment?.id}
        />
      )}
    </div>
  );
};

export default Inventory;

