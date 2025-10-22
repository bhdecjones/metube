import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SetPinInputSchema } from '@metube/shared-model';
import { getRouteHandlerSupabase } from '@/lib/supabaseClient';
import { createHash } from 'crypto';

const hashPin = (pin: string) => createHash('sha256').update(pin).digest('hex');

export async function POST(
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

  const payload = await request.json();
  const parsed = SetPinInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('parent_pin, user_id')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (data.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const hashed = data.parent_pin ?? '';
  if (!hashed || hashPin(parsed.data.pin) !== hashed) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
