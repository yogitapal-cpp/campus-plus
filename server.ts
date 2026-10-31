import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directory exists for persistent local storage
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'campus_pulse_db.json');

// Types
export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: 'Academics' | 'Workshops' | 'Hackathons' | 'Placements' | 'Cultural' | 'Sports' | 'Administrative' | 'Exams' | 'Other';
  date: string | null; // YYYY-MM-DD
  startTime: string | null; // e.g. "10:00 AM"
  endTime: string | null; // e.g. "01:00 PM"
  venue: string | null;
  deadline: string | null; // YYYY-MM-DD or datetime
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requiredAction: string | null;
  targetAudience: string;
  missingInformation: string[];
  verificationStatus: 'verified' | 'needs_review' | 'missing_info';
  confidenceNotes: string;
  sourceText?: string;
  sourceType?: 'whatsapp' | 'email' | 'circular' | 'manual';
  isBookmarked: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface UserPreferences {
  interests: string[];
  department: string;
  yearOfStudy: string;
  enableClashAlerts: boolean;
  enableDeadlineReminders: boolean;
  notificationsEnabled: boolean;
}

interface DBStructure {
  announcements: Announcement[];
  tasks: StudentTask[];
  preferences: UserPreferences;
  weeklySummaryCache: {
    summary: string;
    generatedAt: string;
  } | null;
}

