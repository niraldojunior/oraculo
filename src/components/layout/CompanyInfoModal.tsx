import React, { useState } from 'react';
import { X, Building, FileText, Globe, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface CompanyInfoModalProps {
  onClose: () => void;
}

const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({ onClose }) => {
  const { currentCompany, currentDepartment } = useAuth();
  useEscapeKey(onClose);
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
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content glass-effect" style={{ maxWidth: '950px', padding: 0, overflow: 'hidden' }}>
        
        {/* Modern Header */}
        <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '44px', height: '44px', background: 'var(--accent-base)', 
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 217, 25, 0.3)'
            }}>
              <Building size={22} color="black" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {isEditing ? 'Gerenciar Organização' : 'Dados da Organização'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>
                {isEditing ? 'Atualize as informações corporativas e identidade visual' : 'Visualização das informações corporativas cadastradas'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close" style={{ position: 'static' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '2.5rem' }}>
          {isEditing ? (
            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem' }}>
              {/* Left Column: Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                    Segmento / Departamento Alvo
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

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => setIsEditing(false)}
                    style={{ background: '#FEE2E2', color: '#B91C1C', flex: 1, fontWeight: 700, border: '1px solid #FECACA' }}
                  >
                    Descartar Alterações
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSaving}
                    style={{ flex: 1.5, fontWeight: 700 }}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>

              {/* Right Column: Identity Preview & Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Identidade Visual</p>
                  <div style={{ 
                    width: 140, 
                    height: 140, 
                    background: 'white', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '1.5rem',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.06)',
                    border: '4px solid white',
                    overflow: 'hidden'
                  }}>
                    {companyData.logo ? (
                      <img src={companyData.logo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Building size={48} color="var(--text-tertiary)" />
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Visualize como seu logotipo será exibido nos painéis.</p>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' }}>
                    Descrição do Propósito
                  </label>
                  <textarea 
                    style={{ 
                      width: '100%', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)',
                      background: 'white', fontSize: '0.95rem', minHeight: '160px', fontFamily: 'inherit',
                      outline: 'none', transition: 'box-shadow 0.2s', resize: 'none'
                    }}
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 217, 25, 0.2)'}
                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                    value={companyData.description}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o propósito e visão da organização..."
                  />
                </div>
              </div>
            </form>
          ) : (
            /* View Mode - Also formatted in 2 columns for consistency */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ 
                    width: 80, height: 80, background: 'white', borderRadius: '20px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)'
                  }}>
                    {currentCompany.logo ? (
                      <img src={currentCompany.logo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Building size={32} color="#CBD5E1" />
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{currentCompany.fantasyName}</h3>
                    <p style={{ fontSize: '1rem', color: 'var(--text-tertiary)', margin: '0.25rem 0 0' }}>{currentCompany.realName}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.25rem', background: '#F8FAFC' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Departamento</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-green)' }}></div>
                      <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>{currentDepartment?.name || 'Geral'}</p>
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '1.25rem', background: '#F8FAFC' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>ID Ãšnico</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{currentCompany.id}</code>
                    </div>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Descrição</p>
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
                    {currentCompany.description || 'Nenhuma descrição disponível.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ 
                  padding: '1.5rem', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', 
                  borderRadius: '24px', border: '1px solid var(--glass-border)' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Building size={18} color="var(--text-tertiary)" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Segmentação</span>
                  </div>
                  {/* Mock content for visualization in 2nd column */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ padding: '0.4rem 0.8rem', background: 'white', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #E2E8F0' }}>MATRIZ</span>
                    <span style={{ padding: '0.4rem 0.8rem', background: 'white', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #E2E8F0' }}>OPERACIONAL</span>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsEditing(true)}
                  style={{ padding: '1rem', width: '100%', fontWeight: 700 }}
                >
                  Editar Dados da Organização
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoModal;

