import { NextRequest, NextResponse } from 'next/server';
import { ChannelSearchResultSchema } from '@mytube/shared-model';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
  }

  const apiUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  apiUrl.searchParams.set('part', 'snippet');
  apiUrl.searchParams.set('type', 'channel');
  apiUrl.searchParams.set('maxResults', '10');
  apiUrl.searchParams.set('key', YOUTUBE_API_KEY);
  apiUrl.searchParams.set('q', query);

  const response = await fetch(apiUrl.toString(), { next: { revalidate: 60 } });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: response.status });
  }

  const data = await response.json();

  const results = (data.items ?? [])
    .map((item: any) => ({
      channelId: item.id?.channelId ?? '',
      title: item.snippet?.title ?? 'Unknown channel',
      thumbUrl: item.snippet?.thumbnails?.default?.url ?? null,
    }))
    .filter((channel: any) => channel.channelId);

  const parsed = ChannelSearchResultSchema.array().safeParse(results);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Failed to parse channel results' }, { status: 500 });
  }

  return NextResponse.json(parsed.data);
}
