import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProfileSchema } from '@mytube/shared-model';
import { ProfilePicker } from '@/components/profiles/ProfilePicker';
import { CreateProfileForm } from '@/components/profiles/CreateProfileForm';

export default async function ProfilesPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');

  if (error) {
    throw new Error(error.message);
  }

  const parsed = ProfileSchema.array().safeParse(
    (data ?? []).map((profile) => ({
      id: profile.id,
      userId: profile.user_id,
      name: profile.name,
      kind: profile.kind,
      parentPin: profile.parent_pin,
      createdAt: profile.created_at,
    }))
  );

  const profiles = parsed.success ? parsed.data : [];
  const hasParent = profiles.some((profile) => profile.kind === 'parent');

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold">Who&apos;s watching?</h1>
        {profiles.length > 0 ? (
          <div className="mt-6">
            <ProfilePicker profiles={profiles} />
          </div>
        ) : (
          <p className="mt-6 text-gray-400">Create a parent profile to get started.</p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {!hasParent ? <CreateProfileForm kind="parent" requirePin /> : null}
        {hasParent ? <CreateProfileForm kind="child" /> : null}
      </section>
    </div>
  );
}
