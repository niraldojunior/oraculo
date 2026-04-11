import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Server,
  Briefcase,
  Layers,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/organizacao', icon: Users, label: 'Times' },
    { path: '/inventario', icon: Server, label: 'Sistemas' },
    { path: '/fornecedores', icon: Briefcase, label: 'Fornecedores' },
    { path: '/iniciativas', icon: Layers, label: 'Iniciativas' },
  ];
  
  const { isAdmin } = useAuth();
  const adminItem = { path: '/admin', icon: ShieldCheck, label: 'Administração' };

  React.useEffect(() => {
    // Logic for badge removed as per user request to delete Pending initiatives page
  }, [user]);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <span className="logo-text">Oráculo</span>}
        <div style={{ width: isCollapsed ? '100%' : 'auto', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', alignItems: 'center' }}>
          <button
            onClick={onToggle}
            className="btn-icon sidebar-toggle-btn"
            style={{
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'transparent',
              cursor: 'pointer',
              border: 'none',
              flexShrink: 0
            }}
            title={isCollapsed ? "Expandir menu" : "Fechar menu"}
          >
            {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </div>

      <nav style={{
        padding: '1rem 0',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path !== '/iniciativas/pendencias'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            {() => (
              <>
                <div style={{ 
                  width: '24px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  flexShrink: 0 
                }}>
                  <item.icon
                    size={16}
                    className="sidebar-icon"
                  />
                </div>
                {!isCollapsed && (
                  <span style={{ marginLeft: '0.75rem', flex: 1 }}>
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0.5rem 1rem' }} />
            <NavLink
              to={adminItem.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={isCollapsed ? adminItem.label : ''}
              style={{ color: 'var(--accent-base)' }}
            >
              {() => (
                <>
                  <div style={{ width: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <adminItem.icon size={16} />
                  </div>
                  {!isCollapsed && (
                    <span style={{ marginLeft: '0.75rem', flex: 1, fontWeight: 700 }}>
                      {adminItem.label}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;

