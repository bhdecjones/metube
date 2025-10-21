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

  const { id } = params;

  const { error } = await supabase
    .from('profiles')
    .update({ parent_pin: hashPin(parsed.data.pin) })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
