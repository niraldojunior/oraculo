import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SubHeader from './SubHeader';
import InstallPromptBanner from '@/shared/pwa/InstallPromptBanner';

const MainLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="app-container">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      <div className="main-content">
        <Header />
        <SubHeader />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <InstallPromptBanner />
    </div>
  );
};

export default MainLayout;

