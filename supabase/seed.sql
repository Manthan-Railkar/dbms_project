-- ============================================================================
-- LIVE CRICKET SCORE TRACKER - COMPREHENSIVE SEED DATA
-- Respects foreign key dependency order and simulates realistic T20 match data
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. SEED TOURNAMENTS
-- ----------------------------------------------------------------------------
INSERT INTO tournaments (name, format, start_date, end_date) VALUES
('Indian Premier T20 Championship 2026', 'T20', '2026-03-15', '2026-05-24'),
('ICC Champions Trophy 2026', 'ODI', '2026-06-01', '2026-06-28');

-- ----------------------------------------------------------------------------
-- 2. SEED VENUES
-- ----------------------------------------------------------------------------
INSERT INTO venues (name, city, seating_capacity) VALUES
('Wankhede Stadium', 'Mumbai', 33108),
('M. Chinnaswamy Stadium', 'Bengaluru', 40000),
('MA Chidambaram Stadium', 'Chennai', 38200),
('Arun Jaitley Stadium', 'New Delhi', 41842);

-- ----------------------------------------------------------------------------
-- 3. SEED TEAMS (Captains set to NULL initially)
-- ----------------------------------------------------------------------------
INSERT INTO teams (name, city, captain_id) VALUES
('Mumbai Titans', 'Mumbai', NULL),        -- team_id: 1
('Chennai Kings', 'Chennai', NULL),       -- team_id: 2
('Bangalore Blasters', 'Bengaluru', NULL),-- team_id: 3
('Delhi Dynamos', 'New Delhi', NULL);     -- team_id: 4

-- ----------------------------------------------------------------------------
-- 4. SEED PLAYERS (6 players per team to enable rich demo scorecards)
-- ----------------------------------------------------------------------------
-- Mumbai Titans (Team 1)
INSERT INTO players (name, role, batting_style, bowling_style, team_id) VALUES
('Rohit Sharma', 'Batter', 'Right-hand bat', 'Right-arm offbreak', 1),         -- player_id: 1
('Ishan Kishan', 'Wicketkeeper', 'Left-hand bat', NULL, 1),                    -- player_id: 2
('Suryakumar Yadav', 'Batter', 'Right-hand bat', 'Right-arm medium', 1),       -- player_id: 3
('Hardik Pandya', 'All-rounder', 'Right-hand bat', 'Right-arm fast-medium', 1),-- player_id: 4
('Jasprit Bumrah', 'Bowler', 'Right-hand bat', 'Right-arm fast', 1),           -- player_id: 5
('Piyush Chawla', 'Bowler', 'Left-hand bat', 'Right-arm legbreak', 1);         -- player_id: 6

-- Chennai Kings (Team 2)
INSERT INTO players (name, role, batting_style, bowling_style, team_id) VALUES
('Ruturaj Gaikwad', 'Batter', 'Right-hand bat', 'Right-arm offbreak', 2),      -- player_id: 7
('Devon Conway', 'Batter', 'Left-hand bat', 'Right-arm medium', 2),            -- player_id: 8
('Shivam Dube', 'All-rounder', 'Left-hand bat', 'Right-arm medium', 2),        -- player_id: 9
('Ravindra Jadeja', 'All-rounder', 'Left-hand bat', 'Slow left-arm orthodox', 2),-- player_id: 10
('MS Dhoni', 'Wicketkeeper', 'Right-hand bat', NULL, 2),                       -- player_id: 11
('Matheesha Pathirana', 'Bowler', 'Right-hand bat', 'Right-arm fast', 2);      -- player_id: 12

-- Bangalore Blasters (Team 3)
INSERT INTO players (name, role, batting_style, bowling_style, team_id) VALUES
('Virat Kohli', 'Batter', 'Right-hand bat', 'Right-arm medium', 3),            -- player_id: 13
('Faf du Plessis', 'Batter', 'Right-hand bat', 'Right-arm legbreak', 3),       -- player_id: 14
('Glenn Maxwell', 'All-rounder', 'Right-hand bat', 'Right-arm offbreak', 3),   -- player_id: 15
('Rajat Patidar', 'Batter', 'Right-hand bat', NULL, 3),                        -- player_id: 16
('Dinesh Karthik', 'Wicketkeeper', 'Right-hand bat', NULL, 3),                 -- player_id: 17
('Mohammed Siraj', 'Bowler', 'Right-hand bat', 'Right-arm fast', 3);           -- player_id: 18

