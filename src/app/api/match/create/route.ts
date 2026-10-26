import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

function normalizeRole(role?: string): 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper' {
  if (!role) return 'Batter';
  const lower = role.toLowerCase();
  if (lower.includes('bowl')) return 'Bowler';
  if (lower.includes('all') || lower.includes('round')) return 'All-rounder';
  if (lower.includes('keep') || lower.includes('wk')) return 'Wicketkeeper';
  return 'Batter';
}

async function getOrCreateTeam(name: string, city?: string): Promise<number> {
  const cleanName = (name || 'Team').trim().slice(0, 120);

  // 1. Try to find existing team with this name
  const { data: existing } = await supabaseAdmin
    .from('teams')
    .select('team_id')
    .eq('name', cleanName)
    .maybeSingle();

  if (existing?.team_id) {
    return existing.team_id;
  }

  // 2. Insert new team
  const { data: inserted } = await supabaseAdmin
    .from('teams')
    .insert([{ name: cleanName, city: city || 'Mumbai' }])
    .select('team_id')
    .single();

  if (inserted?.team_id) {
    return inserted.team_id;
  }

  // Fallback if concurrent insert or conflict
  const { data: retry } = await supabaseAdmin
    .from('teams')
    .select('team_id')
    .eq('name', cleanName)
    .maybeSingle();

  return retry?.team_id || 1;
}

