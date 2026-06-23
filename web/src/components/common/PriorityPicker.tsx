import React from 'react';
import { Minus, Check } from 'lucide-react';

export type PriorityValue = 0 | 1 | 2 | 3 | 4;

export interface PriorityOption {
  value: PriorityValue;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { 
    value: 0, 
    label: 'Sem Prioridade', 
    icon: <Minus size={12} />, 
    color: '#94A3B8' 
  },
  { 
    value: 1, 
    label: 'Urgente', 
    icon: (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '10px' }}>
        <div style={{ width: '2px', height: '3px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '6px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '9px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '12px', background: 'currentColor', borderRadius: '1px' }} />
      </div>
    ), 
    color: '#EF4444' 
  },
  { 
    value: 2, 
    label: 'Alta', 
    icon: (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '10px' }}>
        <div style={{ width: '2px', height: '3px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '6px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '9px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '12px', background: 'currentColor', borderRadius: '1px', opacity: 0.2 }} />
      </div>
    ), 
    color: '#F97316' 
  },
  { 
    value: 3, 
    label: 'Média', 
    icon: (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '10px' }}>
        <div style={{ width: '2px', height: '3px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '6px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '9px', background: 'currentColor', borderRadius: '1px', opacity: 0.2 }} />
        <div style={{ width: '2px', height: '12px', background: 'currentColor', borderRadius: '1px', opacity: 0.2 }} />
      </div>
    ), 
    color: '#EAB308' 
  },
  { 
    value: 4, 
    label: 'Baixa', 
    icon: (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '10px' }}>
        <div style={{ width: '2px', height: '3px', background: 'currentColor', borderRadius: '1px' }} />
        <div style={{ width: '2px', height: '6px', background: 'currentColor', borderRadius: '1px', opacity: 0.2 }} />
        <div style={{ width: '2px', height: '9px', background: 'currentColor', borderRadius: '1px', opacity: 0.2 }} />
        <div style={{ width: '2px', height: '12px', background: 'currentColor', borderRadius: '1px', opacity: 0.2 }} />
      </div>
    ), 
    color: '#94A3B8' 
  }
];

export const PriorityIcon: React.FC<{ value: number | undefined; size?: number }> = ({ value = 0, size = 16 }) => {
  const option = PRIORITY_OPTIONS.find(o => o.value === value) || PRIORITY_OPTIONS[0];
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: option.color,
      width: size,
      height: size
    }}>
      {option.icon}
    </div>
  );
};

interface PriorityPickerProps {
  value: number;
  onSelect: (value: PriorityValue) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export const PriorityPicker: React.FC<PriorityPickerProps> = ({ value, onSelect, onClose, position }) => {
  return (
    <>
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 1000001 
        }} 
        onClick={onClose} 
      />
      <div 
        className="priority-picker-menu"
        style={{ 
          position: 'fixed', 
          top: position?.top ?? '50%', 
          left: position?.left ?? '50%',
          transform: position ? 'none' : 'translate(-50%, -50%)',
          background: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0,0,0,0.05)', 
          padding: '4px',
          minWidth: '160px',
          zIndex: 1000002,
          animation: 'scaleIn 0.1s ease-out'
        }}
      >
        <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Altere a Prioridade</span>
        </div>
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              onSelect(opt.value);
              onClose();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 10px',
              border: 'none',
              background: value === opt.value ? '#F1F5F9' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              color: '#1E293B',
              transition: 'background 0.1s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={(e) => e.currentTarget.style.background = value === opt.value ? '#F1F5F9' : 'transparent'}
          >
            <div style={{ color: opt.color, display: 'flex' }}>{opt.icon}</div>
            <span style={{ flex: 1 }}>{opt.label}</span>
            {value === opt.value && <Check size={14} style={{ color: '#2563EB' }} />}
            <span style={{ fontSize: '11px', color: '#94A3B8', width: '12px', textAlign: 'right' }}>{opt.value}</span>
          </button>
        ))}
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-5px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};
