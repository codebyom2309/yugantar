import React from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface RegistrationCtaData {
  name: string;
  accentColor: string;
  accentSecondary: string;
  accentBg: string;
  registrationOpen: boolean | number;
  customCtaText?: string;
  customNoticeText?: string;
}

export default function RegistrationCtaPreviewCard({
  data,
}: {
  data: RegistrationCtaData;
}) {
  const accentColor = data.accentColor || '#3B82F6';
  const accentSecondary = data.accentSecondary || '#6366F1';
  const accentBg = data.accentBg || 'rgba(59, 130, 246, 0.1)';
  const isRegOpen = Boolean(data.registrationOpen);

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl border-2 shadow-xs relative overflow-hidden"
      style={{
        backgroundColor: accentBg,
        borderColor: accentColor + '40',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: accentColor + '20',
              color: accentColor,
            }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span
              className="text-[9px] font-mono font-bold uppercase tracking-wider block"
              style={{ color: accentColor }}
            >
              OFFICIAL REGISTRATION
            </span>
            <h3 className="text-base font-display font-bold text-[#172B49] truncate">
              Register for {data.name || 'Competition'}
            </h3>
          </div>
        </div>

        <span
          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
            isRegOpen
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {isRegOpen ? 'Active' : 'Closed'}
        </span>
      </div>

      <p className="text-xs text-[#60728A] leading-relaxed mb-4 font-normal">
        {data.customNoticeText ||
          'Submit your registration through our direct portal. Responses are saved in TiDB Cloud and forwarded to the live Google Form & Google Sheet with verifiable confirmation.'}
      </p>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          disabled={!isRegOpen}
          className={`w-full py-2.5 rounded-xl text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-md transition-all ${
            isRegOpen ? 'hover:opacity-95' : 'opacity-60 cursor-not-allowed'
          }`}
          style={{
            background: isRegOpen
              ? `linear-gradient(135deg, ${accentColor} 0%, ${accentSecondary} 100%)`
              : '#94A3B8',
          }}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{data.customCtaText || (isRegOpen ? 'Proceed to Registration' : 'Registration Closed')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <span className="text-[10px] font-mono text-[#60728A] flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Dual Cloudinary Upload &amp; Google Forms Verified</span>
        </span>
      </div>
    </div>
  );
}
