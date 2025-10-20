import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AddChannelInputSchema, ChannelSchema } from '@mytube/shared-model';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
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

  const { data, error } = await supabase
    .from('profile_channels')
    .select('channel_id, channel_title, channel_thumb_url')
    .eq('profile_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const parsed = ChannelSchema.array().safeParse(
    data.map((entry) => ({
      channelId: entry.channel_id,
      title: entry.channel_title,
      thumbUrl: entry.channel_thumb_url,
    }))
  );

  if (!parsed.success) {
    return NextResponse.json({ error: 'Failed to parse channels' }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

  const payload = await request.json();
  const parsed = AddChannelInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profile_channels')
    .insert({
      profile_id: params.id,
      channel_id: parsed.data.channelId,
      channel_title: parsed.data.title,
      channel_thumb_url: parsed.data.thumbUrl,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const parsedChannel = ChannelSchema.safeParse({
    channelId: data.channel_id,
    title: data.channel_title,
    thumbUrl: data.channel_thumb_url,
  });

  if (!parsedChannel.success) {
    return NextResponse.json({ error: 'Failed to parse channel' }, { status: 500 });
  }

  return NextResponse.json(parsedChannel.data, { status: 201 });
}
