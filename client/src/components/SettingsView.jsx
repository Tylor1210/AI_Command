import React from 'react';
import { Settings } from 'lucide-react';

const SettingsView = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-6">
                    <Settings size={32} className="text-gray-400 mr-3" />
                    <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
                </div>
                <p className="text-gray-600">
                    Settings configuration coming soon! This is where you'll be able to manage your account preferences, API keys, and more.
                </p>
            </div>
        </div>
    );
};

export default SettingsView;
