import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type ViewType = 'hierarchy' | 'people' | 'skills' | 'capacity' | 'clientes' | 'manager' | 'directorate' | 'type' | 'status' | 'system' | 'collaborator' | 'table' | 'newTimeline' | 'tasks-list' | 'tasks-card' | 'landscape';

interface ViewContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  onAddAction: (() => void) | null;
  registerAddAction: (callback: () => void | null) => void;
  selectedCount: number;
  setSelectedCount: (count: number) => void;
  onDeleteAction: (() => void) | null;
  registerDeleteAction: (callback: () => void | null) => void;
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
  headerActions: React.ReactNode | null;
  setHeaderActions: (content: React.ReactNode | null) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const [orgActiveView, setOrgActiveView] = useState<ViewType>(() => {
    return (localStorage.getItem('org_active_view') as ViewType) || 'hierarchy';
  });
  
  const [initActiveView, setInitActiveView] = useState<ViewType>(() => {
    return (localStorage.getItem('init_active_view') as ViewType) || 'manager';
  });

  const [tasksActiveView, setTasksActiveView] = useState<ViewType>('tasks-list');

  const [invActiveView, setInvActiveView] = useState<ViewType>(() => {
    const saved = localStorage.getItem('inv_active_view') as ViewType;
    return saved === 'table' || saved === 'landscape' ? saved : 'landscape';
  });

  const activeView = location.pathname.startsWith('/tarefas')
    ? tasksActiveView
    : location.pathname.startsWith('/iniciativas')
    ? initActiveView
    : location.pathname.startsWith('/inventario')
    ? invActiveView
    : orgActiveView;
  
  const setActiveView = React.useCallback((view: ViewType) => {
    if (location.pathname.startsWith('/tarefas')) {
      setTasksActiveView(view);
    } else if (location.pathname.startsWith('/iniciativas')) {
      setInitActiveView(view);
      localStorage.setItem('init_active_view', view);
    } else if (location.pathname.startsWith('/inventario')) {
      setInvActiveView(view);
      localStorage.setItem('inv_active_view', view);
    } else {
      setOrgActiveView(view);
      localStorage.setItem('org_active_view', view);
    }
  }, [location.pathname]);
  
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
  const [headerActions, setHeaderActions] = useState<React.ReactNode | null>(null);

  const setSearchTermCallback = React.useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const setIsSearchOpenCallback = React.useCallback((open: boolean) => {
    setIsSearchOpen(open);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/iniciativas') || location.pathname.startsWith('/tarefas') || location.pathname.startsWith('/inventario')) return;
    localStorage.setItem('org_active_view', activeView);
  }, [activeView, location.pathname]);

  const registerAddAction = React.useCallback((callback: () => void | null) => {
    setOnAddAction(() => callback);
  }, []);

  const registerDeleteAction = React.useCallback((callback: () => void | null) => {
    setOnDeleteAction(() => callback);
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
    headerActions,
    setHeaderActions
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
    headerActions
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

