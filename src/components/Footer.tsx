'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  MapPin,
  Calendar,
  Sparkles,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  ShieldCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { FESTIVAL_INFO, ORGANIZERS } from '@/data/events';
import type { FestivalSettings } from '@/lib/competitions';
import { fetchClientFestivalData } from '@/lib/client-festival-data';

// Clean SVG Social Icons
function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GitHubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Footer({ festival: initialFestival }: { festival?: FestivalSettings }) {
  const [festival, setFestival] = useState<FestivalSettings | undefined>(initialFestival);

  useEffect(() => {
    if (initialFestival) {
      setFestival(initialFestival);
      return;
    }
    // Fetch live festival settings from public endpoint if not passed as prop
    fetchClientFestivalData()
      .then((data) => {
        if (data.festival) {
          const f = data.festival;
          setFestival((prev) => ({
            name: f.name || f.event_name || prev?.name || FESTIVAL_INFO.name,
            edition: f.edition || f.event_edition || prev?.edition || FESTIVAL_INFO.edition,
            concept: f.concept || f.event_concept || prev?.concept || FESTIVAL_INFO.concept,
            tagline: f.tagline || f.event_tagline || prev?.tagline || FESTIVAL_INFO.tagline,
            subheading: f.subheading || f.event_subheading || prev?.subheading || FESTIVAL_INFO.subheading,
            date: f.date || f.event_date || prev?.date || FESTIVAL_INFO.date,
            isoDate: f.isoDate || f.event_iso_date || prev?.isoDate || '2026-10-19',
            venue: f.venue || f.event_venue || prev?.venue || FESTIVAL_INFO.venue,
            locationShort: f.locationShort || f.event_location_short || prev?.locationShort || FESTIVAL_INFO.locationShort,
            address: f.address || (f.event_address ? String(f.event_address) : '') || prev?.address || FESTIVAL_INFO.address,
            department: f.department || (f.event_department ? String(f.event_department) : '') || prev?.department || FESTIVAL_INFO.department,
            organizers: f.organizers || (f.event_organizers_text ? String(f.event_organizers_text) : '') || prev?.organizers || FESTIVAL_INFO.organizers,
            college: f.college || (f.event_college ? String(f.event_college) : '') || prev?.college || FESTIVAL_INFO.college,
            registrationGlobalOpen: f.registrationGlobalOpen ?? true,
            footerDescription: f.footerDescription || (f.footer_description ? String(f.footer_description) : undefined),
            footerEmail: f.footerEmail || (f.footer_email ? String(f.footer_email) : undefined),
            footerPhone: f.footerPhone || (f.footer_phone ? String(f.footer_phone) : undefined),
            footerInstagram: f.footerInstagram || (f.footer_instagram ? String(f.footer_instagram) : undefined),
            footerLinkedin: f.footerLinkedin || (f.footer_linkedin ? String(f.footer_linkedin) : undefined),
            footerGithub: f.footerGithub || (f.footer_github ? String(f.footer_github) : undefined),
            footerCollegeUrl: f.footerCollegeUrl || (f.footer_college_url ? String(f.footer_college_url) : undefined),
            footerCustomLinks: (() => {
              const raw = f.footerCustomLinks || f.footer_custom_links;
              if (!raw) return undefined;
              if (Array.isArray(raw)) return raw;
              try { return JSON.parse(String(raw)); } catch { return undefined; }
            })(),
          }));
        }
      })
      .catch((err) => console.warn('Footer settings background fetch:', err));
  }, [initialFestival]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = '2026';
  const eventName = festival?.name || 'YUGANTAR';
  const edition = festival?.edition || '2026';
  const departmentName = festival?.department || 'Department of Electronics and Telecommunication Engineering';
  const collegeName = festival?.college || 'Priyadarshini College of Engineering, Nagpur';
  const description =
    festival?.footerDescription ||
    'YUGANTAR 2026 is the premier intercollegiate technical symposium organized by the Department of Electronics & Telecommunication Engineering and TELE-ERA at Priyadarshini College of Engineering, Nagpur.';

  const email = festival?.footerEmail || 'teleera.etc@pcenagpur.edu.in';
  const phone = festival?.footerPhone || '+91 7104 236381 / 236382';
  const collegeUrl = festival?.footerCollegeUrl || 'https://www.pcenagpur.edu.in';
  const instagramUrl = festival?.footerInstagram;
  const linkedinUrl = festival?.footerLinkedin;
  const githubUrl = festival?.footerGithub || 'https://github.com/codebyom2309/yugantar';

  const customLinks = festival?.footerCustomLinks && Array.isArray(festival.footerCustomLinks) && festival.footerCustomLinks.length > 0
    ? festival.footerCustomLinks
    : [
        { label: 'Festival Journey Roadmap', url: '/journey' },
        { label: 'NEXUS Districts Map', url: '/districts' },
        { label: 'Campus Direction & Guidelines', url: '/about#campus' },
        { label: 'Official College Portal', url: collegeUrl },
      ];

  return (
    <footer className="bg-[#F8FAFD] text-[#15294A] pt-16 pb-12 border-t border-[#DCE5F2] relative overflow-hidden">
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-gradient-to-br from-[#FFEFE3] to-[#E2EFFF]/40 rounded-full blur-3xl pointer-events-none opacity-70" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#3978F6]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-[#DCE5F2]">
          
          {/* Brand & Institution Info (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#10264A] flex items-center justify-center text-white shadow-xs">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="#FF783E" />
                  <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold tracking-tight text-xl text-[#10264A]">
                  {eventName} {edition}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#FF783E] uppercase tracking-wider">
                  {festival?.concept || 'NEXUS CITY'} · ENGINEERING SYMPOSIUM
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#536781] leading-relaxed max-w-md font-normal">
              {description}
            </p>

            <div className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-xs border border-[#DCE5F2] space-y-2 text-xs text-[#536781]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#3978F6] shrink-0 mt-0.5" />
                <span className="leading-snug">{festival?.address || FESTIVAL_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#FF783E] shrink-0" />
                <span className="font-mono font-semibold text-[#10264A]">
                  {festival?.date || FESTIVAL_INFO.date} · {festival?.locationShort || FESTIVAL_INFO.locationShort}
                </span>
              </div>
            </div>

            {/* Public Contact Details */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#536781] pt-1">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#3978F6] transition-colors font-medium"
                >
                  <Mail className="w-3.5 h-3.5 text-[#3978F6]" />
                  <span>{email}</span>
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.split('/')[0].trim()}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#3978F6] transition-colors font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-[#FF783E]" />
                  <span>{phone}</span>
                </a>
              )}
            </div>

            {/* Official Social Icons */}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-[11px] font-mono font-bold text-[#7E93AC] uppercase mr-1">Connect:</span>
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#FFEFE3] border border-[#DCE5F2] hover:border-[#FF783E]/40 text-[#536781] hover:text-[#FF783E] flex items-center justify-center transition-all shadow-2xs"
                  aria-label="Official Instagram page"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#E9F2FF] border border-[#DCE5F2] hover:border-[#3978F6]/40 text-[#536781] hover:text-[#3978F6] flex items-center justify-center transition-all shadow-2xs"
                  aria-label="Official LinkedIn page"
                >
                  <LinkedInIcon className="w-4 h-4" />
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#E9F2FF] border border-[#DCE5F2] hover:border-[#3978F6]/40 text-[#536781] hover:text-[#10264A] flex items-center justify-center transition-all shadow-2xs"
                  aria-label="Official GitHub repository"
                >
                  <GitHubIcon className="w-4 h-4" />
                </a>
              )}
              {collegeUrl && (
                <a
                  href={collegeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-white hover:bg-[#E9F2FF] border border-[#DCE5F2] hover:border-[#3978F6]/40 text-[#536781] hover:text-[#3978F6] flex items-center justify-center transition-all shadow-2xs"
                  aria-label="Priyadarshini College of Engineering Official Website"
                  title="PCE Official Portal"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Navigation Links (col-span-3) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#10264A] mb-4 flex items-center gap-1.5">
              <span>Festival Navigation</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[#536781] font-medium">
              <li>
                <Link href="/" className="hover:text-[#FF783E] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#7E93AC]" />
                  <span>Home (Festival Gateway)</span>
                </Link>
              </li>
              <li>
                <Link href="/competitions" className="hover:text-[#FF783E] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#7E93AC]" />
                  <span>All 8 Competitions Overview</span>
                </Link>
              </li>
              <li>
                <Link href="/districts" className="hover:text-[#FF783E] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#7E93AC]" />
                  <span>NEXUS Districts Interactive Map</span>
                </Link>
              </li>
              <li>
                <Link href="/journey" className="hover:text-[#FF783E] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#7E93AC]" />
                  <span>Festival Journey Roadmap</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#FF783E] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#7E93AC]" />
                  <span>About & Organizing Forums</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#FF783E] transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#7E93AC]" />
                  <span>FAQ & Guidelines</span>
                </Link>
              </li>
            </ul>

            <div className="mt-6 pt-5 border-t border-[#DCE5F2]">
              <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7E93AC] mb-2.5">
                Helpful Resources
              </h5>
              <ul className="space-y-2 text-xs text-[#536781]">
                {customLinks.map((link, idx) => {
                  const isInternal = typeof link.url === 'string' && link.url.startsWith('/') && !link.url.startsWith('//');
                  return (
                    <li key={idx}>
                      {isInternal ? (
                        <Link href={link.url} className="hover:text-[#3978F6] transition-colors">
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#3978F6] transition-colors flex items-center gap-1"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Organizing Bodies & Advisory Board (col-span-4) */}
          <div className="lg:col-span-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#10264A] mb-4">
              Academic & Organizing Bodies
            </h4>
            <div className="space-y-2.5">
              {ORGANIZERS.map((org) => (
                <div
                  key={org.name}
                  className="p-3.5 rounded-2xl bg-white border border-[#DCE5F2] shadow-2xs hover:border-[#FF783E]/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-display font-bold text-[#10264A] truncate">
                      {org.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E9F2FF] text-[#3978F6] border border-[#DCE5F2] shrink-0">
                      {org.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#536781] font-normal leading-relaxed">
                    {org.role}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-[#FFEFE3]/60 border border-[#FFD9C2] text-xs text-[#8A421D] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#FF783E] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Organized under the patronage of {departmentName}, {collegeName}.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#536781] text-center sm:text-left font-normal">
            © {currentYear} {eventName} · {departmentName}, {collegeName}.
          </p>

          <button
            onClick={scrollToTop}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FFEFE3] text-[#10264A] border border-[#DCE5F2] hover:border-[#FF783E]/40 text-xs font-mono font-bold transition-all shadow-2xs cursor-pointer"
            aria-label="Scroll to top of page"
          >
            <span>Top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#FF783E]" />
          </button>
        </div>

      </div>
    </footer>
  );
}
