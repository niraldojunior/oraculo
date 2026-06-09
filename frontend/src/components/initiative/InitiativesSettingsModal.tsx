import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import type { InitiativeSettings } from '@/hooks/useInitiativeSettings';

interface Props {
  current: InitiativeSettings;
  onSave: (settings: InitiativeSettings) => void;
  onClose: () => void;
}

export function InitiativesSettingsModal({ current, onSave, onClose }: Props) {
  const [azureBaseUrl, setAzureBaseUrl] = useState(current.azureBaseUrl);

  const handleSave = () => {
    onSave({ azureBaseUrl: azureBaseUrl.trim() });
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'white', borderRadius: 12, width: 480, maxWidth: '92vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={16} color="#64748B" />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>Configurações — Iniciativas</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, borderRadius: 6, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Section: Azure */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Azure DevOps</span>
              <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>URL base dos Work Items</span>
              <input
                type="url"
                value={azureBaseUrl}
                onChange={e => setAzureBaseUrl(e.target.value)}
                placeholder="https://dev.azure.com/org/projeto/_workitems/edit/"
                style={{ border: '1px solid #D1D5DB', borderRadius: 8, padding: '0.6rem 0.75rem', fontSize: '0.78rem', outline: 'none', color: '#0F172A' }}
              />
              <span style={{ fontSize: '0.68rem', color: '#94A3B8', lineHeight: 1.4 }}>
                Quando preenchido, ao cadastrar um link externo do tipo Azure será necessário apenas o número do Work Item. A URL final será: <em>URL base + número</em>.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', padding: '0.9rem 1.25rem', borderTop: '1px solid #E2E8F0' }}>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', background: '#F1F5F9', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ padding: '0.5rem 1.1rem', background: '#1D4ED8', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: 'white', cursor: 'pointer' }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
