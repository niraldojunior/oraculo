import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEscapeKey } from '../hooks/useEscapeKey';
import type { Team, Collaborator, AppRole, TeamType, Department, Skill, Absence, Holiday, ClientTeam } from '../types';
import { Users, User, Edit2, Trash2, X, Plus, Minus, Search, Building2, Camera, Upload, Linkedin, Github, Mail, Phone, UserMinus, ShieldCheck, Briefcase, Zap, ZoomIn, ZoomOut, Cake, Award, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useView } from '../context/ViewContext';
import { useCallback } from 'react';



// --- Sub-components ---

const OrgNode: React.FC<{ 
  team: Team, 
  allTeams: Team[], 
  allUsers: Collaborator[],
  onView: (team: Team) => void,
  onEditCollab: (collab: Collaborator) => void,
  onAddSubTeam: (parentId: string) => void,
  canManageEntities: boolean,
  collapsedTeamIds: string[],
  onToggleCollapse: (id: string) => void
}> = ({ team, allTeams, allUsers, onView, onEditCollab, onAddSubTeam, canManageEntities, collapsedTeamIds, onToggleCollapse }) => {
  const isCollapsed = collapsedTeamIds.includes(team.id);
  const subTeams = allTeams.filter(t => t.parentTeamId === team.id);
  const leader = allUsers.find(u => u.id === team.leaderId);

  const getSubTreeTeamIds = (tId: string): string[] => {
    const children = allTeams.filter(t => t.parentTeamId === tId);
    return [tId, ...children.flatMap(child => getSubTreeTeamIds(child.id))];
  };
  const totalMemberCount = allUsers.filter(u => getSubTreeTeamIds(team.id).includes(u.squadId || '')).length;

  const typeColors: Record<TeamType, string> = {
    'Master': 'var(--type-master)',
    'Head': 'var(--type-vp)',
    'Diretoria': 'var(--type-diretoria)',
    'Gerencia': 'var(--type-gerencia)',
    'Lideranca': 'var(--type-lideranca)',
  };

  return (
    <li>
      <div className="org-node" style={{ position: 'relative' }}>
        <div 
          className="glass-panel glass-panel-interactive" 
          onClick={() => onView(team)}
          style={{ 
            padding: '1rem 1.25rem', 
            minWidth: '230px', 
            maxWidth: '230px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: '8px',
            border: '1px solid #94A3B8',
            borderTop: `4px solid ${typeColors[team.type]}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'left',
            position: 'relative',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {canManageEntities && (
            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0.3 }}>
              <Edit2 size={12} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ fontSize: '1rem', lineHeight: '1.2', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{team.name}</h3>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {canManageEntities && (
                <button 
                  className="btn-icon" 
                  onClick={(e) => { e.stopPropagation(); onAddSubTeam(team.id); }}
                  style={{ opacity: 0.6, background: 'rgba(255,255,255,0.1)', width: 24, height: 24, borderRadius: '4px' }}
                  title="Adicionar Sub-equipe"
                >
                  <Plus size={14} />
                </button>
              )}
              
              {/* Team Type Icon Badge */}
              <div 
                title={team.type}
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  backgroundColor: typeColors[team.type], 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)'
                }}
              >
                {team.type === 'Head' && <ShieldCheck size={14} />}
                {team.type === 'Diretoria' && <Building2 size={14} />}
                {team.type === 'Gerencia' && <Briefcase size={14} />}
                {team.type === 'Lideranca' && <Users size={14} />}
              </div>

              {/* Receptor Status Icon Badge */}
              {team.receivesInitiatives && (
                <div 
                  title="Receptor de Iniciativas"
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: '#F1F5F9', // Light Gray 
                    border: '1px solid #E2E8F0',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#64748B'
                  }}
                >
                  <Zap size={14} />
                </div>
              )}
            </div>
          </div>

          <div className="text-secondary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} /> {totalMemberCount} membros
          </div>

          <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--glass-border-strong)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {leader ? (
              <div 
                className={leader.bio ? "has-tooltip" : ""} 
                data-tooltip={leader.bio} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}
              >
                {leader.photoUrl ? (
                  <img src={leader.photoUrl} alt={leader.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-light)' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--glass-border)' }}>
                    <User size={22} color="var(--text-primary)" />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{leader.name}</div>
                  <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{leader.role}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sem líder designado</div>
            )}

            {/* Other members */}
            {allUsers.filter(u => u.squadId === team.id && u.id !== team.leaderId).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.25rem' }}>
                {allUsers.filter(u => u.squadId === team.id && u.id !== team.leaderId).map(member => (
                  <div 
                    key={member.id} 
                    className={member.bio ? "has-tooltip" : ""} 
                    data-tooltip={member.bio} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', opacity: 0.9 }}
                  >
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                        <User size={16} color="var(--text-primary)" />
                      </div>
                    )}
                    <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collapse/Expand Toggle */}
        {subTeams.length > 0 && (
          <div 
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(team.id); }}
            style={{
              position: 'absolute',
              bottom: '-12px',
              right: '25px',
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              zIndex: 20,
              border: '2.5px solid white'
            }}
            title={isCollapsed ? "Expandir ramo" : "Recolher ramo"}
            className="collapse-toggle-btn"
          >
            {isCollapsed ? (
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                <Plus size={12} strokeWidth={3} />{subTeams.length}
              </div>
            ) : (
              <Minus size={14} strokeWidth={3} />
            )}
          </div>
        )}
      </div>
      
      {!isCollapsed && subTeams.length > 0 && (
        <ul>
          {subTeams.map(subTeam => (
            <OrgNode 
              key={subTeam.id} 
              team={subTeam} 
              allTeams={allTeams} 
              allUsers={allUsers}
              onView={onView}
              onEditCollab={onEditCollab}
              onAddSubTeam={onAddSubTeam}
              canManageEntities={canManageEntities}
              collapsedTeamIds={collapsedTeamIds}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const MemberSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  allCollaborators: Collaborator[];
  currentTeamId: string;
  onInclude: (ids: string[]) => void;
  onCreateNew: () => void;
  canManageEntities: boolean;
}> = ({ isOpen, onClose, allCollaborators, currentTeamId, onInclude, onCreateNew, canManageEntities }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const availableCollabs = allCollaborators.filter(c => 
    c.squadId !== currentTeamId && 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100000 }}>
      <div className="glass-panel modal-content" style={{ maxWidth: '600px', width: '90%', background: 'white', padding: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
          <h2 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} /> Incluir Membros
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.4rem', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="search-box-premium" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <Search size={18} color="var(--text-tertiary)" />
          <input 
            placeholder="Pesquisar por nome ou e-mail..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', flex: 1, outline: 'none', fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
          {availableCollabs.map(c => (
            <div 
              key={c.id} 
              onClick={() => toggleSelect(c.id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                padding: '0.75rem 1rem', 
                cursor: 'pointer',
                background: selectedIds.has(c.id) ? 'rgba(var(--accent-rgb), 0.05)' : 'transparent',
                borderBottom: '1px solid var(--glass-border)',
                transition: 'background 0.2s'
              }}
            >
              <input type="checkbox" checked={selectedIds.has(c.id)} readOnly style={{ cursor: 'pointer' }} />
              {c.photoUrl ? (
                <img src={c.photoUrl} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                  <User size={16} className="text-tertiary" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{c.role}</div>
              </div>
            </div>
          ))}
          {availableCollabs.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Nenhum colaborador para incluir.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {canManageEntities ? (
            <button className="btn btn-glass" onClick={onCreateNew} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Plus size={16} /> Criar Colaborador
            </button>
          ) : <div></div>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            {canManageEntities && (
              <button 
                className="btn btn-primary" 
                disabled={selectedIds.size === 0}
                onClick={() => onInclude(Array.from(selectedIds))}
                style={{ minWidth: '120px' }}
              >
                Incluir {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamModal: React.FC<{
  team: Team;
  allCollaborators: Collaborator[];
  allTeams: Team[];
  onClose: () => void;
  onSave: (updatedTeam: Team) => void;
  onDelete: (teamId: string) => void;
  onAddCollab: (teamId: string) => void;
  onIncludeMembers: (teamId: string, memberIds: string[]) => void;
  onRemoveMember: (memberId: string) => void;
  onAddSubTeam: (parentId: string) => void;
  canManageEntities: boolean;
}> = ({ team, allCollaborators, allTeams, onClose, onSave, onDelete, onAddCollab, onIncludeMembers, onRemoveMember, onAddSubTeam, canManageEntities }) => {
  useEscapeKey(onClose);
  const { currentCompany, currentDepartment } = useAuth();
  const [formData, setFormData] = useState({
    name: team.name,
    type: team.type,
    leaderId: team.leaderId || '',
    parentTeamId: team.parentTeamId || '',
    departmentId: team.departmentId || currentDepartment?.id || '',
    companyId: team.companyId || currentCompany?.id || '',
    receivesInitiatives: team.receivesInitiatives || false
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  const teamMembers = allCollaborators.filter(c => c.squadId === team.id);

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ 
        maxWidth: '800px', 
        width: '95%', 
        background: 'white', 
        maxHeight: '90vh', 
        overflowY: 'auto',
        position: 'relative'
      }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
          <h2 className="modal-title" style={{ margin: 0 }}><Edit2 size={20} /> Gerenciar Equipe</h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.4rem', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {!showDeleteConfirm ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginTop: '1.5rem' }}>
              {/* Column 1: Team Data */}
              <form id="team-form" onSubmit={(e) => { e.preventDefault(); onSave({ ...team, ...formData, leaderId: formData.leaderId || null, parentTeamId: formData.parentTeamId || null }); }} className="form-container" style={{ gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Nome da Equipe</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as TeamType })}>
                    <option value="Head">Head</option>
                    <option value="Diretoria">Diretoria</option>
                    <option value="Gerencia">Gerencia</option>
                    <option value="Lideranca">Lideranca</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)', cursor: 'pointer' }} onClick={() => setFormData({ ...formData, receivesInitiatives: !formData.receivesInitiatives })}>
                  <input 
                    type="checkbox" 
                    checked={formData.receivesInitiatives} 
                    onChange={e => setFormData({ ...formData, receivesInitiatives: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', margin: 0 }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800 }}>Receptor de Iniciativas</label>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Esta equipe pode ser selecionada como executora de demandas</span>
                  </div>
                </div>



                <div className="form-group">
                  <label>Equipe Superior</label>
                  <select value={formData.parentTeamId} onChange={e => setFormData({ ...formData, parentTeamId: e.target.value })}>
                    <option value="">Raiz</option>
                    {allTeams.filter(t => t.id !== team.id).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Líder</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {(() => {
                      const leader = allCollaborators.find(c => c.id === formData.leaderId);
                      if (leader?.photoUrl) {
                        return <img src={leader.photoUrl} alt={leader.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-light)' }} />;
                      }
                      return (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--glass-border)', flexShrink: 0 }}>
                          <User size={22} color="var(--text-primary)" />
                        </div>
                      );
                    })()}
                    <select style={{ flex: 1 }} value={formData.leaderId} onChange={e => setFormData({ ...formData, leaderId: e.target.value })}>
                      <option value="">Nenhum líder</option>
                      {allCollaborators.filter(c => {
                        const isMember = c.squadId === team.id;
                        if (!isMember) return false;
                        
                        const roleMap: Record<string, string[]> = {
                          'Head': ['Head'],
                          'Diretoria': ['Director'],
                          'Gerencia': ['Manager'],
                          'Lideranca': ['Lead Engineer', 'Engineer', 'Analyst', 'QA']
                        };
                        return (roleMap[formData.type] || []).includes(c.role);
                      }).map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>

              {/* Column 2: Hierarchy & Members */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={18} className="text-secondary" /> Sub-equipes
                    </h3>
                    <button className="btn btn-glass btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onAddSubTeam(team.id)}>
                       <Plus size={16} /> Criar Equipe
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {allTeams.filter(t => t.parentTeamId === team.id).map(st => (
                      <span key={st.id} className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border-strong)', padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 800 }}>
                        {st.name}
                      </span>
                    ))}
                    {allTeams.filter(t => t.parentTeamId === team.id).length === 0 && (
                      <div className="text-secondary" style={{ fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem' }}>Nenhuma sub-equipe vinculada.</div>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={18} className="text-secondary" /> Membros ({teamMembers.length})
                    </h3>
                    <button className="btn btn-glass btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setShowSelectionModal(true)}>
                       Incluir
                    </button>
                  </div>

                  <MemberSelectionModal 
                    isOpen={showSelectionModal}
                    onClose={() => setShowSelectionModal(false)}
                    allCollaborators={allCollaborators}
                    currentTeamId={team.id}
                    onInclude={(ids) => {
                      onIncludeMembers(team.id, ids);
                      setShowSelectionModal(false);
                    }}
                    onCreateNew={() => {
                      setShowSelectionModal(false);
                      onAddCollab(team.id);
                    }}
                    canManageEntities={canManageEntities}
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {teamMembers.map(m => (
                      <div key={m.id} className="flex-between" style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          {m.photoUrl ? (
                             <img src={m.photoUrl} alt={m.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                              <User size={18} color="var(--text-primary)" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{m.name}</div>
                            <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{m.role}</div>
                          </div>
                        </div>
                        <button className="btn-icon" onClick={() => onRemoveMember(m.id)} title="Remover da Equipe" style={{ opacity: 0.6, color: 'var(--status-red)' }}><UserMinus size={18} /></button>
                      </div>
                    ))}
                    {teamMembers.length === 0 && (
                      <div className="text-secondary" style={{ textAlign: 'center', fontSize: '0.9rem', padding: '2rem', fontStyle: 'italic' }}>
                        Esta equipe ainda não possui membros cadastrados.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {canManageEntities && (
              <div className="form-actions" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-danger-dim" onClick={() => setShowDeleteConfirm(true)} style={{ padding: '0.6rem 1.2rem' }}>
                  <Trash2 size={18} /> Excluir Equipe
                </button>
                <button type="submit" form="team-form" className="btn btn-primary" style={{ minWidth: '160px' }}>
                  Salvar Alterações
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="confirm-delete">
            <Trash2 size={48} color="var(--status-red)" />
            <h3>Tem certeza?</h3>
            <p>A exclusão da equipe "{team.name}" não poderá ser desfeita.</p>
            <div className="form-actions-stack">
              <button onClick={() => onDelete(team.id)} className="btn btn-danger">Sim, Remover Equipe</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-glass">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const renderSkillAvatar = (skill: Skill | Partial<Skill>, size: number = 32) => {
  if (skill.icon) {
    return <img src={skill.icon} alt={skill.name} style={{ width: size, height: size, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />;
  }
  const initials = (skill.name || 'S').slice(0, 2).toUpperCase();
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const colorIndex = (skill.id || skill.name || '').length % colors.length;
  return (
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: '8px', 
      background: colors[colorIndex], 
      color: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontSize: `${size * 0.4}px`, 
      fontWeight: 800,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
    }}>
      {initials}
    </div>
  );
};

const SkillModal: React.FC<{
  skill: Partial<Skill>;
  allCollaborators: Collaborator[];
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  canManageEntities: boolean;
}> = ({ skill, allCollaborators, onClose, onSave, onDelete, canManageEntities }) => {
  useEscapeKey(onClose);
  const [formData, setFormData] = useState({
    name: skill.name || '',
    description: skill.description || '',
    familia: skill.familia || '',
    icon: skill.icon || '',
    memberIds: skill.collaborators?.map(c => c.collaborator.id) || []
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, icon: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ 
        maxWidth: '860px', 
        width: '95%', 
        background: 'white',
        maxHeight: '94vh',
        overflowY: 'hidden',
        position: 'relative',
        padding: '1.25rem 1.5rem'
      }}>
        <div className="flex-between" style={{ marginBottom: '0.75rem', alignItems: 'center' }}>
          <h2 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Award size={22} color="var(--accent-base)" />
            {skill.id ? ' Editar Skill' : ' Nova Skill'}
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.4rem', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!showDeleteConfirm ? (
          <form onSubmit={(e) => { e.preventDefault(); onSave({ ...skill, ...formData }); }} className="form-container">
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              {/* Left Column: Skill Info */}
              <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '12px', 
                      background: 'var(--bg-dark)', 
                      border: '2px dashed var(--glass-border-strong)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    {formData.icon ? (
                      <img src={formData.icon} alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <Upload size={24} className="text-secondary" />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Ícone</span>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="form-group">
                      <label>Nome da Skill</label>
                      <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: React, Gestão de Projetos..." />
                    </div>
                    <div className="form-group">
                      <label>Família</label>
                      <input value={formData.familia} onChange={e => setFormData({ ...formData, familia: e.target.value })} placeholder="Ex: Backend, Design, Soft Skills..." />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Descrição</label>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    required 
                    placeholder="Descreva o que se espera de alguém com esta habilidade..."
                    style={{ minHeight: '120px', maxHeight: '130px', width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--glass-border)', outline: 'none', resize: 'none', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Right Column: Collaborators */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="form-group" style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '12px', border: '1px solid #E2E8F0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} color="#64748B" /> Colaboradores Habilitados
                    </label>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>{formData.memberIds.length} selecionados</div>
                  </div>

                  <div style={{ overflowY: 'auto', minHeight: '80px', maxHeight: '160px', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '0.4rem', marginBottom: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    {formData.memberIds.map(mid => {
                      const collab = allCollaborators.find(c => c.id === mid);
                      if (!collab) return null;
                      return (
                        <div key={mid} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          background: '#F1F5F9', 
                          padding: '0.4rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          border: '1px solid #E2E8F0', 
                          fontWeight: 600,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          height: 'fit-content'
                        }}>
                          {collab.photoUrl ? (
                             <img src={collab.photoUrl} alt={collab.name} style={{ width: 18, height: 18, borderRadius: '50%' }} />
                          ) : (
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
                              {collab.name.charAt(0)}
                            </div>
                          )}
                          <span>{collab.name}</span>
                          <X size={14} style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={() => setFormData({ ...formData, memberIds: formData.memberIds.filter(id => id !== mid) })} />
                        </div>
                      );
                    })}
                    {formData.memberIds.length === 0 && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
                        Nenhum colaborador selecionado. Escolha na lista abaixo para adicionar.
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex' }}>
                    <select 
                      value=""
                      onChange={e => {
                        const val = e.target.value;
                        if (val && !formData.memberIds.includes(val)) {
                          setFormData({ ...formData, memberIds: [...formData.memberIds, val] });
                        }
                      }}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem', background: 'white', cursor: 'pointer', color: '#64748B', fontWeight: 600 }}
                    >
                      <option value="">+ Adicionar Colaborador</option>
                      {allCollaborators
                        .filter(c => !formData.memberIds.includes(c.id))
                        .sort((a,b) => a.name.localeCompare(b.name))
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {canManageEntities && (
              <div className="form-actions" style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                {skill.id && (
                  <button type="button" className="btn btn-danger-dim" onClick={() => setShowDeleteConfirm(true)}>
                    Excluir Skill
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ minWidth: '160px' }}>
                  Salvar Skill
                </button>
              </div>
            )}
          </form>
        ) : (
          <div className="confirm-delete" style={{ textAlign: 'center', padding: '1rem' }}>
            <Trash2 size={48} color="var(--status-red)" style={{ marginBottom: '1rem' }} />
            <h3>Excluir "{skill.name}"?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Esta habilidade será removida de todos os colaboradores associados.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => onDelete?.(skill.id!)} className="btn btn-danger">Confirmar Exclusão</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-glass">Voltar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CollaboratorModal: React.FC<{
  collaborator: Collaborator | Partial<Collaborator>;
  allTeams: Team[];
  onClose: () => void;
  onSave: (updated: Collaborator) => void;
  onDelete?: (id: string) => void;
  allDepartments: Department[];
  canManageEntities: boolean;
}> = ({ collaborator, allTeams, onClose, onSave, onDelete, allDepartments, canManageEntities }) => {
  useEscapeKey(onClose);
  const [formData, setFormData] = useState({
    name: collaborator.name || '',
    email: collaborator.email || '',
    role: (collaborator.role as AppRole) || 'Engineer',
    squadId: (collaborator as Collaborator).squadId || '',
    departmentId: collaborator.departmentId || allDepartments[0]?.id || '',
    photoUrl: collaborator.photoUrl || '',
    phone: collaborator.phone || '',
    bio: collaborator.bio || '',
    linkedinUrl: collaborator.linkedinUrl || '',
    githubUrl: collaborator.githubUrl || '',
    birthday: (collaborator.birthday ? collaborator.birthday.split('-').reverse().join('/') : ''),
    startDate: collaborator.startDate || '',
    endDate: collaborator.endDate || '',
    uf: (collaborator as Collaborator).uf || ''
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ 
        maxWidth: '820px', 
        width: '92%', 
        background: 'white',
        maxHeight: '94vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '1.2rem 2rem'
      }}>
        <div className="flex-between" style={{ marginBottom: '1rem', alignItems: 'center' }}>
          <h2 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
            {collaborator.id ? <Edit2 size={18} /> : <Plus size={18} />} 
            {collaborator.id ? ' Editar Colaborador' : ' Novo Colaborador'}
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.3rem', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {!showDeleteConfirm ? (
          <>
            <form id="collab-form" onSubmit={(e) => { 
              e.preventDefault(); 
              // Convert DD/MM back to MM-DD
              let bDay = formData.birthday;
              if (bDay && bDay.includes('/')) {
                const [d, m] = bDay.split('/');
                bDay = `${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
              }
              onSave({ 
                ...(collaborator as Collaborator), 
                ...formData, 
                birthday: bDay || undefined,
                id: collaborator.id || `c_${Date.now()}`,
                skills: (collaborator as Collaborator).skills || []
              }); 
            }} className="form-container" style={{ display: 'contents' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem' }}>
                {/* Column 1: Basic Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'var(--bg-dark)', 
                        border: '2px dashed var(--glass-border-strong)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative',
                        flexShrink: 0
                      }}
                    >
                      {formData.photoUrl ? (
                        <>
                          <img src={formData.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', padding: '2px', display: 'flex', justifyContent: 'center' }}>
                            <Camera size={14} color="white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload size={24} className="text-secondary" />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Foto</span>
                        </>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="form-group">
                        <label>Nome Completo</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                      </div>
                    </div>
                  </div>

                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

                  <div className="form-group">
                    <label>E-mail Corporativo</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>

                  <div className="form-group">
                    <label>Telefone / WhatsApp</label>
                    <input placeholder="+55 (11) 99999-9999" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label>Cargo / Papel</label>
                      <select 
                        value={formData.role} 
                        onChange={e => {
                          const newRole = e.target.value as AppRole;
                          const roleToTeamType: Record<AppRole, TeamType[]> = {
                            'Head': ['Head'],
                            'Director': ['Diretoria'],
                            'Master': ['Master'],
                            'Manager': ['Gerencia'],
                            'Lead Engineer': ['Lideranca', 'Gerencia'],
                            'Engineer': ['Lideranca', 'Gerencia'],
                            'Analyst': ['Lideranca', 'Gerencia'],
                            'QA': ['Lideranca', 'Gerencia']
                          };
                          const allowedTypes = roleToTeamType[newRole];
                          const currentTeam = allTeams.find(t => t.id === formData.squadId);
                          const isStillValid = currentTeam && allowedTypes.includes(currentTeam.type);
                          setFormData({ ...formData, role: newRole, squadId: isStillValid ? formData.squadId : '' });
                        }}
                      >
                        <option value="Head">Head</option>
                        <option value="Director">Director</option>
                        <option value="Manager">Manager</option>
                        <option value="Lead Engineer">Lead Engineer</option>
                        <option value="Engineer">Engineer</option>
                        <option value="Analyst">Analyst</option>
                        <option value="QA">QA</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Equipe</label>
                      <select value={formData.squadId} onChange={e => setFormData({ ...formData, squadId: e.target.value })}>
                        <option value="">Sem equipe</option>
                        {allTeams.filter(t => {
                          const roleToTeamType: Record<AppRole, TeamType[]> = {
                            'Head': ['Head'],
                            'Director': ['Diretoria'],
                            'Master': ['Master'],
                            'Manager': ['Gerencia'],
                            'Lead Engineer': ['Lideranca', 'Gerencia'],
                            'Engineer': ['Lideranca', 'Gerencia'],
                            'Analyst': ['Lideranca', 'Gerencia'],
                            'QA': ['Lideranca', 'Gerencia']
                          };
                          return roleToTeamType[formData.role].includes(t.type);
                        }).map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label>Data de Início (Admissão)</label>
                      <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Data de Saída (Desligamento)</label>
                      <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Column 2: Bio & Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div className="form-group">
                    <label>Apresentação</label>
                    <textarea 
                      placeholder="Conte um pouco sobre a trajetória e especialidade..."
                      value={formData.bio} 
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      style={{ resize: 'none', height: '110px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Perfil LinkedIn (URL)</label>
                    <input 
                      placeholder="https://linkedin.com/in/usuario"
                      value={formData.linkedinUrl} 
                      onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Perfil GitHub (URL)</label>
                    <input 
                      placeholder="https://github.com/usuario"
                      value={formData.githubUrl} 
                      onChange={e => setFormData({ ...formData, githubUrl: e.target.value })} 
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label>Aniversário (DD/MM)</label>
                      <input 
                        placeholder="Ex: 15/05"
                        value={formData.birthday} 
                        onChange={e => {
                          let val = e.target.value.replace(/[^0-9/]/g, '');
                          if (val.length === 2 && !val.includes('/')) val += '/';
                          if (val.length > 5) val = val.substring(0, 5);
                          setFormData({ ...formData, birthday: val });
                        }} 
                      />
                    </div>

                    <div className="form-group">
                      <label>UF (Estado)</label>
                      <select value={formData.uf} onChange={e => setFormData({ ...formData, uf: e.target.value })}>
                        <option value="">Selecione...</option>
                        {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {canManageEntities && (
              <div className="form-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                {collaborator.id && onDelete && (
                  <button type="button" className="btn btn-danger-dim" onClick={() => setShowDeleteConfirm(true)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Trash2 size={16} /> Excluir Registro
                  </button>
                )}
                <button type="submit" form="collab-form" className="btn btn-primary" style={{ minWidth: '140px', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                  {collaborator.id ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="confirm-delete">
            <Trash2 size={48} color="var(--status-red)" />
            <h3>Excluir Colaborador?</h3>
            <p>O registro de "{formData.name}" será removido permanentemente.</p>
            <div className="form-actions-stack">
              <button onClick={() => onDelete!(collaborator.id!)} className="btn btn-danger">Sim, Remover Registro</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-glass">Cancelar</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group label { font-size: 0.75rem; margin-bottom: 0.2rem; }
        .form-group input, .form-group select, .form-group textarea { font-size: 0.85rem; padding: 0.5rem 0.75rem; }
      `}</style>
    </div>
  );
};

// --- New Detail Modal ---
const CollaboratorDetailModal: React.FC<{
  collaborator: Collaborator;
  teamName: string;
  onClose: () => void;
  onEdit: (collab: Collaborator) => void;
  onDelete: (id: string) => void;
  absences: Absence[];
  canManageEntities: boolean;
}> = ({ collaborator, teamName, onClose, onEdit, onDelete, absences, canManageEntities }) => {
  useEscapeKey(onClose);
  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ 
        maxWidth: '850px', 
        width: '95%', 
        background: 'white',
        padding: '0',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <button 
          onClick={onClose} 
          className="btn-icon" 
          style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem', 
            zIndex: 10,
            background: 'var(--bg-app)', 
            color: 'var(--text-secondary)', 
            border: '1px solid var(--glass-border)' 
          }}
        >
          <X size={20} />
        </button>

        <div style={{ padding: '2rem 1.75rem', display: 'grid', gridTemplateColumns: '230px 1fr', gap: '2rem' }}>
          {/* Left Column: Essential Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              {collaborator.photoUrl ? (
                <img src={collaborator.photoUrl} alt={collaborator.name} style={{ width: 130, height: 130, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: 'var(--shadow-lg)' }} />
              ) : (
                <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: 'var(--shadow-lg)' }}>
                  <User size={60} color="var(--text-tertiary)" />
                </div>
              )}
            </div>
            
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{collaborator.name}</h2>
            <div data-role={collaborator.role} style={{ 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              padding: '0.35rem 1.25rem', 
              borderRadius: '20px', 
              background: '#000', 
              color: '#FFD700', 
              marginBottom: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>{collaborator.role}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'center', padding: '0.6rem 1rem', background: '#F1F5F9', borderRadius: '10px', width: '100%', border: '1px solid var(--glass-border)' }}>
               <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Equipe</span>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                 <Building2 size={14} className="text-secondary" /> {teamName}
               </div>
            </div>
          </div>

          {/* Right Column: Contacts and Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top Row: Contact info merged */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                  <Mail size={16} className="text-tertiary" /> <span style={{ color: 'var(--text-primary)' }}>{collaborator.email}</span>
                </div>
                {collaborator.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                    <Phone size={16} className="text-tertiary" /> <span style={{ color: 'var(--text-primary)' }}>{collaborator.phone}</span>
                  </div>
                )}
                {collaborator.birthday && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                    <Cake size={16} className="text-tertiary" /> <span style={{ color: 'var(--text-primary)' }}>{collaborator.birthday.split('-').reverse().join('/')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {collaborator.linkedinUrl && (
                    <a href={collaborator.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" style={{ background: '#E0F2FE', color: '#0369A1', width: '32px', height: '32px', border: 'none', borderRadius: '50%' }} title="LinkedIn">
                      <Linkedin size={16} />
                    </a>
                  )}
                  {collaborator.githubUrl && (
                    <a href={collaborator.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" style={{ background: '#F1F5F9', color: '#1E293B', width: '32px', height: '32px', border: 'none', borderRadius: '50%' }} title="GitHub">
                      <Github size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Presentation/Bio Section */}
             {collaborator.bio && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Apresentação</span>
                 <div className="text-secondary" style={{ 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    background: 'white', 
                    padding: '1.25rem', 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
                  }}>
                   {collaborator.bio}
                 </div>
              </div>
            )}

            {/* Absence History */}
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Ausências / Férias</span>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                 {absences.filter(a => a.collaboratorId === collaborator.id).length > 0 ? (
                   absences.filter(a => a.collaboratorId === collaborator.id).sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 5).map(a => (
                     <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                         <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.type === 'Férias' ? 'var(--status-green)' : 'var(--accent-base)' }}></div>
                         <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{a.type}</span>
                           <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                             {new Date(a.startDate).toLocaleDateString('pt-BR')} - {new Date(a.endDate).toLocaleDateString('pt-BR')}
                           </span>
                         </div>
                       </div>
                       {a.reason && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.reason}>{a.reason}</span>}
                     </div>
                   ))
                 ) : (
                   <div style={{ padding: '1rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #E2E8F0', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                     Nenhuma ausência registrada.
                   </div>
                 )}
               </div>
            </div>

            {canManageEntities && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1rem' }}>
                <button className="btn btn-danger-dim" onClick={() => onDelete(collaborator.id)} style={{ padding: '0.65rem', flex: 1, fontSize: '0.85rem', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', borderRadius: '8px' }}>
                  <Trash2 size={16} /> Excluir Colaborador
                </button>
                <button className="btn btn-primary" onClick={() => onEdit(collaborator)} style={{ padding: '0.65rem', flex: 1, fontSize: '0.85rem', background: '#FDE047', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 700 }}>
                  <Edit2 size={16} /> Editar Perfil
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



const TeamDetailModal: React.FC<{
  team: Team;
  allTeams: Team[];
  allUsers: Collaborator[];
  onClose: () => void;
  onEdit: (team: Team) => void;
  onDelete: (id: string) => void;
  onViewCollaborator: (collab: Collaborator) => void;
  canManageEntities: boolean;
}> = ({ team, allTeams, allUsers, onClose, onEdit, onDelete, onViewCollaborator, canManageEntities }) => {
  // Recursive calculation of all members in the sub-tree
  const getSubTreeTeamIds = (tId: string): string[] => {
    const children = allTeams.filter(t => t.parentTeamId === tId);
    return [tId, ...children.flatMap(child => getSubTreeTeamIds(child.id))];
  };
  const descendantTeamIds = getSubTreeTeamIds(team.id);
  const totalMemberCount = allUsers.filter(u => descendantTeamIds.includes(u.squadId || '')).length;

  const typeColors: Record<TeamType, string> = {
    'Master': 'var(--type-master)',
    'Head': 'var(--type-vp)',
    'Diretoria': 'var(--type-diretoria)',
    'Gerencia': 'var(--type-gerencia)',
    'Lideranca': 'var(--type-lideranca)',
  };

  useEscapeKey(onClose);
  const leader = allUsers.find(u => u.id === team.leaderId);
  const parentTeam = allTeams.find(t => t.id === team.parentTeamId);
  const directMembers = allUsers.filter(u => u.squadId === team.id);

  // Find sub-team leaders
  const subTeams = allTeams.filter(t => t.parentTeamId === team.id);
  const subTeamLeaders = subTeams
    .map(st => allUsers.find(u => u.id === st.leaderId))
    .filter((u): u is Collaborator => !!u);

  // Combine members for display
  const allDisplayMembers = [...directMembers];
  subTeamLeaders.forEach(sl => {
    if (!allDisplayMembers.find(m => m.id === sl.id)) {
      allDisplayMembers.push(sl);
    }
  });

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ 
        maxWidth: '850px', 
        width: '95%', 
        background: 'white',
        padding: '0',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={onClose} className="btn-icon" style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '3rem' }}>
          {/* Left Column: Team Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', borderRight: '1px solid var(--glass-border)', paddingRight: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '4px', height: '32px', background: typeColors[team.type], borderRadius: '2px' }} />
              <div className="badge" style={{ backgroundColor: 'hsla(225, 20%, 30%, 0.5)', fontSize: '0.75rem', border: '1px solid var(--glass-border)' }}>
                {team.type}
              </div>
              {team.receivesInitiatives && (
                <div className="badge" style={{ backgroundColor: '#10B981', color: 'white', fontSize: '0.75rem', border: 'none' }}>
                  Receptor
                </div>
              )}
            </div>
            
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{team.name}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                 <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Equipe Superior</span>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                   <Building2 size={20} className="text-secondary" /> {parentTeam?.name || 'Nível Raiz'}
                 </div>
              </div>

              {leader && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                   <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Líder</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                      {leader.photoUrl ? (
                        <img src={leader.photoUrl} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} /></div>
                      )}
                      {leader.name}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Context */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 800 }}>
                  <Users size={20} className="text-tertiary" /> <span>{totalMemberCount} membros</span>
                </div>
                {directMembers.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    ({directMembers.length} diretos)
                  </div>
                )}
              </div>
            </div>

            {/* Members Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Membros da Equipe</span>
               <div style={{ 
                 background: 'rgba(0,0,0,0.015)', 
                 padding: '1.5rem', 
                 borderRadius: '16px', 
                 border: '1px solid var(--glass-border)',
                 height: '240px',
                 overflowY: 'auto'
               }}>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                   {allDisplayMembers.map(m => (
                     <div 
                       key={m.id} 
                       onClick={() => onViewCollaborator(m)}
                       style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '0.75rem', 
                         padding: '0.75rem', 
                         background: 'white', 
                         borderRadius: '12px', 
                         border: '1px solid var(--glass-border)', 
                         boxShadow: 'var(--shadow-sm)',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       className="member-card-clickable"
                     >
                       {m.photoUrl ? (
                         <img src={m.photoUrl} alt={m.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                       ) : (
                         <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <User size={16} className="text-tertiary" />
                         </div>
                       )}
                       <div style={{ overflow: 'hidden' }}>
                         <div style={{ fontWeight: 800, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                           {m.role}
                           {!directMembers.find(dm => dm.id === m.id) && (
                             <span style={{ marginLeft: '0.4rem', fontStyle: 'italic', fontSize: '0.65rem', color: 'var(--accent-base)' }}>(Líder Sub-equipe)</span>
                           )}
                         </div>
                       </div>
                     </div>
                   ))}
                   {allDisplayMembers.length === 0 && (
                     <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                       Nenhum membro vinculado a esta equipe.
                     </div>
                   )}
                 </div>
               </div>
            </div>

            {canManageEntities && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1.5rem' }}>
                <button className="btn btn-danger-dim" onClick={() => onDelete(team.id)} style={{ flex: 1, padding: '0.8rem' }}>
                  <Trash2 size={18} /> Excluir Equipe
                </button>
                <button className="btn btn-primary" onClick={() => onEdit(team)} style={{ flex: 1, padding: '0.8rem' }}>
                  <Edit2 size={18} /> Editar Equipe
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkillsView: React.FC<{
  onEdit: (skill: Skill) => void;
  skills: Skill[];
  onDelete: (id: string) => void;
}> = ({ onEdit, skills, onDelete }) => {
  if (skills.length === 0) {
    return (
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '12px', color: 'var(--text-tertiary)', padding: '4rem', border: '1px solid var(--glass-border-strong)', boxShadow: 'var(--shadow-md)' }}>
        <Award size={64} strokeWidth={1} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Nenhuma Skill Cadastrada</h3>
        <p style={{ fontSize: '0.85rem', margin: 0 }}>Clique no botão "+" no topo para cadastrar a primeira habilidade do departamento.</p>
      </div>
    );
  }

  return (
    <div className="people-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="glass-panel" style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid var(--glass-border-strong)', boxShadow: 'var(--shadow-md)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', width: '0%' }}></th>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', width: '10%' }}>Nome da Skill</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', width: '46%' }}>Descrição</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', width: '10%' }}>Família</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', width: '22%' }}>Colaboradores</th>
              <th style={{ position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', width: '8%' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {skills.map(skill => (
              <tr 
                key={skill.id} 
                className="table-row-premium" 
                onClick={() => onEdit(skill)}
                style={{ cursor: 'pointer' }}
              >
                <td style={{ padding: '1rem 0.75rem' }}>
                  {renderSkillAvatar(skill, 32)}
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{skill.name}</div>
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)', 
                    lineHeight: '1.4',
                    maxWidth: '560px',
                    whiteSpace: 'pre-line'
                  }}>
                    {skill.description}
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{skill.familia || '-'}</div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: '64px', overflowY: 'auto', padding: '0.25rem 0' }}>
                    {skill.collaborators?.map(sc => (
                      <div key={sc.collaborator.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F8FAFC', padding: '0.2rem 0.5rem', borderRadius: '20px', border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                        {sc.collaborator.photoUrl ? (
                          <img src={sc.collaborator.photoUrl} alt={sc.collaborator.name} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
                            {sc.collaborator.name.charAt(0)}
                          </div>
                        )}
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#334155' }}>
                          {sc.collaborator.name.split(' ')[0]}
                        </span>
                      </div>
                    ))}
                    {(!skill.collaborators || skill.collaborators.length === 0) && (
                      <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.7rem' }}>Ninguém habilitado</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn-icon" onClick={() => onEdit(skill)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn-icon" onClick={() => onDelete(skill.id)} style={{ color: 'var(--status-red)' }} title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AbsenceModal: React.FC<{
  absence: Partial<Absence>;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  collaborators: Collaborator[];
}> = ({ absence, onClose, onSave, onDelete, collaborators }) => {
  const [formData, setFormData] = useState({
    collaboratorId: absence.collaboratorId || '',
    type: absence.type || 'Férias',
    startDate: absence.startDate || '',
    endDate: absence.endDate || '',
    reason: absence.reason || ''
  });

  useEscapeKey(onClose);

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ maxWidth: '450px', width: '90%', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Registrar Indisponibilidade</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Colaborador</label>
            <select value={formData.collaboratorId} onChange={e => setFormData({ ...formData, collaboratorId: e.target.value })} disabled={!!absence.collaboratorId}>
              <option value="">Selecione...</option>
              {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option value="Férias">Férias</option>
              <option value="Folga">Folga</option>
              <option value="Licença Médica">Licença Médica</option>
              <option value="Treinamento">Treinamento</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Data Início</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Data Fim</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} style={{ minHeight: '80px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          {absence.id && onDelete && (
            <button className="btn btn-danger-dim" onClick={() => onDelete(absence.id!)} style={{ flex: 1 }}>Excluir</button>
          )}
          <button className="btn btn-primary" onClick={() => onSave({ ...absence, ...formData })} style={{ flex: 2 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
};

const HolidayModal: React.FC<{
  holiday: Partial<Holiday>;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: string) => void;
  companyId: string;
}> = ({ holiday, onClose, onSave, onDelete, companyId }) => {
  const [formData, setFormData] = useState({
    name: holiday.name || '',
    date: holiday.date || '',
    companyId: holiday.companyId || companyId,
    scope: holiday.scope || 'nacional' as 'nacional' | 'estadual',
    uf: holiday.uf || ''
  });

  useEscapeKey(onClose);

  return (
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ maxWidth: '400px', width: '90%', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{holiday.id ? 'Editar Feriado' : 'Novo Feriado'}</h2>
          <button onClick={onClose} className="btn-icon"><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Nome do Feriado</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Natal" />
          </div>
          <div className="form-group">
            <label>Data</label>
            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select value={formData.scope} onChange={e => setFormData({ ...formData, scope: e.target.value as 'nacional' | 'estadual', uf: e.target.value === 'nacional' ? '' : formData.uf })}>
              <option value="nacional">Nacional</option>
              <option value="estadual">Estadual</option>
            </select>
          </div>
          {formData.scope === 'estadual' && (
            <div className="form-group">
              <label>UF</label>
              <select value={formData.uf} onChange={e => setFormData({ ...formData, uf: e.target.value })}>
                <option value="">Selecione o estado...</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          {holiday.id && onDelete && (
            <button className="btn btn-danger-dim" onClick={() => onDelete(holiday.id!)} style={{ flex: 1 }}>Excluir</button>
          )}
          <button className="btn btn-primary" onClick={() => onSave({ ...holiday, ...formData })} style={{ flex: 2 }}>Salvar</button>
        </div>
      </div>
    </div>
  );
};

const CapacityView: React.FC<{
  collaborators: Collaborator[];
  teams: Team[];
  absences: Absence[];
  holidays: Holiday[];
  dimension: 'Ano' | 'Trimestre' | 'Mês' | 'Semana';
  setDimension: (d: 'Ano' | 'Trimestre' | 'Mês' | 'Semana') => void;
  managerFilter: string;
  setManagerFilter: (m: string) => void;
  onAddAbsence: (collabId: string, start: string, end: string) => void;
  onEditAbsence: (absence: Absence) => void;
  onAddHoliday: () => void;
  onEditHoliday: (holiday: Holiday) => void;
}> = ({ collaborators, teams, absences, holidays, dimension, setDimension, managerFilter, setManagerFilter, onAddAbsence, onEditAbsence, onAddHoliday, onEditHoliday }) => {
  const [isManagerMenuOpen, setIsManagerMenuOpen] = useState(false);
  const [isDimMenuOpen, setIsDimMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(960);

  useEffect(() => {
    const timeline = scrollRef.current;
    if (!timeline) return;

    const updateWidth = () => {
      if (timeline.clientWidth > 0) {
        setTimelineViewportWidth(timeline.clientWidth);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(timeline);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const left = leftColRef.current;
    const right = scrollRef.current;
    if (!left || !right) return;
    const onRightScroll = () => {
      left.scrollTop = right.scrollTop;
    };
    right.addEventListener('scroll', onRightScroll);
    return () => {
      right.removeEventListener('scroll', onRightScroll);
    };
  }, []);

  // Busca todos os times sob um líder (recursivo via parentTeamId)
  function getAllTeamIdsUnderLeader(leaderId: string): string[] {
    // Times liderados diretamente
    const directTeams = teams.filter(t => t.leaderId === leaderId);
    let allTeamIds: string[] = [];
    for (const team of directTeams) {
      allTeamIds.push(team.id);
      // Busca times filhos via parentTeamId (recursivo)
      const addChildren = (parentId: string) => {
        const childTeams = teams.filter(t => t.parentTeamId === parentId);
        for (const child of childTeams) {
          if (!allTeamIds.includes(child.id)) {
            allTeamIds.push(child.id);
            addChildren(child.id);
          }
        }
      };
      addChildren(team.id);
    }
    return allTeamIds;
  }

  const roleOrder: Record<string, number> = {
    'Director': 1, 'Head': 1, 'Manager': 2, 'Lead Engineer': 3, 'Analyst': 4, 'Engineer': 5, 'QA': 6
  };
  const sortByRole = (list: typeof collaborators) =>
    [...list].sort((a, b) => (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99));

  // Filtro de colaboradores conforme papel do gestor selecionado
  const filteredCollabs = useMemo(() => {
    if (managerFilter === 'Todos') return sortByRole(collaborators);
    const selected = collaborators.find(c => c.id === managerFilter);
    const allTeamIds = getAllTeamIdsUnderLeader(managerFilter);
    // Todos os membros de todos os times subordinados
    const inOrg = collaborators.filter(c => c.squadId && allTeamIds.includes(c.squadId));
    if (selected?.role === 'Director') {
      // Diretor: traz diretores e gerentes subordinados a qualquer nível
      return sortByRole(inOrg.filter(c => c.role === 'Director' || c.role === 'Manager'));
    }
    // Gerente ou outro: traz todos os funcionários
    return sortByRole(inOrg);
  }, [managerFilter, collaborators, teams]);

  // Timeline Range Logic
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const startDate = new Date(today);
  if (dimension === 'Semana') startDate.setDate(today.getDate() - 14);
  else if (dimension === 'Mês') startDate.setMonth(today.getMonth() - 1);
  else if (dimension === 'Trimestre') startDate.setMonth(today.getMonth() - 3);
  else startDate.setMonth(today.getMonth() - 12);
  startDate.setDate(1);

  const endDate = new Date(startDate);
  if (dimension === 'Semana') endDate.setDate(startDate.getDate() + 42);
  else if (dimension === 'Mês') endDate.setMonth(startDate.getMonth() + 4);
  else if (dimension === 'Trimestre') endDate.setMonth(startDate.getMonth() + 12);
  else endDate.setFullYear(startDate.getFullYear() + 2);

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const visibleDays = dimension === 'Semana' ? 20 : dimension === 'Mês' ? 40 : null;
  const pxPerDay = visibleDays
    ? Math.max(timelineViewportWidth / visibleDays, dimension === 'Semana' ? 32 : 24)
    : dimension === 'Trimestre'
      ? 10
      : 4;
  const gridWidth = totalDays * pxPerDay;
  const showDayHeader = dimension === 'Semana' || dimension === 'Mês';
  const showCapacityTotalsHeader = showDayHeader;
  const topHeaderHeight = dimension === 'Mês' ? 34 : 40;
  const dayHeaderHeight = showDayHeader ? 32 : 0;
  const capacityTotalsHeaderHeight = showCapacityTotalsHeader ? 28 : 0;
  const totalHeaderHeight = topHeaderHeight + dayHeaderHeight + capacityTotalsHeaderHeight;

  // Header Logic
  const headers: { label: string; width: number; isCurrent?: boolean }[] = [];
  let curr = new Date(startDate);
  while (curr < endDate) {
    let next: Date;
    let label: string;
    if (dimension === 'Semana') {
      next = new Date(curr);
      next.setDate(curr.getDate() + 7);
      label = `Semana ${Math.ceil(curr.getDate() / 7)} - ${curr.toLocaleDateString('pt-BR', { month: 'short' })}`;
    } else {
      next = new Date(curr);
      next.setMonth(curr.getMonth() + 1);
      label = curr.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    const width = Math.min(next.getTime(), endDate.getTime()) - curr.getTime();
    headers.push({ label, width: (width / (1000 * 60 * 60 * 24)) * pxPerDay, isCurrent: today >= curr && today < next });
    curr = next;
  }

  const dayHeaders = Array.from({ length: totalDays }).map((_, di) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + di);
    const dateIso = date.toISOString().split('T')[0];
    const holiday = holidays.find(h => h.date === dateIso);
    return {
      key: date.toISOString(),
      iso: dateIso,
      label: date.toLocaleDateString('pt-BR', { day: '2-digit' }),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      holiday,
      isHoliday: Boolean(holiday),
      holidayName: holiday?.name,
      isToday: dateIso === today.toISOString().split('T')[0]
    };
  });

  const dailyCapacityTotals = useMemo(() => {
    return dayHeaders.map(day => {
      if (day.isWeekend) return 0;
      // Feriado nacional = capacidade 0
      const nationalHoliday = day.holiday && (!day.holiday.scope || day.holiday.scope === 'nacional');
      if (nationalHoliday) return 0;

      return filteredCollabs.reduce((sum, collaborator) => {
        const isPreHire = collaborator.startDate && day.iso < collaborator.startDate;
        const isPostExit = collaborator.endDate && day.iso > collaborator.endDate;
        if (isPreHire || isPostExit) return sum;

        // Feriado estadual: afeta apenas colaboradores daquele estado
        if (day.holiday && day.holiday.scope === 'estadual' && day.holiday.uf && collaborator.uf === day.holiday.uf) {
          return sum;
        }

        const hasAbsence = absences.some(absence => (
          absence.collaboratorId === collaborator.id &&
          day.iso >= absence.startDate &&
          day.iso <= absence.endDate
        ));

        return hasAbsence ? sum : sum + 8;
      }, 0); 
    });
  }, [absences, dayHeaders, filteredCollabs]);

  // Scroll to today on mount
  useEffect(() => {
    if (scrollRef.current) {
      const diffDays = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      scrollRef.current.scrollLeft = (diffDays * pxPerDay) - 300;
    }
  }, [dimension, pxPerDay, startDate, today]);

  // Drag selection state
  const [dragStart, setDragStart] = useState<{ collabId: string; date: Date } | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const isDragging = useRef(false);  

  const handleCellMouseDown = (collabId: string, date: Date, absence: Absence | undefined) => {
    if (absence) {
      // clique em ausência: inicia timer, mas não drag
      isDragging.current = false;
      return;
    }
    isDragging.current = false; 
    setDragStart({ collabId, date });
    setDragEnd(date);
  };

  const handleCellMouseEnter = (date: Date) => {
    if (dragStart) {
      isDragging.current = true;
      setDragEnd(date);
    }
  };

  const handleCellClick = (_collabId: string, _date: Date, absence: Absence | undefined) => {
    if (absence && !isDragging.current) {
      onEditAbsence(absence);
    }
  };

  const handleMouseUp = () => {
    if (dragStart && dragEnd && isDragging.current) {
      const start = dragStart.date < dragEnd ? dragStart.date : dragEnd;
      const end = dragStart.date < dragEnd ? dragEnd : dragStart.date;
      const startISO = start.toISOString().split('T')[0];
      const endISO = end.toISOString().split('T')[0];
      // Bloqueia se já existe ausência no período selecionado para este colaborador
      const hasConflict = absences.some(
        a => a.collaboratorId === dragStart.collabId &&
          a.startDate <= endISO && a.endDate >= startISO
      );
      if (!hasConflict) {
        onAddAbsence(dragStart.collabId, startISO, endISO);
      }
    }
    isDragging.current = false;
    setDragStart(null);
    setDragEnd(null);
  };

  const handleLeftPanelWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    event.preventDefault();
    scrollRef.current.scrollTop += event.deltaY;
  };

  return (
    <div className="capacity-view" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border-strong)', position: 'relative' }} onMouseUp={handleMouseUp}>
      {/* Top Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #E2E8F0', height: '48px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setIsManagerMenuOpen(!isManagerMenuOpen)} className="btn btn-glass" style={{ fontSize: '0.75rem', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} /> Gestor: {managerFilter === 'Todos' ? 'Todos' : collaborators.find(c => c.id === managerFilter)?.name.split(' ')[0]} <ChevronDown size={14} />
            </button>
            {isManagerMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', minWidth: '180px', padding: '4px 0', marginTop: '4px' }}>
                <div onClick={() => { setManagerFilter('Todos'); setIsManagerMenuOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem' }} className="dropdown-item-hover">Todos</div>
                {/* Diretores */}
                {Array.from(new Set(teams.map(t => t.leaderId).filter(id => {
                  const role = collaborators.find(c => c.id === id)?.role;
                  return role === 'Director';
                }))).map(id => (
                  <div key={id} onClick={() => { setManagerFilter(id!); setIsManagerMenuOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem' }} className="dropdown-item-hover">
                    <span style={{ color: '#64748B', fontSize: '0.65rem', marginRight: 4 }}>DIR</span>{collaborators.find(c => c.id === id)?.name}
                  </div>
                ))}
                {/* Gerentes */}
                {Array.from(new Set(teams.map(t => t.leaderId).filter(id => {
                  const role = collaborators.find(c => c.id === id)?.role;
                  return role === 'Manager';
                }))).map(id => (
                  <div key={id} onClick={() => { setManagerFilter(id!); setIsManagerMenuOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem' }} className="dropdown-item-hover">
                    <span style={{ color: '#94A3B8', fontSize: '0.65rem', marginRight: 4 }}>GER</span>{collaborators.find(c => c.id === id)?.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onAddHoliday} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
            <Plus size={14} /> Adicionar Feriado
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setIsDimMenuOpen(!isDimMenuOpen)} className="btn btn-glass" style={{ fontSize: '0.75rem', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Visão: {dimension} <ChevronDown size={14} />
          </button>
          {isDimMenuOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', minWidth: '120px', padding: '4px 0', marginTop: '4px' }}>
               {['Ano', 'Trimestre', 'Mês', 'Semana'].map(d => (
                 <div key={d} onClick={() => { setDimension(d as any); setIsDimMenuOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem' }} className="dropdown-item-hover">{d}</div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left Frozen Column */}
        <div
          style={{ width: '240px', borderRight: '1px solid #E2E8F0', background: '#F8FAFC', zIndex: 50, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          onWheel={handleLeftPanelWheel}
        >
          <div style={{ height: totalHeaderHeight, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 15px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Colaborador</div>
          <div ref={leftColRef} style={{ flex: 1, minHeight: 0, overflowY: 'hidden' }}>
            {filteredCollabs.map(c => (
              <div key={c.id} style={{ height: '44px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 15px', background: 'white' }}>
                 {c.photoUrl ? <img src={c.photoUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E2E8F0' }} />}
                 <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{c.role}</div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Timeline */}
        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}>
          <div style={{ width: gridWidth, position: 'relative' }}>
              {/* Timeline Header */}
              <div style={{ display: 'flex', height: `${topHeaderHeight}px`, position: 'sticky', top: 0, zIndex: 40, background: 'white' }}>
                 {headers.map((h, i) => (
                   <div key={i} style={{ width: h.width, flexShrink: 0, borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '0.68rem', fontWeight: 700, background: h.isCurrent ? '#E2E8F0' : 'white' }}>
                      {h.label}
                   </div>
                 ))}
              </div>

              {showDayHeader && (
                <div style={{ display: 'flex', height: `${dayHeaderHeight}px`, position: 'sticky', top: `${topHeaderHeight}px`, zIndex: 39, background: 'white' }}>
                  {dayHeaders.map((day, index) => (
                    <div
                      key={`${day.key}-${index}`}
                      onClick={day.holiday ? () => onEditHoliday(day.holiday!) : undefined}
                      style={{
                        width: pxPerDay,
                        flexShrink: 0,
                        borderRight: '1px solid rgba(226,232,240,0.5)',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: day.isToday ? '#FFF7ED' : day.isHoliday ? '#94A3B8' : day.isWeekend ? '#CBD5E1' : 'white',
                        color: day.isToday ? '#C2410C' : day.isHoliday || day.isWeekend ? '#334155' : '#64748B',
                        lineHeight: 1.1,
                        cursor: day.holiday ? 'pointer' : 'default',
                        boxShadow: day.holiday ? 'inset 0 0 0 1px rgba(51,65,85,0.12)' : 'none'
                      }}
                      title={day.holidayName ? `${day.holidayName} - clique para editar` : undefined}
                    >
                      <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>{day.label}</span>
                      <span style={{ fontSize: '0.58rem', textTransform: 'uppercase' }}>{day.weekday.replace('.', '')}</span>
                    </div>
                  ))}
                </div>
              )}

              {showCapacityTotalsHeader && (
                <div style={{ display: 'flex', height: `${capacityTotalsHeaderHeight}px`, position: 'sticky', top: `${topHeaderHeight + dayHeaderHeight}px`, zIndex: 38, background: 'white' }}>
                  {dayHeaders.map((day, index) => (
                    <div
                      key={`total-${day.key}-${index}`}
                      style={{
                        width: pxPerDay,
                        flexShrink: 0,
                        borderRight: '1px solid rgba(226,232,240,0.5)',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: day.isHoliday ? '#CBD5E1' : day.isWeekend ? '#E2E8F0' : '#F8FAFC',
                        color: day.isHoliday || day.isWeekend ? '#334155' : '#475569',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap'
                      }}
                      title={`Capacidade total: ${dailyCapacityTotals[index]}h`}
                    >
                      {dailyCapacityTotals[index] > 0 ? dailyCapacityTotals[index] : ''}
                    </div>
                  ))}
                </div>
              )}

              {/* Grid Cells */}
              <div style={{ position: 'relative' }}>
                {filteredCollabs.map(c => (
                  <div key={c.id} style={{ display: 'flex', height: '44px', borderBottom: '1px solid #E2E8F0' }}>
                    {Array.from({ length: totalDays }).map((_, di) => {
                      const d = new Date(startDate);
                      d.setDate(startDate.getDate() + di);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      const dISO = d.toISOString().split('T')[0];
                      const holiday = holidays.find(h => h.date === dISO);
                      // Feriado aplica ao colaborador: nacional sempre, estadual só se UF bate
                      const holidayApplies = holiday && (!holiday.scope || holiday.scope === 'nacional' || (holiday.scope === 'estadual' && holiday.uf === c.uf));
                      const absence = absences.find(a => a.collaboratorId === c.id && dISO >= a.startDate && dISO <= a.endDate);
                      
                      // Tenure check
                      const isPreHire = c.startDate && dISO < c.startDate;
                      const isPostExit = c.endDate && dISO > c.endDate;
                      const inactive = isPreHire || isPostExit;

                      // Drag highlighting
                      let isDraggingSelected = false;
                      if (dragStart && dragStart.collabId === c.id && dragEnd) {
                        const s = dragStart.date < dragEnd ? dragStart.date : dragEnd;
                        const e = dragStart.date < dragEnd ? dragEnd : dragStart.date;
                        if (d >= s && d <= e) isDraggingSelected = true;
                      }

                      // Absence border: borda preta ao redor do período
                      const isAbsenceStart = absence && dISO === absence.startDate;
                      const isAbsenceEnd = absence && dISO === absence.endDate;

                      // Tooltip
                      const fmtD = (iso: string) => { const p = iso.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };
                      const cellTitle = absence
                        ? `${absence.type}${absence.reason ? ` — ${absence.reason}` : ''}\n${fmtD(absence.startDate)} → ${fmtD(absence.endDate)}`
                        : holidayApplies
                          ? `${holiday!.name}${holiday!.scope === 'estadual' ? ` (${holiday!.uf})` : ''}`
                          : undefined;

                      return (
                        <div 
                          key={di}
                          title={cellTitle}
                          onMouseDown={() => !inactive && handleCellMouseDown(c.id, d, absence)}
                          onMouseEnter={() => !inactive && handleCellMouseEnter(d)}
                          onClick={() => !inactive && handleCellClick(c.id, d, absence)}
                          style={{ 
                            width: pxPerDay, 
                            flexShrink: 0, 
                            borderRight: absence && !isAbsenceEnd ? 'none' : '1px solid rgba(226,232,240,0.5)',
                            borderLeft: isAbsenceStart ? '1px solid #1E293B' : undefined,
                            borderTop: absence ? '1px solid #1E293B' : undefined,
                            borderBottom: absence ? '1px solid #1E293B' : undefined,
                            ...(isAbsenceEnd ? { borderRight: '1px solid #1E293B' } : {}),
                            background: 
                               inactive ? 'repeating-linear-gradient(45deg, #F1F5F9, #F1F5F9 5px, #F8FAFC 5px, #F8FAFC 10px)' :
                               isDraggingSelected ? 'rgba(59, 130, 246, 0.2)' :
                               absence ? 'rgba(239, 68, 68, 0.12)' :
                               holidayApplies ? '#CBD5E1' :
                               isWeekend ? '#E2E8F0' : 
                               'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: absence ? 'var(--status-red)' : '#94A3B8',
                            position: 'relative',
                            cursor: inactive ? 'not-allowed' : 'pointer',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                          }}
                        >
                          {!inactive && !isWeekend && !holidayApplies && !absence && pxPerDay > 20 && <span style={{ fontSize: '0.62rem', fontWeight: 400, color: '#94A3B8' }}>8</span>}
                          {absence && pxPerDay > 40 && (
                            <span style={{ 
                              position: 'absolute', 
                              top: 2, 
                              bottom: 2, 
                              left: 2, 
                              right: 2, 
                              background: 'var(--status-red)', 
                              color: 'white', 
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.6rem',
                              padding: '0 4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              zIndex: 10
                            }}>
                              {absence.type}
                            </span>
                          )}
                          {holidayApplies && pxPerDay > 30 && <span style={{ color: '#475569', fontSize: '0.55rem' }}>{holiday!.name}</span>}
                          {dISO === today.toISOString().split('T')[0] && (
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '2px', background: 'var(--accent-base)', zIndex: 20 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Organization: React.FC = () => {
  const { user, currentCompany, currentDepartment, canManageEntities } = useAuth();
  const { activeView: activeTab, setActiveView, searchTerm, registerAddAction, setHeaderContent } = useView();

  // Restore last organization view from localStorage
  useEffect(() => {
    const orgViews = ['hierarchy', 'people', 'skills', 'capacity', 'clientes'];
    const saved = localStorage.getItem('organization_active_view');
    if (saved && orgViews.includes(saved)) {
      setActiveView(saved as any);
    } else {
      setActiveView('hierarchy');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever the user switches org views
  useEffect(() => {
    const orgViews = ['hierarchy', 'people', 'skills', 'capacity', 'clientes'];
    if (orgViews.includes(activeTab)) {
      localStorage.setItem('organization_active_view', activeTab);
    }
  }, [activeTab]);
  
  // Panning State for Hierarchy
  const hierarchyRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on background (white space) or empty areas, not on cards or buttons
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('.glass-panel-interactive') || 
                          target.closest('button') || 
                          target.closest('input') ||
                          target.closest('select');
    
    if (isInteractive || e.button !== 0) return;

    setIsDragging(true);
    const container = hierarchyRef.current;
    if (!container) return;

    setStartX(e.pageX - container.offsetLeft);
    setStartY(e.pageY - container.offsetTop);
    setScrollLeft(container.scrollLeft);
    setScrollTop(container.scrollTop);
  };

  const stopDragging = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const container = hierarchyRef.current;
    if (!container) return;

    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    const walkX = (x - startX);
    const walkY = (y - startY);
    container.scrollLeft = scrollLeft - walkX;
    container.scrollTop = scrollTop - walkY;
  };

  // States
  const [teams, setTeams] = useState<Team[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingCollab, setEditingCollab] = useState<Collaborator | Partial<Collaborator> | null>(null);
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null);
  const [viewingCollab, setViewingCollab] = useState<Collaborator | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);
  const [deletingCollab, setDeletingCollab] = useState<Collaborator | null>(null);
  const [editingAbsence, setEditingAbsence] = useState<Partial<Absence> | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<Partial<Holiday> | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [collapsedTeamIds, setCollapsedTeamIds] = useState<string[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [capacityDimension, setCapacityDimension] = useState<'Ano' | 'Trimestre' | 'Mês' | 'Semana'>('Mês');
  const [capacityManager, setCapacityManager] = useState<string>('Todos');

  // Client teams state
  const CLIENT_TEAMS_KEY = 'oraculo_client_teams';
  const CLIENT_TEAMS_SEED: Omit<ClientTeam, 'id' | 'companyId' | 'departmentId'>[] = [
    { name: 'Operação FTTH' },
    { name: 'Operação B2B/Atacado' },
    { name: 'Comercial FTTH' },
    { name: 'Comercial B2B/Atacado' },
    { name: 'Engenharia' },
    { name: 'TI' },
    { name: 'Outros' },
  ];
  const [clientTeams, setClientTeams] = useState<ClientTeam[]>(() => {
    try {
      const raw = localStorage.getItem(CLIENT_TEAMS_KEY);
      if (raw) return JSON.parse(raw) as ClientTeam[];
    } catch {}
    return [];
  });
  const [editingClientTeam, setEditingClientTeam] = useState<ClientTeam | null>(null);
  const [clientTeamDraft, setClientTeamDraft] = useState('');
  const [isAddingClientTeam, setIsAddingClientTeam] = useState(false);

  // Sorting state for people table
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  // Persistence: Load zoom from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const savedZoom = localStorage.getItem(`org_hierarchy_zoom_${user.id}`);
      if (savedZoom) {
        const val = parseFloat(savedZoom);
        if (!isNaN(val)) setZoom(val);
      }

      const savedCollapsed = localStorage.getItem(`org_hierarchy_collapsed_${user.id}`);
      if (savedCollapsed) {
        try {
          setCollapsedTeamIds(JSON.parse(savedCollapsed));
        } catch (e) {
          console.error('Failed to parse collapsed IDs:', e);
        }
      }
    }
  }, [user?.id]);

  // Persistence: Save to localStorage whenever state changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`org_hierarchy_zoom_${user.id}`, zoom.toString());
      localStorage.setItem(`org_hierarchy_collapsed_${user.id}`, JSON.stringify(collapsedTeamIds));
    }
  }, [zoom, collapsedTeamIds, user?.id]);

  const toggleTeamCollapse = (teamId: string) => {
    setCollapsedTeamIds(prev => 
      prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
    );
  };

  // Seed client teams on first load (or if empty)
  useEffect(() => {
    const cid = currentCompany?.id || 'default';
    const did = currentDepartment?.id || 'default';
    if (clientTeams.length === 0) {
      const seeded: ClientTeam[] = CLIENT_TEAMS_SEED.map((s, i) => ({
        id: `ct_seed_${i}`,
        name: s.name,
        companyId: cid,
        departmentId: did,
      }));
      setClientTeams(seeded);
      localStorage.setItem(CLIENT_TEAMS_KEY, JSON.stringify(seeded));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist client teams on every change
  useEffect(() => {
    localStorage.setItem(CLIENT_TEAMS_KEY, JSON.stringify(clientTeams));
  }, [clientTeams]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };




  // Constants for defaults
  const defCompanyId = currentCompany?.id || '';
  const defDeptId = currentDepartment?.id || departments.find(d => d.companyId === currentCompany?.id)?.id || '';

  // Registration of Add Action for Header
  useEffect(() => {
    if (activeTab === 'people') {
      registerAddAction(() => setEditingCollab({ 
        companyId: defCompanyId, 
        departmentId: defDeptId 
      }));
    } else if (activeTab === 'skills') {
      registerAddAction(() => setEditingSkill({ 
        name: '', 
        description: '',
        companyId: defCompanyId,
        departmentId: defDeptId
      }));
    } else if (activeTab === 'capacity') {
      registerAddAction(() => setEditingHoliday({ 
        name: '', 
        date: new Date().toISOString().split('T')[0],
        companyId: defCompanyId
      }));
    } else if (activeTab === 'clientes') {
      registerAddAction(() => { setClientTeamDraft(''); setIsAddingClientTeam(true); });
    } else {
      registerAddAction(() => setEditingTeam({ 
        companyId: defCompanyId, 
        departmentId: defDeptId, 
        id: `t_${Date.now()}`, 
        name: '', 
        type: 'Lideranca', 
        parentTeamId: null, 
        leaderId: null,
        receivesInitiatives: false
      }));
    }
    return () => registerAddAction(() => null);
  }, [activeTab, defCompanyId, defDeptId, departments]);

  // Fetch initial data
  useEffect(() => {
    if (!currentCompany) {
      setTeams([]);
      setCollaborators([]);
      setDepartments([]);
      setAbsences([]);
      setHolidays([]);
      setLoading(true);
      return;
    }

    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    const collabParams = new URLSearchParams();
    if (currentCompany) collabParams.append('companyId', currentCompany.id);
    const collabQuery = collabParams.toString() ? `?${collabParams.toString()}` : '';

    const deptParams = new URLSearchParams();
    if (currentCompany) deptParams.append('companyId', currentCompany.id);
    const deptQuery = deptParams.toString() ? `?${deptParams.toString()}` : '';

    const fetchData = async () => {
      try {
        const [teamsRes, collabsRes, deptsRes, absencesRes, holidaysRes] = await Promise.all([
          fetch(`/api/teams${query}`),
          fetch(`/api/collaborators${collabQuery}`),
          fetch(`/api/departments${deptQuery}`),
          fetch(`/api/absences${query}`),
          fetch(`/api/holidays${query}`)
        ]);
        
        const teamsData = await teamsRes.json();
        const collabsData = await collabsRes.json();
        const deptsData = await deptsRes.json();
        const absencesData = await absencesRes.json();
        const holidaysData = await holidaysRes.json();
        
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setCollaborators(Array.isArray(collabsData) ? collabsData : []);
        setDepartments(Array.isArray(deptsData) ? deptsData : []);
        setAbsences(Array.isArray(absencesData) ? absencesData : []);
        setHolidays(Array.isArray(holidaysData) ? holidaysData : []);
      } catch (error) {
        console.error('Failed to fetch org data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentCompany, currentDepartment]);

  // Atualizar o título da aba do navegador
  useEffect(() => {
    document.title = 'Times | Oráculo';
    return () => {
      document.title = 'Oráculo';
    };
  }, []);

  const processedCollabs = useMemo(() => {
    let result = [...collaborators];

    // Search filter
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowSearch) || 
        c.role.toLowerCase().includes(lowSearch) ||
        c.email.toLowerCase().includes(lowSearch)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'team':
          const aTeam = teams.find(t => t.id === a.squadId)?.name || '';
          const bTeam = teams.find(t => t.id === b.squadId)?.name || '';
          aValue = aTeam.toLowerCase();
          bValue = bTeam.toLowerCase();
          break;
        case 'bio':
          aValue = (a.bio || '').toLowerCase();
          bValue = (b.bio || '').toLowerCase();
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [collaborators, searchTerm, sortColumn, sortDirection, teams]);


  const roleColors: Record<string, { bg: string, text: string }> = {
    'Head': { bg: 'var(--type-vp)', text: 'var(--accent-text)' },
    'Director': { bg: 'var(--type-diretoria)', text: 'white' },
    'Manager': { bg: 'var(--type-gerencia)', text: 'white' },
    'Lead Engineer': { bg: 'var(--type-lideranca)', text: 'white' },
    'Engineer': { bg: 'var(--status-blue)', text: 'white' },
    'Analyst': { bg: 'var(--status-purple)', text: 'white' },
    'QA': { bg: 'var(--status-amber)', text: 'white' }
  };

  const handleSaveTeam = async (updated: Team) => {
    if (!updated.companyId || !updated.departmentId) {
      alert('Erro: Empresa ou Departamento não identificados.');
      return;
    }
    try {
      const exists = teams.find(t => t.id === updated.id);
      const method = exists ? 'PATCH' : 'POST';
      const url = exists ? `/api/teams/${updated.id}` : '/api/teams';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('Failed to save team');
      const savedTeam = await res.json();
      setTeams(prev => exists ? prev.map(t => t.id === updated.id ? savedTeam : t) : [...prev, savedTeam]);
      setEditingTeam(null);
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Excluir esta equipe?')) return;
    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete team');
      setTeams(prev => prev.filter(t => t.id !== id));
      setEditingTeam(null);
      setViewingTeam(null);
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!window.confirm('Excluir esta habilidade?')) return;
    try {
      const res = await fetch(`/api/skills/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSkills();
        setEditingSkill(null);
      }
    } catch (e) {
      console.error('Error deleting skill:', e);
    }
  };

  const handleSaveAbsence = async (updated: any) => {
    try {
      const isNew = !updated.id;
      const method = isNew ? 'POST' : 'PATCH';
      const url = isNew ? '/api/absences' : `/api/absences/${updated.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const saved = await res.json();
        setAbsences(prev => isNew ? [...prev, saved] : prev.map(a => a.id === saved.id ? saved : a));
        setEditingAbsence(null);
      }
    } catch (e) {
       console.error('Error saving absence:', e);
    }
  };

  const handleDeleteAbsence = async (id: string) => {
    if (!window.confirm('Excluir este registro de indisponibilidade?')) return;
    try {
      const res = await fetch(`/api/absences/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAbsences(prev => prev.filter(a => a.id !== id));
        setEditingAbsence(null);
      }
    } catch (e) {
      console.error('Error deleting absence:', e);
    }
  };

  const handleSaveHoliday = async (updated: any) => {
    try {
      const isNew = !updated.id;
      const method = isNew ? 'POST' : 'PATCH';
      const url = isNew ? '/api/holidays' : `/api/holidays/${updated.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const saved = await res.json();
        setHolidays(prev => isNew ? [...prev, saved] : prev.map(h => h.id === saved.id ? saved : h));
        setEditingHoliday(null);
      }
    } catch (e) {
       console.error('Error saving holiday:', e);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!window.confirm('Excluir este feriado?')) return;
    try {
      const res = await fetch(`/api/holidays/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHolidays(prev => prev.filter(h => h.id !== id));
        setEditingHoliday(null);
      }
    } catch (e) {
      console.error('Error deleting holiday:', e);
    }
  };

  const handleSaveCollab = async (updated: Collaborator) => {
    try {
      const exists = collaborators.find(c => c.id === updated.id);
      const method = exists ? 'PATCH' : 'POST';
      const url = exists ? `/api/collaborators/${updated.id}` : '/api/collaborators';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (!res.ok) {
        let message = 'Não foi possível salvar o colaborador.';
        try {
          const err = await res.json();
          if (err?.error) message = err.details ? `${err.error}: ${err.details}` : err.error;
        } catch {
          // keep default message
        }
        throw new Error(message);
      }
      const savedCollab = await res.json();
      setCollaborators(prev => exists ? prev.map(c => c.id === updated.id ? savedCollab : c) : [...prev, savedCollab]);
      setEditingCollab(null);
    } catch (error) {
      console.error('Error saving collaborator:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar colaborador.');
    }
  };

  const handleDeleteCollab = async (id: string) => {
    try {
      const res = await fetch(`/api/collaborators/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete collaborator');
      setCollaborators(prev => prev.filter(c => c.id !== id));
      setEditingCollab(null);
      setViewingCollab(null);
    } catch (error) {
      console.error('Error deleting collaborator:', error);
    }
  };


  const [skills, setSkills] = useState<Skill[]>([]);

  const fetchSkills = useCallback(async () => {
    if (!currentCompany || !currentDepartment) return;
    try {
      const res = await fetch(`/api/skills?companyId=${currentCompany.id}&departmentId=${currentDepartment.id}`);
      const data = await res.json();
      setSkills(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching skills:', e);
    }
  }, [currentCompany?.id, currentDepartment?.id]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // Header content badge per active tab
  useEffect(() => {
    const badgeStyle: React.CSSProperties = { display: 'inline-block', background: '#E5E7EB', color: '#374151', borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700, marginLeft: '0.5rem' };
    const labelStyle: React.CSSProperties = { fontWeight: 800 };
    if (activeTab === 'people') {
      setHeaderContent(<div style={{ display: 'flex', alignItems: 'center' }}><span style={labelStyle}>Colaboradores</span><span style={badgeStyle}>{processedCollabs.length}</span></div>);
    } else if (activeTab === 'hierarchy') {
      setHeaderContent(<div style={{ display: 'flex', alignItems: 'center' }}><span style={labelStyle}>Times</span><span style={badgeStyle}>{teams.length}</span></div>);
    } else if (activeTab === 'skills') {
      setHeaderContent(<div style={{ display: 'flex', alignItems: 'center' }}><span style={labelStyle}>Skills</span><span style={badgeStyle}>{skills.length}</span></div>);
    } else if (activeTab === 'capacity') {
      setHeaderContent(<div style={{ display: 'flex', alignItems: 'center' }}><span style={labelStyle}>Capacidade</span></div>);
    } else if (activeTab === 'clientes') {
      setHeaderContent(<div style={{ display: 'flex', alignItems: 'center' }}><span style={labelStyle}>Demandantes</span><span style={badgeStyle}>{clientTeams.length}</span></div>);
    } else {
      setHeaderContent(null);
    }
    return () => setHeaderContent(null);
  }, [activeTab, processedCollabs.length, teams.length, skills.length, clientTeams.length, setHeaderContent]);

  const handleSaveSkill = async (updated: any) => {
    try {
      const isNew = !updated.id;
      const method = isNew ? 'POST' : 'PATCH';
      const url = isNew ? '/api/skills' : `/api/skills/${updated.id}`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const savedSkill = await res.json();
        setEditingSkill(null);
        // Update local skills state immediately with the returned data (includes collaborators)
        setSkills(prev => isNew
          ? [...prev, savedSkill]
          : prev.map(s => s.id === savedSkill.id ? savedSkill : s)
        );
        // Also refresh from server to ensure consistency
        fetchSkills();
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar skill: ${errData.details || 'Verifique os dados.'}`);
      }
    } catch (e: any) {
      console.error('Error saving skill:', e);
      alert(`Erro inesperado: ${e.message}`);
    }
  };



  const handleIncludeMembers = async (teamId: string, memberIds: string[]) => {
    try {
      await Promise.all(memberIds.map(id => {
        const collab = collaborators.find(c => c.id === id);
        if (!collab) return Promise.resolve();
        return fetch(`/api/collaborators/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...collab, squadId: teamId })
        });
      }));
      // Refresh local state
      const collabsRes = await fetch('/api/collaborators');
      const collabsData = await collabsRes.json();
      setCollaborators(Array.isArray(collabsData) ? collabsData : []);
    } catch (error) {
      console.error('Error including members:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {    try {
      const collab = collaborators.find(c => c.id === memberId);
      if (!collab) return;
      await fetch(`/api/collaborators/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...collab, squadId: null })
      });
      setCollaborators(prev => prev.map(c => c.id === memberId ? { ...c, squadId: null } : c));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleSaveClientTeam = (name: string, existing?: ClientTeam) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cid = currentCompany?.id || 'default';
    const did = currentDepartment?.id || 'default';
    if (existing) {
      setClientTeams(prev => prev.map(ct => ct.id === existing.id ? { ...ct, name: trimmed } : ct));
    } else {
      const newCt: ClientTeam = { id: `ct_${Date.now()}`, name: trimmed, companyId: cid, departmentId: did };
      setClientTeams(prev => [...prev, newCt]);
    }
    setEditingClientTeam(null);
    setIsAddingClientTeam(false);
    setClientTeamDraft('');
  };

  const handleDeleteClientTeam = (id: string) => {
    if (!window.confirm('Excluir este cliente?')) return;
    setClientTeams(prev => prev.filter(ct => ct.id !== id));
  };



  if (loading) return <div className="spinner-container"><div className="spinner"></div><span>Carregando...</span></div>;

  return (
    <div className="page-layout" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', height: '100%', width: '100%' }}>
      {activeTab === 'hierarchy' ? (
        <div style={{ position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Zoom Controls Overlay - Now Absolute and Fixed to the container corner */}
          <div style={{ position: 'absolute', top: '1rem', right: 'calc(1rem + 8px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
            <div className="glass-panel" style={{ 
              display: 'flex', 
              gap: '0.3rem', 
              padding: '0.4rem', 
              pointerEvents: 'auto',
              background: '#1E293B', 
              color: 'white',
              backdropFilter: 'blur(12px)',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
            }}>
              <button 
                className="btn-icon" 
                onClick={() => setZoom(Math.max(0.25, zoom - 0.1))} 
                title="Diminuir Zoom"
                style={{ width: '32px', height: '32px', color: 'white' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-base)'}
                onMouseLeave={e => e.currentTarget.style.color = 'white'}
              >
                <ZoomOut size={18} />
              </button>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 2px' }}></div>
              <button 
                className="btn-icon" 
                onClick={() => setZoom(1)} 
                title="Resetar Zoom"
                style={{ width: 'auto', paddingLeft: '0.75rem', paddingRight: '0.75rem', fontSize: '0.8rem', fontWeight: 800, minWidth: '45px', color: 'white' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-base)'}
                onMouseLeave={e => e.currentTarget.style.color = 'white'}
              >
                {Math.round(zoom * 100)}%
              </button>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 2px' }}></div>
              <button 
                className="btn-icon" 
                onClick={() => setZoom(Math.min(2, zoom + 0.1))} 
                title="Aumentar Zoom"
                style={{ width: '32px', height: '32px', color: 'white' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-base)'}
                onMouseLeave={e => e.currentTarget.style.color = 'white'}
              >
                <ZoomIn size={18} />
              </button>
            </div>
          </div>

          <div 
            ref={hierarchyRef}
            className={`hierarchy-view ${isDragging ? 'is-dragging' : ''}`} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            style={{ 
              userSelect: isDragging ? 'none' : 'auto'
            }}
          >
            <div className="org-tree" style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              paddingTop: '2rem'
            }}>
              <ul>
                {teams.filter(t => !t.parentTeamId).map(team => (
                  <OrgNode 
                    key={team.id} 
                    team={team} 
                    allTeams={teams} 
                    allUsers={collaborators}
                    onView={setViewingTeam}
                    onEditCollab={setEditingCollab}
                    onAddSubTeam={(parentId) => setEditingTeam({ companyId: defCompanyId, departmentId: defDeptId, id: `t_${Date.now()}`, name: '', type: 'Lideranca', parentTeamId: parentId, leaderId: null, receivesInitiatives: false })}
                    canManageEntities={canManageEntities}
                    collapsedTeamIds={collapsedTeamIds}
                    onToggleCollapse={toggleTeamCollapse}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : activeTab === 'people' ? (
        <div className="people-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="glass-panel" style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid var(--glass-border-strong)', boxShadow: 'var(--shadow-md)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                  <th 
                    style={{ width: '24%', position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('name')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Colaborador
                      {sortColumn === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                  <th 
                    style={{ width: '8%', position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('role')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Cargo
                      {sortColumn === 'role' && (
                        sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                  <th 
                    style={{ width: '10%', position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('team')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Equipe
                      {sortColumn === 'team' && (
                        sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                  <th 
                    style={{ width: '50%', position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('bio')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Apresentação
                      {sortColumn === 'bio' && (
                        sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      )}
                    </div>
                  </th>
                  <th style={{ width: '8%', position: 'sticky', top: 0, zIndex: 10, padding: '0.75rem', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text-tertiary)', background: '#F9FAFB' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {processedCollabs.map(collab => (
                  <tr key={collab.id} onClick={() => setViewingCollab(collab)} className="table-row-premium" style={{ cursor: 'pointer' }}>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {collab.photoUrl ? (
                          <img src={collab.photoUrl} alt={collab.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />
                        ) : (
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                            <User size={16} color="var(--text-tertiary)" />
                          </div>
                        )}
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{collab.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: roleColors[collab.role]?.bg || 'var(--sec-accent)', 
                          color: roleColors[collab.role]?.text || 'white',
                          fontSize: '0.65rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}
                      >
                        {collab.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                      {teams.find(t => t.id === collab.squadId)?.name || 'Sem Equipe'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.8rem', whiteSpace: 'pre-line' }}>
                      {collab.bio || '—'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn-icon" onClick={() => setEditingCollab(collab)} title="Editar"><Edit2 size={16} /></button>
                        <button className="btn-icon" onClick={() => setDeletingCollab(collab)} title="Excluir" style={{ color: 'var(--status-red)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'skills' ? (
        <SkillsView 
          skills={skills}
          onEdit={(s) => setEditingSkill(s)}
          onDelete={handleDeleteSkill}
        />
      ) : activeTab === 'capacity' ? (
        <CapacityView 
          collaborators={processedCollabs}
          teams={teams}
          absences={absences}
          holidays={holidays}
          dimension={capacityDimension}
          setDimension={setCapacityDimension}
          managerFilter={capacityManager}
          setManagerFilter={setCapacityManager}
          onAddAbsence={(collabId, start, end) => setEditingAbsence({ collaboratorId: collabId, startDate: start, endDate: end })}
          onEditAbsence={(absence) => setEditingAbsence(absence)}
          onAddHoliday={() => setEditingHoliday({ name: '', date: new Date().toISOString().split('T')[0] })}
          onEditHoliday={(holiday) => setEditingHoliday(holiday)}
        />
      ) : activeTab === 'clientes' ? (
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          <div style={{ maxWidth: '640px' }}>

            {/* Add row */}
            {isAddingClientTeam && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
                <input
                  autoFocus
                  type="text"
                  value={clientTeamDraft}
                  onChange={e => setClientTeamDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveClientTeam(clientTeamDraft); if (e.key === 'Escape') { setIsAddingClientTeam(false); setClientTeamDraft(''); } }}
                  placeholder="Nome do time/demandante..."
                  style={{ flex: 1, padding: '0.4rem 0.7rem', borderRadius: '7px', border: '1px solid #C7D2FE', fontSize: '0.85rem', outline: 'none' }}
                />
                <button className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }} onClick={() => handleSaveClientTeam(clientTeamDraft)}>Salvar</button>
                <button className="btn btn-glass" style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }} onClick={() => { setIsAddingClientTeam(false); setClientTeamDraft(''); }}>Cancelar</button>
              </div>
            )}

            {/* List */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              {clientTeams.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Nenhum time cadastrado.</div>
              ) : (
                clientTeams.map((ct, idx) => (
                  <div
                    key={ct.id}
                    style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: idx < clientTeams.length - 1 ? '1px solid #E2E8F0' : 'none' }}
                  >
                    {editingClientTeam?.id === ct.id ? (
                      <>
                        <input
                          autoFocus
                          type="text"
                          value={clientTeamDraft}
                          onChange={e => setClientTeamDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveClientTeam(clientTeamDraft, ct); if (e.key === 'Escape') { setEditingClientTeam(null); setClientTeamDraft(''); } }}
                          style={{ flex: 1, padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #C7D2FE', fontSize: '0.85rem', outline: 'none' }}
                        />
                        <button className="btn-icon" title="Salvar" style={{ color: 'var(--status-green)', marginLeft: '0.4rem' }} onClick={() => handleSaveClientTeam(clientTeamDraft, ct)}><Plus size={15} /></button>
                        <button className="btn-icon" title="Cancelar" style={{ marginLeft: '0.2rem' }} onClick={() => { setEditingClientTeam(null); setClientTeamDraft(''); }}><X size={15} /></button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ct.name}</span>
                        {canManageEntities && (
                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            <button className="btn-icon" title="Editar" onClick={() => { setEditingClientTeam(ct); setClientTeamDraft(ct.name); setIsAddingClientTeam(false); }}><Edit2 size={15} /></button>
                            <button className="btn-icon" title="Excluir" style={{ color: 'var(--status-red)' }} onClick={() => handleDeleteClientTeam(ct.id)}><Trash2 size={15} /></button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-tertiary)' }}>
          Conteúdo não disponível para esta visualização.
        </div>
      )}

      {/* Modals */}
      {editingTeam && (
        <TeamModal 
          team={editingTeam}
          allCollaborators={collaborators}
          allTeams={teams}
          onClose={() => setEditingTeam(null)}
          onSave={handleSaveTeam}
          onDelete={handleDeleteTeam}
          onAddCollab={(teamId) => setEditingCollab({ 
            squadId: teamId, 
            departmentId: editingTeam.departmentId,
            companyId: editingTeam.companyId 
          })}
          onIncludeMembers={handleIncludeMembers}
          onRemoveMember={handleRemoveMember}
          onAddSubTeam={(parentId) => setEditingTeam({ 
            companyId: defCompanyId, 
            departmentId: editingTeam.departmentId || defDeptId,
            id: `t_${Date.now()}`, 
            name: '', 
            type: 'Lideranca', 
            parentTeamId: parentId, 
            leaderId: null,
            receivesInitiatives: false
          })}
          canManageEntities={canManageEntities}
        />
      )}

      {editingCollab && (
        <CollaboratorModal 
          collaborator={editingCollab}
          allTeams={teams}
          onClose={() => setEditingCollab(null)}
          onSave={handleSaveCollab}
          onDelete={handleDeleteCollab}
          allDepartments={departments}
          canManageEntities={canManageEntities}
        />
      )}

      {editingSkill && (
        <SkillModal 
          skill={editingSkill}
          allCollaborators={collaborators}
          onClose={() => setEditingSkill(null)}
          onSave={handleSaveSkill}
          onDelete={handleDeleteSkill}
          canManageEntities={canManageEntities}
        />
      )}

      {editingAbsence && (
        <AbsenceModal 
          absence={editingAbsence}
          collaborators={collaborators}
          onClose={() => setEditingAbsence(null)}
          onSave={handleSaveAbsence}
          onDelete={handleDeleteAbsence}
        />
      )}

      {editingHoliday && (
        <HolidayModal 
          holiday={editingHoliday}
          companyId={defCompanyId}
          onClose={() => setEditingHoliday(null)}
          onSave={handleSaveHoliday}
          onDelete={handleDeleteHoliday}
        />
      )}

      {viewingTeam && (
        <TeamDetailModal
          team={viewingTeam}
          allTeams={teams}
          allUsers={collaborators}
          onClose={() => setViewingTeam(null)}
          onEdit={(t) => {
            setViewingTeam(null);
            setEditingTeam(t);
          }}
          onDelete={handleDeleteTeam}
          onViewCollaborator={(c) => {
            setViewingTeam(null);
            setViewingCollab(c);
          }}
          canManageEntities={canManageEntities}
        />
      )}

      {viewingCollab && (
        <CollaboratorDetailModal 
          collaborator={viewingCollab}
          teamName={teams.find(t => t.id === viewingCollab.squadId)?.name || 'Sem equipe'}
          onClose={() => setViewingCollab(null)}
          onEdit={(c) => {
            setViewingCollab(null);
            setEditingCollab(c);
          }}
          onDelete={() => {
            setViewingCollab(null);
            setDeletingCollab(viewingCollab);
          }}
          absences={absences}
          canManageEntities={canManageEntities}
        />
      )}

      {deletingCollab && (
        <div className="modal-overlay" style={{ zIndex: 1100000 }}>
          <div className="glass-panel modal-content" style={{ maxWidth: '400px', textAlign: 'center', background: 'white', padding: '2.5rem' }}>
            <div style={{ color: 'var(--status-red)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <Trash2 size={40} />
              </div>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Excluir Colaborador?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              Deseja realmente excluir <strong>{deletingCollab.name}</strong>? Esta ação removerá o registro permanentemente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  handleDeleteCollab(deletingCollab.id);
                  setDeletingCollab(null);
                }}
                style={{ paddingTop: '0.8rem', paddingBottom: '0.8rem', fontWeight: 700 }}
              >
                Sim, Remover Registro
              </button>
              <button 
                className="btn btn-glass" 
                onClick={() => setDeletingCollab(null)}
                style={{ paddingTop: '0.8rem', paddingBottom: '0.8rem' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAbsence && (
        <AbsenceModal 
          absence={editingAbsence}
          collaborators={collaborators}
          onClose={() => setEditingAbsence(null)}
          onSave={handleSaveAbsence}
          onDelete={handleDeleteAbsence}
        />
      )}

      {editingHoliday && (
        <HolidayModal 
          holiday={editingHoliday}
          companyId={defCompanyId}
          onClose={() => setEditingHoliday(null)}
          onSave={handleSaveHoliday}
          onDelete={handleDeleteHoliday}
        />
      )}
    </div>
  );
};

export default Organization;

