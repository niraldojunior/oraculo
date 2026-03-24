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
  Menu,
  Settings
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { mockInitiatives } from '../../data/mockDb';
import type { Initiative } from '../../types';

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
    const updateCount = () => {
      try {
        const saved = localStorage.getItem('oraculo_initiatives_v1');
        const localInits = saved ? JSON.parse(saved) as Initiative[] : [];
        const list = [...localInits];
        mockInitiatives.forEach(mock => {
          if (!list.some(it => it.id === mock.id)) {
            list.push(mock);
          }
        });
        
        const count = list.filter(item => {
          if (item.status === '1- Em Avaliação' && user?.role === 'Director') return true;
          if (item.status === '2- Em Backlog' && (user?.role === 'Manager' || user?.role === 'Director')) return true;
          if (item.status === '3- Em Planejamento' && (user?.role === 'Lead Engineer' || user?.role === 'Manager')) return true;
          return false;
        }).length;
        
        setPendingCount(count);
      } catch (e) {
        console.error("Error updating pending count:", e);
      }
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 5000);
    
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div style={{ 
        height: 'var(--header-height)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        padding: isCollapsed ? '0' : '0 1.5rem'
      }}>
        <button 
          onClick={onToggle}
          className="btn-icon"
          style={{ 
            color: '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            borderRadius: '50%',
            transition: 'all 0.2s',
            background: 'transparent'
          }}
        >
          <Menu size={22} />
        </button>
      </div>
      
      <nav style={{ 
        padding: isCollapsed ? '2rem 0' : '2rem 0', 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.4rem', 
        overflowY: 'auto',
        alignItems: 'stretch'
      }}>
        {navItems.map((item) => (
            <div key={item.path}>
              <NavLink
                to={item.path}
                end={item.path !== '/iniciativas/pendencias'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({ 
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '0.75rem 0' : '0.75rem 1.25rem 0.75rem 2rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  width: '100%',
                  color: isActive ? 'var(--accent-base)' : '#94A3B8',
                  background: isActive ? 'rgba(255, 217, 25, 0.1)' : 'transparent',
                  borderRight: isActive ? '4px solid var(--accent-base)' : 'none',
                  borderRadius: 0
                })}
                title={isCollapsed ? item.label : ''}
              >
                {({ isActive }) => (
                  <>
                    {isCollapsed && item.path === '/iniciativas/pendencias' && pendingCount > 0 ? (
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 800, 
                        color: 'var(--status-red)',
                        width: 20,
                        textAlign: 'center',
                        textShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
                      }}>
                        {pendingCount}
                      </span>
                    ) : (
                      <item.icon 
                        size={18} 
                        color={isActive ? 'var(--accent-base)' : '#94A3B8'} 
                        className="sidebar-icon"
                      />
                    )}
                    {!isCollapsed && (
                      <>
                        <span style={{ 
                          marginLeft: '1rem', 
                          fontWeight: isActive ? 700 : 500, 
                          flex: 1
                        }}>
                          {item.label}
                        </span>
                        {item.path === '/iniciativas/pendencias' && pendingCount > 0 && (
                          <span style={{ 
                            background: 'var(--status-red)', 
                            color: 'white', 
                            fontSize: '0.65rem', 
                            padding: '1px 5px', 
                            borderRadius: '10px', 
                            fontWeight: 800,
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
                          }}>
                            {pendingCount}
                          </span>
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            </div>
        ))}
      </nav>

      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button className="btn btn-glass" style={{ width: '100%', color: '#94A3B8', background: 'transparent', borderColor: 'rgba(148, 163, 184, 0.2)', justifyContent: isCollapsed ? 'center' : 'center' }}>
          <Settings size={18} />
          {!isCollapsed && <span>Configurações</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
