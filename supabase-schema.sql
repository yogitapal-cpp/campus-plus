-- Campus Pulse: Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Academics', 'Workshops', 'Hackathons', 'Placements', 'Cultural', 'Sports', 'Administrative', 'Exams', 'Other'
  )),
  event_date DATE,
  start_time TEXT,
  end_time TEXT,
  venue TEXT,
  deadline TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  required_action TEXT,
  target_audience TEXT DEFAULT 'All students',
  missing_information TEXT[] DEFAULT '{}',
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'needs_review', 'missing_info')),
  confidence_notes TEXT,
  source_text TEXT,
  source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('whatsapp', 'email', 'circular', 'manual')),
  is_bookmarked BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  interests TEXT[] DEFAULT ARRAY['Hackathons', 'Workshops', 'Exams', 'Placements'],
  department TEXT DEFAULT 'Computer Science & Engineering',
  year_of_study TEXT DEFAULT '3rd Year',
  enable_clash_alerts BOOLEAN DEFAULT true,
  enable_deadline_reminders BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Announcements
-- Students can read all campus announcements, or only their own if private
CREATE POLICY "Public or authenticated users can read announcements" 
  ON public.announcements FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create announcements" 
  ON public.announcements FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own announcements" 
  ON public.announcements FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own announcements" 
  ON public.announcements FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- 6. RLS Policies for User Preferences
CREATE POLICY "Users can view own preferences" 
  ON public.user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON public.user_preferences FOR ALL 
  USING (auth.uid() = user_id);

-- 7. RLS Policies for Bookmarks
CREATE POLICY "Users can view own bookmarks" 
  ON public.bookmarks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" 
  ON public.bookmarks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" 
  ON public.bookmarks FOR DELETE 
  USING (auth.uid() = user_id);

-- 8. Create Student Profiles Table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT DEFAULT 'Computer Science & Engineering',
  year_of_study TEXT DEFAULT '3rd Year',
  role TEXT DEFAULT 'Student',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all student profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile record on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, department, year_of_study)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Computer Science & Engineering'),
    COALESCE(NEW.raw_user_meta_data->>'year_of_study', '3rd Year')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