const INITIAL_TASKS: StudentTask[] = [
  {
    id: 'task-1',
    title: 'Download Mid-Term Exam Hall Ticket & Verify Subject Codes',
    subject: 'Examination Cell',
    dueDate: '2026-11-10',
    dueTime: '05:00 PM',
    priority: 'urgent',
    status: 'pending',
    sourceAnnouncementId: 'ann-2',
    sourceAnnouncementTitle: 'Mid-Term Examinations Timetable & Hall Ticket Release',
    notes: 'Must clear library & lab dues before generating digital admit card from the university ERP.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Submit OS Lab Assignment 3: CPU Scheduling Algorithms Simulation',
    subject: 'Operating Systems (CS304)',
    dueDate: '2026-11-06',
    dueTime: '11:59 PM',
    priority: 'high',
    status: 'pending',
    notes: 'Submit GitHub repo link and PDF report with Round Robin & Priority Scheduling test cases.',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Upload Updated Resume & Register on Campus Placement Portal',
    subject: 'Training & Placement Cell',
    dueDate: '2026-11-07',
    dueTime: '05:00 PM',
    priority: 'urgent',
    status: 'pending',
    sourceAnnouncementId: 'ann-4',
    sourceAnnouncementTitle: 'Google & Microsoft Campus Placement Drive Registration',
    notes: 'Strict PDF format only. Min CGPA 7.5 required for technical test shortlisting.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'task-4',
    title: 'Register Team for CSSS Hackathon 2026 (PromptWars & CodeSprint)',
    subject: 'Hackathons & Clubs',
    dueDate: '2026-11-04',
    dueTime: '11:59 PM',
    priority: 'medium',
    status: 'completed',
    sourceAnnouncementId: 'ann-1',
    sourceAnnouncementTitle: 'CSSS Annual Hackathon 2026: PromptWars & CodeSprint',
    notes: 'Team of 4 registered with project idea on Campus AI Assistant.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'task-5',
    title: 'Return Central Library Borrowed Books for Amnesty Week',
    subject: 'Central University Library',
    dueDate: '2026-11-12',
    dueTime: '08:00 PM',
    priority: 'low',
    status: 'pending',
    sourceAnnouncementId: 'ann-6',
    sourceAnnouncementTitle: 'Library Extended Hours & Overdue Book Amnesty Week',
    notes: 'Late return fines waived during mid-term preparation week.',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];


// Initial realistic campus data to give students an immediate interactive playground
const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'CSSS Annual Hackathon 2026: PromptWars & CodeSprint',
    description: 'Annual flagship 36-hour offline hackathon organized by Computer Science Student Society. Mentorship, project exhibits, and cash prizes worth $2,500.',
    category: 'Hackathons',
    date: '2026-11-08',
    startTime: '09:00 AM',
    endTime: '08:00 PM',
    venue: 'Turing Innovation Lab & Auditorium, 3rd Floor',
    deadline: '2026-11-04',
    priority: 'high',
    requiredAction: 'Register team of 2-4 members on the portal before deadline',
    targetAudience: 'All Undergraduate and Postgraduate Engineering Students',
    missingInformation: [],
    verificationStatus: 'verified',
    confidenceNotes: 'All primary event details, schedule, venue, and registration links verified.',
    sourceText: 'Hey everyone! CSSS is hosting the Annual Hackathon 2026: PromptWars & CodeSprint on Nov 8th from 9 AM in Turing Lab. Team size 2-4. Register before Nov 4th midnight!',
    sourceType: 'whatsapp',
    isBookmarked: true,
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ann-2',
    title: 'Mid-Term Examinations Timetable & Hall Ticket Release',
    description: 'Finalized schedule for Fall semester mid-term exams. Students must clear any pending lab dues to generate digital hall tickets.',
    category: 'Exams',
    date: '2026-11-15',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    venue: 'Examination Complex Hall A & B',
    deadline: '2026-11-10',
    priority: 'urgent',
    requiredAction: 'Download hall ticket and verify subject codes by Nov 10',
    targetAudience: 'Semester 3, 5, and 7 Students',
    missingInformation: [],
    verificationStatus: 'verified',
    confidenceNotes: 'Official circular from Controller of Examinations.',
    sourceText: 'URGENT CIRCULAR: Mid-Term exams commence Nov 15th at 10 AM in Exam Complex. Download hall tickets through the portal by Nov 10.',
    sourceType: 'circular',
    isBookmarked: true,
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ann-3',
    title: 'Cloud Computing & Generative AI Hands-on Workshop',
    description: 'An interactive 4-hour hands-on session on deploying serverless AI applications using Gemini API and modern cloud infrastructure.',
    category: 'Workshops',
    date: '2026-11-08',
    startTime: '02:00 PM',
    endTime: '06:00 PM',
    venue: 'Seminar Hall 2, Tech Block',
    deadline: '2026-11-06',
    priority: 'medium',
    requiredAction: 'Bring charged laptop with Node.js LTS installed',
    targetAudience: 'CSE, IT, and AI/DS branches',
    missingInformation: [],
    verificationStatus: 'verified',
    confidenceNotes: 'Note: Potential schedule clash with Hackathon day session on Nov 8.',
    sourceText: 'Hands-on Workshop on Cloud Computing & GenAI on Nov 8, 2PM to 6PM at Seminar Hall 2. Bring laptop. Registration open till Nov 6.',
    sourceType: 'email',
    isBookmarked: false,
    isRead: false,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'ann-4',
    title: 'Google & Microsoft Campus Placement Drive Registration',
    description: 'Initial screening registrations for 2027 graduating batch internships and full-time software engineering roles.',
    category: 'Placements',
    date: '2026-11-18',
    startTime: '09:30 AM',
    endTime: '05:00 PM',
    venue: 'Campus Training & Placement Cell, Block 1',
    deadline: '2026-11-07',
    priority: 'urgent',
    requiredAction: 'Upload updated resume and complete preliminary coding test link',
    targetAudience: 'Final Year & Pre-Final Year B.Tech / M.Tech / MCA (Min CGPA 7.5)',
    missingInformation: [],
    verificationStatus: 'verified',
    confidenceNotes: 'Mandatory registration with strict resume formatting rules.',
    sourceText: 'T&P Notice: Google & Microsoft campus drive registration window closes Nov 7 at 5 PM. Drive scheduled on Nov 18.',
    sourceType: 'circular',
    isBookmarked: true,
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'ann-5',
    title: 'Inter-Departmental Football Championship Tryouts',
    description: 'Annual sports tryouts for the university football team selection.',
    category: 'Sports',
    date: '2026-11-12',
    startTime: '04:30 PM',
    endTime: null,
    venue: 'University Main Sports Stadium',
    deadline: null,
    priority: 'low',
    requiredAction: 'Report in proper athletic sports gear to Coach Sharma',
    targetAudience: 'Open to all enrolled students',
    missingInformation: ['End time not specified', 'Online registration deadline not specified'],
    verificationStatus: 'missing_info',
    confidenceNotes: 'Venue and date confirmed, but exact session duration and prior registration requirements are omitted.',
    sourceText: 'Football tryouts on Nov 12, 4:30 PM at the main sports ground. Bring your kit!',
    sourceType: 'whatsapp',
    isBookmarked: false,
    isRead: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'ann-6',
    title: 'Library Extended Hours & Overdue Book Amnesty Week',
    description: 'Central library will remain open 24/7 ahead of mid-term examinations. Late return penalties waived for the week.',
    category: 'Administrative',
    date: '2026-11-05',
    startTime: '08:00 AM',
    endTime: '11:59 PM',
    venue: 'Central University Library',
    deadline: '2026-11-12',
    priority: 'medium',
    requiredAction: 'Return borrowed books before Nov 12 to enjoy fine amnesty',
    targetAudience: 'All University Students & Faculty',
    missingInformation: [],
    verificationStatus: 'verified',
    confidenceNotes: 'Administrative notice confirmed by Central Library committee.',
    sourceText: 'Central library is extending hours to 24/7 starting Nov 5! Late return fines waived until Nov 12.',
    sourceType: 'email',
    isBookmarked: false,
    isRead: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  }
];

