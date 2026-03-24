import React, { useState, useRef } from 'react';
import { X, Camera, Save, Mail, User as UserIcon, Upload } from 'lucide-react';
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
    <div className="modal-overlay" style={{ zIndex: 1000000 }}>
      <div className="glass-panel modal-content" style={{ 
        maxWidth: '500px', 
        width: '95%', 
        background: 'white',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '2rem'
      }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
          <h2 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserIcon size={20} /> Preferências do Usuário
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.4rem', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="form-container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Avatar Section */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  background: 'var(--bg-app)', 
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Sua foto de perfil será exibida para outros colaboradores.
                </p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Nome Completo</label>
              <input 
                type="text" 
                value={formData.fullName} 
                onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label>E-mail Pessoal / Contato</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Link da Foto (URL)</label>
              <input 
                type="text" 
                value={formData.photoUrl} 
                onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} 
                placeholder="https://..."
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Alternativamente ao upload, você pode colar uma URL direta para sua imagem.
              </span>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className="btn btn-glass" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '140px' }} disabled={isSaving}>
              {isSaving ? 'Salvando...' : (
                <>
                  <Save size={18} /> Salvar Preferências
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
