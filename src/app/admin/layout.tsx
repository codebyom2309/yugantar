import React from 'react';
import type { Metadata } from 'next';
import AuthProvider from '@/components/admin/AuthProvider';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata: Metadata = {
  title: 'Admin Panel — YUGANTAR 2026',
  description: 'YUGANTAR 2026 Administration Panel',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0B1120] text-slate-200">
        <AdminSidebar />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
