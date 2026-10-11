import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: string;
      adminName: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    adminId?: string;
    role?: string;
    adminName?: string;
  }
}
