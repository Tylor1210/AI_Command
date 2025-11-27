import React from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ theme, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className="relative inline-flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
            }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <div className="relative w-6 h-6">
                {/* Sun Icon */}
                <Sun
                    size={20}
                    className="absolute inset-0 m-auto transition-all duration-300"
                    style={{
                        color: 'var(--color-warning)',
                        opacity: theme === 'light' ? 1 : 0,
                        transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(0)',
                    }}
                />
                {/* Moon Icon */}
                <Moon
                    size={20}
                    className="absolute inset-0 m-auto transition-all duration-300"
                    style={{
                        color: 'var(--color-info)',
                        opacity: theme === 'dark' ? 1 : 0,
                        transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0)',
                    }}
                />
            </div>
        </button>
    );
};

export default ThemeToggle;
