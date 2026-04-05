import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'dark';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    fullWidth?: boolean;
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth, loading, disabled, children, ...props }, ref) => {
        const variants = {
            primary: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-lg shadow-blue-200/50 !important',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
            outline: 'border-2 border-[#2563eb] text-[#2563eb] hover:bg-blue-50',
            ghost: 'hover:bg-blue-50 text-[#2563eb]',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive-hover',
            dark: 'bg-slate-900 text-white hover:bg-slate-800'
        };

        const variantClass = variants[variant as keyof typeof variants] || variants.primary;

        return (
            <button
                ref={ref}
                className={`btn btn-${size} ${variantClass} ${fullWidth ? 'btn-full' : ''} ${loading ? 'opacity-75 cursor-not-allowed' : ''} ${className}`}
                disabled={loading || disabled}
                {...props}
            >
                {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
