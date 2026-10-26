-- ============================================================================
-- LIVE CRICKET SCORE TRACKER - REQUIRED DEMONSTRATION QUERIES
-- Corresponding to Section 11 of mvp.md
-- ============================================================================

-- Query 1: Display all matches with team and venue names
SELECT 
    m.match_id,
    t1.name AS team1,
    t2.name AS team2,
    v.name AS venue,
    v.city,
    m.match_date,
    m.status,
    w.name AS winner
FROM matches m
JOIN teams t1 ON m.team1_id = t1.team_id
JOIN teams t2 ON m.team2_id = t2.team_id
JOIN venues v ON m.venue_id = v.venue_id
LEFT JOIN teams w ON m.winner_id = w.team_id
ORDER BY m.match_date DESC;

-- Query 2: Display the batting scorecard for a match
SELECT 
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
WHERE bs.match_id = 1
ORDER BY i.inning_no ASC, bs.runs DESC;

-- Query 3: Find the highest run-scorer across all matches
SELECT 
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
LIMIT 5;

-- Query 4: Find the leading wicket-taker across all matches
SELECT 
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
LIMIT 5;

-- Query 5: Display match results and summary details
SELECT 
    m.match_id,
    t1.name || ' vs ' || t2.name AS fixture,
    m.status,
    COALESCE(w.name || ' won', 'Match Pending/Live') AS outcome,
    m.toss_result
FROM matches m
JOIN teams t1 ON m.team1_id = t1.team_id
JOIN teams t2 ON m.team2_id = t2.team_id
LEFT JOIN teams w ON m.winner_id = w.team_id
ORDER BY m.match_id ASC;

-- Query 6: Calculate player strike rates dynamically from stored totals
SELECT 
    p.name,
    bs.runs,
    bs.balls_faced,
    CASE 
        WHEN bs.balls_faced > 0 THEN ROUND((bs.runs::numeric / bs.balls_faced) * 100, 2)
        ELSE 0.00
    END AS calculated_strike_rate
FROM batting_scorecard bs
JOIN players p ON bs.player_id = p.player_id;
