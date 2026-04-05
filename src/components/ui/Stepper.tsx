import React from 'react';
import './Stepper.css';
import { Check } from 'lucide-react';

export interface Step {
    id: string;
    title: string;
    description?: string;
}

export interface StepperProps {
    steps: Step[];
    currentStep: number;
    className?: string;
}

export function Stepper({ steps, currentStep, className = '' }: StepperProps) {
    return (
        <div className={`stepper ${className}`}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;

                return (
                    <div key={step.id} className="stepper-item">
                        <div className={`stepper-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            {isCompleted ? <Check size={14} /> : <span>{index + 1}</span>}
                        </div>
                        <div className="stepper-content">
                            <h4 className={`stepper-title ${isActive ? 'active' : ''}`}>{step.title}</h4>
                            {step.description && <p className="stepper-description">{step.description}</p>}
                        </div>
                        {index < steps.length - 1 && <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />}
                    </div>
                );
            })}
        </div>
    );
}
