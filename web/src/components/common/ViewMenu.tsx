import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronsUpDown } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { sectionViews } from '@/config/navigation';
import type { NavSection, ViewDef } from '@/config/navigation';

interface ViewMenuProps {
  section: NavSection;
  currentView: ViewDef | null;
  isMobile: boolean;
}

/**
 * Menu suspenso de visões da seção atual, em substituição aos antigos
 * *segmented controls* (pílulas) que eram reescritos inline em cada página.
 * Grupos com `label` viram cabeçalhos (usado por Produtos: Aplicações/Serviços);
 * grupos sem `label` renderizam a lista direta.
 */
const ViewMenu: React.FC<ViewMenuProps> = ({ section, currentView, isMobile }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEscapeKey(() => setIsOpen(false));

  const visible = (item: ViewDef) => !(isMobile && item.hideOnMobile);
  const groups = section.groups
    .map(g => ({ ...g, items: g.items.filter(visible) }))
    .filter(g => g.items.length > 0);

  if (groups.length === 0 || sectionViews(section).length <= 1) return null;

  const TriggerIcon = currentView?.icon ?? section.icon;
  const triggerLabel = currentView?.label ?? section.label;

  const select = (item: ViewDef) => {
    setIsOpen(false);
    if (item.path !== currentView?.path) navigate(item.path);
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
      <button
        type="button"
        className="view-menu-trigger view-menu-trigger--icon-only"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Trocar visão. Visão atual: ${triggerLabel}`}
        title={triggerLabel}
      >
        <TriggerIcon size={15} />
        <ChevronsUpDown size={12} className="view-menu-trigger-chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="view-menu" role="menu">
          {groups.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`}>
              {group.label && <div className="view-menu-group-label">{group.label}</div>}
              {group.items.map(item => {
                const ItemIcon = item.icon;
                const isActive = item.path === currentView?.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    className={`view-menu-item ${isActive ? 'is-active' : ''}`}
                    onClick={() => select(item)}
                  >
                    <ItemIcon size={14} />
                    <span className="view-menu-item-label">{item.label}</span>
                    {isActive && <CheckCircle2 size={14} className="view-menu-item-check" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewMenu;
