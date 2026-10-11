'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Download, Sparkles, CheckCircle2, Ticket } from 'lucide-react';
import { COMPETITIONS } from '@/data/events';

export default function AccessPassGenerator({ eventDate }: { eventDate?: string } = {}) {
  const [name, setName] = useState('YOUR NAME HERE');
  const [college, setCollege] = useState('Priyadarshini College of Engineering, Nagpur');
  const [selectedTrack, setSelectedTrack] = useState(COMPETITIONS[0].name);
  const [tier, setTier] = useState<'Innovator' | 'Delegate' | 'Contender'>('Delegate');
  const [downloading, setDownloading] = useState(false);

  const collegesList = [
    'Priyadarshini College of Engineering, Nagpur',
    'VNIT Nagpur',
    'Ramdeobaba College of Engineering (RCOEM)',
    'G.H. Raisoni College of Engineering (GHRCE)',
    'Yeshwantrao Chavan College of Engineering (YCCE)',
    'Government Polytechnic, Nagpur',
    'Other College / University',
  ];

  const handleDownload = () => {
    setDownloading(true);

    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#3478F6', '#25A9F7', '#8065F6', '#17243D'],
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDownloading(false);
      return;
    }

    canvas.width = 1200;
    canvas.height = 600;

    // 1. Background in Crisp Cool White
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Outer Border in Subtle Blue
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#DCE7F5';
    ctx.strokeRect(20, 20, 1160, 560);

    // 3. Header Bar in Electric Blue to Indigo Gradient
    const gradient = ctx.createLinearGradient(20, 20, 1180, 20);
    gradient.addColorStop(0, '#3478F6');
    gradient.addColorStop(0.5, '#25A9F7');
    gradient.addColorStop(1, '#302A86');
    ctx.fillStyle = gradient;
    ctx.fillRect(20, 20, 1160, 110);

    // 4. Header Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px "Sora", sans-serif';
    ctx.fillText('YUGANTAR 2026 · NEXUS CITY DELEGATE PASS', 60, 80);

    ctx.fillStyle = '#E2EEFF';
    ctx.font = 'bold 18px "Space Grotesk", monospace';
    ctx.fillText(`TIER: ${tier.toUpperCase()}`, 1000, 80);

    // 5. Main Section Labels & Fields
    ctx.fillStyle = '#5F6F89';
    ctx.font = '15px "Space Grotesk", monospace';
    ctx.fillText('DELEGATE NAME', 60, 180);

    ctx.fillStyle = '#17243D';
    ctx.font = 'bold 42px "Sora", sans-serif';
    ctx.fillText(name.trim() || 'DELEGATE', 60, 235);

    ctx.fillStyle = '#5F6F89';
    ctx.font = '15px "Space Grotesk", monospace';
    ctx.fillText('INSTITUTION / COLLEGE', 60, 290);

    ctx.fillStyle = '#17243D';
    ctx.font = 'bold 22px "Manrope", sans-serif';
    ctx.fillText(college, 60, 325);

    ctx.fillStyle = '#5F6F89';
    ctx.font = '15px "Space Grotesk", monospace';
    ctx.fillText('PRIMARY COMPETITION ARENA', 60, 380);

    ctx.fillStyle = '#3478F6';
    ctx.font = 'bold 24px "Manrope", sans-serif';
    ctx.fillText(selectedTrack, 60, 415);

    // 6. Footer Info Row
    ctx.fillStyle = '#5F6F89';
    ctx.font = 'bold 15px "Space Grotesk", monospace';
    ctx.fillText(`DATE: ${(eventDate || '19 October 2026').toUpperCase()}`, 60, 490);
    ctx.fillText('VENUE: PCE CAMPUS, NAGPUR', 380, 490);
    ctx.fillText('DEPT: ELECTRONICS & TELECOM', 730, 490);

    // 7. Perforation Divider Line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#DCE7F5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(850, 130);
    ctx.lineTo(850, 580);
    ctx.stroke();
    ctx.setLineDash([]);

    // 8. Right Stub
    ctx.fillStyle = '#17243D';
    ctx.font = 'bold 26px "Space Grotesk", monospace';
    ctx.fillText('YG26-PASS', 890, 185);

    ctx.fillStyle = '#3478F6';
    ctx.font = 'bold 14px "Space Grotesk", monospace';
    ctx.fillText('SOUVENIR PASS', 890, 215);

    // Barcode Graphic
    ctx.fillStyle = '#17243D';
    const startX = 890;
    const barWidths = [3, 1, 4, 2, 1, 5, 2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 5, 2, 1, 4, 3, 2, 4];
    let currentX = startX;
    for (let i = 0; i < barWidths.length; i++) {
      ctx.fillRect(currentX, 260, barWidths[i], 120);
      currentX += barWidths[i] + 4;
    }

    ctx.fillStyle = '#5F6F89';
    ctx.font = '12px "Space Grotesk", monospace';
    ctx.fillText('SOUVENIR CREDENTIAL · NOT A TICKET', 890, 425);
    ctx.fillText('PRIYADARSHINI ENGG. NAGPUR', 890, 450);

    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `YUGANTAR_2026_Pass_${name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloading(false);
    }, 400);
  };

  return (
    <section id="access-pass" className="py-24 sm:py-32 bg-[#F5F9FF] relative overflow-hidden border-b border-[#DCE7F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE7F5] text-xs font-mono font-bold text-[#3478F6] uppercase tracking-wider mb-4 shadow-2xs">
            <Ticket className="w-3.5 h-3.5 text-[#25A9F7]" />
            <span>NEXUS CREDENTIAL · DIGITAL SOUVENIR</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-[#17243D] tracking-tight mb-4">
            Generate Your Delegate Pass.
          </h2>
          <p className="text-sm sm:text-base text-[#5F6F89] leading-relaxed">
            Personalize your digital souvenir credential for YUGANTAR 2026. Enter your details, choose your competition track, and download a commemorative pass to share with peers.
          </p>
        </div>

        {/* Form and Pass Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Column (col-span-5) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-white border border-[#DCE7F5] shadow-xs">
            <h3 className="text-base font-display font-bold text-[#17243D] mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3478F6]" />
              <span>Pass Personalization</span>
            </h3>

            {/* Name Input */}
            <div className="mb-4">
              <label htmlFor="pass-delegate-name" className="block text-xs font-mono font-bold text-[#17243D] mb-1.5 uppercase tracking-wide">
                1. Delegate Name
              </label>
              <input
                id="pass-delegate-name"
                type="text"
                value={name === 'YOUR NAME HERE' ? '' : name}
                onChange={(e) => setName(e.target.value.toUpperCase() || 'YOUR NAME HERE')}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl nexus-input text-sm font-semibold outline-none transition-all"
                maxLength={26}
              />
            </div>

            {/* College Selection */}
            <div className="mb-4">
              <label htmlFor="pass-institution-select" className="block text-xs font-mono font-bold text-[#17243D] mb-1.5 uppercase tracking-wide">
                2. Institution / College
              </label>
              <select
                id="pass-institution-select"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-4 py-3 rounded-xl nexus-input text-sm font-medium outline-none transition-all cursor-pointer"
              >
                {collegesList.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Track Selection */}
            <div className="mb-4">
              <label htmlFor="pass-arena-select" className="block text-xs font-mono font-bold text-[#17243D] mb-1.5 uppercase tracking-wide">
                3. Primary Competition Arena
              </label>
              <select
                id="pass-arena-select"
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="w-full px-4 py-3 rounded-xl nexus-input text-sm font-medium outline-none transition-all cursor-pointer"
              >
                {COMPETITIONS.map((comp) => (
                  <option key={comp.id} value={comp.name}>
                    {comp.name} ({comp.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Tier Selector */}
            <div className="mb-6">
              <span className="block text-xs font-mono font-bold text-[#17243D] mb-1.5 uppercase tracking-wide">
                4. Delegate Tier
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['Delegate', 'Contender', 'Innovator'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTier(t)}
                    className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all ${
                      tier === t
                        ? 'bg-[#3478F6] text-white border-[#3478F6] shadow-xs'
                        : 'bg-[#F5F9FF] text-[#17243D] border-[#DCE7F5] hover:bg-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              type="button"
              disabled={downloading}
              className="w-full nexus-btn-primary py-4 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-75"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{downloading ? 'Rendering Pass...' : 'Download Souvenir Pass (PNG)'}</span>
            </button>
          </div>

          {/* Pass Preview (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-xl rounded-3xl overflow-hidden bg-white border border-[#DCE7F5] shadow-lg relative">
              
              {/* Header Bar in Electric Blue to Indigo Gradient */}
              <div className="bg-gradient-to-r from-[#3478F6] via-[#25A9F7] to-[#302A86] p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 p-1 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#E2EEFF] uppercase block">
                      DELEGATE SOUVENIR CREDENTIAL
                    </span>
                    <span className="text-base font-display font-bold tracking-wider text-white">
                      YUGANTAR 2026 · NEXUS CITY
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold uppercase">
                    {tier}
                  </span>
                  <span className="text-[10px] font-mono text-[#E2EEFF] block mt-1">
                    YG26-PASS
                  </span>
                </div>
              </div>

              {/* Pass Body in Clean White */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 bg-white relative">
                
                {/* Details (col-span-8) */}
                <div className="sm:col-span-8 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#5F6F89] block mb-1 font-bold">
                      DELEGATE NAME
                    </span>
                    <h4 className="text-xl sm:text-2xl font-display font-bold text-[#17243D] tracking-tight mb-4 break-words">
                      {name || 'YOUR NAME HERE'}
                    </h4>

                    <span className="text-[10px] font-mono uppercase text-[#5F6F89] block mb-1 font-bold">
                      INSTITUTION
                    </span>
                    <p className="text-xs font-semibold text-[#17243D] mb-4 truncate">
                      {college}
                    </p>

                    <span className="text-[10px] font-mono uppercase text-[#5F6F89] block mb-1 font-bold">
                      SELECTED ARENA
                    </span>
                    <p className="text-xs font-bold text-[#3478F6] mb-4">
                      {selectedTrack}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#DCE7F5] text-[10px] font-mono text-[#5F6F89]">
                    <div>
                      <span className="block text-[#5F6F89]/70">CONFIRMED DATE</span>
                      <span className="font-bold text-[#17243D]">{(eventDate || '19 OCT 2026').toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="block text-[#5F6F89]/70">CAMPUS VENUE</span>
                      <span className="font-bold text-[#17243D]">PCE NAGPUR</span>
                    </div>
                  </div>
                </div>

                {/* Perforation Stub (col-span-4) */}
                <div className="sm:col-span-4 flex flex-col justify-between items-center sm:items-end sm:border-l-2 sm:border-dashed sm:border-[#DCE7F5] sm:pl-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#DCE7F5]">
                  <div className="text-center sm:text-right w-full">
                    <span className="text-[10px] font-mono text-[#5F6F89] block">ACCESS ID</span>
                    <span className="text-sm font-mono font-bold text-[#17243D]">YG-26</span>
                  </div>

                  {/* Graphic Barcode */}
                  <div className="my-3 flex flex-col items-center">
                    <div className="flex items-center gap-[2px] h-14">
                      {[4, 2, 6, 1, 3, 5, 2, 4, 1, 3, 5, 2, 6, 3, 1, 4, 2, 5, 3].map((w, i) => (
                        <div
                          key={i}
                          style={{ width: `${w}px` }}
                          className="h-full bg-[#17243D]"
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-mono text-[#5F6F89] mt-1 tracking-widest font-semibold">
                      *YUG2026*
                    </span>
                  </div>

                  <div className="text-center sm:text-right text-[9px] font-mono text-[#5F6F89] font-semibold">
                    PCE ETC DEPT
                  </div>
                </div>

              </div>

              {/* Bottom Strip */}
              <div className="bg-[#F5F9FF] px-6 py-2.5 border-t border-[#DCE7F5] flex items-center justify-between text-[10px] font-mono text-[#17243D]">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3478F6]" />
                  <span>SOUVENIR PASS · NOT A TICKET</span>
                </span>
                <span className="font-semibold text-[#5F6F89]">DEPT OF ELECTRONICS & TELECOM</span>
              </div>

            </div>

            <span className="text-xs text-[#5F6F89] mt-4 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#3478F6]" />
              <span>Download your commemorative souvenir badge. Official registration happens on campus.</span>
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
