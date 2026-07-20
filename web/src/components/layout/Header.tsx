import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Collaborator } from '../../types';
import { useView } from '@/context/ViewContext';
import { StatusIcon } from '@/components/common/StatusIcon';
import { getTypeIcon } from '@/components/initiative/SidebarComponents';
import LeaderFilter from '@/components/common/LeaderFilter';
import ViewMenu from '@/components/common/ViewMenu';
import { findSectionByPath, findViewByPath } from '@/config/navigation';
import {
  Plus,
  Search,
  Layers,
  Clock,
  Trash2,
  Settings,
  ListFilter,
  ChevronRight,
} from 'lucide-react';

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
  'Cancelado',
];

const INITIATIVE_TYPE_OPTIONS = [
  { id: '1- Estratégico', label: 'Estruturante' },
  { id: '2- Projeto', label: 'Projeto' },
  { id: '3- Fast Track', label: 'Fast Track' },
  { id: '4- PBI', label: 'PBI' },
];

/** Caixa de busca animada do header — antes duplicada cinco vezes neste arquivo. */
const SearchBox: React.FC<{
  value: string;
  onChange: (v: string) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}> = ({ value, onChange, isOpen, setIsOpen }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`header-search ${isOpen ? 'is-open' : ''}`}>
      <div className="header-search-field">
        <input
          ref={inputRef}
          placeholder="Buscar..."
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="header-search-toggle"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (!next) onChange('');
          else setTimeout(() => inputRef.current?.focus(), 260);
        }}
        title={isOpen ? 'Fechar busca' : 'Buscar'}
      >
        <Search size={15} />
      </button>
    </div>
  );
};

const HeaderIconButton: React.FC<{
  onClick: () => void;
  title: string;
  variant?: 'default' | 'danger';
  children: React.ReactNode;
}> = ({ onClick, title, variant = 'default', children }) => (
  <button
    type="button"
    className={`header-icon-btn ${variant === 'danger' ? 'header-icon-btn--danger' : ''}`}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);

