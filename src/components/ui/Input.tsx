import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, hint, id, ...props }, ref) => {
        const defaultId = React.useId();
        const inputId = id || defaultId;

        return (
            <div className="input-field">
                {label && <label htmlFor={inputId} className="input-label">{label}</label>}
                <input
                    id={inputId}
                    ref={ref}
                    className={`input-control ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                {hint && !error && <span className="input-hint text-xs text-slate-500 mt-1">{hint}</span>}
                {error && <span className="input-error-msg">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';
