-- ============================================================================
-- LIVE CRICKET SCORE TRACKER - DATABASE SCHEMA (11 CORE TABLES)
-- Compliant with Third Normal Form (3NF) and PostgreSQL / Supabase best practices
-- ============================================================================

-- Clean up existing tables if re-running (cascading drops)
DROP TABLE IF EXISTS bowling_scorecard CASCADE;
DROP TABLE IF EXISTS batting_scorecard CASCADE;
DROP TABLE IF EXISTS ball_events CASCADE;
DROP TABLE IF EXISTS innings CASCADE;
DROP TABLE IF EXISTS match_umpires CASCADE;
DROP TABLE IF EXISTS umpires CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;

-- ----------------------------------------------------------------------------
-- 1. TOURNAMENTS
-- Stores series, leagues, and tournaments
-- ----------------------------------------------------------------------------
CREATE TABLE tournaments (
    tournament_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    format VARCHAR(10) NOT NULL CHECK (format IN ('T20', 'ODI', 'Test')),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tournament_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ----------------------------------------------------------------------------
-- 2. VENUES
-- Stores cricket stadium / ground details
-- ----------------------------------------------------------------------------
CREATE TABLE venues (
    venue_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    seating_capacity INTEGER CHECK (seating_capacity IS NULL OR seating_capacity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. TEAMS
-- Stores team profile. Note: captain_id FK is added after players table is created.
-- ----------------------------------------------------------------------------
CREATE TABLE teams (
    team_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    city VARCHAR(100),
    captain_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. PLAYERS
-- Stores player profiles and rosters linked to teams
-- ----------------------------------------------------------------------------
CREATE TABLE players (
    player_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Batter', 'Bowler', 'All-rounder', 'Wicketkeeper')),
    batting_style VARCHAR(30),
    bowling_style VARCHAR(50),
    team_id BIGINT NOT NULL REFERENCES teams(team_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add circular foreign key from teams to players for captaincy
ALTER TABLE teams 
    ADD CONSTRAINT fk_teams_captain 
    FOREIGN KEY (captain_id) 
    REFERENCES players(player_id) 
    ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 5. MATCHES
-- Stores match fixtures, toss, status, teams, venue, and outcome
-- ----------------------------------------------------------------------------
CREATE TABLE matches (
    match_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tournament_id BIGINT NOT NULL REFERENCES tournaments(tournament_id) ON DELETE RESTRICT,
    match_date TIMESTAMPTZ NOT NULL,
    toss_winner_id BIGINT REFERENCES teams(team_id) ON DELETE SET NULL,
    toss_decision VARCHAR(20) CHECK (toss_decision IS NULL OR toss_decision IN ('Bat', 'Field')),
    toss_result VARCHAR(250),
    status VARCHAR(20) NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Live', 'Completed', 'Abandoned')),
    team1_id BIGINT NOT NULL REFERENCES teams(team_id) ON DELETE RESTRICT,
    team2_id BIGINT NOT NULL REFERENCES teams(team_id) ON DELETE RESTRICT,
    winner_id BIGINT REFERENCES teams(team_id) ON DELETE SET NULL,
    venue_id BIGINT NOT NULL REFERENCES venues(venue_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_different_teams CHECK (team1_id <> team2_id),
    CONSTRAINT chk_valid_winner CHECK (winner_id IS NULL OR winner_id IN (team1_id, team2_id)),
    CONSTRAINT chk_valid_toss_winner CHECK (toss_winner_id IS NULL OR toss_winner_id IN (team1_id, team2_id))
);

-- ----------------------------------------------------------------------------
-- 6. UMPIRES
-- Stores match officials
-- ----------------------------------------------------------------------------
CREATE TABLE umpires (
    umpire_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    certification_level VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. MATCH_UMPIRES (Junction Table)
-- Associates umpires with matches and defines their officiating role
-- ----------------------------------------------------------------------------
CREATE TABLE match_umpires (
    match_id BIGINT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    umpire_id BIGINT NOT NULL REFERENCES umpires(umpire_id) ON DELETE RESTRICT,
    role VARCHAR(40) NOT NULL CHECK (role IN ('On-field', 'Third Umpire', 'Match Referee', 'Reserve')),
    PRIMARY KEY (match_id, umpire_id)
);

-- ----------------------------------------------------------------------------
-- 8. INNINGS
-- Stores each innings summary within a match
-- ----------------------------------------------------------------------------
CREATE TABLE innings (
    inning_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    inning_no SMALLINT NOT NULL CHECK (inning_no > 0),
    batting_team_id BIGINT NOT NULL REFERENCES teams(team_id) ON DELETE RESTRICT,
    bowling_team_id BIGINT NOT NULL REFERENCES teams(team_id) ON DELETE RESTRICT,
    runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
    wickets SMALLINT NOT NULL DEFAULT 0 CHECK (wickets >= 0 AND wickets <= 10),
    overs NUMERIC(5,1) NOT NULL DEFAULT 0.0 CHECK (overs >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_match_inning UNIQUE (match_id, inning_no),
    CONSTRAINT chk_different_innings_teams CHECK (batting_team_id <> bowling_team_id)
);

-- ----------------------------------------------------------------------------
-- 9. BALL_EVENTS
-- Detailed ball-by-ball event log (Source of Truth for live updates)
-- ----------------------------------------------------------------------------
CREATE TABLE ball_events (
    ball_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inning_id BIGINT NOT NULL REFERENCES innings(inning_id) ON DELETE CASCADE,
    over_no SMALLINT NOT NULL CHECK (over_no >= 0),
    ball_no SMALLINT NOT NULL CHECK (ball_no > 0),
    batter_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE RESTRICT,
    bowler_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE RESTRICT,
    runs_scored SMALLINT NOT NULL DEFAULT 0 CHECK (runs_scored >= 0),
    extra_runs SMALLINT NOT NULL DEFAULT 0 CHECK (extra_runs >= 0),
    extra_type VARCHAR(20) CHECK (extra_type IS NULL OR extra_type IN ('Wide', 'No-ball', 'Bye', 'Leg-bye', 'Penalty')),
    wicket_fallen BOOLEAN NOT NULL DEFAULT FALSE,
    wicket_type VARCHAR(30) CHECK (
        wicket_type IS NULL OR 
        wicket_type IN ('Bowled', 'Caught', 'LBW', 'Run out', 'Stumped', 'Hit wicket', 'Retired hurt', 'Obstructing the field')
    ),
    dismissed_player_id BIGINT REFERENCES players(player_id) ON DELETE SET NULL,
    is_legal_delivery BOOLEAN NOT NULL DEFAULT TRUE,
    event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wicket_attributes CHECK (
        (wicket_fallen = FALSE AND dismissed_player_id IS NULL AND wicket_type IS NULL) OR
        (wicket_fallen = TRUE AND dismissed_player_id IS NOT NULL AND wicket_type IS NOT NULL)
    )
);

-- ----------------------------------------------------------------------------
-- 10. BATTING_SCORECARD
-- Stores per-player batting performance for an innings
-- ----------------------------------------------------------------------------
CREATE TABLE batting_scorecard (
    scorecard_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    inning_id BIGINT NOT NULL REFERENCES innings(inning_id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE RESTRICT,
    runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
    balls_faced INTEGER NOT NULL DEFAULT 0 CHECK (balls_faced >= 0),
    fours INTEGER NOT NULL DEFAULT 0 CHECK (fours >= 0),
    sixes INTEGER NOT NULL DEFAULT 0 CHECK (sixes >= 0),
    strike_rate NUMERIC(6,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_batting_player_inning UNIQUE (inning_id, player_id)
);

-- ----------------------------------------------------------------------------
-- 11. BOWLING_SCORECARD
-- Stores per-player bowling performance for an innings
-- ----------------------------------------------------------------------------
CREATE TABLE bowling_scorecard (
    scorecard_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    match_id BIGINT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    inning_id BIGINT NOT NULL REFERENCES innings(inning_id) ON DELETE CASCADE,
    player_id BIGINT NOT NULL REFERENCES players(player_id) ON DELETE RESTRICT,
    overs NUMERIC(5,1) NOT NULL DEFAULT 0.0 CHECK (overs >= 0),
    maidens INTEGER NOT NULL DEFAULT 0 CHECK (maidens >= 0),
    wickets INTEGER NOT NULL DEFAULT 0 CHECK (wickets >= 0),
    runs_conceded INTEGER NOT NULL DEFAULT 0 CHECK (runs_conceded >= 0),
    economy_rate NUMERIC(6,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bowling_player_inning UNIQUE (inning_id, player_id)
);

-- ============================================================================
-- PERFORMANCE INDEXES (As specified in Section 6)
-- ============================================================================
CREATE INDEX idx_matches_status_date ON matches(status, match_date);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_team1_id ON matches(team1_id);
CREATE INDEX idx_matches_team2_id ON matches(team2_id);
CREATE INDEX idx_matches_venue_id ON matches(venue_id);

CREATE INDEX idx_players_team_id ON players(team_id);

CREATE INDEX idx_innings_match_id ON innings(match_id, inning_no);
CREATE INDEX idx_innings_batting_team ON innings(batting_team_id);
CREATE INDEX idx_innings_bowling_team ON innings(bowling_team_id);

CREATE INDEX idx_ball_events_inning_over_ball ON ball_events(inning_id, over_no, ball_no);
CREATE INDEX idx_ball_events_batter ON ball_events(batter_id);
CREATE INDEX idx_ball_events_bowler ON ball_events(bowler_id);

CREATE INDEX idx_batting_scorecard_lookup ON batting_scorecard(inning_id, player_id);
CREATE INDEX idx_batting_scorecard_match ON batting_scorecard(match_id);

CREATE INDEX idx_bowling_scorecard_lookup ON bowling_scorecard(inning_id, player_id);
CREATE INDEX idx_bowling_scorecard_match ON bowling_scorecard(match_id);

CREATE INDEX idx_match_umpires_umpire ON match_umpires(umpire_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Read access allowed for all, write operations handled through authenticated roles
-- ============================================================================
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE umpires ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_umpires ENABLE ROW LEVEL SECURITY;
ALTER TABLE innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ball_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE batting_scorecard ENABLE ROW LEVEL SECURITY;
ALTER TABLE bowling_scorecard ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all 11 tables
CREATE POLICY "Public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read umpires" ON umpires FOR SELECT USING (true);
CREATE POLICY "Public read match_umpires" ON match_umpires FOR SELECT USING (true);
CREATE POLICY "Public read innings" ON innings FOR SELECT USING (true);
CREATE POLICY "Public read ball_events" ON ball_events FOR SELECT USING (true);
CREATE POLICY "Public read batting_scorecard" ON batting_scorecard FOR SELECT USING (true);
CREATE POLICY "Public read bowling_scorecard" ON bowling_scorecard FOR SELECT USING (true);

-- Allow authenticated/service-role full write access
CREATE POLICY "Full access tournaments" ON tournaments FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access venues" ON venues FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access teams" ON teams FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access players" ON players FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access matches" ON matches FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access umpires" ON umpires FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access match_umpires" ON match_umpires FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access innings" ON innings FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access ball_events" ON ball_events FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access batting_scorecard" ON batting_scorecard FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
CREATE POLICY "Full access bowling_scorecard" ON bowling_scorecard FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- SUPABASE REALTIME REPLICATION
-- Enable real-time change broadcasting on live-score tables
-- ============================================================================
DO $$
BEGIN
    -- Add tables to realtime publication if supabase_realtime exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE matches;
        ALTER PUBLICATION supabase_realtime ADD TABLE innings;
        ALTER PUBLICATION supabase_realtime ADD TABLE ball_events;
        ALTER PUBLICATION supabase_realtime ADD TABLE batting_scorecard;
        ALTER PUBLICATION supabase_realtime ADD TABLE bowling_scorecard;
    END IF;
END $$;
