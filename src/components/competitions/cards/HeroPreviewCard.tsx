import React from 'react';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  GraduationCap,
  Users,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export interface HeroCardData {
  slug?: string;
  name: string;
  category: string;
  district: string;
  districtIndex: number;
  districtTagline: string;
  venue: string;
  eligibility: string;
  teamSizeLimit: string;
  accentColor: string;
  accentSecondary: string;
  accentBg: string;
  bannerImage: string;
  registrationOpen: boolean | number;
  eventDate?: string;
  rulesPdfUrl?: string;
}

export default function HeroPreviewCard({
  data,
  isStandaloneCard = false,
}: {
  data: HeroCardData;
  isStandaloneCard?: boolean;
}) {
  const accentColor = data.accentColor || '#3B82F6';
  const accentSecondary = data.accentSecondary || '#6366F1';
  const accentBg = data.accentBg || 'rgba(59, 130, 246, 0.1)';
  const isRegOpen = Boolean(data.registrationOpen);

  return (
    <div
      className={`bg-white rounded-3xl border border-[#DCE5F2] overflow-hidden shadow-xs ${
        isStandaloneCard ? 'p-5 sm:p-6' : 'p-5'
      }`}
    >
      {/* Breadcrumb preview */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#60728A] mb-4">
        <span>Home</span>
        <ChevronRight className="w-3 h-3 text-[#8CA0BA]" />
        <span>Competitions</span>
        <ChevronRight className="w-3 h-3 text-[#8CA0BA]" />
        <span style={{ color: accentColor }} className="font-bold truncate">
          {data.name || 'Competition Title'}
        </span>
      </div>

      {/* Arena Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span
          style={{
            backgroundColor: accentBg,
            color: accentColor,
            borderColor: accentColor + '40',
          }}
          className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shadow-2xs"
        >
          ARENA 0{Number(data.districtIndex || 0) + 1} · {data.district || 'Nexus Arena'}
        </span>

        <span className="text-[10px] font-mono text-[#60728A] px-2.5 py-0.5 rounded-full bg-[#F8FAFD] border border-[#DCE5F2]">
          {data.category || 'Hardware & Circuits'}
        </span>

        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            isRegOpen
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {isRegOpen ? '● Registration Active' : '○ Registration Closed'}
        </span>
      </div>

      {/* Title & Tagline */}
      <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-[#172B49] leading-tight mb-2">
        {data.name || 'Untitled Competition'}
      </h1>

      <p className="text-xs text-[#60728A] leading-relaxed mb-4 font-normal">
        {data.districtTagline || 'Enter the city arena. Test your engineering prototypes and innovation.'}
      </p>

      {/* 4 Metadata Pills */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#172B49] mb-4">
        <div className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]">
          <Calendar className="w-3.5 h-3.5 text-[#4B91E8] shrink-0" />
          <span className="truncate">{data.eventDate || '21 October 2026'}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]">
          <MapPin className="w-3.5 h-3.5 text-[#8578D8] shrink-0" />
          <span className="truncate">{data.venue || 'PCE Campus'}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]">
          <GraduationCap className="w-3.5 h-3.5 text-[#E07A43] shrink-0" />
          <span className="truncate">{data.eligibility || 'All Semesters'}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]">
          <Users className="w-3.5 h-3.5 text-[#2F855A] shrink-0" />
          <span className="truncate">{data.teamSizeLimit || 'Individual / Team'}</span>
        </div>
      </div>

      {/* 16:9 Banner Artwork Preview */}
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#DCE5F2] bg-[#EDF5FC] mb-4">
        {data.bannerImage ? (
          <Image
            src={data.bannerImage}
            alt={data.name || 'Banner artwork'}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover object-center"
            unoptimized={data.bannerImage.startsWith('/api/') || data.bannerImage.includes('google')}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8CA0BA] text-xs">
            <span>No 16:9 artwork uploaded</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#102344]/80 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[10px] font-mono pointer-events-none">
          <span className="font-bold truncate">{data.district || 'Arena'}</span>
          <span className="text-white/80 shrink-0">16:9 Official Banner</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          type="button"
          disabled={!isRegOpen}
          className={`w-full py-2.5 rounded-xl text-white text-xs font-mono font-bold tracking-wider uppercase inline-flex items-center justify-center gap-2 shadow-sm transition-opacity ${
            isRegOpen ? 'hover:opacity-95' : 'opacity-60 cursor-not-allowed'
          }`}
          style={{
            background: isRegOpen
              ? `linear-gradient(135deg, ${accentColor} 0%, ${accentSecondary} 100%)`
              : '#94A3B8',
          }}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isRegOpen ? `Register for ${data.name || 'Track'}` : 'Registration Closed'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="w-full py-2 rounded-xl text-[11px] font-mono font-bold text-[#172B49] bg-[#F8FAFD] border border-[#DCE5F2] text-center">
          <span>Read Event Dossier ↓</span>
        </div>
      </div>
    </div>
  );
}
