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
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-container" style={{ maxWidth: '450px', width: '90%' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Preferências do Usuário</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                width: 100, 
                height: 100, 
                borderRadius: 'var(--radius-full)', 
                overflow: 'hidden',
                border: '4px solid white',
                boxShadow: 'var(--shadow-md)',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={40} color="var(--text-tertiary)" />
                )}
              </div>
              <label 
                htmlFor="photo-upload" 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '16px',
                  background: 'var(--accent-base)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid white',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Camera size={16} />
                <input 
                  id="photo-upload" 
                  type="text" 
                  style={{ display: 'none' }} 
                  placeholder="URL da Foto"
                  onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                />
              </label>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Insira a URL de uma nova foto de perfil
            </p>
          </div>

          <div className="form-group">
            <label className="label-premium">Nome Completo</label>
            <div className="search-box-premium" style={{ width: '100%' }}>
              <UserIcon size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                required
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label-premium">E-mail</label>
            <div className="search-box-premium" style={{ width: '100%' }}>
              <Mail size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Seu e-mail"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label-premium">URL da Foto de Perfil</label>
            <div className="search-box-premium" style={{ width: '100%' }}>
              <Camera size={18} style={{ color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                value={formData.photoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : (
                <>
                  <Save size={18} />
                  Salvar Preferências
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
