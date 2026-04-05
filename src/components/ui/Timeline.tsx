import React from 'react';
import './Timeline.css';

export interface TimelineItem {
    id: string;
    title: string;
    description?: string;
    date: string;
    status?: 'default' | 'success' | 'warning' | 'error';
}

export interface TimelineProps {
    items: TimelineItem[];
    className?: string;
}

export function Timeline({ items, className = '' }: TimelineProps) {
    return (
        <div className={`timeline ${className}`}>
            {items.map((item, index) => (
                <div key={item.id} className="timeline-item">
                    <div className="timeline-marker">
                        <div className={`timeline-dot timeline-dot-${item.status || 'default'}`} />
                        {index < items.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-content">
                        <div className="timeline-header">
                            <h4 className="timeline-title">{item.title}</h4>
                            <span className="timeline-date">{item.date}</span>
                        </div>
                        {item.description && <p className="timeline-description">{item.description}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}
