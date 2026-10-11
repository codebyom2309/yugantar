import React from 'react';
import { MapPin, GraduationCap, Users, Calendar, ShieldCheck } from 'lucide-react';

export interface DossierCardData {
  venue: string;
  eligibility: string;
  teamSizeLimit: string;
  eventDate?: string;
  accentColor?: string;
  registrationOpen?: boolean | number;
}

export default function DossierPreviewCard({
  data,
}: {
  data: DossierCardData;
}) {
  const accentColor = data.accentColor || '#3B82F6';
  const isRegOpen = Boolean(data.registrationOpen);

  return (
    <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-4">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B49] pb-2.5 border-b border-[#E2E8F0]">
        Competition Dossier
      </h3>

      <div className="space-y-3 text-xs">
        <div>
          <span className="text-[#8CA0BA] block mb-0.5 font-mono text-[10px]">VENUE</span>
          <span className="font-bold text-[#172B49] flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#8578D8] shrink-0" />
            <span className="truncate">{data.venue || 'PCE Campus'}</span>
          </span>
        </div>

        <div>
          <span className="text-[#8CA0BA] block mb-0.5 font-mono text-[10px]">ELIGIBILITY</span>
          <span className="font-bold text-[#172B49] flex items-center gap-1.5 truncate">
            <GraduationCap className="w-3.5 h-3.5 text-[#4B91E8] shrink-0" />
            <span className="truncate">{data.eligibility || 'All Students'}</span>
          </span>
        </div>

        <div>
          <span className="text-[#8CA0BA] block mb-0.5 font-mono text-[10px]">TEAM SIZE</span>
          <span className="font-bold text-[#172B49] flex items-center gap-1.5 truncate">
            <Users className="w-3.5 h-3.5 text-[#E07A43] shrink-0" />
            <span className="truncate">{data.teamSizeLimit || 'Individual / Team'}</span>
          </span>
        </div>

        <div>
          <span className="text-[#8CA0BA] block mb-0.5 font-mono text-[10px]">EVENT DATE</span>
          <span className="font-bold text-[#172B49] flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-[#2F855A] shrink-0" />
            <span className="truncate">{data.eventDate || '19 October 2026'}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={!isRegOpen}
        className={`w-full py-2.5 rounded-xl text-white text-xs font-mono font-bold tracking-wider uppercase inline-flex items-center justify-center gap-2 shadow-xs transition-opacity ${
          isRegOpen ? 'hover:opacity-90' : 'opacity-60 cursor-not-allowed'
        }`}
        style={{
          backgroundColor: isRegOpen ? accentColor : '#94A3B8',
        }}
      >
        <ShieldCheck className="w-4 h-4" />
        <span>{isRegOpen ? 'Register Now' : 'Registration Closed'}</span>
      </button>
    </div>
  );
}
