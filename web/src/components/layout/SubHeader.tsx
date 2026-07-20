import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { findViewByPath } from '@/config/navigation';
import { useView } from '@/context/ViewContext';
import InitiativeFilterMenu from '@/components/common/InitiativeFilterMenu';
import { ViewToolbar } from './HeaderControls';

/**
 * Segunda faixa de cabeçalho, específica da visão atual (D14).
 *
 * O header principal cuida do escopo amplo — gestor selecionado, troca de visão,
 * filtros da seção. Este sub-header cuida do que é da visão: identificação e
 * ações (criar, buscar, configurar, excluir selecionados).
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
  const { subHeaderContent, subHeaderActions, subHeaderTitle } = useView();

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

  const Icon = currentView?.icon ?? LayoutDashboard;
  const label = hasViewToolbar ? currentView.label : subHeaderTitle;

  return (
    <div className="sub-header">
      {label && (
        <div className="sub-header-title">
          <Icon size={13} />
          <span>{label}</span>
        </div>
      )}
      {subHeaderContent && <div className="sub-header-lead">{subHeaderContent}</div>}
      <div className="sub-header-actions">
        {subHeaderActions}
        {hasViewToolbar && (
          <>
            {currentView.domainFilter === 'initiative' && <InitiativeFilterMenu />}
            <ViewToolbar
              toolbar={currentView.toolbar}
              isMobile={isMobile}
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SubHeader;
