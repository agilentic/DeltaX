
import React from 'react';
import { UserSettings, ExamBoard, Tier } from '../types';
import { EXAM_BOARDS, TIERS } from '../constants';

interface SettingsProps {
  settings: UserSettings;
  onUpdate: (settings: UserSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const handleChange = (field: keyof UserSettings, value: any) => {
    onUpdate({ ...settings, [field]: value });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Configure your high-performance workspace.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Curriculum & Level</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Exam Board</label>
              <select 
                value={settings.board}
                onChange={(e) => handleChange('board', e.target.value as ExamBoard)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition"
              >
                {EXAM_BOARDS.map(board => (
                  <option key={board} value={board}>{board}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Tier</label>
              <select 
                value={settings.tier}
                onChange={(e) => handleChange('tier', e.target.value as Tier)}
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition"
              >
                {TIERS.map(tier => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Timed Mode</h2>
            <button 
              onClick={() => handleChange('defaultTimedMode', !settings.defaultTimedMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.defaultTimedMode ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.defaultTimedMode ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-sm text-gray-500">Enable a timer by default for every practice session to simulate exam pressure.</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Ambient AI Focus</h2>
            <button 
              onClick={() => handleChange('ambientAudio', !settings.ambientAudio)}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.ambientAudio ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.ambientAudio ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-sm text-gray-500">Enable soft ambient white noise during AI Tutor sessions to aid concentration.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Daily Goal</h2>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Questions per Day</label>
            <input 
              type="range"
              min="1"
              max="20"
              value={settings.dailyGoal}
              onChange={(e) => handleChange('dailyGoal', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-sm text-gray-500 font-medium">
              <span>1 Question</span>
              <span className="text-blue-600 font-bold">{settings.dailyGoal} Questions</span>
              <span>20 Questions</span>
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button 
            disabled
            className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-bold cursor-not-allowed"
          >
            Settings Synchronized
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