-- Delhi Dynamos (Team 4)
INSERT INTO players (name, role, batting_style, bowling_style, team_id) VALUES
('Rishabh Pant', 'Wicketkeeper', 'Left-hand bat', NULL, 4),                    -- player_id: 19
('David Warner', 'Batter', 'Left-hand bat', 'Right-arm legbreak', 4),          -- player_id: 20
('Mitchell Marsh', 'All-rounder', 'Right-hand bat', 'Right-arm fast-medium', 4),-- player_id: 21
('Axar Patel', 'All-rounder', 'Left-hand bat', 'Slow left-arm orthodox', 4),  -- player_id: 22
('Kuldeep Yadav', 'Bowler', 'Left-hand bat', 'Left-arm wrist spin', 4),        -- player_id: 23
('Khaleel Ahmed', 'Bowler', 'Right-hand bat', 'Left-arm fast-medium', 4);     -- player_id: 24

-- ----------------------------------------------------------------------------
-- UPDATE TEAMS WITH CAPTAIN IDS
-- ----------------------------------------------------------------------------
UPDATE teams SET captain_id = 4 WHERE team_id = 1;  -- Hardik Pandya (Mumbai)
UPDATE teams SET captain_id = 7 WHERE team_id = 2;  -- Ruturaj Gaikwad (Chennai)
UPDATE teams SET captain_id = 14 WHERE team_id = 3; -- Faf du Plessis (Bangalore)
UPDATE teams SET captain_id = 19 WHERE team_id = 4; -- Rishabh Pant (Delhi)

-- ----------------------------------------------------------------------------
-- 5. SEED UMPIRES
-- ----------------------------------------------------------------------------
INSERT INTO umpires (name, certification_level) VALUES
('Nitin Menon', 'ICC Elite Panel'),
('Richard Kettleborough', 'ICC Elite Panel'),
('Kumar Dharmasena', 'ICC Elite Panel'),
('Anil Chaudhary', 'ICC International Panel');

-- ----------------------------------------------------------------------------
-- 6. SEED MATCHES
-- Match 1: Completed Match (Mumbai Titans vs Chennai Kings)
-- Match 2: Live Match (Bangalore Blasters vs Delhi Dynamos)
-- Match 3: Upcoming Match (Mumbai Titans vs Bangalore Blasters)
-- ----------------------------------------------------------------------------
INSERT INTO matches (
    tournament_id, match_date, toss_winner_id, toss_decision, 
    toss_result, status, team1_id, team2_id, winner_id, venue_id
) VALUES
(
    1, 
    '2026-04-10 19:30:00+05:30', 
    2, 
    'Field', 
    'Chennai Kings won the toss and elected to field', 
    'Completed', 
    1, 2, 1, 1
),
(
    1, 
    '2026-04-12 19:30:00+05:30', 
    3, 
    'Bat', 
    'Bangalore Blasters won the toss and elected to bat', 
    'Live', 
    3, 4, NULL, 2
),
(
    1, 
    '2026-04-15 19:30:00+05:30', 
    NULL, 
    NULL, 
    NULL, 
    'Upcoming', 
    1, 3, NULL, 1
);

-- ----------------------------------------------------------------------------
-- 7. SEED MATCH_UMPIRES
-- ----------------------------------------------------------------------------
INSERT INTO match_umpires (match_id, umpire_id, role) VALUES
(1, 1, 'On-field'),
(1, 2, 'On-field'),
(1, 4, 'Third Umpire'),
(2, 3, 'On-field'),
(2, 4, 'On-field'),
(2, 1, 'Third Umpire');

-- ----------------------------------------------------------------------------
-- 8. SEED INNINGS
-- Match 1: Innings 1 (Mumbai 186/3 in 20.0), Innings 2 (Chennai 172/6 in 20.0)
-- Match 2: Innings 1 (Bangalore 48/1 in 4.2 overs currently Live)
-- ----------------------------------------------------------------------------
INSERT INTO innings (match_id, inning_no, batting_team_id, bowling_team_id, runs, wickets, overs) VALUES
(1, 1, 1, 2, 186, 3, 20.0),
(1, 2, 2, 1, 172, 6, 20.0),
(2, 1, 3, 4, 48, 1, 4.2);

-- ----------------------------------------------------------------------------
-- 9. SEED BATTING SCORECARD (Match 1 & Match 2)
-- ----------------------------------------------------------------------------
-- Match 1, Innings 1 (Mumbai Titans)
INSERT INTO batting_scorecard (match_id, inning_id, player_id, runs, balls_faced, fours, sixes, strike_rate) VALUES
(1, 1, 1, 68, 42, 7, 3, 161.90), -- Rohit Sharma
(1, 1, 2, 34, 25, 4, 1, 136.00), -- Ishan Kishan
(1, 1, 3, 52, 29, 5, 2, 179.31), -- Suryakumar Yadav
(1, 1, 4, 25, 14, 2, 2, 178.57); -- Hardik Pandya

