import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { match_id, winner_team_name } = body;

    if (!match_id) {
      return NextResponse.json({ success: false, error: 'match_id is required' }, { status: 400 });
    }

    let winnerId: number | null = null;
    if (winner_team_name) {
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('team_id')
        .eq('name', winner_team_name)
        .maybeSingle();

      if (team?.team_id) {
        winnerId = team.team_id;
      }
    }

    // Update match status to Completed and record winner
    const updatePayload: Record<string, unknown> = {
      status: 'Completed'
    };
    if (winnerId) {
      updatePayload.winner_id = winnerId;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('matches')
      .update(updatePayload)
      .eq('match_id', match_id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.warn('Could not update match status in DB:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, match: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
