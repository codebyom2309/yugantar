import React from 'react';
import { Layers, AlertCircle, FileText, CheckCircle2, Download } from 'lucide-react';

export interface CustomSectionItem {
  id: string;
  title: string;
  type: 'text' | 'bullets' | 'notice' | 'download';
  content?: string;
  items?: string[];
  fileUrl?: string;
  isVisible?: boolean;
}

export default function CustomSectionsPreviewCard({
  sections,
}: {
  sections: CustomSectionItem[];
}) {
  const visibleSections = (sections || []).filter((s) => s.isVisible !== false);

  if (visibleSections.length === 0) return null;

  return (
    <div className="space-y-4">
      {visibleSections.map((sec, idx) => (
        <div
          key={sec.id ? `${sec.id}-${idx}` : `sec-${idx}`}
          className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#4B91E8]" />
            <h3 className="text-base font-display font-bold text-[#172B49]">
              {sec.title || 'Additional Information'}
            </h3>
          </div>

          {sec.type === 'text' && sec.content && (
            <p className="text-xs text-[#60728A] leading-relaxed">
              {sec.content}
            </p>
          )}

          {sec.type === 'bullets' && sec.items && sec.items.length > 0 && (
            <div className="space-y-2">
              {sec.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#172B49]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4B91E8] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          {sec.type === 'notice' && (
            <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#FFE0CE] flex items-start gap-2 text-xs text-[#172B49]">
              <AlertCircle className="w-4 h-4 text-[#E07A43] shrink-0 mt-0.5" />
              <p className="leading-relaxed">{sec.content || 'Important participant notice.'}</p>
            </div>
          )}

          {sec.type === 'download' && (
            <div className="p-3.5 rounded-2xl bg-[#EDF5FC] border border-[#B8D5F8] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#4B91E8] shrink-0" />
                <span className="font-bold text-[#172B49] truncate">{sec.content || 'Official Resource Document'}</span>
              </div>
              {sec.fileUrl && (
                <a
                  href={sec.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-xl bg-white border border-[#B8D5F8] text-[#4B91E8] font-mono text-[11px] font-bold shrink-0 hover:bg-[#F8FAFD] transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
