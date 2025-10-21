import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VideoSchema, VideoListQuerySchema } from '@metube/shared-model';
import { loadVideosForChannel, getCachedVideosForChannel } from '@/lib/youtube';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const cookieStore = cookies();
  const supabase = getRouteHandlerSupabase(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = VideoListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }
  const limit = parsedQuery.data.limit;

  const cached = await getCachedVideosForChannel(params.channelId, limit);
  if (cached.length >= limit) {
    return NextResponse.json(cached.slice(0, limit));
  }

  try {
    const fresh = await loadVideosForChannel(params.channelId, limit);
    const parsed = VideoSchema.array().safeParse(fresh);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Failed to parse videos' }, { status: 500 });
    }
    return NextResponse.json(parsed.data.slice(0, limit));
  } catch (error: any) {
    if (cached.length > 0) {
      return NextResponse.json(cached.slice(0, limit));
    }
    return NextResponse.json({ error: error?.message ?? 'Failed to load videos' }, { status: 500 });
  }
}