const DEFAULT_PREFERENCES: UserPreferences = {
  interests: ['Hackathons', 'Workshops', 'Exams', 'Placements'],
  department: 'Computer Science & Engineering',
  yearOfStudy: '3rd Year',
  enableClashAlerts: true,
  enableDeadlineReminders: true,
  notificationsEnabled: false,
};

// Database helper functions
function readDB(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DBStructure = {
        announcements: INITIAL_ANNOUNCEMENTS,
        tasks: INITIAL_TASKS,
        preferences: DEFAULT_PREFERENCES,
        weeklySummaryCache: null,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      parsed.tasks = INITIAL_TASKS;
      writeDB(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, returning defaults:', err);
    return {
      announcements: INITIAL_ANNOUNCEMENTS,
      tasks: INITIAL_TASKS,
      preferences: DEFAULT_PREFERENCES,
      weeklySummaryCache: null,
    };
  }
}

function writeDB(data: DBStructure): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Initialize Gemini SDK with User-Agent telemetry
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json({ limit: '10mb' }));

// Helper: Verification status determination
function determineVerificationStatus(
  date: string | null,
  venue: string | null,
  requiredAction: string | null,
  missingInfo: string[]
): 'verified' | 'needs_review' | 'missing_info' {
  if (missingInfo && missingInfo.length > 0 && (!date || !venue)) {
    return 'missing_info';
  }
  if (!date || !venue || !requiredAction) {
    return 'needs_review';
  }
  return 'verified';
}

// API Routes

// --- STUDENT TASKS / ASSIGNED WORK ENDPOINTS ---
app.get('/api/tasks', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, tasks: db.tasks || [] });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  try {
    const db = readDB();
    const data = req.body;
    if (!data.title) {
      res.status(400).json({ success: false, error: 'Task title is required.' });
      return;
    }

    const newTask: StudentTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: data.title.trim(),
      subject: data.subject?.trim() || 'General Academic',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      dueTime: data.dueTime || null,
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      sourceAnnouncementId: data.sourceAnnouncementId || null,
      sourceAnnouncementTitle: data.sourceAnnouncementTitle || null,
      notes: data.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    if (!db.tasks) db.tasks = [];
    db.tasks.unshift(newTask);
    writeDB(db);

    res.status(201).json({ success: true, task: newTask });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tasks/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const task = db.tasks?.find((t) => t.id === id);
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  task.status = task.status === 'completed' ? 'pending' : 'completed';
  task.completedAt = task.status === 'completed' ? new Date().toISOString() : undefined;
  writeDB(db);

  res.json({ success: true, task });
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.tasks?.findIndex((t) => t.id === id);
  if (index === -1 || index === undefined) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }

  db.tasks[index] = {
    ...db.tasks[index],
    ...req.body,
    id: db.tasks[index].id,
  };
  writeDB(db);

  res.json({ success: true, task: db.tasks[index] });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.tasks) db.tasks = [];
  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeDB(db);

  res.json({ success: true, message: 'Task deleted successfully' });
});

