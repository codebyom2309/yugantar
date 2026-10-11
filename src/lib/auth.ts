import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        try {
          const users = await db.query<{
            id: string;
            email: string;
            name: string;
            password_hash: string | null;
            role: string;
            is_enabled: number;
            avatar_url: string | null;
          }>(
            'SELECT id, email, name, password_hash, role, is_enabled, avatar_url FROM admin_users WHERE email = ? AND is_enabled = 1 LIMIT 1',
            [email]
          );

          if (users.length === 0 || !users[0].password_hash) return null;

          const user = users[0];
          const valid = await bcrypt.compare(password, user.password_hash as string);
          if (!valid) return null;

          // Update last login
          await db.execute('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [user.id]);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
            role: user.role,
          };
        } catch (err) {
          console.error('Auth error:', err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase().trim();
        if (!email) return false;

        try {
          const admins = await db.query<{
            id: string;
            name: string;
            role: string;
            is_enabled: number;
          }>(
            'SELECT id, name, role, is_enabled FROM admin_users WHERE email = ? LIMIT 1',
            [email]
          );

          if (admins.length === 0 || !admins[0].is_enabled) {
            return '/admin/login?error=AccessDenied';
          }

          // Update last login
          await db.execute('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [admins[0].id]);
          return true;
        } catch (err) {
          console.error('Google sign-in check error:', err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // On initial sign-in, fetch role from DB
        const email = (user.email || token.email || '').toString().toLowerCase().trim();
        try {
          const admins = await db.query<{ id: string; role: string; name: string }>(
            'SELECT id, role, name FROM admin_users WHERE email = ? AND is_enabled = 1 LIMIT 1',
            [email]
          );
          if (admins.length > 0) {
            token.adminId = admins[0].id;
            token.role = admins[0].role;
            token.adminName = admins[0].name;
          }
        } catch {
          // Fallback — use role from user object if set by credentials provider
          if ('role' in user) {
            token.role = (user as Record<string, unknown>).role as string;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.adminId as string;
        session.user.role = token.role as string;
        session.user.adminName = token.adminName as string;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
});
