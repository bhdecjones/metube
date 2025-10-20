import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';

const isEnabled = process.env.ALLOW_GOOGLE_OAUTH === 'true';

export async function GET() {
  const cookieStore = cookies();
  const supabase = getRouteHandlerSupabase(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEnabled) {
    return NextResponse.json({ error: 'Google OAuth import disabled' }, { status: 403 });
  }

  // TODO: Implement Google OAuth flow to import subscription list.
  return NextResponse.json([]);
}