// 1. Get all announcements
app.get('/api/announcements', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, announcements: db.announcements });
});

// 2. Add new announcement
app.post('/api/announcements', (req: Request, res: Response) => {
  try {
    const db = readDB();
    const data = req.body;

    if (!data.title || typeof data.title !== 'string') {
      res.status(400).json({ success: false, error: 'Title is required.' });
      return;
    }

    const missingInfo: string[] = Array.isArray(data.missingInformation) ? data.missingInformation : [];
    const verificationStatus = data.verificationStatus || determineVerificationStatus(
      data.date || null,
      data.venue || null,
      data.requiredAction || null,
      missingInfo
    );

    const newAnnouncement: Announcement = {
      id: 'ann-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: data.title.trim(),
      description: data.description?.trim() || '',
      category: data.category || 'Other',
      date: data.date || null,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      venue: data.venue?.trim() || null,
      deadline: data.deadline || null,
      priority: data.priority || 'medium',
      requiredAction: data.requiredAction?.trim() || null,
      targetAudience: data.targetAudience?.trim() || 'All students',
      missingInformation: missingInfo,
      verificationStatus,
      confidenceNotes: data.confidenceNotes || 'User reviewed and confirmed.',
      sourceText: data.sourceText || '',
      sourceType: data.sourceType || 'manual',
      isBookmarked: Boolean(data.isBookmarked),
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.announcements.unshift(newAnnouncement);
    // Invalidate weekly summary cache on new announcement
    db.weeklySummaryCache = null;
    writeDB(db);

    res.status(201).json({ success: true, announcement: newAnnouncement });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save announcement' });
  }
});

// 3. Update announcement
app.put('/api/announcements/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.announcements.findIndex((a) => a.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, error: 'Announcement not found' });
    return;
  }

  const existing = db.announcements[index];
  const updated: Announcement = {
    ...existing,
    ...req.body,
    id: existing.id, // prevent ID change
    updatedAt: new Date().toISOString(),
  };

  db.announcements[index] = updated;
  db.weeklySummaryCache = null;
  writeDB(db);

  res.json({ success: true, announcement: updated });
});

// 4. Delete announcement
app.delete('/api/announcements/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const filtered = db.announcements.filter((a) => a.id !== id);

  if (filtered.length === db.announcements.length) {
    res.status(404).json({ success: false, error: 'Announcement not found' });
    return;
  }

  db.announcements = filtered;
  db.weeklySummaryCache = null;
  writeDB(db);

  res.json({ success: true, message: 'Announcement deleted successfully' });
});

// 5. Toggle bookmark
app.post('/api/announcements/:id/bookmark', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const item = db.announcements.find((a) => a.id === id);

  if (!item) {
    res.status(404).json({ success: false, error: 'Announcement not found' });
    return;
  }

  item.isBookmarked = !item.isBookmarked;
  item.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ success: true, isBookmarked: item.isBookmarked });
});

// 6. Toggle read status
app.post('/api/announcements/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const item = db.announcements.find((a) => a.id === id);

  if (!item) {
    res.status(404).json({ success: false, error: 'Announcement not found' });
    return;
  }

  item.isRead = !item.isRead;
  item.updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ success: true, isRead: item.isRead });
});

