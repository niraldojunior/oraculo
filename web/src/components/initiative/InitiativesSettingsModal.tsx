import { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';
import type { InitiativeSettings } from '@/hooks/useInitiativeSettings';

interface Props {
  current: InitiativeSettings;
  onSave: (settings: InitiativeSettings) => void;
  onClose: () => void;
}

export function InitiativesSettingsModal({ current, onSave, onClose }: Props) {
  const [azureBaseUrl, setAzureBaseUrl] = useState(current.azureBaseUrl);
  const [helixBaseUrl, setHelixBaseUrl] = useState(current.helixBaseUrl);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [onClose]);

  const handleSave = () => {
    onSave({ azureBaseUrl: azureBaseUrl.trim(), helixBaseUrl: helixBaseUrl.trim() });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--header-height, 0px)',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '480px',
          maxWidth: '92vw',
          boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.2)',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={16} style={{ color: '#64748B' }} />
            Configurações — Iniciativas
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: '#F1F3F5',
              color: '#495057',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '50%',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '0.5rem 2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Azure DevOps</span>
              <div style={{ flex: 1, height: 1, background: '#F1F3F5' }} />
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568' }}>URL base dos Work Items</span>
              <input
                type="url"
                value={azureBaseUrl}
                onChange={e => setAzureBaseUrl(e.target.value)}
                placeholder="https://dev.azure.com/org/projeto/_workitems/edit/"
                style={{ border: 'none', borderRadius: '8px', padding: '0.65rem 0.9rem', fontSize: '0.85rem', outline: 'none', color: '#495057', background: '#F1F3F5', width: '100%' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Quando preenchido, ao cadastrar um link externo do tipo Azure será necessário apenas o número do Work Item. A URL final será: <em>URL base + número</em>.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>BMC Helix</span>
              <div style={{ flex: 1, height: 1, background: '#F1F3F5' }} />
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568' }}>URL base dos tickets</span>
              <input
                type="url"
                value={helixBaseUrl}
                onChange={e => setHelixBaseUrl(e.target.value)}
                placeholder="https://helix.suaempresa.com/arsys/forms/...?id="
                style={{ border: 'none', borderRadius: '8px', padding: '0.65rem 0.9rem', fontSize: '0.85rem', outline: 'none', color: '#495057', background: '#F1F3F5', width: '100%' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Quando preenchido, ao cadastrar um link externo do tipo BMC Helix será necessário apenas o número do ticket. A URL final será: <em>URL base + número</em>.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', padding: '0.5rem 2rem 1.5rem' }}>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', background: '#F1F3F5', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#495057', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '0.5rem 1.25rem', background: '#FFD21E', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#111827', cursor: 'pointer' }}
          >
            Salvar
          </button>
        </div>

        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
