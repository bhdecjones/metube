import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; channelId: string } }
) {
  const cookieStore = cookies();
  const supabase = getRouteHandlerSupabase(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', params.id)
    .single();

  if (!profile || profile.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('profile_channels')
    .delete()
    .eq('profile_id', params.id)
    .eq('channel_id', params.channelId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
