import React from 'react';

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
            <div className="flex flex-col gap-3 font-inter">
                {label && (
                    <label htmlFor={selectId} className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em] italic ml-5 flex items-center gap-2">
                        <div className="w-4 h-[1px] bg-primary/40"></div> {label}
                    </label>
                )}
                <div className="relative group/select">
                    <select
                        id={selectId}
                        ref={ref}
                        className={`
                            h-16 w-full px-8 bg-slate-50 border-2 border-slate-50/50 rounded-[1.8rem] 
                            text-[11px] font-black uppercase italic tracking-widest text-slate-900 
                            appearance-none transition-all duration-500 outline-none
                            focus:bg-white focus:border-primary focus:shadow-2xl focus:shadow-primary/5
                            disabled:opacity-50 disabled:bg-slate-50/20
                            ${error ? 'border-rose-500 focus:border-rose-500 focus:shadow-rose-500/5' : ''}
                            ${className}
                        `}
                        {...props}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-white text-slate-900 py-4 font-bold uppercase italic">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-primary group-hover/select:scale-110 transition-transform duration-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
                {error && <p className="text-[9px] font-black uppercase text-rose-500 tracking-widest italic ml-5">{error}</p>}
                {hint && !error && <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest italic ml-5">{hint}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';
