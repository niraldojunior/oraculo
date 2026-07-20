import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

export interface HeaderSelectOption<T extends string | number> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Hint exibido como `title` do item. */
  description?: string;
}

interface HeaderSelectProps<T extends string | number> {
  value: T | null;
  options: HeaderSelectOption<T>[];
  onChange: (id: T) => void;
  ariaLabel: string;
  /** Texto do trigger quando `value` não casa com nenhuma opção. */
  placeholder?: string;
  minWidth?: number;
  /** Mensagem exibida no lugar da lista quando não há opções. */
  emptyLabel?: string;
}

/**
 * Combo de texto para as faixas de cabeçalho (D14) — trigger com o rótulo da
 * opção corrente + chevron, menu ancorado à esquerda.
 *
 * Substitui os dropdowns que o `DashboardPage` montava inline com estilo
 * hardcoded; usa as classes/tokens de `.header-select-*` em `index.css`.
 */
function HeaderSelect<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = 'Selecionar',
  minWidth,
  emptyLabel,
}: HeaderSelectProps<T>) {
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

  const selected = options.find(option => option.id === value) ?? null;
  const TriggerIcon = selected?.icon;

  return (
    <div className="header-select" ref={menuRef}>
      <button
        type="button"
        className="header-select-trigger"
        style={minWidth ? { minWidth } : undefined}
        onClick={() => setIsOpen(open => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        title={selected?.label ?? placeholder}
      >
        {TriggerIcon && <TriggerIcon size={14} aria-hidden="true" />}
        <span className="header-select-value">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={13}
          className="header-select-chevron"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {isOpen && (
        <div className="header-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.length === 0 && emptyLabel ? (
            <span className="header-select-empty">{emptyLabel}</span>
          ) : (
            options.map(option => {
              const OptionIcon = option.icon;
              const active = option.id === value;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  title={option.description}
                  className={`header-select-option ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                >
                  {OptionIcon && <OptionIcon size={14} aria-hidden="true" />}
                  <span>{option.label}</span>
                  {active && <Check size={13} className="header-select-check" aria-hidden="true" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default HeaderSelect;
