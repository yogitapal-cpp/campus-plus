import React from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  BookOpen, 
  Bell, 
  Calendar, 
  FileText, 
  Bookmark, 
  Plus, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  X,
  User as UserIcon,
  GraduationCap
} from 'lucide-react';
import { PortalTab } from './Header';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  onOpenParser: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  unreadCount: number;
  pendingTasksCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenParser,
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode,
  unreadCount,
  pendingTasksCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const studentName = user?.name || 'Yogita';
  const studentEmail = user?.email || 'yogita@campus.edu';
  const studentDept = user?.department || 'Computer Science & Engineering';

  const navItems: { id: PortalTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    {
      id: 'dashboard',
      label: 'Portal Home',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'tasks',
      label: 'Assigned Work',
      icon: <BookOpen className="w-4 h-4" />,
      badge: pendingTasksCount,
      badgeColor: 'bg-[#D99AB7] text-[#30243D]',
    },
    {
      id: 'feed',
      label: 'Notice Board',
      icon: <Bell className="w-4 h-4" />,
      badge: unreadCount,
      badgeColor: 'bg-[#8FA8D8] text-[#30243D]',
    },
    {
      id: 'calendar',
      label: 'Schedule & Dates',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'summary',
      label: 'AI Campus Brief',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'bookmarks',
      label: 'Saved Notices',
      icon: <Bookmark className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-[#30243D]/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container: Deep Plum #30243D */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#30243D] text-[#F3EAF2] flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-[#48365c] shadow-2xl lg:shadow-none lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-5 flex flex-col gap-4">
          
          {/* Logo & Mobile Close */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#59416D] flex items-center justify-center text-white shadow-md border border-[#C99ACB]/30">
                <Sparkles className="w-4 h-4 text-[#D99AB7]" />
              </div>
              <div>
                <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>Campus Pulse</span>
                </div>
                <div className="text-[10px] text-[#C99ACB] font-medium tracking-wide uppercase">
                  Student Portal
                </div>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#C99ACB] hover:text-white hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Profile Card (Yogita) */}
          <div className="p-3 rounded-2xl bg-[#3d2f4d] border border-[#C99ACB]/20 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#59416D] to-[#D99AB7] text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
              {studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-xs text-white truncate">
                  {studentName}
                </span>
                <span className="text-[9px] font-bold text-[#D99AB7] bg-[#59416D]/80 px-1.5 py-0.2 rounded-md">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-[#C99ACB] truncate mt-0.5">
                {studentDept}
              </p>
              <div className="flex items-center gap-1 text-[9px] text-[#8FA8D8] font-mono mt-0.5">
                <span>3rd Year</span>
                <span>·</span>
                <span>CSE-084</span>
              </div>
            </div>
          </div>

          {/* "+ Parse Notice" Main CTA Button */}
          <button
            onClick={() => {
              onOpenParser();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#59416D] hover:bg-[#483359] active:bg-[#3d2d4c] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm border border-[#C99ACB]/30 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4 text-[#D99AB7]" />
            <span>+ Parse New Notice</span>
          </button>
        </div>

        {/* Middle: Navigation Links */}
        <div className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-[#C99ACB]/70 uppercase">
            Navigation
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (isOpenMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#59416D] text-white shadow-xs border-l-3 border-[#D99AB7]'
                    : 'text-[#F3EAF2]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#D99AB7]' : 'text-[#C99ACB]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      item.badgeColor || 'bg-[#59416D] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & Footer */}
        <div className="p-3 border-t border-[#48365c] space-y-1">
          <button
            onClick={() => {
              onOpenSettings();
              if (isOpenMobile) onCloseMobile();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#F3EAF2]/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4 text-[#C99ACB]" />
            <span>Settings & Supabase</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[#F3EAF2]/80 hover:text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-[#D99AB7]" />
              ) : (
                <Moon className="w-4 h-4 text-[#8FA8D8]" />
              )}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] font-mono text-[#C99ACB]">
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          </button>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#D99AB7] hover:text-white hover:bg-[#D99AB7]/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <div className="pt-2 px-3 text-[10px] text-[#C99ACB]/50 font-mono flex items-center justify-between">
            <span>PromptWars 2026</span>
            <span>v1.2</span>
          </div>
        </div>

      </aside>
    </>
  );
};
