import React from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  FileText, 
  Download, 
  Square,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Check
} from 'lucide-react';
import { Announcement, UserPreferences, EventClash, StudentTask } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDisplayDate, getRelativeDeadline } from '../utils/dateUtils';
import { exportAllToICS } from '../utils/calendarExport';

interface DashboardViewProps {
  announcements: Announcement[];
  tasks: StudentTask[];
  onToggleTask: (id: string) => Promise<void>;
  preferences: UserPreferences;
  onOpenParser: () => void;
  onOpenSummary: () => void;
  onOpenCalendar: () => void;
  onOpenTasks: () => void;
  onOpenFeed: () => void;
  onOpenDetails: (announcement: Announcement) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onToggleRead: (id: string, e: React.MouseEvent) => void;
  onOpenActionPlanner: (announcement: Announcement, e: React.MouseEvent) => void;
  onEdit: (announcement: Announcement, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  clashesMap: Record<string, EventClash[]>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  announcements,
  tasks,
  onToggleTask,
  preferences,
  onOpenParser,
  onOpenSummary,
  onOpenCalendar,
  onOpenTasks,
  onOpenFeed,
  onOpenDetails,
  onToggleBookmark,
  onToggleRead,
  onOpenActionPlanner,
  onEdit,
  onDelete,
  clashesMap,
}) => {
  const { user } = useAuth();

  // Tasks statistics
  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  // Urgent notices (urgent or high priority)
  const urgentNotices = announcements.filter(
    (a) => a.priority === 'urgent' || a.priority === 'high'
  ).slice(0, 3);

  // Upcoming events with confirmed dates
  const upcomingEvents = announcements
    .filter((a) => a.date)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 3);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Minimal Student Identity Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wide">
              <span>{todayStr}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Student Overview</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {user ? user.name : 'Student'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Your college announcements, assigned coursework, and scheduled dates are organized below.
            </p>

            {/* Student ID strip */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 font-mono flex-wrap">
              <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                {user?.rollNumber || '2026-CS-084'}
              </span>
              <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-sans">
                {user?.department || preferences.department}
              </span>
              <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-sans">
                {user?.yearOfStudy || preferences.yearOfStudy}
              </span>
            </div>
          </div>

          {/* Quick Actions - Clean Minimalist */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <button
              onClick={onOpenParser}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Parse New Notice</span>
            </button>

            <button
              onClick={onOpenTasks}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs border border-slate-200 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Assigned Work ({pendingTasks.length})</span>
            </button>

            <button
              onClick={() => exportAllToICS(announcements)}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 font-medium text-xs transition-colors"
              title="Export all events to Google or Apple Calendar"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Calendar (.ics)</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Key Portal Metrics in Minimalist Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div 
          onClick={onOpenTasks}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Pending Work</span>
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {pendingTasks.length}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5 font-medium">Require submission</div>
        </div>

        <div 
          onClick={onOpenCalendar}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Upcoming Events</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {upcomingEvents.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Scheduled on campus</div>
        </div>

        <div 
          onClick={onOpenFeed}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>College Notices</span>
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {announcements.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Circulars & updates</div>
        </div>

        <div 
          onClick={onOpenTasks}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Completed Work</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {completedTasks.length}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">Cleared</div>
        </div>
      </div>

      {/* 3. ASSIGNED WORK SPOTLIGHT (Clean Checklist) */}
      <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Assigned Work & Deadlines
              </h2>
              <p className="text-xs text-slate-500">
                Coursework submissions, lab experiments, exam fees, and circular action items
              </p>
            </div>
          </div>

          <button
            onClick={onOpenTasks}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
          >
            <span>View All Tasks</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Task list preview */}
        {pendingTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-500">
            All assigned tasks are up to date. Click "+ Add Task" in the Assigned Work tab to add new coursework.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.slice(0, 4).map((task) => {
              const deadline = getRelativeDeadline(task.dueDate);
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-colors"
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-slate-700 focus:outline-none"
                    title="Mark task as completed"
                  >
                    <Square className="w-4 h-4 text-slate-300 hover:text-slate-600" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs mb-0.5 flex-wrap">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {task.subject}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className={`text-[11px] font-mono ${
                        deadline.isUrgent ? 'text-rose-600 font-semibold' : 'text-slate-500'
                      }`}>
                        Due: {formatDisplayDate(task.dueDate)} ({deadline.label})
                      </span>
                    </div>

                    <div className="text-sm font-medium text-slate-900 leading-snug">
                      {task.title}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Two-Column Split: Upcoming Schedule & Urgent Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Campus Schedule */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Campus Schedule</span>
            </h2>
            <button
              onClick={onOpenCalendar}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
            >
              <span>Full Schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <div 
                key={event.id}
                onClick={() => onOpenDetails(event)}
                className="p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {event.category}
                  </span>
                  <span className="font-mono text-slate-600">
                    {formatDisplayDate(event.date)}
                    {event.startTime && ` · ${event.startTime}`}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {event.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Venue: {event.venue || 'TBD'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* High Priority Campus Circulars */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>High Priority Circulars</span>
            </h2>
            <button
              onClick={onOpenFeed}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
            >
              <span>All Notices</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {urgentNotices.map((notice) => {
              return (
                <div 
                  key={notice.id}
                  onClick={() => onOpenDetails(notice)}
                  className="p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {notice.category}
                    </span>
                    <span className="text-rose-600 font-medium uppercase text-[10px]">
                      {notice.priority}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                    {notice.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {notice.requiredAction || notice.description}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

    </div>
  );
};
