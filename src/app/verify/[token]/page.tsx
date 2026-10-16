import React, { Suspense } from 'react';
import { connection } from 'next/server';
import { db } from '@/lib/db';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  XCircle,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Award,
  ExternalLink,
  Building2,
  CheckCircle2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import type { Metadata } from 'next';

export const instant = false;

export const metadata: Metadata = {
  title: 'Credential Verification | YUGANTAR 2026',
  description: 'Official YUGANTAR 2026 Delegate Credential and Certificate Verification Portal.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface VerifyPageProps {
  params: Promise<{ token: string }>;
}

interface RegistrationVerificationRecord {
  id: string;
  competition_slug: string;
  leader_name: string;
  leader_college: string;
  leader_branch: string;
  team_name: string | null;
  team_size: number;
  payment_status: string | null;
  submission_status: string;
  created_at: string;
  verification_token: string | null;
  pass_issued_at: string | null;
}

interface CertificateVerificationRecord {
  id: string;
  certificate_code: string;
  registration_id: string | null;
  recipient_name: string;
  recipient_college: string | null;
  competition_slug: string;
  certificate_type: string;
  rank_citation: string;
  issued_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
}

function VerifySkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFD] flex items-center justify-center p-6 animate-pulse">
      <div className="w-full max-w-md h-[500px] bg-white rounded-3xl border border-[#DCE5F2]" />
    </div>
  );
}

export default function VerifyPage({ params }: VerifyPageProps) {
  return (
    <Suspense fallback={<VerifySkeleton />}>
      <VerifyContent params={params} />
    </Suspense>
  );
}

