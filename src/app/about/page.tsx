import React, { Suspense } from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPublicOrganizers, getPublicOrganizerMembers, getFestivalSettings } from '@/lib/competitions';
import {
  MapPin,
  Calendar,
  Building2,
  ChevronRight,
  ShieldCheck,
  Award,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFD]" />}>
      <AboutContent />
    </Suspense>
  );
}

async function AboutContent() {
  await connection();
  const [organizers, members, festival] = await Promise.all([
    getPublicOrganizers(),
    getPublicOrganizerMembers(),
    getFestivalSettings(),
  ]);

  const turboBitsTeam = members.filter((m) => m.category === 'turbo_bits');
  const facultyLeads = members.filter((m) => m.category === 'faculty');

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
      <Navbar />

      {/* Hero Header in Light Atmospheric Sky Tone */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 bg-gradient-to-b from-[#EDF5FC] to-[#F8FAFD] overflow-hidden border-b border-[#DCE5F2]">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#FFF4EA] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#536781] mb-5">
            <Link href="/" className="hover:text-[#15294A] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#7E93AC]" />
            <span className="text-[#3B82F6] font-semibold">About & Organizers</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#FFE0CE] text-xs font-mono font-bold text-[#FF874D] uppercase tracking-wider mb-4 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>INSTITUTIONAL HERITAGE & LEADERSHIP</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-[#15294A] mb-4 sm:mb-5 text-balance">
              About {festival.name} {festival.edition}. <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal">
                Engineering & Discovery.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#536781] leading-relaxed mb-6 font-normal">
              Organized by {festival.department} at {festival.college}. {festival.name} brings together collegiate minds to collaborate, innovate, and test their engineering skills.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#15294A]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                {festival.date}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-[#9187DE]" />
                {festival.locationShort}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="py-16 sm:py-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Section 1: The Three Organizing Bodies */}
          <div id="organizers">
            <div className="mb-10 text-center max-w-2xl mx-auto">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4B91E8] bg-[#EDF5FC] px-3 py-1 rounded-md mb-3 inline-block">
                STUDENT FORUMS & COMMITTEES
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#172B49] mb-3">
                The Organizing Bodies
              </h2>
              <p className="text-sm text-[#60728A]">
                Three verified student and institutional forums collaborating to execute YUGANTAR 2026.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {organizers.map((org, index) => (
                <div
                  key={(org as any).id ? `${(org as any).id}-${index}` : `${org.name}-${index}`}
                  className="nexus-card p-7 sm:p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      {org.logoUrl ? (
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-[#DCE5F2] bg-[#EDF5FC] flex items-center justify-center p-1">
                          <Image
                            src={org.logoUrl}
                            alt={org.name}
                            fill
                            className="object-contain p-1"
                            unoptimized={org.logoUrl.startsWith('/api/') || org.logoUrl.includes('google')}
                          />
                        </div>
                      ) : (
                        <span className="w-9 h-9 rounded-xl bg-[#EDF5FC] text-[#4B91E8] font-mono text-sm font-bold flex items-center justify-center">
                          0{index + 1}
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#F8FAFD] text-[#4B91E8] border border-[#DCE5F2]">
                        {org.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-display font-bold text-[#172B49] mb-2 leading-snug">
                      {org.name}
                    </h3>

                    <span className="text-xs font-mono text-[#8CA0BA] block mb-4">
                      {org.role}
                    </span>

                    <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed mb-6 font-normal">
                      {org.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0] text-xs font-mono text-[#172B49] bg-[#F8FAFD] p-3 rounded-xl">
                    <span className="text-[#8CA0BA] block text-[10px] uppercase font-bold mb-1">
                      Leadership Scope:
                    </span>
                    <p className="text-[11px] text-[#60728A]">{org.leadershipNote}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Faculty Leadership & Institutional Advisors */}
          {facultyLeads.length > 0 && (
            <div id="faculty-leadership" className="space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2F855A] bg-[#EDF7F2] border border-[#C6E6D5] px-3 py-1 rounded-md mb-3 inline-block">
                  INSTITUTIONAL MENTORSHIP
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#172B49] mb-2">
                  Faculty Leadership &amp; Advisors
                </h2>
                <p className="text-xs sm:text-sm text-[#60728A]">
                  Guiding academic rigor, professional standards, and intercollegiate coordination.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {facultyLeads.map((fac, idx) => (
                  <div
                    key={fac.id ? `${fac.id}-${idx}` : `${fac.name}-${idx}`}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs flex items-center gap-4"
                  >
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#DCE5F2] bg-[#EDF5FC] flex items-center justify-center shrink-0">
                      {fac.avatar_url ? (
                        <Image
                          src={fac.avatar_url}
                          alt={fac.name}
                          fill
                          className="object-cover"
                          unoptimized={fac.avatar_url.startsWith('/api/') || fac.avatar_url.includes('google')}
                        />
                      ) : (
                        <span className="text-sm font-bold font-display text-[#2F855A]">
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
                      <h4 className="text-sm sm:text-base font-display font-bold text-[#172B49] truncate">
                        {fac.name}
                      </h4>
                      <p className="text-xs font-mono text-[#2F855A] font-semibold truncate mt-0.5">
                        {fac.role}
                      </p>
                      {fac.department && (
                        <p className="text-xs text-[#8CA0BA] truncate mt-0.5">{fac.department}</p>
                      )}
                      {fac.bio && (
                        <p className="text-xs text-[#60728A] line-clamp-2 mt-1 font-normal leading-relaxed">
                          {fac.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Turbo Bits Student Organizing Team */}
          {turboBitsTeam.length > 0 && (
            <div id="turbo-bits-team" className="space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#E07A43] bg-[#FFF4EA] border border-[#FFE0CE] px-3 py-1 rounded-md mb-3 inline-block">
                  CORE STUDENT EXECUTION
                </span>
                <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#172B49] mb-3">
                  Turbo Bits Student Organizing Team
                </h2>
                <p className="text-sm text-[#60728A]">
                  The designated student engineering committee driving challenge logistics, software infrastructure, hardware labs, and participant operations for YUGANTAR 2026.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                {turboBitsTeam.map((member, idx) => (
                  <div
                    key={member.id ? `${member.id}-${idx}` : `${member.name}-${idx}`}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DCE5F2] shadow-xs flex flex-col items-center text-center space-y-3 transition-transform hover:-translate-y-1"
                  >
                    {/* Circular Portrait Image */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#DCE5F2] bg-[#EDF5FC] flex items-center justify-center shadow-xs">
                      {member.avatar_url ? (
                        <Image
                          src={member.avatar_url}
                          alt={member.name}
                          fill
                          className="object-cover"
                          unoptimized={member.avatar_url.startsWith('/api/') || member.avatar_url.includes('google')}
                        />
                      ) : (
                        <span className="text-base sm:text-lg font-bold font-display text-[#4B91E8]">
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
                      <h4 className="text-xs sm:text-sm font-display font-bold text-[#172B49] truncate leading-tight">
                        {member.name}
                      </h4>
                      <span className="text-[11px] font-mono font-semibold text-[#E07A43] block truncate mt-1">
                        {member.role}
                      </span>
                      {member.department && (
                        <span className="text-[10px] text-[#8CA0BA] block truncate mt-0.5">
                          {member.department}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Department Heritage & Campus Coordinates (About Us) */}
          <div className="rounded-3xl bg-white border border-[#DCE5F2] p-8 sm:p-12 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4B91E8] bg-[#EDF5FC] px-3 py-1 rounded-md mb-4 inline-block">
                  HOST DEPARTMENT
                </span>

                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#172B49] mb-4">
                  Department of Electronics &amp; Telecommunication Engineering
                </h2>

                <p className="text-sm sm:text-base text-[#60728A] leading-relaxed mb-4 font-normal">
                  The Department of Electronics and Telecommunication Engineering at Priyadarshini College of Engineering, Nagpur has been at the forefront of technical education, applied research, and student innovation.
                </p>

                <p className="text-xs sm:text-sm text-[#8CA0BA] leading-relaxed mb-6 font-normal">
                  YUGANTAR serves as the department&apos;s annual flagship technical conclave. By combining hardware model exhibitions, timed laboratory circuit challenges, technical paper presentations, and corporate recruitment simulations, the festival bridges textbook theory with industry application.
                </p>

                <div className="flex items-center gap-3 text-xs font-mono text-[#4B91E8] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Priyadarshini College of Engineering, Nagpur</span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 rounded-2xl bg-[#F8FAFD] border border-[#DCE5F2]">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#172B49] mb-4">
                  Venue &amp; Campus Coordinates
                </h3>

                <div className="space-y-3 text-xs text-[#60728A]">
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Address</span>
                    <p className="font-semibold text-[#172B49]">{festival.address}</p>
                  </div>
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Host College</span>
                    <p className="font-semibold text-[#172B49]">{festival.college}</p>
                  </div>
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Event Date</span>
                    <p className="font-mono font-bold text-[#4B91E8]">{festival.date}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
                  <Link
                    href="/competitions"
                    className="nexus-btn-primary w-full py-2.5 text-xs font-mono font-bold tracking-wider uppercase gap-2"
                  >
                    <span>View All 8 Competitions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Closing Call to Action in Soft Pale Sky */}
          <div className="rounded-2xl bg-[#EDF5FC] p-8 sm:p-12 border border-[#DCE5F2] text-center relative overflow-hidden">
            <div className="max-w-xl mx-auto relative z-10">
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#172B49] mb-4">
                Join Us at YUGANTAR 2026
              </h3>
              <p className="text-xs sm:text-sm text-[#60728A] leading-relaxed mb-6 font-normal">
                Explore the eight competition tracks and prepare your team for an unforgettable day of engineering challenges at PCE Nagpur.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/competitions"
                  className="nexus-btn-primary px-7 py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2 shadow-xs"
                >
                  <span>Explore Competitions</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/districts"
                  className="nexus-btn-secondary px-6 py-3 text-xs font-mono font-bold tracking-wider uppercase gap-2"
                >
                  <Compass className="w-4 h-4 text-[#4B91E8]" />
                  <span>City Districts Map</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
