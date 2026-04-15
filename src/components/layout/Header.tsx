import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Collaborator } from '../../types';
import { useView } from '../../context/ViewContext';
import { 
  Building2, 
  UserCircle2,
  Users as UsersIcon, 
  Plus, 
  Search, 
  Layers, 
  Clock, 
  Activity, 
  Database, 
  List, 
  Trash2, 
  LayoutGrid, 
  GanttChartSquare,
  GraduationCap,
  BarChart3,
  Handshake
} from 'lucide-react';

const Header: React.FC = () => {
  const { user, currentCompany, currentDepartment } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
      if (!currentCompany) {
        setLeaders([]);
        return;
      }

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
              .filter(c => ['Director', 'Manager', 'Master'].includes(c.role))
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

  // Pre-select current user if they are in the leaders list
  useEffect(() => {
    if (user && leaders.length > 0 && selectedManagerId === 'all') {
      const isLeader = leaders.some(l => l.id === user.id);
      if (isLeader) {
        setSelectedManagerId(user.id);
      }
    }
  }, [user, leaders, selectedManagerId, setSelectedManagerId]);

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
    <header className="top-header flex-between" style={{ padding: '0 10px', position: 'relative', height: '44px', background: 'white', zIndex: 2000 }}>
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
                    height: '26px',
                    padding: '0 8px',
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
                    height: '26px',
                    padding: '0 8px',
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
                <button
                  onClick={() => setActiveView('skills')}
                  title="Skills"
                  style={{
                    height: '26px',
                    padding: '0 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeView === 'skills' ? 'white' : 'transparent',
                    color: activeView === 'skills' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeView === 'skills' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px'
                  }}
                >
                  <GraduationCap size={16} />
                </button>
                <button
                  onClick={() => setActiveView('capacity')}
                  title="Capacidade"
                  style={{
                    height: '26px',
                    padding: '0 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeView === 'capacity' ? 'white' : 'transparent',
                    color: activeView === 'capacity' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeView === 'capacity' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px'
                  }}
                >
                  <BarChart3 size={16} />
                </button>
                <button
                  onClick={() => setActiveView('clientes')}
                  title="Clientes"
                  style={{
                    height: '26px',
                    padding: '0 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeView === 'clientes' ? 'white' : 'transparent',
                    color: activeView === 'clientes' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: activeView === 'clientes' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '32px'
                  }}
                >
                  <Handshake size={16} />
                </button>
              </>
            ) : (
              <>
                {/* 1. Lista (Table) */}
                <button
                  onClick={() => setActiveView('table')}
                  title="Lista"
                  style={{
                    height: '26px',
                    padding: '0 8px',
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
                      height: '26px',
                      padding: '0 8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: (['manager', 'directorate', 'type', 'status', 'system', 'collaborator'].includes(activeView)) ? 'white' : 'transparent',
                      color: (['manager', 'directorate', 'type', 'status', 'system', 'collaborator'].includes(activeView)) ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      boxShadow: (['manager', 'directorate', 'type', 'status', 'system', 'collaborator'].includes(activeView)) ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
                        { id: 'collaborator', label: 'Membros', icon: <UsersIcon size={14} /> }
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
                    height: '26px',
                    padding: '0 8px',
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
                gap: '0.4rem',
                background: '#F1F5F9',
                padding: '0 0.65rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                height: '26px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCircle2 size={14} color="var(--text-primary)" strokeWidth={1.5} />
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
                width: '32px',
                height: '26px',
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
                  height: '26px',
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

    </header>
  );
};

export default Header;

