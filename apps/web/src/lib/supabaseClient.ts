import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const getClientSupabase = () => createClientComponentClient();

export const getServerSupabase = () => createServerComponentClient({ cookies });

export const getRouteHandlerSupabase = (cookieStore: ReturnType<typeof cookies>) =>
  createRouteHandlerClient({ cookies: () => cookieStore });
