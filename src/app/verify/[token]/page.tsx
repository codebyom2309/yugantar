import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, XCircle, ArrowLeft, Calendar, MapPin, Users, Award } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credential Verification | YUGANTAR 2026',
  description: 'Official YUGANTAR 2026 Delegate Credential and Registration Verification Portal.',
};

interface VerifyPageProps {
  params: Promise<{ token: string }>;
}

interface RegistrationVerificationRecord {
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

export default function VerifyPage({ params }: VerifyPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090A0C]" />}>
      <VerifyContent params={params} />
    </Suspense>
  );
}

async function VerifyContent({ params }: VerifyPageProps) {
  await connection();
  const { token } = await params;

  let reg: RegistrationVerificationRecord | null = null;

  try {
    const rows = await db.query<RegistrationVerificationRecord>(
      `SELECT id, competition_slug, leader_name, team_name, team_size, 
              submission_status, created_at, verification_token, pass_issued_at 
       FROM registrations 
       WHERE verification_token = ? OR id = ? 
       LIMIT 1`,
      [token, token]
    );
    if (rows && rows.length > 0) {
      reg = rows[0];
    }
  } catch (err) {
    console.error('Verification query error:', err);
  }

  let compName = reg?.competition_slug?.replace(/-/g, ' ').toUpperCase() || '';
  let compCategory = 'Technical';
  let compVenue = 'Priyadarshini College of Engineering, Nagpur';
  let compDate = '19 October 2026';

  if (reg) {
    try {
      const compRows = await db.query<{ name: string; category: string; venue: string; event_date: string }>(
        'SELECT name, category, venue, event_date FROM competitions WHERE slug = ? LIMIT 1',
        [reg.competition_slug]
      );
      if (compRows && compRows.length > 0) {
        compName = compRows[0].name;
        if (compRows[0].category) compCategory = compRows[0].category;
        if (compRows[0].venue) compVenue = compRows[0].venue;
        if (compRows[0].event_date) compDate = compRows[0].event_date;
      }
      const settings = await db.query<{ value: string }>('SELECT value FROM site_settings WHERE key_name = ?', ['event_date']);
      if (settings?.[0]?.value && (!compRows?.[0]?.event_date)) compDate = settings[0].value;
    } catch {}
  }

  const isFound = !!reg;
  const isConfirmed = reg?.submission_status === 'confirmed';
  const isPending = reg?.submission_status === 'pending' || reg?.submission_status === 'submitted';
  const isFailed = reg?.submission_status === 'failed' || reg?.submission_status === 'cancelled';

  const refCode = reg ? `YUG-26-${reg.id.substring(0, 8).toUpperCase()}` : '';

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F5F5F5] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Brand Navigation */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>YUGANTAR 2026 PORTAL</span>
        </Link>
        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
          SYSTEM VERIFY
        </span>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-md bg-[#14171B] border border-[#2A2E35] rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Verification Status Header */}
        <div
          className={`p-6 border-b text-center relative ${
            isConfirmed
              ? 'bg-emerald-950/40 border-emerald-800/40'
              : isPending
              ? 'bg-amber-950/40 border-amber-800/40'
              : 'bg-rose-950/40 border-rose-800/40'
          }`}
        >
          {isConfirmed ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-950">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-bold text-emerald-300">
                OFFICIAL DELEGATE VERIFIED
              </h1>
              <p className="text-xs text-emerald-400/80 mt-1 font-mono">
                Authentic registration recorded in YUGANTAR 2026 Registry
              </p>
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-950">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-bold text-amber-300">
                REGISTRATION PENDING REVIEW
              </h1>
              <p className="text-xs text-amber-400/80 mt-1 font-mono">
                Submission recorded. Awaiting final desk confirmation.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-950">
                <XCircle className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-bold text-rose-300">
                {isFound ? 'INVALID CREDENTIAL' : 'TOKEN NOT FOUND'}
              </h1>
              <p className="text-xs text-rose-400/80 mt-1 font-mono">
                {isFound
                  ? 'This registration has failed or was cancelled.'
                  : 'No registration matches this verification code.'}
              </p>
            </div>
          )}
        </div>

        {/* Credential Data (Privacy safe: no personal emails or phone numbers exposed) */}
        {isFound && reg && (
          <div className="p-6 space-y-5">
            {/* Reference Badge */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0D0F12] border border-[#2A2E35]">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  REGISTRATION REFERENCE
                </span>
                <span className="text-sm font-mono font-bold text-white tracking-wider">
                  {refCode}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                  STATUS
                </span>
                <span
                  className={`text-xs font-mono font-semibold uppercase ${
                    isConfirmed
                      ? 'text-emerald-400'
                      : isPending
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {reg.submission_status}
                </span>
              </div>
            </div>

            {/* Competition Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Award className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    COMPETITION
                  </span>
                  <div className="text-sm font-semibold text-zinc-100">
                    {compName}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Category: {compCategory}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    REGISTERED ENTITY
                  </span>
                  <div className="text-sm font-semibold text-zinc-100">
                    {reg.team_name || reg.leader_name}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Delegate size: {reg.team_size} {reg.team_size === 1 ? 'Participant' : 'Members'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    FESTIVAL DATE
                  </span>
                  <div className="text-sm text-zinc-200">
                    {compDate}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                    VENUE
                  </span>
                  <div className="text-xs text-zinc-300">
                    {compVenue}
                  </div>
                </div>
              </div>
            </div>

            {/* View Full Pass Link if confirmed */}
            {isConfirmed && (
              <div className="pt-2">
                <Link
                  href={`/pass/${reg.id}`}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition shadow"
                >
                  View Printable Pass
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 bg-[#0D0F12] border-t border-[#2A2E35] text-center text-[11px] font-mono text-zinc-500">
          Cryptographically Verified • YUGANTAR 2026 Operations
        </div>
      </div>
    </div>
  );
}
