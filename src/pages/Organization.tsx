import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEscapeKey } from '../hooks/useEscapeKey';
import type { Team, Collaborator, AppRole, TeamType, Department } from '../types';
import { Users, User, Edit2, Trash2, X, Plus, Search, Building2, Camera, Upload, Linkedin, Github, Mail, Phone, UserMinus } from 'lucide-react';
import { useView } from '../context/ViewContext';

// --- Sub-components ---

const OrgNode: React.FC<{ 
  team: Team, 
  allTeams: Team[], 
  allUsers: Collaborator[],
  onView: (team: Team) => void,
  onEditCollab: (collab: Collaborator) => void,
  onAddSubTeam: (parentId: string) => void,
  canManageEntities: boolean
}> = ({ team, allTeams, allUsers, onView, onEditCollab, onAddSubTeam, canManageEntities }) => {
  const subTeams = allTeams.filter(t => t.parentTeamId === team.id);
  const leader = allUsers.find(u => u.id === team.leaderId);

  const getSubTreeTeamIds = (tId: string): string[] => {
    const children = allTeams.filter(t => t.parentTeamId === tId);
    return [tId, ...children.flatMap(child => getSubTreeTeamIds(child.id))];
  };
  const totalMemberCount = allUsers.filter(u => getSubTreeTeamIds(team.id).includes(u.squadId || '')).length;

  const typeColors: Record<TeamType, string> = {
    'Head': 'var(--type-vp)',
    'Diretoria': 'var(--type-diretoria)',
    'Gerencia': 'var(--type-gerencia)',
    'Lideranca': 'var(--type-lideranca)',
  };

  return (
    <li>
      <div className="org-node">
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
            <h3 style={{ fontSize: '1rem', lineHeight: '1.2', fontWeight: 700 }}>{team.name}</h3>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
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
              <span className="badge" style={{ backgroundColor: 'hsla(225, 20%, 30%, 0.5)', fontSize: '0.65rem', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
                {team.type}
              </span>
              {team.receivesInitiatives && (
                <span className="badge" style={{ backgroundColor: '#10B981', color: 'white', fontSize: '0.6rem', border: 'none' }}>
                  Receptor
                </span>
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
      </div>
      
      {subTeams.length > 0 && (
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
                    <label style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Receptor de Iniciativas</label>
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
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={18} className="text-secondary" /> Sub-equipes
                    </h3>
                    <button className="btn btn-glass btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onAddSubTeam(team.id)}>
                       <Plus size={16} /> Criar Equipe
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {allTeams.filter(t => t.parentTeamId === team.id).map(st => (
                      <span key={st.id} className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)', border: '1px solid var(--glass-border-strong)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
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
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{m.name}</div>
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
    githubUrl: collaborator.githubUrl || ''
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
        maxWidth: '720px', 
        width: '95%', 
        background: 'white',
        maxHeight: '94vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '1.2rem 1.5rem'
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
              onSave({ 
                ...(collaborator as Collaborator), 
                ...formData, 
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
                            'Manager': ['Gerencia'],
                            'Lead Engineer': ['Lideranca'],
                            'Engineer': ['Lideranca'],
                            'Analyst': ['Lideranca'],
                            'QA': ['Lideranca']
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
                            'Manager': ['Gerencia'],
                            'Lead Engineer': ['Lideranca'],
                            'Engineer': ['Lideranca'],
                            'Analyst': ['Lideranca'],
                            'QA': ['Lideranca']
                          };
                          return roleToTeamType[formData.role].includes(t.type);
                        }).map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                        ))}
                      </select>
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
  canManageEntities: boolean;
}> = ({ collaborator, teamName, onClose, onEdit, onDelete, canManageEntities }) => {
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
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
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
                    maxHeight: '180px',
                    overflowY: 'auto',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
                  }}>
                   {collaborator.bio}
                 </div>
              </div>
            )}

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
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: 'none'
      }}>
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
             <button onClick={onClose} className="btn-icon" style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '0 2.5rem 2.5rem 2.5rem', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '3rem' }}>
          {/* Left Column: Team Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ 
              width: 180, 
              height: 180, 
              borderRadius: '50%', 
              background: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: 'var(--shadow-lg)', 
              marginBottom: '1.5rem',
              border: '6px solid white',
              position: 'relative'
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={80} color="var(--accent-base)" />
              </div>
            </div>
            
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{team.name}</h2>
            <div className="badge badge-dark" style={{ fontSize: '1rem', padding: '0.45rem 1.4rem', marginBottom: '1.25rem' }}>{team.type}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center', padding: '1.25rem', background: 'var(--bg-app)', borderRadius: '16px', width: '100%', border: '1px solid var(--glass-border)' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Equipe Superior</span>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                 <Building2 size={20} className="text-secondary" /> {parentTeam?.name || 'Nível Raiz'}
               </div>
            </div>
          </div>

          {/* Right Column: Detailed Context */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                  <Users size={18} className="text-tertiary" /> <span>{directMembers.length} membros diretos</span>
                </div>
                {leader && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 700 }}>
                    <User size={18} className="text-tertiary" /> <span>Líder: {leader.name}</span>
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
                         <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
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

