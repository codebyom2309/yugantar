'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Lightbulb,
  Presentation,
  Briefcase,
  Image as ImageIcon,
  Gamepad2,
  ArrowRight,
  CheckCircle2,
  Zap,
  Target,
} from 'lucide-react';

interface Archetype {
  id: string;
  label: string;
  tagline: string;
  icon: React.ElementType;
  primaryMatch: string;
  matchedId: string;
  category: string;
  matchScore: string;
  keySkills: string[];
  recommendedGear: string;
  summary: string;
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'hardware',
    label: 'Hardware Hacker',
    tagline: 'Soldering circuits, embedded controllers & live prototype testing',
    icon: Cpu,
    primaryMatch: 'Project Competition / Breadboard Challenge',
    matchedId: 'project-competition',
    category: 'Hardware & Circuits',
    matchScore: '99% Compatibility',
    keySkills: ['Embedded Systems', 'Circuit Schematics', 'Microcontrollers', 'Breadboard Wiring'],
    recommendedGear: 'Operational prototype, multimeter, and hardware project demo kit.',
    summary: 'You thrive on tangible electronics. Demonstrate working prototypes or race against time wiring functional discrete circuits on solderless breadboards.',
  },
  {
    id: 'visionary',
    label: 'Visionary Thinker',
    tagline: 'Synthesizing tech solutions for critical societal & urban problems',
    icon: Lightbulb,
    primaryMatch: 'Ideathon',
    matchedId: 'ideathon',
    category: 'Research & Ideas',
    matchScore: '98% Compatibility',
    keySkills: ['Problem Synthesis', 'Solution Architecture', 'Pitch Deck Defense', 'Feasibility Modeling'],
    recommendedGear: 'Concise pitch presentation deck and architectural concept notes.',
    summary: 'You see the future before it arrives. Formulate scalable engineering interventions for urgent real-world problems and pitch your defense before evaluators.',
  },
  {
    id: 'researcher',
    label: 'Technical Scholar',
    tagline: 'Articulating cutting-edge engineering papers & theoretical symposia',
    icon: Presentation,
    primaryMatch: 'PPT Presentation Competition',
    matchedId: 'ppt-presentation',
    category: 'Research & Ideas',
    matchScore: '97% Compatibility',
    keySkills: ['Literature Review', 'Analytical Rigor', 'Technical Communication', 'Q&A Defense'],
    recommendedGear: 'Structured technical presentation slides and research abstract.',
    summary: 'You combine academic rigor with persuasive clarity. Present emerging concepts in telecommunications, AI, signal processing, or automation.',
  },
  {
    id: 'career',
    label: 'Corporate Contender',
    tagline: 'Acing corporate aptitude screening, technical rounds & HR interviews',
    icon: Briefcase,
    primaryMatch: 'Mock Placement Drive',
    matchedId: 'mock-placement',
    category: 'Career & Strategy',
    matchScore: '99% Compatibility',
    keySkills: ['Quantitative Aptitude', 'Core Domain Interviews', 'HR Behavioral Rounds', 'Resume Defense'],
    recommendedGear: 'Professional resume copies and engineering fundamentals knowledge.',
    summary: 'Organized with the PCE III Cell. Experience genuine multi-stage placement rigor used by top engineering employers before your real placement season.',
  },
  {
    id: 'visual',
    label: 'Visual Architect',
    tagline: 'Translating intricate engineering systems into striking infographics',
    icon: ImageIcon,
    primaryMatch: 'Poster Competition',
    matchedId: 'poster-competition',
    category: 'Research & Ideas',
    matchScore: '96% Compatibility',
    keySkills: ['Information Architecture', 'Infographic Clarity', 'Visual Design', 'Technical Summary'],
    recommendedGear: 'High-impact technical poster exhibit and structured verbal walkthrough.',
    summary: 'Where clarity meets craft. Synthesize complex electronics frameworks, renewable technologies, or computing frontiers into clean visual exhibits.',
  },
  {
    id: 'esports',
    label: 'Tactical Gamer & Orator',
    tagline: 'Squad battlegrounds in BGMI/Free Fire or acoustic creative open mic',
    icon: Gamepad2,
    primaryMatch: 'E-Gaming (BGMI/FF) & Open Mic',
    matchedId: 'e-gaming',
    category: 'Esports & Creative',
    matchScore: '98% Compatibility',
    keySkills: ['Map Awareness', 'Squad Tactics', 'Acoustic Expression', 'Public Presence'],
    recommendedGear: 'Personal mobile device with BGMI/Free Fire installed or acoustic performance piece.',
    summary: 'Engineering minds carry strategic reflexes and creative voice. Compete in competitive custom mobile lobbies or take the spotlight on the festival acoustic stage.',
  },
];

