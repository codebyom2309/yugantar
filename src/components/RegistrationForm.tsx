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
  Printer,
  Download,
} from 'lucide-react';
import type { RegistrationFormConfig, FormField } from '@/data/registrationForms';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

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
  passToken?: string;
  verificationToken?: string;
  paymentStatus?: string;
  whatsappLink?: string;
  confirmationInstructions?: string;
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
  const baseInputClass = `w-full px-4 py-3 min-h-[48px] rounded-xl bg-white border text-sm text-[#172B49] font-medium placeholder:text-[#8CA0BA] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4B91E8]/20 focus:border-[#4B91E8] ${
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
        <label className="flex items-center justify-between text-xs font-bold text-[#172B49]">
          <span className="flex items-center gap-1.5">{field.label}</span>
          {field.required ? (
            <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              Required
            </span>
          ) : (
            <span className="text-[10px] font-mono text-[#8CA0BA] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
              Optional
            </span>
          )}
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
      <label className="flex items-center justify-between text-xs font-bold text-[#172B49]">
        <span className="flex items-center gap-1.5">{field.label}</span>
        {field.required ? (
          <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            Required
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[#8CA0BA] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
            Optional
          </span>
        )}
      </label>

      {field.type === 'select' && field.options ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            style={{ colorScheme: 'light' }}
            className={`${baseInputClass} appearance-none pr-10 cursor-pointer bg-white text-[#172B49]`}
            aria-invalid={!!error}
          >
            <option value="" style={{ colorScheme: 'light' }} className="bg-white text-[#172B49]">
              Select {field.label}...
            </option>
            {field.options.map((opt) => (
              <option key={opt} value={opt} style={{ colorScheme: 'light' }} className="bg-white text-[#172B49]">
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8CA0BA] pointer-events-none" />
        </div>
      ) : field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={`${baseInputClass} min-h-[96px] resize-y`}
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

export interface CompetitionPaymentConfig {
  isPaid?: boolean;
  registrationFee?: string;
  qrCodeUrl?: string;
  upiId?: string;
  paymentUrl?: string;
  paymentInstructions?: string;
  requireUtr?: boolean;
  requireScreenshot?: boolean;
  whatsappLink?: string;
  confirmationInstructions?: string;
  qrMode?: 'upload' | 'generate' | string;
  payeeName?: string;
}

export default function RegistrationForm({
  config,
  accentColor = '#E07A43',
  competition,
}: {
  config: RegistrationFormConfig;
  accentColor?: string;
  competition?: CompetitionPaymentConfig;
}) {
  const isPaid = Boolean(competition?.isPaid);
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
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string | null>(null);
  const [useLeaderDetails, setUseLeaderDetails] = useState<Record<number, boolean>>({});
  const submitLockRef = useRef(false);

  // Generate dynamic UPI QR Code if in generate mode or if uploaded QR is absent
  useEffect(() => {
    if (isPaid && competition?.upiId) {
      const isGenerateMode = competition.qrMode === 'generate' || !competition.qrCodeUrl;
      if (isGenerateMode) {
        const feeDigits = (competition.registrationFee || '').replace(/[^0-9]/g, '');
        const payee = competition.payeeName || 'TELE-ERA YUGANTAR 2026';
        const upiUri = `upi://pay?pa=${competition.upiId}&pn=${encodeURIComponent(payee)}${feeDigits ? `&am=${feeDigits}` : ''}&cu=INR`;
        QRCode.toDataURL(upiUri, {
          width: 256,
          margin: 2,
          color: {
            dark: '#172B49',
            light: '#FFFFFF',
          },
        })
          .then((url) => setDynamicQrUrl(url))
          .catch((err) => console.error('Failed to generate dynamic UPI QR code:', err));
      }
    }
  }, [isPaid, competition?.upiId, competition?.payeeName, competition?.registrationFee, competition?.qrMode, competition?.qrCodeUrl]);

  // Handle toggling "Use team leader's details" for member 2, 3, 4
  const handleToggleLeaderDetails = (memberIdx: number, checked: boolean) => {
    setUseLeaderDetails((prev) => ({ ...prev, [memberIdx]: checked }));
    if (checked) {
      const lCollege =
        values.leaderCollege ||
        values.collegeName ||
        values.candidateCollege ||
        values.squadLeaderCollege ||
        '';
      const lBranch =
        values.leaderBranch ||
        values.branch ||
        values.candidateBranch ||
        values.squadLeaderBranch ||
        '';
      const lSemester =
        values.leaderSemester ||
        values.semester ||
        values.candidateSemester ||
        values.squadLeaderSemester ||
        '';

      setValues((prev) => ({
        ...prev,
        [`member${memberIdx}College`]: lCollege,
        [`member${memberIdx}Branch`]: lBranch,
        [`member${memberIdx}Semester`]: lSemester,
        [`player${memberIdx}College`]: lCollege,
        [`player${memberIdx}Branch`]: lBranch,
        [`player${memberIdx}Semester`]: lSemester,
      }));
    }
  };

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
        f.group?.includes('Lead') ||
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

    const paymentKeys = isPaid
      ? config.fields
          .filter((f) => {
            if (!f.group?.includes('Payment')) return false;
            if (f.key === 'paymentId' && competition?.requireUtr === false) return false;
            if (f.key === 'paymentProof' && competition?.requireScreenshot === false) return false;
            return true;
          })
          .map((f) => f.key)
      : [];

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
      id: isPaid ? 'payment_review' : 'review_submit',
      title: isPaid ? 'Payment & Final Review' : 'Final Review & Confirmation',
      shortTitle: isPaid ? 'Review & Pay' : 'Review & Submit',
      description: isPaid
        ? 'Complete UPI fee payment, attach verification proof, and confirm submission.'
        : 'Verify all entered details and confirm your official event registration.',
      fieldKeys: paymentKeys,
    });

    return resultSteps;
  }, [config, isPaid, competition]);

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
      // If free track, bypass payment fields requirement
      if (!isPaid && (field.key === 'paymentId' || field.key === 'paymentProof' || field.group === 'Payment')) {
        continue;
      }
      if (isPaid) {
        if (field.key === 'paymentId' && competition?.requireUtr === false) continue;
        if (field.key === 'paymentProof' && competition?.requireScreenshot === false) continue;
      }

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

      if (response.ok && (data.status === 'submitted' || data.status === 'confirmed')) {
        setSubmissionState('submitted');
        setSubmissionResult(data);
        clearDraft(config.competitionSlug);

        if (data.passToken && data.registrationId) {
          try {
            localStorage.setItem(`yugantar_pass_token_${data.registrationId}`, data.passToken);
          } catch {
            // localStorage optional
          }
        }

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
    const isFree = submissionResult?.paymentStatus === 'free';
    const regId = submissionResult?.registrationId;
    const token = submissionResult?.passToken;
    const pdfDownloadUrl = `/api/pass/${regId}/pdf${token ? `?token=${token}` : ''}`;
    const digitalPassUrl = `/pass/${regId}${token ? `?token=${token}` : ''}`;
    const rawWhatsapp = submissionResult?.whatsappLink || competition?.whatsappLink || '';
    const hasValidWhatsapp = Boolean(rawWhatsapp && (rawWhatsapp.startsWith('http://') || rawWhatsapp.startsWith('https://')));

    return (
      <div className="py-6 sm:py-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              OFFICIAL REGISTRATION RECORDED
            </span>
            <span
              className={`text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                isFree
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isFree ? 'FREE TRACK • SPOT CONFIRMED' : 'PAYMENT VERIFICATION PENDING'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#172B49]">
            {isFree ? 'Your Arena Spot is Confirmed!' : 'Registration Dossier Submitted!'}
          </h3>
          <p className="text-xs sm:text-sm text-[#60728A] max-w-md mx-auto leading-relaxed">
            {isFree
              ? 'Your registration has been securely recorded and synced to the Department Google Sheet. Download your official delegate pass below.'
              : 'Your registration has been recorded and synced to the Department Google Sheet. Your payment proof is under audit by festival coordinators.'}
          </p>
        </div>

        {/* Permanent Tracking ID Card */}
        {regId && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] max-w-md mx-auto text-left space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block tracking-wider">
                Official Registration Credential ID
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Recorded
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs sm:text-sm font-bold text-[#172B49] truncate select-all">
                {regId}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1.5 px-3 rounded-xl bg-white border border-[#DCE5F2] hover:bg-[#EDF5FC] text-[#4B91E8] text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons: Direct PDF Download + Digital Pass + WhatsApp */}
        <div className="space-y-3 max-w-md mx-auto pt-2">
          {regId && (
            <>
              <a
                href={pdfDownloadUrl}
                download={`YUGANTAR-2026-PASS-${regId.substring(0, 8)}.pdf`}
                className="w-full flex items-center justify-center gap-2.5 min-h-[48px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#172B49] via-[#244372] to-[#172B49] hover:opacity-95 text-white text-xs sm:text-sm font-mono font-bold shadow-md transition"
              >
                <Download className="w-4 h-4 text-[#F5A16F]" />
                <span>DOWNLOAD REGISTRATION PASS (PDF)</span>
                <ArrowRight className="w-4 h-4 ml-1 text-[#F5A16F]" />
              </a>

              <Link
                href={digitalPassUrl}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:bg-[#EDF5FC] text-[#172B49] text-xs font-mono font-bold transition shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#4B91E8]" />
                <span>VIEW DIGITAL PASS IN BROWSER</span>
              </Link>
            </>
          )}

          {hasValidWhatsapp && (
            <div className="pt-1">
              <a
                href={rawWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 min-h-[48px] px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs sm:text-sm font-mono font-bold shadow-xs transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>JOIN OFFICIAL WHATSAPP COMMUNITY</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
              <span className="text-[10px] text-[#8CA0BA] block mt-1.5">
                Official coordinator WhatsApp group invite link for track schedule updates
              </span>
            </div>
          )}

          <Link
            href="/competitions"
            className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-white border border-[#DCE5F2] text-[#60728A] hover:text-[#172B49] text-xs font-mono font-medium hover:bg-[#F8FAFD] transition"
          >
            <span>Explore Other Competition Arenas</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#8CA0BA]" />
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
            className="nexus-btn-sunset px-6 py-3 min-h-[48px] text-xs font-bold gap-2 justify-center flex-1"
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
            className="nexus-btn-secondary px-6 py-3 min-h-[48px] text-xs font-bold gap-2 w-full justify-center"
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
          STEPPER PROGRESS HEADER (Dynamically adapted to steps.length)
          ===================================================================== */}
      <div className="pb-4 border-b border-[#E2E8F0] space-y-3">
        {/* Desktop Step Badges */}
        <div
          className="hidden sm:grid gap-2"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((st, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            const stepHasErrors = st.fieldKeys.some((k) => Boolean(errors[k])) ||
              (st.id.includes('review') && Boolean(errors['_acknowledgment']));

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
                    ? 'bg-[#EDF5FC] border-[#B8D5F8] text-[#4B91E8] cursor-pointer hover:bg-[#E3EFFB]'
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
                <div className="truncate flex-1">
                  <span className="text-[10px] font-mono uppercase block text-[#8CA0BA] leading-none">
                    Step {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#172B49] truncate block">
                    {st.shortTitle}
                  </span>
                </div>
                {stepHasErrors && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Validation errors in this step" />
                )}
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
            <span className="font-bold text-[#172B49] truncate max-w-[200px]">
              {currentStep.title}
            </span>
          </div>
          <div className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
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
                className="text-[10px] font-mono text-[#8CA0BA] hover:text-red-600 p-1.5 transition-colors rounded-lg hover:bg-red-50"
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
          <div className="p-4 sm:p-5 rounded-2xl bg-[#EDF5FC] border border-[#DCE5F2] space-y-3">
            <label className="text-xs font-bold text-[#172B49] block">
              Select Number of Members in Team / Squad:
            </label>
            <div className="flex flex-wrap gap-2.5">
              {availableTeamSizes.map((size) => {
                const isSelected = (values.teamSize || defaultTeamSize) === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleFieldChange('teamSize', size)}
                    className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
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
        {currentStepFields.map((field) => {
          const memberMatch = currentStep.id === 'team' ? field.key.match(/(?:member|player)(\d)Name/i) : null;
          const memberIdx = memberMatch ? parseInt(memberMatch[1], 10) : null;

          return (
            <React.Fragment key={field.key}>
              {memberIdx && (
                <div className="pt-3 pb-1">
                  <div className="p-4 rounded-2xl bg-[#EDF5FC] border border-[#B8D5F8] space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B49] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-[#172B49] text-white flex items-center justify-center text-[10px]">
                          0{memberIdx}
                        </span>
                        Member 0{memberIdx} Details
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-[#1E5FA8] bg-white px-2 py-0.5 rounded-md border border-[#B8D5F8]">
                        Independent Validation
                      </span>
                    </div>

                    <label className="flex items-start sm:items-center gap-3 p-2.5 rounded-xl bg-white/80 border border-[#DCE5F2] hover:bg-white transition cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(useLeaderDetails[memberIdx])}
                        onChange={(e) => handleToggleLeaderDetails(memberIdx, e.target.checked)}
                        className="w-4 h-4 mt-0.5 sm:mt-0 rounded text-[#4B91E8] border-[#DCE5F2] focus:ring-[#4B91E8] cursor-pointer shrink-0"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-[#172B49] block">
                          Autofill College, Branch &amp; Semester from Team Leader
                        </span>
                        <span className="text-[11px] text-[#60728A] block">
                          Copies leader&apos;s academic institution. Values remain individually editable below.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
              <FormFieldInput
                field={field}
                value={values[field.key] || ''}
                error={errors[field.key]}
                competitionSlug={config.competitionSlug}
                onChange={handleFieldChange}
              />
            </React.Fragment>
          );
        })}

        {/* =====================================================================
            FINAL STEP ONLY: PAYMENT REVIEW & UNDERTAKING
            ===================================================================== */}
        {currentStepIndex === steps.length - 1 && (
          <div className="space-y-6 pt-4 border-t border-[#E2E8F0]">
            {/* Payment Section (Paid Tracks Only) */}
            {isPaid ? (
              <div className="p-4 sm:p-6 rounded-2xl bg-[#FFF8F2] border border-[#FFE0CE] space-y-4">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#E07A43] uppercase tracking-wider">
                    <QrCode className="w-4 h-4 text-[#E07A43]" />
                    <span>Official Payment Verification Sequence</span>
                  </div>
                  {competition?.registrationFee && (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#E07A43] text-white shadow-2xs">
                      Fee: {competition.registrationFee}
                    </span>
                  )}
                </div>

                {/* 5-Step Numbered Payment Walkthrough */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] font-mono text-[#60728A] pt-1 pb-1">
                  <div className="p-2 rounded-xl bg-white border border-[#FFE0CE]">
                    <span className="text-[#E07A43] font-bold block">1. Review Fee</span>
                    <span>{competition?.registrationFee || '₹300'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#FFE0CE]">
                    <span className="text-[#E07A43] font-bold block">2. Scan / Tap</span>
                    <span>QR or UPI Link</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#FFE0CE]">
                    <span className="text-[#E07A43] font-bold block">3. Transfer</span>
                    <span>Via UPI App</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#FFE0CE]">
                    <span className="text-[#E07A43] font-bold block">4. Enter UTR</span>
                    <span>12-Digit Ref ID</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#FFE0CE]">
                    <span className="text-[#E07A43] font-bold block">5. Attach Proof</span>
                    <span>Screenshot image</span>
                  </div>
                </div>

                {competition?.paymentInstructions ? (
                  <p className="text-xs text-[#60728A] leading-relaxed">
                    {competition.paymentInstructions}
                  </p>
                ) : (
                  <p className="text-xs text-[#60728A] leading-relaxed">
                    Scan the official department QR code below or use the UPI ID to complete your registration fee. Enter the 12-digit UTR Transaction ID and attach your payment screenshot.
                  </p>
                )}

                {/* QR and UPI ID Details */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {(competition?.qrCodeUrl || dynamicQrUrl) ? (
                    <div className="p-3 bg-white rounded-2xl border border-[#FFE0CE] shrink-0 text-center shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={competition?.qrMode === 'upload' && competition.qrCodeUrl ? competition.qrCodeUrl : (dynamicQrUrl || competition?.qrCodeUrl)}
                        alt="Payment QR Code"
                        className="w-32 h-32 object-contain mx-auto rounded-xl"
                      />
                      <span className="text-[10px] font-mono text-[#8CA0BA] block mt-1.5 font-bold">
                        {competition?.qrMode === 'upload' ? 'Official Department QR' : 'Dynamic UPI QR'}
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-800 space-y-1">
                      <span className="font-bold block">Admin Configuration Notice</span>
                      <span>Payment QR code is being generated or configured by coordinators. You may use the official UPI ID below to complete your fee.</span>
                    </div>
                  )}

                  <div className="space-y-2.5 flex-1 w-full text-left">
                    {competition?.payeeName && (
                      <div className="p-3 rounded-xl bg-white border border-[#FFE0CE]">
                        <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                          Official Payee Name
                        </span>
                        <span className="text-xs font-bold text-[#172B49]">
                          {competition.payeeName}
                        </span>
                      </div>
                    )}

                    {competition?.upiId && (
                      <div className="p-3 rounded-xl bg-white border border-[#FFE0CE] space-y-1">
                        <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                          Official UPI ID
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono font-bold text-[#172B49] select-all">
                            {competition.upiId}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              if (competition?.upiId) {
                                navigator.clipboard.writeText(competition.upiId);
                                setCopiedId(true);
                                setTimeout(() => setCopiedId(false), 2000);
                              }
                            }}
                            className="p-1.5 px-2.5 rounded-lg bg-[#FFF8F2] border border-[#FFE0CE] text-[#E07A43] hover:bg-[#FFE0CE] text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {competition?.upiId && (
                      <a
                        href={`upi://pay?pa=${competition.upiId}&pn=${encodeURIComponent(competition?.payeeName || 'YUGANTAR 2026')}${(competition.registrationFee || '').replace(/[^0-9]/g, '') ? `&am=${(competition.registrationFee || '').replace(/[^0-9]/g, '')}` : ''}&cu=INR`}
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] w-full px-4 py-2 rounded-xl bg-[#E07A43] text-white text-xs font-mono font-bold hover:bg-[#C96835] transition shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Pay directly via UPI App (Mobile)</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-1 text-[11px] font-mono text-[#8CA0BA] border-t border-[#FFE0CE]/60">
                  ℹ️ Note: Payment status is verified by coordinators against official bank statement UTR records before festival check-in.
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Free Registration Track</span>
                </div>
                <p className="text-xs text-[#60728A] leading-relaxed">
                  Registration for this competition arena is 100% free of charge. No payment verification, UTR number, or transaction screenshot is required. Simply review your submission details below and confirm.
                </p>
              </div>
            )}

            {/* Structured Dossier Review Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B49]">
                  Registration Summary Dossier
                </h4>
                <span className="text-[10px] font-mono text-[#8CA0BA]">
                  Review before final submission
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Card 1: Participant / Lead Info */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-3 text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#4B91E8]">
                      Participant / Leader
                    </span>
                    <button
                      type="button"
                      onClick={() => handleJumpToStep(0)}
                      className="text-[#4B91E8] hover:underline text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-[#172B49] text-sm block">
                      {values.leaderName || values.candidateName || values.performerName || values.name || 'Not specified'}
                    </span>
                    <span className="text-[#60728A] block break-all text-[11px]">
                      {values.leaderEmail || values.email || values.candidateEmail || 'No email entered'}
                    </span>
                    <span className="text-[#60728A] block text-[11px]">
                      {values.leaderPhone || values.contactNumber || values.candidatePhone || 'No phone entered'}
                    </span>
                    <span className="text-[#172B49] font-medium block pt-1 text-[11px]">
                      {values.leaderCollege || values.collegeName || values.candidateCollege || 'Institution not set'}
                      {' · '}
                      {values.leaderBranch || values.branch || values.candidateBranch || 'Branch not set'}
                      {' (Sem '}{values.leaderSemester || values.semester || values.candidateSemester || '—'}{')'}
                    </span>
                  </div>
                </div>

                {/* Card 2: Track Specifics */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-3 text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#9187DE]">
                      Track Deliverables
                    </span>
                    {steps.some((s) => s.id === 'track') && (
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(1)}
                        className="text-[#4B91E8] hover:underline text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-[#172B49] block break-words">
                      {values.projectTitle || values.presentationTitle || values.ideaTitle || values.posterTitle || values.performanceType || values.preferredDomain || config.competitionName}
                    </span>
                    {values.projectTheme && (
                      <span className="text-[#60728A] block text-[11px]">
                        Theme: {values.projectTheme}
                      </span>
                    )}
                    {values.gameTitle && (
                      <span className="text-[#60728A] block text-[11px]">
                        Game Title: {values.gameTitle}
                      </span>
                    )}
                    {values.prn && (
                      <span className="text-[#60728A] block text-[11px]">
                        PRN / Roll No: {values.prn}
                      </span>
                    )}
                    {values.cgpa && (
                      <span className="text-[#60728A] block text-[11px]">
                        CGPA / %: {values.cgpa}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card 3: Team Roster (If team track) */}
                {steps.some((s) => s.id === 'team') && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-3 text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#E07A43]">
                        Team Composition
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJumpToStep(steps.findIndex((s) => s.id === 'team'))}
                        className="text-[#4B91E8] hover:underline text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#DCE5F2] text-[10px] font-mono font-bold text-[#172B49]">
                          {values.teamSize === '1' ? 'Solo (1 Member)' : `${values.teamSize || defaultTeamSize} Members`}
                        </span>
                        {values.teamName && (
                          <span className="font-bold text-[#172B49] text-xs">
                            {values.teamName}
                          </span>
                        )}
                      </div>
                      {values.teamSize !== '1' && (
                        <div className="space-y-1 pt-1.5 text-[11px] text-[#60728A]">
                          {values.member2Name && <div>• Member 2: <strong className="text-[#172B49]">{values.member2Name}</strong> ({values.member2College || 'Leader College'})</div>}
                          {values.member3Name && <div>• Member 3: <strong className="text-[#172B49]">{values.member3Name}</strong> ({values.member3College || 'Leader College'})</div>}
                          {values.member4Name && <div>• Member 4: <strong className="text-[#172B49]">{values.member4Name}</strong> ({values.member4College || 'Leader College'})</div>}
                          {values.player2Name && <div>• Player 2: <strong className="text-[#172B49]">{values.player2Name}</strong></div>}
                          {values.player3Name && <div>• Player 3: <strong className="text-[#172B49]">{values.player3Name}</strong></div>}
                          {values.player4Name && <div>• Player 4: <strong className="text-[#172B49]">{values.player4Name}</strong></div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Card 4: Payment / Verification status */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-3 text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-700">
                      Payment Verification
                    </span>
                    <span className="text-[10px] font-mono text-[#8CA0BA]">
                      {isPaid ? 'Verification Pending' : 'Free Entry'}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div>
                      <span className="text-[#8CA0BA] block">Track Fee:</span>
                      <span className="font-bold text-[#172B49]">{isPaid ? (competition?.registrationFee || '₹300') : 'FREE'}</span>
                    </div>
                    {isPaid && values.paymentId && (
                      <div>
                        <span className="text-[#8CA0BA] block">Transaction UTR:</span>
                        <span className="font-mono font-bold text-[#172B49] select-all">{values.paymentId}</span>
                      </div>
                    )}
                    {isPaid && values.paymentProof && (
                      <div className="pt-0.5">
                        <span className="text-[#8CA0BA] block">Proof Attachment:</span>
                        <span className="text-emerald-700 font-bold">✓ Screenshot attached</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rules & Undertaking Checkbox Card */}
            <div
              onClick={() => {
                const nextState = !acknowledged;
                setAcknowledged(nextState);
                if (nextState) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next['_acknowledgment'];
                    return next;
                  });
                }
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-left select-none ${
                errors['_acknowledgment']
                  ? 'bg-red-50/40 border-red-300'
                  : acknowledged
                  ? 'bg-emerald-50/30 border-emerald-300'
                  : 'bg-white border-[#DCE5F2] hover:border-[#4B91E8]'
              }`}
            >
              <div className="flex items-start gap-3.5">
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
                  className="w-5 h-5 mt-0.5 rounded border-[#DCE5F2] text-[#4B91E8] focus:ring-[#4B91E8] cursor-pointer shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#172B49] block">
                    Participant Undertaking &amp; Festival Guidelines
                  </span>
                  <span className="text-xs text-[#60728A] leading-relaxed block">
                    {config.acknowledgmentLabel}
                  </span>
                </div>
              </div>

              {errors['_acknowledgment'] && (
                <p className="flex items-center gap-1.5 text-[11px] text-red-600 font-bold pt-2.5 pl-8">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
            className="nexus-btn-secondary px-6 py-3 min-h-[48px] text-xs font-bold gap-2 cursor-pointer"
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
            className="nexus-btn-ink px-7 py-3 min-h-[48px] text-xs font-bold gap-2 ml-auto cursor-pointer"
          >
            <span>Continue to {steps[currentStepIndex + 1]?.shortTitle || 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#F5A16F]" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submissionState === 'submitting'}
            className="nexus-btn-sunset px-8 py-3.5 min-h-[48px] text-xs sm:text-sm font-bold gap-2.5 ml-auto shadow-md disabled:opacity-60 cursor-pointer"
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
