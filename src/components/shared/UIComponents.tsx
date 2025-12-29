// Shared UI components
import React from 'react';
import { FaSpinner, FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

/**
 * Loading Spinner Component
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <FaSpinner className={`${sizeClasses[size]} animate-spin text-brand-500`} />
        </div>
    );
};

/**
 * Skeleton Loader Component
 */
export const Skeleton: React.FC<{ className?: string; count?: number }> = ({
    className = '',
    count = 1
}) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse bg-gray-200 rounded ${className}`}
                />
            ))}
        </>
    );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Icon className="text-gray-300 text-6xl mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">{title}</h3>
            <p className="text-gray-500 mb-6 max-w-md">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/30"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

/**
 * Form Field with Validation
 */
interface FormFieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, required, children }) => {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <FaExclamationCircle />
                    {error}
                </p>
            )}
        </div>
    );
};

/**
 * Toast Notification Component
 */
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
    const config = {
        success: { icon: FaCheckCircle, bg: 'bg-green-500', text: 'text-white' },
        error: { icon: FaExclamationCircle, bg: 'bg-red-500', text: 'text-white' },
        info: { icon: FaInfoCircle, bg: 'bg-blue-500', text: 'text-white' },
        warning: { icon: FaExclamationCircle, bg: 'bg-yellow-500', text: 'text-white' }
    };

    const { icon: Icon, bg, text } = config[type];

    React.useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`${bg} ${text} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up`}>
            <Icon className="text-xl" />
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-auto text-xl hover:opacity-75">
                ×
            </button>
        </div>
    );
};

/**
 * Card Component for Mobile Layouts
 */
interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
