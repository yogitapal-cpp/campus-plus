import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSupabaseEnabled: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    department: string;
    yearOfStudy: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickDemoLogin: (name: string, email: string, department: string) => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'campus_pulse_auth_user';

// Default initial student user profile for Yogita
const DEFAULT_DEMO_USER: User = {
  id: 'usr-student-yogita',
  name: 'Yogita',
  email: 'yogita@campus.edu',
  department: 'Computer Science & Engineering',
  yearOfStudy: '3rd Year Undergraduate',
  rollNumber: '2026-CS-084',
  role: 'Student',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth state
  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          // Check Supabase session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || 'student@campus.edu',
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
              department: session.user.user_metadata?.department || 'Computer Science & Engineering',
              yearOfStudy: session.user.user_metadata?.year_of_study || '3rd Year',
              role: 'Student',
            });
            setIsLoading(false);
            return;
          }
        }

        // Check local storage
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            setUser(null);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        } else {
          // No active session: keep user null so login screen displays first
          setUser(null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const quickDemoLogin = (demoName: string, demoEmail: string, department: string) => {
    const demoUser: User = {
      id: 'usr-' + Date.now().toString(36),
      name: demoName,
      email: demoEmail,
      department: department,
      yearOfStudy: '3rd Year Undergraduate',
      rollNumber: '2026-CS-084',
      role: 'Student',
    };
    setUser(demoUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoUser));
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          const u: User = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            department: data.user.user_metadata?.department || 'Computer Science & Engineering',
            yearOfStudy: data.user.user_metadata?.year_of_study || '3rd Year',
            role: 'Student',
          };
          setUser(u);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
          return { success: true };
        }
      }

      // Local authentication flow
      const nameParts = email.split('@')[0].split('.');
      const formattedName = nameParts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');

      const loggedUser: User = {
        id: 'usr-' + Date.now().toString(36),
        email,
        name: formattedName || 'Campus Student',
        department: 'Computer Science & Engineering',
        yearOfStudy: '3rd Year',
        role: 'Student',
      };

      setUser(loggedUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loggedUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    department: string;
    yearOfStudy: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!data.name || !data.email || !data.password) {
      return { success: false, error: 'Please fill in all required fields.' };
    }
    if (data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data: suData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name,
              department: data.department,
              year_of_study: data.yearOfStudy,
            },
          },
        });
        if (error) return { success: false, error: error.message };
        if (suData.user) {
          const u: User = {
            id: suData.user.id,
            email: suData.user.email || data.email,
            name: data.name,
            department: data.department,
            yearOfStudy: data.yearOfStudy,
            role: 'Student',
          };
          setUser(u);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(u));
          return { success: true };
        }
      }

      // Local signup flow
      const newUser: User = {
        id: 'usr-' + Date.now().toString(36),
        email: data.email,
        name: data.name,
        department: data.department || 'Computer Science & Engineering',
        yearOfStudy: data.yearOfStudy || '3rd Year',
        role: 'Student',
      };

      setUser(newUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error signing out of Supabase:', err);
    } finally {
      setUser(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabaseEnabled: isSupabaseConfigured,
        login,
        signup,
        logout,
        quickDemoLogin,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
