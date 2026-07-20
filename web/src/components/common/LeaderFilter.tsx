import React, { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Users as UsersIcon } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { Collaborator } from '../../types';
import type { LeaderFilterMode } from '@/config/navigation';

interface LeaderFilterProps {
  mode: Exclude<LeaderFilterMode, false>;
  leaders: Collaborator[];
  selectedManagerId: string;
  onChange: (id: string) => void;
  /** Pessoa exibida no trigger quando nenhum líder está selecionado (usuário logado). */
  fallbackUser?: { name: string; photoUrl?: string } | null;
  /**
   * Trigger só com o avatar — sem nome nem chevron. Usado no canto direito do
   * header, onde o nome competia por espaço com as ações da visão. O nome vira
   * `title` do botão, então a informação continua acessível.
   */
  compact?: boolean;
  /** Alinha o menu pela direita — evita estouro quando o trigger fica na borda. */
  align?: 'left' | 'right';
}

/**
 * Filtro de líder do header. Antes era um bloco de ~50 linhas duplicado cinco
 * vezes em Header.tsx, variando só no rótulo do item "todos" e na presença da
 * opção "Não TI" (exclusiva de Produtos › Aplicações).
 */
const LeaderFilter: React.FC<LeaderFilterProps> = ({
  mode,
  leaders,
  selectedManagerId,
  onChange,
  fallbackUser,
  compact = false,
  align = 'left',
}) => {
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

  const allLabel = mode === 'user' ? 'Usuário Logado' : 'Todos';
  const selectedLeader = selectedManagerId === 'all' ? null : leaders.find(l => l.id === selectedManagerId);
  const displayPerson = selectedLeader ?? (selectedManagerId === 'all' ? fallbackUser : null);

  const triggerLabel = () => {
    if (selectedManagerId === 'nao-ti') return 'Não TI';
    if (selectedManagerId === 'all') {
      return mode === 'user' ? fallbackUser?.name?.split(' ')[0] || allLabel : 'Todos';
    }
    return selectedLeader?.name.split(' ')[0] || allLabel;
  };

  const select = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }} ref={menuRef}>
      <button
        type="button"
        className={`leader-filter-trigger ${compact ? 'leader-filter-trigger--compact' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Gestor: ${triggerLabel()}`}
        title={compact ? `Gestor: ${triggerLabel()}` : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 0 : '0.45rem' }}>
          {displayPerson ? (
            <Avatar name={displayPerson.name} src={displayPerson.photoUrl} size={22} fontSize={9} />
          ) : (
            <div className="leader-filter-avatar-fallback">
              <UsersIcon size={11} color="white" />
            </div>
          )}
          {!compact && <span className="leader-name-label">{triggerLabel()}</span>}
        </div>
        {!compact && (
          <ChevronDown
            size={13}
            className="leader-filter-chevron"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
          />
        )}
      </button>

      {isOpen && (
        <div
          className={`leader-filter-menu ${align === 'right' ? 'leader-filter-menu--right' : ''}`}
          role="menu"
        >
          <div
            role="menuitemradio"
            aria-checked={selectedManagerId === 'all'}
            className={`leader-filter-item ${selectedManagerId === 'all' ? 'is-active' : ''}`}
            onClick={() => select('all')}
          >
            <Building2 size={14} />
            {allLabel}
          </div>

          <div className="leader-filter-divider" />

          {mode === 'all-naoti' && (
            <>
              <div
                role="menuitemradio"
                aria-checked={selectedManagerId === 'nao-ti'}
                className={`leader-filter-item leader-filter-item--naoti ${selectedManagerId === 'nao-ti' ? 'is-active' : ''}`}
                onClick={() => select('nao-ti')}
              >
                <div className="leader-filter-naoti-badge">N</div>
                Não TI
              </div>
              <div className="leader-filter-divider" />
            </>
          )}

          <div className="leader-filter-list">
            {leaders.map(leader => {
              const isActive = selectedManagerId === leader.id;
              return (
                <div
                  key={leader.id}
                  role="menuitemradio"
                  aria-checked={isActive}
                  className={`leader-filter-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => select(leader.id)}
                >
                  <Avatar
                    name={leader.name}
                    src={leader.photoUrl}
                    size={18}
                    fontSize={9}
                    backgroundColor={isActive ? '#334155' : '#94A3B8'}
                    textColor="#FFFFFF"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{leader.name}</span>
                    <span className="leader-filter-role">{leader.role}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderFilter;
