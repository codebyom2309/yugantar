import React from 'react';
import { FileText, CheckCircle2, Download, ExternalLink } from 'lucide-react';

export interface RulesCardData {
  rules: string[];
  pdfUrl?: string;
  pdfTitle?: string;
}

export default function RulesPreviewCard({
  data,
}: {
  data: RulesCardData;
}) {
  const rules = data?.rules || [];

  return (
    <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#4B91E8]" />
          <h2 className="text-lg sm:text-xl font-display font-bold text-[#172B49]">
            Rules &amp; Regulations
          </h2>
        </div>

        {data.pdfUrl && (
          <a
            href={data.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EDF5FC] text-[#4B91E8] border border-[#B8D5F8] text-[11px] font-mono font-bold hover:bg-[#D8EAFA] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Dossier</span>
          </a>
        )}
      </div>

      {rules.length > 0 ? (
        <div className="space-y-2.5">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#172B49] leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 text-[#4B91E8] shrink-0 mt-0.5" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-dashed border-[#DCE5F2] text-center text-xs text-[#8CA0BA]">
          No rules configured yet.
        </div>
      )}
    </div>
  );
}
