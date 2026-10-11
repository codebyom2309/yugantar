import React from 'react';
import { Clock } from 'lucide-react';

export interface ScheduleItem {
  time: string;
  activity: string;
}

export default function SchedulePreviewCard({
  schedule,
}: {
  schedule: ScheduleItem[];
}) {
  return (
    <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#8578D8]" />
        <h2 className="text-lg sm:text-xl font-display font-bold text-[#172B49]">
          Event Flow &amp; Schedule
        </h2>
      </div>

      {schedule && schedule.length > 0 ? (
        <div className="space-y-2.5">
          {schedule.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] gap-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-[#DCE5F2] font-mono text-[10px] font-bold text-[#172B49] shrink-0">
                  {item.time || 'TBD'}
                </span>
              </div>
              <p className="text-xs text-[#60728A] leading-relaxed sm:text-right flex-1 sm:pl-3">
                {item.activity || 'Activity details'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-dashed border-[#DCE5F2] text-center text-xs text-[#8CA0BA]">
          No schedule items added yet.
        </div>
      )}
    </div>
  );
}
