import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CreateProfileInputSchema, ProfileSchema } from '@mytube/shared-model';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = getRouteHandlerSupabase(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = CreateProfileInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { name, kind } = parsed.data;

  const { data, error } = await supabase
    .from('profiles')
    .insert({ name, kind, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const profile = ProfileSchema.safeParse({
    id: data.id,
    userId: data.user_id,
    name: data.name,
    kind: data.kind,
    parentPin: data.parent_pin,
    createdAt: data.created_at,
  });

  if (!profile.success) {
    return NextResponse.json({ error: 'Failed to parse profile' }, { status: 500 });
  }

  return NextResponse.json(profile.data, { status: 201 });
}
