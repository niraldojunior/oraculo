import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, Settings, Building, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Collaborator } from '../../types';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import UserPreferencesModal from './UserPreferencesModal';
import CompanyInfoModal from './CompanyInfoModal';
import { useView } from '../../context/ViewContext';
import { 
  Building2, 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Layers, 
  Clock, 
  Activity, 
  Calendar, 
  Database, 
  List, 
  Trash2, 
  LayoutGrid, 
  GanttChartSquare 
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, currentCompany, currentDepartment, availableDepartments, setCurrentDepartment, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  const { 
    activeView, 
    setActiveView, 
    searchTerm, 
    setSearchTerm, 
    onAddAction, 
    selectedCount, 
    onDeleteAction,
    selectedManagerId,
    setSelectedManagerId,
    headerContent
  } = useView();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [leaders, setLeaders] = useState<Collaborator[]>([]);
  const [_isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  
  const [isCardMenuOpen, setIsCardMenuOpen] = useState(false);
  const cardMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
      if (cardMenuRef.current && !cardMenuRef.current.contains(event.target as Node)) {
        setIsCardMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.pathname === '/') {
      const fetchLeaders = async () => {
        try {
          const params = new URLSearchParams();
          if (currentCompany) params.append('companyId', currentCompany.id);
          if (currentDepartment) params.append('departmentId', currentDepartment.id);
          const query = params.toString() ? `?${params.toString()}` : '';
          
          const res = await fetch(`/api/collaborators${query}`);
          if (res.ok) {
            const data: Collaborator[] = await res.json();
            const filtered = data
              .filter(c => ['Director', 'Manager', 'Head'].includes(c.role))
              .sort((a, b) => {
                if (a.role === 'Director' && b.role !== 'Director') return -1;
                if (a.role !== 'Director' && b.role === 'Director') return 1;
                return a.name.localeCompare(b.name);
              });
            setLeaders(filtered);
          }
        } catch (e) {
          console.error('Error fetching leaders for header:', e);
        }
      };
      fetchLeaders();
    }
  }, [location.pathname, currentCompany, currentDepartment]);

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


  return (
    <header className="top-header flex-between" style={{ padding: '0 10px', position: 'relative', height: '56px', background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        {headerContent && (
          <div style={{ marginRight: '1rem' }}>
            {headerContent}
          </div>
        )}
        {/* Hide left navigation on all Initiative sub-pages (detail, edit, new) */}
        {!location.pathname.match(/\/iniciativas\/.+/) && (location.pathname === '/organizacao' || location.pathname.startsWith('/iniciativas')) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
            {location.pathname === '/organizacao' ? (
              <>
                <button
                  onClick={() => setActiveView('hierarchy')}
                  title="Hierarquia"
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeView === 'hierarchy' ? 'white' : 'transparent',
                    color: activeView === 'hierarchy' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeView === 'hierarchy' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px'
                  }}
                >
                  <Building2 size={16} />
                </button>
                <button
                  onClick={() => setActiveView('people')}
                  title="Pessoas"
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeView === 'people' ? 'white' : 'transparent',
                    color: activeView === 'people' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeView === 'people' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px'
                  }}
                >
                  <UsersIcon size={16} />
                </button>
              </>
            ) : (
              <>
                {/* 1. Lista (Table) */}
                <button 
                  onClick={() => { 
                    setActiveView('table'); 
                    setIsCardMenuOpen(false); 
                    if (location.pathname.startsWith('/iniciativas/')) navigate('/iniciativas');
                  }}
                  title="Lista"
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeView === 'table' ? 'white' : 'transparent',
                    color: activeView === 'table' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    boxShadow: activeView === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px'
                  }}
                >
                  <List size={16} />
                </button>

                {/* 2. Cartão (Dropdown) */}
                <div style={{ position: 'relative' }} ref={cardMenuRef}>
                  <button 
                    onClick={() => setIsCardMenuOpen(!isCardMenuOpen)}
                    title="Visualização em Cartão"
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: (['manager', 'directorate', 'type', 'status', 'system', 'timeline'].includes(activeView)) ? 'white' : 'transparent',
                      color: (['manager', 'directorate', 'type', 'status', 'system', 'timeline'].includes(activeView)) ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      boxShadow: (['manager', 'directorate', 'type', 'status', 'system', 'timeline'].includes(activeView)) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '32px'
                    }}
                  >
                    <LayoutGrid size={16} />
                  </button>

                  {isCardMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'white',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-lg)',
                      width: '150px',
                      padding: '0.3rem',
                      zIndex: 1000,
                    }}>
                      {[
                        { id: 'manager', label: 'Gestor', icon: <UsersIcon size={14} /> },
                        { id: 'directorate', label: 'Demandante', icon: <Layers size={14} /> },
                        { id: 'type', label: 'Tipo', icon: <Activity size={14} /> },
                        { id: 'status', label: 'Status', icon: <Clock size={14} /> },
                        { id: 'system', label: 'Sistema', icon: <Database size={14} /> },
                        { id: 'timeline', label: 'Mês', icon: <Calendar size={14} /> }
                      ].map(item => (
                        <div 
                          key={item.id}
                          onClick={() => { 
                            setActiveView(item.id as any); 
                            setIsCardMenuOpen(false); 
                            if (location.pathname.startsWith('/iniciativas/')) navigate('/iniciativas');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.5rem 0.7rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: activeView === item.id ? '#F1F5F9' : 'transparent',
                            color: activeView === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                        >
                          {item.icon} {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Timeline (New) */}
                <button 
                  onClick={() => { 
                    setActiveView('newTimeline'); 
                    setIsCardMenuOpen(false); 
                    if (location.pathname.startsWith('/iniciativas/')) navigate('/iniciativas');
                  }}
                  title="Timeline"
                  style={{
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeView === 'newTimeline' ? 'white' : 'transparent',
                    color: activeView === 'newTimeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    boxShadow: activeView === 'newTimeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px'
                  }}
                >
                  <GanttChartSquare size={16} />
                </button>
              </>
            )}
          </div>
        )}

        {location.pathname === '/' ? (
          /* Executive Selector - Shown ONLY on Dashboard */
          <div style={{ position: 'relative' }} ref={filterMenuRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.6rem', 
                background: '#F1F5F9', 
                padding: '0.4rem 0.8rem', 
                borderRadius: '10px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                minWidth: '140px',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                height: '36px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 size={16} color="var(--text-primary)" strokeWidth={2.5} />
                <span>
                  {selectedManagerId === 'all' 
                    ? 'Geral' 
                    : leaders.find(l => l.id === selectedManagerId)?.name.split(' ')[0] || 'Geral'}
                </span>
              </div>
              <ChevronDown size={14} color="var(--text-tertiary)" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {isFilterOpen && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 'calc(100% + 8px)', 
                  left: 0, 
                  zIndex: 1000, 
                  background: '#FFF', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '12px', 
                  boxShadow: 'var(--shadow-lg)', 
                  padding: '0.3rem', 
                  minWidth: '200px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.05rem',
                }}
              >
                <div 
                  onClick={() => { setSelectedManagerId('all'); setIsFilterOpen(false); }}
                  style={{ 
                    padding: '0.5rem 0.7rem', 
                    cursor: 'pointer', 
                    borderRadius: '8px', 
                    background: selectedManagerId === 'all' ? '#F1F5F9' : 'transparent', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-primary)', 
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'background 0.2s'
                  }}
                >
                  <Building2 size={14} color="var(--text-primary)" />
                  Geral
                </div>
                
                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.2rem 0.5rem' }} />

                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                  {leaders.map(leader => (
                    <div 
                      key={leader.id}
                      onClick={() => { setSelectedManagerId(leader.id); setIsFilterOpen(false); }}
                      style={{ 
                        padding: '0.5rem 0.7rem', 
                        cursor: 'pointer', 
                        borderRadius: '8px', 
                        background: selectedManagerId === leader.id ? '#F1F5F9' : 'transparent', 
                        color: 'var(--text-primary)', 
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontWeight: selectedManagerId === leader.id ? 700 : 500,
                        transition: 'background 0.2s'
                      }}
                    >
                       {leader.photoUrl ? (
                         <img src={leader.photoUrl} alt={leader.name} style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                       ) : (
                         <UsersIcon size={14} color={selectedManagerId === leader.id ? 'var(--text-primary)' : 'var(--text-tertiary)'} />
                       )}
                       <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span>{leader.name}</span>
                         <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{leader.role}</span>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : !location.pathname.match(/\/iniciativas\/.+/) ? (
          /* Unified Search & Actions - Hidden on Dashboard and all Initiative sub-pages */
          <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: '3px', borderRadius: '10px', gap: '2px' }}>
            <button
              onClick={() => onAddAction?.()}
              style={{
                width: '30px',
                height: '30px',
                background: 'white',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              title="Adicionar Novo"
            >
              <Plus size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  height: '30px',
                  padding: '0 0.75rem 0 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.75rem',
                  width: '180px',
                  background: 'transparent',
                  outline: 'none',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {selectedCount > 0 && onDeleteAction && (
              <button
                onClick={() => onDeleteAction()}
                style={{
                  width: '30px',
                  height: '30px',
                  background: '#FEE2E2',
                  color: '#EF4444',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={`Excluir ${selectedCount} selecionados`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center'
      }}>
        {headerContent ? null : (
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            {currentTitle}
          </h2>
        )}
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

