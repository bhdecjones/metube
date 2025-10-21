import './globals.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ReactNode } from 'react';
import { meTubeLogo } from '@metube/design';
import { SignOutButton } from '@/components/auth/SignOutButton';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? 'MeTube',
  description: 'Parent-approved YouTube viewer',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <span dangerouslySetInnerHTML={{ __html: meTubeLogo }} aria-hidden />
            </div>
            <nav className="flex items-center gap-4 text-sm text-gray-300">
              {session ? (
                <>
                  <span>Signed in</span>
                  <SignOutButton />
                </>
              ) : (
                <a href="/auth/signin" className="hover:text-white">
                  Sign in
                </a>
              )}
            </nav>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
          <footer className="border-t border-gray-800 px-6 py-4 text-sm text-gray-400">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>&copy; {new Date().getFullYear()} MeTube</span>
              {process.env.PRIVACY_POLICY_URL ? (
                <a href={process.env.PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">
                  Privacy Policy
                </a>
              ) : null}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
