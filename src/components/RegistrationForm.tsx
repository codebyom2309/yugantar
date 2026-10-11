'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Info,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  Edit2,
  Copy,
  Trash2,
  ExternalLink,
  QrCode,
  Sparkles,
  UploadCloud,
  FileImage,
  FileText,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import type { RegistrationFormConfig, FormField } from '@/data/registrationForms';
import confetti from 'canvas-confetti';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type SubmissionState =
  | 'idle'
  | 'submitting'
  | 'submitted'
  | 'failed'
  | 'unknown';

interface SubmissionResult {
  status: string;
  registrationId?: string;
  message?: string;
  evidence?: string;
  errors?: Record<string, string>;
  error?: string;
  duplicate?: boolean;
}

interface StepDefinition {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  fieldKeys: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDraftKey(slug: string): string {
  return `yugantar_draft_${slug}`;
}

function saveDraft(slug: string, values: Record<string, string>): void {
  try {
    const safe = { ...values };
    delete safe.paymentId;
    localStorage.setItem(getDraftKey(slug), JSON.stringify(safe));
  } catch {
    // localStorage may be disabled
  }
}

function loadDraft(slug: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(getDraftKey(slug));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function clearDraft(slug: string): void {
  try {
    localStorage.removeItem(getDraftKey(slug));
  } catch {
    // noop
  }
}

function generateIdempotencyKey(slug: string, email: string): string {
  const base = `${slug}::${email}::${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `${slug}_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// Searchable College Select Component
// ---------------------------------------------------------------------------

function SearchableCollegeSelect({
  value,
  options,
  error,
  onChange,
}: {
  value: string;
  options: readonly string[];
  error?: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isOther, setIsOther] = useState(
    Boolean(value && !options.includes(value as any) && value !== 'Other')
  );
  const [customCollege, setCustomCollege] = useState(
    options.includes(value as any) ? '' : value
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const handleSelectOption = (opt: string) => {
    if (opt === 'Other') {
      setIsOther(true);
      onChange(customCollege || 'Other');
    } else {
      setIsOther(false);
      onChange(opt);
    }
    setIsOpen(false);
    setSearch('');
  };

  const handleCustomCollegeChange = (text: string) => {
    setCustomCollege(text);
    onChange(text || 'Other');
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 rounded-xl bg-white border text-left text-sm transition-all flex items-center justify-between ${
            error
              ? 'border-red-400 bg-red-50/20'
              : 'border-[#DCE5F2] hover:border-[#B8D5F8]'
          } ${value ? 'text-[#172B49] font-medium' : 'text-[#8CA0BA]'}`}
        >
          <span className="truncate">
            {isOther
              ? `Other: ${customCollege || 'Custom College'}`
              : value || 'Select or Search College / Institution...'}
          </span>
          <ChevronDown className="w-4 h-4 text-[#8CA0BA] shrink-0 ml-2" />
        </button>

        {isOpen && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 p-2 rounded-2xl bg-white border border-[#DCE5F2] shadow-xl max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8CA0BA]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search colleges (PCE, VNIT, YCCE...)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] focus:outline-none focus:border-[#4B91E8] text-[#172B49]"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto space-y-1 pr-1 flex-1">
              {filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full px-3 py-2 text-xs rounded-lg text-left flex items-center justify-between transition-colors ${
                    value === opt || (opt === 'Other' && isOther)
                      ? 'bg-[#EDF5FC] text-[#4B91E8] font-bold'
                      : 'hover:bg-[#F8FAFD] text-[#172B49]'
                  }`}
                >
                  <span>{opt}</span>
                  {(value === opt || (opt === 'Other' && isOther)) && (
                    <Check className="w-3.5 h-3.5 text-[#4B91E8]" />
                  )}
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="py-3 text-center text-xs text-[#8CA0BA]">
                  No matching colleges. Choose &apos;Other&apos; below.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isOther && (
        <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] space-y-1 animate-in fade-in duration-200">
          <label className="text-[11px] font-mono text-[#60728A] block">
            Enter your college / institution full name:
          </label>
          <input
            type="text"
            value={customCollege}
            onChange={(e) => handleCustomCollegeChange(e.target.value)}
            placeholder="e.g., Government Polytechnic, Nagpur"
            className="w-full px-3.5 py-2 text-xs rounded-lg bg-white border border-[#DCE5F2] text-[#172B49] focus:outline-none focus:border-[#4B91E8]"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cloudinary Payment Screenshot Upload Component
// ---------------------------------------------------------------------------

function PaymentProofUploadField({
  field,
  value,
  error,
  competitionSlug,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  competitionSlug: string;
  onChange: (key: string, value: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadAccount, setUploadAccount] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (8MB max)
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds 8MB. Please compress or select a smaller image.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('competitionSlug', competitionSlug);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Upload to Cloudinary failed.');
      }

      setUploadAccount(data.account || 'Configured');
      onChange(field.key, data.url);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Failed to upload screenshot. You may paste a Google Drive link.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(field.key, '');
    setUploadError(null);
    setUploadAccount(null);
  };

  const isCloudinaryUrl = value && value.includes('cloudinary.com');

  return (
    <div className="space-y-2.5" id={`field-${field.key}`}>
      <label className="flex items-center gap-1.5 text-xs font-bold text-[#172B49]">
        {field.label}
        {field.required && <span className="text-[#E06573]">*</span>}
      </label>

      {/* Hidden Native File Input (accepts camera/gallery on mobile) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        id="payment-screenshot-input"
      />

      {/* Upload State 1: File Already Uploaded or URL Set */}
      {value ? (
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#172B49] block truncate">
                  Payment Proof Attached
                </span>
                <span className="text-[10px] font-mono text-emerald-700 block truncate">
                  {isCloudinaryUrl ? '✓ Verified on Cloudinary Storage' : '✓ External Link Configured'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFD] hover:bg-[#EDF5FC] text-[#4B91E8] text-[11px] font-mono font-bold border border-[#DCE5F2] transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg bg-[#F8FAFD] hover:bg-red-50 text-[#8CA0BA] hover:text-red-600 transition-colors"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thumbnail preview if it's an image link */}
          {isCloudinaryUrl && (
            <div className="relative h-32 w-full rounded-xl overflow-hidden bg-[#F8FAFD] border border-[#E2E8F0]">
              <img
                src={value}
                alt="Payment screenshot preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="text-[10px] font-mono text-[#8CA0BA] truncate">
            Asset URL: {value}
          </div>
        </div>
      ) : (
        /* Upload State 2: Upload Area */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`p-5 sm:p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
            isUploading
              ? 'bg-[#EDF5FC]/50 border-[#4B91E8] cursor-wait'
              : error || uploadError
              ? 'bg-red-50/20 border-red-300 hover:border-red-400'
              : 'bg-[#F8FAFD] border-[#DCE5F2] hover:bg-white hover:border-[#4B91E8]'
          }`}
        >
          {isUploading ? (
            <div className="py-2 space-y-2">
              <Loader2 className="w-7 h-7 text-[#4B91E8] animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#172B49]">
                Uploading Screenshot to Cloudinary...
              </p>
              <p className="text-[11px] font-mono text-[#8CA0BA]">
                Storing in secure competition vault
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#DCE5F2] flex items-center justify-center mx-auto text-[#4B91E8] shadow-2xs">
                <UploadCloud className="w-5 h-5" />
              </div>

              <div>
                <p className="text-xs font-bold text-[#172B49]">
                  <span className="text-[#4B91E8] underline underline-offset-2">Choose screenshot</span> or take photo
                </p>
                <p className="text-[11px] text-[#8CA0BA] pt-0.5">
                  JPEG, PNG, WebP or PDF (up to 8MB)
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#DCE5F2] text-[10px] font-mono text-[#60728A]">
                <ShieldCheck className="w-3 h-3 text-[#2F855A]" />
                <span>Deterministic Dual Cloudinary Account Vault</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Link Input Toggle Fallback */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-[11px] font-mono text-[#4B91E8] hover:underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showManualUrl ? 'Hide manual link input' : 'Prefer pasting a Google Drive link?'}</span>
        </button>

        {showManualUrl && (
          <div className="mt-2 p-3 rounded-xl bg-white border border-[#DCE5F2] space-y-1.5 animate-in fade-in duration-200">
            <label className="text-[11px] font-mono text-[#60728A] block">
              Direct Google Drive / Imgur share link:
            </label>
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-[#F8FAFD] border border-[#DCE5F2] text-[#172B49] focus:outline-none focus:border-[#4B91E8]"
            />
          </div>
        )}
      </div>

      {(error || uploadError) && (
        <p className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error || uploadError}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standard Form Field Input
// ---------------------------------------------------------------------------

function FormFieldInput({
  field,
  value,
  error,
  competitionSlug,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  competitionSlug: string;
  onChange: (key: string, value: string) => void;
}) {
  const baseInputClass = `w-full px-4 py-3 rounded-xl bg-white border text-sm text-[#172B49] font-normal placeholder:text-[#8CA0BA] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4B91E8]/20 focus:border-[#4B91E8] ${
    error
      ? 'border-red-400 bg-red-50/20 focus:ring-red-400/20 focus:border-red-400'
      : 'border-[#DCE5F2] hover:border-[#B8D5F8]'
  }`;

  // Custom Payment Screenshot Upload
  if (field.key === 'paymentProof') {
    return (
      <PaymentProofUploadField
        field={field}
        value={value}
        error={error}
        competitionSlug={competitionSlug}
        onChange={onChange}
      />
    );
  }

  // Custom Searchable College
  if (field.type === 'select' && field.key.toLowerCase().includes('college') && field.options) {
    return (
      <div className="space-y-1.5" id={`field-${field.key}`}>
        <label className="flex items-center gap-1.5 text-xs font-bold text-[#172B49]">
          {field.label}
          {field.required && <span className="text-[#E06573]">*</span>}
        </label>
        <SearchableCollegeSelect
          value={value}
          options={field.options}
          error={error}
          onChange={(val) => onChange(field.key, val)}
        />
        {error && (
          <p className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5" id={`field-${field.key}`}>
      <label className="flex items-center gap-1.5 text-xs font-bold text-[#172B49]">
        {field.label}
        {field.required && <span className="text-[#E06573]">*</span>}
      </label>

      {field.type === 'select' && field.options ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${baseInputClass} appearance-none pr-10 cursor-pointer`}
            aria-invalid={!!error}
          >
            <option value="">Select {field.label}...</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8CA0BA] pointer-events-none" />
        </div>
      ) : field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={`${baseInputClass} min-h-[90px] resize-y`}
          placeholder={field.placeholder}
          aria-invalid={!!error}
        />
      ) : (
        <input
          type={
            field.type === 'tel'
              ? 'tel'
              : field.type === 'email'
              ? 'email'
              : field.type === 'url'
              ? 'url'
              : 'text'
          }
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={baseInputClass}
          placeholder={field.placeholder}
          aria-invalid={!!error}
        />
      )}

      {field.helpText && !error && (
        <p className="flex items-start gap-1.5 text-[11px] text-[#7E93AC] leading-snug">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          {field.helpText}
        </p>
      )}

      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Multi-Step Registration Form
// ---------------------------------------------------------------------------

export default function RegistrationForm({
  config,
  accentColor = '#E07A43',
}: {
  config: RegistrationFormConfig;
  accentColor?: string;
}) {
  const teamSizeField = config.fields.find((f) => f.key === 'teamSize');
  const availableTeamSizes = teamSizeField?.options || ['1', '2', '3', '4'];
  const defaultTeamSize = String(availableTeamSizes[0] || '1');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({
    teamSize: defaultTeamSize,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const submitLockRef = useRef(false);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft(config.competitionSlug);
    if (Object.keys(draft).length > 0) {
      setValues((prev) => ({ ...prev, ...draft }));
      setIsDraftSaved(true);
    }
  }, [config.competitionSlug]);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (submissionState === 'submitted') return;
    const timer = setTimeout(() => {
      saveDraft(config.competitionSlug, values);
      setIsDraftSaved(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [values, config.competitionSlug, submissionState]);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  const handleClearDraft = () => {
    if (confirm('Clear saved draft and reset all fields?')) {
      clearDraft(config.competitionSlug);
      setValues({ teamSize: defaultTeamSize });
      setErrors({});
      setAcknowledged(false);
      setIsDraftSaved(false);
      setCurrentStepIndex(0);
    }
  };

  // -------------------------------------------------------------------------
  // Construct Guided Steps from Config
  // -------------------------------------------------------------------------
  const steps: StepDefinition[] = useMemo(() => {
    const leaderKeys = config.fields
      .filter((f) =>
        f.group?.includes('Leader') ||
        f.group?.includes('Participant') ||
        f.group?.includes('Candidate') ||
        f.group?.includes('Performer')
      )
      .map((f) => f.key);

    const trackKeys = config.fields
      .filter((f) =>
        f.group?.includes('Details') ||
        f.group?.includes('Project') ||
        f.group?.includes('Presentation') ||
        f.group?.includes('Competition') ||
        f.group?.includes('Idea') ||
        f.group?.includes('Poster') ||
        f.group?.includes('Squad Info') ||
        f.group?.includes('Performance') ||
        f.group?.includes('Academic') ||
        f.group?.includes('Professional')
      )
      .map((f) => f.key);

    const teamKeys = config.fields
      .filter((f) =>
        f.group?.includes('Team Member') ||
        f.group?.includes('Team Composition') ||
        f.group?.includes('Player 2') ||
        f.group?.includes('Player 3') ||
        f.group?.includes('Player 4') ||
        f.group?.includes('Squad Composition')
      )
      .map((f) => f.key);

    const paymentKeys = config.fields
      .filter((f) => f.group?.includes('Payment'))
      .map((f) => f.key);

    const resultSteps: StepDefinition[] = [];

    // Step 1: Participant / Leader Credentials
    resultSteps.push({
      id: 'leader',
      title: 'Participant Credentials',
      shortTitle: 'Lead Info',
      description: 'Enter your personal contact and academic information.',
      fieldKeys: leaderKeys.length > 0 ? leaderKeys : [config.fields[0]?.key || 'name'],
    });

    // Step 2: Track Specifics
    if (trackKeys.length > 0) {
      resultSteps.push({
        id: 'track',
        title: 'Competition Specifics',
        shortTitle: 'Track Info',
        description: 'Provide information regarding your submission theme and deliverables.',
        fieldKeys: trackKeys,
      });
    }

    // Step 3: Team Members (if team competition)
    if (teamKeys.length > 0) {
      resultSteps.push({
        id: 'team',
        title: 'Team Composition',
        shortTitle: 'Team Members',
        description: 'Select team size and specify registered member details.',
        fieldKeys: teamKeys,
      });
    }

    // Step 4: Payment, Review & Submit
    resultSteps.push({
      id: 'payment_review',
      title: 'Payment & Final Review',
      shortTitle: 'Review & Pay',
      description: 'Upload payment screenshot and verify all registration details.',
      fieldKeys: paymentKeys,
    });

    return resultSteps;
  }, [config]);

  const currentStep = steps[currentStepIndex] || steps[0];

  // Visible fields in current step
  const currentStepFields = useMemo(() => {
    return config.fields.filter((field) => {
      if (!currentStep.fieldKeys.includes(field.key)) return false;
      if (field.showWhen) {
        const depValue = values[field.showWhen.field] || '';
        return field.showWhen.values.includes(depValue);
      }
      return true;
    });
  }, [config.fields, currentStep, values]);

  // -------------------------------------------------------------------------
  // Step Validation
  // -------------------------------------------------------------------------
  const validateStep = (stepIdx: number): boolean => {
    const step = steps[stepIdx];
    if (!step) return true;

    const stepFields = config.fields.filter((field) => {
      if (!step.fieldKeys.includes(field.key)) return false;
      if (field.showWhen) {
        const depValue = values[field.showWhen.field] || '';
        return field.showWhen.values.includes(depValue);
      }
      return true;
    });

    const stepErrors: Record<string, string> = {};

    for (const field of stepFields) {
      const val = values[field.key]?.trim() || '';

      if (field.required && !val) {
        stepErrors[field.key] = `${field.label} is required.`;
        continue;
      }

      if (val && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          stepErrors[field.key] = 'Please enter a valid email address.';
        }
      }

      if (val && field.type === 'tel' && field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(val)) {
          stepErrors[field.key] = 'Please enter a valid phone number (10-15 digits).';
        }
      }

      if (val && field.type === 'url' && field.key !== 'paymentProof') {
        try {
          new URL(val);
        } catch {
          stepErrors[field.key] = 'Please enter a valid URL (e.g., https://drive.google.com/...)';
        }
      }
    }

    // If on the final step, check acknowledgment
    if (stepIdx === steps.length - 1 && !acknowledged) {
      stepErrors['_acknowledgment'] = 'You must acknowledge the competition guidelines to proceed.';
    }

    setErrors((prev) => ({ ...prev, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStepIndex)) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        window.scrollTo({ top: 120, behavior: 'smooth' });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handleJumpToStep = (targetIndex: number) => {
    if (targetIndex < currentStepIndex) {
      setCurrentStepIndex(targetIndex);
    } else {
      if (validateStep(currentStepIndex)) {
        setCurrentStepIndex(targetIndex);
      }
    }
  };

  // -------------------------------------------------------------------------
  // Final Form Submission
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitLockRef.current) return;

    if (!validateStep(currentStepIndex)) {
      return;
    }

    submitLockRef.current = true;
    setSubmissionState('submitting');
    setSubmissionResult(null);

    const email =
      values.leaderEmail ||
      values.email ||
      values.contactEmail ||
      'anonymous@yugantar.in';
    const idempotencyKey = generateIdempotencyKey(config.competitionSlug, email);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitionSlug: config.competitionSlug,
          formValues: values,
          idempotencyKey,
        }),
      });

      const data: SubmissionResult = await response.json();

      if (response.ok && data.status === 'submitted') {
        setSubmissionState('submitted');
        setSubmissionResult(data);
        clearDraft(config.competitionSlug);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // confetti optional
        }
      } else if (response.ok && data.status === 'submission_unknown') {
        setSubmissionState('unknown');
        setSubmissionResult(data);
      } else {
        setSubmissionState('failed');
        setSubmissionResult(data);
      }
    } catch (err: any) {
      setSubmissionState('failed');
      setSubmissionResult({
        status: 'failed',
        error: err.message || 'Network communication failure. Please check your connection.',
      });
    } finally {
      submitLockRef.current = false;
    }
  };

  const handleCopyId = () => {
    if (submissionResult?.registrationId) {
      navigator.clipboard.writeText(submissionResult.registrationId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER: Confirmed Success View
  // -------------------------------------------------------------------------
  if (submissionState === 'submitted') {
    return (
      <div className="py-6 sm:py-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            OFFICIAL CONFIRMATION VERIFIED
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#172B49]">
            Registration Successfully Recorded
          </h3>
          <p className="text-xs sm:text-sm text-[#60728A] max-w-md mx-auto leading-relaxed">
            Your registration has been saved in our database and successfully recorded into the official Google Form &amp; Sheets registry.
          </p>
        </div>

        {submissionResult?.registrationId && (
          <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] max-w-sm mx-auto text-left space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
              Permanent Registration Tracking ID
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[#172B49] truncate">
                {submissionResult.registrationId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1.5 rounded-lg bg-white border border-[#DCE5F2] hover:bg-[#EDF5FC] text-[#4B91E8] text-xs font-mono font-bold transition-colors flex items-center gap-1 shrink-0"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-sm mx-auto">
          <Link
            href="/competitions"
            className="nexus-btn-ink px-6 py-3 text-xs font-bold gap-2 justify-center flex-1"
          >
            <span>Explore Other Arenas</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F5A16F]" />
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Failure View (Clean Retry with Preserved Data)
  // -------------------------------------------------------------------------
  if (submissionState === 'failed') {
    return (
      <div className="py-6 sm:py-8 space-y-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-display font-extrabold text-[#172B49]">
            Submission Could Not Be Completed
          </h3>
          <p className="text-xs sm:text-sm text-[#60728A] max-w-md mx-auto leading-relaxed">
            {submissionResult?.error ||
              'The submission could not be verified with Google Forms. All your entered answers have been safely preserved in your draft.'}
          </p>
        </div>

        {submissionResult?.registrationId && (
          <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs font-mono text-[#60728A] max-w-sm mx-auto">
            Diagnostic ID: {submissionResult.registrationId}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setSubmissionState('idle')}
            className="nexus-btn-sunset px-6 py-3 text-xs font-bold gap-2 justify-center flex-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Review &amp; Retry</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Unknown / Pending View
  // -------------------------------------------------------------------------
  if (submissionState === 'unknown') {
    return (
      <div className="py-6 sm:py-8 space-y-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-display font-extrabold text-[#172B49]">
            Registration Saved — Verification Pending
          </h3>
          <p className="text-xs sm:text-sm text-[#60728A] max-w-md mx-auto leading-relaxed">
            Your registration is stored in our database. The external Google Forms confirmation timed out. Please do not submit again.
          </p>
        </div>

        {submissionResult?.registrationId && (
          <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs font-mono text-[#60728A] max-w-sm mx-auto">
            Tracking ID: {submissionResult.registrationId}
          </div>
        )}

        <div className="pt-2 max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setSubmissionState('idle')}
            className="nexus-btn-secondary px-6 py-3 text-xs font-bold gap-2 w-full justify-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Return to Form</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: Guided Multi-Step Registration Form
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* =====================================================================
          STEPPER PROGRESS HEADER (Responsive for 320px - Desktop)
          ===================================================================== */}
      <div className="pb-4 border-b border-[#E2E8F0] space-y-3">
        {/* Desktop Step Badges */}
        <div className="hidden sm:grid grid-cols-4 gap-2">
          {steps.map((st, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => isCompleted && handleJumpToStep(idx)}
                disabled={!isCompleted && !isCurrent}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-white border-[#4B91E8] shadow-xs'
                    : isCompleted
                    ? 'bg-[#EDF5FC] border-[#B8D5F8] text-[#4B91E8] cursor-pointer'
                    : 'bg-[#F8FAFD] border-transparent text-[#8CA0BA] opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-[#172B49] text-white'
                      : isCompleted
                      ? 'bg-[#4B91E8] text-white'
                      : 'bg-[#E2E8F0] text-[#8CA0BA]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="truncate">
                  <span className="text-[10px] font-mono uppercase block text-[#8CA0BA] leading-none">
                    Step {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#172B49] truncate block">
                    {st.shortTitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Compact Progress Bar */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-[#4B91E8]">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="font-bold text-[#172B49]">
              {currentStep.title}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4B91E8] to-[#E07A43] transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Step Title & Subtitle */}
        <div className="pt-1 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-display font-extrabold text-[#172B49]">
              {currentStep.title}
            </h3>
            <p className="text-xs text-[#60728A]">{currentStep.description}</p>
          </div>

          {isDraftSaved && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full hidden sm:inline-flex items-center gap-1">
                ✓ Draft saved
              </span>
              <button
                type="button"
                onClick={handleClearDraft}
                title="Clear Draft"
                className="text-[10px] font-mono text-[#8CA0BA] hover:text-red-600 p-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          STEP BODY: FIELD RENDERING
          ===================================================================== */}
      <div className="space-y-5">
        {/* If team step, show dynamic team size selector based on config options */}
        {currentStep.id === 'team' && (
          <div className="p-4 rounded-2xl bg-[#EDF5FC] border border-[#DCE5F2] space-y-3">
            <label className="text-xs font-bold text-[#172B49] block">
              Select Number of Members in Team / Squad:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTeamSizes.map((size) => {
                const isSelected = (values.teamSize || defaultTeamSize) === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleFieldChange('teamSize', size)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-[#172B49] text-white shadow-xs'
                        : 'bg-white text-[#60728A] hover:bg-white/80 border border-[#DCE5F2]'
                    }`}
                  >
                    {size === '1' ? 'Solo (1 Member)' : `${size} Members`}
                  </button>
                );
              })}
            </div>
            {values.teamSize === '1' && (
              <p className="text-xs text-[#4B91E8] font-medium pt-1">
                ℹ️ Participating as Solo Participant. Additional member fields are omitted.
              </p>
            )}
          </div>
        )}

        {/* Regular fields for this step */}
        {currentStepFields.map((field) => (
          <FormFieldInput
            key={field.key}
            field={field}
            value={values[field.key] || ''}
            error={errors[field.key]}
            competitionSlug={config.competitionSlug}
            onChange={handleFieldChange}
          />
        ))}

        {/* =====================================================================
            FINAL STEP ONLY: PAYMENT REVIEW & UNDERTAKING
            ===================================================================== */}
        {currentStepIndex === steps.length - 1 && (
          <div className="space-y-6 pt-4 border-t border-[#E2E8F0]">
            {/* Payment Info Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8F2] border border-[#FFE0CE] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E07A43] uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>Payment Verification Instructions</span>
              </div>
              <p className="text-xs text-[#60728A] leading-relaxed">
                Scan the department QR code or complete your UPI transfer. Enter the 12-digit UPI / UTR Transaction ID above and upload your payment screenshot. Files are uploaded directly to our dedicated Cloudinary infrastructure.
              </p>
            </div>

            {/* Dossier Review Card */}
            <div className="p-5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B49]">
                  Registration Summary Dossier
                </h4>
                <span className="text-[10px] font-mono text-[#8CA0BA]">
                  Review before submitting
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Leader Summary */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E2E8F0]/60">
                  <div>
                    <span className="text-[#8CA0BA] block text-[11px]">Team Leader / Participant:</span>
                    <span className="font-bold text-[#172B49]">
                      {values.leaderName || values.candidateName || values.performerName || 'Not specified'}
                    </span>
                    <span className="text-[#60728A] block text-[11px]">
                      {values.leaderEmail || values.email} · {values.leaderPhone || values.contactNumber}
                    </span>
                    <span className="text-[#60728A] block text-[11px]">
                      {values.leaderCollege || values.collegeName} ({values.leaderBranch || values.branch})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJumpToStep(0)}
                    className="text-[#4B91E8] hover:underline text-[11px] font-mono font-bold flex items-center gap-1 shrink-0"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                </div>

                {/* Track Details Summary */}
                {(values.projectTitle || values.presentationTitle || values.ideaTitle || values.posterTitle || values.teamName || values.squadName) && (
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E2E8F0]/60">
                    <div>
                      <span className="text-[#8CA0BA] block text-[11px]">Submission Focus:</span>
                      <span className="font-bold text-[#172B49]">
                        {values.projectTitle || values.presentationTitle || values.ideaTitle || values.posterTitle || values.teamName || values.squadName}
                      </span>
                      {values.projectTheme && (
                        <span className="text-[#60728A] block text-[11px]">
                          Theme: {values.projectTheme}
                        </span>
                      )}
                    </div>
                    {steps.some((s) => s.id === 'track') && (
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(1)}
                        className="text-[#4B91E8] hover:underline text-[11px] font-mono font-bold flex items-center gap-1 shrink-0"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>
                )}

                {/* Team Size */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[#8CA0BA] block text-[11px]">Team Composition:</span>
                    <span className="font-bold text-[#172B49]">
                      {values.teamSize === '1' ? 'Solo (1 Member)' : `${values.teamSize || defaultTeamSize} Members`}
                    </span>
                  </div>
                  {steps.some((s) => s.id === 'team') && (
                    <button
                      type="button"
                      onClick={() => handleJumpToStep(2)}
                      className="text-[#4B91E8] hover:underline text-[11px] font-mono font-bold flex items-center gap-1 shrink-0"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Rules & Undertaking Checkbox */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                errors['_acknowledgment']
                  ? 'bg-red-50/40 border-red-300'
                  : 'bg-white border-[#DCE5F2]'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => {
                    setAcknowledged(e.target.checked);
                    if (e.target.checked) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next['_acknowledgment'];
                        return next;
                      });
                    }
                  }}
                  className="w-4 h-4 mt-0.5 rounded border-[#DCE5F2] text-[#4B91E8] focus:ring-[#4B91E8] shrink-0"
                />
                <span className="text-xs text-[#172B49] leading-relaxed">
                  {config.acknowledgmentLabel}
                </span>
              </label>

              {errors['_acknowledgment'] && (
                <p className="flex items-center gap-1 text-[11px] text-red-600 font-medium pt-2 pl-7">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors['_acknowledgment']}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          STEP FOOTER NAVIGATION ACTIONS
          ===================================================================== */}
      <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
        {currentStepIndex > 0 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            className="nexus-btn-secondary px-5 py-3 text-xs font-bold gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {currentStepIndex < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="nexus-btn-ink px-6 py-3 text-xs font-bold gap-2 ml-auto"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F5A16F]" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submissionState === 'submitting'}
            className="nexus-btn-sunset px-8 py-3.5 text-xs sm:text-sm font-bold gap-2 ml-auto shadow-md disabled:opacity-60"
          >
            {submissionState === 'submitting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording &amp; Syncing...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Official Registration</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
