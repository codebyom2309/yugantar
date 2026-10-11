import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ORGANIZERS, FESTIVAL_INFO } from '@/data/events';
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
} from 'lucide-react';

export default function AboutPage() {
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
              About YUGANTAR 2026. <br />
              <span className="font-editorial text-sunset-glow font-normal tracking-normal">
                Engineering & Discovery.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#536781] leading-relaxed mb-6 font-normal">
              Organized by the Department of Electronics and Telecommunication Engineering at Priyadarshini College of Engineering, Nagpur. YUGANTAR brings together collegiate minds to collaborate, innovate, and test their engineering skills.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[#15294A]">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                22 October 2026
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DCE5F2] shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-[#9187DE]" />
                PCE Campus, Nagpur
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Body */}
      <main className="py-16 sm:py-20 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Section 1: Department & Festival Mission */}
          <div className="rounded-3xl bg-white border border-[#DCE5F2] p-8 sm:p-12 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4B91E8] bg-[#EDF5FC] px-3 py-1 rounded-md mb-4 inline-block">
                  HOST DEPARTMENT
                </span>

                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#172B49] mb-4">
                  Department of Electronics & Telecommunication Engineering
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
                  Venue & Campus Coordinates
                </h3>

                <div className="space-y-3 text-xs text-[#60728A]">
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Address</span>
                    <p className="font-semibold text-[#172B49]">{FESTIVAL_INFO.address}</p>
                  </div>
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Host College</span>
                    <p className="font-semibold text-[#172B49]">{FESTIVAL_INFO.college}</p>
                  </div>
                  <div>
                    <span className="text-[#8CA0BA] block mb-0.5">Event Date</span>
                    <p className="font-mono font-bold text-[#4B91E8]">{FESTIVAL_INFO.date}</p>
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

          {/* Section 2: The Three Organizing Bodies */}
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
              {ORGANIZERS.map((org, index) => (
                <div
                  key={org.name}
                  className="nexus-card p-7 sm:p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="w-9 h-9 rounded-xl bg-[#EDF5FC] text-[#4B91E8] font-mono text-sm font-bold flex items-center justify-center">
                        0{index + 1}
                      </span>
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