const Organization: React.FC = () => {
  const { currentCompany, currentDepartment, canManageEntities } = useAuth();
  const { activeView: activeTab, searchTerm, registerAddAction } = useView();
  
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
  const [viewingCollab, setViewingCollab] = useState<Collaborator | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);

  // Constants for defaults
  const defCompanyId = currentCompany?.id || 'c_vtal';
  const defDeptId = currentDepartment?.id || departments[0]?.id || 'd_core';

  // Registration of Add Action for Header
  useEffect(() => {
    if (activeTab === 'people') {
      registerAddAction(() => setEditingCollab({ 
        companyId: defCompanyId, 
        departmentId: defDeptId 
      }));
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
    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    const fetchData = async () => {
      try {
        const [teamsRes, collabsRes, deptsRes] = await Promise.all([
          fetch(`/api/teams${query}`),
          fetch(`/api/collaborators${query}`),
          fetch('/api/departments')
        ]);
        
        const teamsData = await teamsRes.json();
        const collabsData = await collabsRes.json();
        const deptsData = await deptsRes.json();
        
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setCollaborators(Array.isArray(collabsData) ? collabsData : []);
        setDepartments(Array.isArray(deptsData) ? deptsData : []);
      } catch (error) {
        console.error('Failed to fetch org data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentCompany, currentDepartment]);

  const filteredCollabs = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      if (!res.ok) throw new Error('Failed to save collaborator');
      const savedCollab = await res.json();
      setCollaborators(prev => exists ? prev.map(c => c.id === updated.id ? savedCollab : c) : [...prev, savedCollab]);
      setEditingCollab(null);
    } catch (error) {
      console.error('Error saving collaborator:', error);
    }
  };

  const handleDeleteCollab = async (id: string) => {
    if (!window.confirm('Excluir este colaborador?')) return;
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

  const handleRemoveMember = async (memberId: string) => {
    try {
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

  if (loading) return <div className="spinner-container"><div className="spinner"></div><span>Carregando...</span></div>;

  return (
    <div className="page-layout">
      {activeTab === 'hierarchy' ? (
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
          <div className="org-tree">
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
                />
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="people-view">
          <div className="glass-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Equipe</th>
                  <th>E-mail</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCollabs.map(collab => (
                  <tr key={collab.id} onClick={() => setViewingCollab(collab)} style={{ cursor: 'pointer' }}>
                    <td>
                      {collab.photoUrl ? (
                        <img src={collab.photoUrl} alt={collab.name} className="avatar-small" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="avatar-small" style={{ background: 'var(--bg-app)' }}><User size={14} color="var(--text-primary)" /></div>
                      )}
                    </td>
                    <td><span style={{ fontWeight: 500 }}>{collab.name}</span></td>
                    <td><span className="badge badge-dark">{collab.role}</span></td>
                    <td><span className="text-secondary">{teams.find(t => t.id === collab.squadId)?.name || 'N/A'}</span></td>
                    <td><span className="text-secondary" style={{ fontSize: '0.85rem' }}>{collab.email}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setEditingCollab(collab); }}><Edit2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          onDelete={handleDeleteCollab}
          canManageEntities={canManageEntities}
        />
      )}
    </div>
  );
};

export default Organization;

