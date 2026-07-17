import React, { useState } from 'react';
import { Share, X, Smartphone } from 'lucide-react';
import { useIsStandalone } from './useIsStandalone';
import { useInstallPrompt } from './useInstallPrompt';

const DISMISS_STORAGE_KEY = 'pwa-install-dismissed-at';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function isDismissedRecently(): boolean {
  const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

function isMobileUserAgent(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

const InstallPromptBanner: React.FC = () => {
  const isStandalone = useIsStandalone();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(isDismissedRecently);
  const [isMobile] = useState(isMobileUserAgent);

  if (isStandalone || dismissed || !isMobile) return null;
  if (!canInstall && !isIosSafari()) return null;

  const handleDismiss = () => {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '0.75rem',
        right: '0.75rem',
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
        zIndex: 999998,
        background: '#0F1117',
        color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-md, 10px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <Smartphone size={20} color="#FFD919" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.4 }}>
        {canInstall ? (
          <span>Prefere usar o app do Oráculo? Instale para uma experiência mais rápida.</span>
        ) : (
          <span>
            Instale o app do Oráculo: toque em <Share size={13} style={{ verticalAlign: 'middle', margin: '0 2px' }} /> e depois em "Adicionar à Tela de Início".
          </span>
        )}
      </div>
      {canInstall && (
        <button
          onClick={() => void promptInstall()}
          style={{
            background: '#FFD919',
            color: '#181919',
            border: 'none',
            borderRadius: '6px',
            padding: '0.4rem 0.75rem',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Instalar
        </button>
      )}
      <button
        onClick={handleDismiss}
        aria-label="Fechar"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          padding: '0.25rem',
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default InstallPromptBanner;
