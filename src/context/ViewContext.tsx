import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type ViewType = 'hierarchy' | 'people' | 'manager' | 'directorate' | 'type' | 'status' | 'system' | 'timeline';

interface ViewContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  onAddAction: (() => void) | null;
  registerAddAction: (callback: () => void | null) => void;
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
  
  const activeView = location.pathname.startsWith('/iniciativas') ? initActiveView : orgActiveView;
  
  const setActiveView = (view: ViewType) => {
    if (location.pathname.startsWith('/iniciativas')) {
      setInitActiveView(view);
      localStorage.setItem('init_active_view', view);
    } else {
      setOrgActiveView(view);
      localStorage.setItem('org_active_view', view);
    }
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [onAddAction, setOnAddAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    localStorage.setItem('org_active_view', activeView);
  }, [activeView]);

  const registerAddAction = (callback: () => void | null) => {
    setOnAddAction(() => callback);
  };

  return (
    <ViewContext.Provider value={{ 
      activeView, 
      setActiveView, 
      searchTerm, 
      setSearchTerm, 
      isSearchOpen, 
      setIsSearchOpen,
      onAddAction,
      registerAddAction
    }}>
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
