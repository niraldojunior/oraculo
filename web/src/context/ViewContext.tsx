import React, { createContext, useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { findViewByPath, pathForView } from '@/config/navigation';
import type { ViewType } from '@/config/navigation';

export type { ViewType };

interface ViewContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  onAddAction: (() => void) | null;
  registerAddAction: (callback: (() => void) | null) => void;
  selectedCount: number;
  setSelectedCount: (count: number) => void;
  onDeleteAction: (() => void) | null;
  registerDeleteAction: (callback: (() => void) | null) => void;
  onSettingsAction: (() => void) | null;
  registerSettingsAction: (callback: () => void) => void;
  selectedManagerId: string;
  setSelectedManagerId: (id: string) => void;
  selectedInitiativeTypes: string[];
  setSelectedInitiativeTypes: (types: string[]) => void;
  selectedInitiativeStatuses: string[];
  setSelectedInitiativeStatuses: (statuses: string[]) => void;
  headerContent: React.ReactNode | null;
  setHeaderContent: (content: React.ReactNode | null) => void;
  headerLeftActions: React.ReactNode | null;
  setHeaderLeftActions: (content: React.ReactNode | null) => void;
  headerActions: React.ReactNode | null;
  setHeaderActions: (content: React.ReactNode | null) => void;
  /**
   * Conteúdo injetado na segunda faixa de cabeçalho (D14) por páginas que não
   * têm `ViewDef` no registro — hoje o Dashboard, cuja visão não é roteada.
   * Quando presente, o `SubHeader` renderiza mesmo sem `toolbarPlacement`.
   */
  subHeaderContent: React.ReactNode | null;
  setSubHeaderContent: (content: React.ReactNode | null) => void;
  /** Conteúdo injetado ancorado à direita da faixa 2 (ao lado das ações). */
  subHeaderActions: React.ReactNode | null;
  setSubHeaderActions: (content: React.ReactNode | null) => void;
  /** Rótulo da faixa 2 quando o conteúdo vem por injeção; opcional. */
  subHeaderTitle: string | null;
  setSubHeaderTitle: (title: string | null) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // A visão ativa é derivada da URL (D13): cada visão tem rota própria, então
  // link direto, botão voltar e refresh funcionam sem estado paralelo.
  const activeView: ViewType = findViewByPath(location.pathname)?.view ?? 'hierarchy';

  const setActiveView = React.useCallback((view: ViewType) => {
    const path = pathForView(location.pathname, view);
    if (path && path !== location.pathname) navigate(path);
  }, [location.pathname, navigate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [onAddAction, setOnAddAction] = useState<(() => void) | null>(null);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [onDeleteAction, setOnDeleteAction] = useState<(() => void) | null>(null);
  const [onSettingsAction, setOnSettingsAction] = useState<(() => void) | null>(null);
  const [selectedManagerId, setSelectedManagerIdRaw] = useState<string>(
    () => localStorage.getItem('dashboard_manager_id') || 'all'
  );
  const setSelectedManagerId = React.useCallback((id: string) => {
    setSelectedManagerIdRaw(id);
    localStorage.setItem('dashboard_manager_id', id);
  }, []);
  const [selectedInitiativeTypes, setSelectedInitiativeTypesRaw] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem('initiative_type_filter');
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
        // migrate legacy single-value string
        return parsed === 'all' ? [] : [parsed];
      } catch {
        return [];
      }
    }
  );
  const setSelectedInitiativeTypes = React.useCallback((types: string[]) => {
    setSelectedInitiativeTypesRaw(types);
    localStorage.setItem('initiative_type_filter', JSON.stringify(types));
  }, []);
  const [selectedInitiativeStatuses, setSelectedInitiativeStatusesRaw] = useState<string[]>(
    () => {
      try {
        return JSON.parse(localStorage.getItem('initiative_status_filter') || '[]');
      } catch {
        return [];
      }
    }
  );
  const setSelectedInitiativeStatuses = React.useCallback((statuses: string[]) => {
    setSelectedInitiativeStatusesRaw(statuses);
    localStorage.setItem('initiative_status_filter', JSON.stringify(statuses));
  }, []);
  const [headerContent, setHeaderContent] = useState<React.ReactNode | null>(null);
  const [headerLeftActions, setHeaderLeftActions] = useState<React.ReactNode | null>(null);
  const [headerActions, setHeaderActions] = useState<React.ReactNode | null>(null);
  const [subHeaderContent, setSubHeaderContent] = useState<React.ReactNode | null>(null);
  const [subHeaderActions, setSubHeaderActions] = useState<React.ReactNode | null>(null);
  const [subHeaderTitle, setSubHeaderTitle] = useState<string | null>(null);

  const setSearchTermCallback = React.useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const setIsSearchOpenCallback = React.useCallback((open: boolean) => {
    setIsSearchOpen(open);
  }, []);

  const registerAddAction = React.useCallback((callback: (() => void) | null) => {
    setOnAddAction(callback ? () => callback : null);
  }, []);

  const registerDeleteAction = React.useCallback((callback: (() => void) | null) => {
    setOnDeleteAction(callback ? () => callback : null);
  }, []);

  const registerSettingsAction = React.useCallback((callback: () => void) => {
    setOnSettingsAction(() => callback);
  }, []);

  const setSelectedCountCallback = React.useCallback((count: number) => {
    setSelectedCount(count);
  }, []);

  const contextValue = React.useMemo(() => ({ 
    activeView, 
    setActiveView, 
    searchTerm, 
    setSearchTerm: setSearchTermCallback, 
    isSearchOpen, 
    setIsSearchOpen: setIsSearchOpenCallback,
    onAddAction,
    registerAddAction,
    selectedCount,
    setSelectedCount: setSelectedCountCallback,
    onDeleteAction,
    registerDeleteAction,
    onSettingsAction,
    registerSettingsAction,
    selectedManagerId,
    setSelectedManagerId,
    selectedInitiativeTypes,
    setSelectedInitiativeTypes,
    selectedInitiativeStatuses,
    setSelectedInitiativeStatuses,
    headerContent,
    setHeaderContent,
    headerLeftActions,
    setHeaderLeftActions,
    headerActions,
    setHeaderActions,
    subHeaderContent,
    setSubHeaderContent,
    subHeaderActions,
    setSubHeaderActions,
    subHeaderTitle,
    setSubHeaderTitle
  }), [
    activeView,
    setActiveView,
    searchTerm,
    setSearchTermCallback,
    isSearchOpen,
    setIsSearchOpenCallback,
    onAddAction,
    registerAddAction,
    selectedCount,
    setSelectedCountCallback,
    onDeleteAction,
    registerDeleteAction,
    onSettingsAction,
    registerSettingsAction,
    selectedManagerId,
    selectedInitiativeTypes,
    setSelectedInitiativeTypes,
    selectedInitiativeStatuses,
    setSelectedInitiativeStatuses,
    headerContent,
    headerLeftActions,
    headerActions,
    subHeaderContent,
    subHeaderActions,
    subHeaderTitle
  ]);

  return (
    <ViewContext.Provider value={contextValue}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = () => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};

