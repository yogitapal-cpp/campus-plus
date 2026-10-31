/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header, PortalTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AssignedWorkView } from './components/AssignedWorkView';
import { FeedView } from './components/FeedView';
import { CalendarView } from './components/CalendarView';
import { ParserModal } from './components/ParserModal';
import { WeeklySummaryModal } from './components/WeeklySummaryModal';
import { ActionPlannerModal } from './components/ActionPlannerModal';
import { AnnouncementDetailsModal } from './components/AnnouncementDetailsModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthPage } from './components/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Announcement, UserPreferences, EventClash, StudentTask } from './types';
import { detectEventClashes } from './utils/clashDetector';
import { RefreshCw, AlertCircle } from 'lucide-react';

function CampusPulseApp() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<PortalTab>('dashboard');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    interests: ['Hackathons', 'Workshops', 'Exams', 'Placements'],
    department: 'Computer Science & Engineering',
    yearOfStudy: '3rd Year',
    enableClashAlerts: true,
    enableDeadlineReminders: true,
    notificationsEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals state
  const [isParserOpen, setIsParserOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [detailsAnnouncement, setDetailsAnnouncement] = useState<Announcement | null>(null);
  const [actionPlannerAnnouncement, setActionPlannerAnnouncement] = useState<Announcement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Weekly Summary state
  const [weeklySummary, setWeeklySummary] = useState<string>('');
  const [weeklySummaryDate, setWeeklySummaryDate] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Sync dark class on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [annRes, taskRes, prefRes] = await Promise.all([
        fetch('/api/announcements'),
        fetch('/api/tasks'),
        fetch('/api/user-preferences'),
      ]);

      if (!annRes.ok) throw new Error('Could not fetch announcements from server');
      const annData = await annRes.json();
      setAnnouncements(annData.announcements || []);

      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData.tasks || []);
      }

      if (prefRes.ok) {
        const prefData = await prefRes.json();
        if (prefData.preferences) setPreferences(prefData.preferences);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setFetchError(err.message || 'Failed to connect to backend server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Pre-calculate clashes map for all announcements if clash alerts enabled
  const clashesMap = useMemo(() => {
    if (!preferences.enableClashAlerts) return {};

    const map: Record<string, EventClash[]> = {};
    for (const item of announcements) {
      if (!item.date) continue;
      const clashes = detectEventClashes(
        {
          id: item.id,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          title: item.title,
        },
        announcements
      );
      if (clashes.length > 0) {
        map[item.id] = clashes;
      }
    }
    return map;
  }, [announcements, preferences.enableClashAlerts]);

  // TASK HANDLERS
  const handleToggleTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleAddTask = async (taskData: Partial<StudentTask>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add task');
    setTasks((prev) => [data.task, ...prev]);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // ANNOUNCEMENT HANDLERS
  const handleSaveAnnouncement = async (data: Partial<Announcement>) => {
    if (data.id) {
      // Update
      const res = await fetch(`/api/announcements/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to update announcement');
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === data.id ? resJson.announcement : a))
      );
    } else {
      // Create
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to create announcement');
      
      const newAnn = resJson.announcement;
      setAnnouncements((prev) => [newAnn, ...prev]);

      // If announcement has a required action or deadline, auto-add as a student task
      if (newAnn.requiredAction || newAnn.deadline) {
        handleAddTask({
          title: newAnn.requiredAction || newAnn.title,
          subject: newAnn.category || 'College Circular',
          dueDate: newAnn.deadline ? newAnn.deadline.split('T')[0] : (newAnn.date || new Date().toISOString().split('T')[0]),
          priority: newAnn.priority,
          status: 'pending',
          sourceAnnouncementId: newAnn.id,
          sourceAnnouncementTitle: newAnn.title,
          notes: `Auto-extracted from circular: "${newAnn.title}". Venue: ${newAnn.venue || 'TBD'}`,
        }).catch((e) => console.error('Auto task creation:', e));
      }
    }
  };

  const handleToggleBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/announcements/${id}/bookmark`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isBookmarked: data.isBookmarked } : a))
        );
        if (detailsAnnouncement?.id === id) {
          setDetailsAnnouncement((prev) => prev ? { ...prev, isBookmarked: data.isBookmarked } : null);
        }
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleToggleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/announcements/${id}/read`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isRead: data.isRead } : a))
        );
      }
    } catch (err) {
      console.error('Failed to toggle read:', err);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const handleSavePreferences = async (newPrefs: UserPreferences) => {
    const res = await fetch('/api/user-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrefs),
    });
    if (!res.ok) throw new Error('Failed to save preferences');
    setPreferences(newPrefs);
  };

  const handleResetSampleData = async () => {
    const res = await fetch('/api/reset-sample-data', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setAnnouncements(data.announcements);
      if (data.tasks) setTasks(data.tasks);
    }
  };

  const handleFetchWeeklySummary = async (forceRefresh = false) => {
    setIsSummaryLoading(true);
    setIsSummaryOpen(true);
    try {
      const res = await fetch('/api/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: forceRefresh }),
      });
      const data = await res.json();
      if (data.success) {
        setWeeklySummary(data.summary);
        setWeeklySummaryDate(data.generatedAt);
      } else {
        setWeeklySummary(`Unable to generate summary: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      setWeeklySummary(`Error fetching weekly brief: ${err.message}`);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Auth Gate: If user is not signed in, show the full login/create account page first!
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-purple-50/50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const unreadCount = announcements.filter((a) => !a.isRead).length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#F3EAF2] dark:bg-[#1C1625] text-[#30243D] dark:text-[#F3EAF2] flex flex-col antialiased selection:bg-[#D99AB7]/30 selection:text-[#30243D] transition-colors duration-150">
      
      {/* 1. Header Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'summary') {
            handleFetchWeeklySummary(false);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenParser={() => setIsParserOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        unreadCount={unreadCount}
        pendingTasksCount={pendingTasksCount}
      />

      {/* 2. Main Portal Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-[#59416D] animate-spin mx-auto" />
            <p className="text-sm font-medium text-[#30243D]/70">
              Loading your student records & assigned work...
            </p>
          </div>
        ) : fetchError ? (
          <div className="max-w-lg mx-auto my-12 p-6 bg-rose-50 dark:bg-rose-950/40 rounded-3xl border border-rose-200 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-rose-900 dark:text-rose-200">
              Connection Notice
            </h2>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              {fetchError}
            </p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* PORTAL OVERVIEW TAB */}
            {currentTab === 'dashboard' && (
              <DashboardView
                announcements={announcements}
                tasks={tasks}
                onToggleTask={handleToggleTask}
                preferences={preferences}
                onOpenParser={() => setIsParserOpen(true)}
                onOpenSummary={() => handleFetchWeeklySummary(false)}
                onOpenCalendar={() => setCurrentTab('calendar')}
                onOpenTasks={() => setCurrentTab('tasks')}
                onOpenFeed={() => setCurrentTab('feed')}
                onOpenDetails={(item) => setDetailsAnnouncement(item)}
                onToggleBookmark={handleToggleBookmark}
                onToggleRead={handleToggleRead}
                onOpenActionPlanner={(item) => setActionPlannerAnnouncement(item)}
                onEdit={(item) => {
                  setEditingAnnouncement(item);
                  setIsParserOpen(true);
                }}
                onDelete={handleDelete}
                clashesMap={clashesMap}
              />
            )}

            {/* ASSIGNED WORK & TASKS TAB */}
            {currentTab === 'tasks' && (
              <AssignedWorkView
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onOpenParser={() => setIsParserOpen(true)}
              />
            )}

            {/* NOTICE BOARD TAB */}
            {currentTab === 'feed' && (
              <FeedView
                announcements={announcements}
                onOpenParser={() => setIsParserOpen(true)}
                onOpenDetails={(item) => setDetailsAnnouncement(item)}
                onToggleBookmark={handleToggleBookmark}
                onToggleRead={handleToggleRead}
                onOpenActionPlanner={(item) => setActionPlannerAnnouncement(item)}
                onEdit={(item) => {
                  setEditingAnnouncement(item);
                  setIsParserOpen(true);
                }}
                onDelete={handleDelete}
                clashesMap={clashesMap}
                showOnlyBookmarks={false}
              />
            )}

            {/* SAVED NOTICES TAB */}
            {currentTab === 'bookmarks' && (
              <FeedView
                announcements={announcements}
                onOpenParser={() => setIsParserOpen(true)}
                onOpenDetails={(item) => setDetailsAnnouncement(item)}
                onToggleBookmark={handleToggleBookmark}
                onToggleRead={handleToggleRead}
                onOpenActionPlanner={(item) => setActionPlannerAnnouncement(item)}
                onEdit={(item) => {
                  setEditingAnnouncement(item);
                  setIsParserOpen(true);
                }}
                onDelete={handleDelete}
                clashesMap={clashesMap}
                showOnlyBookmarks={true}
              />
            )}

            {/* SCHEDULE & TIMETABLE TAB */}
            {currentTab === 'calendar' && (
              <CalendarView
                announcements={announcements}
                onOpenDetails={(item) => setDetailsAnnouncement(item)}
                onOpenActionPlanner={(item) => setActionPlannerAnnouncement(item)}
                clashesMap={clashesMap}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Footer Bar */}
      <footer className="border-t border-[#E3D5E2] dark:border-zinc-800 bg-[#FAF4F9]/80 dark:bg-[#1C1625]/80 backdrop-blur-xs py-6 text-xs text-[#30243D]/70 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#30243D] dark:text-[#F3EAF2]">Campus Pulse</span>
            <span aria-hidden="true" className="text-[#C99ACB]">·</span>
            <span>AI Campus Companion & Student Portal</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-[#30243D]/70 dark:text-zinc-400">
            <span>Gemini 3.8 Flash</span>
            <span aria-hidden="true" className="text-[#C99ACB]">·</span>
            <span>Supabase Ready</span>
          </div>
        </div>
      </footer>

      {/* 4. Modals */}
      
      {/* AI Announcement Parser Modal */}
      <ParserModal
        isOpen={isParserOpen}
        onClose={() => {
          setIsParserOpen(false);
          setEditingAnnouncement(null);
        }}
        onSaveAnnouncement={handleSaveAnnouncement}
        existingAnnouncements={announcements}
      />

      {/* AI Weekly Campus Brief Modal */}
      <WeeklySummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={weeklySummary}
        generatedAt={weeklySummaryDate}
        onRefreshSummary={() => handleFetchWeeklySummary(true)}
        isLoading={isSummaryLoading}
      />

      {/* AI Action Planner Modal */}
      <ActionPlannerModal
        isOpen={Boolean(actionPlannerAnnouncement)}
        onClose={() => setActionPlannerAnnouncement(null)}
        announcement={actionPlannerAnnouncement}
      />

      {/* Announcement Details Modal */}
      <AnnouncementDetailsModal
        isOpen={Boolean(detailsAnnouncement)}
        onClose={() => setDetailsAnnouncement(null)}
        announcement={detailsAnnouncement}
        onToggleBookmark={handleToggleBookmark}
        onOpenActionPlanner={(item, e) => {
          setDetailsAnnouncement(null);
          setActionPlannerAnnouncement(item);
        }}
        onEdit={(item) => {
          setDetailsAnnouncement(null);
          setEditingAnnouncement(item);
          setIsParserOpen(true);
        }}
        onDelete={(id) => handleDelete(id)}
        clashes={detailsAnnouncement ? clashesMap[detailsAnnouncement.id] : []}
      />

      {/* Settings & Supabase Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        onResetSampleData={handleResetSampleData}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CampusPulseApp />
    </AuthProvider>
  );
}
