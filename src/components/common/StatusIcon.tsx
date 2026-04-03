import React from 'react';

interface StatusIconProps {
  status: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, size = 18, className, style }) => {
  const normalized = status.toLowerCase();
  
  // Base stroke width relative to 24px default viewbox
  const strokeWidth = 2.5;
  const color = '#64748B'; // Default slate-500
  const activeColor = '#334155'; // Slate-700
  const successColor = '#10B981'; // Emerald-500
  const errorColor = '#EF4444'; // Red-500
  const warningColor = '#F59E0B'; // Amber-500

  // Common circle backdrop
  const Backdrop = () => (
    <circle 
      cx="12" 
      cy="12" 
      r="9" 
      fill="none" 
      stroke="#E2E8F0" 
      strokeWidth={strokeWidth} 
    />
  );

  if (normalized.includes('backlog')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (normalized.includes('discovery')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <Backdrop />
        <path 
          d="M 12 3 A 9 9 0 0 1 21 12 L 12 12 Z" 
          fill={activeColor} 
        />
        <circle cx="12" cy="12" r="9" fill="none" stroke={activeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (normalized.includes('planejamento')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <Backdrop />
        <path 
          d="M 12 3 A 9 9 0 0 1 12 21 L 12 12 Z" 
          fill={activeColor} 
        />
        <circle cx="12" cy="12" r="9" fill="none" stroke={activeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (normalized.includes('execução')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <Backdrop />
        <path 
          d="M 12 3 A 9 9 0 1 1 3 12 L 12 12 Z" 
          fill={activeColor} 
        />
        <circle cx="12" cy="12" r="9" fill="none" stroke={activeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (normalized.includes('implantação')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill={activeColor} stroke={activeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (normalized.includes('concluído')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="10" fill={successColor} />
        <path 
          d="M 8 12 L 11 15 L 16 9" 
          fill="none" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    );
  }

  if (normalized.includes('cancelado') || normalized.includes('cancelada')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={errorColor} strokeWidth={strokeWidth} />
        <path 
          d="M 8 8 L 16 16 M 16 8 L 8 16" 
          fill="none" 
          stroke={errorColor} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  if (normalized.includes('suspenso')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={warningColor} strokeWidth={strokeWidth} />
        <path 
          d="M 10 8 L 10 16 M 14 8 L 14 16" 
          fill="none" 
          stroke={warningColor} 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  // Fallback
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={strokeWidth} opacity={0.5} />
    </svg>
  );
};
