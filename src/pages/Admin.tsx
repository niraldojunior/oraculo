import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Building2, 
  Users, 
  LogOut, 
  ArrowLeft,
  Building,
  Camera,
  Upload
} from 'lucide-react';
import type { Company, Department } from '../types';

const Admin: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, deptRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/departments')
      ]);
      if (compRes.ok) setCompanies(await compRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCompany) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingCompany({ ...editingCompany, logo: reader.result as string });
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
      }
    } catch (error) {
       console.error('Error saving company:', error);
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

  const handleSaveDept = async () => {
    if (!editingDept?.name || !editingDept?.companyId) return;
    try {
      const method = editingDept.id ? 'PATCH' : 'POST';
      const url = editingDept.id ? `/api/departments/${editingDept.id}` : '/api/departments';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDept)
      });

      if (res.ok) {
        setEditingDept(null);
        fetchData();
      }
    } catch (error) {
       console.error('Error saving department:', error);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FFFFFF', color: '#1E293B' }}>
      <div className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', border: '3px solid rgba(0,0,0,0.05)', borderTopColor: '#FFD919', borderRadius: '50%', marginBottom: '1rem' }}></div>
      <p style={{ fontWeight: 500 }}>Carregando Administração...</p>
    </div>
  );

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B' }}>
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
        zIndex: 10,
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

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          
          {/* Companies Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#1E293B' }}>
                <Building size={24} color="#FFD919" fill="#FFD919" style={{ opacity: 0.8 }} /> Companhias
              </h2>
              <button 
                onClick={() => setEditingCompany({ fantasyName: '', realName: '', logo: '', description: '' })}
                className="btn-primary" 
                style={{ padding: '0.5rem 1rem' }}
              >
                <Plus size={18} /> Nova
              </button>
            </div>

            <div className="card-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editingCompany && (
                <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #FFD919', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(255,217,25,0.1)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1E293B' }}>{editingCompany.id ? 'Editar Companhia' : 'Nova Companhia'}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '0.4rem', display: 'block' }}>Nome Fantasia</label>
                      <input 
                        placeholder="Ex: V.tal" 
                        value={editingCompany.fantasyName || ''} 
                        onChange={e => setEditingCompany({...editingCompany, fantasyName: e.target.value})}
                        style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontSize: '0.95rem' }}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '0.4rem', display: 'block' }}>Razão Social</label>
                      <input 
                        placeholder="Ex: V.tal Rede Neutra S.A." 
                        value={editingCompany.realName || ''} 
                        onChange={e => setEditingCompany({...editingCompany, realName: e.target.value})}
                        style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontSize: '0.95rem' }}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '0.4rem', display: 'block' }}>Logo da Companhia</label>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          style={{ 
                            width: 120, 
                            height: 120, 
                            borderRadius: '12px', 
                            background: '#F8FAFC', 
                            border: '2px dashed #E2E8F0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = '#FFD919';
                            e.currentTarget.style.background = '#FFFBEB';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = '#E2E8F0';
                            e.currentTarget.style.background = '#F8FAFC';
                          }}
                        >
                          {editingCompany.logo ? (
                            <>
                              <img src={editingCompany.logo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
                              <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', padding: '4px', display: 'flex', justifyContent: 'center' }}>
                                <Camera size={14} color="white" />
                              </div>
                            </>
                          ) : (
                            <>
                              <Upload size={24} color="#94A3B8" />
                              <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '8px', fontWeight: 600 }}>Upload Logo</span>
                            </>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
                            Clique no quadro ao lado para carregar o logotipo da empresa. 
                            Formatos sugeridos: PNG ou SVG com fundo transparente.
                          </p>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button onClick={handleSaveCompany} className="btn-primary" style={{ flex: 2, height: '48px', fontWeight: 700, fontSize: '1rem' }}>Salvar</button>
                      <button onClick={() => setEditingCompany(null)} className="btn-secondary" style={{ flex: 1, height: '48px', fontWeight: 600, border: '1px solid #E2E8F0', background: 'white' }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}

              {companies.map(company => (
                <div key={company.id} style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 44, height: 44, background: '#F1F5F9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                      {company.logo ? <img src={company.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building size={22} color="#64748B" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{company.fantasyName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>{company.id}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setEditingCompany(company)} style={{ padding: '0.4rem', color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={18} /></button>
                    <button onClick={() => handleDeleteCompany(company.id)} style={{ padding: '0.4rem', color: '#F87171', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Departments Section */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#1E293B' }}>
                <Users size={24} color="#FFD919" fill="#FFD919" style={{ opacity: 0.8 }} /> Departamentos
              </h2>
              <button 
                onClick={() => setEditingDept({ name: '', companyId: companies[0]?.id })}
                className="btn-primary" 
                style={{ padding: '0.5rem 1rem' }}
                disabled={companies.length === 0}
              >
                <Plus size={18} /> Novo
              </button>
            </div>

            <div className="card-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editingDept && (
                <div style={{ background: '#FFFFFF', padding: '1.75rem', borderRadius: '12px', border: '1px solid #FFD919', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(255,217,25,0.1)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1E293B' }}>{editingDept.id ? 'Editar Departamento' : 'Novo Departamento'}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '0.4rem', display: 'block' }}>Companhia</label>
                      <select 
                        value={editingDept.companyId || ''} 
                        onChange={e => setEditingDept({...editingDept, companyId: e.target.value})}
                        style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontSize: '0.95rem' }}
                      >
                        <option value="">Selecionar Companhia</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.fantasyName}</option>)}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '0.4rem', display: 'block' }}>Nome do Departamento</label>
                      <input 
                        placeholder="Ex: Tecnologia da Informação" 
                        value={editingDept.name || ''} 
                        onChange={e => setEditingDept({...editingDept, name: e.target.value})}
                        style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', fontSize: '0.95rem' }}
                      />
                    </div>

                      <div style={{ padding: '1.25rem', background: '#F1F5F9', borderRadius: '10px', border: '1px dashed #CBD5E1' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={16} /> Usuário Master (Head)
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <input 
                            placeholder="Nome do Head" 
                            value={editingDept.masterUser?.name || ''}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#1E293B' }}
                            onChange={e => setEditingDept({...editingDept, masterUser: {...editingDept.masterUser, name: e.target.value} as any})}
                          />
                          <input 
                            placeholder="E-mail Corporativo" 
                            value={editingDept.masterUser?.email || ''}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#1E293B' }}
                            onChange={e => setEditingDept({...editingDept, masterUser: {...editingDept.masterUser, email: e.target.value} as any})}
                          />
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.75rem', fontStyle: 'italic' }}>* Senha padrão: 123456</p>
                      </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button onClick={handleSaveDept} className="btn-primary" style={{ flex: 2, height: '48px', fontWeight: 700, fontSize: '1rem' }}>Salvar</button>
                      <button onClick={() => setEditingDept(null)} className="btn-secondary" style={{ flex: 1, height: '48px', fontWeight: 600, border: '1px solid #E2E8F0', background: 'white' }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}

              {departments.map(dept => {
                const company = companies.find(c => c.id === dept.companyId);
                return (
                  <div key={dept.id} style={{ background: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{dept.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{company?.fantasyName || 'Desconhecido'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setEditingDept(dept)} style={{ padding: '0.4rem', color: '#64748B', background: 'transparent', border: 'none', cursor: 'pointer' }}><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteDept(dept.id)} style={{ padding: '0.4rem', color: '#F87171', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Admin;
