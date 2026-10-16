import React from 'react';
import Image from 'next/image';
import { Users, Phone, Mail } from 'lucide-react';

export interface CoordinatorData {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_public?: number | boolean;
}

export default function CoordinatorsPreviewCard({
  coordinators,
}: {
  coordinators: CoordinatorData[];
}) {
  const publicCoords = (coordinators || []).filter(
    (c) => c.is_public === undefined || Boolean(c.is_public)
  );

  return (
    <div className="rounded-3xl bg-white border border-[#DCE5F2] p-5 sm:p-6 shadow-xs space-y-3">
      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#172B49] pb-2 border-b border-[#E2E8F0] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[#8578D8]" />
          <span>Track Coordinators</span>
        </span>
        <span className="text-[10px] font-mono text-[#8CA0BA]">
          {publicCoords.length} Assigned
        </span>
      </h3>

      {publicCoords.length > 0 ? (
        <div className="space-y-2.5">
          {publicCoords.map((c, idx) => (
            <div
              key={c.id ? `${c.id}-${idx}` : `${c.name}-${idx}`}
              className="p-3 rounded-2xl bg-[#F8FAFD] border border-[#E2E8F0] space-y-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-[#DCE5F2] bg-[#EDF5FC] flex items-center justify-center shrink-0">
                  {c.avatar_url ? (
                    <Image
                      src={c.avatar_url}
                      alt={c.name}
                      fill
                      className="object-cover"
                      unoptimized={c.avatar_url.startsWith('/api/') || c.avatar_url.includes('google')}
                    />
                  ) : (
                    <span className="text-xs font-bold font-display text-[#4B91E8]">
                      {(c.name || 'TC')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[#172B49] truncate">{c.name || 'Coordinator'}</div>
                  <div className="text-[11px] text-[#60728A] truncate font-medium">{c.role || 'Track Coordinator'}</div>
                </div>
              </div>

              {(c.phone || c.email) && (
                <div className="pt-2 border-t border-[#E2E8F0]/70 flex flex-wrap gap-2 text-[10px] font-mono">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#DCE5F2] text-[#172B49] hover:text-[#4B91E8] hover:border-[#4B91E8]/50 transition-colors"
                      title={`Call ${c.name || 'Coordinator'}`}
                    >
                      <Phone className="w-2.5 h-2.5 text-[#4B91E8]" />
                      <span>{c.phone}</span>
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-[#DCE5F2] text-[#60728A] hover:text-[#172B49] hover:border-[#8578D8]/50 transition-colors truncate max-w-full"
                      title={`Email ${c.name || 'Coordinator'}`}
                    >
                      <Mail className="w-2.5 h-2.5 text-[#8578D8]" />
                      <span className="truncate">{c.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-dashed border-[#DCE5F2] text-center text-xs text-[#8CA0BA]">
          No track coordinators assigned yet.
        </div>
      )}
    </div>
  );
}
