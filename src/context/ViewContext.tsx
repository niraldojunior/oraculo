import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type ViewType = 'hierarchy' | 'people' | 'skills' | 'capacity' | 'clientes' | 'manager' | 'directorate' | 'type' | 'status' | 'system' | 'collaborator' | 'table' | 'newTimeline' | 'tasks-list' | 'tasks-card';

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
  selectedManagerId: string;
  setSelectedManagerId: (id: string) => void;
  headerContent: React.ReactNode | null;
  setHeaderContent: (content: React.ReactNode | null) => void;
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
  
  const activeView = location.pathname.startsWith('/tarefas')
    ? tasksActiveView
    : location.pathname.startsWith('/iniciativas')
    ? initActiveView
    : orgActiveView;
  
  const setActiveView = React.useCallback((view: ViewType) => {
    if (location.pathname.startsWith('/tarefas')) {
      setTasksActiveView(view);
    } else if (location.pathname.startsWith('/iniciativas')) {
      setInitActiveView(view);
      localStorage.setItem('init_active_view', view);
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
  const [selectedManagerId, setSelectedManagerId] = useState<string>('all');
  const [headerContent, setHeaderContent] = useState<React.ReactNode | null>(null);

  const setSearchTermCallback = React.useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const setIsSearchOpenCallback = React.useCallback((open: boolean) => {
    setIsSearchOpen(open);
  }, []);

  useEffect(() => {
    localStorage.setItem('org_active_view', activeView);
  }, [activeView]);

  const registerAddAction = React.useCallback((callback: () => void | null) => {
    setOnAddAction(() => callback);
  }, []);

  const registerDeleteAction = React.useCallback((callback: () => void | null) => {
    setOnDeleteAction(() => callback);
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
    selectedManagerId,
    setSelectedManagerId,
    headerContent,
    setHeaderContent
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
    selectedManagerId,
    headerContent
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

