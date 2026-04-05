import React from 'react';
import './Badge.css';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
    return (
        <div className={`badge badge-${variant} ${className}`} {...props} />
    );
}
