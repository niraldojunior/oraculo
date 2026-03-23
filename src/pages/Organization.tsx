import React, { useState, useRef } from 'react';
import { mockTeams as initialTeams, mockCollaborators as initialCollaborators } from '../data/mockDb';
import type { Team, Collaborator, AppRole, TeamType } from '../types';
import { Users, User, Edit2, Trash2, X, Plus, Search, Building2, Camera, Upload } from 'lucide-react';

// --- Sub-components ---

const OrgNode: React.FC<{ 
  team: Team, 
  allTeams: Team[], 
  allUsers: Collaborator[],
  onEdit: (team: Team) => void 
}> = ({ team, allTeams, allUsers, onEdit }) => {
  const subTeams = allTeams.filter(t => t.parentTeamId === team.id);
  const leader = allUsers.find(u => u.id === team.leaderId);

  const getSubTreeTeamIds = (tId: string): string[] => {
    const children = allTeams.filter(t => t.parentTeamId === tId);
    return [tId, ...children.flatMap(child => getSubTreeTeamIds(child.id))];
  };
  const totalMemberCount = allUsers.filter(u => getSubTreeTeamIds(team.id).includes(u.teamId)).length;

  const typeColors: Record<TeamType, string> = {
    'VP': 'var(--type-vp)',
    'Diretoria': 'var(--type-diretoria)',
    'Gerencia': 'var(--type-gerencia)',
    'Lideranca': 'var(--type-lideranca)',
  };

  return (
    <li>
      <div className="org-node">
        <div 
          className="glass-panel glass-panel-interactive" 
          onClick={() => onEdit(team)}
          style={{ 
            padding: '1rem 1.25rem', 
            minWidth: '230px', 
            maxWidth: '230px',
            backgroundColor: '#FFFFFF',
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
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0.3 }}>
            <Edit2 size={12} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ fontSize: '1rem', lineHeight: '1.2', fontWeight: 700 }}>{team.name}</h3>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                className="btn-icon" 
                onClick={(e) => { e.stopPropagation(); onEdit({ id: `t_${Date.now()}`, name: '', type: 'Lideranca', parentTeamId: team.id, leaderId: null }); }}
                style={{ opacity: 0.6, background: 'rgba(255,255,255,0.1)', width: 24, height: 24, borderRadius: '4px' }}
                title="Adicionar Sub-equipe"
              >
                <Plus size={14} />
              </button>
              <span className="badge" style={{ backgroundColor: 'hsla(225, 20%, 30%, 0.5)', fontSize: '0.65rem', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center' }}>
                {team.type}
              </span>
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
            {allUsers.filter(u => u.teamId === team.id && u.id !== team.leaderId).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.25rem' }}>
                {allUsers.filter(u => u.teamId === team.id && u.id !== team.leaderId).map(member => (
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
              onEdit={onEdit}
            />
          ))}
        </ul>
      )}
    </li>
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
  onEditCollab: (collab: Collaborator) => void;
  onAddSubTeam: (parentId: string) => void;
}> = ({ team, allCollaborators, allTeams, onClose, onSave, onDelete, onAddCollab, onEditCollab, onAddSubTeam }) => {
  const [formData, setFormData] = useState({
    name: team.name,
    type: team.type,
    leaderId: team.leaderId || '',
    parentTeamId: team.parentTeamId || ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const teamMembers = allCollaborators.filter(c => c.teamId === team.id);

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
                    <option value="VP">VP</option>
                    <option value="Diretoria">Diretoria</option>
                    <option value="Gerencia">Gerencia</option>
                    <option value="Lideranca">Lideranca</option>
                  </select>
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
                        const roleMap: Record<string, string[]> = {
                          'VP': ['VP'],
                          'Diretoria': ['Director'],
                          'Gerencia': ['Manager'],
                          'Lideranca': ['Lead Engineer', 'Engineer/Analyst']
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
                    <button className="btn btn-glass btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => onAddCollab(team.id)}>
                       <Plus size={16} /> Adicionar
                    </button>
                  </div>
                  
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
                        <button className="btn-icon" onClick={() => onEditCollab(m)} style={{ opacity: 0.6 }}><Edit2 size={16} /></button>
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

            <div className="form-actions" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button type="button" className="btn btn-danger-dim" onClick={() => setShowDeleteConfirm(true)} style={{ padding: '0.6rem 1.2rem' }}>
                <Trash2 size={18} /> Excluir Equipe
              </button>
              <button type="submit" form="team-form" className="btn btn-primary" style={{ minWidth: '160px' }}>
                Salvar Alterações
              </button>
            </div>
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
}> = ({ collaborator, allTeams, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: collaborator.name || '',
    email: collaborator.email || '',
    role: (collaborator.role as AppRole) || 'Engineer/Analyst',
    teamId: collaborator.teamId || '',
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
        maxWidth: '800px', 
        width: '95%', 
        background: 'white',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '2rem'
      }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            {collaborator.id ? <Edit2 size={20} /> : <Plus size={20} />} 
            {collaborator.id ? ' Editar Colaborador' : ' Novo Colaborador'}
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.4rem', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                {/* Column 1: Basic Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ 
                        width: 100, 
                        height: 100, 
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
                            'VP': ['VP'],
                            'Director': ['Diretoria'],
                            'Manager': ['Gerencia'],
                            'Lead Engineer': ['Lideranca'],
                            'Engineer/Analyst': ['Lideranca']
                          };
                          const allowedTypes = roleToTeamType[newRole];
                          const currentTeam = allTeams.find(t => t.id === formData.teamId);
                          const isStillValid = currentTeam && allowedTypes.includes(currentTeam.type);
                          setFormData({ ...formData, role: newRole, teamId: isStillValid ? formData.teamId : '' });
                        }}
                      >
                        <option value="VP">VP</option>
                        <option value="Director">Director</option>
                        <option value="Manager">Manager</option>
                        <option value="Lead Engineer">Lead Engineer</option>
                        <option value="Engineer/Analyst">Engineer/Analyst</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Equipe / Squad</label>
                      <select value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: e.target.value })}>
                        <option value="">Sem equipe</option>
                        {allTeams.filter(t => {
                          const roleToTeamType: Record<AppRole, TeamType[]> = {
                            'VP': ['VP'],
                            'Director': ['Diretoria'],
                            'Manager': ['Gerencia'],
                            'Lead Engineer': ['Lideranca'],
                            'Engineer/Analyst': ['Lideranca']
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="form-group">
                    <label>Bio / História</label>
                    <textarea 
                      placeholder="Conte um pouco sobre a trajetória e especialidade..."
                      value={formData.bio} 
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      rows={6}
                      style={{ resize: 'none', height: '145px' }}
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

                  <div className="form-group">
                    <label>URL da Foto (Remota)</label>
                    <input 
                      placeholder="https://exemplo.com/foto.jpg"
                      value={formData.photoUrl.startsWith('data:') ? '' : formData.photoUrl} 
                      onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} 
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="form-actions" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              {collaborator.id && onDelete && (
                <button type="button" className="btn btn-danger-dim" onClick={() => setShowDeleteConfirm(true)} style={{ padding: '0.6rem 1.2rem' }}>
                  <Trash2 size={18} /> Excluir Registro
                </button>
              )}
              <button type="submit" form="collab-form" className="btn btn-primary" style={{ minWidth: '160px' }}>
                {collaborator.id ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
              </button>
            </div>
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
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      `}</style>
    </div>
  );
};

// --- Main Component ---

const Organization: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'people'>('hierarchy');
  
  // Persistence Logic
  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem('oraculo_teams');
    return saved ? JSON.parse(saved) : initialTeams;
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem('oraculo_collaborators');
    return saved ? JSON.parse(saved) : initialCollaborators;
  });

  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingCollab, setEditingCollab] = useState<Collaborator | Partial<Collaborator> | null>(null);

  // Sync to localStorage
  React.useEffect(() => {
    localStorage.setItem('oraculo_teams', JSON.stringify(teams));
  }, [teams]);

  React.useEffect(() => {
    localStorage.setItem('oraculo_collaborators', JSON.stringify(collaborators));
  }, [collaborators]);

  const filteredCollabs = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveTeam = (updated: Team) => {
    setTeams(prev => {
      const exists = prev.find(t => t.id === updated.id);
      if (exists) return prev.map(t => t.id === updated.id ? updated : t);
      return [...prev, updated];
    });
    setEditingTeam(null);
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(prev => {
      const teamToRemove = prev.find(t => t.id === id);
      const filtered = prev.filter(t => t.id !== id);
      // Re-assign sub-teams to parent or null
      return filtered.map(t => t.parentTeamId === id ? { ...t, parentTeamId: teamToRemove?.parentTeamId || null } : t);
    });
    setEditingTeam(null);
  };

  const handleSaveCollab = (updated: Collaborator) => {
    setCollaborators(prev => {
      const exists = prev.find(c => c.id === updated.id);
      if (exists) return prev.map(c => c.id === updated.id ? updated : c);
      return [...prev, updated];
    });
    setEditingCollab(null);
  };

  const handleDeleteCollab = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    setEditingCollab(null);
  };

  return (
    <div className="page-layout">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Organização e Desenvolvimento</h1>
          <p className="text-secondary">Gestão de estrutura hierárquica e capital humano.</p>
        </div>
        <div className="tab-group glass-panel" style={{ padding: '0.25rem', display: 'flex', gap: '0.25rem' }}>
          <button 
            className={`btn ${activeTab === 'hierarchy' ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setActiveTab('hierarchy')}
            style={{ padding: '0.5rem 1rem' }}
          >
            <Building2 size={18} /> Hierarquia
          </button>
          <button 
            className={`btn ${activeTab === 'people' ? 'btn-primary' : 'btn-glass'}`}
            onClick={() => setActiveTab('people')}
            style={{ padding: '0.5rem 1rem' }}
          >
            <Users size={18} /> Pessoas
          </button>
        </div>
      </div>

      {activeTab === 'hierarchy' ? (
        <div className="hierarchy-view" style={{ position: 'relative', background: '#E0E5ED', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border-strong)' }}>
          <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
            <button className="btn btn-primary" onClick={() => setEditingTeam({ id: `t_${Date.now()}`, name: '', type: 'Lideranca', parentTeamId: null, leaderId: null })}>
              <Plus size={18} /> Nova Equipe
            </button>
          </div>
          <div className="org-tree">
            <ul>
              {teams.filter(t => !t.parentTeamId).map(team => (
                <OrgNode 
                  key={team.id} 
                  team={team} 
                  allTeams={teams} 
                  allUsers={collaborators}
                  onEdit={setEditingTeam}
                />
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="people-view">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <div className="search-box-premium" style={{ flex: 1, maxWidth: '400px' }}>
              <Search size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                placeholder="Buscar por nome, cargo ou e-mail..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setEditingCollab({})}>
              <Plus size={18} /> Novo Colaborador
            </button>
          </div>

          <div className="glass-panel" style={{ overflow: 'hidden' }}>
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
                  <tr key={collab.id}>
                    <td>
                      {collab.photoUrl ? (
                        <img src={collab.photoUrl} alt={collab.name} className="avatar-small" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="avatar-small" style={{ background: 'var(--bg-app)' }}><User size={14} color="var(--text-primary)" /></div>
                      )}
                    </td>
                    <td><span style={{ fontWeight: 500 }}>{collab.name}</span></td>
                    <td><span className="badge badge-dark">{collab.role}</span></td>
                    <td><span className="text-secondary">{teams.find(t => t.id === collab.teamId)?.name || 'N/A'}</span></td>
                    <td><span className="text-secondary" style={{ fontSize: '0.875rem' }}>{collab.email}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-icon" onClick={() => setEditingCollab(collab)}><Edit2 size={16} /></button>
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
          onAddCollab={(teamId) => setEditingCollab({ teamId })}
          onEditCollab={(collab) => setEditingCollab(collab)}
          onAddSubTeam={(parentId) => setEditingTeam({ id: `t_${Date.now()}`, name: '', type: 'Lideranca', parentTeamId: parentId, leaderId: null })}
        />
      )}

      {editingCollab && (
        <CollaboratorModal 
          collaborator={editingCollab}
          allTeams={teams}
          onClose={() => setEditingCollab(null)}
          onSave={handleSaveCollab}
          onDelete={handleDeleteCollab}
        />
      )}
    </div>
  );
};

export default Organization;
