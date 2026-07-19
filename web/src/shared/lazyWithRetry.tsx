import React from 'react';

const RELOAD_FLAG = 'oraculo:chunk-reload';

/**
 * Wrapper sobre React.lazy: se o import() de um chunk falhar (deploy trocou
 * os hashes enquanto a aba estava aberta), recarrega a página uma única vez
 * — a flag em sessionStorage evita loop caso o problema não seja o chunk.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      const module = await factory();
      window.sessionStorage.removeItem(RELOAD_FLAG);
      return module;
    } catch (error) {
      const alreadyReloaded = window.sessionStorage.getItem(RELOAD_FLAG) === '1';
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(RELOAD_FLAG, '1');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
