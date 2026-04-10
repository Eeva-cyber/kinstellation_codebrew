import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the user's self-person from the persons table
  const { data: persons } = await supabase
    .from('persons')
    .select('id, display_name')
    .eq('owner_id', user.id)
    .limit(1);

  const selfPerson = persons?.[0];
  if (!selfPerson) {
    return NextResponse.json(
      { error: 'Create your star on the canvas first' },
      { status: 400 },
    );
  }

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      inviter_user_id: user.id,
      inviter_person_id: selfPerson.id,
      inviter_display_name: selfPerson.display_name,
    })
    .select('token')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token: invitation.token });
}
