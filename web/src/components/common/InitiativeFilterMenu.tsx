import React, { useEffect, useRef, useState } from 'react';
import { useView } from '@/context/ViewContext';
import { StatusIcon } from '@/components/common/StatusIcon';
import { getTypeIcon } from '@/components/initiative/SidebarComponents';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { Layers, Clock, ListFilter, ChevronRight } from 'lucide-react';

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

/**
 * Filtro de tipo/status das Iniciativas. Vive no sub-header (D14), junto das
 * demais ações da visão — antes ficava no header principal.
 *
 * Convenção do estado: lista vazia significa **todos selecionados**, então o
 * primeiro clique num item exclui aquele item em vez de selecionar só ele.
 */
const InitiativeFilterMenu: React.FC<{ openTo?: 'left' | 'right'; showLabel?: boolean }> = ({ openTo = 'left', showLabel = false }) => {
  const {
    selectedInitiativeTypes,
    setSelectedInitiativeTypes,
    selectedInitiativeStatuses,
    setSelectedInitiativeStatuses,
  } = useView();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'tipo' | 'status' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSection(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEscapeKey(() => {
    setIsOpen(false);
    setActiveSection(null);
  });

  const activeFilterCount =
    (selectedInitiativeTypes.length > 0 ? 1 : 0) + (selectedInitiativeStatuses.length > 0 ? 1 : 0);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        type="button"
        className={`header-filter-btn ${activeFilterCount > 0 ? 'is-active' : ''} ${showLabel ? 'header-filter-btn--labeled' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setActiveSection(null);
        }}
        title="Filtrar iniciativas"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <ListFilter size={16} />
        {showLabel && <span className="header-filter-btn-label">Filtro</span>}
        {activeFilterCount > 0 && <span className="header-filter-badge">{activeFilterCount}</span>}
      </button>

      {isOpen && (
        <div className={`header-filter-menu header-filter-menu--${openTo}`} role="menu">
          {/* Tipo */}
          <div
            className={`header-filter-section ${activeSection === 'tipo' ? 'is-open' : ''}`}
            onClick={() => setActiveSection(activeSection === 'tipo' ? null : 'tipo')}
          >
            <Layers size={14} />
            <span style={{ flex: 1 }}>Tipo</span>
            <span className="header-filter-count">
              {selectedInitiativeTypes.length === 0 ? 'Todos' : `${selectedInitiativeTypes.length} selec.`}
            </span>
            <ChevronRight
              size={13}
              className="header-filter-chevron"
              style={{ transform: activeSection === 'tipo' ? 'rotate(90deg)' : 'none' }}
            />
          </div>
          {activeSection === 'tipo' && (
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
            className={`header-filter-section ${activeSection === 'status' ? 'is-open' : ''}`}
            onClick={() => setActiveSection(activeSection === 'status' ? null : 'status')}
          >
            <Clock size={14} />
            <span style={{ flex: 1 }}>Status</span>
            <span className="header-filter-count">
              {selectedInitiativeStatuses.length === 0 ? 'Todos' : `${selectedInitiativeStatuses.length} selec.`}
            </span>
            <ChevronRight
              size={13}
              className="header-filter-chevron"
              style={{ transform: activeSection === 'status' ? 'rotate(90deg)' : 'none' }}
            />
          </div>
          {activeSection === 'status' && (
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
  );
};

export default InitiativeFilterMenu;
