import React from 'react';
import { Sparkles } from 'lucide-react';

export interface AboutCardData {
  about: string;
  formatNote: string;
  approvedDomains?: string[];
  theme?: string;
  accentColor?: string;
  highlights?: string[];
}

export default function AboutPreviewCard({
  data,
}: {
  data: AboutCardData;
}) {
  return (
    <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#4B91E8]" />
        <h2 className="text-lg sm:text-xl font-display font-bold text-[#172B49]">
          About the Competition
        </h2>
      </div>

      <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed">
        {data.about ||
          'Enter detailed background and scope of the competition here. This provides participants with technical context, objectives, and domain relevance.'}
      </p>

      {/* Highlights if provided */}
      {data.highlights && data.highlights.length > 0 && (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {data.highlights.map((h, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#172B49]"
            >
              <span className="text-[#4B91E8] font-bold">✦</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Competition Format */}
      <div className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] space-y-1">
        <span className="text-[10px] font-mono font-bold uppercase text-[#172B49] tracking-wider block">
          Competition Format
        </span>
        <p className="text-xs text-[#60728A] leading-relaxed">
          {data.formatNote ||
            'Single-round exhibition with live demonstration and jury evaluation.'}
        </p>
      </div>

      {/* Approved Domains (e.g. Project Competition) */}
      {data.approvedDomains && data.approvedDomains.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#FFE0CE] space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase text-[#E07A43] tracking-wider block">
            Approved Technical Domains (Strict Adherence Required)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {data.approvedDomains.map((domain, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-xl bg-white border border-[#FFE0CE] text-[11px] font-mono font-bold text-[#172B49]"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Official Mandatory Theme (e.g. Poster Competition) */}
      {data.theme && (
        <div className="p-3.5 rounded-2xl bg-[#EDF5FC] border border-[#B8D5F8] space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#4B91E8] tracking-wider block">
            Official Mandatory Theme
          </span>
          <p className="text-xs sm:text-sm font-display font-extrabold text-[#172B49]">
            &ldquo;{data.theme}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
