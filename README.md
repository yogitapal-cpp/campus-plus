# Campus Pulse 🎓⚡

> **PromptWars × CSSS Buildathon Project**  
> *An AI-powered campus companion that transforms college announcements into organized events, smart reminders, and personalized campus updates.*

---

## 📖 The Problem & The Solution

College announcements are scattered across chaotic WhatsApp groups, messy email circulars, PDF notices, and physical flyers. Students frequently miss critical exam deadlines, fee due dates, placement registrations, and hackathon schedules because information is unstructured and unorganized.

**Campus Pulse** solves this problem with a single workflow:
1. **Paste or Upload**: Paste any informal WhatsApp text forward, formal circular, or upload a notice image/flyer.
2. **Gemini AI Extraction**: Automatically parses title, category, event date, timings, venue, registration deadline, priority level, and required student actions.
3. **No Hallucinations**: Missing details are explicitly highlighted, notices with ambiguities are marked for review, and no fake data is ever invented.
4. **Schedule & Clash Intelligence**: Instant conflict detection for overlapping events and one-click `.ics` calendar sync to Google Calendar, Apple Calendar, and Outlook.
5. **Weekly Intelligence Brief**: AI-generated weekly executive campus briefs grounded strictly in verified announcements.

---

## 🛠️ Technology Stack & Why Each Was Chosen

- **Frontend**: **React.js + TypeScript + Vite**
  - *Why*: Ultra-fast development server, strong type-safety to prevent runtime bugs, and modular reactive UI components.
- **Styling**: **Tailwind CSS v4**
  - *Why*: Clean utility-first styling adhering to the 60-30-10 color rule (soft lavender, indigo, slate, and white) with automatic dark mode.
- **Icons**: **Lucide React**
  - *Why*: Featherweight, consistent SVG icons with zero visual clutter.
- **AI Intelligence**: **Google Gemini API (`gemini-3.8-flash`)**
  - *Why*: State-of-the-art multimodal extraction capable of reading text and scanned document images with structured JSON schema outputs.
- **Backend & API**: **Node.js + Express (`server.ts`)**
  - *Why*: Keeps the Gemini API key 100% secure on the server side (never exposed to browser bundles) and provides reliable local persistence.
- **Database**: **Supabase PostgreSQL Ready**
  - *Why*: Industry-standard relational PostgreSQL with Row Level Security (RLS) policies. Includes zero-configuration instant local persistence so the app runs immediately.
- **Deployment**: **Vercel** (Frontend/Full-stack) & **Supabase** (PostgreSQL/Auth).

---

## ✨ Core & Buildathon Features

### 1. 🤖 AI Announcement Parser
- **Dual Input Modes**: Paste raw text or upload flyer images.
- **Structured Fields**: Title, Category, Date, Start/End Time, Venue, Registration Deadline, Priority, Required Student Action, Target Audience.
- **Review Before Save**: The AI never saves automatically without student confirmation. Users can edit any field before saving.
- **Hallucination Prevention**: Explicitly lists missing information (e.g. "Venue not specified", "Deadline omitted").

### 2. 📊 Student Dashboard
- **Welcome & Campus Overview**: Personalized greeting, branch/department display, and live campus metrics.
- **High-Priority Notices**: Urgent deadlines due within 72 hours with countdown tags.
- **Upcoming Schedule**: Chronological list of confirmed events with venue details.
- **Personalized Feed ("For You")**: Curated feed filtering notices matching student's chosen interests.

### 3. 🛡️ Notice Confidence / Verification Status
- Displays clear statuses based on factual completeness:
  - 🟢 **Verified Details**: Title, confirmed date, venue, and required actions are present.
  - 🟡 **Needs Review**: Ambiguous dates or unverified timings.
  - 🔴 **Missing Information**: Missing crucial fields like venue or registration deadline.
  - *(Strictly avoids fake numerical AI confidence percentages).*

### 4. ⚠️ Duplicate Announcement Detection
- Automatically compares candidate announcements with existing database entries using token similarity, date comparison, and venue matching.
- Flags duplicate warnings before saving with actionable diff comparison.

### 5. 🗓️ Event Clash Detector
- Compares date and time intervals across student's calendar.
- Displays prominent schedule conflict alerts when events overlap.

### 6. 📅 Calendar View & `.ics` Export
- **Agenda & Monthly Grid**: Visual event cards grouped by date.
- **Standard `.ics` Download**: One-click calendar export compatible with Google Calendar, Apple Calendar, and Microsoft Outlook.
- **Browser Reminders**: Desktop notification permission controls for deadline alerts.

### 7. 💡 AI Action Planner
- For any announcement, generates a realistic, step-by-step preparation checklist with estimated completion times.
- Interactive checkable tasks with progress bar.

### 8. 📰 AI Weekly Campus Summary
- Generates an executive summary divided into:
  1. High-Impact Priorities & Urgent Deadlines
  2. Upcoming Schedule & Key Dates
  3. Technical & Placement Opportunities
  4. Proactive Action Checklist
- Grounded strictly in actual stored announcements.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/campus-pulse.git
cd campus-pulse

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Add your Google Gemini API key:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
```
*(Get a free API key at [Google AI Studio](https://aistudio.google.com/)).*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Supabase PostgreSQL Integration Guide

Campus Pulse includes a production-ready SQL migration script: `supabase-schema.sql`.

To use Supabase for your database:
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `supabase-schema.sql` and click **Run**.
4. In your `.env` file, set:
   ```env
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```
5. Row Level Security (RLS) is pre-configured to protect user privacy.

---

## 📦 GitHub Repository Size Constraint (< 10 MB)

This repository is strictly engineered to stay **well below 10 MB**:
- Lightweight vector SVG icons via `lucide-react`.
- `.gitignore` prevents `node_modules`, `dist/`, build caches, and test artifacts from being committed.
- No heavy binary media files.

### How to verify repository size yourself:
Run the following terminal command in the project directory:
```bash
# Check size of the tracked git repository
git count-objects -vH
# Or check directory size excluding node_modules
du -sh --exclude=node_modules .
```

---

## 🚢 Deployment

### Deploying to Vercel
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and select `campus-pulse`.
3. Configure Environment Variables:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL` (optional)
   - `VITE_SUPABASE_ANON_KEY` (optional)
4. Click **Deploy**.

---

## 👥 Credits & License

Built with ❤️ for the **PromptWars × CSSS Buildathon**.  
Licensed under the Apache License 2.0.