async function getOrCreatePlayer(
  teamId: number,
  player: { name: string; role?: string; battingStyle?: string; bowlingStyle?: string }
): Promise<{ player_id: number; name: string; role: string }> {
  const cleanName = (player.name || 'Player').trim().slice(0, 120);
  const normRole = normalizeRole(player.role);

  // Check if player exists for this team
  const { data: existing } = await supabaseAdmin
    .from('players')
    .select('player_id, name, role')
    .eq('team_id', teamId)
    .eq('name', cleanName)
    .maybeSingle();

  if (existing?.player_id) {
    if (existing.role !== normRole) {
      await supabaseAdmin
        .from('players')
        .update({ role: normRole })
        .eq('player_id', existing.player_id);
    }
    return { player_id: existing.player_id, name: cleanName, role: normRole };
  }

  // Insert new player
  const { data: inserted } = await supabaseAdmin
    .from('players')
    .insert([
      {
        name: cleanName,
        role: normRole,
        batting_style: player.battingStyle || 'Right-hand bat',
        bowling_style: player.bowlingStyle || 'Right-arm medium',
        team_id: teamId
      }
    ])
    .select('player_id, name, role')
    .single();

  if (inserted?.player_id) {
    return inserted;
  }

  // Retry lookup
  const { data: retry } = await supabaseAdmin
    .from('players')
    .select('player_id, name, role')
    .eq('team_id', teamId)
    .eq('name', cleanName)
    .maybeSingle();

  return retry || { player_id: 1, name: cleanName, role: normRole };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tournament_id,
      tournament_name,
      venue_id,
      match_date,
      toss_winner_id,
      toss_decision,
      toss_result,
      team1_name,
      team1_city,
      team1_players = [],
      team2_name,
      team2_city,
      team2_players = [],
      striker: clientStriker,
      non_striker: clientNonStriker,
      bowler: clientBowler
    } = body;

    // 1. Resolve Tournament and Venue
    const numTournament = typeof tournament_id === 'number' ? tournament_id : parseInt(tournament_id, 10) || 1;
    const numVenue = typeof venue_id === 'number' ? venue_id : parseInt(venue_id, 10) || 1;

    // 2. Synchronize Teams into Database
    const t1DbId = await getOrCreateTeam(team1_name || 'Tech Titans', team1_city || 'Mumbai');
    let t2DbId = await getOrCreateTeam(team2_name || 'Code Strikers', team2_city || 'Pune');
    if (t2DbId === t1DbId) {
      t2DbId = await getOrCreateTeam(`${team2_name || 'Code Strikers'} (B)`, team2_city || 'Pune');
    }

    // 3. Synchronize Players for Team 1
    const playerMapping: Record<string, { player_id: number; name: string; role: string }> = {};
    const team1DbPlayers: Array<{ player_id: number; name: string; role: string }> = [];

    for (const p of team1_players) {
      if (!p || !p.name) continue;
      const dbPlayer = await getOrCreatePlayer(t1DbId, p);
      if (p.id) playerMapping[p.id] = dbPlayer;
      team1DbPlayers.push(dbPlayer);
    }

    // 4. Synchronize Players for Team 2
    const team2DbPlayers: Array<{ player_id: number; name: string; role: string }> = [];

    for (const p of team2_players) {
      if (!p || !p.name) continue;
      const dbPlayer = await getOrCreatePlayer(t2DbId, p);
      if (p.id) playerMapping[p.id] = dbPlayer;
      team2DbPlayers.push(dbPlayer);
    }

    // 5. Determine Toss Winner & Batting / Bowling Teams
    const isTeam1TossWinner = toss_winner_id === 'team-1' || toss_winner_id === t1DbId;
    const tossWinnerDbId = isTeam1TossWinner ? t1DbId : t2DbId;
    const decision = toss_decision === 'Field' ? 'Field' : 'Bat';

    let batTeamDbId = tossWinnerDbId;
    if (decision === 'Field') {
      batTeamDbId = tossWinnerDbId === t1DbId ? t2DbId : t1DbId;
    }
    const bowlTeamDbId = batTeamDbId === t1DbId ? t2DbId : t1DbId;

    // 6. Insert Match Record
    const { data: newMatch, error: matchError } = await supabaseAdmin
      .from('matches')
      .insert([
        {
          tournament_id: numTournament,
          match_date: match_date || new Date().toISOString(),
          status: 'Live',
          team1_id: t1DbId,
          team2_id: t2DbId,
          venue_id: numVenue,
          toss_winner_id: tossWinnerDbId,
          toss_decision: decision,
          toss_result: toss_result || `Toss won by ${tossWinnerDbId === t1DbId ? team1_name : team2_name} and elected to ${decision}`
        }
      ])
      .select()
      .single();

    if (matchError || !newMatch) {
      console.error('Error creating match in Supabase:', matchError);
      return NextResponse.json(
        { success: false, error: matchError?.message || 'Failed to insert match' },
        { status: 500 }
      );
    }

    // 7. Insert 1st Innings (Starting fresh from 0/0)
    const { data: newInning, error: inningError } = await supabaseAdmin
      .from('innings')
      .insert([
        {
          match_id: newMatch.match_id,
          inning_no: 1,
          batting_team_id: batTeamDbId,
          bowling_team_id: bowlTeamDbId,
          runs: 0,
          wickets: 0,
          overs: 0.0
        }
      ])
      .select()
      .single();

    if (inningError) {
      console.error('Error creating innings in Supabase:', inningError);
    }

    // 8. Map Striker, Non-Striker, and Bowler
    const battingPlayers = batTeamDbId === t1DbId ? team1DbPlayers : team2DbPlayers;
    const bowlingPlayers = bowlTeamDbId === t1DbId ? team1DbPlayers : team2DbPlayers;

    const resolvedStriker = (clientStriker?.id && playerMapping[clientStriker.id]) ||
      battingPlayers.find((p) => p.name.toLowerCase() === (clientStriker?.name || '').toLowerCase()) ||
      battingPlayers[0] || { player_id: 1, name: clientStriker?.name || 'Striker', role: 'Batter' };

    const resolvedNonStriker = (clientNonStriker?.id && playerMapping[clientNonStriker.id]) ||
      battingPlayers.find((p) => p.name.toLowerCase() === (clientNonStriker?.name || '').toLowerCase() && p.player_id !== resolvedStriker.player_id) ||
      battingPlayers[1] || { player_id: 2, name: clientNonStriker?.name || 'Non-Striker', role: 'Batter' };

    const resolvedBowler = (clientBowler?.id && playerMapping[clientBowler.id]) ||
      bowlingPlayers.find((p) => p.name.toLowerCase() === (clientBowler?.name || '').toLowerCase()) ||
      bowlingPlayers[0] || { player_id: 7, name: clientBowler?.name || 'Opening Bowler', role: 'Bowler' };

    // 9. Initialize Batting & Bowling Scorecards in Database
    if (newInning?.inning_id) {
      try {
        // Initial batting scorecard for openers
        await supabaseAdmin.from('batting_scorecard').insert([
          {
            match_id: newMatch.match_id,
            inning_id: newInning.inning_id,
            player_id: resolvedStriker.player_id,
            runs: 0,
            balls_faced: 0,
            fours: 0,
            sixes: 0,
            strike_rate: 0.00
          },
          {
            match_id: newMatch.match_id,
            inning_id: newInning.inning_id,
            player_id: resolvedNonStriker.player_id,
            runs: 0,
            balls_faced: 0,
            fours: 0,
            sixes: 0,
            strike_rate: 0.00
          }
        ]);

        // Initial bowling scorecard for opening bowler
        await supabaseAdmin.from('bowling_scorecard').insert([
          {
            match_id: newMatch.match_id,
            inning_id: newInning.inning_id,
            player_id: resolvedBowler.player_id,
            overs: 0.0,
            maidens: 0,
            wickets: 0,
            runs_conceded: 0,
            economy_rate: 0.00
          }
        ]);
      } catch (scorecardErr) {
        console.warn('Initial scorecard creation notice:', scorecardErr);
      }
    }

    return NextResponse.json({
      success: true,
      matchId: newMatch.match_id,
      inningId: newInning?.inning_id || 1,
      match: newMatch,
      inning: newInning,
      battingTeam: {
        id: batTeamDbId,
        name: batTeamDbId === t1DbId ? (team1_name || 'Tech Titans') : (team2_name || 'Code Strikers'),
        players: battingPlayers
      },
      bowlingTeam: {
        id: bowlTeamDbId,
        name: bowlTeamDbId === t1DbId ? (team1_name || 'Tech Titans') : (team2_name || 'Code Strikers'),
        players: bowlingPlayers
      },
      striker: resolvedStriker,
      nonStriker: resolvedNonStriker,
      bowler: resolvedBowler,
      battingSquad: battingPlayers.filter(
        (p) => p.player_id !== resolvedStriker.player_id && p.player_id !== resolvedNonStriker.player_id
      ),
      bowlingSquad: bowlingPlayers
    });
  } catch (err: any) {
    console.error('Unexpected error creating match:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
