import React from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Bookmark, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  Edit2, 
  Check 
} from 'lucide-react';
import { Announcement, EventClash } from '../types';
import { formatDisplayDate, getRelativeDeadline } from '../utils/dateUtils';
import { exportToICS } from '../utils/calendarExport';

interface AnnouncementCardProps {
  announcement: Announcement;
  onOpenDetails: (announcement: Announcement) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onToggleRead: (id: string, e: React.MouseEvent) => void;
  onOpenActionPlanner: (announcement: Announcement, e: React.MouseEvent) => void;
  onEdit: (announcement: Announcement, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  clashes?: EventClash[];
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onOpenDetails,
  onToggleBookmark,
  onToggleRead,
  onOpenActionPlanner,
  onEdit,
  onDelete,
  clashes = [],
}) => {
  const deadlineInfo = getRelativeDeadline(announcement.deadline);
  const hasClashes = clashes.length > 0;

  // Verification status text & icon
  const getVerificationBadge = () => {
    switch (announcement.verificationStatus) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Needs Review</span>
          </span>
        );
      case 'missing_info':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
            <HelpCircle className="w-3 h-3 text-rose-500" />
            <span>Missing Info</span>
          </span>
        );
    }
  };

  const priorityColor = () => {
    switch (announcement.priority) {
      case 'urgent':
        return 'text-rose-600 font-semibold';
      case 'high':
        return 'text-amber-700 font-medium';
      case 'medium':
        return 'text-slate-600 font-medium';
      case 'low':
        return 'text-slate-400 font-normal';
    }
  };

  return (
    <div 
      onClick={() => onOpenDetails(announcement)}
      className={`group relative rounded-xl border transition-colors cursor-pointer shadow-2xs ${
        announcement.isRead 
          ? 'bg-white/80 border-slate-200/60 hover:border-slate-300' 
          : 'bg-white border-slate-200/90 hover:border-slate-400'
      }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top Meta Line: Unboxed text with subtle typographic separators */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-700">
              {announcement.category}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className={`capitalize text-[11px] ${priorityColor()}`}>
              {announcement.priority}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            {getVerificationBadge()}
          </div>

          {/* Quick Bookmark & Mark Read */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => onToggleRead(announcement.id, e)}
              title={announcement.isRead ? 'Mark as unread' : 'Mark as read'}
              className={`p-1 rounded-md transition-colors ${
                announcement.isRead 
                  ? 'text-slate-300 hover:text-slate-600' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onToggleBookmark(announcement.id, e)}
              title={announcement.isBookmarked ? 'Remove bookmark' : 'Bookmark announcement'}
              className={`p-1 rounded-md transition-colors ${
                announcement.isBookmarked 
                  ? 'text-amber-500 fill-amber-500 hover:text-amber-600' 
                  : 'text-slate-300 hover:text-slate-600'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${announcement.isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-2 mb-1.5 leading-snug">
          {announcement.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-3.5 leading-relaxed">
          {announcement.description}
        </p>

        {/* Event Schedule & Venue Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 mb-3 font-mono tabular-nums border border-slate-200/50">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {formatDisplayDate(announcement.date)}
              {announcement.startTime && ` · ${announcement.startTime}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {announcement.venue || 'Venue TBD'}
            </span>
          </div>
        </div>

        {/* Schedule Clash Warning Alert if applicable */}
        {hasClashes && (
          <div className="flex items-start gap-2 p-2 mb-3 text-xs bg-amber-50 text-amber-900 rounded-lg border border-amber-200/70">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span className="font-semibold">Schedule Conflict: </span>
              {clashes[0].message}
            </div>
          </div>
        )}

        {/* Missing Information callout if missing_info */}
        {announcement.missingInformation && announcement.missingInformation.length > 0 && (
          <div className="flex items-start gap-1.5 mb-3 text-xs text-rose-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Missing: {announcement.missingInformation.join(' · ')}</span>
          </div>
        )}

        {/* Card Footer: Deadline + Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          <div>
            {announcement.deadline ? (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Due:</span>
                <span className={`font-medium ${deadlineInfo.isUrgent ? 'text-rose-600 font-semibold' : 'text-slate-800'}`}>
                  {deadlineInfo.label}
                </span>
              </span>
            ) : (
              <span className="text-slate-400 font-mono text-[11px]">No deadline</span>
            )}
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => onOpenActionPlanner(announcement, e)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Generate AI step-by-step action plan"
            >
              <Sparkles className="w-3 h-3 text-slate-500" />
              <span>AI Plan</span>
            </button>

            {announcement.date && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  exportToICS(announcement);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                title="Download .ics Calendar Event"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => onEdit(announcement, e)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              title="Edit announcement"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => onDelete(announcement.id, e)}
              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
              title="Delete announcement"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
