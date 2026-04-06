import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Building2, 
  LogOut, 
  ArrowLeft,
  Building,
  Camera,
  Upload,
  ChevronDown
} from 'lucide-react';
import type { Company, Department, Collaborator } from '../types';

const Admin: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);

  // Form states
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  const [editingDept, setEditingDept] = useState<{
    id?: string;
    name: string;
    companyId: string;
    masterUserId?: string;
    masterUser?: {
      name: string;
      email: string;
      password?: string;
      photoUrl?: string;
    }
  } | null>(null);
  
  const [showNewCollabForm, setShowNewCollabForm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const collabFileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, deptRes, collabRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/departments'),
        fetch('/api/collaborators')
      ]);
      if (compRes.ok) setCompanies(await compRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (collabRes.ok) setCollaborators(await collabRes.json());
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'company' | 'collaborator') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'company' && editingCompany) {
          setEditingCompany({ ...editingCompany, logo: reader.result as string });
        } else if (target === 'collaborator' && editingDept) {
          setEditingDept({
            ...editingDept,
            masterUser: { 
              ...(editingDept.masterUser || { name: '', email: '' }), 
              photoUrl: reader.result as string 
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = async () => {
    if (!editingCompany?.fantasyName) return;
    try {
      const method = editingCompany.id ? 'PATCH' : 'POST';
      const url = editingCompany.id ? `/api/companies/${editingCompany.id}` : '/api/companies';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fantasyName: editingCompany.fantasyName,
          realName: editingCompany.realName || editingCompany.fantasyName,
          logo: editingCompany.logo || '',
          description: editingCompany.description || ''
        })
      });

      if (res.ok) {
        setEditingCompany(null);
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar companhia: ${errData.details || 'Verifique os dados.'}`);
        console.error('Save Company Failed:', errData);
      }
    } catch (error: any) {
       console.error('Error saving company:', error);
       alert(`Ocorreu um erro inesperado: ${error.message}`);
    }
  };

  const handleSaveDept = async () => {
    if (!editingDept?.name || !editingDept?.companyId) return;
    try {
      const method = editingDept.id ? 'PATCH' : 'POST';
      const url = editingDept.id ? `/api/departments/${editingDept.id}` : '/api/departments';
      
      const { id: deptId, ...deptData } = editingDept;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptData)
      });

      if (res.ok) {
        setEditingDept(null);
        setShowNewCollabForm(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Erro ao salvar departamento: ${errData.details || 'Verifique os dados.'}`);
        console.error('Save Dept Failed:', errData);
      }
    } catch (error: any) {
        console.error('Error saving department:', error);
        alert(`Ocorreu um erro inesperado: ${error.message}`);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Excluir esta companhia e todos os dados relacionados?')) return;
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
       console.error('Error deleting company:', error);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('Excluir este departamento?')) return;
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
       console.error('Error deleting department:', error);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F8FAFC', color: '#1E293B' }}>
      <div className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: '#FFD919', borderRadius: '50%', marginBottom: '1rem' }}></div>
      <p style={{ fontWeight: 500 }}>Carregando Administração...</p>
    </div>
  );

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B', paddingBottom: '4rem' }}>
      {/* Header */}
      <header style={{ 
        height: '72px', 
        borderBottom: '1px solid rgba(0,0,0,0.06)', 
        background: '#FFFFFF', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', background: '#FFD919', borderRadius: '10px', color: '#000' }}>
            <Building2 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Administração Oráculo</h1>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>Gestão de Plataforma</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', border: 'none', background: 'transparent', color: '#64748B', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}
          >
            <ArrowLeft size={18} /> Voltar para App
          </button>
          <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)' }}></div>
          <button 
            onClick={() => { logout(); navigate('/login'); }} 
            className="btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#EF4444', fontWeight: 500 }}
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Building size={28} color="#FFD919" /> Gerenciamento de Companhias
          </h2>
          <button 
            onClick={() => setEditingCompany({ fantasyName: '', realName: '', logo: '', description: '' })}
            className="btn-primary" 
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          >
            <Plus size={20} /> Nova Companhia
          </button>
        </div>

        {/* Hierarchical List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {companies.map(company => {
            const isExpanded = expandedCompanyId === company.id;
            const companyDepts = departments.filter(d => d.companyId === company.id);

            return (
              <div 
                key={company.id} 
                style={{ 
                  background: '#FFFFFF', 
                  borderRadius: '16px', 
                  border: '1px solid #E2E8F0', 
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Company Header Card */}
                <div 
                  onClick={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                  style={{ 
                    padding: '1.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? '#F8FAFC' : '#FFFFFF',
                    borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: 48, height: 48, background: '#F1F5F9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      {company.logo ? <img src={company.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building size={24} color="#64748B" />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>{company.fantasyName}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>{companyDepts.length} {companyDepts.length === 1 ? 'departamento' : 'departamentos'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingCompany(company); }} 
                        style={{ padding: '0.6rem', color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCompany(company.id); }} 
                        style={{ padding: '0.6rem', color: '#F87171', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div style={{ color: '#94A3B8' }}>
                      <ChevronDown size={20} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
                    </div>
                  </div>
                </div>

                {/* Submenu: Departments */}
                {isExpanded && (
                  <div style={{ padding: '1rem 1.5rem 1.5rem', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Departamentos da {company.fantasyName}</h4>
                      <button 
                        onClick={() => setEditingDept({ name: '', companyId: company.id })}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', background: 'rgba(255,217,25,0.1)', color: '#D97706', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Plus size={14} /> Novo Departamento
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {companyDepts.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #E2E8F0' }}>
                          Nenhum departamento cadastrado.
                        </div>
                      ) : (
                        companyDepts.map(dept => {
                          const masterUser = collaborators.find(c => c.departmentId === dept.id && c.role === 'Master');
                          
                          return (
                            <div 
                              key={dept.id} 
                              style={{ 
                                padding: '1rem', 
                                background: '#F8FAFC', 
                                borderRadius: '12px', 
                                border: '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD919' }}></div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>{dept.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                                    {masterUser ? `Master: ${masterUser.name}` : <span style={{ fontStyle: 'italic' }}>Sem Master selecionado</span>}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button 
                                  onClick={() => setEditingDept({ ...dept, masterUserId: masterUser?.id })} 
                                  style={{ padding: '0.4rem', color: '#64748B', background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteDept(dept.id)} 
                                  style={{ padding: '0.4rem', color: '#EF4444', background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Company Modal */}
      {editingCompany && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#1E293B' }}>{editingCompany.id ? 'Editar Companhia' : 'Nova Companhia'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem', display: 'block' }}>Nome Fantasia</label>
                <input 
                  placeholder="Ex: V.tal" 
                  value={editingCompany.fantasyName || ''} 
                  onChange={e => setEditingCompany({...editingCompany, fantasyName: e.target.value})}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.95rem', color: '#1E293B', outline: 'none' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem', display: 'block' }}>Razão Social</label>
                <input 
                  placeholder="Ex: V.tal Rede Neutra S.A." 
                  value={editingCompany.realName || ''} 
                  onChange={e => setEditingCompany({...editingCompany, realName: e.target.value})}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.95rem', color: '#1E293B', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.75rem', display: 'block' }}>Logo da Companhia</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: '16px', 
                      background: '#F8FAFC', 
                      border: '2px dashed #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {editingCompany.logo ? (
                      <img src={editingCompany.logo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Upload size={24} color="#94A3B8" />
                    )}
                    <input type="file" ref={fileInputRef} onChange={e => handleFileChange(e, 'company')} accept="image/*" style={{ display: 'none' }} />
                  </div>
                  <div style={{ flex: 1, fontSize: '0.8rem', color: '#64748B', lineHeight: '1.5' }}>
                    Escolha uma imagem de alta qualidade. Formatos sugeridos: PNG ou SVG.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={handleSaveCompany} className="btn-primary" style={{ flex: 2, height: '48px', fontWeight: 700 }}>Salvar Alterações</button>
                <button onClick={() => setEditingCompany(null)} className="btn-secondary" style={{ flex: 1, height: '48px', border: '1px solid #E2E8F0', background: 'white' }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {editingDept && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', color: '#1E293B' }}>{editingDept.id ? 'Editar Departamento' : 'Novo Departamento'}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem', display: 'block' }}>Empresa Associada (Leitura)</label>
                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569', fontSize: '0.95rem', fontWeight: 600 }}>
                  {companies.find(c => c.id === editingDept.companyId)?.fantasyName}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem', display: 'block' }}>Nome do Departamento</label>
                <input 
                  placeholder="Ex: Infraestrutura de TI" 
                  value={editingDept.name} 
                  onChange={e => setEditingDept({...editingDept, name: e.target.value})}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.95rem', color: '#1E293B', outline: 'none' }}
                />
              </div>

              {/* Master User Logic */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>Usuário Master</label>
                  <button 
                    onClick={() => {
                      if (showNewCollabForm) {
                        setShowNewCollabForm(false);
                      } else {
                        setShowNewCollabForm(true);
                        setEditingDept({ ...editingDept, masterUserId: undefined });
                      }
                    }}
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {showNewCollabForm ? 'Selecionar Existente' : '+ Novo Colaborador'}
                  </button>
                </div>

                {!showNewCollabForm ? (
                  <select
                    value={editingDept.masterUserId || ''}
                    onChange={e => setEditingDept({ ...editingDept, masterUserId: e.target.value })}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '0.95rem', color: '#1E293B', cursor: 'pointer' }}
                  >
                    <option value="">Selecionar um colaborador existente...</option>
                    {collaborators
                      .filter(c => c.companyId === editingDept.companyId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                      ))}
                  </select>
                ) : (
                  <div style={{ padding: '1.5rem', background: '#FFFBEB', borderRadius: '16px', border: '1px solid #FEF3C7', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div 
                        onClick={() => collabFileInputRef.current?.click()}
                        style={{ width: 70, height: 70, borderRadius: '50%', background: '#FFFFFF', border: '2px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
                      >
                        {editingDept.masterUser?.photoUrl ? (
                          <img src={editingDept.masterUser.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Camera size={24} color="#94A3B8" />
                        )}
                        <input type="file" ref={collabFileInputRef} onChange={e => handleFileChange(e, 'collaborator')} accept="image/*" style={{ display: 'none' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Criando Novo Colaborador</div>
                        <div style={{ fontSize: '0.7rem', color: '#B45309' }}>Associado a: {companies.find(c => c.id === editingDept.companyId)?.fantasyName} / {editingDept.name || 'Este dpto'}</div>
                      </div>
                    </div>
                    
                    <input 
                      placeholder="Nome Completo" 
                      value={editingDept.masterUser?.name || ''}
                      onChange={e => setEditingDept({ ...editingDept, masterUser: { ...(editingDept.masterUser || { email: '', name: '' }), name: e.target.value } })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A', background: '#FFFFFF', fontSize: '0.9rem' }}
                    />
                    <input 
                      placeholder="E-mail Corporativo" 
                      type="email"
                      value={editingDept.masterUser?.email || ''}
                      onChange={e => setEditingDept({ ...editingDept, masterUser: { ...(editingDept.masterUser || { email: '', name: '' }), email: e.target.value } })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A', background: '#FFFFFF', fontSize: '0.9rem' }}
                    />
                    <input 
                      placeholder="Senha de Acesso" 
                      type="password"
                      value={editingDept.masterUser?.password || ''}
                      onChange={e => setEditingDept({ ...editingDept, masterUser: { ...(editingDept.masterUser || { email: '', name: '' }), password: e.target.value } })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FDE68A', background: '#FFFFFF', fontSize: '0.9rem' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button onClick={handleSaveDept} className="btn-primary" style={{ flex: 2, height: '48px', fontWeight: 700 }}>Confirmar Mudanças</button>
                <button onClick={() => { setEditingDept(null); setShowNewCollabForm(false); }} className="btn-secondary" style={{ flex: 1, height: '48px', border: '1px solid #E2E8F0', background: 'white' }}>Sair</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

