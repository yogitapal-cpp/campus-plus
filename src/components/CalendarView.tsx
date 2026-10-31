import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Download, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Bell,
  CheckCircle2
} from 'lucide-react';
import { Announcement, EventClash } from '../types';
import { formatDisplayDate, getRelativeDeadline } from '../utils/dateUtils';
import { exportToICS, exportAllToICS } from '../utils/calendarExport';

interface CalendarViewProps {
  announcements: Announcement[];
  onOpenDetails: (announcement: Announcement) => void;
  onOpenActionPlanner: (announcement: Announcement, e: React.MouseEvent) => void;
  clashesMap: Record<string, EventClash[]>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  announcements,
  onOpenDetails,
  onOpenActionPlanner,
  clashesMap,
}) => {
  const [viewMode, setViewMode] = useState<'agenda' | 'month'>('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reminderState, setReminderState] = useState<'prompt' | 'enabled' | 'denied'>('prompt');

  // Filter events that have confirmed dates
  const eventsWithDates = announcements
    .filter((a) => a.date)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // Group events by date string
  const groupedByDate: Record<string, Announcement[]> = {};
  for (const item of eventsWithDates) {
    if (!item.date) continue;
    if (!groupedByDate[item.date]) {
      groupedByDate[item.date] = [];
    }
    groupedByDate[item.date].push(item);
  }

  const handleRequestReminders = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setReminderState('enabled');
        new Notification('Campus Pulse Reminders Enabled', {
          body: 'You will receive reminders before upcoming college deadlines and exams.',
          icon: '/favicon.ico',
        });
      } else {
        setReminderState('denied');
      }
    } catch (err) {
      console.error('Notification error:', err);
      setReminderState('denied');
    }
  };

  // Calendar Month Matrix Generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Calendar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-purple-950 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-pink-500" />
            <span>Campus Schedule & Timetable 📅</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-900/70 dark:text-purple-300 font-medium mt-1">
            View academic events, practical dates, exams, and sync directly to Google or Apple Calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Switch Agenda vs Month */}
          <div className="flex items-center p-1 bg-purple-50/80 border border-purple-100 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-purple-800/60 hover:text-purple-950'
              }`}
            >
              Agenda View
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-purple-800/60 hover:text-purple-950'
              }`}
            >
              Monthly Grid
            </button>
          </div>

          {/* Export All .ICS */}
          <button
            onClick={() => exportAllToICS(announcements)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md shadow-pink-400/20 transition-all"
            title="Download .ics file for calendar sync"
          >
            <Download className="w-4 h-4" />
            <span>Export Calendar (.ics)</span>
          </button>
        </div>
      </div>

      {/* Browser Notification Banner */}
      <div className="bg-gradient-to-r from-purple-50/80 to-pink-50/60 border border-purple-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl text-white shrink-0 shadow-xs">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-purple-950 dark:text-white flex items-center gap-1.5">
              <span>Smart Deadline & Clash Alerts</span>
              <span>🔔</span>
            </div>
            <p className="text-xs text-purple-900/70 dark:text-purple-300 font-medium">
              {reminderState === 'enabled' 
                ? 'Browser notifications are active. You will be alerted before critical campus deadlines.'
                : 'Enable browser notifications to receive advance alerts 24 hours before deadlines and conflicting events.'}
            </p>
          </div>
        </div>

        {reminderState !== 'enabled' && (
          <button
            onClick={handleRequestReminders}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-purple-900 font-bold text-xs rounded-2xl border border-purple-200 hover:bg-purple-50 shadow-2xs shrink-0 self-start sm:self-auto transition-all"
          >
            <span>Turn On Alerts ✨</span>
          </button>
        )}
      </div>

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="space-y-6">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-2">
              <CalendarIcon className="w-10 h-10 mx-auto text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No events currently on your schedule
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the AI Announcement Parser to add notices with dates and venues to your schedule.
              </p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([dateStr, items]) => {
              const dateObj = new Date(dateStr + 'T00:00:00');
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const hasMultiple = items.length > 1;

              return (
                <div key={dateStr} className="space-y-3">
                  
                  {/* Date Header */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full font-mono ${
                      isToday 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs' 
                        : 'bg-purple-100 text-purple-900'
                    }`}>
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    {hasMultiple && (
                      <span className="text-xs text-amber-700 font-bold flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{items.length} events scheduled</span>
                      </span>
                    )}
                  </div>

                  {/* Events on this date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => {
                      const itemClashes = clashesMap[item.id] || [];
                      return (
                        <div
                          key={item.id}
                          onClick={() => onOpenDetails(item)}
                          className="bg-white/95 rounded-3xl p-4 sm:p-5 border border-purple-100 hover:border-pink-300 transition-all cursor-pointer shadow-[0_4px_20px_rgb(168,85,247,0.05)] hover:shadow-[0_8px_30px_rgb(244,114,182,0.12)] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-purple-900/70 mb-2">
                              <span className="font-extrabold text-purple-950 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                                {item.category}
                              </span>
                              <span className="font-mono text-purple-900 font-bold">
                                {item.startTime ? `${item.startTime} - ${item.endTime || 'End'}` : 'All Day'}
                              </span>
                            </div>

                            <h3 className="font-bold text-sm sm:text-base text-purple-950 mb-1.5 leading-snug">
                              {item.title}
                            </h3>

                            <div className="flex items-center gap-1.5 text-xs text-purple-900/70 font-mono mb-2">
                              <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                              <span className="truncate">{item.venue || 'Venue TBD'}</span>
                            </div>

                            {itemClashes.length > 0 && (
                              <div className="text-xs bg-amber-50 text-amber-900 p-2.5 rounded-2xl border border-amber-200 flex items-start gap-1.5 mb-2 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                                <span className="leading-tight">{itemClashes[0].message}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-purple-100 text-xs">
                            <button
                              onClick={(e) => onOpenActionPlanner(item, e)}
                              className="text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 text-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                              <span>AI Action Plan ✨</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportToICS(item);
                              }}
                              className="p-1.5 text-purple-400 hover:text-purple-700 rounded-xl hover:bg-purple-50"
                              title="Download single .ics"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* MONTHLY GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {monthName}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-24 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = groupedByDate[dateKey] || [];
              const isToday = new Date().toISOString().split('T')[0] === dateKey;

              return (
                <div
                  key={dateKey}
                  className={`h-24 p-2 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs ${
                    isToday
                      ? 'border-pink-400 bg-pink-50/50 dark:bg-pink-950/30 shadow-xs'
                      : dayEvents.length > 0
                      ? 'border-purple-200 bg-purple-50/30 hover:border-purple-400'
                      : 'border-purple-100/70 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${isToday ? 'text-pink-600' : 'text-purple-950'}`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 1 && (
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" title="Multiple events scheduled" />
                    )}
                  </div>

                  {/* Day Events preview */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => onOpenDetails(ev)}
                        className="truncate text-[10px] px-1.5 py-0.5 rounded-lg bg-white border border-purple-100 text-purple-950 font-bold hover:text-pink-600 cursor-pointer shadow-2xs"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-pink-600 font-bold font-mono pl-1">
                        +{dayEvents.length - 2} more 🌸
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