-- Match 1, Innings 2 (Chennai Kings)
INSERT INTO batting_scorecard (match_id, inning_id, player_id, runs, balls_faced, fours, sixes, strike_rate) VALUES
(1, 2, 7, 54, 38, 6, 1, 142.11), -- Ruturaj Gaikwad
(1, 2, 8, 22, 18, 3, 0, 122.22), -- Devon Conway
(1, 2, 9, 45, 26, 2, 4, 173.08), -- Shivam Dube
(1, 2, 10, 18, 14, 1, 1, 128.57),-- Ravindra Jadeja
(1, 2, 11, 28, 16, 2, 2, 175.00);-- MS Dhoni

-- Match 2, Innings 1 (Bangalore Blasters - Live)
INSERT INTO batting_scorecard (match_id, inning_id, player_id, runs, balls_faced, fours, sixes, strike_rate) VALUES
(2, 3, 13, 28, 15, 3, 1, 186.67), -- Virat Kohli (not out)
(2, 3, 14, 12, 8, 2, 0, 150.00),  -- Faf du Plessis (dismissed)
(2, 3, 16, 6, 3, 1, 0, 200.00);   -- Rajat Patidar (not out)

-- ----------------------------------------------------------------------------
-- 10. SEED BOWLING SCORECARD (Match 1 & Match 2)
-- ----------------------------------------------------------------------------
-- Match 1, Innings 1 (Chennai Kings Bowling)
INSERT INTO bowling_scorecard (match_id, inning_id, player_id, overs, maidens, wickets, runs_conceded, economy_rate) VALUES
(1, 1, 10, 4.0, 0, 1, 32, 8.00), -- Ravindra Jadeja
(1, 1, 12, 4.0, 0, 2, 38, 9.50), -- Matheesha Pathirana
(1, 1, 9, 3.0, 0, 0, 28, 9.33);  -- Shivam Dube

-- Match 1, Innings 2 (Mumbai Titans Bowling)
INSERT INTO bowling_scorecard (match_id, inning_id, player_id, overs, maidens, wickets, runs_conceded, economy_rate) VALUES
(1, 2, 5, 4.0, 1, 3, 21, 5.25), -- Jasprit Bumrah
(1, 2, 4, 4.0, 0, 1, 36, 9.00), -- Hardik Pandya
(1, 2, 6, 4.0, 0, 2, 34, 8.50); -- Piyush Chawla

-- Match 2, Innings 1 (Delhi Dynamos Bowling - Live)
INSERT INTO bowling_scorecard (match_id, inning_id, player_id, overs, maidens, wickets, runs_conceded, economy_rate) VALUES
(2, 3, 24, 2.2, 0, 1, 24, 10.29), -- Khaleel Ahmed
(2, 3, 21, 2.0, 0, 0, 22, 11.00);  -- Mitchell Marsh

-- ----------------------------------------------------------------------------
-- 11. SEED BALL_EVENTS (Detailed demonstration deliveries for Live Innings 3)
-- Over 0 and Over 1 of Match 2, Inning 1
-- ----------------------------------------------------------------------------
INSERT INTO ball_events (
    inning_id, over_no, ball_no, batter_id, bowler_id, 
    runs_scored, extra_runs, extra_type, wicket_fallen, 
    wicket_type, dismissed_player_id, is_legal_delivery, event_time
) VALUES
-- Over 0 bowled by Khaleel Ahmed (Player 24) to Virat Kohli (Player 13)
(3, 0, 1, 13, 24, 0, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '15 minutes'),
(3, 0, 2, 13, 24, 4, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '14 minutes'),
(3, 0, 3, 13, 24, 1, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '13 minutes'),
-- Faf du Plessis (Player 14) on strike
(3, 0, 4, 14, 24, 0, 1, 'Wide', FALSE, NULL, NULL, FALSE, NOW() - INTERVAL '12 minutes'),
(3, 0, 4, 14, 24, 4, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '11 minutes'),
(3, 0, 5, 14, 24, 1, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '10 minutes'),
-- Kohli on strike
(3, 0, 6, 13, 24, 2, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '9 minutes'),

-- Over 1 bowled by Mitchell Marsh (Player 21)
(3, 1, 1, 14, 21, 1, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '8 minutes'),
(3, 1, 2, 13, 21, 6, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '7 minutes'),
(3, 1, 3, 13, 21, 1, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '6 minutes'),
(3, 1, 4, 14, 21, 4, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '5 minutes'),
(3, 1, 5, 14, 21, 2, 0, NULL, FALSE, NULL, NULL, TRUE, NOW() - INTERVAL '4 minutes'),
-- Wicket ball! Faf du Plessis caught out
(3, 1, 6, 14, 21, 0, 0, NULL, TRUE, 'Caught', 14, TRUE, NOW() - INTERVAL '3 minutes');

COMMIT;
