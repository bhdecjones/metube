'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientSupabase } from '@/lib/supabaseClient';

export function SignInForm() {
  const supabase = getClientSupabase();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push('/profiles');
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-lg border border-gray-800 p-6 shadow-lg">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <label className="flex flex-col gap-2 text-sm">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="rounded bg-gray-800 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="rounded bg-gray-800 px-3 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-white px-4 py-2 text-black transition hover:bg-gray-200 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-sm text-gray-400">
        No account?{' '}
        <a href="/auth/signup" className="font-semibold">
          Create one
        </a>
      </p>
    </form>
  );
}
