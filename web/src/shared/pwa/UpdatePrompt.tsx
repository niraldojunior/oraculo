import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdatePrompt: React.FC = () => {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        background: '#0F1117',
        color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-md, 10px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.85rem',
      }}
    >
      <span>Nova versão disponível</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#FFD919',
          color: '#181919',
          border: 'none',
          borderRadius: '6px',
          padding: '0.4rem 0.75rem',
          fontWeight: 700,
          fontSize: '0.8rem',
          cursor: 'pointer',
        }}
      >
        Atualizar
      </button>
    </div>
  );
};

export default UpdatePrompt;
