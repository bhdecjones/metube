import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { ProfileSchema, ChannelSchema } from '@mytube/shared-model';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/signin');
  }

  const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at');

  const profiles = ProfileSchema.array().safeParse(
    (profilesData ?? []).map((profile) => ({
      id: profile.id,
      userId: profile.user_id,
      name: profile.name,
      kind: profile.kind,
      parentPin: profile.parent_pin,
      createdAt: profile.created_at,
    }))
  );

  if (!profiles.success) {
    throw new Error('Failed to load profiles');
  }

  const channelsByProfile: Record<string, any[]> = {};
  for (const profile of profiles.data) {
    const { data: channelRows } = await supabase
      .from('profile_channels')
      .select('channel_id, channel_title, channel_thumb_url')
      .eq('profile_id', profile.id);
    const channels = ChannelSchema.array().safeParse(
      (channelRows ?? []).map((row) => ({
        channelId: row.channel_id,
        title: row.channel_title,
        thumbUrl: row.channel_thumb_url,
      }))
    );
    channelsByProfile[profile.id] = channels.success ? channels.data : [];
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-gray-400">Manage approved channels for each profile.</p>
      </header>
      <AdminDashboardClient profiles={profiles.data} channelsByProfile={channelsByProfile} />
    </div>
  );
}
