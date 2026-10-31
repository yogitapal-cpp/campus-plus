import { Announcement } from '../types';

/**
 * Returns formatted human-readable date, e.g. "Nov 8, 2026"
 */
export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Date TBD';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates days remaining from current date or relative label
 */
export function getRelativeDeadline(deadlineStr: string | null | undefined): {
  label: string;
  isUrgent: boolean;
  isOverdue: boolean;
} {
  if (!deadlineStr) {
    return { label: 'No deadline', isUrgent: false, isOverdue: false };
  }

  try {
    const deadline = new Date(deadlineStr);
    const now = new Date();
    // Normalize to date comparison
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Expired', isUrgent: false, isOverdue: true };
    }
    if (diffDays === 0) {
      return { label: 'Today', isUrgent: true, isOverdue: false };
    }
    if (diffDays === 1) {
      return { label: 'Tomorrow', isUrgent: true, isOverdue: false };
    }
    if (diffDays <= 3) {
      return { label: `In ${diffDays} days`, isUrgent: true, isOverdue: false };
    }
    if (diffDays <= 7) {
      return { label: `In ${diffDays} days`, isUrgent: false, isOverdue: false };
    }
    return { label: formatDisplayDate(deadlineStr.split('T')[0]), isUrgent: false, isOverdue: false };
  } catch {
    return { label: deadlineStr, isUrgent: false, isOverdue: false };
  }
}

/**
 * Sorts announcements by upcoming event date
 */
export function sortUpcomingEvents(announcements: Announcement[]): Announcement[] {
  return [...announcements]
    .filter((a) => a.date)
    .sort((a, b) => {
      const dateA = a.date || '9999-99-99';
      const dateB = b.date || '9999-99-99';
      return dateA.localeCompare(dateB);
    });
}
