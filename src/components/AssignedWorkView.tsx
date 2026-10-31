import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Clock, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  Sparkles,
  X,
  Search,
  Check
} from 'lucide-react';
import { StudentTask, Priority } from '../types';
import { formatDisplayDate, getRelativeDeadline } from '../utils/dateUtils';

interface AssignedWorkViewProps {
  tasks: StudentTask[];
  onToggleTask: (id: string) => Promise<void>;
  onAddTask: (task: Partial<StudentTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onOpenParser: () => void;
  onViewSourceNotice?: (announcementId: string) => void;
}

export const AssignedWorkView: React.FC<AssignedWorkViewProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenParser,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('11:59 PM');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute stats
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Unique subjects for filter
  const subjects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set);
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterStatus === 'pending' && task.status === 'completed') return false;
      if (filterStatus === 'completed' && task.status !== 'completed') return false;
      if (selectedSubject !== 'all' && task.subject !== selectedSubject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchSub = task.subject.toLowerCase().includes(q);
        const matchNotes = task.notes ? task.notes.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchSub && !matchNotes) return false;
      }
      return true;
    }).sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
    });
  }, [tasks, filterStatus, selectedSubject, searchQuery]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter assignment or task title.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: newTitle.trim(),
        subject: newSubject.trim() || 'General Coursework',
        dueDate: newDueDate || new Date().toISOString().split('T')[0],
        dueTime: newDueTime || undefined,
        priority: newPriority,
        status: 'pending',
        notes: newNotes.trim() || undefined,
      });

      // Reset form
      setNewTitle('');
      setNewSubject('');
      setNewDueDate('');
      setNewNotes('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(`Error creating task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded">Urgent</span>;
      case 'high':
        return <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">High</span>;
      case 'medium':
        return <span className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded">Medium</span>;
      case 'low':
        return <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded">Low</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header & Summary Banner with Clean, Minimal Design */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wide mb-1">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Assigned Work & Coursework</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Assigned Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              Track coursework, laboratory submissions, exam dues, and tasks extracted from circulars.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Task</span>
            </button>

            <button
              onClick={onOpenParser}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-medium text-xs sm:text-sm transition-colors border border-slate-200"
              title="Parse notice and extract action items"
            >
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span>Extract from Notice</span>
            </button>
          </div>
        </div>

        {/* Work Progress KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">Total Work</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {totalCount}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">Pending</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {pendingCount}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">Completed</div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
              {completedCount}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">Completion Rate</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {completionPercentage}%
            </div>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{completedCount} of {totalCount} completed</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-slate-900 h-full transition-all duration-300 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar in Clean Minimalist Style */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Status Segmented Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-medium w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Work ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
                filterStatus === 'pending'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition-all ${
                filterStatus === 'completed'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-900 focus:bg-white outline-none text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Subject pills filter */}
        {subjects.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none text-xs">
            <span className="text-slate-400 shrink-0 font-medium text-[11px]">Subject:</span>
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedSubject === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Courses
            </button>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedSubject === sub
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {filterStatus === 'pending'
              ? 'No pending tasks'
              : 'No work items found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {filterStatus === 'pending'
              ? 'You have cleared all pending submissions.'
              : 'Add your coursework assignments, project deadlines, or extract them directly from college WhatsApp circulars.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs"
            >
              + Create New Task
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const deadline = getRelativeDeadline(task.dueDate);

            return (
              <div
                key={task.id}
                className={`group bg-white rounded-xl border p-4 transition-colors flex items-start gap-3.5 shadow-2xs ${
                  isCompleted 
                    ? 'border-slate-200/60 bg-slate-50/40 text-slate-400' 
                    : deadline.isUrgent 
                    ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300' 
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Interactive Checkbox */}
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                  title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-slate-600 transition-colors bg-white" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs mb-1">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {task.subject}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    {getPriorityBadge(task.priority)}

                    {task.sourceAnnouncementTitle && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>From notice</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className={`text-sm font-semibold text-slate-900 leading-snug ${
                    isCompleted ? 'line-through text-slate-400' : ''
                  }`}>
                    {task.title}
                  </h3>

                  {/* Notes / Description */}
                  {task.notes && (
                    <p className={`text-xs mt-1 leading-relaxed ${
                      isCompleted ? 'line-through text-slate-400' : 'text-slate-600'
                    }`}>
                      {task.notes}
                    </p>
                  )}

                  {/* Footer Logistics: Due date & Countdown */}
                  <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs font-mono text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Due: {formatDisplayDate(task.dueDate)}</span>
                      {task.dueTime && <span>({task.dueTime})</span>}
                    </div>

                    {!isCompleted && (
                      <span className={`font-medium ${
                        deadline.isUrgent ? 'text-rose-600 font-semibold' : 'text-slate-700'
                      }`}>
                        {deadline.label}
                      </span>
                    )}

                    {isCompleted && task.completedAt && (
                      <span className="text-emerald-700 font-medium">
                        Completed {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors self-center sm:self-start opacity-0 group-hover:opacity-100"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Modal: Add New Assignment / Task */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Add New Task
                  </h2>
                  <p className="text-xs text-slate-500">
                    Record coursework, submissions, or deadlines
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Submit Machine Learning Lab Experiment 4"
                  className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject / Cell
                  </label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Operating Systems / T&P Cell"
                    className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Due Time (optional)
                  </label>
                  <input
                    type="text"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    placeholder="e.g. 05:00 PM or 11:59 PM"
                    className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes / Details
                </label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Submit on Google Classroom, attach PDF report"
                  className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Task'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
