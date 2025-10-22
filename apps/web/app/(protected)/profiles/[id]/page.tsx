import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProfileSchema, VideoSchema } from '@metube/shared-model';
import { loadVideosForChannel, getCachedVideosForChannel } from '@/lib/youtube';
import { ProfileHomeClient } from '@/components/videos/ProfileHomeClient';

interface Props {
  params: { id: string };
}

export default async function ProfileHomePage({ params }: Props) {
  const supabase = createServerComponentClient({ cookies });
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', params.id).single();

  if (!profileData) {
    notFound();
  }

  const profileResult = ProfileSchema.safeParse({
    id: profileData.id,
    userId: profileData.user_id,
    name: profileData.name,
    kind: profileData.kind,
    parentPin: profileData.parent_pin,
    createdAt: profileData.created_at,
  });

  if (!profileResult.success) {
    notFound();
  }

  const { data: channelRows } = await supabase
    .from('profile_channels')
    .select('channel_id, channel_title')
    .eq('profile_id', params.id);

  const channelIds = channelRows?.map((channel) => channel.channel_id) ?? [];

  const videos = (
    await Promise.all(
      channelIds.map(async (channelId) => {
        const cached = await getCachedVideosForChannel(channelId, 12);
        if (cached.length > 0) {
          return cached;
        }
        try {
          return await loadVideosForChannel(channelId, 12);
        } catch (error) {
          console.error(error);
          return [];
        }
      })
    )
  )
    .flat()
    .sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    });

  const parsedVideos = VideoSchema.array().safeParse(videos.slice(0, 48));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase text-gray-400">Profile</p>
          <h1 className="text-3xl font-semibold">{profileResult.data.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
          {profileResult.data.kind === 'parent' ? (
            <a href="/admin" className="hover:text-white">
              Admin tools
            </a>
          ) : null}
          <a href="/profiles" className="hover:text-white">
            Switch profile
          </a>
        </div>
      </header>

      {channelRows && channelRows.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {channelRows.map((channel) => (
            <a
              key={channel.channel_id}
              href={`/profiles/${params.id}/channel/${channel.channel_id}`}
              className="min-w-[180px] rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-200 hover:text-white"
            >
              {channel.channel_title}
            </a>
          ))}
        </div>
      ) : null}

      {channelIds.length === 0 ? (
        <p className="rounded border border-gray-800 bg-gray-900 p-6 text-gray-400">
          No channels have been added to this profile yet. Ask a parent to whitelist channels from the admin dashboard.
        </p>
      ) : null}

      {parsedVideos.success && parsedVideos.data.length > 0 ? (
        <ProfileHomeClient videos={parsedVideos.data} />
      ) : (
        <p className="rounded border border-gray-800 bg-gray-900 p-6 text-gray-400">No videos available.</p>
      )}
    </div>
  );
}
