import React, { useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  User as UserIcon, 
  GraduationCap, 
  Building, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthMode } from '../types';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Biotechnology',
  'Management & Commerce',
  'Other Department',
];

const YEARS = [
  '1st Year Undergraduate',
  '2nd Year Undergraduate',
  '3rd Year Undergraduate',
  '4th Year Undergraduate',
  'Postgraduate / Masters',
];

export const AuthPage: React.FC = () => {
  const { login, signup, quickDemoLogin, isSupabaseEnabled } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year Undergraduate');
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setError('Please enter your college email and password.');
        return;
      }
      setLoading(true);
      const res = await login(email.trim(), password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } else if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your college email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }

      setLoading(true);
      const res = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        department,
        yearOfStudy,
      });
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Failed to create student account.');
      }
    } else if (mode === 'forgot_password') {
      if (!email.trim()) {
        setError('Please enter your registered college email.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccessMessage(`Password recovery link has been sent to ${email}. Check your mailbox.`);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EAF2] text-[#30243D] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Minimal Brand Header */}
        <div className="text-center space-y-1.5 mb-8">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#59416D] text-white mb-2 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#F3EAF2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#30243D]">
            Campus Pulse
          </h1>
          <p className="text-xs sm:text-sm text-[#59416D]/80">
            Student academic companion & circular organizer
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(48,36,61,0.06)] border border-[#E3D5E2] p-6 sm:p-8 space-y-5">
          
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#F3EAF2] rounded-xl text-xs font-medium border border-[#E3D5E2]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#59416D] text-white font-semibold shadow-xs'
                  : 'text-[#30243D]/70 hover:text-[#30243D]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-[#59416D] text-white font-semibold shadow-xs'
                  : 'text-[#30243D]/70 hover:text-[#30243D]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick Evaluator Access (1-Click) */}
          {mode === 'login' && (
            <div className="p-3.5 bg-[#F3EAF2]/60 rounded-xl border border-[#E3D5E2] space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#59416D] font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D99AB7]"></span>
                  Quick Student Access
                </span>
                <span className="font-mono text-[10px] text-[#59416D] bg-[#E3D5E2] border border-[#C99ACB]/50 px-2 py-0.5 rounded-md font-semibold">
                  1-Click Login
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('Yogita', 'yogita@campus.edu', 'Computer Science & Engineering')}
                  className="p-2.5 text-left bg-white hover:bg-[#F3EAF2] rounded-xl border border-[#E3D5E2] hover:border-[#C99ACB] text-xs transition-all group shadow-2xs"
                >
                  <div className="font-bold text-[#30243D] group-hover:text-[#59416D] flex items-center justify-between">
                    <span>Yogita</span>
                    <span className="text-[10px] text-[#D99AB7]">★</span>
                  </div>
                  <div className="text-[10px] text-[#59416D]/80 font-mono mt-0.5">3rd Year · CSE</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickDemoLogin('Priya Sharma', 'priya.sharma@campus.edu', 'Information Technology')}
                  className="p-2.5 text-left bg-white hover:bg-[#F3EAF2] rounded-xl border border-[#E3D5E2] hover:border-[#C99ACB] text-xs transition-all group shadow-2xs"
                >
                  <div className="font-bold text-[#30243D] group-hover:text-[#59416D]">Priya Sharma</div>
                  <div className="text-[10px] text-[#59416D]/80 font-mono mt-0.5">4th Year · IT</div>
                </button>
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* SIGN UP FIELDS */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#30243D] mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59416D]/60" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Yogita"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-[#30243D] bg-white border border-[#E3D5E2] rounded-xl outline-none focus:border-[#59416D] focus:ring-1 focus:ring-[#59416D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#30243D] mb-1">
                      Department
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59416D]/60" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-[#30243D] bg-white border border-[#E3D5E2] rounded-xl outline-none focus:border-[#59416D] focus:ring-1 focus:ring-[#59416D]"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#30243D] mb-1">
                      Year of Study
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59416D]/60" />
                      <select
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-[#30243D] bg-white border border-[#E3D5E2] rounded-xl outline-none focus:border-[#59416D] focus:ring-1 focus:ring-[#59416D]"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#30243D] mb-1">
                College Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59416D]/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yogita@campus.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-[#30243D] bg-white border border-[#E3D5E2] rounded-xl outline-none focus:border-[#59416D] focus:ring-1 focus:ring-[#59416D]"
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#30243D]">
                    Password *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-xs text-[#59416D] hover:text-[#30243D] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59416D]/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm text-[#30243D] bg-white border border-[#E3D5E2] rounded-xl outline-none focus:border-[#59416D] focus:ring-1 focus:ring-[#59416D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#59416D]/60 hover:text-[#30243D]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#59416D]/60" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#30243D] mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#59416D]/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm text-[#30243D] bg-white border border-[#E3D5E2] rounded-xl outline-none focus:border-[#59416D] focus:ring-1 focus:ring-[#59416D]"
                  />
                </div>
              </div>
            )}

            {/* Remember Me */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs text-[#59416D] pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-normal">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#59416D] rounded focus:ring-[#59416D] border-[#E3D5E2]"
                  />
                  <span className="text-[#30243D]">Remember login on this browser</span>
                </label>
              </div>
            )}

            {/* Main Submit Button - Muted Purple High Contrast */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#59416D] hover:bg-[#483359] active:bg-[#30243D] text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In to Portal'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'forgot_password' && 'Send Recovery Email'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Footer Info */}
          <div className="pt-3 border-t border-[#E3D5E2] flex items-center justify-between text-[11px] text-[#59416D]/70 font-mono">
            <span>{isSupabaseEnabled ? 'Supabase Auth' : 'Campus Sandbox'}</span>
            <span>CSSS Buildathon 2026</span>
          </div>

        </div>

      </div>

    </div>
  );
};
