import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, className, children, disabled, ...props }, ref) => {
    const variants: Record<ButtonVariant, string> = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      danger: 'btn-danger',
      ghost: 'btn-ghost',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
    };

    return (
      <button
        ref={ref}
        className={`btn ${variants[variant]} ${sizes[size]} ${className || ''}`}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
