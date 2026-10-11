import React from 'react';
import { Layers } from 'lucide-react';

export default function ExpectationsPreviewCard({
  expectations,
  accentColor = '#2F855A',
}: {
  expectations: string[];
  accentColor?: string;
}) {
  const items = expectations || [];

  return (
    <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-[#2F855A]" />
        <h2 className="text-lg sm:text-xl font-display font-bold text-[#172B49]">
          Participant Expectations &amp; Conduct
        </h2>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((exp, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] text-xs text-[#60728A]"
            >
              <span
                style={{ backgroundColor: accentColor }}
                className="w-5 h-5 rounded-md text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
              >
                0{idx + 1}
              </span>
              <span className="leading-relaxed">{exp}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-dashed border-[#DCE5F2] text-center text-xs text-[#8CA0BA]">
          No expectations added yet.
        </div>
      )}
    </div>
  );
}
