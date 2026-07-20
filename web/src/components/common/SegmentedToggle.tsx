import type { LucideIcon } from 'lucide-react';

export interface SegmentedToggleOption<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Hint exibido como `title` do botão (default: `label`). */
  title?: string;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: SegmentedToggleOption<T>[];
  onChange: (id: T) => void;
  ariaLabel: string;
  /** Mostra só o ícone; o rótulo vai para `title`/`aria-label`. */
  iconOnly?: boolean;
}

/**
 * Chavinha de botões (segmented) para alternar entre poucas opções mutuamente
 * exclusivas dentro de uma faixa de cabeçalho — ex.: modo de agrupamento do
 * Roadmap. Diferente do `HeaderSelect` (dropdown), todas as opções ficam
 * visíveis lado a lado. Não é troca de visão (D13): é um recorte interno da
 * visão corrente.
 */
function SegmentedToggle<T extends string>({ value, options, onChange, ariaLabel, iconOnly }: SegmentedToggleProps<T>) {
  return (
    <div className="segmented-toggle" role="group" aria-label={ariaLabel}>
      {options.map(option => {
        const Icon = option.icon;
        const active = option.id === value;
        const label = option.title ?? option.label;
        return (
          <button
            key={option.id}
            type="button"
            className={`segmented-toggle-btn${iconOnly ? ' segmented-toggle-btn--icon-only' : ''}${active ? ' is-active' : ''}`}
            aria-pressed={active}
            aria-label={iconOnly ? label : undefined}
            title={label}
            onClick={() => onChange(option.id)}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            {!iconOnly && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedToggle;
