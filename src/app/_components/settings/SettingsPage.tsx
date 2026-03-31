"use client";

import { ChevronRight, Lock, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '~/components/ui/switch';
import { Button } from '~/components/ui/button';

export default function SettingsPage({
  onSignOut,
  darkMode,
  onToggleDarkMode,
}: {
  onSignOut: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  const [settings, setSettings] = useState({
    soundEffects: true,
    mapStyle: 'satellite',
    measurementUnits: 'metric',
    fogIntensity: 'medium',
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const t = darkMode
    ? {
        page: 'bg-[#0F1729] text-white',
        heading: 'text-white',
        sectionLabel: 'text-[#6B7280]',
        card: 'bg-[#1a2540]/40 border-[#1a2540]',
        logoutBtn: 'bg-[#1a2540]/60 text-[#E6EDF7] hover:bg-[#1a2540] border border-[#1a2540]',
      }
    : {
        page: 'bg-[#f8fafc] text-gray-900',
        heading: 'text-gray-900',
        sectionLabel: 'text-gray-500',
        card: 'bg-white border-gray-200',
        logoutBtn: 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200',
      };

  return (
    <div className={`min-h-screen ${t.page}`}>
      <div className="max-w-[600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-[32px] font-bold ${t.heading}`}>Settings</h1>
        </div>

        {/* Account */}
        <div className="mb-6">
          <h3 className={`text-[12px] font-semibold uppercase tracking-wider mb-3 ${t.sectionLabel}`}>
            Account
          </h3>
          <div className={`rounded-xl overflow-hidden border ${t.card}`}>
            <SettingButton label="Change Password" icon={<Lock className="size-5" />} darkMode={darkMode} />
          </div>
        </div>

        {/* Map & Display */}
        <div className="mb-6">
          <h3 className={`text-[12px] font-semibold uppercase tracking-wider mb-3 ${t.sectionLabel}`}>
            Map & Display
          </h3>
          <div className={`rounded-xl p-4 border ${t.card}`}>
            <div className="space-y-1">
              <SettingSelect
                label="Map Style"
                description="Choose your preferred map appearance"
                options={['Standard', 'Satellite', 'Dark Mode']}
                darkMode={darkMode}
              />
              <SettingSelect
                label="Units"
                description="Distance measurement system"
                options={['Metric (km)', 'Imperial (mi)']}
                darkMode={darkMode}
              />
              <SettingSelect
                label="Fog Intensity"
                description="How much of the map is hidden"
                options={['Light', 'Medium', 'Heavy']}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="mb-6">
          <h3 className={`text-[12px] font-semibold uppercase tracking-wider mb-3 ${t.sectionLabel}`}>
            Preferences
          </h3>
          <div className={`rounded-xl p-4 border ${t.card}`}>
            <div className="space-y-1">
              <SettingToggle
                label="Dark Mode"
                description="Switch between light and dark theme"
                checked={darkMode}
                onChange={onToggleDarkMode}
                darkMode={darkMode}
              />
              <SettingToggle
                label="Sound Effects"
                description="Play sounds for discoveries and achievements"
                checked={settings.soundEffects}
                onChange={() => toggleSetting('soundEffects')}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>

        {/* Log Out */}
        <div className="mb-8">
          <Button
            onClick={onSignOut}
            className={`w-full h-12 text-[16px] font-semibold rounded-xl ${t.logoutBtn}`}
          >
            <LogOut className="mr-2 size-5" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
  darkMode,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  darkMode: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-3 border-b last:border-b-0 ${darkMode ? 'border-[#1a2540]' : 'border-gray-200'}`}>
      <div className="flex-1">
        <p className={`text-[16px] font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        <p className={`text-[14px] mt-1 ${darkMode ? 'text-[#6B7280]' : 'text-gray-500'}`}>{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-[#38bdf8]" />
    </div>
  );
}

function SettingButton({ label, icon, darkMode }: { label: string; icon: React.ReactNode; darkMode: boolean }) {
  return (
    <button className={`flex items-center justify-between w-full py-4 px-4 border-b last:border-b-0 transition-colors ${darkMode ? 'border-[#1a2540] hover:bg-[#1a2540]/60' : 'border-gray-200 hover:bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <div className="text-[#38bdf8]">{icon}</div>
        <p className={`text-[16px] font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
      </div>
      <ChevronRight className={darkMode ? 'text-[#6B7280]' : 'text-gray-400'} size={20} />
    </button>
  );
}

function SettingSelect({
  label,
  description,
  options,
  darkMode,
}: {
  label: string;
  description: string;
  options: string[];
  darkMode: boolean;
}) {
  return (
    <div className={`py-3 border-b last:border-b-0 ${darkMode ? 'border-[#1a2540]' : 'border-gray-200'}`}>
      <p className={`text-[16px] font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
      <p className={`text-[14px] mt-1 ${darkMode ? 'text-[#6B7280]' : 'text-gray-500'}`}>{description}</p>
      <select className={`w-full mt-3 rounded-lg px-4 py-2 text-[14px] focus:outline-none focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 ${darkMode ? 'bg-[#1a2540] text-[#E6EDF7] border border-[#1a2540]' : 'bg-gray-50 text-gray-900 border border-gray-200'}`}>
        {options.map((option, index) => (
          <option key={index} value={option.toLowerCase().replace(/\s+/g, '-')}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
