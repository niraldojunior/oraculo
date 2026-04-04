import React from 'react';
import { Check, X, Minus, Pause } from 'lucide-react';

interface StatusIconProps {
  status: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, size = 18, className, style }) => {
  const normalized = status.toLowerCase();
  
  const strokeWidth = 2;
  const color = '#94A3B8'; // Slate-400
  const activeColor = '#3B82F6'; // Blue-500
  const successColor = '#10B981'; // Emerald-500
  const errorColor = '#EF4444'; // Red-500
  const warningColor = '#F59E0B'; // Amber-500

  if (normalized.includes('backlog')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray="2 2" />
      </svg>
    );
  }

  if (normalized.includes('discovery')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <path 
          d="M 12 3 A 9 9 0 0 1 21 12" 
          fill="none" 
          stroke={activeColor} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (normalized.includes('planejamento')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <path 
          d="M 12 3 A 9 9 0 0 1 12 21" 
          fill="none" 
          stroke={activeColor} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (normalized.includes('execução')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <path 
          d="M 12 3 A 9 9 0 1 1 3 12" 
          fill="none" 
          stroke={activeColor} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (normalized.includes('implantação')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={activeColor} strokeWidth={strokeWidth + 1} />
        <circle cx="12" cy="12" r="4" fill={activeColor} />
      </svg>
    );
  }

  if (normalized.includes('concluído')) {
    return <Check size={size} color={successColor} strokeWidth={3} className={className} style={style} />;
  }

  if (normalized.includes('cancelado') || normalized.includes('cancelada')) {
    return <X size={size} color={errorColor} strokeWidth={2.5} className={className} style={style} />;
  }

  if (normalized.includes('suspenso')) {
    return <Pause size={size} color={warningColor} strokeWidth={2.5} className={className} style={style} />;
  }

  // Fallback
  return <Minus size={size} color={color} strokeWidth={2} className={className} style={style} />;
};
