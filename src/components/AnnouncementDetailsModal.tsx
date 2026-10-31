import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Sparkles, 
  Download, 
  Bookmark, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  FileText, 
  Trash2, 
  Edit2,
  Users
} from 'lucide-react';
import { Announcement, EventClash } from '../types';
import { formatDisplayDate, getRelativeDeadline } from '../utils/dateUtils';
import { exportToICS } from '../utils/calendarExport';

interface AnnouncementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onOpenActionPlanner: (announcement: Announcement, e: React.MouseEvent) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
  clashes?: EventClash[];
}

export const AnnouncementDetailsModal: React.FC<AnnouncementDetailsModalProps> = ({
  isOpen,
  onClose,
  announcement,
  onToggleBookmark,
  onOpenActionPlanner,
  onEdit,
  onDelete,
  clashes = [],
}) => {
  const [showRawSource, setShowRawSource] = useState(false);

  if (!isOpen || !announcement) return null;

  const deadline = getRelativeDeadline(announcement.deadline);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {announcement.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{announcement.priority} priority</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{new Date(announcement.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => onToggleBookmark(announcement.id, e)}
              className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${announcement.isBookmarked ? 'text-amber-500 fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {announcement.title}
            </h2>
          </div>

          {/* Schedule & Logistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-mono tabular-nums">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Event Date & Time</span>
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>{formatDisplayDate(announcement.date)}</span>
              </div>
              {announcement.startTime && (
                <div className="text-slate-500 dark:text-slate-400 pl-5">
                  {announcement.startTime} {announcement.endTime ? `- ${announcement.endTime}` : ''}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Venue / Location</span>
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate">{announcement.venue || 'No venue specified'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Registration Deadline</span>
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span>{deadline.label}</span>
              </div>
              {announcement.deadline && (
                <div className="text-slate-500 dark:text-slate-400 pl-5">
                  {announcement.deadline.split('T')[0]}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Target Audience</span>
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate">{announcement.targetAudience}</span>
              </div>
            </div>
          </div>

          {/* Schedule Clash Warning */}
          {clashes.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Schedule Conflict: </span>
                {clashes[0].message}
              </div>
            </div>
          )}

          {/* Required Action Callout */}
          {announcement.requiredAction && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl">
              <div className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide mb-1">
                Required Student Action
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {announcement.requiredAction}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Detailed Overview
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {announcement.description}
            </p>
          </div>

          {/* Missing Information note */}
          {announcement.missingInformation && announcement.missingInformation.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              <span className="font-semibold">Missing Details in Original Notice: </span>
              {announcement.missingInformation.join(' · ')}
            </div>
          )}

          {/* Raw Source Accordion */}
          {announcement.sourceText && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowRawSource(!showRawSource)}
                className="text-xs text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 font-medium flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showRawSource ? 'Hide original source notice' : 'View original source notice'}</span>
              </button>

              {showRawSource && (
                <pre className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-950 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-x-auto border border-slate-200 dark:border-slate-800">
                  {announcement.sourceText}
                </pre>
              )}
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(announcement);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this announcement?')) {
                  onDelete(announcement.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {announcement.date && (
              <button
                onClick={() => exportToICS(announcement)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .ics</span>
              </button>
            )}

            <button
              onClick={(e) => {
                onClose();
                onOpenActionPlanner(announcement, e);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Action Plan</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
