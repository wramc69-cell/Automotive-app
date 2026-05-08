import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'dark' | 'success';
    size?: 'sm' | 'md' | 'lg' | 'icon' | 'xl';
    fullWidth?: boolean;
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth, loading, disabled, children, ...props }, ref) => {
        
        const baseClasses = "inline-flex items-center justify-center font-black uppercase italic tracking-[0.2em] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed select-none touch-manipulation";
        
        const variants = {
            primary: 'bg-primary text-white hover:bg-slate-900 shadow-xl shadow-primary/20 hover:shadow-slate-900/10 active:scale-95',
            secondary: 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-100 shadow-sm active:scale-95',
            outline: 'border-2 border-primary/20 text-primary hover:border-primary hover:bg-primary/5 active:scale-95',
            ghost: 'hover:bg-primary/5 text-primary tracking-[0.1em] active:scale-95',
            destructive: 'bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-500/20 active:scale-95',
            dark: 'bg-slate-950 text-white hover:bg-primary shadow-2xl active:scale-95',
            success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 active:scale-95'
        };

        const sizes = {
            sm: 'h-8 px-4 text-[9px] rounded-full',
            md: 'h-10 px-6 text-[10px] rounded-xl',
            lg: 'h-12 px-8 text-[11px] rounded-[1.2rem]',
            xl: 'h-14 px-10 text-[12px] rounded-[1.5rem]',
            icon: 'h-10 w-10 rounded-xl flex items-center justify-center p-0'
        };

        const variantClass = variants[variant as keyof typeof variants] || variants.primary;
        const sizeClass = sizes[size as keyof typeof sizes] || sizes.md;
        const widthClass = fullWidth ? 'w-full' : '';

        return (
            <button
                ref={ref}
                className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
                disabled={loading || disabled}
                {...props}
            >
                {loading && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                <span className="relative z-10 flex items-center gap-2">
                    {children}
                </span>
            </button>
        );
    }
);
Button.displayName = 'Button';
