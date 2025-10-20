'use client';

import { useRouter } from 'next/navigation';
import { getClientSupabase } from '@/lib/supabaseClient';

export function SignOutButton() {
  const router = useRouter();
  const supabase = getClientSupabase();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
    router.refresh();
  };

  return (
    <button onClick={handleSignOut} className="text-sm text-gray-300 hover:text-white">
      Sign out
    </button>
  );
}
