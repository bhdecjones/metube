import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { loadVideosForChannel, getCachedVideosForChannel } from '@/lib/youtube';
import { VideoSchema } from '@metube/shared-model';
import { ProfileHomeClient } from '@/components/videos/ProfileHomeClient';

interface Props {
  params: { id: string; channelId: string };
}

export default async function ChannelPage({ params }: Props) {
  const supabase = createServerComponentClient({ cookies });
  const { data: assignment } = await supabase
    .from('profile_channels')
    .select('*')
    .eq('profile_id', params.id)
    .eq('channel_id', params.channelId)
    .single();

  if (!assignment) {
    notFound();
  }

  const cached = await getCachedVideosForChannel(params.channelId, 24);
  const videos = cached.length
    ? cached
    : await loadVideosForChannel(params.channelId, 24).catch((error) => {
        console.error(error);
        return [];
      });

  const parsed = VideoSchema.array().safeParse(videos.slice(0, 48));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase text-gray-400">Channel</p>
          <h1 className="text-3xl font-semibold">{assignment.channel_title}</h1>
        </div>
        <a href={`/profiles/${params.id}`} className="text-sm text-gray-400 hover:text-white">
          Back to profile
        </a>
      </header>
      {parsed.success && parsed.data.length > 0 ? (
        <ProfileHomeClient videos={parsed.data} />
      ) : (
        <p className="rounded border border-gray-800 bg-gray-900 p-6 text-gray-400">No videos available.</p>
      )}
    </div>
  );
}
