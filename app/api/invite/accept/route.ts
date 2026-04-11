import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let token: string;
  let relationshipType: string;
  try {
    const body = await req.json();
    token = body.token;
    relationshipType = body.relationshipType;
    if (!token || !relationshipType) throw new Error();
  } catch {
    return NextResponse.json(
      { error: 'token and relationshipType are required' },
      { status: 400 },
    );
  }

  // Fetch the invitation
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation already used' }, { status: 400 });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
  }

  if (invitation.inviter_user_id === user.id) {
    return NextResponse.json(
      { error: 'Cannot accept your own invitation' },
      { status: 400 },
    );
  }

  // Get the acceptor's self-person
  const { data: persons } = await supabase
    .from('persons')
    .select('id, display_name')
    .eq('owner_id', user.id)
    .limit(1);

  const selfPerson = persons?.[0];
  if (!selfPerson) {
    return NextResponse.json(
      { error: 'Complete onboarding first' },
      { status: 400 },
    );
  }

  // Create the connection
  const { error: connError } = await supabase.from('user_connections').insert({
    user_a_id: invitation.inviter_user_id,
    person_a_id: invitation.inviter_person_id,
    user_b_id: user.id,
    person_b_id: selfPerson.id,
    relationship_type: relationshipType,
  });

  if (connError) {
    return NextResponse.json({ error: connError.message }, { status: 500 });
  }

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id);

  return NextResponse.json({
    connected: true,
    inviterName: invitation.inviter_display_name,
  });
}
