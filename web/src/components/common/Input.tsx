import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, id, className, ...props }, ref) => {
    const inputId = id || `input-${Math.random()}`;

    return (
      <div className="form-group">
        {label && <label htmlFor={inputId}>{label}</label>}
        <input ref={ref} id={inputId} className={`input ${className || ''}`} aria-invalid={!!error} {...props} />
        {error && <span className="input-error">{error}</span>}
        {helper && <span className="input-helper">{helper}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
