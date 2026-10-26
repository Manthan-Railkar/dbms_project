import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inning_id, previous_runs, previous_wickets, previous_overs } = body;

    const numInning = typeof inning_id === 'number' ? inning_id : parseInt(inning_id, 10) || 1;

    // Find the latest ball for this innings
    const { data: latestBalls } = await supabaseAdmin
      .from('ball_events')
      .select('ball_id')
      .eq('inning_id', numInning)
      .order('ball_id', { ascending: false })
      .limit(1);

    if (latestBalls && latestBalls.length > 0) {
      await supabaseAdmin
        .from('ball_events')
        .delete()
        .eq('ball_id', latestBalls[0].ball_id);
    }

    // Revert innings values
    if (previous_runs !== undefined || previous_wickets !== undefined || previous_overs !== undefined) {
      await supabaseAdmin
        .from('innings')
        .update({
          runs: typeof previous_runs === 'number' ? previous_runs : parseInt(previous_runs, 10) || 0,
          wickets: typeof previous_wickets === 'number' ? previous_wickets : parseInt(previous_wickets, 10) || 0,
          overs: typeof previous_overs === 'number' ? previous_overs : parseFloat(previous_overs) || 0.0
        })
        .eq('inning_id', numInning);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in undo API route:', err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
