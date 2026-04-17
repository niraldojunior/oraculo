import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Server,
  Briefcase,
  Layers,
  CheckSquare,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Settings,
  Building,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import UserPreferencesModal from './UserPreferencesModal';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user, isAdmin, logout, currentCompany, currentDepartment, availableDepartments, setCurrentDepartment } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; bottom: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEscapeKey(() => setIsMenuOpen(false));

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/organizacao', icon: Users, label: 'Times' },
    { path: '/inventario', icon: Server, label: 'Sistemas' },
    { path: '/fornecedores', icon: Briefcase, label: 'Fornecedores' },
    { path: '/iniciativas', icon: Layers, label: 'Iniciativas' },
    { path: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
  ];
  
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

      {/* User Profile */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: isCollapsed ? '0.75rem 0' : '0.75rem',
          flexShrink: 0,
        }}
      >
        <div
          ref={triggerRef}
          onClick={() => {
            if (triggerRef.current) {
              const rect = triggerRef.current.getBoundingClientRect();
              setMenuPos({ left: rect.right + 8, bottom: window.innerHeight - rect.bottom });
            }
            setIsMenuOpen(prev => !prev);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            padding: isCollapsed ? '0.25rem' : '0.25rem 0.5rem',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            background: '#2D3748',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.2)',
          }}>
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <UserIcon size={15} color="rgba(255,255,255,0.8)" />
            )}
          </div>
          {!isCollapsed && (
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {user?.name?.split(' ')[0] || 'Usuário'}
            </span>
          )}
        </div>

        {/* Floating Dropdown */}
        {isMenuOpen && menuPos && (
          <div ref={dropdownRef} style={{
            position: 'fixed',
            left: menuPos.left,
            bottom: menuPos.bottom,
            width: '280px',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
            zIndex: 9999,
          }}>
            {/* User Info & Company Logo */}
            <div style={{ padding: '0.6rem 1rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--glass-border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>
                  {user?.name || 'Usuário'}
                </p>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isAdmin ? 'Administrador' : user?.role || 'Usuário'}
                </p>
              </div>
              {currentCompany && (
                <div style={{ flexShrink: 0 }}>
                  {currentCompany.logo ? (
                    <img src={currentCompany.logo} alt={currentCompany.fantasyName} style={{ height: '20px', maxWidth: '80px', objectFit: 'contain' }} />
                  ) : (
                    <Building size={16} color="var(--accent-base)" />
                  )}
                </div>
              )}
            </div>

            {/* Department Switcher */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                Departamento
              </div>
              {availableDepartments.length > 1 ? (
                <select
                  value={currentDepartment?.id}
                  onChange={(e) => {
                    const dept = availableDepartments.find(d => d.id === e.target.value);
                    if (dept) setCurrentDepartment(dept);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-app)',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {availableDepartments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentDepartment?.name}
                </div>
              )}
            </div>

            <div style={{ padding: '0.4rem' }}>
              {isAdmin && (
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/admin');
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent-base)',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <ShieldCheck size={16} />
                  <span>Administração</span>
                </button>
              )}
              <button
                className="dropdown-item"
                onClick={() => {
                  setIsPreferencesOpen(true);
                  setIsMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Settings size={16} />
                <span>Preferências</span>
              </button>
              <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.25rem 0.75rem' }}></div>
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--status-red)',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} />
                <span>Logoff</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isPreferencesOpen && (
        <UserPreferencesModal onClose={() => setIsPreferencesOpen(false)} />
      )}
    </aside>
  );
};

export default Sidebar;

