import React from 'react';
import { Award } from 'lucide-react';

export interface EvaluationCriterion {
  name: string;
  points: string | number;
}

export interface EvaluationMatrix {
  totalPoints: string | number;
  criteria: EvaluationCriterion[];
}

export default function RubricPreviewCard({
  rubric,
}: {
  rubric: EvaluationMatrix;
}) {
  const criteria = rubric?.criteria || [];
  const total = rubric?.totalPoints || '100 Points';

  return (
    <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#E07A43]" />
          <h2 className="text-lg sm:text-xl font-display font-bold text-[#172B49]">
            Official Evaluation Rubric
          </h2>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#FFF4EA] text-[#E07A43] border border-[#FFE0CE]">
          {String(total).includes('Point') ? total : `${total} Points`}
        </span>
      </div>

      {criteria.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {criteria.map((crit, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] flex items-center justify-between gap-2"
            >
              <span className="text-xs font-bold text-[#172B49] truncate">{crit.name || 'Criterion'}</span>
              <span className="text-xs font-mono font-extrabold text-[#4B91E8] bg-white px-2 py-0.5 rounded-lg border border-[#DCE5F2] shrink-0">
                {String(crit.points).includes('Pt') ? crit.points : `${crit.points} Pts`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-dashed border-[#DCE5F2] text-center text-xs text-[#8CA0BA]">
          No evaluation criteria configured yet.
        </div>
      )}
    </div>
  );
}
