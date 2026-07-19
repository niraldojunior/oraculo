import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Rede de segurança para falhas de dynamic import (chunk removido por um
 * deploy novo enquanto a aba estava aberta). lazyWithRetry já tenta um
 * reload automático antes de chegar aqui; se mesmo assim o erro escapar,
 * mostramos um fallback com opção de recarregar manualmente.
 */
export class ChunkErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error('ChunkErrorBoundary', error);
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex-center" style={{ height: '100vh', background: '#0F1117', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Não foi possível carregar a tela.</p>
          <button className="btn btn-primary btn-md" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}

export default ChunkErrorBoundary;
