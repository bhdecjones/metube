import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ChannelSchema } from '@mytube/shared-model';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = getRouteHandlerSupabase(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('id');
  const handle = searchParams.get('handle');

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  if (!channelId && !handle) {
    return NextResponse.json({ error: 'Provide channel id or handle' }, { status: 400 });
  }

  if (channelId) {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('id', channelId);
    url.searchParams.set('key', YOUTUBE_API_KEY);
    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }
    const data = await response.json();
    const channel = data.items?.[0];
    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }
    const parsed = ChannelSchema.safeParse({
      channelId: channel.id,
      title: channel.snippet?.title ?? 'Unknown channel',
      thumbUrl: channel.snippet?.thumbnails?.default?.url ?? null,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Failed to parse channel' }, { status: 500 });
    }
    return NextResponse.json(parsed.data);
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'channel');
  url.searchParams.set('maxResults', '1');
  url.searchParams.set('q', handle!);
  url.searchParams.set('key', YOUTUBE_API_KEY);
  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: response.status });
  }
  const data = await response.json();
  const channel = data.items?.[0];
  if (!channel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }
  const parsed = ChannelSchema.safeParse({
    channelId: channel.id?.channelId,
    title: channel.snippet?.title ?? 'Unknown channel',
    thumbUrl: channel.snippet?.thumbnails?.default?.url ?? null,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Failed to parse channel' }, { status: 500 });
  }
  return NextResponse.json(parsed.data);
}
