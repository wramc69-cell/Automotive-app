import React from 'react';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'dark';
    className?: string;
}

export const Badge = ({ children, variant = 'primary', className = '' }: BadgeProps) => {
    const variants = {
        primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
        secondary: 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100',
        outline: 'bg-transparent border-slate-200 text-slate-500 hover:border-primary hover:text-primary',
        destructive: 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100',
        success: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
        warning: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100',
        dark: 'bg-slate-900 text-white border-slate-800 hover:bg-black'
    };

    const variantClass = variants[variant] || variants.primary;

    return (
        <span className={`
            inline-flex items-center justify-center px-4 py-1 rounded-full border 
            text-[9px] font-black uppercase tracking-[0.2em] italic transition-all duration-300
            ${variantClass} ${className}
        `}>
            {children}
        </span>
    );
};
