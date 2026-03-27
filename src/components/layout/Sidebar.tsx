import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Server,
  Briefcase,
  Layers,
  AlertCircle,
  BarChart,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = React.useState(0);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/organizacao', icon: Users, label: 'Times' },
    { path: '/inventario', icon: Server, label: 'Sistemas' },
    { path: '/fornecedores', icon: Briefcase, label: 'Fornecedores' },
    { path: '/iniciativas', icon: Layers, label: 'Iniciativas' },
    { path: '/roadmap', icon: BarChart, label: 'Roadmap' },
    { path: '/iniciativas/pendencias', icon: AlertCircle, label: 'Pendências' },
  ];

  React.useEffect(() => {
    const updateCount = async () => {
      try {
        const res = await fetch(`/api/initiatives?t=${Date.now()}`);
        const list = await res.json();

        console.log('DEBUG: Initiatives received:', list);

        if (!Array.isArray(list)) {
          setPendingCount(0);
          return;
        }

        const count = list.filter(item => {
          if (item.status === '1- Em Avaliação' && user?.role === 'Director') return true;
          if (item.status === '2- Em Backlog' && (user?.role === 'Manager' || user?.role === 'Director')) return true;
          if (item.status === '3- Em Planejamento' && (user?.role === 'Lead Engineer' || user?.role === 'Manager')) return true;
          return false;
        }).length;

        console.log('DEBUG: Pending count calculated:', count);
        setPendingCount(count);
      } catch (e) {
        console.error("Error updating pending count:", e);
        setPendingCount(0);
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 10000); // 10s refresh for the badge

    return () => clearInterval(interval);
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
              color: '#94A3B8',
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
            {({ isActive }) => (
              <>
                <div style={{ 
                  width: '24px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  flexShrink: 0 
                }}>
                  {item.path === '/iniciativas/pendencias' && pendingCount > 0 ? (
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: 'var(--status-red)'
                    }}>
                      {pendingCount}
                    </span>
                  ) : (
                    <item.icon
                      size={16}
                      className="sidebar-icon"
                    />
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <span style={{ marginLeft: '0.75rem', flex: 1 }}>
                      {item.label}
                    </span>
                    {item.path === '/iniciativas/pendencias' && pendingCount > 0 && (
                      <span style={{
                        background: 'var(--status-red)',
                        color: 'white',
                        fontSize: '0.65rem',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        fontWeight: 800
                      }}>
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
