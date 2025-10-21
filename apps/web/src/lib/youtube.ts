import dayjs from 'dayjs';
import { cookies } from 'next/headers';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';
import { VideoSchema } from '@metube/shared-model';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MIN_DURATION = Number(process.env.NEXT_PUBLIC_MIN_DURATION_SECONDS ?? '60');

const isoToSeconds = (duration: string) => {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = regex.exec(duration);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const seconds = parseInt(match[3] ?? '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

const fetchJson = async (url: URL) => {
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }
  return response.json();
};

const getUploadsPlaylistId = async (channelId: string) => {
  if (!YOUTUBE_API_KEY) throw new Error('Missing YouTube API key');
  const url = new URL('https://www.googleapis.com/youtube/v3/channels');
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', YOUTUBE_API_KEY);
  const data = await fetchJson(url);
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
};

const fetchPlaylistItems = async (playlistId: string, limit: number) => {
  if (!YOUTUBE_API_KEY) throw new Error('Missing YouTube API key');
  const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  url.searchParams.set('part', 'snippet,contentDetails');
  url.searchParams.set('playlistId', playlistId);
  url.searchParams.set('maxResults', String(Math.min(limit, 50)));
  url.searchParams.set('key', YOUTUBE_API_KEY);
  const data = await fetchJson(url);
  return data.items ?? [];
};

const fetchVideos = async (videoIds: string[]) => {
  if (!YOUTUBE_API_KEY) throw new Error('Missing YouTube API key');
  if (videoIds.length === 0) return [];
  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'contentDetails,snippet');
  url.searchParams.set('id', videoIds.join(','));
  url.searchParams.set('key', YOUTUBE_API_KEY);
  const data = await fetchJson(url);
  return data.items ?? [];
};

export const loadVideosForChannel = async (channelId: string, limit: number) => {
  const playlistId = await getUploadsPlaylistId(channelId);
  if (!playlistId) return [];
  const playlistItems = await fetchPlaylistItems(playlistId, limit);
  const videoIds = playlistItems.map((item: any) => item.contentDetails?.videoId).filter(Boolean);
  const videoData = await fetchVideos(videoIds);
  const videos = videoData
    .map((item: any) => {
      const durationSeconds = isoToSeconds(item.contentDetails?.duration ?? 'PT0S');
      if (durationSeconds < MIN_DURATION) return null;
      return {
        videoId: item.id,
        channelId: item.snippet?.channelId ?? channelId,
        title: item.snippet?.title ?? 'Untitled',
        durationSeconds,
        publishedAt: item.snippet?.publishedAt ?? null,
        thumbUrl: item.snippet?.thumbnails?.maxres?.url ?? item.snippet?.thumbnails?.high?.url ?? null,
      };
    })
    .filter(Boolean);

  const parsed = VideoSchema.array().safeParse(videos);
  if (!parsed.success) {
    throw new Error('Failed to parse video payload');
  }

  const cookieStore = cookies();
  const supabase = getRouteHandlerSupabase(cookieStore);

  await Promise.all(
    parsed.data.map((video) =>
      supabase
        .from('video_cache')
        .upsert(
          {
            video_id: video.videoId,
            channel_id: video.channelId,
            title: video.title,
            duration_seconds: video.durationSeconds,
            published_at: video.publishedAt ? dayjs(video.publishedAt).toISOString() : null,
            thumb_url: video.thumbUrl,
            last_refreshed: dayjs().toISOString(),
          },
          { onConflict: 'video_id' }
        )
    )
  );

  return parsed.data;
};

export const getCachedVideosForChannel = async (channelId: string, limit: number) => {
  const cookieStore = cookies();
  const supabase = getRouteHandlerSupabase(cookieStore);
  const { data } = await supabase
    .from('video_cache')
    .select('*')
    .eq('channel_id', channelId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const parsed = VideoSchema.array().safeParse(
    data.map((row) => ({
      videoId: row.video_id,
      channelId: row.channel_id,
      title: row.title,
      durationSeconds: row.duration_seconds,
      publishedAt: row.published_at,
      thumbUrl: row.thumb_url,
    }))
  );

  return parsed.success ? parsed.data : [];
};
