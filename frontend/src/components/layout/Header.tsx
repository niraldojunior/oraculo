import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Collaborator } from '../../types';
import { useView } from '@/context/ViewContext';
import Avatar from '@/components/common/Avatar';
import { StatusIcon } from '@/components/common/StatusIcon';
import { getTypeIcon } from '@/components/initiative/SidebarComponents';
import { 
  Building2, 
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
  Handshake,
  Table as TableIcon,
  Settings
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
    onSettingsAction,
    selectedManagerId,
    setSelectedManagerId,
    selectedInitiativeType,
    setSelectedInitiativeType,
    selectedInitiativeStatuses,
    setSelectedInitiativeStatuses,
    headerContent,
    headerActions
  } = useView();

  const INITIATIVE_STATUS_OPTIONS = [
    '1- Backlog',
    '2- Discovery',
    '3- Planejamento',
    '4- Aguardando Capacidade',
    '5- Construção',
    '6- QA',
    '7- UAT',
    '8- Implantação',
    '9- Concluído',
    'Suspenso',
    'Cancelado'
  ];

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [leaders, setLeaders] = useState<Collaborator[]>([]);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isInitiativeTypeMenuOpen, setIsInitiativeTypeMenuOpen] = useState(false);
  const [isInitiativeStatusMenuOpen, setIsInitiativeStatusMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const initiativeTypeMenuRef = useRef<HTMLDivElement>(null);
  const initiativeStatusMenuRef = useRef<HTMLDivElement>(null);
  
  const [isCardMenuOpen, setIsCardMenuOpen] = useState(false);
  const cardMenuRef = useRef<HTMLDivElement>(null);
  const [isTasksMenuOpen, setIsTasksMenuOpen] = useState(false);
  const tasksMenuRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
      if (initiativeTypeMenuRef.current && !initiativeTypeMenuRef.current.contains(event.target as Node)) {
        setIsInitiativeTypeMenuOpen(false);
      }
      if (initiativeStatusMenuRef.current && !initiativeStatusMenuRef.current.contains(event.target as Node)) {
        setIsInitiativeStatusMenuOpen(false);
      }
      if (cardMenuRef.current && !cardMenuRef.current.contains(event.target as Node)) {
        setIsCardMenuOpen(false);
      }
      if (tasksMenuRef.current && !tasksMenuRef.current.contains(event.target as Node)) {
        setIsTasksMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/colaboradores' || location.pathname === '/iniciativas' || location.pathname === '/inventario') {
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
    '/tarefas': 'Tarefas',
    '/': 'Executive Dashboard',
    '/organizacao': 'Organização',
    '/colaboradores': 'Colaboradores',
    '/inventario': 'Sistemas',
    '/iniciativas': 'Iniciativas',
    '/alocacoes': 'Alocações',
    '/roadmap': 'Roadmap',
    '/fornecedores': 'Fornecedores',
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
        {headerContent && !location.pathname.startsWith('/iniciativas') && location.pathname !== '/fornecedores' && location.pathname !== '/inventario' && location.pathname !== '/tarefas' && location.pathname !== '/organizacao' && location.pathname !== '/colaboradores' && (
          <div style={{ marginRight: '1rem' }}>
            {headerContent}
          </div>
        )}
        {headerContent && location.pathname.match(/\/iniciativas\/.+/) && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {headerContent}
          </div>
        )}
        {/* Hide left navigation on all Initiative sub-pages (detail, edit, new) */}
        {!location.pathname.match(/\/iniciativas\/.+/) && location.pathname === '/organizacao' && (
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
                    {(() => {
                      const cardIcons: Record<string, React.ReactNode> = {
                        manager: <UsersIcon size={16} />,
                        directorate: <Layers size={16} />,
                        type: <Activity size={16} />,
                        status: <Clock size={16} />,
                        system: <Database size={16} />,
                        collaborator: <UsersIcon size={16} />,
                      };
                      return cardIcons[activeView] ?? <LayoutGrid size={16} />;
                    })()}
                  </button>

                  {isCardMenuOpen && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      left: 0,
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
                {!isMobile && <button 
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
                </button>}
              </>
            )}
          </div>
        )}

        {/* Inventario leadership combo */}
        {location.pathname === '/inventario' && (
          <div style={{ position: 'relative' }} ref={filterMenuRef}>
            {(() => {
              const selectedLeader = selectedManagerId === 'all' ? null : leaders.find(l => l.id === selectedManagerId);
              const displayPerson = selectedLeader ?? (selectedManagerId === 'all' ? user : null);
              return (
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', padding: '0 0.6rem 0 0.35rem', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-primary)', border: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: 600, letterSpacing: '-0.01em', justifyContent: 'space-between', transition: 'all 0.2s ease', height: '30px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E8EEF5'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {displayPerson ? (
                      <Avatar name={displayPerson.name} src={(displayPerson as any).photoUrl} size={22} fontSize={9} />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UsersIcon size={11} color="white" />
                      </div>
                    )}
                    <span>{selectedManagerId === 'all' ? 'Todos' : selectedManagerId === 'nao-ti' ? 'Não TI' : selectedLeader?.name.split(' ')[0] || 'Todos'}</span>
                  </div>
                  <ChevronDown size={13} color="var(--text-tertiary)" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '2px' }} />
                </button>
              );
            })()}
            {isFilterOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: '#FFF', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '0.3rem', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                <div onClick={() => { setSelectedManagerId('all'); setIsFilterOpen(false); }} style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: selectedManagerId === 'all' ? '#F1F5F9' : 'transparent', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.2s' }}>
                  <Building2 size={14} color="var(--text-primary)" />Todos
                </div>
                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.2rem 0.5rem' }} />
                <div onClick={() => { setSelectedManagerId('nao-ti'); setIsFilterOpen(false); }} style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: selectedManagerId === 'nao-ti' ? '#FEF3C7' : 'transparent', fontSize: '0.75rem', color: '#92400E', fontWeight: selectedManagerId === 'nao-ti' ? 700 : 500, display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#fff' }}>N</span>
                  </div>
                  Não TI
                </div>
                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.2rem 0.5rem' }} />
                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                  {leaders.map(leader => (
                    <div key={leader.id} onClick={() => { setSelectedManagerId(leader.id); setIsFilterOpen(false); }} style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: selectedManagerId === leader.id ? '#F1F5F9' : 'transparent', color: 'var(--text-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: selectedManagerId === leader.id ? 700 : 500, transition: 'background 0.2s' }}>
                      <Avatar name={leader.name} src={leader.photoUrl} size={18} fontSize={9} backgroundColor={selectedManagerId === leader.id ? '#334155' : '#94A3B8'} textColor="#FFFFFF" />
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
        )}

        {/* Inventario view selector */}
        {location.pathname === '/inventario' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveView('landscape')}
              title="Landscape"
              style={{
                height: '26px',
                padding: '0 8px',
                borderRadius: '8px',
                border: 'none',
                background: activeView === 'landscape' ? 'white' : 'transparent',
                color: activeView === 'landscape' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeView === 'landscape' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px'
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setActiveView('table')}
              title="Tabela"
              style={{
                height: '26px',
                padding: '0 8px',
                borderRadius: '8px',
                border: 'none',
                background: activeView === 'table' ? 'white' : 'transparent',
                color: activeView === 'table' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeView === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '32px'
              }}
            >
              <LayoutGrid size={16} style={{ display: 'none' }} />
              <TableIcon size={16} />
            </button>
          </div>
        )}

        {/* Tarefas view selector */}
        {location.pathname.startsWith('/tarefas') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
            <div style={{ position: 'relative' }} ref={tasksMenuRef}>
              <button
                onClick={() => setIsTasksMenuOpen(!isTasksMenuOpen)}
                title="Minhas Tarefas"
                style={{
                  height: '26px',
                  padding: '0 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isTasksMenuOpen ? 'white' : 'transparent',
                  color: isTasksMenuOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  boxShadow: isTasksMenuOpen ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px'
                }}
              >
                {activeView === 'tasks-card' ? <LayoutGrid size={16} /> : <List size={16} />}
              </button>
              {isTasksMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  background: 'white',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-lg)',
                  width: '140px',
                  padding: '0.3rem',
                  zIndex: 1000,
                }}>
                  {[
                    { id: 'tasks-list', label: 'Lista', icon: <List size={14} /> },
                    { id: 'tasks-card', label: 'Cartões', icon: <LayoutGrid size={14} /> },
                  ].map(item => (
                    <div
                      key={item.id}
                      onClick={() => { setActiveView(item.id as any); setIsTasksMenuOpen(false); }}
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
          </div>
        )}

        {location.pathname === '/' ? (
          /* Executive Selector - Shown ONLY on Dashboard */
          <div style={{ position: 'relative' }} ref={filterMenuRef}>
            {(() => {
              const selectedLeader = selectedManagerId === 'all' ? null : leaders.find(l => l.id === selectedManagerId);
              const displayPerson = selectedLeader ?? (selectedManagerId === 'all' ? user : null);
              return (
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#F1F5F9',
                padding: '0 0.6rem 0 0.35rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                height: '30px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E8EEF5'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {displayPerson ? (
                  <Avatar
                    name={displayPerson.name}
                    src={(displayPerson as any).photoUrl}
                    size={22}
                    fontSize={9}
                  />
                ) : (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UsersIcon size={11} color="white" />
                  </div>
                )}
                <span>
                  {selectedManagerId === 'all'
                    ? (user?.name?.split(' ')[0] || 'Usuário Logado')
                    : selectedLeader?.name.split(' ')[0] || 'Usuário Logado'}
                </span>
              </div>
              <ChevronDown size={13} color="var(--text-tertiary)" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '2px' }} />
            </button>
              );
            })()}

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
                  Usuário Logado
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
                       <Avatar
                         name={leader.name}
                         src={leader.photoUrl}
                         size={18}
                         fontSize={9}
                         backgroundColor={selectedManagerId === leader.id ? '#334155' : '#94A3B8'}
                         textColor="#FFFFFF"
                       />
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
        ) : location.pathname === '/colaboradores' ? (
          /* Leader Selector + view tabs + add buttons */
          <>
          <div style={{ position: 'relative' }} ref={filterMenuRef}>
            {(() => {
              const selectedLeader = selectedManagerId === 'all' ? null : leaders.find(l => l.id === selectedManagerId);
              const displayPerson = selectedLeader ?? (selectedManagerId === 'all' ? user : null);
              return (
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#F1F5F9',
                    padding: '0 0.6rem 0 0.35rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    height: '30px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E8EEF5'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {displayPerson ? (
                      <Avatar name={displayPerson.name} src={(displayPerson as any).photoUrl} size={22} fontSize={9} />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UsersIcon size={11} color="white" />
                      </div>
                    )}
                    <span>
                      {selectedManagerId === 'all'
                        ? (user?.name?.split(' ')[0] || 'Usuário Logado')
                        : selectedLeader?.name.split(' ')[0] || 'Usuário Logado'}
                    </span>
                  </div>
                  <ChevronDown size={13} color="var(--text-tertiary)" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '2px' }} />
                </button>
              );
            })()}

            {isFilterOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: '#FFF', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '0.3rem', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                <div
                  onClick={() => { setSelectedManagerId('all'); setIsFilterOpen(false); }}
                  style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: selectedManagerId === 'all' ? '#F1F5F9' : 'transparent', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.2s' }}
                >
                  <Building2 size={14} color="var(--text-primary)" />
                  Usuário Logado
                </div>
                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.2rem 0.5rem' }} />
                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                  {leaders.map(leader => (
                    <div
                      key={leader.id}
                      onClick={() => { setSelectedManagerId(leader.id); setIsFilterOpen(false); }}
                      style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: selectedManagerId === leader.id ? '#F1F5F9' : 'transparent', color: 'var(--text-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: selectedManagerId === leader.id ? 700 : 500, transition: 'background 0.2s' }}
                    >
                      <Avatar name={leader.name} src={leader.photoUrl} size={18} fontSize={9} backgroundColor={selectedManagerId === leader.id ? '#334155' : '#94A3B8'} textColor="#FFFFFF" />
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
          {/* View tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
            <button
              onClick={() => setActiveView('people')}
              title="Colaboradores"
              style={{ height: '26px', padding: '0 8px', borderRadius: '8px', border: 'none', background: activeView === 'people' ? 'white' : 'transparent', color: activeView === 'people' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: activeView === 'people' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px' }}
            >
              <UsersIcon size={16} />
            </button>
            <button
              onClick={() => setActiveView('capacity')}
              title="Capacidade"
              style={{ height: '26px', padding: '0 8px', borderRadius: '8px', border: 'none', background: activeView === 'capacity' ? 'white' : 'transparent', color: activeView === 'capacity' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: activeView === 'capacity' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px' }}
            >
              <BarChart3 size={16} />
            </button>
          </div>
          {/* Standard + and search buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            {!(isMobile && isSearchOpen) && (
              <button
                onClick={() => onAddAction?.()}
                style={{ width: '32px', height: '32px', background: '#F1F5F9', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                title="Adicionar Novo"
              >
                <Plus size={16} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: '3px', borderRadius: '10px', gap: '0', overflow: 'hidden', width: isSearchOpen ? '216px' : '32px', transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0 }}>
              <div style={{ overflow: 'hidden', width: isSearchOpen ? '176px' : '0px', opacity: isSearchOpen ? 1 : 0, transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <input
                  ref={searchInputRef}
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ height: '26px', padding: '0 0.5rem', border: 'none', fontSize: '0.75rem', width: '176px', background: 'transparent', outline: 'none', fontWeight: 500, color: 'var(--text-primary)', flexShrink: 0 }}
                />
              </div>
              <button
                onClick={() => { const next = !isSearchOpen; setIsSearchOpen(next); if (!next) setSearchTerm(''); else setTimeout(() => searchInputRef.current?.focus(), 260); }}
                style={{ width: '26px', height: '26px', background: isSearchOpen ? 'white' : 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: isSearchOpen ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', transition: 'background 0.2s, box-shadow 0.2s' }}
                title={isSearchOpen ? 'Fechar busca' : 'Buscar'}
              >
                <Search size={15} />
              </button>
            </div>
          </div>
          </>
        ) : location.pathname === '/iniciativas' ? (
          <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative' }} ref={filterMenuRef}>
            {(() => {
              const selectedLeader = selectedManagerId === 'all' ? null : leaders.find(l => l.id === selectedManagerId);
              const displayPerson = selectedLeader ?? (selectedManagerId === 'all' ? user : null);
              return (
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#F1F5F9',
                    padding: '0 0.6rem 0 0.35rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    height: '30px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E8EEF5'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {displayPerson ? (
                      <Avatar name={displayPerson.name} src={(displayPerson as any).photoUrl} size={22} fontSize={9} />
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UsersIcon size={11} color="white" />
                      </div>
                    )}
                    <span>
                      {selectedManagerId === 'all'
                        ? (user?.name?.split(' ')[0] || 'Usuário Logado')
                        : selectedLeader?.name.split(' ')[0] || 'Usuário Logado'}
                    </span>
                  </div>
                  <ChevronDown size={13} color="var(--text-tertiary)" style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '2px' }} />
                </button>
              );
            })()}

            {isFilterOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: '#FFF', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '0.3rem', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                <div
                  onClick={() => { setSelectedManagerId('all'); setIsFilterOpen(false); }}
                  style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: selectedManagerId === 'all' ? '#F1F5F9' : 'transparent', fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'background 0.2s' }}
                >
                  <Building2 size={14} color="var(--text-primary)" />
                  Usuário Logado
                </div>
                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.2rem 0.5rem' }} />
                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '2px' }}>
                  {leaders.map(leader => (
                    <div
                      key={leader.id}
                      onClick={() => { setSelectedManagerId(leader.id); setIsFilterOpen(false); }}
                      style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: selectedManagerId === leader.id ? '#F1F5F9' : 'transparent', color: 'var(--text-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: selectedManagerId === leader.id ? 700 : 500, transition: 'background 0.2s' }}
                    >
                      <Avatar name={leader.name} src={leader.photoUrl} size={18} fontSize={9} backgroundColor={selectedManagerId === leader.id ? '#334155' : '#94A3B8'} textColor="#FFFFFF" />
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
          <div style={{ position: 'relative' }} ref={viewMenuRef}>
            {(() => {
              const currentViewId = activeView === 'table' || activeView === 'newTimeline' ? activeView : 'status';
              const currentIcon = currentViewId === 'table'
                ? <List size={16} />
                : currentViewId === 'newTimeline'
                ? <GanttChartSquare size={16} />
                : <Clock size={16} />;

              return (
                <button
                  onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                  title="Selecionar visão"
                  style={{
                    height: '30px',
                    width: '36px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#F1F5F9',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E8EEF5'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  {currentIcon}
                </button>
              );
            })()}

            {isViewMenuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: '#FFF', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '0.3rem', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                {[
                  { id: 'table', label: 'Lista', icon: <List size={14} /> },
                  { id: 'status', label: 'Kanban', icon: <Clock size={14} /> },
                  { id: 'newTimeline', label: 'Timeline', icon: <GanttChartSquare size={14} /> }
                ].map(item => {
                  const currentViewId = activeView === 'table' || activeView === 'newTimeline' ? activeView : 'status';
                  const isActive = currentViewId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id as any);
                        setIsViewMenuOpen(false);
                      }}
                      style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: isActive ? '#F1F5F9' : 'transparent', color: 'var(--text-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: isActive ? 700 : 500, transition: 'background 0.2s' }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }} ref={initiativeTypeMenuRef}>
            {(() => {
              const isTypeFilterActive = selectedInitiativeType !== 'all';
              const currentTypeIcon = isTypeFilterActive
                ? getTypeIcon(selectedInitiativeType, 16)
                : <Layers size={16} />;

              return (
                <button
                  onClick={() => setIsInitiativeTypeMenuOpen(!isInitiativeTypeMenuOpen)}
                  title="Filtrar tipo da iniciativa"
                  style={{
                    height: '30px',
                    width: '36px',
                    borderRadius: '8px',
                    border: isTypeFilterActive ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                    background: isTypeFilterActive ? '#FEF9C3' : '#F1F5F9',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isTypeFilterActive ? '#FDE68A' : '#E8EEF5';
                    e.currentTarget.style.borderColor = isTypeFilterActive ? '#F59E0B' : '#CBD5E1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isTypeFilterActive ? '#FEF9C3' : '#F1F5F9';
                    e.currentTarget.style.borderColor = isTypeFilterActive ? '#FDE68A' : '#E2E8F0';
                  }}
                >
                  {currentTypeIcon}
                </button>
              );
            })()}

            {isInitiativeTypeMenuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: '#FFF', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '0.3rem', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                {[
                  { id: 'all', label: 'Todas', icon: <Layers size={14} /> },
                  { id: '1- Estratégico', label: 'Estruturante', icon: getTypeIcon('1- Estratégico', 14) },
                  { id: '2- Projeto', label: 'Projeto', icon: getTypeIcon('2- Projeto', 14) },
                  { id: '3- Fast Track', label: 'Fast Track', icon: getTypeIcon('3- Fast Track', 14) },
                  { id: '4- PBI', label: 'PBI', icon: getTypeIcon('4- PBI', 14) }
                ].map(item => {
                  const isActive = selectedInitiativeType === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedInitiativeType(item.id);
                        setIsInitiativeTypeMenuOpen(false);
                      }}
                      style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: isActive ? '#F1F5F9' : 'transparent', color: 'var(--text-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: isActive ? 700 : 500, transition: 'background 0.2s' }}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }} ref={initiativeStatusMenuRef}>
            {(() => {
              const isStatusFilterActive = selectedInitiativeStatuses.length > 0;
              const currentStatusIcon = selectedInitiativeStatuses.length === 1
                ? <StatusIcon status={selectedInitiativeStatuses[0]} size={16} />
                : <Clock size={16} />;

              return (
                <button
                  onClick={() => setIsInitiativeStatusMenuOpen(!isInitiativeStatusMenuOpen)}
                  title="Filtrar status da demanda"
                  style={{
                    height: '30px',
                    width: '36px',
                    borderRadius: '8px',
                    border: isStatusFilterActive ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                    background: isStatusFilterActive ? '#FEF9C3' : '#F1F5F9',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isStatusFilterActive ? '#FDE68A' : '#E8EEF5';
                    e.currentTarget.style.borderColor = isStatusFilterActive ? '#F59E0B' : '#CBD5E1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isStatusFilterActive ? '#FEF9C3' : '#F1F5F9';
                    e.currentTarget.style.borderColor = isStatusFilterActive ? '#FDE68A' : '#E2E8F0';
                  }}
                >
                  {currentStatusIcon}
                  {selectedInitiativeStatuses.length > 1 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      minWidth: '14px',
                      height: '14px',
                      borderRadius: '999px',
                      background: '#2563EB',
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px'
                    }}>
                      {selectedInitiativeStatuses.length}
                    </span>
                  )}
                </button>
              );
            })()}

            {isInitiativeStatusMenuOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 1000, background: '#FFF', border: '1px solid var(--glass-border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', padding: '0.3rem', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                <div
                  onClick={() => {
                    setSelectedInitiativeStatuses([]);
                    setIsInitiativeStatusMenuOpen(false);
                  }}
                  style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: selectedInitiativeStatuses.length === 0 ? '#F1F5F9' : 'transparent', color: 'var(--text-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: selectedInitiativeStatuses.length === 0 ? 700 : 500, transition: 'background 0.2s' }}
                >
                  <Clock size={14} />
                  <span>Todos os Status</span>
                </div>
                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.2rem 0.5rem' }} />
                {INITIATIVE_STATUS_OPTIONS.map(status => {
                  const isActive = selectedInitiativeStatuses.length === 0 || selectedInitiativeStatuses.includes(status);
                  return (
                    <div
                      key={status}
                      onClick={() => {
                        const current = selectedInitiativeStatuses;
                        let next: string[];
                        if (current.length === 0) {
                          // Default state means "all selected"; first click excludes one.
                          next = INITIATIVE_STATUS_OPTIONS.filter(s => s !== status);
                        } else if (current.includes(status)) {
                          next = current.filter(s => s !== status);
                        } else {
                          next = [...current, status];
                          if (INITIATIVE_STATUS_OPTIONS.every(s => next.includes(s))) {
                            next = [];
                          }
                        }
                        setSelectedInitiativeStatuses(next);
                      }}
                      style={{ padding: '0.5rem 0.7rem', cursor: 'pointer', borderRadius: '8px', background: isActive ? '#F1F5F9' : 'transparent', color: 'var(--text-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: isActive ? 700 : 500, transition: 'background 0.2s' }}
                    >
                      <div style={{ width: '13px', height: '13px', border: `2px solid ${isActive ? '#2563EB' : '#CBD5E1'}`, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isActive ? '#2563EB' : 'transparent' }}>
                        {isActive && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <StatusIcon status={status} size={14} />
                      <span>{status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            {!(isMobile && isSearchOpen) && <button
              onClick={() => onAddAction?.()}
              style={{
                width: '32px',
                height: '32px',
                background: '#F1F5F9',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Adicionar Novo"
            >
              <Plus size={16} />
            </button>}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '10px',
              gap: '0',
              overflow: 'hidden',
              width: isSearchOpen ? '216px' : '32px',
              transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
            }}>
              <div style={{
                overflow: 'hidden',
                width: isSearchOpen ? '176px' : '0px',
                opacity: isSearchOpen ? 1 : 0,
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <input
                  ref={searchInputRef}
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    height: '26px',
                    padding: '0 0.5rem',
                    border: 'none',
                    fontSize: '0.75rem',
                    width: '176px',
                    background: 'transparent',
                    outline: 'none',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    flexShrink: 0,
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const next = !isSearchOpen;
                  setIsSearchOpen(next);
                  if (!next) setSearchTerm('');
                  else setTimeout(() => searchInputRef.current?.focus(), 260);
                }}
                style={{
                  width: '26px',
                  height: '26px',
                  background: isSearchOpen ? 'white' : 'transparent',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: isSearchOpen ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
                title={isSearchOpen ? 'Fechar busca' : 'Buscar'}
              >
                <Search size={15} />
              </button>
            </div>

            <button
              onClick={() => onSettingsAction?.()}
              style={{
                width: '32px',
                height: '32px',
                background: '#F1F5F9',
                color: 'var(--text-secondary)',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Configurações"
            >
              <Settings size={15} />
            </button>

            {selectedCount > 0 && onDeleteAction && (
              <button
                onClick={() => onDeleteAction()}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#FEE2E2',
                  color: '#EF4444',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title={`Excluir ${selectedCount} selecionados`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          </>
        ) : !location.pathname.match(/\/iniciativas\/.+/) ? (
          location.pathname.startsWith('/iniciativas') ? (
            /* Initiatives: separate + button + animated search */
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              {!(isMobile && isSearchOpen) && <button
                onClick={() => onAddAction?.()}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#F1F5F9',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Adicionar Novo"
              >
                <Plus size={16} />
              </button>}

              {/* Animated search */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F1F5F9',
                padding: '3px',
                borderRadius: '10px',
                gap: '0',
                overflow: 'hidden',
                width: isSearchOpen ? '216px' : '32px',
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
              }}>
                {/* Input area — slides in from right */}
                <div style={{
                  overflow: 'hidden',
                  width: isSearchOpen ? '176px' : '0px',
                  opacity: isSearchOpen ? 1 : 0,
                  transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}>
                  <input
                    ref={searchInputRef}
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      height: '26px',
                      padding: '0 0.5rem',
                      border: 'none',
                      fontSize: '0.75rem',
                      width: '176px',
                      background: 'transparent',
                      outline: 'none',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                    }}
                  />
                </div>
                {/* Search icon button — toggles open/close */}
                <button
                  onClick={() => {
                    const next = !isSearchOpen;
                    setIsSearchOpen(next);
                    if (!next) setSearchTerm('');
                    else setTimeout(() => searchInputRef.current?.focus(), 260);
                  }}
                  style={{
                    width: '26px',
                    height: '26px',
                    background: isSearchOpen ? 'white' : 'transparent',
                    color: 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: isSearchOpen ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    transition: 'background 0.2s, box-shadow 0.2s',
                  }}
                  title={isSearchOpen ? 'Fechar busca' : 'Buscar'}
                >
                  <Search size={15} />
                </button>
              </div>

              <button
                onClick={() => onSettingsAction?.()}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#F1F5F9',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Configurações"
              >
                <Settings size={15} />
              </button>

              {selectedCount > 0 && onDeleteAction && (
                <button
                  onClick={() => onDeleteAction()}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: '#FEE2E2',
                    color: '#EF4444',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title={`Excluir ${selectedCount} selecionados`}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ) : location.pathname.startsWith('/tarefas') ? (
            /* Tarefas: animated search only, no + button */
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#F1F5F9',
                padding: '3px',
                borderRadius: '10px',
                gap: '0',
                overflow: 'hidden',
                width: isSearchOpen ? '216px' : '32px',
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                flexShrink: 0,
              }}>
                <div style={{
                  overflow: 'hidden',
                  width: isSearchOpen ? '176px' : '0px',
                  opacity: isSearchOpen ? 1 : 0,
                  transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}>
                  <input
                    ref={searchInputRef}
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      height: '26px',
                      padding: '0 0.5rem',
                      border: 'none',
                      fontSize: '0.75rem',
                      width: '176px',
                      background: 'transparent',
                      outline: 'none',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      flexShrink: 0,
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    const next = !isSearchOpen;
                    setIsSearchOpen(next);
                    if (!next) setSearchTerm('');
                    else setTimeout(() => searchInputRef.current?.focus(), 260);
                  }}
                  style={{
                    width: '26px',
                    height: '26px',
                    background: isSearchOpen ? 'white' : 'transparent',
                    color: 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: isSearchOpen ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    transition: 'background 0.2s, box-shadow 0.2s',
                  }}
                  title={isSearchOpen ? 'Fechar busca' : 'Buscar'}
                >
                  <Search size={15} />
                </button>
              </div>
            </div>
          ) : (
          /* Other pages: separate + button + animated search */
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
            {headerActions}
            {!(isMobile && isSearchOpen) && <button
              onClick={() => onAddAction?.()}
              style={{
                width: '32px',
                height: '32px',
                background: '#F1F5F9',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Adicionar Novo"
            >
              <Plus size={16} />
            </button>}

            {/* Animated search */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '10px',
              gap: '0',
              overflow: 'hidden',
              width: isSearchOpen ? '216px' : '32px',
              transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              flexShrink: 0,
            }}>
              <div style={{
                overflow: 'hidden',
                width: isSearchOpen ? '176px' : '0px',
                opacity: isSearchOpen ? 1 : 0,
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                <input
                  ref={searchInputRef}
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    height: '26px',
                    padding: '0 0.5rem',
                    border: 'none',
                    fontSize: '0.75rem',
                    width: '176px',
                    background: 'transparent',
                    outline: 'none',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    flexShrink: 0,
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const next = !isSearchOpen;
                  setIsSearchOpen(next);
                  if (!next) setSearchTerm('');
                  else setTimeout(() => searchInputRef.current?.focus(), 260);
                }}
                style={{
                  width: '26px',
                  height: '26px',
                  background: isSearchOpen ? 'white' : 'transparent',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: isSearchOpen ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
                title={isSearchOpen ? 'Fechar busca' : 'Buscar'}
              >
                <Search size={15} />
              </button>
            </div>

            {selectedCount > 0 && onDeleteAction && (
              <button
                onClick={() => onDeleteAction()}
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#FEE2E2',
                  color: '#EF4444',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title={`Excluir ${selectedCount} selecionados`}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          )
        ) : null}
      </div>

      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        transition: 'opacity 0.2s',
        opacity: isMobile && isSearchOpen ? 0 : 1,
        pointerEvents: isMobile && isSearchOpen ? 'none' : 'auto',
      }}>
        {headerContent && (location.pathname === '/iniciativas' || location.pathname === '/fornecedores' || location.pathname === '/inventario' || location.pathname === '/tarefas' || location.pathname === '/organizacao' || location.pathname === '/colaboradores') ? (
          headerContent
        ) : !headerContent && !isMobile ? (
          <h2 style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            {currentTitle}
          </h2>
        ) : null}
      </div>

    </header>
  );
};

export default Header;

