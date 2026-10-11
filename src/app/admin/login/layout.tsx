import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — YUGANTAR Admin',
  robots: 'noindex, nofollow',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // This layout exists to prevent the admin layout (with sidebar) from wrapping the login page
  return <>{children}</>;
}
