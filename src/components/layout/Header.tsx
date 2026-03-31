import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, Settings, ChevronDown, Building } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import UserPreferencesModal from './UserPreferencesModal';
import CompanyInfoModal from './CompanyInfoModal';
import { useView } from '../../context/ViewContext';
import { Building2, Users as UsersIcon, Plus, Search, Layers, Clock, Activity, Calendar, Database, List } from 'lucide-react';

const Header: React.FC = () => {
  const { user, currentCompany, currentDepartment, availableDepartments, setCurrentDepartment, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEscapeKey(() => setIsMenuOpen(false));

  const { activeView, setActiveView, searchTerm, setSearchTerm, isSearchOpen, setIsSearchOpen, onAddAction } = useView();
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const routeTitles: Record<string, string> = {
    '/': 'Executive Dashboard',
    '/organizacao': 'Times',
    '/inventario': 'Inventário de Sistemas',
    '/iniciativas': 'Iniciativas',
    '/roadmap': 'Roadmap',
    '/fornecedores': 'Fornecedores e Contratos',
    '/iniciativas/pendencias': 'Minhas Pendências',
  };

  let currentTitle = routeTitles[location.pathname] || '';
  
  // Handle detail pages
  if (!currentTitle) {
    if (location.pathname.startsWith('/inventario/')) currentTitle = 'Detalhes do Sistema';
    if (location.pathname.startsWith('/iniciativas/') && !location.pathname.includes('/pendencias')) {
      if (location.pathname.includes('/editar/') || location.pathname.includes('/nova')) {
        currentTitle = location.pathname.includes('/nova') ? 'Nova Iniciativa' : 'Editar Iniciativa';
      } else {
        currentTitle = 'Detalhes da Iniciativa';
      }
    }
  }

  const dropdownItemStyle = (isActive: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    background: isActive ? 'rgba(var(--accent-rgb), 0.05)' : 'transparent',
    color: isActive ? 'var(--accent-base)' : 'var(--text-primary)',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.2s'
  });

  return (
    <header className="top-header flex-between" style={{ padding: '0 0.75rem 0 1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {(location.pathname === '/organizacao' || location.pathname === '/iniciativas') && (
          <>
            <div style={{ position: 'relative' }} ref={viewMenuRef}>
              <button 
                onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.4rem 0.75rem',
                  background: 'white',
                  border: '1px solid var(--glass-border-strong)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                  height: '34px'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-base)'}
                onMouseLeave={e => { if (!isViewMenuOpen) e.currentTarget.style.borderColor = 'var(--glass-border-strong)'; }}
              >
                <div style={{ color: 'var(--accent-base)', display: 'flex', alignItems: 'center' }}>
                  {(() => {
                    switch(activeView) {
                      case 'hierarchy': return <Building2 size={16} />;
                      case 'people': return <UsersIcon size={16} />;
                      case 'manager': return <UsersIcon size={16} />;
                      case 'directorate': return <Layers size={16} />;
                      case 'type': return <Activity size={16} />;
                      case 'status': return <Clock size={16} />;
                      case 'system': return <Database size={16} />;
                      case 'timeline': return <Calendar size={16} />;
                      case 'table': return <List size={16} />;
                      default: return <Building2 size={16} />;
                    }
                  })()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {(() => {
                    switch(activeView) {
                      case 'hierarchy': return 'Hierarquia';
                      case 'people': return 'Pessoas';
                      case 'manager': return 'Gestor';
                      case 'directorate': return 'Demandante';
                      case 'type': return 'Tipo';
                      case 'status': return 'Status';
                      case 'system': return 'Sistema';
                      case 'timeline': return 'Timeline';
                      case 'table': return 'Tabela';
                      default: return 'Visão';
                    }
                  })()}
                </span>
                <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: '2px', transform: isViewMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {isViewMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--glass-border-strong)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  width: '180px',
                  padding: '0.4rem',
                  zIndex: 1000,
                  animation: 'menuEntrance 0.2s ease-out'
                }}>
                  {location.pathname === '/organizacao' ? (
                    <>
                      <div 
                        onClick={() => { setActiveView('hierarchy'); setIsViewMenuOpen(false); }}
                        style={dropdownItemStyle(activeView === 'hierarchy')}
                      >
                        <Building2 size={16} /> Hierarquia
                      </div>
                      <div 
                        onClick={() => { setActiveView('people'); setIsViewMenuOpen(false); }}
                        style={dropdownItemStyle(activeView === 'people')}
                      >
                        <UsersIcon size={16} /> Pessoas
                      </div>
                    </>
                  ) : (
                    <>
                      {[
                        { id: 'manager', label: 'Gestor', icon: <UsersIcon size={16} /> },
                        { id: 'directorate', label: 'Demandante', icon: <Layers size={16} /> },
                        { id: 'type', label: 'Tipo', icon: <Activity size={16} /> },
                        { id: 'status', label: 'Status', icon: <Clock size={16} /> },
                        { id: 'system', label: 'Sistema', icon: <Database size={16} /> },
                        { id: 'timeline', label: 'Timeline', icon: <Calendar size={16} /> },
                        { id: 'table', label: 'Tabela', icon: <List size={16} /> }
                      ].map(item => (
                        <div 
                          key={item.id}
                          onClick={() => { setActiveView(item.id as any); setIsViewMenuOpen(false); }}
                          style={dropdownItemStyle(activeView === item.id)}
                        >
                          {item.icon} {item.label}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)', margin: '0 0.25rem' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                className="btn-icon" 
                onClick={() => onAddAction?.()}
                style={{ 
                  width: '34px', 
                  height: '34px', 
                  background: 'var(--accent-base)',
                  color: 'white',
                  border: '1px solid var(--accent-base)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-sm)'
                }}
                disabled={!onAddAction}
                title="Cadastrar Novo"
              >
                <Plus size={20} />
              </button>

              <button 
                className="btn-icon" 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                style={{ 
                  width: '34px', 
                  height: '34px', 
                  background: isSearchOpen ? 'var(--accent-base)' : 'white',
                  color: isSearchOpen ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--glass-border-strong)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-sm)'
                }}
                title="Pesquisar"
              >
                <Search size={18} />
              </button>

              <div style={{ 
                overflow: 'hidden', 
                width: isSearchOpen ? '200px' : '0', 
                transition: 'width 0.3s ease',
                display: 'flex',
                alignItems: 'center'
              }}>
                <input 
                  autoFocus
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    marginLeft: '0.5rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border-strong)',
                    fontSize: '0.85rem',
                    width: '100%',
                    background: 'white',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: '1.2rem', 
          fontWeight: 800, 
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: 0 
        }}>
          {currentTitle}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Profile Section */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: isMenuOpen ? 'rgba(0,0,0,0.05)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 'var(--radius-full)', 
              overflow: 'hidden', 
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F1F5F9'
            }}>
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserIcon size={20} color="var(--text-tertiary)" />
              )}
            </div>

          </div>

          {/* Floating Dropdown Menu */}
          {isMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '120%',
              right: 0,
              width: '280px',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--glass-border)',
              overflow: 'hidden',
              zIndex: 1000
            }}>
              {/* Header: User Info & Company Logo */}
              <div style={{ padding: '0.6rem 1rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--glass-border-strong)', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>
                    {(user as any)?.fullName || (user as any)?.name || 'Usuário'}
                  </p>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {user?.role === 'Director' ? 'Administrador' : user?.role || 'Usuário'}
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
                      cursor: 'pointer'
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
                    transition: 'background 0.2s'
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
                    transition: 'background 0.2s'
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

      </div>
      {isPreferencesOpen && (
        <UserPreferencesModal onClose={() => setIsPreferencesOpen(false)} />
      )}
      {isCompanyInfoOpen && (
        <CompanyInfoModal onClose={() => setIsCompanyInfoOpen(false)} />
      )}
    </header>
  );
};

export default Header;

