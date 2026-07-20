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
  /** Rótulo textual ao lado do ícone quando fechada (ex.: sub-header de Iniciativas). */
  label?: string;
}> = ({ value, onChange, isOpen, setIsOpen, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`header-search ${isOpen ? 'is-open' : ''} ${label ? 'header-search--labeled' : ''}`}>
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
        title={isOpen ? 'Fechar busca' : (label ?? 'Buscar')}
      >
        <Search size={15} />
        {label && <span className="header-search-toggle-label">{label}</span>}
      </button>
    </div>
  );
};

export const HeaderIconButton: React.FC<{
  onClick: () => void;
  title: string;
  variant?: 'default' | 'danger';
  /** Rótulo textual ao lado do ícone (ex.: sub-header de Iniciativas). */
  label?: string;
  children: React.ReactNode;
}> = ({ onClick, title, variant = 'default', label, children }) => (
  <button
    type="button"
    className={`header-icon-btn ${variant === 'danger' ? 'header-icon-btn--danger' : ''} ${label ? 'header-icon-btn--labeled' : ''}`}
    onClick={onClick}
    title={title}
  >
    {children}
    {label && <span className="header-icon-btn-label">{label}</span>}
  </button>
);

/**
 * Ações da visão atual (adicionar, buscar, configurar, excluir selecionados).
 * Renderizado no header principal ou no sub-header conforme `toolbarPlacement`
 * da visão em `navigation.ts` (D14). `showLabels` mostra a função por extenso
 * ao lado do ícone — usado hoje só no sub-header de Iniciativas.
 */
export const ViewToolbar: React.FC<{
  toolbar: ToolbarFlags;
  isMobile: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (v: boolean) => void;
  showLabels?: boolean;
}> = ({ toolbar, isMobile, isSearchOpen, setIsSearchOpen, showLabels = false }) => {
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
        <HeaderIconButton onClick={() => onAddAction()} title={toolbar.addLabel ?? 'Adicionar Novo'} label={showLabels ? 'Criar' : undefined}>
          <Plus size={16} />
        </HeaderIconButton>
      )}
      {toolbar.search && (
        <SearchBox
          value={searchTerm}
          onChange={setSearchTerm}
          isOpen={isSearchOpen}
          setIsOpen={setIsSearchOpen}
          label={showLabels ? 'Pesquisar' : undefined}
        />
      )}
      {toolbar.settings && (
        <HeaderIconButton onClick={() => onSettingsAction?.()} title="Configurações" label={showLabels ? 'Config' : undefined}>
          <Settings size={15} />
        </HeaderIconButton>
      )}
      {toolbar.delete && selectedCount > 0 && onDeleteAction && (
        <HeaderIconButton
          onClick={() => onDeleteAction()}
          title={`Excluir ${selectedCount} selecionados`}
          variant="danger"
          label={showLabels ? 'Excluir' : undefined}
        >
          <Trash2 size={14} />
        </HeaderIconButton>
      )}
    </>
  );
};
