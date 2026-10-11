'use client';

import React from 'react';
import Image from 'next/image';
import { Building2, Users, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

export interface PublicOrgBody {
  id?: string;
  name: string;
  role: string;
  department: string;
  description: string;
  badge: string;
  leadership_note?: string;
  leadershipNote?: string;
  logo_url?: string | null;
  logoUrl?: string | null;
  is_published?: number | boolean;
}

export interface PublicMember {
  id: string;
  name: string;
  role: string;
  category: 'turbo_bits' | 'faculty' | 'core_committee';
  department?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  display_order: number;
  is_published: number | boolean;
}

export default function PublicOrganizersPreview({
  organizers,
  members,
}: {
  organizers: PublicOrgBody[];
  members: PublicMember[];
}) {
  const seenOrgs = new Set<string>();
  const visibleOrgs = (organizers || [])
    .filter((o) => o.is_published === undefined || Boolean(o.is_published))
    .filter((o) => {
      const k = o.id || o.name;
      if (!k || seenOrgs.has(k)) return false;
      seenOrgs.add(k);
      return true;
    });

  const seenMembers = new Set<string>();
  const visibleMembers = (members || [])
    .filter((m) => m.is_published === undefined || Boolean(m.is_published))
    .filter((m) => {
      const k = m.id || m.name;
      if (!k || seenMembers.has(k)) return false;
      seenMembers.add(k);
      return true;
    });

  const turboBitsMembers = visibleMembers.filter((m) => m.category === 'turbo_bits');
  const facultyMembers = visibleMembers.filter((m) => m.category === 'faculty');

  return (
    <div data-theme="public-light" className="w-full bg-[#F8FAFD] text-[#172B49] p-4 space-y-6 font-sans select-none">
      {/* 1. Header Hero Badge */}
      <div className="text-center space-y-2 pb-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4B91E8] bg-[#EDF5FC] px-2.5 py-1 rounded-md inline-block border border-[#DCE5F2]">
          ABOUT &amp; ORGANIZERS
        </span>
        <h2 className="text-xl font-display font-extrabold text-[#172B49]">
          Institutional Leadership
        </h2>
        <p className="text-xs text-[#60728A] leading-relaxed max-w-xs mx-auto">
          Student forums, faculty advisors, and technical teams behind YUGANTAR 2026.
        </p>
      </div>

      {/* 2. Organizing Bodies Cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#172B49] border-b border-[#DCE5F2] pb-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#4B91E8]" />
          <span>The Organizing Bodies ({visibleOrgs.length})</span>
        </div>

        <div className="space-y-3">
          {visibleOrgs.map((org, index) => {
            const logo = org.logo_url || org.logoUrl;
            const leadershipNote = org.leadership_note || org.leadershipNote;

            return (
              <div
                key={org.id ? `${org.id}-${index}` : `${org.name}-${index}`}
                className="p-4 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {logo ? (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#DCE5F2] bg-[#EDF5FC] flex items-center justify-center p-1 shrink-0">
                        <Image
                          src={logo}
                          alt={org.name}
                          fill
                          className="object-contain p-1"
                          unoptimized={logo.startsWith('/api/') || logo.includes('google')}
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-[#EDF5FC] text-[#4B91E8] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        0{index + 1}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-display font-bold text-[#172B49] leading-snug">
                        {org.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#8CA0BA] block">
                        {org.role}
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F8FAFD] text-[#4B91E8] border border-[#DCE5F2] shrink-0">
                    {org.badge}
                  </span>
                </div>

                <p className="text-xs text-[#60728A] leading-relaxed line-clamp-3">
                  {org.description}
                </p>

                {leadershipNote && (
                  <div className="p-2.5 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] text-[10px] font-mono text-[#60728A]">
                    <span className="text-[#8CA0BA] block uppercase font-bold mb-0.5 text-[9px]">
                      Scope:
                    </span>
                    <p>{leadershipNote}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Faculty Leadership & Advisors */}
      {facultyMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#172B49] border-b border-[#DCE5F2] pb-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#2F855A]" />
            <span>Faculty Leadership &amp; Advisors ({facultyMembers.length})</span>
          </div>

          <div className="space-y-2">
            {facultyMembers.map((fac, idx) => (
              <div
                key={fac.id ? `${fac.id}-${idx}` : `${fac.name}-${idx}`}
                className="p-3 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs flex items-center gap-3"
              >
                <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#DCE5F2] bg-[#EDF5FC] flex items-center justify-center shrink-0">
                  {fac.avatar_url ? (
                    <Image
                      src={fac.avatar_url}
                      alt={fac.name}
                      fill
                      className="object-cover"
                      unoptimized={fac.avatar_url.startsWith('/api/') || fac.avatar_url.includes('google')}
                    />
                  ) : (
                    <span className="text-xs font-bold font-display text-[#2F855A]">
                      {(fac.name || 'FL')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#172B49] truncate">{fac.name}</h4>
                  <p className="text-[10px] font-mono text-[#2F855A] font-semibold truncate">{fac.role}</p>
                  {fac.department && (
                    <p className="text-[10px] text-[#8CA0BA] truncate">{fac.department}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Turbo Bits Student Organizing Team */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-[#DCE5F2] pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#172B49]">
            <Sparkles className="w-3.5 h-3.5 text-[#E07A43]" />
            <span>Turbo Bits Student Team ({turboBitsMembers.length})</span>
          </div>
          <span className="text-[10px] font-mono text-[#8CA0BA]">Core Execution</span>
        </div>

        {turboBitsMembers.length === 0 ? (
          <div className="p-4 rounded-xl bg-white border border-dashed border-[#DCE5F2] text-center text-xs text-[#8CA0BA]">
            No student team members visible.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {turboBitsMembers.map((member, i) => (
              <div
                key={member.id ? `${member.id}-${i}` : `${member.name}-${i}`}
                className="p-3 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs flex flex-col items-center text-center space-y-2"
              >
                {/* Circular Portrait Image */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#DCE5F2] bg-[#EDF5FC] flex items-center justify-center shadow-2xs">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.name}
                      fill
                      className="object-cover"
                      unoptimized={member.avatar_url.startsWith('/api/') || member.avatar_url.includes('google')}
                    />
                  ) : (
                    <span className="text-sm font-bold font-display text-[#4B91E8]">
                      {(member.name || 'TB')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="w-full">
                  <h4 className="text-xs font-bold text-[#172B49] truncate leading-tight">
                    {member.name || 'Team Member'}
                  </h4>
                  <span className="text-[10px] font-mono text-[#E07A43] font-semibold block truncate mt-0.5">
                    {member.role || 'Student Lead'}
                  </span>
                  {member.department && (
                    <span className="text-[9px] text-[#8CA0BA] block truncate mt-0.5">
                      {member.department}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
