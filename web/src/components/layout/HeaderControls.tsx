import React, { useRef } from 'react';
import { useView } from '@/context/ViewContext';
import type { ToolbarFlags } from '@/config/navigation';
import { Plus, Search, Trash2, Settings } from 'lucide-react';

/** Caixa de busca animada — compartilhada pelo header principal e pelo sub-header (D14). */
export const SearchBox: React.FC<{
  value: string;
  onChange: (v: string) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}> = ({ value, onChange, isOpen, setIsOpen }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`header-search ${isOpen ? 'is-open' : ''}`}>
      <div className="header-search-field">
        <input
          ref={inputRef}
          placeholder="Buscar..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="header-search-toggle"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (!next) onChange('');
          else setTimeout(() => inputRef.current?.focus(), 260);
        }}
        title={isOpen ? 'Fechar busca' : 'Buscar'}
      >
        <Search size={15} />
      </button>
    </div>
  );
};

export const HeaderIconButton: React.FC<{
  onClick: () => void;
  title: string;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
}> = ({ onClick, title, variant = 'default', children }) => (
  <button
    type="button"
    className={`header-icon-btn ${variant === 'danger' ? 'header-icon-btn--danger' : ''}`}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);

/**
 * Ações da visão atual (adicionar, buscar, configurar, excluir selecionados).
 * Renderizado no header principal ou no sub-header conforme `toolbarPlacement`
 * da visão em `navigation.ts` (D14).
 */
export const ViewToolbar: React.FC<{
  toolbar: ToolbarFlags;
  isMobile: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
}> = ({ toolbar, isMobile, isSearchOpen, setIsSearchOpen }) => {
  const {
    searchTerm,
    setSearchTerm,
    onAddAction,
    selectedCount,
    onDeleteAction,
    onSettingsAction,
  } = useView();

  return (
    <>
      {toolbar.add && !(isMobile && isSearchOpen) && onAddAction && (
        <HeaderIconButton onClick={() => onAddAction()} title={toolbar.addLabel ?? 'Adicionar Novo'}>
          <Plus size={16} />
        </HeaderIconButton>
      )}
      {toolbar.search && (
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
          isOpen={isSearchOpen}
          setIsOpen={setIsSearchOpen}
        />
      )}
      {toolbar.settings && (
        <HeaderIconButton onClick={() => onSettingsAction?.()} title="Configurações">
          <Settings size={15} />
        </HeaderIconButton>
      )}
      {toolbar.delete && selectedCount > 0 && onDeleteAction && (
        <HeaderIconButton
          onClick={() => onDeleteAction()}
          title={`Excluir ${selectedCount} selecionados`}
          variant="danger"
        >
          <Trash2 size={14} />
        </HeaderIconButton>
      )}
    </>
  );
};
