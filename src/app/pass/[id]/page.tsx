import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  Clock,
  AlertCircle,
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  GraduationCap,
  Sparkles,
  Download,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import { verifyPassToken, PassTokenPayload, PassMemberInfo } from '@/lib/passToken';

export const metadata: Metadata = {
  title: 'Digital Delegate Pass | YUGANTAR 2026',
  description: 'Official YUGANTAR 2026 Technical Festival Delegate Pass and Entry Credential.',
};

interface PassPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ token?: string }>;
}

interface RegistrationPassRecord {
  id: string;
  competition_slug: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;
  leader_college: string;
  leader_branch: string;
  leader_semester: string;
  team_name: string | null;
  team_size: number;
  form_data?: string | null;
  payment_id: string | null;
  payment_status: string | null;
  submission_status: string;
  created_at: string;
  verification_token: string | null;
  pass_issued_at: string | null;
}

function PassSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFD] flex items-center justify-center p-6 animate-pulse">
      <div className="w-full max-w-xl h-[600px] bg-white rounded-3xl border border-[#DCE5F2]" />
    </div>
  );
}

export default function PassPage({ params, searchParams }: PassPageProps) {
  return (
    <Suspense fallback={<PassSkeleton />}>
      <PassContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PassContent({ params, searchParams }: PassPageProps) {
  await connection();
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const token = resolvedSearchParams.token;

  let tokenPayload: PassTokenPayload | null = null;
  if (token) {
    tokenPayload = verifyPassToken(token, id);
  }

  let reg: RegistrationPassRecord | null = null;

  try {
    const rows = await db.query<RegistrationPassRecord>(
      `SELECT id, competition_slug, leader_name, leader_email, leader_phone,
              leader_college, leader_branch, leader_semester, team_name, team_size,
              form_data, payment_id, payment_status, submission_status, created_at,
              verification_token, pass_issued_at 
       FROM registrations WHERE id = ? OR verification_token = ? LIMIT 1`,
      [id, id]
    );
    if (rows && rows.length > 0) {
      reg = rows[0];
    }
  } catch (err) {
    console.error('Pass lookup error:', err);
  }

  if (!reg) {
    notFound();
  }

  // Fetch competition details
  let compName = reg.competition_slug.replace(/-/g, ' ').toUpperCase();
  let compCategory = 'Hardware & Circuits';
  let compVenue = 'Priyadarshini College of Engineering, Nagpur';
  let compDate = '19 October 2026';
  let accentColor = '#4B91E8';

  try {
    const compRows = await db.query<{
      name: string;
      category: string;
      venue: string;
      event_date: string;
      accent_color: string;
    }>(
      'SELECT name, category, venue, event_date, accent_color FROM competitions WHERE slug = ? LIMIT 1',
      [reg.competition_slug]
    );
    if (compRows && compRows.length > 0) {
      const c = compRows[0];
      compName = c.name;
      if (c.category) compCategory = c.category;
      if (c.venue) compVenue = c.venue;
      if (c.event_date) compDate = c.event_date;
      if (c.accent_color) accentColor = c.accent_color;
    }
    const settings = await db.query<{ setting_value: string }>(
      'SELECT setting_value FROM site_settings WHERE setting_key = ? LIMIT 1',
      ['event_date']
    );
    if (settings?.[0]?.setting_value && (!compRows?.[0]?.event_date)) {
      compDate = settings[0].setting_value;
    }
  } catch (compErr) {
    console.warn('Failed to fetch full competition metadata for pass:', compErr);
  }

  // Decode multi-member roster from stateless HMAC token or stored form data
  let rosterMembers: PassMemberInfo[] = [];
  if (tokenPayload && tokenPayload.members && tokenPayload.members.length > 0) {
    rosterMembers = tokenPayload.members;
  } else if (reg.form_data) {
    try {
      const parsed = JSON.parse(reg.form_data);
      for (let i = 2; i <= 4; i++) {
        const mName = parsed[`member${i}Name`] || parsed[`player${i}Name`];
        if (mName) {
          rosterMembers.push({
            name: mName,
            college: parsed[`member${i}College`] || parsed[`player${i}College`] || reg.leader_college,
            branch: parsed[`member${i}Branch`] || parsed[`player${i}Branch`] || reg.leader_branch,
            semester: parsed[`member${i}Semester`] || parsed[`player${i}Semester`] || reg.leader_semester,
          });
        }
      }
    } catch {}
  }

  const isFree = reg.payment_status === 'free';
  const isPaymentVerified = reg.payment_status === 'confirmed' || reg.payment_status === 'verified';
  const isConfirmed = isFree || isPaymentVerified || reg.submission_status === 'confirmed';
  const isPending = !isConfirmed && (reg.submission_status === 'pending' || reg.submission_status === 'submitted' || reg.payment_status === 'pending');
  const isRejected = reg.submission_status === 'failed' || reg.payment_status === 'rejected';

  // Generate QR Code URL pointing to /verify/[token]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yugantar2026.pce.ac.in';
  const verifyToken = reg.verification_token || reg.id;
  const verifyUrl = `${appUrl}/verify/${verifyToken}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 240,
      color: {
        dark: '#172B49',
        light: '#FFFFFF',
      },
    });
  } catch (qrErr) {
    console.error('Failed to generate pass QR:', qrErr);
  }

  const passReference = `YUG-26-${reg.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#172B49] flex flex-col items-center justify-center p-4 sm:p-6 print:bg-white print:p-0">
      {/* Top action bar - Hidden on print */}
      <div className="w-full max-w-xl mb-5 flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#60728A] hover:text-[#172B49] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to YUGANTAR 2026</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/verify/${verifyToken}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] text-xs font-mono font-semibold text-[#60728A] hover:text-[#172B49] hover:bg-[#EDF5FC] transition shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Verify Live</span>
          </Link>
          <a
            href={`/api/pass/${reg.id}/pdf${token ? `?token=${token}` : ''}`}
            download={`YUGANTAR-2026-PASS-${reg.id.substring(0, 8)}.pdf`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#172B49] text-white text-xs font-mono font-bold hover:bg-[#233C63] transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#F5A16F]" />
            <span>Download PDF</span>
          </a>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCE5F2] text-[#172B49] text-xs font-mono font-bold hover:bg-[#EDF5FC] transition shadow-xs cursor-pointer"
            data-print-trigger
          >
            <Printer className="w-3.5 h-3.5 text-[#4B91E8]" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Main Pass Container — Cloud White Theme with Navy Typography */}
      <div className="w-full max-w-xl bg-white border border-[#DCE5F2] rounded-3xl overflow-hidden shadow-xl relative print:border-2 print:border-[#172B49] print:shadow-none print:rounded-none">
        {/* Top Header Banner: Institutional & Forum Branding */}
        <div className="p-6 bg-gradient-to-br from-[#EDF5FC] via-white to-[#F8FAFD] border-b border-[#DCE5F2] relative">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#4B91E8] bg-[#EDF5FC] px-2.5 py-0.5 rounded-full border border-[#B8D5F8]">
                  TELE-ERA FORUM
                </span>
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#8CA0BA]">
                  PCE NAGPUR
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-[#172B49]">
                YUGANTAR 2026
              </h1>
              <p className="text-xs text-[#60728A] font-medium leading-tight">
                Department of Electronics &amp; Telecommunication Engineering
              </p>
              <p className="text-[11px] text-[#8CA0BA]">
                Priyadarshini College of Engineering, Nagpur
              </p>
            </div>

            {/* Official Pass Badge */}
            <div className="text-right shrink-0">
              <div className="px-3 py-1 rounded-xl bg-[#172B49] text-white text-[11px] font-mono font-bold tracking-wider uppercase mb-1">
                DELEGATE PASS
              </div>
              <span className="text-[10px] font-mono text-[#8CA0BA] block">
                {passReference}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Status Ribbon */}
        <div
          className={`px-6 py-2.5 flex items-center justify-between text-xs font-mono font-bold border-b ${
            isConfirmed
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : isPending
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isConfirmed ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : isPending ? (
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>
              {isConfirmed
                ? (isFree ? 'ENTRY AUTHORIZED • FREE TRACK' : 'ENTRY AUTHORIZED • PAYMENT VERIFIED')
                : isPending
                ? 'VERIFICATION PENDING • COMMITTEE REVIEW'
                : 'INVALID / REGISTRATION REJECTED'}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider hidden sm:inline">
            {isConfirmed ? 'AUTHENTIC' : isPending ? 'AWAITING UTR AUDIT' : 'VOID'}
          </span>
        </div>

        {/* Pass Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Competition Track Highlight */}
          <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2]">
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#8CA0BA] block mb-1">
              COMPETITION ARENA
            </span>
            <div className="text-lg sm:text-xl font-display font-extrabold text-[#172B49]">
              {compName}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-[#60728A]">
                Category: {compCategory}
              </span>
            </div>
          </div>

          {/* Participant & Team Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#8CA0BA] block">
                {reg.team_name ? 'TEAM LEADER' : 'PRIMARY PARTICIPANT'}
              </span>
              <div className="text-sm font-bold text-[#172B49]">
                {reg.leader_name}
              </div>
              <div className="text-[11px] font-mono text-[#60728A]">
                Ref: YUG-26-{reg.id.substring(0, 8).toUpperCase()}
              </div>
              <div className="text-[10px] font-mono text-[#4B91E8] font-semibold">
                Status: {isConfirmed ? 'Credential Confirmed' : isPending ? 'Pending Audit' : 'Invalid'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#E2E8F0] space-y-1">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#8CA0BA] block">
                TEAM / DELEGATION
              </span>
              <div className="text-sm font-bold text-[#172B49]">
                {reg.team_name || 'Solo Participant'}
              </div>
              <div className="text-[11px] text-[#60728A]">
                Squad Size: {reg.team_size} {reg.team_size === 1 ? 'Member' : 'Members'}
              </div>
              {reg.payment_id && reg.payment_id !== 'FREE-TRACK' && (
                <div className="text-[11px] font-mono text-[#4B91E8] truncate">
                  UTR: {reg.payment_id}
                </div>
              )}
            </div>
          </div>

          {/* College & Department */}
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-[#8CA0BA] block">
              ACADEMIC AFFILIATION
            </span>
            <div className="text-xs font-bold text-[#172B49]">
              {reg.leader_college}
            </div>
            <div className="text-[11px] text-[#60728A]">
              Branch: {reg.leader_branch} · Semester {reg.leader_semester}
            </div>
          </div>

          {/* Date & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
              <Calendar className="w-4 h-4 text-[#4B91E8] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                  REPORTING DATE
                </span>
                <span className="text-xs font-bold text-[#172B49]">
                  {compDate}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
              <MapPin className="w-4 h-4 text-[#E07A43] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                  VENUE
                </span>
                <span className="text-xs font-bold text-[#172B49] line-clamp-1">
                  {compVenue}
                </span>
              </div>
            </div>
          </div>

          {/* Multi-member Team Delegation Roster */}
          {rosterMembers.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#172B49]">
                  <Users className="w-4 h-4 text-[#4B91E8]" />
                  <span>TEAM DELEGATION ROSTER</span>
                </div>
                <span className="text-[10px] font-mono text-[#8CA0BA]">
                  {rosterMembers.length + 1} Registered Delegates
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Team Leader Card */}
                <div className="p-3 rounded-xl bg-white border border-[#DCE5F2] flex items-center justify-between text-xs shadow-2xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#4B91E8] block">
                      Delegate 1 • Team Leader
                    </span>
                    <span className="font-bold text-[#172B49] block">{reg.leader_name}</span>
                    <span className="text-[11px] text-[#60728A] block">
                      {reg.leader_college} ({reg.leader_branch})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Lead
                  </span>
                </div>

                {/* Team Members */}
                {rosterMembers.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-[#DCE5F2] flex items-center justify-between text-xs shadow-2xs">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                        Delegate {idx + 2} • Team Member
                      </span>
                      <span className="font-bold text-[#172B49] block">{m.name}</span>
                      <span className="text-[11px] text-[#60728A] block">
                        {m.college || reg.leader_college} {m.branch ? `(${m.branch})` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#4B91E8] bg-[#EDF5FC] border border-[#B8D5F8] px-2 py-0.5 rounded-full font-semibold">
                      Member
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code and Check-in Verification Block */}
          <div className="pt-4 border-t border-[#DCE5F2] flex items-center justify-between gap-4">
            <div className="space-y-1 max-w-[280px]">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#8CA0BA] block">
                DIGITAL ENTRY CREDENTIAL
              </span>
              <div className="text-xs font-mono font-extrabold text-[#172B49]">
                {passReference}
              </div>
              <p className="text-[11px] text-[#60728A] leading-relaxed">
                Present this QR code on your mobile device or printed pass at the college entry gate and registration desk for check-in validation.
              </p>
            </div>

            {/* High-Resolution QR Graphic */}
            <div className="p-2.5 bg-white rounded-2xl shadow-sm shrink-0 border border-[#DCE5F2] text-center">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Verification Code for ${passReference}`}
                  className="w-24 h-24 sm:w-28 sm:h-28 mx-auto"
                />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center text-xs text-[#8CA0BA]">
                  QR Code
                </div>
              )}
              <span className="text-[9px] font-mono text-[#8CA0BA] block mt-1 uppercase">
                Scan to Verify
              </span>
            </div>
          </div>
        </div>

        {/* Footer Security Stamp */}
        <div className="p-4 bg-[#EDF5FC] border-t border-[#DCE5F2] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#60728A] gap-2">
          <span>YUGANTAR 2026 • TELE-ERA FORUM</span>
          <span>AUTONOMOUS CREDENTIAL #PCE-ETC</span>
        </div>
      </div>

      {/* Client print script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelector('[data-print-trigger]')?.addEventListener('click', function() {
              window.print();
            });
          `,
        }}
      />
    </div>
  );
}
