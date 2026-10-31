import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  ArrowRight,
  RefreshCw,
  Copy,
  Info
} from 'lucide-react';
import { Announcement, Category, Priority, VerificationStatus, DuplicateMatch, EventClash } from '../types';
import { detectEventClashes } from '../utils/clashDetector';

interface ParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAnnouncement: (announcement: Partial<Announcement>) => Promise<void>;
  existingAnnouncements: Announcement[];
}

const SAMPLE_TEMPLATES = [
  {
    name: 'WhatsApp Group Announcement',
    text: `*Attention 3rd & 4th Year CSE/IT Students!* 🚀
The Department of Computer Science is hosting a 24-hr Hackathon *"HackCampus 2026"* on *November 20, 2026* from *09:00 AM* onwards at the *Main Auditorium*.
Cash prizes worth $1,500 + internship referrals!
Team size: 2 to 4 members.
Last date to register your team is *November 14, 2026*.
Registration link: campus.edu/hackcampus-reg
Don't miss out! Contact Prof. David for queries.`,
  },
  {
    name: 'Official Administrative Circular',
    text: `REF: REG/NOT/2026/842
OFFICE OF THE REGISTRAR
CIRCULAR — SEMESTER TUITION FEE PAYMENT DEADLINE
All enrolled undergraduate and postgraduate students are hereby notified that the final date for submission of the Odd Semester Tuition and Laboratory Fees is November 18, 2026, 05:00 PM.
Fee payment must be processed exclusively via the University ERP Portal (erp.campus.edu).
Late fee penalties of $50 will apply for transactions completed after the stipulated deadline.
Admit cards for upcoming term examinations will only be issued upon fee clearance.`,
  },
  {
    name: 'Messy Vague Notice (Missing Info)',
    text: `Hey guys, robotics club meeting this Friday afternoon! We will discuss the upcoming robo-wars robot build. Everyone interested please attend. Snacks provided!`,
  },
];

