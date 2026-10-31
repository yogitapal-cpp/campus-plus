import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Bell, 
  Settings, 
  Sun, 
  Moon, 
  Plus, 
  Bookmark,
  FileText,
  User as UserIcon,
  LogOut,
  ChevronDown,
  BookOpen,
  LayoutDashboard,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type PortalTab = 'dashboard' | 'tasks' | 'feed' | 'calendar' | 'summary' | 'bookmarks';

interface HeaderProps {
  currentTab: PortalTab;
  onSelectTab: (tab: PortalTab) => void;
  onOpenParser: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  unreadCount: number;
  pendingTasksCount: number;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenParser,
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode,
  unreadCount,
  pendingTasksCount,
  onOpenMobileMenu,
}) => {
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getTabLabel = () => {
    switch (currentTab) {
      case 'dashboard': return 'Portal Home';
      case 'tasks': return 'Assigned Work & Deadlines';
      case 'feed': return 'Campus Notice Board';
      case 'calendar': return 'Academic Schedule';
      case 'summary': return 'AI Campus Brief';
      case 'bookmarks': return 'Saved Notices';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E3D5E2] bg-white/95 backdrop-blur-md transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Mobile Hamburger + Section Title */}
          <div className="flex items-center gap-3 shrink-0">
            {onOpenMobileMenu && (
              <button
                onClick={onOpenMobileMenu}
                aria-label="Open portal sidebar menu"
                className="lg:hidden p-2 rounded-xl text-[#30243D] hover:bg-[#F3EAF2] border border-[#E3D5E2] transition-colors"
              >
                <Menu className="w-5 h-5 text-[#59416D]" />
              </button>
            )}

            <button 
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none rounded-xl"
            >
              <div className="w-8 h-8 rounded-xl bg-[#59416D] text-white flex items-center justify-center shadow-xs group-hover:bg-[#483359] transition-colors">
                <Sparkles className="w-4 h-4 text-[#D99AB7]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-[#30243D] whitespace-nowrap">
                  Campus Pulse
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-[#59416D] bg-[#F3EAF2] border border-[#E3D5E2] px-2 py-0.5 rounded-md">
                  Portal
                </span>
              </div>
            </button>

            {/* Current Active Tab Breadcrumb for Desktop */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-[#59416D]/80 font-medium pl-3 border-l border-[#E3D5E2]">
              <span className="text-[#30243D] font-bold">{getTabLabel()}</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-[#59416D] text-white font-semibold shadow-xs'
                  : 'text-[#30243D]/75 hover:text-[#30243D] hover:bg-[#F3EAF2]'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${currentTab === 'dashboard' ? 'text-white' : 'text-[#59416D]/60'}`} />
              <span>Portal Home</span>
            </button>

            {/* Assigned Work & Tasks Tab */}
            <button
              onClick={() => onSelectTab('tasks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'tasks'
                  ? 'bg-[#59416D] text-white font-semibold shadow-xs'
                  : 'text-[#30243D]/75 hover:text-[#30243D] hover:bg-[#F3EAF2]'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${currentTab === 'tasks' ? 'text-white' : 'text-[#59416D]/60'}`} />
              <span>Assigned Work</span>
              {pendingTasksCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-[#D99AB7] text-white">
                  {pendingTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('feed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'feed'
                  ? 'bg-[#59416D] text-white font-semibold shadow-xs'
                  : 'text-[#30243D]/75 hover:text-[#30243D] hover:bg-[#F3EAF2]'
              }`}
            >
              <span>Notice Board</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-[#8FA8D8] text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('calendar')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'calendar'
                  ? 'bg-[#59416D] text-white font-semibold shadow-xs'
                  : 'text-[#30243D]/75 hover:text-[#30243D] hover:bg-[#F3EAF2]'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${currentTab === 'calendar' ? 'text-white' : 'text-[#59416D]/60'}`} />
              <span>Schedule</span>
            </button>

            <button
              onClick={() => onSelectTab('summary')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'summary'
                  ? 'bg-[#59416D] text-white font-semibold shadow-xs'
                  : 'text-[#30243D]/75 hover:text-[#30243D] hover:bg-[#F3EAF2]'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${currentTab === 'summary' ? 'text-white' : 'text-[#59416D]/60'}`} />
              <span>AI Brief</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleDarkMode}
              aria-label="Toggle theme"
              className="p-2 text-[#59416D] hover:text-[#30243D] rounded-xl hover:bg-[#F3EAF2] transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenSettings}
              aria-label="Preferences and Supabase settings"
              className="p-2 text-[#59416D] hover:text-[#30243D] rounded-xl hover:bg-[#F3EAF2] transition-colors"
              title="Portal Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Pill */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-[#F3EAF2] border border-[#E3D5E2] transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#59416D] text-white font-bold text-[11px] flex items-center justify-center shadow-2xs">
                    {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold text-[#30243D] truncate max-w-[110px]">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#59416D]/60" />
                </button>

                {/* Profile Menu Dropdown */}
                {isProfileMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#E3D5E2] py-2 z-50 animate-in fade-in"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-[#E3D5E2]">
                      <div className="font-bold text-xs text-[#30243D] truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-[#59416D]/80 truncate">
                        {user.email}
                      </div>
                      <div className="text-[10px] text-[#59416D] font-mono mt-0.5 truncate font-medium">
                        {user.department}
                      </div>
                    </div>

                    <div className="py-1 text-xs text-[#30243D]">
                      <button
                        onClick={onOpenSettings}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#F3EAF2] flex items-center gap-2 font-medium"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#59416D]" />
                        <span>Settings & Supabase</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-[#E3D5E2]">
                      <button
                        onClick={() => logout()}
                        className="w-full text-left px-3.5 py-2 text-xs text-[#D99AB7] hover:text-[#b86e92] hover:bg-[#F3EAF2] flex items-center gap-2 font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Parse Announcement CTA - Muted Purple High-Contrast */}
            <button
              onClick={onOpenParser}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#59416D] hover:bg-[#483359] active:bg-[#30243D] rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Parse Notice</span>
              <span className="sm:hidden">Parse</span>
            </button>
          </div>

        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2.5 border-t border-[#E3D5E2] gap-1.5 scrollbar-none">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              currentTab === 'dashboard'
                ? 'bg-[#59416D] text-white shadow-xs'
                : 'text-[#30243D]/70 bg-white/80 border border-[#E3D5E2]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('tasks')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              currentTab === 'tasks'
                ? 'bg-[#59416D] text-white shadow-xs'
                : 'text-[#30243D]/70 bg-white/80 border border-[#E3D5E2]'
            }`}
          >
            Assigned Work ({pendingTasksCount})
          </button>
          <button
            onClick={() => onSelectTab('feed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              currentTab === 'feed'
                ? 'bg-[#59416D] text-white shadow-xs'
                : 'text-[#30243D]/70 bg-white/80 border border-[#E3D5E2]'
            }`}
          >
            Notice Board
          </button>
          <button
            onClick={() => onSelectTab('calendar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              currentTab === 'calendar'
                ? 'bg-[#59416D] text-white shadow-xs'
                : 'text-[#30243D]/70 bg-white/80 border border-[#E3D5E2]'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => onSelectTab('summary')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              currentTab === 'summary'
                ? 'bg-[#59416D] text-white shadow-xs'
                : 'text-[#30243D]/70 bg-white/80 border border-[#E3D5E2]'
            }`}
          >
            AI Brief
          </button>
        </div>

      </div>
    </header>
  );
};
