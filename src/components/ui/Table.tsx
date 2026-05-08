import React from 'react';

export function Table({ className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
    return (
        <div className="w-full overflow-hidden rounded-[3.5rem] bg-white shadow-3xl shadow-slate-100/40 border border-slate-50">
            <div className="overflow-x-auto">
                <table className={`w-full text-left border-collapse ${className}`} {...props} />
            </div>
        </div>
    );
}

export function TableHeader({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={`bg-slate-950 text-white ${className}`} {...props} />;
}

export function TableBody({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={`divide-y divide-slate-50 ${className}`} {...props} />;
}

export function TableRow({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={`group transition-all duration-300 hover:bg-slate-50/50 ${className}`} {...props} />;
}

export function TableHead({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th 
            className={`px-10 py-8 text-[10px] font-black uppercase italic tracking-[0.4em] text-primary/80 ${className}`} 
            {...props} 
        />
    );
}

export function TableCell({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td 
            className={`px-10 py-8 text-[11px] font-bold text-slate-900 uppercase italic tracking-tight group-hover:text-primary transition-colors ${className}`} 
            {...props} 
        />
    );
}
