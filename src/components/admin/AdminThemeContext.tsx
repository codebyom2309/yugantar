'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type AdminTheme = 'dark' | 'light';

interface AdminThemeContextType {
  theme: AdminTheme;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>('dark');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('yugantar_admin_theme') as AdminTheme | null;
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
        document.documentElement.setAttribute('data-admin-theme', saved);
      } else {
        document.documentElement.setAttribute('data-admin-theme', 'dark');
      }
    } catch {}

    return () => {
      document.documentElement.removeAttribute('data-admin-theme');
    };
  }, []);

  const setTheme = (next: AdminTheme) => {
    setThemeState(next);
    try {
      localStorage.setItem('yugantar_admin_theme', next);
      document.documentElement.setAttribute('data-admin-theme', next);
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div
        suppressHydrationWarning
        data-admin-theme={theme}
        className={`min-h-screen transition-colors duration-200 ${
          theme === 'light' ? 'admin-light' : 'admin-dark'
        }`}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
