import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Calendar, 
  Tag, 
  ArrowUpDown, 
  Plus, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle,
  X
} from 'lucide-react';
import { Announcement, Category, Priority, VerificationStatus, EventClash } from '../types';
import { AnnouncementCard } from './AnnouncementCard';

interface FeedViewProps {
  announcements: Announcement[];
  onOpenParser: () => void;
  onOpenDetails: (announcement: Announcement) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onToggleRead: (id: string, e: React.MouseEvent) => void;
  onOpenActionPlanner: (announcement: Announcement, e: React.MouseEvent) => void;
  onEdit: (announcement: Announcement, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  clashesMap: Record<string, EventClash[]>;
  initialFilter?: string;
  showOnlyBookmarks?: boolean;
}

const CATEGORIES: Category[] = [
  'All',
  'Academics',
  'Workshops',
  'Hackathons',
  'Placements',
  'Cultural',
  'Sports',
  'Administrative',
  'Exams',
  'Other',
];

const NATURAL_QUERIES = [
  'Upcoming hackathons & contests',
  'Urgent deadlines',
  'Exam & hall ticket circulars',
  'Verified notices only',
];

export const FeedView: React.FC<FeedViewProps> = ({
  announcements,
  onOpenParser,
  onOpenDetails,
  onToggleBookmark,
  onToggleRead,
  onOpenActionPlanner,
  onEdit,
  onDelete,
  clashesMap,
  initialFilter,
  showOnlyBookmarks = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'upcoming' | 'priority'>('newest');

  // Filter & Search Logic
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      // Bookmark filter
      if (showOnlyBookmarks && !item.isBookmarked) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && item.priority !== selectedPriority) {
        return false;
      }

      // Verification status filter
      if (selectedVerification !== 'all' && item.verificationStatus !== selectedVerification) {
        return false;
      }

      // Search Query filter (matches title, description, venue, required action, target audience)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();

        // Natural language query special cases
        if (query.includes('urgent') || query.includes('critical')) {
          if (item.priority !== 'urgent' && item.priority !== 'high') return false;
        } else if (query.includes('hackathon')) {
          if (item.category !== 'Hackathons' && !item.title.toLowerCase().includes('hackathon')) return false;
        } else if (query.includes('exam')) {
          if (item.category !== 'Exams' && !item.title.toLowerCase().includes('exam')) return false;
        } else if (query.includes('verified')) {
          if (item.verificationStatus !== 'verified') return false;
        } else {
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchDesc = item.description.toLowerCase().includes(query);
          const matchVenue = item.venue ? item.venue.toLowerCase().includes(query) : false;
          const matchAction = item.requiredAction ? item.requiredAction.toLowerCase().includes(query) : false;
          const matchCategory = item.category.toLowerCase().includes(query);
          if (!matchTitle && !matchDesc && !matchVenue && !matchAction && !matchCategory) {
            return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'upcoming') {
        const dateA = a.date || '9999-99-99';
        const dateB = b.date || '9999-99-99';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'priority') {
        const priorityOrder: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });
  }, [
    announcements, 
    showOnlyBookmarks, 
    selectedCategory, 
    selectedPriority, 
    selectedVerification, 
    searchQuery, 
    sortBy
  ]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-purple-950 dark:text-white flex items-center gap-2">
            <span>{showOnlyBookmarks ? 'Saved Announcements 🌸' : 'Campus Announcements 📌'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-900/70 dark:text-purple-300 font-medium mt-1">
            {showOnlyBookmarks 
              ? 'Bookmarked notices and events you have pinned for quick reference.' 
              : 'Search, filter, and review parsed college circulars and student alerts.'}
          </p>
        </div>

        <button
          onClick={onOpenParser}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-400/25 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Parse New Notice ✨</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-purple-100 dark:border-slate-800 space-y-4 shadow-xs">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, venue, topic, or natural queries (e.g., 'hackathons next week')..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-purple-50/40 dark:bg-slate-950 border border-purple-200/80 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Natural Search Prompt Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-purple-700/70 dark:text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" /> Quick queries:
          </span>
          {NATURAL_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setSearchQuery(q)}
              className="px-2.5 py-1 rounded-lg bg-purple-50/70 hover:bg-purple-100 dark:bg-slate-800 text-purple-800 dark:text-slate-300 transition-colors border border-purple-100"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Verification:</span>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Details</option>
              <option value="needs_review">Needs Review</option>
              <option value="missing_info">Missing Info</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="newest">Newest Added</option>
              <option value="upcoming">Upcoming Event Date</option>
              <option value="priority">Priority Order</option>
            </select>
          </div>

        </div>

        {/* Category Filter Tabs (Interactive Filter Controls conforming to §1.A) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Announcements List / Grid */}
      {filteredAnnouncements.length === 0 ? (
        <div className="bg-white/95 rounded-3xl p-12 text-center border border-purple-100 space-y-3 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-xs">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-purple-950">
            No matching announcements found
          </h3>
          <p className="text-xs text-purple-900/60 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search query, clearing filters, or paste a new circular with the AI Parser.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedPriority('all');
                setSelectedVerification('all');
              }}
              className="px-4 py-2 text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnnouncements.map((item) => (
            <AnnouncementCard
              key={item.id}
              announcement={item}
              onOpenDetails={onOpenDetails}
              onToggleBookmark={onToggleBookmark}
              onToggleRead={onToggleRead}
              onOpenActionPlanner={onOpenActionPlanner}
              onEdit={onEdit}
              onDelete={onDelete}
              clashes={clashesMap[item.id] || []}
            />
          ))}
        </div>
      )}

    </div>
  );
};
