import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckSquare, 
  Square, 
  Clock, 
  AlertTriangle, 
  Download, 
  Calendar, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Announcement, ActionPlan } from '../types';
import { exportToICS } from '../utils/calendarExport';

interface ActionPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

export const ActionPlannerModal: React.FC<ActionPlannerModalProps> = ({
  isOpen,
  onClose,
  announcement,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen && announcement) {
      fetchActionPlan();
      setCompletedSteps({});
    }
  }, [isOpen, announcement?.id]);

  const fetchActionPlan = async () => {
    if (!announcement) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/action-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate action plan');
      }

      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message || 'Error communicating with AI engine.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  if (!isOpen || !announcement) return null;

  const totalSteps = plan?.steps.length || 0;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

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
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                AI Action Planner
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                For: {announcement.title}
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

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* Target announcement recap */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white text-sm">
              {announcement.title}
            </div>
            <div className="flex items-center gap-2 flex-wrap font-mono">
              <span>{announcement.category}</span>
              <span aria-hidden="true">·</span>
              <span>Event: {announcement.date || 'TBD'}</span>
              <span aria-hidden="true">·</span>
              <span>Deadline: {announcement.deadline ? announcement.deadline.split('T')[0] : 'None'}</span>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-purple-600 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Generating personalized step-by-step checklist with Gemini...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Plan Content */}
          {!loading && plan && (
            <div className="space-y-4">
              
              {/* Critical warning if any */}
              {plan.criticalWarning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Important Prerequisite: </span>
                    {plan.criticalWarning}
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Checklist Progress</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {completedCount} of {totalSteps} done ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Step Checklist */}
              <div className="space-y-2.5">
                {plan.steps.map((s) => {
                  const isChecked = Boolean(completedSteps[s.step]);
                  return (
                    <div
                      key={s.step}
                      onClick={() => toggleStep(s.step)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-slate-500' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <button className="mt-0.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold ${isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {s.step}. {s.action}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            ~{s.estimatedTime}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isChecked ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {s.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          {announcement.date && (
            <button
              onClick={() => exportToICS(announcement)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Add to Calendar (.ics)</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={fetchActionPlan}
              disabled={loading}
              className="px-3 py-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Regenerate Steps
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
