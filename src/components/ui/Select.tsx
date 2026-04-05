import React from 'react';
import './Select.css';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { label: string; value: string }[];
    error?: string;
    hint?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, options, error, hint, id, ...props }, ref) => {
        const defaultId = React.useId();
        const selectId = id || defaultId;

        return (
            <div className="select-field">
                {label && <label htmlFor={selectId} className="select-label">{label}</label>}
                <div className="select-wrapper">
                    <select
                        id={selectId}
                        ref={ref}
                        className={`select-control ${error ? 'select-error' : ''} ${className}`}
                        {...props}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="select-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
                {hint && !error && <span className="select-hint text-xs text-slate-500 mt-1">{hint}</span>}
                {error && <span className="select-error-msg">{error}</span>}
            </div>
        );
    }
);
Select.displayName = 'Select';
