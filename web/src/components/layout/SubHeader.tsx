import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { findViewByPath } from '@/config/navigation';
import { useView } from '@/context/ViewContext';
import InitiativeFilterMenu from '@/components/common/InitiativeFilterMenu';
import { SearchBox, ViewToolbar } from './HeaderControls';

/**
 * Segunda faixa de cabeçalho, específica da visão atual (D14).
 *
 * O header principal cuida do escopo amplo — gestor selecionado, troca de visão,
 * filtros da seção. Este sub-header cuida do que é da visão: ações (criar,
 * buscar, configurar, excluir selecionados). Não repete o rótulo da visão —
 * ele já está no `ViewMenu` da faixa 1 — e a busca ocupa o canto esquerdo,
 * onde esse rótulo ficava antes.
 *
 * Renderiza em dois casos:
 *  1. visões marcadas com `toolbarPlacement: 'subheader'` em `navigation.ts`;
 *  2. páginas sem `ViewDef` que injetam `subHeaderContent` via `ViewContext`
 *     — hoje o Dashboard, cuja visão não é roteada.
 *
 * Fora esses casos a faixa some por completo e o layout não muda.
 */
const SubHeader: React.FC = () => {
  const location = useLocation();
  const currentView = findViewByPath(location.pathname);
  const { subHeaderContent, subHeaderActions, searchTerm, setSearchTerm } = useView();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const hasViewToolbar = currentView?.toolbarPlacement === 'subheader';
  const hasInjected = Boolean(subHeaderContent || subHeaderActions);
  if (!hasViewToolbar && !hasInjected) return null;

  const searchInLead = hasViewToolbar && Boolean(currentView.toolbar.search);
  // Rótulo textual ao lado dos ícones em toda visão com `toolbarPlacement: 'subheader'`
  // (Iniciativas, Pessoas) — não se aplica ao header principal (D13/D14: trigger
  // de visão e demais controles do header seguem icon-only).
  const showLabels = hasViewToolbar;

  return (
    <div className="sub-header">
      {(searchInLead || subHeaderContent) && (
        <div className="sub-header-lead">
          {searchInLead && (
            <SearchBox
              value={searchTerm}
              onChange={setSearchTerm}
              isOpen={isSearchOpen}
              setIsOpen={setIsSearchOpen}
              label={showLabels ? 'Pesquisar' : undefined}
            />
          )}
          {hasViewToolbar && currentView.domainFilter === 'initiative' && (
            <InitiativeFilterMenu openTo="right" showLabel />
          )}
          {subHeaderContent}
        </div>
      )}
      <div className="sub-header-actions">
        {subHeaderActions}
        {hasViewToolbar && (
          <ViewToolbar
            toolbar={searchInLead ? { ...currentView.toolbar, search: false } : currentView.toolbar}
            isMobile={isMobile}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            showLabels={showLabels}
          />
        )}
      </div>
    </div>
  );
};

export default SubHeader;
