'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  Info,
  HelpCircle,
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
import { buildUpiPaymentUri, extractNumericFee, validateCompetitionFee } from '@/lib/upiPayment';
import ModernSelect from '@/components/ui/ModernSelect';
import { getAbsoluteUrl } from '@/lib/site-url';

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
  const isOtherInitial = Boolean(value && !options.includes(value as any) && value !== 'Other');
  const [isOther, setIsOther] = useState(isOtherInitial);
  const [customCollege, setCustomCollege] = useState(
    options.includes(value as any) ? '' : value
  );

  const handleSelectOption = (opt: string) => {
    if (opt === 'Other') {
      setIsOther(true);
      onChange(customCollege || 'Other');
    } else {
      setIsOther(false);
      onChange(opt);
    }
  };

  const handleCustomCollegeChange = (text: string) => {
    setCustomCollege(text);
    onChange(text || 'Other');
  };

  const selectValue = isOther ? 'Other' : value;

  return (
    <div className="space-y-2">
      <ModernSelect
        value={selectValue}
        options={options}
        placeholder="Select or Search College / Institution..."
        error={error}
        searchable={true}
        onChange={handleSelectOption}
      />

      {isOther && (
        <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] space-y-1 animate-in fade-in duration-200">
          <label className="text-[11px] font-mono text-[#60728A] block font-semibold">
            Enter your college / institution full name:
          </label>
          <input
            type="text"
            value={customCollege}
            onChange={(e) => handleCustomCollegeChange(e.target.value)}
            placeholder="e.g., Government Polytechnic, Nagpur"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#DCE5F2] text-[#10264A] focus:outline-none focus:border-[#3978F6] focus:ring-2 focus:ring-[#3978F6]/20 font-medium"
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
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanly revoke local object URL on unmount or replacement
  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (8MB max)
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('File size exceeds 8MB. Please compress or select a smaller image.');
      return;
    }

    // Instantly generate local preview to eliminate layout shifts & height jumps
    if (file.type.startsWith('image/')) {
      const objUrl = URL.createObjectURL(file);
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objUrl;
      });
    }
    setLocalFileName(file.name);
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
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setLocalFileName(null);
    setUploadError(null);
    setUploadAccount(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activePreview = localPreviewUrl || value;
  const isCloudinaryUrl = value && value.includes('cloudinary.com');
  const isFilebaseUrl = value && (value.includes('filebase') || value.includes('/api/media/filebase'));

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

      {/* Upload State Box: Sized with min-h to prevent layout shift & viewport vibration */}
      {activePreview ? (
        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-3 min-h-[160px] transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-[#4B91E8] animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#172B49] block truncate">
                  {isUploading ? 'Uploading Screenshot...' : 'Payment Proof Attached'}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 block truncate">
                  {isUploading
                    ? 'Syncing with secure vault...'
                    : isCloudinaryUrl
                    ? '✓ Stored on Cloudinary Storage'
                    : isFilebaseUrl
                    ? '✓ Stored on Filebase Object Storage'
                    : '✓ Screenshot Attached'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFD] hover:bg-[#EDF5FC] text-[#4B91E8] text-[11px] font-mono font-bold border border-[#DCE5F2] transition-colors disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={handleRemove}
                className="p-1.5 rounded-lg bg-[#F8FAFD] hover:bg-red-50 text-[#8CA0BA] hover:text-red-600 transition-colors disabled:opacity-50"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reserved Preview Frame */}
          <div className="relative h-36 w-full rounded-xl overflow-hidden bg-[#F8FAFD] border border-[#E2E8F0]">
            <img
              src={activePreview}
              alt="Payment screenshot preview"
              className="w-full h-full object-contain"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-[#172B49]/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1.5 p-3">
                <Loader2 className="w-6 h-6 text-[#FF874D] animate-spin" />
                <span className="text-xs font-mono font-bold">Storing in Secure Vault...</span>
                <span className="text-[10px] text-white/80 truncate max-w-xs">{localFileName}</span>
              </div>
            )}
          </div>

          {value && (
            <div className="text-[10px] font-mono text-[#8CA0BA] truncate">
              Asset URL: {value}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 min-h-[160px] flex flex-col justify-center ${
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
                Preparing Screenshot Upload...
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

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#DCE5F2] text-[10px] font-mono text-[#60728A] mx-auto">
                <ShieldCheck className="w-3 h-3 text-[#2F855A]" />
                <span>Cloudinary Vault • Filebase Failover Active</span>
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
// Standard Form Field Input & Semester Normalization
// ---------------------------------------------------------------------------

export function normalizeSemester(sem: string): string {
  if (!sem) return '';
  const clean = String(sem).trim().toUpperCase().replace(/^(SEMESTER|SEM)\s*/i, '');
  const map: Record<string, string> = {
    '1': 'I', '1ST': 'I', 'I': 'I',
    '2': 'II', '2ND': 'II', 'II': 'II',
    '3': 'III', '3RD': 'III', 'III': 'III',
    '4': 'IV', '4TH': 'IV', 'IV': 'IV',
    '5': 'V', '5TH': 'V', 'V': 'V',
    '6': 'VI', '6TH': 'VI', 'VI': 'VI',
    '7': 'VII', '7TH': 'VII', 'VII': 'VII',
    '8': 'VIII', '8TH': 'VIII', 'VIII': 'VIII',
  };
  return map[clean] || clean;
}

function FormFieldInput({
  field,
  value,
  error,
  competitionSlug,
  allowedSemesters,
  onChange,
}: {
  field: FormField;
  value: string;
  error?: string;
  competitionSlug: string;
  allowedSemesters?: string[];
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

      {field.type === 'select' && field.options ? (() => {
        const isSemester = field.key.toLowerCase().includes('semester');
        let selectOptions = field.options;
        if (isSemester && allowedSemesters && allowedSemesters.length > 0) {
          const normAllowed = allowedSemesters.map(normalizeSemester);
          selectOptions = field.options.filter((opt) => normAllowed.includes(normalizeSemester(opt)));
        }
        return (
          <div className="space-y-1.5">
            <ModernSelect
              id={`input-${field.key}`}
              value={value}
              options={selectOptions}
              onChange={(val) => onChange(field.key, val)}
              placeholder={`Select ${field.label}...`}
              error={error}
              required={field.required}
              ariaLabel={field.label}
            />
            {isSemester && allowedSemesters && allowedSemesters.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E9F2FF] border border-[#CDE1FF] text-[11px] font-mono text-[#3978F6] font-semibold">
                <Sparkles className="w-3 h-3 shrink-0 text-[#3978F6]" />
                <span>Eligibility: Semesters {allowedSemesters.join(', ')} only</span>
              </div>
            )}
          </div>
        );
      })() : field.type === 'textarea' ? (
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
  name?: string;
  isPaid?: boolean;
  registrationFee?: string;
  isFeeFixed?: boolean;
  showPaymentQr?: boolean;
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
  allowedSemesters?: string[];
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
  const [copiedUpiId, setCopiedUpiId] = useState(false);
  const [copyUpiFailed, setCopyUpiFailed] = useState(false);
  const [copiedPassUrl, setCopiedPassUrl] = useState(false);
  const [autoDownloadStatus, setAutoDownloadStatus] = useState<
    'idle' | 'downloading' | 'completed' | 'blocked'
  >('idle');
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string | null>(null);
  const [useLeaderDetails, setUseLeaderDetails] = useState<Record<number, boolean>>({});
  const submitLockRef = useRef(false);
  const autoDownloadTriggeredRef = useRef(false);

  // Robust, reliable UPI ID copy handler with fallback for restrictive mobile browsers
  const handleCopyUpiId = useCallback(async () => {
    if (!competition?.upiId) return;
    const cleanId = competition.upiId.trim();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanId);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = cleanId;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) throw new Error('execCommand copy failed');
      }
      setCopiedUpiId(true);
      setCopyUpiFailed(false);
      setTimeout(() => setCopiedUpiId(false), 2000);
    } catch (err) {
      console.warn('Failed to copy UPI ID:', err);
      setCopyUpiFailed(true);
      setTimeout(() => setCopyUpiFailed(false), 3000);
    }
  }, [competition?.upiId]);

  // Auto-prune ineligible semesters if restricted by festival administration
  useEffect(() => {
    if (competition?.allowedSemesters && competition.allowedSemesters.length > 0) {
      const normAllowed = competition.allowedSemesters.map(normalizeSemester);
      setValues((prev) => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k.toLowerCase().includes('semester')) {
            const v = next[k];
            if (v && !normAllowed.includes(normalizeSemester(v))) {
              delete next[k];
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }
  }, [competition?.allowedSemesters]);

  // Authoritative fee validation: ensures no silent ₹1 or ₹300 substitutions,
  // prevents misleading QRs, and strictly validates numeric INR amounts
  const feeValidation = useMemo(() => {
    return validateCompetitionFee(
      isPaid,
      competition?.registrationFee,
      competition?.upiId,
      values.teamSize || defaultTeamSize
    );
  }, [isPaid, competition?.registrationFee, competition?.upiId, values.teamSize, defaultTeamSize]);

  // Load festival department discount rule
  const [discountRule, setDiscountRule] = useState<{
    enabled: boolean;
    institution: string;
    department: string;
    discountPercentage: number;
    applicableCompetitions: string[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/competitions')
      .then((r) => r.json())
      .then((d) => {
        if (d?.festival?.departmentDiscountRule) {
          setDiscountRule(d.festival.departmentDiscountRule);
        }
      })
      .catch((err) => console.warn('Failed to load department discount rule:', err));
  }, []);

  const leaderCollege = (
    values.leaderCollege ||
    values.collegeName ||
    values.candidateCollege ||
    values.squadLeaderCollege ||
    ''
  ).trim();

  const leaderBranch = (
    values.leaderBranch ||
    values.branch ||
    values.candidateBranch ||
    values.squadLeaderBranch ||
    ''
  ).trim();

  const discountEligibility = useMemo(() => {
    const normalFee = typeof feeValidation.numericAmount === 'number'
      ? feeValidation.numericAmount
      : (parseFloat(String(feeValidation.numericAmount || '0')) || 0);
    if (!isPaid || normalFee <= 0 || !discountRule || !discountRule.enabled) {
      return { eligible: false, normalFee, discountAmount: 0, finalFee: normalFee, ruleName: '', discountPercentage: 0 };
    }

    const matchesCollege = leaderCollege.toUpperCase() === (discountRule.institution || '').trim().toUpperCase();
    const matchesBranch = leaderBranch.toUpperCase() === (discountRule.department || '').trim().toUpperCase();
    const isApplicableComp =
      (discountRule.applicableCompetitions || []).includes('all') ||
      (discountRule.applicableCompetitions || []).includes(config.competitionSlug);

    if (matchesCollege && matchesBranch && isApplicableComp) {
      const pct = discountRule.discountPercentage || 50;
      const discountAmount = Math.round((normalFee * pct) / 100);
      const finalFee = Math.max(0, normalFee - discountAmount);
      return {
        eligible: true,
        normalFee,
        discountAmount,
        finalFee,
        ruleName: `${discountRule.institution} ${discountRule.department} ${pct}% Concession`,
        discountPercentage: pct,
      };
    }

    return { eligible: false, normalFee, discountAmount: 0, finalFee: normalFee, ruleName: '', discountPercentage: 0 };
  }, [isPaid, discountRule, feeValidation.numericAmount, leaderCollege, leaderBranch, config.competitionSlug]);

  // Compute canonical UPI URI using standard URLSearchParams generator
  const upiPaymentUri = useMemo(() => {
    if (!isPaid || !feeValidation.isValid || !competition?.upiId) return '';
    const cleanUpiId = competition.upiId.trim();
    const payee = (competition.payeeName || 'TELE-ERA YUGANTAR 2026').trim();
    const feeAmount = competition.isFeeFixed !== false ? discountEligibility.finalFee : undefined;
    return buildUpiPaymentUri({
      upiId: cleanUpiId,
      payeeName: payee,
      amount: feeAmount,
      transactionNote: `${config.competitionName} Registration`,
    });
  }, [isPaid, feeValidation, discountEligibility.finalFee, competition?.upiId, competition?.payeeName, competition?.isFeeFixed, config.competitionName]);

  // Robust, single-click pass downloader with automatic Blob download & object URL revocation
  const handleDownloadPass = useCallback(async (regId: string, token?: string) => {
    if (!regId) return;
    setAutoDownloadStatus('downloading');
    try {
      const url = `/api/pass/${regId}/pdf?download=1${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`PDF generation endpoint returned status ${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const cleanFilename = `YUGANTAR-2026-PASS-${regId.substring(0, 8).toUpperCase()}.pdf`;

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = cleanFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanly revoke temporary object URL
      setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 3000);

      setAutoDownloadStatus('completed');
    } catch (err) {
      console.warn('Direct pass download encounter:', err);
      setAutoDownloadStatus('blocked');
    }
  }, []);

  // Generate dynamic UPI QR Code if in generate mode or if uploaded QR is absent,
  // strictly gated by feeValidation to prevent misleading QR generation
  useEffect(() => {
    if (isPaid && feeValidation.isValid && competition?.upiId && upiPaymentUri) {
      const isGenerateMode = competition.qrMode === 'generate' || !competition.qrCodeUrl;
      if (isGenerateMode) {
        QRCode.toDataURL(upiPaymentUri, {
          width: 600,
          margin: 2,
          color: {
            dark: '#10264A',
            light: '#FFFFFF',
          },
        })
          .then((url) => setDynamicQrUrl(url))
          .catch((err) => console.error('Failed to generate dynamic UPI QR code:', err));
      }
    } else {
      setDynamicQrUrl(null);
    }
  }, [isPaid, feeValidation.isValid, competition?.upiId, competition?.qrMode, competition?.qrCodeUrl, upiPaymentUri]);

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

  // Load draft on mount or render confirmed registration state if registered_id is passed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const regIdParam = sp.get('registered_id');
      if (regIdParam) {
        setSubmissionState('submitted');
        setSubmissionResult({
          status: 'submitted',
          registrationId: regIdParam,
          passToken: sp.get('token') || undefined,
          verificationToken: sp.get('v') || regIdParam,
          paymentStatus: sp.get('payment_status') || 'pending_verification',
        });
        return;
      }
    }

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

        // Trigger automatic pass download once server has confirmed success
        if (data.registrationId && !autoDownloadTriggeredRef.current) {
          autoDownloadTriggeredRef.current = true;
          handleDownloadPass(data.registrationId, data.passToken);
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

  const handleCopyPassLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPassUrl(true);
    setTimeout(() => setCopiedPassUrl(false), 2000);
  };

  // -------------------------------------------------------------------------
  // RENDER: Confirmed Success View
  // -------------------------------------------------------------------------
  if (submissionState === 'submitted') {
    const isFree = submissionResult?.paymentStatus === 'free';
    const regId = submissionResult?.registrationId || '';
    const token = submissionResult?.passToken;
    const digitalPassUrl = `/pass/${regId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const fullPassUrl = getAbsoluteUrl(digitalPassUrl);
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
            Registration successful — your YUGANTAR 2026 pass is ready.
          </h3>
          <p className="text-xs sm:text-sm text-[#60728A] max-w-md mx-auto leading-relaxed">
            {isFree
              ? `Your registration for ${config.competitionName} has been securely confirmed. Your vector delegate pass is generated below.`
              : `Your registration for ${config.competitionName} has been recorded. Your payment proof is under audit by festival coordinators.`}
          </p>
        </div>

        {/* Permanent Tracking ID & Competition Details Card */}
        {regId && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] max-w-md mx-auto text-left space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block tracking-wider">
                Official Registration Credential ID
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Active
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
                <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-[#8CA0BA] block text-[9px]">COMPETITION</span>
                <span className="font-bold text-[#172B49] truncate block">{config.competitionName}</span>
              </div>
              <div>
                <span className="text-[#8CA0BA] block text-[9px]">PASS STATUS</span>
                <span className={`font-bold ${isFree ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isFree ? 'Spot Confirmed' : 'Payment Under Audit'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Automatic Download Status Feedback Banner */}
        <div className="max-w-md mx-auto">
          {autoDownloadStatus === 'downloading' && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-center gap-2 font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-[#4B91E8]" />
              <span>Generating and downloading your vector pass PDF...</span>
            </div>
          )}
          {autoDownloadStatus === 'completed' && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-2 font-mono">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pass downloaded automatically. Check your device Downloads!</span>
            </div>
          )}
          {autoDownloadStatus === 'blocked' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-center gap-2 font-mono">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Automatic download blocked by browser? Use the button below.</span>
            </div>
          )}
        </div>

        {/* Action Buttons: Direct Single-Click PDF Download + Digital Pass */}
        <div className="space-y-3 max-w-md mx-auto pt-1">
          {regId && (
            <>
              {/* Single-Click Reliable Pass Download Button */}
              <button
                type="button"
                onClick={() => handleDownloadPass(regId, token)}
                disabled={autoDownloadStatus === 'downloading'}
                className="w-full flex items-center justify-center gap-2.5 min-h-[48px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#172B49] via-[#244372] to-[#172B49] hover:opacity-95 text-white text-xs sm:text-sm font-mono font-bold shadow-md transition disabled:opacity-75 cursor-pointer"
              >
                {autoDownloadStatus === 'downloading' ? (
                  <Loader2 className="w-4 h-4 text-[#F5A16F] animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-[#F5A16F]" />
                )}
                <span>
                  {autoDownloadStatus === 'downloading'
                    ? 'GENERATING PASS PDF...'
                    : 'DOWNLOAD REGISTRATION PASS (PDF)'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1 text-[#F5A16F]" />
              </button>

              <Link
                href={digitalPassUrl}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-white border border-[#DCE5F2] hover:bg-[#EDF5FC] text-[#172B49] text-xs font-mono font-bold transition shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#4B91E8]" />
                <span>VIEW DIGITAL PASS IN BROWSER</span>
              </Link>
            </>
          )}

          {/* Pass Recovery & Retrieval Box */}
          {regId && (
            <div className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2] text-left space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8CA0BA]">
                <span>PASS RECOVERY &amp; PERSISTENCE</span>
                <span>Recover Anytime</span>
              </div>
              <p className="text-[11px] text-[#60728A] leading-relaxed">
                Bookmark or copy your secure recovery link to access your pass after closing the browser or returning to this page:
              </p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={fullPassUrl}
                  className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-white border border-[#DCE5F2] rounded-lg text-[#172B49] truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyPassLink(fullPassUrl)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE5F2] hover:bg-[#EDF5FC] text-[#4B91E8] text-[11px] font-mono font-bold shrink-0 flex items-center gap-1 shadow-2xs"
                >
                  {copiedPassUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPassUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
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

        {/* Regular fields for this step (omitted on the final review & payment step) */}
        {currentStepIndex < steps.length - 1 &&
          currentStepFields.map((field) => {
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
                  allowedSemesters={competition?.allowedSemesters}
                  onChange={handleFieldChange}
                />
              </React.Fragment>
            );
          })}

        {/* =====================================================================
            FINAL STEP ONLY: 5-STEP PAYMENT & REGISTRATION REVIEW
            ===================================================================== */}
        {currentStepIndex === steps.length - 1 && (
          <div className="space-y-6 pt-4 border-t border-[#E2E8F0]">
            {isPaid ? (
              <div className="space-y-6">
                {/* =============================================================
                    STEP 1 — PAYMENT SUMMARY
                    ============================================================= */}
                <div className="p-4 sm:p-6 rounded-2xl bg-[#FFF8F2] border border-[#FFE0CE] space-y-3.5 text-left shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FFE0CE] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#E07A43] text-white flex items-center justify-center text-xs font-mono font-bold">
                        1
                      </span>
                      <h3 className="text-sm font-bold text-[#172B49] uppercase tracking-wider">
                        Step 1: Payment Summary
                      </h3>
                    </div>
                    {feeValidation.isValid && (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#E07A43] text-white shadow-2xs">
                        Fee: {discountEligibility.eligible ? `₹${discountEligibility.finalFee}` : feeValidation.displayFee}
                      </span>
                    )}
                  </div>

                  {/* Special Department Concession Banner */}
                  {discountEligibility.eligible && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-800">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>Department Privilege: {discountEligibility.ruleName}</span>
                        </span>
                        <span className="font-mono bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                          {discountEligibility.discountPercentage}% CONCESSION
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-emerald-500/20 font-mono">
                        <div>
                          <span className="text-[10px] text-emerald-700 block">Normal Fee:</span>
                          <span className="line-through text-slate-500">₹{discountEligibility.normalFee}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 block">Applied Discount:</span>
                          <span className="font-bold text-emerald-700">-₹{discountEligibility.discountAmount}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 block">Payable Amount:</span>
                          <span className="font-bold text-blue-700 text-sm">₹{discountEligibility.finalFee}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-[#FFE0CE]">
                      <span className="text-[10px] font-mono uppercase text-[#7E93AC] block">Competition Track</span>
                      <span className="font-bold text-[#172B49] block truncate">{competition?.name || config.competitionName}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-[#FFE0CE]">
                      <span className="text-[10px] font-mono uppercase text-[#7E93AC] block">Payable Amount</span>
                      <span className="font-bold text-[#E07A43] block">
                        {discountEligibility.eligible ? `₹${discountEligibility.finalFee}` : feeValidation.displayFee}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-[#FFE0CE]">
                      <span className="text-[10px] font-mono uppercase text-[#7E93AC] block">Requirements</span>
                      <span className="font-medium text-[#172B49] block">
                        {competition?.requireUtr !== false ? '• 12-Digit UTR ' : ''}
                        {competition?.requireScreenshot !== false ? '• Screenshot' : ''}
                        {competition?.requireUtr === false && competition?.requireScreenshot === false ? 'No evidence required' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-[#60728A] leading-relaxed pt-1">
                    {competition?.paymentInstructions ? (
                      <p>{competition.paymentInstructions}</p>
                    ) : (
                      <p>
                        Scan the official department QR code below or use the UPI ID to complete your registration fee. After paying, enter your 12-digit UTR reference ID and attach your payment screenshot.
                      </p>
                    )}
                  </div>
                </div>

                {/* =============================================================
                    STEP 2 — PAYMENT QR
                    ============================================================= */}
                {competition?.showPaymentQr !== false && (
                  <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#DCE5F2] space-y-4 text-left shadow-2xs">
                    <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                      <span className="w-6 h-6 rounded-lg bg-[#10264A] text-white flex items-center justify-center text-xs font-mono font-bold">
                        2
                      </span>
                      <h3 className="text-sm font-bold text-[#172B49] uppercase tracking-wider">
                        Step 2: Scan Dynamic UPI QR Code
                      </h3>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 pt-1">
                      {!feeValidation.isValid ? (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1.5 w-full">
                          <span className="font-bold flex items-center gap-1.5 text-amber-800">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            Payment Configuration Notice
                          </span>
                          <p>{feeValidation.errorMessage || 'Fee configuration incomplete. Contact coordinators.'}</p>
                        </div>
                      ) : (competition?.qrCodeUrl || dynamicQrUrl) ? (
                        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#DCE5F2] shrink-0 text-center shadow-xs w-full lg:w-[310px] max-w-[320px] mx-auto flex flex-col items-center justify-center">
                          <div className="bg-white p-2 rounded-xl border border-[#EDF2F7] shadow-2xs flex items-center justify-center w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={competition?.qrMode === 'upload' && competition.qrCodeUrl ? competition.qrCodeUrl : (dynamicQrUrl || competition?.qrCodeUrl)}
                              alt="Payment QR Code"
                              className="w-[260px] h-[260px] min-[390px]:w-[270px] min-[390px]:h-[270px] sm:w-[280px] sm:h-[280px] max-w-full aspect-square object-contain mx-auto rounded-lg"
                            />
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] w-full text-center space-y-1">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-[11px] font-mono uppercase text-[#7E93AC] tracking-wider">
                                Payable Amount:
                              </span>
                              <span className="text-base font-mono font-bold text-[#10264A]">
                                {discountEligibility.eligible ? `₹${discountEligibility.finalFee}` : (feeValidation.numericAmount ? `₹${feeValidation.numericAmount}` : feeValidation.displayFee)}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#536781] block">
                              {discountEligibility.eligible ? 'Concession Applied UPI QR' : (competition?.qrMode === 'upload' ? 'Official Department QR' : 'Dynamic UPI QR')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-800 space-y-1">
                          <span className="font-bold block">Admin Configuration Notice</span>
                          <span>Payment QR code is being generated or configured by coordinators. You may use the official UPI ID below to complete your fee.</span>
                        </div>
                      )}

                      <div className="space-y-3.5 flex-1 w-full text-left">
                        {competition?.payeeName && (
                          <div className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]">
                            <span className="text-[10px] font-mono uppercase text-[#7E93AC] tracking-wider block">
                              Official Payee Name
                            </span>
                            <span className="text-sm font-bold text-[#10264A]">
                              {competition.payeeName}
                            </span>
                          </div>
                        )}

                        {competition?.upiId ? (
                          <div className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase text-[#7E93AC] tracking-wider block">
                                Official UPI ID
                              </span>
                              <span className="text-[10px] font-mono text-[#536781]">
                                Tap copy to pay manually
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-xs sm:text-sm font-mono font-bold text-[#10264A] select-all break-all bg-white px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] flex-1">
                                {competition.upiId}
                              </code>
                              <button
                                type="button"
                                onClick={handleCopyUpiId}
                                className="shrink-0 min-h-[38px] px-3.5 rounded-lg bg-white border border-[#DCE5F2] hover:bg-[#E9F2FF] hover:border-[#B8D5F8] text-[#10264A] text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                aria-label="Copy UPI ID"
                              >
                                {copiedUpiId ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : copyUpiFailed ? (
                                  <>
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="text-amber-700">Failed</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-[#3978F6]" />
                                    <span>Copy UPI ID</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                            <span className="font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              Configuration Error
                            </span>
                            <span>UPI ID is not configured for this competition arena. Please contact the coordinators.</span>
                          </div>
                        )}

                        {/* Manual Payment Instructions Card */}
                        <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0F6FE] border border-[#C8DCF8] text-xs text-[#10264A] space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-[#1E5FA8]">
                            <HelpCircle className="w-4 h-4 shrink-0 text-[#3978F6]" />
                            <span>Having trouble scanning the QR?</span>
                          </div>
                          <p className="text-[11px] text-[#536781] leading-relaxed">
                            You can manually pay using the official UPI ID above. Open Google Pay, PhonePe, Paytm, BHIM, or your preferred UPI app, choose the option to pay a UPI ID, enter the copied UPI ID, verify the displayed recipient name, and enter the exact configured registration fee.
                          </p>
                          <div className="pt-2 border-t border-[#D5E5FA] space-y-1.5 text-[11px] text-[#536781]">
                            <div className="flex items-start gap-1.5">
                              <span className="text-[#3978F6] font-bold shrink-0">•</span>
                              <span>
                                <strong>Verify recipient:</strong> Confirm that the recipient name matches <strong>{competition?.payeeName || 'the official organizer'}</strong> before confirming payment.
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="text-[#3978F6] font-bold shrink-0">•</span>
                              <span>
                                <strong>Exact fee:</strong> Enter the exact configured registration fee: <strong>{discountEligibility.eligible ? `₹${discountEligibility.finalFee}` : (feeValidation.numericAmount ? `₹${feeValidation.numericAmount}` : feeValidation.displayFee)}</strong>.
                              </span>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <span className="text-[#3978F6] font-bold shrink-0">•</span>
                              <span>
                                <strong>Payment proof:</strong> {competition?.requireUtr !== false && competition?.requireScreenshot !== false
                                  ? 'Retain your 12-digit UTR / reference number and save your payment screenshot for Steps 3 & 4 below.'
                                  : competition?.requireUtr !== false
                                  ? 'Retain your 12-digit UTR / reference number for Step 3 below.'
                                  : competition?.requireScreenshot !== false
                                  ? 'Save your payment confirmation screenshot for Step 4 below.'
                                  : 'Keep your transaction reference for your records.'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =============================================================
                    STEP 3 — PAYMENT REFERENCE (UTR)
                    ============================================================= */}
                {(() => {
                  const paymentIdField = currentStepFields.find((f) => f.key === 'paymentId');
                  if (!paymentIdField || competition?.requireUtr === false) return null;
                  return (
                    <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#DCE5F2] space-y-3.5 text-left shadow-2xs">
                      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                        <span className="w-6 h-6 rounded-lg bg-[#3978F6] text-white flex items-center justify-center text-xs font-mono font-bold">
                          3
                        </span>
                        <h3 className="text-sm font-bold text-[#172B49] uppercase tracking-wider">
                          Step 3: Enter Payment Reference / UTR
                        </h3>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#EDF5FC] border border-[#B8D5F8] text-xs text-[#1E5FA8] space-y-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <Info className="w-4 h-4 shrink-0" />
                          Where to find the 12-Digit Reference?
                        </span>
                        <p className="text-[11px] text-[#536781] leading-relaxed">
                          Open the payment confirmation screen in Google Pay, PhonePe, Paytm, or BHIM. Look for the <strong>12-digit UTR Number</strong>, <strong>UPI Ref No.</strong>, or <strong>Transaction ID</strong>.
                        </p>
                      </div>

                      <FormFieldInput
                        field={paymentIdField}
                        value={values[paymentIdField.key] || ''}
                        error={errors[paymentIdField.key]}
                        competitionSlug={config.competitionSlug}
                        onChange={handleFieldChange}
                      />
                    </div>
                  );
                })()}

                {/* =============================================================
                    STEP 4 — PAYMENT SCREENSHOT
                    ============================================================= */}
                {(() => {
                  const paymentProofField = currentStepFields.find((f) => f.key === 'paymentProof');
                  if (!paymentProofField || competition?.requireScreenshot === false) return null;
                  return (
                    <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#DCE5F2] space-y-3.5 text-left shadow-2xs">
                      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
                        <span className="w-6 h-6 rounded-lg bg-[#9187DE] text-white flex items-center justify-center text-xs font-mono font-bold">
                          4
                        </span>
                        <h3 className="text-sm font-bold text-[#172B49] uppercase tracking-wider">
                          Step 4: Upload Payment Screenshot
                        </h3>
                      </div>

                      <p className="text-xs text-[#60728A] leading-relaxed">
                        Upload a clear screenshot of your transaction confirmation. Supported formats: <strong>JPEG, PNG, WebP or PDF (up to 8MB)</strong>. You can replace or remove the file prior to final submission.
                      </p>

                      <FormFieldInput
                        field={paymentProofField}
                        value={values[paymentProofField.key] || ''}
                        error={errors[paymentProofField.key]}
                        competitionSlug={config.competitionSlug}
                        onChange={handleFieldChange}
                      />
                    </div>
                  );
                })()}

                {/* Any remaining fields in final step if not paymentId/paymentProof */}
                {currentStepFields
                  .filter((f) => f.key !== 'paymentId' && f.key !== 'paymentProof')
                  .map((field) => (
                    <FormFieldInput
                      key={field.key}
                      field={field}
                      value={values[field.key] || ''}
                      error={errors[field.key]}
                      competitionSlug={config.competitionSlug}
                      allowedSemesters={competition?.allowedSemesters}
                      onChange={handleFieldChange}
                    />
                  ))}
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
                    {isPaid && (
                      <div className="pt-2 text-[10px] font-mono text-[#8CA0BA] border-t border-[#DCE5F2]/60">
                        ℹ️ Note: Submitting payment evidence does not automatically mark your payment as verified. Final verification is completed by event auditors against official banking statements.
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
