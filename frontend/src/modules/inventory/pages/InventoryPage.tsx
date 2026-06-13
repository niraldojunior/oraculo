import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useView } from '@/context/ViewContext';
import { X, Plus, Skull, Pencil, Save, Loader2 } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { System, Team, Collaborator, SLA, Department, Skill } from '../../../types';
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
  allSystems: System[];
  defaultDepartmentId?: string;
  defaultOwnerTeamId?: string;
  leaderTeamIds?: string[];
}> = ({ onClose, onSave, allTeams, allDepartments, allSystems, defaultDepartmentId, defaultOwnerTeamId, leaderTeamIds }) => {
  useEscapeKey(onClose);
  const { currentCompany, currentDepartment } = useAuth();
  const leafTeams = allTeams.filter(t => !allTeams.some(other => other.parentTeamId === t.id));
  const teamsToShow = leaderTeamIds
    ? leafTeams.filter(t => leaderTeamIds.includes(t.id))
    : leafTeams;

  const existingCategories = useMemo(
    () => Array.from(new Set(allSystems.map(s => s.category).filter(Boolean))).sort() as string[],
    [allSystems]
  );

  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  useEffect(() => {
    if (!currentCompany) return;
    const params = new URLSearchParams({ companyId: currentCompany.id });
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    fetch(`/api/skills?${params}`)
      .then(r => r.json())
      .then(data => setAvailableSkills(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [currentCompany, currentDepartment]);

  const [formData, setFormData] = useState({
    name: '',
    departmentId: defaultDepartmentId || allDepartments[0]?.id || '',
    category: '',
    criticality: 'Tier 3' as SLA,
    lifecycleStatus: 'Ativo Greenfield' as any,
    ownerTeamId: defaultOwnerTeamId || '',
    description: '',
    environments: {
      dev: '',
      ti: '',
      hml: '',
      prd: ''
    },
    technicalSkills: [] as string[],
  });

  const removeSkill = (index: number) => {
    setFormData(prev => ({ ...prev, technicalSkills: prev.technicalSkills.filter((_, i) => i !== index) }));
  };

  useEffect(() => {
    if (!defaultDepartmentId) return;
    setFormData(prev => prev.departmentId === defaultDepartmentId ? prev : { ...prev, departmentId: defaultDepartmentId });
  }, [defaultDepartmentId]);

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div className="glass-panel" style={{
        maxWidth: '780px', width: '92%', background: 'white',
        maxHeight: '94vh', overflowY: 'auto', position: 'relative',
        padding: '1.2rem 2rem', borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} /> Novo Sistema
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', padding: '0.3rem', cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <form id="system-form" onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: `s_${Date.now()}`, ...formData, acronym: '' } as System);
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Coluna 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div className="form-group">
                <label>Nome</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Time Responsável</label>
                <select value={formData.ownerTeamId} onChange={e => setFormData({ ...formData, ownerTeamId: e.target.value })}>
                  <option value="">Sem equipe</option>
                  {teamsToShow.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <input
                  list="sys-categories-list"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Selecionar ou digitar..."
                />
                <datalist id="sys-categories-list">
                  {existingCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Criticidade</label>
                  <select value={formData.criticality} onChange={e => setFormData({ ...formData, criticality: e.target.value as SLA })}>
                    <option value="Tier 1">Tier 1 (Crítico)</option>
                    <option value="Tier 2">Tier 2 (Importante)</option>
                    <option value="Tier 3">Tier 3 (Normal)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ciclo de Vida</label>
                  <select value={formData.lifecycleStatus} onChange={e => setFormData({ ...formData, lifecycleStatus: e.target.value as any })}>
                    <option value="Ativo Greenfield">Ativo Greenfield</option>
                    <option value="Fim de Vida (Freezing)">Fim de Vida (Freezing)</option>
                    <option value="Planejado">Planejado</option>
                    <option value="Não TI">Não TI</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Skills Técnicos</label>
                <select
                  value=""
                  onChange={e => {
                    const val = e.target.value;
                    if (val && !formData.technicalSkills.includes(val)) {
                      setFormData(prev => ({ ...prev, technicalSkills: [...prev.technicalSkills, val] }));
                    }
                  }}
                >
                  <option value="">Selecionar skill...</option>
                  {availableSkills
                    .filter(s => !formData.technicalSkills.includes(s.name))
                    .map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                {formData.technicalSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                    {formData.technicalSkills.map((skill, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#EEF2FF', color: '#4F46E5', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        {skill}
                        <button type="button" onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6366F1', fontSize: '0.85rem', lineHeight: 1, display: 'flex' }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div className="form-group">
                <label>Descrição / Finalidade</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  style={{ resize: 'none', height: '100px' }}
                />
              </div>

              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Endpoints e Ambientes</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {(['dev', 'ti', 'hml', 'prd'] as const).map(env => (
                    <div className="form-group" key={env}>
                      <label>{env.toUpperCase()}</label>
                      <input
                        placeholder={`https://${env}-api...`}
                        value={formData.environments[env]}
                        onChange={e => setFormData({ ...formData, environments: { ...formData.environments, [env]: e.target.value } })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" form="system-form" className="btn btn-primary" style={{ minWidth: '140px', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
            Registrar Sistema
          </button>
        </div>
      </div>
      <style>{`
        .form-group label { font-size: 0.75rem; margin-bottom: 0.2rem; }
        .form-group input, .form-group select, .form-group textarea { font-size: 0.85rem; padding: 0.5rem 0.75rem; }
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
  const { searchTerm: globalSearch, registerAddAction, activeView, setActiveView, setHeaderActions, selectedManagerId } = useView();
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

  // Build team hierarchy for selected manager
  const leaderHierarchy = useMemo(() => {
    if (selectedManagerId === 'all' || !selectedManagerId) return null;
    const getSubtree = (teamId: string): string[] => {
      const children = teams.filter(t => t.parentTeamId === teamId);
      return [teamId, ...children.flatMap(c => getSubtree(c.id))];
    };
    const rootTeams = teams.filter(t => t.leaderId === selectedManagerId);
    if (rootTeams.length === 0) return null;
    const allTeamIds = rootTeams.flatMap(rt => getSubtree(rt.id));
    const isLeaderOfLeaders = rootTeams.some(rt => teams.some(t => t.parentTeamId === rt.id));
    return { teamIds: allTeamIds, isLeaderOfLeaders, rootTeams };
  }, [selectedManagerId, teams]);

  const modalTeamProps = useMemo(() => {
    if (!leaderHierarchy || selectedManagerId === 'nao-ti' || selectedManagerId === 'all' || !selectedManagerId) {
      return { defaultOwnerTeamId: undefined, leaderTeamIds: undefined };
    }
    if (!leaderHierarchy.isLeaderOfLeaders) {
      const directTeam = leaderHierarchy.rootTeams[0];
      return { defaultOwnerTeamId: directTeam?.id, leaderTeamIds: undefined };
    }
    return { defaultOwnerTeamId: undefined, leaderTeamIds: leaderHierarchy.teamIds };
  }, [leaderHierarchy, selectedManagerId, teams]);

  const filteredSystems = useMemo(() => {
    const bySearch = systems.filter(sys =>
      sys.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (selectedManagerId === 'nao-ti') return bySearch.filter(sys => sys.lifecycleStatus === 'Não TI');
    if (!leaderHierarchy) return bySearch;
    return bySearch.filter(sys => sys.ownerTeamId && leaderHierarchy.teamIds.includes(sys.ownerTeamId));
  }, [systems, searchTerm, leaderHierarchy, selectedManagerId]);

  const onEditorSaved = useCallback((updated: System[]) => {
    setSystems(prev => prev.map(s => updated.find(u => u.id === s.id) || s));
  }, []);

  const editor = useSystemsEditor(filteredSystems, onEditorSaved);

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

  // Flat category view for normal leaders (no team grouping)
  const isNormalLeaderView = viewMode === 'landscape' && (selectedManagerId === 'nao-ti' || (leaderHierarchy !== null && !leaderHierarchy.isLeaderOfLeaders));

  const categoryData = useMemo(() => {
    if (!isNormalLeaderView) return null;
    const catMap: Record<string, System[]> = {};
    filteredSystems.forEach(sys => {
      const cat = sys.category || 'Sem Categoria';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(sys);
    });
    return catMap;
  }, [filteredSystems, isNormalLeaderView]);

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
      {viewMode === 'landscape' && (() => {
        const renderSystemCard = (system: System) => {
          const isDashed = system.lifecycleStatus === 'Planejado';
          const isFimDeVida = system.lifecycleStatus === 'Fim de Vida (Freezing)';
          return (
            <div
              key={system.id}
              onClick={() => navigate(`/inventario/${system.id}`)}
              style={{
                backgroundColor: isDashed ? 'transparent' : isFimDeVida ? '#b91c1c' : '#3498db',
                border: isDashed ? '2px dashed var(--text-secondary)' : isFimDeVida ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                padding: '0 0.4rem',
                color: isDashed ? 'var(--text-primary)' : '#fff',
                fontSize: '0.68rem',
                fontWeight: 700,
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px',
                minHeight: '32px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                boxSizing: 'border-box',
                boxShadow: isDashed ? 'none' : '0 4px 6px -1px rgba(0,0,0,0.4)',
                transition: 'transform 0.1s',
                userSelect: 'none',
                position: 'relative',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.filter = 'brightness(1.1)';
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipInfo({ visible: true, x: rect.right + 10, y: rect.top + rect.height / 2, text: system.description || 'Nenhuma descrição detalhada disponível.', name: system.name });
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.filter = 'brightness(1)';
                setTooltipInfo(null);
              }}
            >
              {system.name}
              {isFimDeVida && <Skull size={9} style={{ position: 'absolute', bottom: 3, right: 3, opacity: 0.7, color: '#fff' }} />}
            </div>
          );
        };

        const renderCategoryBox = (catName: string, sysList: System[], maxCols?: number) => {
          const isLeaderSingle = maxCols === 2 && sysList.length === 1;
          const cols = (maxCols === 2 && sysList.length >= 2)
            ? 2
            : Math.min(getSubdomainCols(sysList.length), maxCols ?? 999);
          const systemsGrid = isLeaderSingle ? (
            <div style={{ display: 'flex', justifyContent: 'center', width: 'calc(2 * 96px + 0.525rem)' }}>
              {renderSystemCard(sysList[0])}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 96px)`, gap: '0.525rem', alignContent: 'start' }}>
              {sysList.map(renderSystemCard)}
            </div>
          );
          return (
            <div key={catName} style={{ width: 'fit-content', background: '#FFFFFF', border: '1px solid var(--glass-border)', borderRadius: '11px', padding: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', position: 'relative', boxSizing: 'border-box' }}>
              <div style={{ textAlign: 'center', marginTop: '-1.5rem' }}>
                <span style={{ background: '#181919', color: '#fff', padding: '0.175rem 0.875rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #000', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  {catName}
                </span>
              </div>
              {systemsGrid}
            </div>
          );
        };

        /* ── Normal leader: flat horizontal category layout ── */
        if (isNormalLeaderView && categoryData) {
          return (
            <div style={{ overflowX: 'auto', paddingBottom: '1.4rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '2rem', columnGap: '1rem', alignItems: 'flex-start', padding: '1.5rem 0.5rem 0.5rem' }}>
                {Object.entries(categoryData).sort(([a], [b]) => a.localeCompare(b)).map(([catName, sysList]) =>
                  renderCategoryBox(catName, sysList)
                )}
                {Object.keys(categoryData).length === 0 && (
                  <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '2rem' }}>Nenhum sistema encontrado.</div>
                )}
              </div>
            </div>
          );
        }

        /* ── All / líder de líderes: team card view ── */
        return (
          <div style={{ overflowX: 'auto', paddingBottom: '1.4rem' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '1rem', alignItems: 'flex-start', minWidth: 'max-content' }}>
              {landscapeData.map(group => (
                <div key={group.teamId} style={{ width: 'fit-content', background: '#CBD5E1', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#181919', margin: 0, letterSpacing: '0.02em' }}>
                    {group.teamName}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                    {Object.entries(group.domains).map(([catName, sysList]) => renderCategoryBox(catName, sysList, 2))}
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
        );
      })()}

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
          allSystems={systems}
          defaultDepartmentId={currentDepartment?.id}
          defaultOwnerTeamId={modalTeamProps.defaultOwnerTeamId}
          leaderTeamIds={modalTeamProps.leaderTeamIds}
        />
      )}
    </div>
  );
};

export default Inventory;

