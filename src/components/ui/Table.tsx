import React from 'react';
import './Table.css';

export function Table({ className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
    return (
        <div className="table-container">
            <table className={`table ${className}`} {...props} />
        </div>
    );
}

export function TableHeader({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={`table-header ${className}`} {...props} />;
}

export function TableBody({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={`table-body ${className}`} {...props} />;
}

export function TableRow({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={`table-row ${className}`} {...props} />;
}

export function TableHead({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={`table-head ${className}`} {...props} />;
}

export function TableCell({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={`table-cell ${className}`} {...props} />;
}
