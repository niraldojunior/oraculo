import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Minus } from 'lucide-react';

interface StatusIconProps {
  status: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusIcon: React.FC<StatusIconProps> = ({ status, size = 18, className, style }) => {
  const normalized = status.toLowerCase();
  
  const strokeWidth = 3;
  const color = '#94A3B8'; // Slate-400
  const activeColor = '#3B82F6'; // Blue-500
  const successColor = '#10B981'; // Emerald-500
  const errorColor = '#EF4444'; // Red-500
  const warningColor = '#F59E0B'; // Amber-500
  const bgColor = '#E2E8F0'; // Slate-200 for background circle

  // Progress-based SVG Wrapper
  const ProgressSvg = ({ progress }: { progress: number }) => {
    // 0 = Backlog (dotted), 1 = 25%, 2 = 50%, 3 = 75%, 4 = 100%
    if (progress === 0) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
          <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={2} strokeDasharray="3 3" />
        </svg>
      );
    }

    const paths = [
      "", // 0 fallback
      "M 12 3 A 9 9 0 0 1 21 12", // 25%
      "M 12 3 A 9 9 0 0 1 12 21", // 50%
      "M 12 3 A 9 9 0 1 1 3 12", // 75%
      "M 12 3 A 9 9 0 1 1 12 21 A 9 9 0 1 1 12 3" // 100%
    ];

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        <path 
          d={paths[progress]} 
          fill="none" 
          stroke={activeColor} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round"
        />
      </svg>
    );
  };

  if (normalized.includes('backlog')) return <ProgressSvg progress={0} />;
  if (normalized.includes('discovery')) return <ProgressSvg progress={1} />;
  if (normalized.includes('planejamento')) return <ProgressSvg progress={2} />;
  if (normalized.includes('execução')) return <ProgressSvg progress={3} />;
  if (normalized.includes('implantação')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={activeColor} strokeWidth={strokeWidth} />
        <circle cx="12" cy="12" r="4" fill={activeColor} />
      </svg>
    );
  }

  if (normalized.includes('concluído')) {
    return <CheckCircle2 size={size} color={successColor} strokeWidth={strokeWidth - 0.5} className={className} style={style} />;
  }

  if (normalized.includes('cancelado') || normalized.includes('cancelada')) {
    return <XCircle size={size} color={errorColor} strokeWidth={strokeWidth - 0.5} className={className} style={style} />;
  }

  if (normalized.includes('suspenso')) {
    return <AlertCircle size={size} color={warningColor} strokeWidth={strokeWidth - 0.5} className={className} style={style} />;
  }

  // Fallback
  return <Minus size={size} color={color} strokeWidth={2} className={className} style={style} />;
};