// 7. Get and update user preferences
app.get('/api/user-preferences', (req: Request, res: Response) => {
  const db = readDB();
  res.json({ success: true, preferences: db.preferences });
});

app.post('/api/user-preferences', (req: Request, res: Response) => {
  const db = readDB();
  db.preferences = {
    ...db.preferences,
    ...req.body,
  };
  writeDB(db);
  res.json({ success: true, preferences: db.preferences });
});

// 8. Duplicate detection check endpoint
app.post('/api/check-duplicates', (req: Request, res: Response) => {
  const { title, date, venue, content } = req.body;
  const db = readDB();

  if (!title && !content) {
    res.json({ isDuplicate: false, matches: [] });
    return;
  }

  const queryTitle = (title || '').toLowerCase().trim();
  const queryVenue = (venue || '').toLowerCase().trim();
  const queryDate = date || '';

  const matches: Array<{ announcement: Announcement; reason: string; similarityScore: number }> = [];

  for (const item of db.announcements) {
    let score = 0;
    const reasons: string[] = [];

    const itemTitle = item.title.toLowerCase();
    // Check title token overlap
    const titleWords = queryTitle.split(/\s+/).filter((w: string) => w.length > 3);
    let matchedWords = 0;
    for (const word of titleWords) {
      if (itemTitle.includes(word)) matchedWords++;
    }

    if (titleWords.length > 0 && (matchedWords / titleWords.length) >= 0.5) {
      score += 50;
      reasons.push('Title has high keyword overlap');
    }

    if (queryDate && item.date === queryDate) {
      score += 25;
      reasons.push(`Occurs on the same date (${queryDate})`);
    }

    if (queryVenue && item.venue && item.venue.toLowerCase().includes(queryVenue)) {
      score += 15;
      reasons.push(`Shares the same venue (${item.venue})`);
    }

    if (score >= 40) {
      matches.push({
        announcement: item,
        reason: reasons.join(' · '),
        similarityScore: score,
      });
    }
  }

  // Sort by highest similarity
  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  res.json({
    isDuplicate: matches.length > 0,
    matches: matches.slice(0, 3),
  });
});

