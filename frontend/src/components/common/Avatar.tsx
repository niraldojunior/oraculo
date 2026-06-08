import React, { useEffect, useMemo, useState } from 'react';

export interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: number;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
}

function getInitials(name?: string | null): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 24,
  title,
  className,
  style,
  backgroundColor = '#3B82F6',
  textColor = '#FFFFFF',
  fontSize,
  fontWeight = 700
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const canShowImage = Boolean(src && !hasError);
  const initials = useMemo(() => getInitials(name), [name]);

  if (canShowImage) {
    return (
      <img
        loading="lazy"
        src={src || undefined}
        alt={name || 'avatar'}
        title={title || name || undefined}
        className={className}
        onError={() => setHasError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  return (
    <div
      title={title || name || undefined}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: backgroundColor,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize || `${Math.max(10, Math.floor(size / 2.4))}px`,
        fontWeight,
        lineHeight: 1,
        flexShrink: 0,
        ...style
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
