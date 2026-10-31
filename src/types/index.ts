export type Category = 
  | 'All'
  | 'Academics' 
  | 'Workshops' 
  | 'Hackathons' 
  | 'Placements' 
  | 'Cultural' 
  | 'Sports' 
  | 'Administrative' 
  | 'Exams' 
  | 'Other';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type VerificationStatus = 'verified' | 'needs_review' | 'missing_info';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: Category;
  date: string | null; // YYYY-MM-DD
  startTime: string | null; // e.g. "10:00 AM"
  endTime: string | null; // e.g. "01:00 PM"
  venue: string | null;
  deadline: string | null; // YYYY-MM-DD or datetime
  priority: Priority;
  requiredAction: string | null;
  targetAudience: string;
  missingInformation: string[];
  verificationStatus: VerificationStatus;
  confidenceNotes: string;
  sourceText?: string;
  sourceType?: 'whatsapp' | 'email' | 'circular' | 'manual';
  isBookmarked: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  interests: string[];
  department: string;
  yearOfStudy: string;
  enableClashAlerts: boolean;
  enableDeadlineReminders: boolean;
  notificationsEnabled: boolean;
}

export interface DuplicateMatch {
  announcement: Announcement;
  reason: string;
  similarityScore: number;
}

export interface ActionPlanStep {
  step: number;
  action: string;
  detail: string;
  estimatedTime: string;
}

export interface ActionPlan {
  steps: ActionPlanStep[];
  criticalWarning?: string;
}

export interface EventClash {
  existingEvent: Announcement;
  clashingField: 'time' | 'date';
  message: string;
}

export interface StudentTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  sourceAnnouncementId?: string;
  sourceAnnouncementTitle?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  rollNumber?: string;
  department: string;
  yearOfStudy: string;
  avatarUrl?: string;
  role?: string;
}

export type AuthMode = 'login' | 'signup' | 'forgot_password';


