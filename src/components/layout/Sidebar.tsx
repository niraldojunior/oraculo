import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Server, 
  Briefcase, 
  LogOut,
  ChevronLeft,
  Layers,
  PlusCircle,
  AlertCircle,
  LayoutGrid,
  BarChart,
  Plus
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
    { 
      path: '/iniciativas', 
      icon: Layers, 
      label: 'Iniciativas',
      subItems: [
        { path: '/iniciativas/nova', icon: PlusCircle, label: 'Criar' },
        { path: '/iniciativas', icon: LayoutGrid, label: 'Painel' },
        { path: '/iniciativas/pendencias', icon: AlertCircle, label: 'Pendências' },
        { path: '/roadmap', icon: BarChart, label: 'Gantt' }
      ]
    },
  ];

  const [expandedItems, setExpandedItems] = React.useState<string[]>(['/iniciativas']);

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

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
      <div style={{ height: 'var(--header-height)', borderBottom: '1px solid var(--glass-border)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', position: 'relative' }}>
        {!isCollapsed && (
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#FFFFFF', fontWeight: 800 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-base)', boxShadow: '0 0 10px var(--accent-base)' }}></div>
            Oráculo
          </h1>
        )}
        {isCollapsed && (
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-base)', margin: '0 auto', boxShadow: '0 0 10px var(--accent-base)' }}></div>
        )}
        <button 
          onClick={onToggle}
          className="btn-icon"
          style={{ 
            color: '#94A3B8',
            position: isCollapsed ? 'absolute' : 'relative',
            right: isCollapsed ? 'auto' : '0',
            left: isCollapsed ? '50%' : 'auto',
            transform: isCollapsed ? 'translateX(-50%) translateY(30px)' : 'none',
            zIndex: 110,
            background: isCollapsed ? 'var(--bg-sidebar-dark)' : 'transparent',
            border: isCollapsed ? '1px solid rgba(255,255,255,0.1)' : 'none'
          }}
        >
          {isCollapsed ? <Plus size={20} /> : <ChevronLeft size={20} />}
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
        {navItems.map((item) => {
          const isExpanded = expandedItems.includes(item.path);
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <div key={item.path}>
              <NavLink
                to={item.path}
                onClick={(e) => {
                  if (hasSubItems) {
                    e.preventDefault();
                    toggleExpand(item.path);
                  }
                }}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({ 
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '0.75rem 0' : '0.75rem 1.25rem 0.75rem 2rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  width: '100%',
                  color: isActive || isExpanded ? 'var(--accent-base)' : '#94A3B8',
                  background: isActive ? 'rgba(255, 217, 25, 0.1)' : 'transparent',
                  borderRight: isActive ? '4px solid var(--accent-base)' : 'none',
                  borderRadius: 0
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} color={isActive || isExpanded ? 'var(--accent-base)' : '#94A3B8'} />
                    {!isCollapsed && (
                      <>
                        <span style={{ 
                          marginLeft: '1rem', 
                          fontWeight: (isActive && !hasSubItems) || isExpanded ? 700 : 500, 
                          flex: 1
                        }}>
                          {item.label}
                        </span>
                        {hasSubItems && (
                          <span style={{ 
                            fontSize: '0.7rem', 
                            opacity: 0.5, 
                            transform: isExpanded ? 'rotate(180deg)' : 'none', 
                            transition: 'transform 0.2s'
                          }}>▼</span>
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>

              {/* Sub-items - Visible even when collapsed if expanded */}
              {hasSubItems && isExpanded && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: isCollapsed ? 'transparent' : 'rgba(255,255,255,0.02)',
                  paddingLeft: isCollapsed ? '0' : '0'
                }}>
                  {item.subItems?.map(sub => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      end={sub.path === '/iniciativas'}
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? '0' : '1rem',
                        padding: isCollapsed ? '0.6rem 0' : '0.6rem 1.25rem 0.6rem 3.5rem',
                        fontSize: '0.85rem',
                        color: isActive ? 'var(--accent-base)' : '#64748B',
                        textDecoration: 'none',
                        background: isActive ? 'rgba(255, 217, 25, 0.1)' : 'transparent',
                        borderRight: isActive ? '4px solid var(--accent-base)' : 'none',
                        transition: 'all 0.2s',
                        fontWeight: isActive ? 700 : 500,
                        width: '100%'
                      })}
                    >
                      {isCollapsed && sub.path === '/iniciativas/pendencias' && pendingCount > 0 ? (
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
                        <sub.icon size={isCollapsed ? 16 : 16} />
                      )}
                      {!isCollapsed && <span>{sub.label}</span>}
                      {sub.path === '/iniciativas/pendencias' && pendingCount > 0 && !isCollapsed && (
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
                          boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                          position: 'relative',
                          right: '0',
                          top: '0',
                          zIndex: 10
                        }}>
                          {pendingCount}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button className="btn btn-glass" style={{ width: '100%', color: 'var(--status-red)', background: 'transparent', borderColor: 'rgba(239, 68, 68, 0.2)', justifyContent: isCollapsed ? 'center' : 'center' }}>
          <LogOut size={18} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
