import React, { useState } from 'react';
import { X, Building, Save, FileText, Globe, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CompanyInfoModalProps {
  onClose: () => void;
}

const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({ onClose }) => {
  const { currentCompany, currentDepartment } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [companyData, setCompanyData] = useState({
    fantasyName: currentCompany?.fantasyName || '',
    realName: currentCompany?.realName || '',
    logo: currentCompany?.logo || '',
    description: currentCompany?.description || ''
  });

  const [deptData, setDeptData] = useState({
    name: currentDepartment?.name || ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (currentCompany) {
        await fetch(`/api/companies/${currentCompany.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData)
        });
      }
      
      if (currentDepartment) {
        await fetch(`/api/departments/${currentDepartment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deptData)
        });
      }

      // We should ideally refresh the context here, but for now let's just close and assume refetch on next load
      // Realistically, switchCompany(currentCompany.id) would trigger a refresh in our AuthContext setup
      setIsSaving(false);
      setIsEditing(false);
      window.location.reload(); // Quickest way to refresh AuthContext for now
    } catch (err) {
      console.error('Failed to save company/dept info', err);
      setIsSaving(false);
    }
  };

  if (!currentCompany) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)' }}>
      <div className="modal-content" style={{ maxWidth: '650px', padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255, 255, 255, 0.95)' }}>
        
        {/* Enhanced Header */}
        <div style={{ padding: '2.5rem 2.5rem 1.5rem', position: 'relative', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            background: 'var(--accent-base)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(255, 217, 25, 0.25)',
            marginBottom: '1.25rem'
          }}>
            <Building size={28} color="black" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Dados da Organização</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Informações corporativas e segmentação por departamento.</p>
          
          <button 
            onClick={onClose} 
            className="btn-close" 
            style={{ top: '1.5rem', right: '1.5rem', background: 'white' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '2.5rem' }}>
          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ 
                  width: 100, 
                  height: 100, 
                  background: 'white', 
                  borderRadius: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '1.25rem',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                  border: '1px solid var(--glass-border)'
                }}>
                  {currentCompany.logo ? (
                    <img src={currentCompany.logo} alt={currentCompany.fantasyName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Building size={40} color="var(--text-tertiary)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>{currentCompany.fantasyName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)' }}>
                    <Globe size={16} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{currentCompany.realName}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.25rem', background: '#FDFDFD', borderStyle: 'dashed' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Departamento Alvo</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-green)' }}></div>
                    <p style={{ fontWeight: 800, fontSize: '1rem' }}>{currentDepartment?.name || 'Não vinculado'}</p>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '1.25rem', background: '#F8FAFC' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>ID de Identificação</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={16} color="var(--text-tertiary)" />
                    <code style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{currentCompany.id}</code>
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Propósito e Descrição</p>
                <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', background: 'white' }}>
                  <p className="text-secondary" style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                    {currentCompany.description || 'Nenhuma descrição detalhada disponível para esta organização.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <button 
                  className="btn" 
                  onClick={() => setIsEditing(true)}
                  style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)', padding: '0.75rem 1.5rem' }}
                >
                  Editar Dados
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={onClose}
                  style={{ padding: '0.75rem 2rem', fontWeight: 700 }}
                >
                  Confirmar e Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                    Nome Fantasia
                  </label>
                  <div className="search-box-premium" style={{ width: '100%' }}>
                    <Building size={18} color="var(--text-tertiary)" />
                    <input 
                      type="text" 
                      required
                      value={companyData.fantasyName}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, fantasyName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                    Razão Social
                  </label>
                  <div className="search-box-premium" style={{ width: '100%' }}>
                    <FileText size={18} color="var(--text-tertiary)" />
                    <input 
                      type="text" 
                      required
                      value={companyData.realName}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, realName: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                  URL do Logotipo
                </label>
                <div className="search-box-premium" style={{ width: '100%' }}>
                  <Globe size={18} color="var(--text-tertiary)" />
                  <input 
                    type="text" 
                    required
                    value={companyData.logo}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, logo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                  Segmento / Departamento
                </label>
                <div className="search-box-premium" style={{ width: '100%' }}>
                  <Info size={18} color="var(--text-tertiary)" />
                  <input 
                    type="text" 
                    required
                    value={deptData.name}
                    onChange={(e) => setDeptData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                  Descrição da Organização
                </label>
                <textarea 
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-app)',
                    fontSize: '1rem',
                    minHeight: '120px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-base)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                  value={companyData.description}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setIsEditing(false)} 
                  disabled={isSaving}
                  style={{ background: 'var(--bg-app)', color: 'var(--text-secondary)', padding: '0.75rem 1.5rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSaving}
                  style={{ padding: '0.75rem 2rem', fontWeight: 700 }}
                >
                  {isSaving ? 'Salvando...' : (
                    <>
                      <Save size={18} />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoModal;
