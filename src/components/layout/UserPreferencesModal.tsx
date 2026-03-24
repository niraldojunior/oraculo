import React, { useState } from 'react';
import { X, Camera, Save, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserPreferencesModalProps {
  onClose: () => void;
}

const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    photoUrl: user?.photoUrl || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateUser(formData);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 2000, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="modal-container" style={{ maxWidth: '480px', width: '95%', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
        
        {/* Compact Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 32, height: 32, background: 'var(--accent-base)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserIcon size={18} color="black" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Preferências</h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '2rem' }}>
          {/* Compact Avatar Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', background: 'var(--bg-app)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                width: 70, 
                height: 70, 
                borderRadius: '20px', 
                overflow: 'hidden',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={32} color="var(--text-tertiary)" />
                )}
              </div>
              <label 
                htmlFor="photo-upload-compact" 
                style={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 24,
                  height: 24,
                  borderRadius: '8px',
                  background: 'var(--accent-base)',
                  color: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid white',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Camera size={12} />
                <input 
                  id="photo-upload-compact" 
                  type="text" 
                  style={{ display: 'none' }} 
                  onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                />
              </label>
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.1rem' }}>Sua Foto</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Formatos aceitos: JPG, PNG, GIF.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                Nome Completo
              </label>
              <div className="search-box-premium" style={{ width: '100%' }}>
                <UserIcon size={16} color="var(--text-tertiary)" />
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nome do usuário"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                E-mail de Trabalho
              </label>
              <div className="search-box-premium" style={{ width: '100%' }}>
                <Mail size={16} color="var(--text-tertiary)" />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                URL da Foto
              </label>
              <div className="search-box-premium" style={{ width: '100%' }}>
                <Camera size={16} color="var(--text-tertiary)" />
                <input 
                  type="text" 
                  value={formData.photoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                  placeholder="Link para imagem..."
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose} 
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSaving}
              style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
            >
              {isSaving ? 'Salvando...' : (
                <>
                  <Save size={18} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserPreferencesModal;
