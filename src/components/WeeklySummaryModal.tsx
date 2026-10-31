import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  Calendar, 
  ShieldCheck, 
  Info 
} from 'lucide-react';

interface WeeklySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  generatedAt: string | null;
  onRefreshSummary: () => Promise<void>;
  isLoading: boolean;
}

export const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({
  isOpen,
  onClose,
  summary,
  generatedAt,
  onRefreshSummary,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
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
                AI Weekly Campus Intelligence Brief
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grounded entirely on active announcements saved in your database
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

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Grounding guarantee notice */}
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60 flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong>Strict Hallucination Prevention:</strong> This summary is generated from actual campus announcements. Dates, venues, and deadlines match your saved database entries.
            </div>
          </div>

          {/* Generated Text */}
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Synthesizing current announcements with Gemini 3.8 Flash...
              </p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-sans text-sm bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
              {summary}
            </div>
          )}

          {generatedAt && !isLoading && (
            <div className="text-xs text-slate-400 font-mono text-right">
              Generated: {new Date(generatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={onRefreshSummary}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Summary</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Brief'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
