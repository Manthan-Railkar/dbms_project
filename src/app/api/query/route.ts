import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export interface PrebuiltQuery {
  id: string;
  title: string;
  category: string;
  description: string;
  sql: string;
}

export const PREBUILT_QUERIES: PrebuiltQuery[] = [
  {
    id: 'q1',
    title: 'Query 1: All Matches with Team & Venue Details',
    category: 'MVP Required Queries',
    description: 'Displays all match fixtures with team1, team2, venue, city, status and winner using multiple JOINs.',
    sql: `SELECT 
    m.match_id,
    t1.name AS team1,
    t2.name AS team2,
    v.name AS venue,
    v.city,
    m.match_date,
    m.status,
    COALESCE(w.name, 'Pending') AS winner
FROM matches m
JOIN teams t1 ON m.team1_id = t1.team_id
JOIN teams t2 ON m.team2_id = t2.team_id
JOIN venues v ON m.venue_id = v.venue_id
LEFT JOIN teams w ON m.winner_id = w.team_id
ORDER BY m.match_date DESC;`
  },
  {
    id: 'q2',
    title: 'Query 2: Batting Scorecard with Strike Rates',
    category: 'MVP Required Queries',
    description: 'Displays player batting performance including runs, balls, boundaries, and strike rates for match 1.',
    sql: `SELECT 
    i.inning_no,
    bt.name AS batting_team,
    p.name AS batter_name,
    bs.runs,
    bs.balls_faced,
    bs.fours,
    bs.sixes,
    bs.strike_rate
FROM batting_scorecard bs
JOIN innings i ON bs.inning_id = i.inning_id
JOIN teams bt ON i.batting_team_id = bt.team_id
JOIN players p ON bs.player_id = p.player_id
ORDER BY i.inning_no ASC, bs.runs DESC
LIMIT 15;`
  },
  {
    id: 'q3',
    title: 'Query 3: Highest Run-Scorers (Aggregation & Group By)',
    category: 'MVP Required Queries',
    description: 'Finds top 5 run-scorers across all matches with total runs, balls, and aggregate strike rate.',
    sql: `SELECT 
    p.player_id,
    p.name AS player_name,
    t.name AS team_name,
    SUM(bs.runs) AS total_runs,
    SUM(bs.balls_faced) AS total_balls,
    ROUND((SUM(bs.runs)::numeric / NULLIF(SUM(bs.balls_faced), 0)) * 100, 2) AS aggregate_strike_rate
FROM batting_scorecard bs
JOIN players p ON bs.player_id = p.player_id
JOIN teams t ON p.team_id = t.team_id
GROUP BY p.player_id, p.name, t.name
ORDER BY total_runs DESC
LIMIT 5;`
  },
  {
    id: 'q4',
    title: 'Query 4: Leading Wicket-Takers (Bowling Stats)',
    category: 'MVP Required Queries',
    description: 'Identifies top 5 wicket-takers with total wickets, runs conceded, and bowling average.',
    sql: `SELECT 
    p.player_id,
    p.name AS player_name,
    t.name AS team_name,
    SUM(bw.wickets) AS total_wickets,
    SUM(bw.runs_conceded) AS runs_conceded,
    ROUND(SUM(bw.runs_conceded)::numeric / NULLIF(SUM(bw.wickets), 0), 2) AS bowling_average
FROM bowling_scorecard bw
JOIN players p ON bw.player_id = p.player_id
JOIN teams t ON p.team_id = t.team_id
GROUP BY p.player_id, p.name, t.name
ORDER BY total_wickets DESC, runs_conceded ASC
LIMIT 5;`
  },
  {
    id: 'q5',
    title: 'Query 5: Match Results & Summary Details',
    category: 'MVP Required Queries',
    description: 'Shows fixtures, match status, winner outcome, and toss results for all recorded matches.',
    sql: `SELECT 
    m.match_id,
    t1.name || ' vs ' || t2.name AS fixture,
    m.status,
    COALESCE(w.name || ' won', 'Match Pending/Live') AS outcome,
    m.toss_result
FROM matches m
JOIN teams t1 ON m.team1_id = t1.team_id
JOIN teams t2 ON m.team2_id = t2.team_id
LEFT JOIN teams w ON m.winner_id = w.team_id
ORDER BY m.match_id DESC;`
  },
  {
    id: 'q6',
    title: 'Query 6: Dynamic Batter Strike Rate Computation',
    category: 'MVP Required Queries',
    description: 'Dynamically computes batter strike rate using conditional CASE expression.',
    sql: `SELECT 
    p.name,
    bs.runs,
    bs.balls_faced,
    CASE 
        WHEN bs.balls_faced > 0 THEN ROUND((bs.runs::numeric / bs.balls_faced) * 100, 2)
        ELSE 0.00
    END AS calculated_strike_rate
FROM batting_scorecard bs
JOIN players p ON bs.player_id = p.player_id
LIMIT 20;`
  },
  {
    id: 'q7',
    title: 'Schema: All Database Tables & Row Counts',
    category: 'Database Metadata',
    description: 'Lists all 11 core tables and their current live record count in PostgreSQL.',
    sql: `SELECT 
    table_name,
    (xpath('/row/cnt/text()', xml_count))[1]::text::int AS row_count
FROM (
    SELECT 
        table_name,
        query_to_xml(format('select count(*) as cnt from %I', table_name), false, true, '') as xml_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) sub
ORDER BY table_name;`
  },
  {
    id: 'q8',
    title: 'Live: Recent Ball-by-Ball Events',
    category: 'Live Tracking',
    description: 'Inspects latest individual ball event logs with batter, bowler, and run outcomes.',
    sql: `SELECT 
    be.ball_id,
    be.inning_id,
    be.over_no,
    be.ball_no,
    bat.name AS batter,
    bowl.name AS bowler,
    be.runs_scored,
    be.extra_runs,
    be.extra_type,
    be.is_wicket,
    be.wicket_type,
    be.timestamp
FROM ball_events be
JOIN players bat ON be.batter_id = bat.player_id
JOIN players bowl ON be.bowler_id = bowl.player_id
ORDER BY be.timestamp DESC
LIMIT 15;`
  }
];

