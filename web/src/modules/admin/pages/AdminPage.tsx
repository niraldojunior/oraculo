import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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
import Button from '@/components/common/Button.js';
import Input from '@/components/common/Input.js';
import ConfirmDialog from '@/components/common/ConfirmDialog.js';
import type { Company, Department, Collaborator } from '../../../types';
import {
  deleteCompany as deleteCompanyApi,
  deleteDepartment as deleteDepartmentApi,
  fetchAdminData,
  saveCompany as saveCompanyApi,
  saveDepartment as saveDepartmentApi
} from '../services/adminApi';

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'company' | 'dept'; id: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const collabFileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminData();
      setCompanies(data.companies);
      setDepartments(data.departments);
      setCollaborators(data.collaborators);
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
      await saveCompanyApi(editingCompany);
      setEditingCompany(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving company:', error);
    }
  };

  const handleSaveDept = async () => {
    if (!editingDept?.name || !editingDept?.companyId) return;
    try {
      await saveDepartmentApi(editingDept);
      setEditingDept(null);
      setShowNewCollabForm(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving department:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'company') {
        await deleteCompanyApi(deleteConfirm.id);
      } else {
        await deleteDepartmentApi(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading)
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p>Carregando Administração...</p>
      </div>
    );

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-header-icon">
            <Building2 size={24} />
          </div>
          <div className="admin-header-title">
            <h1>Administração Oráculo</h1>
            <p>Gestão de Plataforma</p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <ArrowLeft size={18} /> Voltar para App
          </button>
          <div className="admin-header-divider"></div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn btn-danger"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-section-header">
          <h2 className="admin-section-title">
            <Building size={28} /> Gerenciamento de Companhias
          </h2>
          <Button
            variant="primary"
            onClick={() =>
              setEditingCompany({
                fantasyName: '',
                realName: '',
                logo: '',
                description: ''
              })
            }
          >
            <Plus size={18} /> Nova Companhia
          </Button>
        </div>

        <div className="admin-company-list">
          {companies.map((company) => {
            const isExpanded = expandedCompanyId === company.id;
            const companyDepts = departments.filter((d) => d.companyId === company.id);

            return (
              <div key={company.id} className="admin-company-card">
                <div
                  className="admin-company-header"
                  onClick={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                  style={{ background: isExpanded ? 'var(--bg-card-hover)' : 'transparent', borderBottom: isExpanded ? '1px solid var(--glass-border)' : 'none' }}
                >
                  <div className="admin-company-info">
                    <div className="admin-company-logo">
                      {company.logo ? (
                        <img loading="lazy" src={company.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Building size={24} color="var(--text-secondary)" />
                      )}
                    </div>
                    <div className="admin-company-details">
                      <h3>{company.fantasyName}</h3>
                      <p>
                        {companyDepts.length} {companyDepts.length === 1 ? 'departamento' : 'departamentos'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCompany(company);
                      }}
                      className="btn btn-ghost"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'company', id: company.id });
                      }}
                      className="btn btn-ghost"
                      style={{ color: 'var(--status-red)' }}
                      title="Deletar"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronDown size={20} style={{ color: 'var(--text-tertiary)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: 'var(--space-6)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                      <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-extrabold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        Departamentos da {company.fantasyName}
                      </h4>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingDept({ name: '', companyId: company.id })}
                      >
                        <Plus size={14} /> Novo
                      </Button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {companyDepts.length === 0 ? (
                        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--glass-border)' }}>
                          Nenhum departamento cadastrado.
                        </div>
                      ) : (
                        companyDepts.map((dept) => {
                          const masterUser = collaborators.find((c) => c.departmentId === dept.id && c.role === 'Master');

                          return (
                            <div
                              key={dept.id}
                              style={{
                                padding: 'var(--space-4)',
                                background: 'var(--bg-app)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-base)', flexShrink: 0 }}></div>
                                <div>
                                  <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{dept.name}</div>
                                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                    {masterUser ? `Master: ${masterUser.name}` : <span style={{ fontStyle: 'italic' }}>Sem Master selecionado</span>}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button
                                  onClick={() => setEditingDept({ ...dept, masterUserId: masterUser?.id })}
                                  className="btn btn-ghost"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'dept', id: dept.id })}
                                  className="btn btn-ghost"
                                  style={{ color: 'var(--status-red)' }}
                                  title="Deletar"
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
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>{editingCompany.id ? 'Editar Companhia' : 'Nova Companhia'}</h3>

            <div className="form-container gap-4">
              <Input
                label="Nome Fantasia"
                placeholder="Ex: V.tal"
                value={editingCompany.fantasyName || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, fantasyName: e.target.value })}
              />

              <Input
                label="Razão Social"
                placeholder="Ex: V.tal Rede Neutra S.A."
                value={editingCompany.realName || ''}
                onChange={(e) => setEditingCompany({ ...editingCompany, realName: e.target.value })}
              />

              <div>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-2)' }}>
                  Logo da Companhia
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'center' }}>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--bg-app)',
                      border: '2px dashed var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {editingCompany.logo ? (
                      <img loading="lazy" src={editingCompany.logo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Upload size={24} color="var(--text-tertiary)" />
                    )}
                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, 'company')} accept="image/*" style={{ display: 'none' }} />
                  </div>
                  <div style={{ flex: 1, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Escolha uma imagem de alta qualidade. Formatos: PNG ou SVG.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <Button variant="primary" onClick={handleSaveCompany} style={{ flex: 1 }}>
                  Salvar Alterações
                </Button>
                <Button variant="secondary" onClick={() => setEditingCompany(null)} style={{ flex: 1 }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {editingDept && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>{editingDept.id ? 'Editar Departamento' : 'Novo Departamento'}</h3>

            <div className="form-container gap-4">
              <div style={{ padding: 'var(--space-4)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>Empresa Associada</div>
                {companies.find((c) => c.id === editingDept.companyId)?.fantasyName}
              </div>

              <Input
                label="Nome do Departamento"
                placeholder="Ex: Infraestrutura de TI"
                value={editingDept.name}
                onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
              />

              {/* Master User Logic */}
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--text-secondary)' }}>
                    Usuário Master
                  </label>
                  <button
                    onClick={() => {
                      setShowNewCollabForm(!showNewCollabForm);
                      if (!showNewCollabForm) {
                        setEditingDept({ ...editingDept, masterUserId: undefined });
                      }
                    }}
                    style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--status-amber)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {showNewCollabForm ? 'Selecionar Existente' : '+ Novo Colaborador'}
                  </button>
                </div>

                {!showNewCollabForm ? (
                  <select
                    value={editingDept.masterUserId || ''}
                    onChange={(e) => setEditingDept({ ...editingDept, masterUserId: e.target.value })}
                    className="input"
                  >
                    <option value="">Selecionar um colaborador existente...</option>
                    {collaborators
                      .filter((c) => c.companyId === editingDept.companyId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                  </select>
                ) : (
                  <div style={{ padding: 'var(--space-4)', background: 'var(--status-amber-dim)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--status-amber)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <div
                        onClick={() => collabFileInputRef.current?.click()}
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: '50%',
                          background: 'var(--bg-card)',
                          border: '2px dashed var(--glass-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {editingDept.masterUser?.photoUrl ? (
                          <img loading="lazy" src={editingDept.masterUser.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Camera size={24} color="var(--text-tertiary)" />
                        )}
                        <input type="file" ref={collabFileInputRef} onChange={(e) => handleFileChange(e, 'collaborator')} accept="image/*" style={{ display: 'none' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-extrabold)', color: '#92400E', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                          Criando Novo Colaborador
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: '#B45309' }}>
                          Associado a: {companies.find((c) => c.id === editingDept.companyId)?.fantasyName} / {editingDept.name || 'Este dpto'}
                        </div>
                      </div>
                    </div>

                    <Input
                      placeholder="Nome Completo"
                      value={editingDept.masterUser?.name || ''}
                      onChange={(e) =>
                        setEditingDept({
                          ...editingDept,
                          masterUser: { ...(editingDept.masterUser || { email: '', name: '' }), name: e.target.value }
                        })
                      }
                    />
                    <Input
                      placeholder="E-mail Corporativo"
                      type="email"
                      value={editingDept.masterUser?.email || ''}
                      onChange={(e) =>
                        setEditingDept({
                          ...editingDept,
                          masterUser: { ...(editingDept.masterUser || { email: '', name: '' }), email: e.target.value }
                        })
                      }
                    />
                    <Input
                      placeholder="Senha de Acesso"
                      type="password"
                      value={editingDept.masterUser?.password || ''}
                      onChange={(e) =>
                        setEditingDept({
                          ...editingDept,
                          masterUser: { ...(editingDept.masterUser || { email: '', name: '' }), password: e.target.value }
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                <Button variant="primary" onClick={handleSaveDept} style={{ flex: 1 }}>
                  Confirmar Mudanças
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingDept(null);
                    setShowNewCollabForm(false);
                  }}
                  style={{ flex: 1 }}
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.type === 'company' ? 'Excluir Companhia' : 'Excluir Departamento'}
        message={
          deleteConfirm?.type === 'company'
            ? 'Esta ação é irreversível. Todos os dados associados serão perdidos.'
            : 'Tem certeza? Esta ação não pode ser desfeita.'
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default Admin;