async function VerifyContent({ params }: VerifyPageProps) {
  await connection();
  const { token } = await params;

  let reg: RegistrationVerificationRecord | null = null;
  let cert: CertificateVerificationRecord | null = null;

  // 1. Check registrations table
  try {
    const regRows = await db.query<RegistrationVerificationRecord>(
      `SELECT id, competition_slug, leader_name, leader_college, leader_branch,
              team_name, team_size, payment_status, submission_status, created_at,
              verification_token, pass_issued_at 
       FROM registrations 
       WHERE verification_token = ? OR id = ? 
       LIMIT 1`,
      [token, token]
    );
    if (regRows && regRows.length > 0) {
      reg = regRows[0];
    }
  } catch (err) {
    console.error('Registration verification query error:', err);
  }

  // 2. If not a registration pass, check issued_certificates table
  if (!reg) {
    try {
      const certRows = await db.query<CertificateVerificationRecord>(
        `SELECT id, certificate_code, registration_id, recipient_name, recipient_college,
                competition_slug, certificate_type, rank_citation, issued_at, revoked_at, revocation_reason
         FROM issued_certificates
         WHERE certificate_code = ? OR id = ?
         LIMIT 1`,
        [token, token]
      );
      if (certRows && certRows.length > 0) {
        cert = certRows[0];
      }
    } catch (certErr) {
      console.error('Certificate verification query error:', certErr);
    }
  }

  const compSlug = reg?.competition_slug || cert?.competition_slug || '';
  let compName = compSlug.replace(/-/g, ' ').toUpperCase();
  let compCategory = 'Technical';
  let compVenue = 'Priyadarshini College of Engineering, Nagpur';
  let compDate = '21 October 2026';

  if (compSlug) {
    try {
      const compRows = await db.query<{ name: string; category: string; venue: string; event_date: string }>(
        'SELECT name, category, venue, event_date FROM competitions WHERE slug = ? LIMIT 1',
        [compSlug]
      );
      if (compRows && compRows.length > 0) {
        compName = compRows[0].name;
        if (compRows[0].category) compCategory = compRows[0].category;
        if (compRows[0].venue) compVenue = compRows[0].venue;
        if (compRows[0].event_date) compDate = compRows[0].event_date;
      }
      const settings = await db.query<{ setting_value: string }>(
        'SELECT setting_value FROM site_settings WHERE setting_key = ? LIMIT 1',
        ['event_date']
      );
      if (settings?.[0]?.setting_value && !compRows?.[0]?.event_date) {
        compDate = settings[0].setting_value;
      }
    } catch {}
  }

  // -------------------------------------------------------------------------
  // CASE A: Certificate Verification Found
  // -------------------------------------------------------------------------
  if (cert) {
    const isRevoked = Boolean(cert.revoked_at);
    const issueDateStr = cert.issued_at
      ? new Date(cert.issued_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : '21 October 2026';

    return (
      <div className="min-h-screen bg-[#F8FAFD] text-[#172B49] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#60728A] hover:text-[#172B49] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>YUGANTAR 2026</span>
          </Link>
          <span className="text-[11px] font-mono text-[#8CA0BA] uppercase tracking-widest">
            CERTIFICATE VERIFIED
          </span>
        </div>

        <div className="w-full max-w-md bg-white border border-[#DCE5F2] rounded-3xl overflow-hidden shadow-xl relative">
          {/* Status Header */}
          <div
            className={`p-6 sm:p-8 border-b text-center relative ${
              isRevoked
                ? 'bg-gradient-to-b from-rose-50/80 to-white border-rose-100'
                : 'bg-gradient-to-b from-emerald-50/80 to-white border-emerald-100'
            }`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-sm ${
                  isRevoked
                    ? 'bg-rose-100/70 border border-rose-200 text-rose-600'
                    : 'bg-emerald-100/70 border border-emerald-200 text-emerald-600'
                }`}
              >
                {isRevoked ? <AlertTriangle className="w-9 h-9" /> : <Award className="w-9 h-9" />}
              </div>
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border mb-1 ${
                  isRevoked
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}
              >
                {isRevoked ? 'REVOKED / CANCELLED' : 'OFFICIAL CERTIFICATE VERIFIED'}
              </span>
              <h1 className="text-xl font-display font-extrabold text-[#172B49]">
                {isRevoked ? 'CREDENTIAL REVOKED' : 'AUTHENTIC CERTIFICATE'}
              </h1>
              <p className="text-xs text-[#60728A] mt-1">
                {isRevoked
                  ? `Revoked: ${cert.revocation_reason || 'Administrative revocation'}`
                  : 'Official citation conferral recorded in festival archives'}
              </p>
            </div>
          </div>

          {/* Certificate Safe Public Details (No PII: no phone/email exposed) */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                  CERTIFICATE ID
                </span>
                <span className="text-sm font-mono font-bold text-[#172B49] tracking-wider">
                  {cert.certificate_code}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                  STATUS
                </span>
                <span
                  className={`text-xs font-mono font-bold uppercase ${
                    isRevoked ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {isRevoked ? 'Revoked' : 'Authentic & Valid'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0]">
                <Users className="w-4 h-4 text-[#4B91E8] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                    RECIPIENT NAME
                  </span>
                  <div className="text-sm font-bold text-[#172B49] truncate">
                    {cert.recipient_name}
                  </div>
                  <div className="text-[11px] text-[#60728A] truncate">
                    {cert.recipient_college || 'PCE Nagpur'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0]">
                <Award className="w-4 h-4 text-[#F5A16F] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                    CITATION &amp; AWARD
                  </span>
                  <div className="text-sm font-bold text-[#172B49] truncate">
                    {cert.rank_citation}
                  </div>
                  <div className="text-[11px] text-[#60728A]">
                    Event: {compName} ({compCategory})
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                    DATE ISSUED
                  </span>
                  <div className="text-xs font-bold text-[#172B49] mt-0.5 truncate">
                    {issueDateStr}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                    AUTHORITY
                  </span>
                  <div className="text-xs font-bold text-[#172B49] mt-0.5 truncate">
                    TELE-ERA FORUM
                  </div>
                </div>
              </div>
            </div>

            {!isRevoked && (
              <div className="pt-2">
                <a
                  href={`/api/certificate/${cert.certificate_code}/pdf`}
                  download={`YUGANTAR-2026-CERTIFICATE-${cert.certificate_code}.pdf`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#172B49] text-white text-xs font-mono font-bold hover:bg-[#233C63] transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#F5A16F]" />
                  <span>Download Verified Certificate (PDF)</span>
                </a>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-[#EDF5FC] border-t border-[#DCE5F2] text-center text-[10px] font-mono text-[#60728A]">
            TELE-ERA Forum • Dept. of Electronics &amp; Telecommunication Engineering, PCE Nagpur
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // CASE B: Registration Pass Verification
  // -------------------------------------------------------------------------
  const isFound = Boolean(reg);
  const isFree = reg?.payment_status === 'free';
  const isPaymentVerified = reg?.payment_status === 'confirmed' || reg?.payment_status === 'verified';
  const isConfirmed = isFree || isPaymentVerified || reg?.submission_status === 'confirmed';
  const isPending = !isConfirmed && (reg?.submission_status === 'pending' || reg?.submission_status === 'submitted' || reg?.payment_status === 'pending');
  const refCode = reg ? `YUG-26-${reg.id.substring(0, 8).toUpperCase()}` : '';

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#172B49] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Brand Navigation */}
      <div className="w-full max-w-md mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#60728A] hover:text-[#172B49] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>YUGANTAR 2026</span>
        </Link>
        <span className="text-[11px] font-mono text-[#8CA0BA] uppercase tracking-widest">
          CREDENTIAL VERIFY
        </span>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-md bg-white border border-[#DCE5F2] rounded-3xl overflow-hidden shadow-xl relative">
        {/* Verification Status Header */}
        <div
          className={`p-6 sm:p-8 border-b text-center relative ${
            isConfirmed
              ? 'bg-gradient-to-b from-emerald-50/80 to-white border-emerald-100'
              : isPending
              ? 'bg-gradient-to-b from-amber-50/80 to-white border-amber-100'
              : 'bg-gradient-to-b from-rose-50/80 to-white border-rose-100'
          }`}
        >
          {isConfirmed ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 mb-1">
                {isFree ? 'FREE TRACK CONFIRMED' : 'PAYMENT VERIFIED'}
              </span>
              <h1 className="text-xl font-display font-extrabold text-[#172B49]">
                OFFICIAL DELEGATE VERIFIED
              </h1>
              <p className="text-xs text-[#60728A] mt-1">
                Authentic registration recorded in YUGANTAR 2026 Registry
              </p>
            </div>
          ) : isPending ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-sm">
                <Clock className="w-9 h-9" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200 mb-1">
                AWAITING UTR AUDIT
              </span>
              <h1 className="text-xl font-display font-extrabold text-[#172B49]">
                REGISTRATION PENDING REVIEW
              </h1>
              <p className="text-xs text-[#60728A] mt-1">
                Submission recorded. Awaiting payment committee approval.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-100/70 border border-rose-200 flex items-center justify-center text-rose-600 mb-3 shadow-sm">
                <XCircle className="w-9 h-9" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-700 bg-rose-50 px-3 py-0.5 rounded-full border border-rose-200 mb-1">
                NOT VERIFIED
              </span>
              <h1 className="text-xl font-display font-extrabold text-[#172B49]">
                {isFound ? 'INVALID CREDENTIAL' : 'TOKEN NOT FOUND'}
              </h1>
              <p className="text-xs text-[#60728A] mt-1">
                {isFound
                  ? 'This registration was rejected or cancelled.'
                  : 'No event registration or certificate matches this verification token.'}
              </p>
            </div>
          )}
        </div>

        {/* Credential Data (Privacy safe: no personal phone/email exposed) */}
        {isFound && reg && (
          <div className="p-6 space-y-4">
            {/* Reference Badge */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFD] border border-[#DCE5F2]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                  REGISTRATION REFERENCE
                </span>
                <span className="text-sm font-mono font-bold text-[#172B49] tracking-wider">
                  {refCode}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                  ENTRY STATUS
                </span>
                <span
                  className={`text-xs font-mono font-bold uppercase ${
                    isConfirmed
                      ? 'text-emerald-700'
                      : isPending
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {isConfirmed ? 'Authorized' : isPending ? 'Pending' : 'Void'}
                </span>
              </div>
            </div>

            {/* Competition Details */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0]">
                <Award className="w-4 h-4 text-[#4B91E8] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                    COMPETITION TRACK
                  </span>
                  <div className="text-sm font-bold text-[#172B49] truncate">
                    {compName}
                  </div>
                  <div className="text-[11px] text-[#60728A]">
                    Category: {compCategory}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0]">
                <Users className="w-4 h-4 text-[#9187DE] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                    REGISTERED DELEGATION
                  </span>
                  <div className="text-sm font-bold text-[#172B49] truncate">
                    {reg.team_name || reg.leader_name}
                  </div>
                  <div className="text-[11px] text-[#60728A]">
                    Squad size: {reg.team_size} {reg.team_size === 1 ? 'Participant' : 'Members'} · {reg.leader_college}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                    DATE
                  </span>
                  <div className="text-xs font-bold text-[#172B49] mt-0.5">
                    {compDate}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0]">
                  <span className="text-[10px] font-mono uppercase text-[#8CA0BA] block">
                    LOCATION
                  </span>
                  <div className="text-xs font-bold text-[#172B49] mt-0.5 truncate">
                    {compVenue}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Verification Confirmation Note */}
            <div className="pt-2 text-center">
              <span className="text-[11px] font-mono text-[#60728A] flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Official Credential • Festival Verification Portal</span>
              </span>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3.5 bg-[#EDF5FC] border-t border-[#DCE5F2] text-center text-[10px] font-mono text-[#60728A]">
          TELE-ERA Forum • Priyadarshini College of Engineering, Nagpur
        </div>
      </div>
    </div>
  );
}
