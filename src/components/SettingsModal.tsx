import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  Check, 
  Copy, 
  RefreshCw, 
  Shield, 
  Bell, 
  Compass, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { UserPreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => Promise<void>;
  onResetSampleData: () => Promise<void>;
}

const ALL_INTERESTS = [
  'Hackathons',
  'Workshops',
  'Academics',
  'Exams',
  'Placements',
  'Cultural',
  'Sports',
  'Administrative',
];

const SAMPLE_SQL_SCHEMA = `-- Campus Pulse Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  event_date DATE,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  deadline TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium',
  required_action TEXT,
  target_audience TEXT DEFAULT 'All students',
  missing_information TEXT[] DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'verified',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Users can insert announcements" ON public.announcements FOR INSERT WITH CHECK (true);`;

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  onResetSampleData,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'supabase'>('profile');
  const [formData, setFormData] = useState<UserPreferences>(preferences);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists 
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePreferences(formData);
      onClose();
    } catch (err: any) {
      alert(`Error saving preferences: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (confirm('Restore default Buildathon sample announcements? This will refresh your demo data.')) {
      setIsResetting(true);
      try {
        await onResetSampleData();
        alert('Sample demo announcements restored successfully!');
      } catch (err: any) {
        alert(`Error resetting data: ${err.message}`);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SAMPLE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Preferences & Database Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized feed topics, clash alerts, and Supabase integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Personalization & Alerts
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Database Guide</span>
          </button>
        </div>

        {/* Tab 1: Profile & Alerts */}
        {activeTab === 'profile' && (
          <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
            
            {/* Interests Multi-Select */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Personalized Feed Interests
              </label>
              <p className="text-xs text-slate-500">
                Select the topics you care about most. Your dashboard and alerts will prioritize announcements matching these tags:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_INTERESTS.map((interest) => {
                  const selected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department & Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Branch
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Year of Study
                </label>
                <select
                  value={formData.yearOfStudy}
                  onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="1st Year">1st Year Undergraduate</option>
                  <option value="2nd Year">2nd Year Undergraduate</option>
                  <option value="3rd Year">3rd Year Undergraduate</option>
                  <option value="4th Year">4th Year Undergraduate</option>
                  <option value="Postgraduate">Postgraduate / Masters</option>
                </select>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Smart Assistance Features
              </label>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Event Clash Detector
                  </div>
                  <div className="text-xs text-slate-500">
                    Flag warnings when 2 events overlap on the same date and time
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableClashAlerts}
                  onChange={(e) => setFormData({ ...formData, enableClashAlerts: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Deadline Alert Warnings
                  </div>
                  <div className="text-xs text-slate-500">
                    Highlight urgent deadlines due within 72 hours
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableDeadlineReminders}
                  onChange={(e) => setFormData({ ...formData, enableDeadlineReminders: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Reset Demo Data Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Testing the app? Restore clean sample circulars anytime:
              </div>
              <button
                type="button"
                onClick={handleResetData}
                disabled={isResetting}
                className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset Demo Announcements</span>
              </button>
            </div>

          </div>
        )}

        {/* Tab 2: Supabase Guide */}
        {activeTab === 'supabase' && (
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs text-slate-600 dark:text-slate-400">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60 text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-900 dark:text-purple-300 mb-1">
                <Database className="w-4 h-4" />
                <span>Supabase PostgreSQL Integration Architecture</span>
              </div>
              <p className="text-xs leading-relaxed">
                Campus Pulse features a dual-persistence engine. Out of the box, it runs a persistent server-side JSON store so you can test and demo without friction. When ready to connect to your Supabase project on Vercel or locally, follow these 3 steps:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="font-semibold text-slate-900 dark:text-white mb-1">
                  1. Run SQL Schema & RLS in Supabase
                </div>
                <p className="mb-2">
                  Copy the schema below or use the included <code className="font-mono text-purple-600 dark:text-purple-400">supabase-schema.sql</code> file in the repository root:
                </p>
                <div className="relative">
                  <pre className="p-2.5 rounded bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-36">
                    {SAMPLE_SQL_SCHEMA}
                  </pre>
                  <button
                    onClick={handleCopySql}
                    className="absolute top-2 right-2 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] rounded font-mono flex items-center gap-1"
                  >
                    {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="font-semibold text-slate-900 dark:text-white mb-1">
                  2. Add Environment Variables
                </div>
                <p>Add these to your Vercel deployment or <code className="font-mono text-purple-600 dark:text-purple-400">.env</code> file:</p>
                <pre className="mt-1.5 p-2 rounded bg-slate-100 dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  {`VITE_SUPABASE_URL="https://your-project.supabase.co"\nVITE_SUPABASE_ANON_KEY="your-anon-key"`}
                </pre>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="font-semibold text-slate-900 dark:text-white mb-1">
                  3. Secure Server-Side Gemini API Calls
                </div>
                <p>
                  Gemini API keys stay protected on the server side in <code className="font-mono text-purple-600 dark:text-purple-400">server.ts</code> or Supabase Edge Functions. The browser never accesses the raw AI keys.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