export const ParserModal: React.FC<ParserModalProps> = ({
  isOpen,
  onClose,
  onSaveAnnouncement,
  existingAnnouncements,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [inputText, setInputText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Review step state
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [extractedData, setExtractedData] = useState<Partial<Announcement> | null>(null);

  // Duplicate & Clash alerts
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [clashes, setClashes] = useState<EventClash[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setParseError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    setImageMimeType(file.type);
    setImagePreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract pure base64 without header
      const base64Data = result.split(',')[1];
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    if (activeTab === 'text' && !inputText.trim()) {
      setParseError('Please paste or type an announcement text.');
      return;
    }
    if (activeTab === 'image' && !imageBase64) {
      setParseError('Please upload an image of the notice or flyer.');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const response = await fetch('/api/parse-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeTab === 'text' ? inputText : undefined,
          imageBase64: activeTab === 'image' ? imageBase64 : undefined,
          mimeType: activeTab === 'image' ? imageMimeType : undefined,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to parse announcement with AI');
      }

      const extracted = resData.extractedData;
      setExtractedData({
        ...extracted,
        sourceText: activeTab === 'text' ? inputText : 'Uploaded from document image',
        sourceType: activeTab === 'text' ? 'whatsapp' : 'circular',
      });

      // Check duplicates
      const dupRes = await fetch('/api/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: extracted.title,
          date: extracted.date,
          venue: extracted.venue,
          content: extracted.description,
        }),
      });
      const dupData = await dupRes.json();
      setDuplicateMatches(dupData.matches || []);

      // Check schedule clashes
      const detectedClashes = detectEventClashes(
        {
          date: extracted.date,
          startTime: extracted.startTime,
          endTime: extracted.endTime,
          title: extracted.title,
        },
        existingAnnouncements
      );
      setClashes(detectedClashes);

      setStep('review');
    } catch (err: any) {
      setParseError(err.message || 'Error occurred while contacting Gemini AI.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFieldChange = (field: keyof Announcement, value: any) => {
    if (!extractedData) return;
    const updated = { ...extractedData, [field]: value };
    setExtractedData(updated);

    // Recheck clashes if date or time changed
    if (field === 'date' || field === 'startTime' || field === 'endTime') {
      const detectedClashes = detectEventClashes(
        {
          date: updated.date || null,
          startTime: updated.startTime || null,
          endTime: updated.endTime || null,
          title: updated.title || '',
        },
        existingAnnouncements
      );
      setClashes(detectedClashes);
    }
  };

  const handleConfirmSave = async () => {
    if (!extractedData || !extractedData.title) {
      alert('Please provide an announcement title.');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveAnnouncement(extractedData);
      handleClose();
    } catch (err: any) {
      alert(`Error saving announcement: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setInputText('');
    setImageBase64(null);
    setImagePreviewUrl(null);
    setExtractedData(null);
    setDuplicateMatches([]);
    setClashes([]);
    setParseError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-slate-800 bg-gradient-to-r from-purple-50/60 to-pink-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-headline" className="text-base font-extrabold text-purple-950 dark:text-white">
                {step === 'input' ? 'AI Announcement Parser ✨' : 'Review & Confirm Extracted Details'}
              </h2>
              <p className="text-xs text-purple-900/60 dark:text-slate-400">
                {step === 'input' 
                  ? 'Paste any raw WhatsApp message, email, or circular to organize it' 
                  : 'Verify extracted fields. You can edit any details before saving.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-purple-400 hover:text-purple-700 rounded-xl hover:bg-purple-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Input & Upload View */}
        {step === 'input' && (
          <div className="p-6 space-y-5">
            {/* Input Type Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-purple-50/80 border border-purple-100 rounded-2xl">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'text'
                    ? 'bg-white text-purple-950 shadow-xs'
                    : 'text-purple-800/60 hover:text-purple-950'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Paste Announcement Text</span>
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'image'
                    ? 'bg-white text-purple-950 shadow-xs'
                    : 'text-purple-800/60 hover:text-purple-950'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Document / Flyer</span>
              </button>
            </div>

            {/* Error Message */}
            {parseError && (
              <div className="p-3.5 text-xs bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 flex items-start gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Text Input Tab */}
            {activeTab === 'text' ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-purple-950 dark:text-slate-300">
                  Raw Announcement Content
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste WhatsApp forwards, emails, campus circulars, or hackathon blurbs here..."
                  rows={7}
                  className="w-full px-4 py-3 text-sm text-purple-950 dark:text-white bg-purple-50/20 dark:bg-slate-950 border border-purple-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-pink-300 focus:bg-white outline-none resize-none"
                />

                {/* Quick Sample Presets */}
                <div>
                  <div className="text-xs text-purple-800 font-semibold mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>Or try a realistic sample notice:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_TEMPLATES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(sample.text)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-pink-50 text-purple-900 font-semibold border border-purple-200/80 transition-colors shadow-2xs"
                      >
                        {sample.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Image Upload Tab */
              <div className="space-y-3">
                <label className="block text-xs font-bold text-purple-950 dark:text-slate-300">
                  Upload Poster or Notice Image
                </label>
                <div className="border-2 border-dashed border-purple-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-pink-300 transition-colors bg-purple-50/10">
                  {imagePreviewUrl ? (
                    <div className="space-y-3">
                      <img 
                        src={imagePreviewUrl} 
                        alt="Notice preview" 
                        className="max-h-56 mx-auto rounded-xl shadow-xs border border-purple-100 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageBase64(null);
                          setImagePreviewUrl(null);
                        }}
                        className="text-xs text-rose-600 hover:underline font-bold"
                      >
                        Remove and choose another image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 shadow-xs">
                        <Upload className="w-6 h-6 text-pink-500" />
                      </div>
                      <div className="text-sm font-bold text-purple-950 dark:text-slate-300">
                        Click to select an image or drag and drop
                      </div>
                      <p className="text-xs text-purple-700/70">
                        PNG, JPG, or WEBP up to 8MB. Gemini will read text directly from the flyer.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Capability Banner */}
            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-pink-50/60 rounded-2xl border border-purple-200/80 flex items-start gap-2.5 text-xs text-purple-900/80">
              <Info className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-purple-950 font-bold">Smart Extraction Engine:</strong> Gemini 3.8 Flash extracts date, start/end time, venue, registration deadlines, and detects schedule conflicts. It never hallucinates missing details and flags missing data for your review.
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={isParsing || (activeTab === 'text' && !inputText.trim()) || (activeTab === 'image' && !imageBase64)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl shadow-md shadow-pink-400/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Details with AI... ✨</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract with Gemini AI ✨</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Review & Edit Extracted Details */}
        {step === 'review' && extractedData && (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            {/* Duplicate Notice Warning */}
            {duplicateMatches.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1.5 flex-1">
                    <div className="font-semibold text-sm">Potential Duplicate Announcement Detected</div>
                    <p>A similar announcement already exists in your Campus Pulse records:</p>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 font-mono">
                      <strong>"{duplicateMatches[0].announcement.title}"</strong> ({duplicateMatches[0].announcement.date || 'No date'})
                      <div className="text-amber-700 dark:text-amber-400 text-xs mt-1">Reason: {duplicateMatches[0].reason}</div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 italic">You can still proceed if this is an updated version or separate announcement.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Clash Warning */}
            {clashes.length > 0 && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 flex-1">
                    <div className="font-semibold text-sm">Schedule Conflict Alert</div>
                    <p>This event overlaps with an existing schedule commitment:</p>
                    <ul className="list-disc list-inside space-y-0.5 mt-1 font-mono">
                      {clashes.map((c, i) => (
                        <li key={i}>{c.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Notice Verification Status Banner */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                {extractedData.verificationStatus === 'verified' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                {extractedData.verificationStatus === 'needs_review' && (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                {extractedData.verificationStatus === 'missing_info' && (
                  <HelpCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                    Status: {extractedData.verificationStatus?.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {extractedData.confidenceNotes || 'Review and fill in any missing details below.'}
                  </div>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                AI Verified
              </span>
            </div>

            {/* Editable Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={extractedData.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={extractedData.category || 'Other'}
                  onChange={(e) => handleFieldChange('category', e.target.value as Category)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Academics">Academics</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Hackathons">Hackathons</option>
                  <option value="Placements">Placements</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Exams">Exams</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={extractedData.priority || 'medium'}
                  onChange={(e) => handleFieldChange('priority', e.target.value as Priority)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none capitalize"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Event Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={extractedData.date || ''}
                  onChange={(e) => handleFieldChange('date', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              {/* Registration Deadline */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Registration / Task Deadline
                </label>
                <input
                  type="date"
                  value={extractedData.deadline ? extractedData.deadline.split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('deadline', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              {/* Timings */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM"
                  value={extractedData.startTime || ''}
                  onChange={(e) => handleFieldChange('startTime', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01:00 PM"
                  value={extractedData.endTime || ''}
                  onChange={(e) => handleFieldChange('endTime', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              {/* Venue */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 302, Tech Block / Main Auditorium"
                  value={extractedData.venue || ''}
                  onChange={(e) => handleFieldChange('venue', e.target.value || null)}
                  className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Required Action */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-purple-950 dark:text-slate-300 mb-1">
                  Required Action for Students
                </label>
                <input
                  type="text"
                  placeholder="e.g. Register on portal before Friday, submit NOC"
                  value={extractedData.requiredAction || ''}
                  onChange={(e) => handleFieldChange('requiredAction', e.target.value || null)}
                  className="w-full px-3.5 py-2.5 text-sm text-purple-950 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none"
                />
              </div>

              {/* Target Audience */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-purple-950 dark:text-slate-300 mb-1">
                  Eligibility / Target Audience
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3rd and 4th Year CSE students"
                  value={extractedData.targetAudience || ''}
                  onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-purple-950 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-purple-950 dark:text-slate-300 mb-1">
                  Organized Description / Summary
                </label>
                <textarea
                  rows={3}
                  value={extractedData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm text-purple-950 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-pink-300 outline-none resize-none"
                />
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ← Back to Raw Text
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Confirm & Save Announcement'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