export default function ArenaMatchmaker() {
  const [selectedId, setSelectedId] = useState<string>('hardware');

  const active = ARCHETYPES.find((a) => a.id === selectedId) || ARCHETYPES[0];
  const ActiveIcon = active.icon;

  return (
    <section className="py-24 sm:py-32 bg-[#FFF4E5] relative overflow-hidden border-b border-[#E8D4B8]/60">
      
      {/* Ambient background light reflections */}
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-[#FF681F]/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-[#82C9F4]/20 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E8D4B8] text-xs font-mono font-bold text-[#082750] uppercase tracking-wider mb-4 shadow-2xs">
            <Target className="w-3.5 h-3.5 text-[#FF681F]" />
            <span>INTERACTIVE ARENA MATCHMAKER</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#082750] tracking-tight mb-4">
            Find Your Arena.
          </h2>
          <p className="text-sm sm:text-base text-[#163665] leading-relaxed">
            Select your engineering archetype to discover which of the 8 festival tracks best suits your strengths, technical interests, and competitive style.
          </p>
        </div>

        {/* Interactive Matchmaker Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Archetype Selector Pods (col-span-7) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ARCHETYPES.map((arch) => {
              const Icon = arch.icon;
              const isSelected = arch.id === selectedId;

              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => setSelectedId(arch.id)}
                  className={`text-left p-5 rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'glass-cockpit ring-2 ring-[#FF681F] shadow-[0_12px_30px_rgba(255,104,31,0.2)]'
                      : 'glass-card-luminous hover:bg-white/90 hover:border-[#FF681F]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                          isSelected
                            ? 'luminous-icon-pod-orange text-white scale-105'
                            : 'luminous-icon-pod text-[#FF681F]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      {isSelected && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF681F] text-white">
                          SELECTED
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-display font-bold text-[#082750] mb-1">
                      {arch.label}
                    </h3>
                    <p className="text-xs text-[#243B64] leading-relaxed font-medium">
                      {arch.tagline}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E8D4B8]/60 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#FF681F] font-bold">
                      {arch.matchScore}
                    </span>
                    <span className="text-[#082750] font-semibold flex items-center gap-1">
                      <span>View Match</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Luminous Match Dossier Card (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="glass-cockpit rounded-3xl p-7 sm:p-9 flex-1 flex flex-col justify-between relative overflow-hidden border-2 border-white">
              
              {/* Background ambient color badge */}
              <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-gradient-to-br from-[#FF681F]/20 to-[#82C9F4]/20 blur-2xl pointer-events-none" />

              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-[#082750] text-[#FFF4E5]">
                    {active.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#FF681F] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{active.matchScore}</span>
                  </span>
                </div>

                <span className="text-xs font-mono text-[#163665] uppercase tracking-wider block mb-1 font-semibold">
                  RECOMMENDED COMPETITION TRACK:
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#082750] mb-4">
                  {active.primaryMatch}
                </h3>

                <p className="text-xs sm:text-sm text-[#243B64] leading-relaxed mb-6 font-medium">
                  {active.summary}
                </p>

                {/* Key Skills Chip Cluster */}
                <div className="mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#082750] block font-bold mb-2">
                    RELEVANT CAPABILITIES:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {active.keySkills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-1 rounded-lg bg-white/90 border border-[#E8D4B8] text-[11px] font-mono font-semibold text-[#082750]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gear Advisory */}
                <div className="p-4 rounded-2xl bg-white/80 border border-[#E8D4B8] mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF681F] block font-bold mb-1">
                    SUGGESTED PARTICIPANT GEAR:
                  </span>
                  <p className="text-xs font-medium text-[#163665]">
                    {active.recommendedGear}
                  </p>
                </div>
              </div>

              {/* Action Link to Competition */}
              <div className="pt-2">
                <a
                  href={`#comp-${active.matchedId}`}
                  className="w-full tactile-orange-btn py-3.5 text-xs font-mono font-bold shadow-md gap-2"
                >
                  <span>Explore {active.primaryMatch.split('/')[0]} Dossier</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
