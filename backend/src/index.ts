import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const EnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  YOUTUBE_API_KEY: z.string().min(1),
});

export type BackendEnv = z.infer<typeof EnvSchema>;

export const createSupabaseAdminClient = (env: BackendEnv) => {
  const parsed = EnvSchema.parse(env);
  const serviceKey = parsed.SUPABASE_SERVICE_ROLE_KEY ?? parsed.YOUTUBE_API_KEY;
  return createClient(parsed.SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const YouTubeClientConfigSchema = z.object({
  apiKey: z.string().min(1),
});

export type YouTubeClientConfig = z.infer<typeof YouTubeClientConfigSchema>;

export interface YouTubeSearchResult {
  channelId: string;
  title: string;
  thumbUrl?: string | null;
}

export interface YouTubeVideoSummary {
  videoId: string;
  channelId: string;
  title: string;
  durationSeconds: number;
  publishedAt?: string | null;
  thumbUrl?: string | null;
}

const ISO_8601_DURATION_REGEX = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;

export const parseISODurationSeconds = (duration: string): number => {
  const match = ISO_8601_DURATION_REGEX.exec(duration);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const seconds = parseInt(match[3] ?? '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

export const MIN_DURATION_SECONDS = 60;

export const shouldIncludeVideo = (durationSeconds: number, minimum = MIN_DURATION_SECONDS) => {
  return durationSeconds >= minimum;
};