// 9. AI Announcement Parser endpoint using Gemini API
app.post('/api/parse-announcement', async (req: Request, res: Response) => {
  const { text, imageBase64, mimeType } = req.body;

  if (!text && !imageBase64) {
    res.status(400).json({ success: false, error: 'Please provide announcement text or an uploaded image.' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server. Please verify your environment secrets.',
    });
    return;
  }

  try {
    const promptInstructions = `
You are the AI Announcement Parser for "Campus Pulse", a campus companion app for university students.
Your task is to parse an unstructured college announcement (from WhatsApp, email, notices, posters, or circulars) and accurately extract structured event and deadline information.

CRITICAL RULES:
1. Never invent or hallucinate dates, venues, deadlines, or timings. If a field is not explicitly mentioned or clearly deducible, set it to null.
2. If any important information is missing (such as venue, deadline, or timings), record each missing item in the "missingInformation" array as a clear, plain-text string (e.g. "Venue not specified", "Registration deadline omitted").
3. Determine "verificationStatus":
   - "verified": The announcement has a clear title, confirmed date, venue, and actionable details.
   - "missing_info": Core fields such as date or venue are missing.
   - "needs_review": Information is ambiguous, dates are vague (e.g. "coming soon"), or conflicting details exist.
4. Categorize strictly into one of: Academics, Workshops, Hackathons, Placements, Cultural, Sports, Administrative, Exams, Other.
5. Priority assessment:
   - "urgent": Imminent deadline (< 3 days), mandatory academic or exam requirement, or critical compliance.
   - "high": Important event, placement drive, or major contest with upcoming deadline.
   - "medium": Standard departmental event or general workshop.
   - "low": Casual activity, tryout, or informational note.
6. Provide "confidenceNotes" explaining whether details were clear or ambiguous.
`;

    const contents: any[] = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: imageBase64,
        },
      });
    }
    if (text) {
      contents.push({
        text: `Here is the announcement content to extract:\n\n${text}`,
      });
    } else {
      contents.push({
        text: 'Extract the announcement details from this image document.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: promptInstructions,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Clear, concise headline of the announcement' },
            description: { type: Type.STRING, description: 'Summary of what the announcement is about (2-3 sentences)' },
            category: {
              type: Type.STRING,
              description: 'One of: Academics, Workshops, Hackathons, Placements, Cultural, Sports, Administrative, Exams, Other',
            },
            date: { type: Type.STRING, description: 'Event date in ISO format YYYY-MM-DD, or null if not stated or unknown' },
            startTime: { type: Type.STRING, description: 'Start time e.g. "10:00 AM", or null' },
            endTime: { type: Type.STRING, description: 'End time e.g. "01:00 PM", or null' },
            venue: { type: Type.STRING, description: 'Location, room, or platform e.g. "Auditorium Hall B", or null' },
            deadline: { type: Type.STRING, description: 'Registration or submission deadline in ISO YYYY-MM-DD or datetime format, or null' },
            priority: { type: Type.STRING, description: 'Priority level: low, medium, high, urgent' },
            requiredAction: { type: Type.STRING, description: 'What students need to do, e.g. "Register on link", "Submit document", or null' },
            targetAudience: { type: Type.STRING, description: 'Target students/branches, e.g. "All students", "3rd year CSE"' },
            missingInformation: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of crucial fields or details not found in the original text',
            },
            verificationStatus: {
              type: Type.STRING,
              description: 'One of: verified, needs_review, missing_info',
            },
            confidenceNotes: {
              type: Type.STRING,
              description: 'Brief explanation of clarity and any assumptions or ambiguities',
            },
          },
          required: [
            'title',
            'description',
            'category',
            'priority',
            'missingInformation',
            'verificationStatus',
            'confidenceNotes',
          ],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');

    // Extra server-side validation & normalization
    parsedJson.date = parsedJson.date && parsedJson.date !== 'null' ? parsedJson.date : null;
    parsedJson.startTime = parsedJson.startTime && parsedJson.startTime !== 'null' ? parsedJson.startTime : null;
    parsedJson.endTime = parsedJson.endTime && parsedJson.endTime !== 'null' ? parsedJson.endTime : null;
    parsedJson.venue = parsedJson.venue && parsedJson.venue !== 'null' ? parsedJson.venue : null;
    parsedJson.deadline = parsedJson.deadline && parsedJson.deadline !== 'null' ? parsedJson.deadline : null;
    parsedJson.requiredAction = parsedJson.requiredAction && parsedJson.requiredAction !== 'null' ? parsedJson.requiredAction : null;

    res.json({
      success: true,
      extractedData: parsedJson,
    });
  } catch (error: any) {
    console.error('Error parsing announcement with Gemini:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse announcement with AI. Please check your text or try again.',
    });
  }
});