export async function GET() {
  try {
    const pool = getDbPool();
    // Retrieve table names for schema browser
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC;
    `);

    const tables = tablesRes.rows.map((r: { table_name: string }) => r.table_name);

    return NextResponse.json({
      success: true,
      tables,
      prebuiltQueries: PREBUILT_QUERIES
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch schema metadata';
    return NextResponse.json({
      success: false,
      error: errorMsg,
      prebuiltQueries: PREBUILT_QUERIES
    });
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  let query = '';

  try {
    const body = await request.json();
    query = (body.query || '').trim();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query cannot be empty.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const result = await pool.query(query);
    const executionTimeMs = Date.now() - startTime;

    // In case of multi-statement or single result
    const actualResult = Array.isArray(result) ? result[result.length - 1] : result;

    const fields = actualResult.fields
      ? actualResult.fields.map((f: { name: string; dataTypeID?: number }) => ({
          name: f.name,
          dataTypeID: f.dataTypeID
        }))
      : [];

    return NextResponse.json({
      success: true,
      command: actualResult.command || 'SELECT',
      rowCount: actualResult.rowCount ?? actualResult.rows?.length ?? 0,
      fields,
      rows: actualResult.rows || [],
      executionTimeMs,
      executedQuery: query
    });
  } catch (err: unknown) {
    const executionTimeMs = Date.now() - startTime;
    const pgErr = err as {
      message?: string;
      position?: string;
      detail?: string;
      hint?: string;
      code?: string;
    };
    return NextResponse.json({
      success: false,
      error: pgErr.message || 'An error occurred while executing the query.',
      position: pgErr.position,
      detail: pgErr.detail,
      hint: pgErr.hint,
      code: pgErr.code,
      executionTimeMs,
      executedQuery: query
    });
  }
}
