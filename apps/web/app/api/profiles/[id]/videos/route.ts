import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VideoSchema, VideoListQuerySchema } from '@mytube/shared-model';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';
import { loadVideosForChannel, getCachedVideosForChannel } from '@/lib/youtube';

export async function GET(
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

  const { searchParams } = new URL(request.url);
  const parsedQuery = VideoListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }
  const limit = parsedQuery.data.limit;

  const { data: channels, error } = await supabase
    .from('profile_channels')
    .select('channel_id')
    .eq('profile_id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const channelIds = channels?.map((entry) => entry.channel_id) ?? [];

  const perChannelLimit = Math.max(6, Math.ceil(limit / Math.max(channelIds.length, 1)));

  const videos = (
    await Promise.all(
      channelIds.map(async (channelId) => {
        const cached = await getCachedVideosForChannel(channelId, perChannelLimit);
        if (cached.length >= perChannelLimit) {
          return cached;
        }
        try {
          return await loadVideosForChannel(channelId, perChannelLimit);
        } catch (err) {
          console.error(err);
          return cached;
        }
      })
    )
  )
    .flat()
    .filter((video) => video);

  const parsed = VideoSchema.array().safeParse(videos);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Failed to parse videos' }, { status: 500 });
  }

  const sorted = parsed.data.sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bDate - aDate;
  });

  return NextResponse.json(sorted.slice(0, limit));
}