// 10. AI Weekly Campus Summary endpoint
app.post('/api/weekly-summary', async (req: Request, res: Response) => {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY is not configured on the server.',
    });
    return;
  }

  try {
    const db = readDB();
    const { refresh } = req.body;

    // Cache check: return existing if less than 6 hours old and not explicitly refreshed
    if (!refresh && db.weeklySummaryCache) {
      const cacheTime = new Date(db.weeklySummaryCache.generatedAt).getTime();
      const sixHours = 6 * 60 * 60 * 1000;
      if (Date.now() - cacheTime < sixHours) {
        res.json({
          success: true,
          summary: db.weeklySummaryCache.summary,
          generatedAt: db.weeklySummaryCache.generatedAt,
          cached: true,
        });
        return;
      }
    }

    if (!db.announcements || db.announcements.length === 0) {
      res.json({
        success: true,
        summary: 'No announcements recorded yet in Campus Pulse. Paste or upload college circulars to generate your weekly campus brief.',
        generatedAt: new Date().toISOString(),
      });
      return;
    }

    // Build context strictly from existing announcements
    const announcementsContext = db.announcements
      .slice(0, 15)
      .map(
        (a, i) =>
          `${i + 1}. [${a.priority.toUpperCase()}] ${a.title} (${a.category})\n` +
          `   - Date: ${a.date || 'TBD'} | Time: ${a.startTime || 'TBD'} | Venue: ${a.venue || 'TBD'}\n` +
          `   - Deadline: ${a.deadline || 'None'} | Action: ${a.requiredAction || 'None'}\n` +
          `   - Summary: ${a.description}`
      )
      .join('\n\n');

    const prompt = `
You are the AI Campus Intelligence summarizer for Campus Pulse.
Create a well-organized, friendly, highly scannable Weekly Campus Intelligence Brief for students based ONLY on the following actual announcements.

STRICT INSTRUCTIONS:
- Do NOT fabricate or invent imaginary events or deadlines.
- Use clear bullet points and bold headers.
- Divide into 4 structured sections:
  1. 📌 High-Impact Priorities & Urgent Deadlines
  2. 🗓️ Upcoming Schedule & Key Dates
  3. 🚀 Technical & Placement Opportunities
  4. 💡 Proactive Action Checklist (What students should do right now)
- Keep the tone encouraging, professional, and directly useful.

ANNOUNCEMENTS DATABASE:
${announcementsContext}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const summaryText = response.text || 'Unable to generate summary at this moment.';

    db.weeklySummaryCache = {
      summary: summaryText,
      generatedAt: new Date().toISOString(),
    };
    writeDB(db);

    res.json({
      success: true,
      summary: summaryText,
      generatedAt: db.weeklySummaryCache.generatedAt,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate weekly summary.',
    });
  }
});

// 11. AI Action Planner for a specific announcement
app.post('/api/action-planner', async (req: Request, res: Response) => {
  const { announcement } = req.body;

  if (!announcement || !announcement.title) {
    res.status(400).json({ success: false, error: 'Announcement payload is required.' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured.' });
    return;
  }

  try {
    const prompt = `
You are the Campus Pulse AI Action Planner.
A college student is reviewing the following announcement. Generate a practical, realistic, step-by-step checklist (3 to 5 clear steps) on what the student should do next to prepare and avoid missing out.

Announcement Details:
- Title: ${announcement.title}
- Category: ${announcement.category}
- Date: ${announcement.date || 'Unspecified'}
- Time: ${announcement.startTime || 'Unspecified'} - ${announcement.endTime || 'Unspecified'}
- Venue: ${announcement.venue || 'Unspecified'}
- Deadline: ${announcement.deadline || 'Unspecified'}
- Required Action: ${announcement.requiredAction || 'None mentioned'}
- Description: ${announcement.description}

Provide response in structured JSON with:
- "steps": array of objects with "step" (number), "action" (concise title, 4-8 words), "detail" (one clear sentence on what to do), "estimatedTime" (e.g. "5 mins", "1 hour")
- "criticalWarning": optional string if there is an imminent deadline or strict prerequisite
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER },
                  action: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING },
                },
                required: ['step', 'action', 'detail', 'estimatedTime'],
              },
            },
            criticalWarning: { type: Type.STRING },
          },
          required: ['steps'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, plan: parsed });
  } catch (error: any) {
    console.error('Error generating action plan:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate action plan.' });
  }
});

// 12. Reset to initial demo announcements & tasks
app.post('/api/reset-sample-data', (req: Request, res: Response) => {
  const db: DBStructure = {
    announcements: INITIAL_ANNOUNCEMENTS,
    tasks: INITIAL_TASKS,
    preferences: DEFAULT_PREFERENCES,
    weeklySummaryCache: null,
  };
  writeDB(db);
  res.json({ 
    success: true, 
    message: 'Sample announcements and student tasks restored successfully', 
    announcements: INITIAL_ANNOUNCEMENTS,
    tasks: INITIAL_TASKS 
  });
});

// Setup Vite dev middleware or static serving
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Campus Pulse] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