const Header: React.FC = () => {
  const { user, currentCompany, currentDepartment } = useAuth();
  const location = useLocation();

  const {
    searchTerm,
    setSearchTerm,
    onAddAction,
    selectedCount,
    onDeleteAction,
    onSettingsAction,
    selectedManagerId,
    setSelectedManagerId,
    selectedInitiativeTypes,
    setSelectedInitiativeTypes,
    selectedInitiativeStatuses,
    setSelectedInitiativeStatuses,
    headerContent,
    headerLeftActions,
    headerActions,
  } = useView();

  const [leaders, setLeaders] = useState<Collaborator[]>([]);
  const [isInitiativeFilterMenuOpen, setIsInitiativeFilterMenuOpen] = useState(false);
  const [activeInitiativeFilterSection, setActiveInitiativeFilterSection] = useState<'tipo' | 'status' | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const initiativeFilterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (initiativeFilterMenuRef.current && !initiativeFilterMenuRef.current.contains(event.target as Node)) {
        setIsInitiativeFilterMenuOpen(false);
        setActiveInitiativeFilterSection(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const section = findSectionByPath(location.pathname);
  const currentView = findViewByPath(location.pathname);
  const isDashboard = location.pathname === '/';
  const isInitiativeDetail = /\/iniciativas\/.+/.test(location.pathname) && !currentView;
  const leaderFilterMode = isDashboard ? 'user' : currentView?.leaderFilter ?? false;
  const toolbar = currentView?.toolbar ?? {};

  useEffect(() => {
    if (!leaderFilterMode) return;
    if (!currentCompany) {
      setLeaders([]);
      return;
    }

    const fetchLeaders = async () => {
      try {
        const params = new URLSearchParams();
        params.append('companyId', currentCompany.id);
        if (currentDepartment) params.append('departmentId', currentDepartment.id);

        const res = await fetch(`/api/collaborators?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const data: Collaborator[] = await res.json();
          const filtered = data
            .filter(c => ['Director', 'Head', 'Manager', 'Master'].includes(c.role))
            .sort((a, b) => {
              const order: Record<string, number> = { Head: 0, Director: 1, Manager: 2, Master: 3 };
              const oa = order[a.role] ?? 4;
              const ob = order[b.role] ?? 4;
              if (oa !== ob) return oa - ob;
              return a.name.localeCompare(b.name);
            });
          setLeaders(filtered);
        }
      } catch (e) {
        console.error('Error fetching leaders for header:', e);
      }
    };
    fetchLeaders();
  }, [leaderFilterMode, currentCompany, currentDepartment]);

  // Pre-select the correct manager whenever the logged-in user changes
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || leaders.length === 0) return;
    if (prevUserIdRef.current === user.id) return;
    prevUserIdRef.current = user.id;

    const isLeader = leaders.some(l => l.id === user.id);
    if (isLeader) {
      setSelectedManagerId(user.id);
      return;
    }

    // Not a leader — find their direct team leader
    if (user.squadId) {
      const params = new URLSearchParams();
      if (currentCompany) params.append('companyId', currentCompany.id);
      fetch(`/api/teams?${params.toString()}`, { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : []))
        .then((teams: { id: string; leaderId: string | null }[]) => {
          const userTeam = teams.find(t => t.id === user.squadId);
          if (userTeam?.leaderId && leaders.some(l => l.id === userTeam.leaderId)) {
            setSelectedManagerId(userTeam.leaderId);
          } else {
            setSelectedManagerId('all');
          }
        })
        .catch(() => setSelectedManagerId('all'));
    } else {
      setSelectedManagerId('all');
    }
  }, [user, leaders, currentCompany, setSelectedManagerId]);

  const currentTitle = isDashboard
    ? 'Executive Dashboard'
    : isInitiativeDetail
      ? 'Editar Iniciativa'
      : section?.label ?? '';

  const activeFilterCount =
    (selectedInitiativeTypes.length > 0 ? 1 : 0) + (selectedInitiativeStatuses.length > 0 ? 1 : 0);

  const headerContentSlot = isInitiativeDetail
    ? 'detail'
    : currentView?.headerContentSlot ?? 'center';

  return (
    <header className="top-header flex-between">
      <div className="header-left">
        {/* Alocação injeta seus próprios filtros à esquerda; detalhe de iniciativa ocupa a faixa toda */}
        {headerContent && headerContentSlot === 'left' && (
          <div style={{ marginRight: '1rem' }}>{headerContent}</div>
        )}
        {headerContent && headerContentSlot === 'detail' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{headerContent}</div>
        )}

        {leaderFilterMode && (
          <LeaderFilter
            mode={leaderFilterMode}
            leaders={leaders}
            selectedManagerId={selectedManagerId}
            onChange={setSelectedManagerId}
            fallbackUser={user ? { name: user.name, photoUrl: user.photoUrl } : null}
          />
        )}

        {isDashboard && headerLeftActions}

        {section && currentView && (
          <ViewMenu section={section} currentView={currentView} isMobile={isMobile} />
        )}

        {/* Filtro de tipo/status — exclusivo das Iniciativas */}
        {section?.key === 'iniciativas' && currentView && (
          <div style={{ position: 'relative' }} ref={initiativeFilterMenuRef}>
            <button
              type="button"
              className={`header-filter-btn ${activeFilterCount > 0 ? 'is-active' : ''}`}
              onClick={() => {
                setIsInitiativeFilterMenuOpen(!isInitiativeFilterMenuOpen);
                setActiveInitiativeFilterSection(null);
              }}
              title="Filtrar iniciativas"
              aria-haspopup="menu"
              aria-expanded={isInitiativeFilterMenuOpen}
            >
              <ListFilter size={16} />
              {activeFilterCount > 0 && <span className="header-filter-badge">{activeFilterCount}</span>}
            </button>

            {isInitiativeFilterMenuOpen && (
              <div className="header-filter-menu" role="menu">
                {/* Tipo */}
                <div
                  className={`header-filter-section ${activeInitiativeFilterSection === 'tipo' ? 'is-open' : ''}`}
                  onClick={() => setActiveInitiativeFilterSection(activeInitiativeFilterSection === 'tipo' ? null : 'tipo')}
                >
                  <Layers size={14} />
                  <span style={{ flex: 1 }}>Tipo</span>
                  <span className="header-filter-count">
                    {selectedInitiativeTypes.length === 0 ? 'Todos' : `${selectedInitiativeTypes.length} selec.`}
                  </span>
                  <ChevronRight
                    size={13}
                    className="header-filter-chevron"
                    style={{ transform: activeInitiativeFilterSection === 'tipo' ? 'rotate(90deg)' : 'none' }}
                  />
                </div>
                {activeInitiativeFilterSection === 'tipo' && (
                  <div className="header-filter-options">
                    <div
                      className={`header-filter-option ${selectedInitiativeTypes.length === 0 ? 'is-active' : ''}`}
                      onClick={() => setSelectedInitiativeTypes([])}
                    >
                      <Layers size={14} />
                      <span>Todos os Tipos</span>
                    </div>
                    {INITIATIVE_TYPE_OPTIONS.map(item => {
                      const isActive =
                        selectedInitiativeTypes.length === 0 || selectedInitiativeTypes.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`header-filter-option ${isActive ? 'is-active' : ''}`}
                          onClick={() => {
                            const current = selectedInitiativeTypes;
                            let next: string[];
                            if (current.length === 0) {
                              next = INITIATIVE_TYPE_OPTIONS.map(t => t.id).filter(id => id !== item.id);
                            } else if (current.includes(item.id)) {
                              next = current.filter(id => id !== item.id);
                            } else {
                              next = [...current, item.id];
                              if (INITIATIVE_TYPE_OPTIONS.every(t => next.includes(t.id))) next = [];
                            }
                            setSelectedInitiativeTypes(next);
                          }}
                        >
                          <span className={`header-filter-checkbox ${isActive ? 'is-checked' : ''}`}>
                            {isActive && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          {getTypeIcon(item.id, 14)}
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="header-filter-divider" />

                {/* Status */}
                <div
                  className={`header-filter-section ${activeInitiativeFilterSection === 'status' ? 'is-open' : ''}`}
                  onClick={() => setActiveInitiativeFilterSection(activeInitiativeFilterSection === 'status' ? null : 'status')}
                >
                  <Clock size={14} />
                  <span style={{ flex: 1 }}>Status</span>
                  <span className="header-filter-count">
                    {selectedInitiativeStatuses.length === 0 ? 'Todos' : `${selectedInitiativeStatuses.length} selec.`}
                  </span>
                  <ChevronRight
                    size={13}
                    className="header-filter-chevron"
                    style={{ transform: activeInitiativeFilterSection === 'status' ? 'rotate(90deg)' : 'none' }}
                  />
                </div>
                {activeInitiativeFilterSection === 'status' && (
                  <div className="header-filter-options header-filter-options--scroll">
                    <div
                      className={`header-filter-option ${selectedInitiativeStatuses.length === 0 ? 'is-active' : ''}`}
                      onClick={() => setSelectedInitiativeStatuses([])}
                    >
                      <Clock size={14} />
                      <span>Todos os Status</span>
                    </div>
                    {INITIATIVE_STATUS_OPTIONS.map(status => {
                      const isActive =
                        selectedInitiativeStatuses.length === 0 || selectedInitiativeStatuses.includes(status);
                      return (
                        <div
                          key={status}
                          className={`header-filter-option ${isActive ? 'is-active' : ''}`}
                          onClick={() => {
                            const current = selectedInitiativeStatuses;
                            let next: string[];
                            if (current.length === 0) {
                              // Estado padrão significa "todos selecionados"; o primeiro clique exclui um.
                              next = INITIATIVE_STATUS_OPTIONS.filter(s => s !== status);
                            } else if (current.includes(status)) {
                              next = current.filter(s => s !== status);
                            } else {
                              next = [...current, status];
                              if (INITIATIVE_STATUS_OPTIONS.every(s => next.includes(s))) next = [];
                            }
                            setSelectedInitiativeStatuses(next);
                          }}
                        >
                          <span className={`header-filter-checkbox ${isActive ? 'is-checked' : ''}`}>
                            {isActive && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <StatusIcon status={status} size={14} />
                          <span>{status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ações à direita */}
        {(isDashboard || currentView) && (
          <div className="header-actions">
            {isDashboard ? (
              headerActions
            ) : (
              <>
                {headerActions}
                {toolbar.add && !(isMobile && isSearchOpen) && onAddAction && (
                  <HeaderIconButton onClick={() => onAddAction()} title="Adicionar Novo">
                    <Plus size={16} />
                  </HeaderIconButton>
                )}
                {toolbar.search && (
                  <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    isOpen={isSearchOpen}
                    setIsOpen={setIsSearchOpen}
                  />
                )}
                {toolbar.settings && (
                  <HeaderIconButton onClick={() => onSettingsAction?.()} title="Configurações">
                    <Settings size={15} />
                  </HeaderIconButton>
                )}
                {toolbar.delete && selectedCount > 0 && onDeleteAction && (
                  <HeaderIconButton
                    onClick={() => onDeleteAction()}
                    title={`Excluir ${selectedCount} selecionados`}
                    variant="danger"
                  >
                    <Trash2 size={14} />
                  </HeaderIconButton>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div
        className="header-center"
        style={{
          opacity: isMobile && isSearchOpen ? 0 : 1,
          pointerEvents: isMobile && isSearchOpen ? 'none' : 'auto',
        }}
      >
        {headerContent && headerContentSlot === 'center' ? (
          headerContent
        ) : !headerContent && !isMobile ? (
          <h2 className="header-title">{currentTitle}</h2>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
