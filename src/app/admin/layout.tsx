import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import AuthProvider from '@/components/admin/AuthProvider';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Admin Panel — YUGANTAR 2026',
  description: 'YUGANTAR 2026 Administration Panel',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen bg-[#090A0C]" />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </AuthProvider>
  );
}
