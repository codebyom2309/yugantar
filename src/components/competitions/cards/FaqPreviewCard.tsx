import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqPreviewCard({
  faqs,
}: {
  faqs: FaqItem[];
}) {
  const items = faqs || [];

  return (
    <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-[#8578D8]" />
        <h2 className="text-lg sm:text-xl font-display font-bold text-[#172B49]">
          Frequently Asked Questions
        </h2>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2.5">
          {items.map((faq, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] space-y-1"
            >
              <h4 className="text-xs sm:text-sm font-bold text-[#172B49]">
                {faq.question || 'Question title'}
              </h4>
              <p className="text-xs text-[#60728A] leading-relaxed">
                {faq.answer || 'Answer details'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-dashed border-[#DCE5F2] text-center text-xs text-[#8CA0BA]">
          No track-specific FAQs configured yet.
        </div>
      )}
    </div>
  );
}
