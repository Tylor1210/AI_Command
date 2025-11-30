import React, { useState } from 'react';
import { Sparkles, Calendar, CheckSquare } from 'lucide-react';

const POSTING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const APPROVAL_DAYS = ['Saturday', 'Sunday'];

const AutopilotView = ({ userId, isPaidUser, db, alertMessage }) => {
    const [config, setConfig] = useState({
        businessType: '',
        postDays: [],
        approvalDay: 'Saturday'
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleDayToggle = (day) => {
        setConfig(prev => ({
            ...prev,
            postDays: prev.postDays.includes(day)
                ? prev.postDays.filter(d => d !== day)
                : [...prev.postDays, day]
        }));
    };

    const generateContent = () => {
        console.log('🤖 Autopilot Configuration:', config);

        // Mock posts generation
        const mockPosts = [
            {
                id: `mock_${Date.now()}_1`,
                caption: `Generated post 1 for ${config.businessType}`,
                platform: 'LinkedIn',
                postType: 'Feed Post',
                aiStatus: 'Generated - Needs Review'
            },
            {
                id: `mock_${Date.now()}_2`,
                caption: `Generated post 2 for ${config.businessType}`,
                platform: 'Instagram',
                postType: 'Feed Post',
                aiStatus: 'Generated - Needs Review'
            },
            {
                id: `mock_${Date.now()}_3`,
                caption: `Generated post 3 for ${config.businessType}`,
                platform: 'X',
                postType: 'Feed Post',
                aiStatus: 'Generated - Needs Review'
            }
        ];

        console.log('📝 Mock Generated Posts:', mockPosts);
        alertMessage(`Generated ${mockPosts.length} posts for review!`);

        return mockPosts;
    };

    const saveConfig = async () => {
        if (!userId) {
            alertMessage('Error: User not authenticated');
            return;
        }

        setIsSaving(true);
        try {
            const { setDoc, doc } = await import('firebase/firestore');
            const configRef = doc(db, 'artifacts', 'ai-automation-v1', 'users', userId, 'autopilot_config', 'current');

            await setDoc(configRef, {
                ...config,
                updatedAt: new Date().toISOString()
            });

            console.log('✅ Config saved to Firestore:', config);
            alertMessage('Autopilot configuration saved successfully!');
        } catch (error) {
            console.error('❌ Error saving config:', error);
            alertMessage(`Error saving configuration: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isPaidUser) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-2xl p-8 text-white text-center">
                    <Sparkles size={64} className="mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-4">Upgrade to Enable Autopilot!</h2>
                    <p className="text-lg mb-6">
                        Unlock automated content generation and scheduling with our premium Autopilot feature.
                    </p>
                    <button className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition shadow-lg">
                        Upgrade Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-6">
                    <Sparkles size={32} className="text-indigo-600 mr-3" />
                    <h2 className="text-3xl font-bold text-gray-900">Autopilot Configuration</h2>
                </div>

                <p className="text-gray-600 mb-8">
                    Configure your automated content generation schedule. The system will generate posts on your selected days and remind you for approval.
                </p>

                <div className="space-y-6">
                    {/* Business Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Type
                        </label>
                        <input
                            type="text"
                            value={config.businessType}
                            onChange={(e) => setConfig(prev => ({ ...prev, businessType: e.target.value }))}
                            placeholder="e.g., Digital Marketing Agency, Coffee Shop, SaaS Startup"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Posting Days */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            <Calendar size={18} className="inline mr-2" />
                            Posting Days
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {POSTING_DAYS.map(day => (
                                <button
                                    key={day}
                                    onClick={() => handleDayToggle(day)}
                                    className={`px-4 py-3 rounded-lg font-medium transition-all ${config.postDays.includes(day)
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <CheckSquare size={16} className="inline mr-2" />
                                    {day}
                                </button>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Selected: {config.postDays.length > 0 ? config.postDays.join(', ') : 'None'}
                        </p>
                    </div>

                    {/* Approval Reminder Day */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Approval Reminder Day
                        </label>
                        <select
                            value={config.approvalDay}
                            onChange={(e) => setConfig(prev => ({ ...prev, approvalDay: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {APPROVAL_DAYS.map(day => (
                                <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-2">
                            You'll receive a reminder to approve generated posts on {config.approvalDay}s.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-6 border-t border-gray-200">
                        <button
                            onClick={saveConfig}
                            disabled={isSaving || !config.businessType}
                            className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </button>
                        <button
                            onClick={generateContent}
                            disabled={!config.businessType || config.postDays.length === 0}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Sparkles size={18} className="inline mr-2" />
                            Generate Content (Mock)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutopilotView;
