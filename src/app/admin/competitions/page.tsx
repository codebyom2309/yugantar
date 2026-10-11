'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Search, Eye, Edit3, ToggleLeft, ToggleRight } from 'lucide-react';

interface CompetitionRow {
  slug: string; name: string; category: string; venue: string; eligibility: string;
  team_size_limit: string; is_published: number; registration_open: number; display_order: number;
}

// We read from the hardcoded data for now (competitions table will be seeded via a separate process)
// This page shows the competition management interface using the existing events.ts data

const COMPETITIONS_FROM_STATIC = [
  { slug: 'project-competition', name: 'Inter-Collegiate Project Competition', category: 'Hardware & Innovation', venue: 'Lab Complex', eligibility: 'VII Semester Students Only', teamSize: 'Max 4 Members', order: 0 },
  { slug: 'ppt-presentation', name: 'PPT Presentation Competition', category: 'Research & Presentation', venue: 'Meeting Room', eligibility: 'VII Semester Students Only', teamSize: 'Max 4 Members', order: 1 },
  { slug: 'breadboard-competition', name: 'Bread Board Competition', category: 'Hardware & Circuits', venue: "EW's Lab", eligibility: 'V Semester Students Only', teamSize: 'Max 2 Members', order: 2 },
  { slug: 'ideathon', name: 'Ideathon', category: 'Strategy & Innovation', venue: 'Aeronautical Seminar Hall (Room 303)', eligibility: 'All Semesters', teamSize: 'Max 4 Members', order: 3 },
  { slug: 'mock-placement-drive', name: 'Mock Placement Drive', category: 'Professional Development', venue: 'Room 306', eligibility: 'V Semester Students Only', teamSize: 'Individual', order: 4 },
  { slug: 'poster-competition', name: 'Poster Competition', category: 'Creative & Visual', venue: 'Room 301', eligibility: 'All Semesters', teamSize: 'Max 2 Members', order: 5 },
  { slug: 'e-gaming', name: 'E-Gaming Competition', category: 'Esports', venue: 'Rooms 307 & 302', eligibility: 'All Semesters', teamSize: 'Squad of 4', order: 6 },
  { slug: 'open-mic', name: 'Open Mic Competition', category: 'Performing Arts', venue: 'Aeronautical Seminar Hall (Room 303)', eligibility: 'All Semesters', teamSize: 'Individual', order: 7 },
];

export default function CompetitionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-blue-400" />
          Competitions
          <span className="text-sm font-normal text-slate-400">(8 events)</span>
        </h1>
      </div>

      <p className="text-xs text-slate-400 bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
        <strong className="text-amber-400">Note:</strong> Competitions are currently loaded from the hardcoded data in <code className="text-blue-400">events.ts</code>. 
        Use this view to manage registration status and visibility. Full database-backed CRUD will be enabled after data migration.
      </p>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50 bg-slate-800/60">
                <th className="text-left py-3 px-4 font-medium">#</th>
                <th className="text-left py-3 px-3 font-medium">Competition</th>
                <th className="text-left py-3 px-3 font-medium">Category</th>
                <th className="text-left py-3 px-3 font-medium">Venue</th>
                <th className="text-left py-3 px-3 font-medium">Eligibility</th>
                <th className="text-left py-3 px-3 font-medium">Team Size</th>
                <th className="text-left py-3 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITIONS_FROM_STATIC.map((c, i) => (
                <tr key={c.slug} className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold flex items-center justify-center">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-200">{c.name}</div>
                    <div className="text-slate-500 text-[10px] font-mono">{c.slug}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{c.category}</td>
                  <td className="py-3 px-3 text-slate-400">{c.venue}</td>
                  <td className="py-3 px-3 text-slate-300">{c.eligibility}</td>
                  <td className="py-3 px-3 text-slate-400">{c.teamSize}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md border text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
