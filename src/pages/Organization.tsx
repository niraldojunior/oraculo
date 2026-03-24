import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Team, Collaborator, AppRole, TeamType, Department } from '../types';
import { Users, User, Edit2, Trash2, X, Plus, Search, Building2, Camera, Upload, Linkedin, Github, Mail, Phone } from 'lucide-react';

// --- Sub-components ---

const OrgNode: React.FC<{ 
  team: Team, 
  allTeams: Team[], 
  allUsers: Collaborator[],
  onView: (team: Team) => void,
  onEditCollab: (collab: Collaborator) => void,
  onAddSubTeam: (parentId: string) => void
}> = ({ team, allTeams, allUsers, onView, onEditCollab, onAddSubTeam }) => {
  const subTeams = allTeams.filter(t => t.parentTeamId === team.id);
  const leader = allUsers.find(u => u.id === team.leaderId);

  const getSubTreeTeamIds = (tId: string): string[] => {
    const children = allTeams.filter(t => t.parentTeamId === tId);
    return [tId, ...children.flatMap(child => getSubTreeTeamIds(child.id))];
  };
  const totalMemberCount = allUsers.filter(u => getSubTreeTeamIds(team.id).includes(u.squadId || '')).length;

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
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', opacity: 0.3 }}>
            <Edit2 size={12} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ fontSize: '1rem', lineHeight: '1.2', fontWeight: 700 }}>{team.name}</h3>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                className="btn-icon" 
                onClick={(e) => { e.stopPropagation(); onAddSubTeam(team.id); }}
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
  allDepartments: Department[];
}> = ({ team, allCollaborators, allTeams, onClose, onSave, onDelete, onAddCollab, onEditCollab, onAddSubTeam, allDepartments }) => {
  const [formData, setFormData] = useState({
    name: team.name,
    type: team.type,
    leaderId: team.leaderId || '',
    parentTeamId: team.parentTeamId || '',
    departmentId: team.departmentId || allDepartments[0]?.id || ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
              <form id="team-form" onSubmit={(e) => { e.preventDefault(); onSave({ ...team, ...formData, leaderId: formData.leaderId || null, parentTeamId: formData.parentTeamId || null, departmentId: formData.departmentId }); }} className="form-container" style={{ gap: '1.5rem' }}>
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
                  <label>Departamento</label>
                  <select value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })} required>
                    {allDepartments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
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
  allDepartments: Department[];
}> = ({ collaborator, allTeams, onClose, onSave, onDelete, allDepartments }) => {
  const [formData, setFormData] = useState({
    name: collaborator.name || '',
    email: collaborator.email || '',
    role: (collaborator.role as AppRole) || 'Engineer/Analyst',
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
                          const currentTeam = allTeams.find(t => t.id === formData.squadId);
                          const isStillValid = currentTeam && allowedTypes.includes(currentTeam.type);
                          setFormData({ ...formData, role: newRole, squadId: isStillValid ? formData.squadId : '' });
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
                      <label>Equipe</label>
                      <select value={formData.squadId} onChange={e => setFormData({ ...formData, squadId: e.target.value })}>
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

                  <div className="form-group">
                    <label>Departamento</label>
                    <select value={formData.departmentId} onChange={e => setFormData({ ...formData, departmentId: e.target.value })} required>
                      {allDepartments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Column 2: Bio & Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div className="form-group">
                    <label>Apresentação</label>
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

// --- New Detail Modal ---
const CollaboratorDetailModal: React.FC<{
  collaborator: Collaborator;
  teamName: string;
  onClose: () => void;
  onEdit: (collab: Collaborator) => void;
  onDelete: (id: string) => void;
}> = ({ collaborator, teamName, onClose, onEdit, onDelete }) => {
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

        <div style={{ padding: '0 2.5rem 2.5rem 2.5rem', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '3rem' }}>
          {/* Left Column: Essential Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              {collaborator.photoUrl ? (
                <img src={collaborator.photoUrl} alt={collaborator.name} style={{ width: 180, height: 180, borderRadius: '50%', objectFit: 'cover', border: '6px solid white', boxShadow: 'var(--shadow-lg)' }} />
              ) : (
                <div style={{ width: 180, height: 180, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '6px solid white', boxShadow: 'var(--shadow-lg)' }}>
                  <User size={90} color="var(--text-tertiary)" />
                </div>
              )}
            </div>
            
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{collaborator.name}</h2>
            <div className="badge badge-dark" style={{ fontSize: '1rem', padding: '0.45rem 1.4rem', marginBottom: '1.25rem' }}>{collaborator.role}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center', padding: '1.25rem', background: 'var(--bg-app)', borderRadius: '16px', width: '100%', border: '1px solid var(--glass-border)' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Equipe</span>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                 <Building2 size={20} className="text-secondary" /> {teamName}
               </div>
            </div>
          </div>

          {/* Right Column: Contacts and Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Top Right: Contact Info Group */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                  <Mail size={16} className="text-tertiary" /> <span>{collaborator.email}</span>
                </div>
                {collaborator.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                    <Phone size={16} className="text-tertiary" /> <span>{collaborator.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  {collaborator.linkedinUrl && (
                    <a href={collaborator.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" style={{ background: 'var(--bg-app)', color: '#0077B5', width: '40px', height: '40px', border: '1px solid var(--glass-border)' }} title="LinkedIn">
                      <Linkedin size={20} />
                    </a>
                  )}
                  {collaborator.githubUrl && (
                    <a href={collaborator.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-icon" style={{ background: 'var(--bg-app)', color: '#181717', width: '40px', height: '40px', border: '1px solid var(--glass-border)' }} title="GitHub">
                      <Github size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Presentation/Bio Section */}
            {collaborator.bio && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                 <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Apresentação</span>
                 <div className="text-secondary" style={{ 
                   fontSize: '1rem', 
                   lineHeight: '1.8', 
                   background: 'rgba(0,0,0,0.015)', 
                   padding: '1.5rem', 
                   borderRadius: '16px', 
                   border: '1px solid var(--glass-border)',
                   height: '240px',
                   overflowY: 'auto'
                 }}>
                   {collaborator.bio}
                 </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1.5rem' }}>
              <button className="btn btn-danger-dim" onClick={() => onDelete(collaborator.id)} style={{ flex: 1, padding: '0.8rem' }}>
                <Trash2 size={18} /> Excluir Colaborador
              </button>
              <button className="btn btn-primary" onClick={() => onEdit(collaborator)} style={{ flex: 1, padding: '0.8rem' }}>
                <Edit2 size={18} /> Editar Perfil
              </button>
            </div>
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
}> = ({ team, allTeams, allUsers, onClose, onEdit, onDelete }) => {
  const leader = allUsers.find(u => u.id === team.leaderId);
  const parentTeam = allTeams.find(t => t.id === team.parentTeamId);
  const teamMembers = allUsers.filter(u => u.squadId === team.id);

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
                  <Users size={18} className="text-tertiary" /> <span>{teamMembers.length} membros diretos</span>
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
                   {teamMembers.map(m => (
                     <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)' }}>
                       {m.photoUrl ? (
                         <img src={m.photoUrl} alt={m.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                       ) : (
                         <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <User size={16} className="text-tertiary" />
                         </div>
                       )}
                       <div style={{ overflow: 'hidden' }}>
                         <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{m.role}</div>
                       </div>
                     </div>
                   ))}
                   {teamMembers.length === 0 && (
                     <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                       Nenhum membro vinculado a esta equipe.
                     </div>
                   )}
                 </div>
               </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1.5rem' }}>
              <button className="btn btn-danger-dim" onClick={() => onDelete(team.id)} style={{ flex: 1, padding: '0.8rem' }}>
                <Trash2 size={18} /> Excluir Equipe
              </button>
              <button className="btn btn-primary" onClick={() => onEdit(team)} style={{ flex: 1, padding: '0.8rem' }}>
                <Edit2 size={18} /> Editar Equipe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

const Organization: React.FC = () => {
  const { currentCompany, currentDepartment } = useAuth();
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'people'>('hierarchy');
  
  // Persistence Logic
  const [teams, setTeams] = useState<Team[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, collabsRes, deptsRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/collaborators'),
          fetch('/api/departments')
        ]);
        
        const teamsData = await teamsRes.json();
        const collabsData = await collabsRes.json();
        const deptsData = await deptsRes.json();
        
        // Use database data if available, otherwise empty array (don't force mock data if DB is accessible)
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setCollaborators(Array.isArray(collabsData) ? collabsData : []);
        setDepartments(Array.isArray(deptsData) ? deptsData : []);
      } catch (error) {
        console.error('Failed to fetch org data:', error);
        // Only fallback to mock if there's a serious API error and we want to show something
        setTeams([]);
        setCollaborators([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingCollab, setEditingCollab] = useState<Collaborator | Partial<Collaborator> | null>(null);
  const [viewingCollab, setViewingCollab] = useState<Collaborator | null>(null);
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);



  const filteredCollabs = collaborators.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveTeam = async (updated: Team) => {
    // Validation to avoid foreign key errors if state is stale
    if (!updated.companyId || !updated.departmentId) {
      alert('Erro: Empresa ou Departamento não identificados. Por favor, recarregue a página.');
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
      
      if (!res.ok) {
        let errorMsg = 'Failed to save team';
        try {
          const text = await res.text();
          const errorData = JSON.parse(text);
          errorMsg = errorData.details || errorData.error || errorMsg;
        } catch (e) {
          // If not JSON, it might be Vercel's HTML error page
          console.error('Non-JSON error response from server');
        }
        throw new Error(errorMsg);
      }
      const savedTeam = await res.json();

      setTeams(prev => {
        if (exists) return prev.map(t => t.id === updated.id ? savedTeam : t);
        return [...prev, savedTeam];
      });
      setEditingTeam(null);
    } catch (error: any) {
      console.error('Error saving team:', error);
      alert(error.message || 'Erro ao salvar equipe no servidor.');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete team');

      setTeams(prev => {
        const teamToRemove = prev.find(t => t.id === id);
        const filtered = prev.filter(t => t.id !== id);
        return filtered.map(t => t.parentTeamId === id ? { ...t, parentTeamId: teamToRemove?.parentTeamId || null } : t);
      });
      setEditingTeam(null);
      setViewingTeam(null); // Ensure detail modal also closes
    } catch (error: any) {
      console.error('Error deleting team:', error);
      alert(error.message || 'Erro ao excluir equipe no servidor.');
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
        let errorMsg = 'Failed to save collaborator';
        try {
          const text = await res.text();
          const errorData = JSON.parse(text);
          errorMsg = errorData.details || errorData.error || errorMsg;
        } catch (e) {
          console.error('Non-JSON error response from server');
        }
        throw new Error(errorMsg);
      }
      const savedCollab = await res.json();

      setCollaborators(prev => {
        if (exists) return prev.map(c => c.id === updated.id ? savedCollab : c);
        return [...prev, savedCollab];
      });
      setEditingCollab(null);
    } catch (error: any) {
      console.error('Error saving collaborator:', error);
      alert(error.message || 'Erro ao salvar colaborador no servidor.');
    }
  };

  const handleDeleteCollab = async (id: string) => {
    try {
      const res = await fetch(`/api/collaborators/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        let errorMsg = 'Failed to delete collaborator';
        try {
          const text = await res.text();
          const errorData = JSON.parse(text);
          errorMsg = errorData.details || errorData.error || errorMsg;
        } catch (e) {
          console.error('Non-JSON error response from server');
        }
        throw new Error(errorMsg);
      }

      setCollaborators(prev => prev.filter(c => c.id !== id));
      setEditingCollab(null);
      setViewingCollab(null); // Ensure detail modal also closes
    } catch (error: any) {
      console.error('Error deleting collaborator:', error);
      alert(error.message || 'Erro ao excluir colaborador no servidor.');
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div><span>Carregando Estrutura Organizacional...</span></div>;

  // Fallback defaults for safety
  const defCompanyId = currentCompany?.id || 'c_vtal';
  const defDeptId = currentDepartment?.id || departments[0]?.id || 'd_core';

  return (
    <div className="page-layout">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
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
        <div className="hierarchy-view" style={{ position: 'relative', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border-strong)' }}>
          <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
            <button className="btn btn-primary" onClick={() => setEditingTeam({ 
              companyId: defCompanyId, 
              departmentId: defDeptId,
              id: `t_${Date.now()}`, 
              name: '', 
              type: 'Lideranca', 
              parentTeamId: null, 
              leaderId: null 
            })}>
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
                  onView={setViewingTeam}
                  onEditCollab={setEditingCollab}
                  onAddSubTeam={(parentId) => setEditingTeam({ companyId: defCompanyId, departmentId: defDeptId, id: `t_${Date.now()}`, name: '', type: 'Lideranca', parentTeamId: parentId, leaderId: null })}
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
            <button className="btn btn-primary" onClick={() => setEditingCollab({ 
              companyId: defCompanyId,
              departmentId: defDeptId
            })}>
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
                    <td><span className="text-secondary" style={{ fontSize: '0.875rem' }}>{collab.email}</span></td>
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
          onAddCollab={(teamId) => setEditingCollab({ squadId: teamId, departmentId: editingTeam.departmentId })}
          onEditCollab={(collab) => setEditingCollab(collab)}
          onAddSubTeam={(parentId) => setEditingTeam({ 
            companyId: defCompanyId, 
            departmentId: editingTeam.departmentId || defDeptId,
            id: `t_${Date.now()}`, 
            name: '', 
            type: 'Lideranca', 
            parentTeamId: parentId, 
            leaderId: null 
          })}
          allDepartments={departments}
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
        />
      )}
    </div>
  );
};

export default Organization;
