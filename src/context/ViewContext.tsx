import React, { createContext, useContext, useState, useEffect } from 'react';

type ViewType = 'hierarchy' | 'people';

interface ViewContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>(() => {
    return (localStorage.getItem('org_active_view') as ViewType) || 'hierarchy';
  });

  useEffect(() => {
    localStorage.setItem('org_active_view', activeView);
  }, [activeView]);

  return (
    <ViewContext.Provider value={{ activeView, setActiveView }}>
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
