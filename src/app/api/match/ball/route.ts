import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      inning_id,
      over_no,
      ball_no,
      batter_id,
      bowler_id,
      runs_scored,
      extra_runs,
      extra_type,
      wicket_fallen,
      wicket_type,
      dismissed_player_id,
      is_legal_delivery,
      total_runs,
      total_wickets,
      overs
    } = body;

    // Normalize values
    const numInning = typeof inning_id === 'number' ? inning_id : parseInt(inning_id, 10) || 1;
    const numOver = typeof over_no === 'number' ? over_no : parseInt(over_no, 10) || 0;
    const numBall = typeof ball_no === 'number' ? ball_no : parseInt(ball_no, 10) || 1;
    const numRunsScored = typeof runs_scored === 'number' ? runs_scored : parseInt(runs_scored, 10) || 0;
    const numExtraRuns = typeof extra_runs === 'number' ? extra_runs : parseInt(extra_runs, 10) || 0;

    // Dynamic verification for batter, bowler, and dismissed player FKs
    let parsedBatter = parseInt(String(batter_id || '').replace(/\D/g, ''), 10);
    let batterId = 1;
    if (!isNaN(parsedBatter) && parsedBatter > 0) {
      const { data: pExists } = await supabaseAdmin
        .from('players')
        .select('player_id')
        .eq('player_id', parsedBatter)
        .maybeSingle();
      if (pExists?.player_id) batterId = pExists.player_id;
    }

    let parsedBowler = parseInt(String(bowler_id || '').replace(/\D/g, ''), 10);
    let bowlerId = 7;
    if (!isNaN(parsedBowler) && parsedBowler > 0) {
      const { data: pExists } = await supabaseAdmin
        .from('players')
        .select('player_id')
        .eq('player_id', parsedBowler)
        .maybeSingle();
      if (pExists?.player_id) bowlerId = pExists.player_id;
    }

    let dismissedId = null;
    let wType = null;
    if (wicket_fallen) {
      let parsedDismissed = parseInt(String(dismissed_player_id || '').replace(/\D/g, ''), 10);
      dismissedId = batterId;
      if (!isNaN(parsedDismissed) && parsedDismissed > 0) {
        const { data: pExists } = await supabaseAdmin
          .from('players')
          .select('player_id')
          .eq('player_id', parsedDismissed)
          .maybeSingle();
        if (pExists?.player_id) dismissedId = pExists.player_id;
      }
      // Match check constraint casing
      const validTypes = ['Bowled', 'Caught', 'LBW', 'Run out', 'Stumped', 'Hit wicket'];
      wType = validTypes.find((t) => t.toLowerCase() === (wicket_type || '').toLowerCase()) || 'Bowled';
    }

    // Extra type casing check: 'Wide', 'No-ball', 'Bye', 'Leg-bye'
    let eType = null;
    if (extra_type) {
      if (extra_type.toLowerCase().includes('wide') || extra_type === 'WD') eType = 'Wide';
      else if (extra_type.toLowerCase().includes('no') || extra_type === 'NB') eType = 'No-ball';
      else if (extra_type.toLowerCase().includes('leg')) eType = 'Leg-bye';
      else if (extra_type.toLowerCase().includes('bye') || extra_type === 'B') eType = 'Bye';
    }

    // 1. Insert into ball_events
    const { data: ballEvent, error: ballError } = await supabaseAdmin
      .from('ball_events')
      .insert([
        {
          inning_id: numInning,
          over_no: numOver,
          ball_no: numBall,
          batter_id: batterId,
          bowler_id: bowlerId,
          runs_scored: numRunsScored,
          extra_runs: numExtraRuns,
          extra_type: eType,
          wicket_fallen: Boolean(wicket_fallen),
          wicket_type: wType,
          dismissed_player_id: dismissedId,
          is_legal_delivery: is_legal_delivery !== undefined ? Boolean(is_legal_delivery) : true
        }
      ])
      .select()
      .single();

    if (ballError) {
      console.error('Error inserting ball_event into Supabase:', ballError);
    }

    // 2. Update innings runs, wickets, overs
    if (total_runs !== undefined || total_wickets !== undefined || overs !== undefined) {
      const numRuns = typeof total_runs === 'number' ? total_runs : parseInt(total_runs, 10) || 0;
      const numWickets = typeof total_wickets === 'number' ? total_wickets : parseInt(total_wickets, 10) || 0;
      const numOvers = typeof overs === 'number' ? overs : parseFloat(overs) || 0.0;

      await supabaseAdmin
        .from('innings')
        .update({
          runs: numRuns,
          wickets: numWickets,
          overs: numOvers
        })
        .eq('inning_id', numInning);
    }

    // 3. Synchronize batting_scorecard for batterId
    try {
      const { data: bCard } = await supabaseAdmin
        .from('batting_scorecard')
        .select('*')
        .eq('inning_id', numInning)
        .eq('player_id', batterId)
        .maybeSingle();

      const addedRuns = numRunsScored;
      const facedBall = (is_legal_delivery !== false) ? 1 : (eType === 'No-ball' && numRunsScored > 0 ? 1 : 0);
      const isFour = numRunsScored === 4 ? 1 : 0;
      const isSix = numRunsScored === 6 ? 1 : 0;

      if (bCard) {
        const newRuns = bCard.runs + addedRuns;
        const newBalls = bCard.balls_faced + facedBall;
        const sr = newBalls > 0 ? parseFloat(((newRuns / newBalls) * 100).toFixed(2)) : 0;
        await supabaseAdmin
          .from('batting_scorecard')
          .update({
            runs: newRuns,
            balls_faced: newBalls,
            fours: bCard.fours + isFour,
            sixes: bCard.sixes + isSix,
            strike_rate: sr
          })
          .eq('scorecard_id', bCard.scorecard_id);
      } else {
        const { data: inn } = await supabaseAdmin
          .from('innings')
          .select('match_id')
          .eq('inning_id', numInning)
          .single();

        if (inn) {
          const sr = facedBall > 0 ? parseFloat(((addedRuns / facedBall) * 100).toFixed(2)) : 0;
          await supabaseAdmin.from('batting_scorecard').insert([
            {
              match_id: inn.match_id,
              inning_id: numInning,
              player_id: batterId,
              runs: addedRuns,
              balls_faced: facedBall,
              fours: isFour,
              sixes: isSix,
              strike_rate: sr
            }
          ]);
        }
      }
    } catch (e) {
      console.warn('Batting scorecard sync notice:', e);
    }

    // 4. Synchronize bowling_scorecard for bowlerId
    try {
      const { data: bwCard } = await supabaseAdmin
        .from('bowling_scorecard')
        .select('*')
        .eq('inning_id', numInning)
        .eq('player_id', bowlerId)
        .maybeSingle();

      const bowlerRuns = numRunsScored + (eType === 'Wide' || eType === 'No-ball' ? numExtraRuns : 0);
      const bowlerWicket = wicket_fallen && wType !== 'Run out' ? 1 : 0;

      if (bwCard) {
        const curLegal = Math.floor(parseFloat(bwCard.overs || 0)) * 6 + Math.round((parseFloat(bwCard.overs || 0) % 1) * 10);
        const newLegal = is_legal_delivery !== false ? curLegal + 1 : curLegal;
        const newOvers = parseFloat(`${Math.floor(newLegal / 6)}.${newLegal % 6}`);
        const newRunsConceded = bwCard.runs_conceded + bowlerRuns;
        const newWickets = bwCard.wickets + bowlerWicket;
        const econ = newLegal > 0 ? parseFloat(((newRunsConceded / (newLegal / 6))).toFixed(2)) : 0;

        await supabaseAdmin
          .from('bowling_scorecard')
          .update({
            overs: newOvers,
            runs_conceded: newRunsConceded,
            wickets: newWickets,
            economy_rate: econ
          })
          .eq('scorecard_id', bwCard.scorecard_id);
      } else {
        const { data: inn } = await supabaseAdmin
          .from('innings')
          .select('match_id')
          .eq('inning_id', numInning)
          .single();

        if (inn) {
          const isLegal = is_legal_delivery !== false;
          const econ = isLegal ? parseFloat((bowlerRuns * 6).toFixed(2)) : 0;
          await supabaseAdmin.from('bowling_scorecard').insert([
            {
              match_id: inn.match_id,
              inning_id: numInning,
              player_id: bowlerId,
              overs: isLegal ? 0.1 : 0.0,
              runs_conceded: bowlerRuns,
              wickets: bowlerWicket,
              economy_rate: econ
            }
          ]);
        }
      }
    } catch (e) {
      console.warn('Bowling scorecard sync notice:', e);
    }

    return NextResponse.json({
      success: true,
      ballId: ballEvent?.ball_id || null,
      ballEvent
    });
  } catch (err: any) {
    console.error('Error in ball API route:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
