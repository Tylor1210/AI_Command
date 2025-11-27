import React from 'react';

const StatsCard = ({ icon: Icon, label, value, trend, color = 'primary' }) => {
    const colorStyles = {
        primary: {
            bg: 'var(--color-primary-light)',
            text: 'var(--color-primary)',
            icon: 'var(--color-primary)',
        },
        success: {
            bg: 'var(--color-success-light)',
            text: 'var(--color-success)',
            icon: 'var(--color-success)',
        },
        warning: {
            bg: 'var(--color-warning-light)',
            text: 'var(--color-warning)',
            icon: 'var(--color-warning)',
        },
        info: {
            bg: 'var(--color-info-light)',
            text: 'var(--color-info)',
            icon: 'var(--color-info)',
        },
    };

    return (
        <div
            className="card p-6 animate-fade-in"
            style={{ backgroundColor: 'var(--bg-card)' }}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p
                        className="text-sm font-medium mb-1"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {label}
                    </p>
                    <p
                        className="text-3xl font-bold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {value}
                    </p>
                    {trend && (
                        <p
                            className="text-xs mt-2"
                            style={{ color: colorStyles[color].text }}
                        >
                            {trend}
                        </p>
                    )}
                </div>
                <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colorStyles[color].bg }}
                >
                    <Icon size={28} style={{ color: colorStyles[color].icon }} />
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
