import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const matchId = parseInt(id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json({ success: false, error: 'Invalid match ID' }, { status: 400 });
    }

    // 1. Fetch match record
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    }

    // 2. Fetch tournament, teams, and venue
    const { data: tournament } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('tournament_id', match.tournament_id)
      .single();

    const { data: team1 } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('team_id', match.team1_id)
      .single();

    if (team1) {
      const { data: t1p } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('team_id', match.team1_id);
      team1.players = t1p || [];
    }

    const { data: team2 } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('team_id', match.team2_id)
      .single();

    if (team2) {
      const { data: t2p } = await supabaseAdmin
        .from('players')
        .select('*')
        .eq('team_id', match.team2_id);
      team2.players = t2p || [];
    }

    const { data: venue } = await supabaseAdmin
      .from('venues')
      .select('*')
      .eq('venue_id', match.venue_id)
      .single();

    // 3. Fetch latest active innings
    const { data: innings } = await supabaseAdmin
      .from('innings')
      .select('*')
      .eq('match_id', matchId)
      .order('inning_no', { ascending: false });

    const activeInning = innings && innings.length > 0 ? innings[0] : null;

    // 4. Fetch balls, batting scorecard, and bowling scorecard
    let ballEvents: any[] = [];
    let battingScorecards: any[] = [];
    let bowlingScorecards: any[] = [];

    if (activeInning) {
      const { data: balls } = await supabaseAdmin
        .from('ball_events')
        .select('*')
        .eq('inning_id', activeInning.inning_id)
        .order('ball_id', { ascending: true });
      ballEvents = balls || [];

      const { data: bCards } = await supabaseAdmin
        .from('batting_scorecard')
        .select('*, player:players(*)')
        .eq('inning_id', activeInning.inning_id);
      battingScorecards = bCards || [];

      const { data: bwCards } = await supabaseAdmin
        .from('bowling_scorecard')
        .select('*, player:players(*)')
        .eq('inning_id', activeInning.inning_id);
      bowlingScorecards = bwCards || [];
    }

    // Resolve Batting & Bowling Teams
    const battingTeam = activeInning?.batting_team_id === team1?.team_id ? team1 : team2;
    const bowlingTeam = activeInning?.bowling_team_id === team1?.team_id ? team1 : team2;

    const battingSquad = battingTeam?.players || [];
    const bowlingSquad = bowlingTeam?.players || [];

    // Resolve Striker & Non-Striker
    let striker = null;
    let nonStriker = null;
    if (battingScorecards.length >= 2) {
      striker = battingScorecards[0].player;
      nonStriker = battingScorecards[1].player;
    } else if (battingScorecards.length === 1) {
      striker = battingScorecards[0].player;
      nonStriker = battingSquad.find((p: any) => p.player_id !== striker?.player_id) || battingSquad[1];
    } else {
      striker = battingSquad[0] || null;
      nonStriker = battingSquad[1] || null;
    }

    // Resolve Bowler
    let bowler = bowlingScorecards.length > 0
      ? bowlingScorecards[0].player
      : (bowlingSquad.find((p: any) => p.role === 'Bowler') || bowlingSquad[0] || null);

    return NextResponse.json({
      success: true,
      match,
      tournament,
      team1,
      team2,
      venue,
      activeInning,
      ballEvents,
      battingTeam,
      bowlingTeam,
      battingSquad: battingSquad.filter(
        (p: any) => p.player_id !== striker?.player_id && p.player_id !== nonStriker?.player_id
      ),
      bowlingSquad,
      striker,
      nonStriker,
      bowler,
      battingScorecards,
      bowlingScorecards
    });
  } catch (err: any) {
    console.error('Error fetching match details:', err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
