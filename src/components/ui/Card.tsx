import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card = ({ children, className = '', onClick }: CardProps) => {
    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded-[3.5rem] shadow-3xl shadow-slate-100/40 border border-slate-50/50 p-10 overflow-hidden relative transition-all duration-700 hover:shadow-primary/5 group/card ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = '' }: CardProps) => (
    <div className={`space-y-4 mb-8 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }: CardProps) => (
    <h3 className={`text-3xl font-black italic tracking-tighter text-slate-900 leading-none group-hover/card:text-primary transition-colors ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }: CardProps) => (
    <p className={`text-[10px] font-black uppercase text-slate-300 tracking-[0.4em] italic leading-relaxed ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = '' }: CardProps) => (
    <div className={`${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }: CardProps) => (
    <div className={`mt-8 pt-8 border-t border-slate-50 flex items-center justify-between ${className}`}>{children}</div>
);
