import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const colorStyles = {
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-t-transparent`}
                style={{
                    borderColor: `${colorStyles[color]} transparent ${colorStyles[color]} ${colorStyles[color]}`,
                }}
            />
        </div>
    );
};

export default LoadingSpinner;
