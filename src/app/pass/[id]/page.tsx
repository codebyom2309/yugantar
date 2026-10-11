import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Clock, Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Digital Delegate Pass | YUGANTAR 2026',
  description: 'Official YUGANTAR 2026 Technical Festival Delegate Pass and Entry Credential.',
};

interface PassPageProps {
  params: Promise<{ id: string }>;
}

interface RegistrationPassRecord {
  id: string;
  competition_slug: string;
  leader_name: string;
  team_name: string | null;
  team_size: number;
  submission_status: string;
  created_at: string;
  verification_token: string | null;
  pass_issued_at: string | null;
}

export default function PassPage({ params }: PassPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090A0C]" />}>
      <PassContent params={params} />
    </Suspense>
  );
}

async function PassContent({ params }: PassPageProps) {
  await connection();
  const { id } = await params;

  let reg: RegistrationPassRecord | null = null;

  try {
    const rows = await db.query<RegistrationPassRecord>(
      `SELECT id, competition_slug, leader_name, team_name, team_size, 
              submission_status, created_at, verification_token, pass_issued_at 
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
  let compVenue = 'Priyadarshini College of Engineering, Nagpur';
  let compDate = '19 October 2026';
  try {
    const compRows = await db.query<{ name: string; venue: string; event_date: string }>(
      'SELECT name, venue, event_date FROM competitions WHERE slug = ? LIMIT 1',
      [reg.competition_slug]
    );
    if (compRows && compRows.length > 0) {
      compName = compRows[0].name;
      if (compRows[0].venue) compVenue = compRows[0].venue;
      if (compRows[0].event_date) compDate = compRows[0].event_date;
    }
    const settings = await db.query<{ value: string }>('SELECT value FROM site_settings WHERE key_name = ?', ['event_date']);
    if (settings?.[0]?.value && (!compRows?.[0]?.event_date)) compDate = settings[0].value;
  } catch {}

  const isConfirmed = reg.submission_status === 'confirmed';
  const isPending = reg.submission_status === 'pending' || reg.submission_status === 'submitted';
  const isFailed = reg.submission_status === 'failed' || reg.submission_status === 'cancelled';

  // Generate QR Code URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yugantar2026.pce.ac.in';
  const verifyToken = reg.verification_token || reg.id;
  const verifyUrl = `${appUrl}/verify/${verifyToken}`;

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 240,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (qrErr) {
    console.error('Failed to generate pass QR:', qrErr);
  }

  const passReference = `YUG-26-${reg.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F5F5F5] flex flex-col items-center justify-center p-4 sm:p-6 print:bg-white print:text-black print:p-0">
      {/* Top action bar - Hidden on print */}
      <div className="w-full max-w-lg mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>YUGANTAR 2026</span>
        </Link>
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14171B] border border-[#2A2E35] text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-500 transition shadow-sm cursor-pointer"
          data-print-trigger
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Pass</span>
        </button>
      </div>

      {/* Main Pass Container */}
      <div className="w-full max-w-lg bg-[#14171B] border border-[#2A2E35] rounded-2xl overflow-hidden shadow-2xl relative print:border-2 print:border-black print:shadow-none print:bg-white">
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-b from-[#1A1D22] to-[#14171B] border-b border-[#2A2E35] relative print:border-b-2 print:border-black print:bg-white">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400 block mb-1">
                Official Credential • YUGANTAR 2026
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white print:text-black">
                DELEGATE PASS
              </h1>
              <p className="text-xs text-zinc-400 print:text-zinc-600 mt-0.5">
                Priyadarshini College of Engineering, Nagpur
              </p>
            </div>
            {/* Status Badge */}
            <div className="text-right">
              {isConfirmed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 print:bg-gray-100 print:text-black print:border-black">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  CONFIRMED
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60 print:bg-gray-100 print:text-black">
                  <Clock className="w-3.5 h-3.5" />
                  VERIFICATION PENDING
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/60 print:bg-gray-100 print:text-black">
                  <AlertCircle className="w-3.5 h-3.5" />
                  INVALID / REJECTED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Verification Status Banner if not confirmed */}
        {!isConfirmed && (
          <div className="px-6 py-3 bg-amber-950/40 border-b border-amber-800/30 text-amber-300 text-xs flex items-center gap-2 print:border-b print:text-black">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {isPending
                ? 'This entry pass is currently undergoing verification by the registration committee.'
                : 'This registration has not been approved or has been cancelled.'}
            </span>
          </div>
        )}

        {/* Pass Details Body */}
        <div className="p-6 space-y-6">
          {/* Competition Info */}
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block mb-1">
              COMPETITION TRACK
            </span>
            <div className="text-lg font-semibold text-white print:text-black">
              {compName}
            </div>
          </div>

          {/* Participant / Squad Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2A2E35]/60 print:border-zinc-300">
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block mb-1">
                {reg.team_name ? 'TEAM / SQUAD' : 'PRIMARY PARTICIPANT'}
              </span>
              <div className="text-sm font-semibold text-zinc-200 print:text-black">
                {reg.team_name || reg.leader_name}
              </div>
              {reg.team_name && (
                <div className="text-xs text-zinc-400 print:text-zinc-600 mt-0.5">
                  Lead: {reg.leader_name}
                </div>
              )}
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block mb-1">
                DELEGATE SIZE
              </span>
              <div className="text-sm font-semibold text-zinc-200 print:text-black">
                {reg.team_size} {reg.team_size === 1 ? 'Participant' : 'Members'}
              </div>
            </div>
          </div>

          {/* Date & Venue */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2A2E35]/60 print:border-zinc-300">
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block mb-1">
                EVENT DATE
              </span>
              <div className="text-sm font-medium text-zinc-200 print:text-black">
                {compDate}
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block mb-1">
                REPORTING VENUE
              </span>
              <div className="text-xs text-zinc-300 print:text-black line-clamp-2">
                {compVenue}
              </div>
            </div>
          </div>

          {/* QR Code and Reference Block */}
          <div className="pt-4 border-t border-[#2A2E35] flex items-center justify-between gap-4 print:border-black">
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 block mb-0.5">
                PASS REFERENCE
              </span>
              <div className="text-sm font-mono font-bold tracking-wider text-zinc-100 print:text-black">
                {passReference}
              </div>
              <p className="text-[11px] text-zinc-400 print:text-zinc-600 mt-1 max-w-[200px] leading-tight">
                Scan on-site at the security & desk check-in point to verify entry authorization.
              </p>
            </div>

            {/* QR Code Graphic */}
            <div className="p-2 bg-white rounded-xl shadow-inner shrink-0 border border-zinc-200">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Verification Code for ${passReference}`}
                  className="w-24 h-24 sm:w-28 sm:h-28"
                />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center text-xs text-zinc-500">
                  QR Error
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-[#0D0F12] border-t border-[#2A2E35] flex items-center justify-between text-[11px] font-mono text-zinc-500 print:bg-white print:border-t-2 print:border-black">
          <span>YUGANTAR 2026 • NEXUS CITY</span>
          <span>AUTONOMOUS CREDENTIAL</span>
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
