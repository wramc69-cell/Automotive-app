import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, hint, className = '', ...props }, ref) => {
        return (
            <div className="flex flex-col gap-3 font-inter">
                {label && (
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] italic ml-5 flex items-center gap-2">
                        <div className="w-4 h-[1px] bg-primary/40"></div> {label}
                    </label>
                )}
                <div className="relative group/input">
                    <input
                        ref={ref}
                        className={`
                            h-11 w-full px-6 bg-slate-50 border-2 border-slate-50/50 rounded-xl 
                            text-sm font-medium tracking-tight text-slate-900
                            placeholder:text-slate-300 placeholder:italic
                            transition-all duration-500 outline-none
                            focus:border-primary focus:shadow-2xl focus:shadow-primary/5
                            dark:bg-white/5 dark:border-white/5 dark:text-white dark:focus:bg-white/10
                            disabled:opacity-50 disabled:bg-slate-50/20 disabled:border-transparent
                            ${error ? 'border-rose-500 focus:border-rose-500 focus:shadow-rose-500/5' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                    {error && (
                        <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-rose-500">
                            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                        </div>
                    )}
                </div>
                {error && <p className="text-[9px] font-black uppercase text-rose-500 tracking-widest italic ml-5">{error}</p>}
                {(helperText || hint) && !error && <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest italic ml-5">{helperText || hint}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
