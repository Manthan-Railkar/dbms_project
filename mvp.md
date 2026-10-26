# Live Cricket Score Tracker --- MVP Specification

## 1. Project Overview

**Project title:** Live Cricket Score Tracker\
**Project type:** DBMS Mini Project\
**Database:** Supabase PostgreSQL (RDBMS)\
**Frontend:** Next.js, React, TypeScript, Tailwind CSS\
**Animations:** Framer Motion; GSAP only where useful\
**Backend:** Next.js Route Handlers\
**Database client:** Supabase JavaScript client for normal application
operations; server-only PostgreSQL connection for the SQL workspace\
**Live updates:** Supabase Realtime\
**SQL editor:** Monaco Editor (optional, recommended)

### Problem Statement

Cricket scorekeeping involves recording matches, teams, players,
innings, individual deliveries, and player statistics. Manual or
disconnected records can lead to inconsistent scores, duplicate records,
and time-consuming analysis.

The Live Cricket Score Tracker provides a centralized relational
database for storing cricket data, recording ball-by-ball events,
displaying live scoreboards, and querying match and player statistics.
It also provides an interactive SQL workspace where authorized users can
run queries and observe successful database changes reflected in the
application UI.

### MVP Goal

Deliver a working full-stack prototype that demonstrates:

-   A relational schema based on the supplied abstract's **11 core
    tables**.
-   Primary keys, foreign keys, constraints, and a design intended to
    follow Third Normal Form (3NF).
-   Match, team, player, venue, tournament, umpire, innings, delivery,
    and scorecard data.
-   Live scoreboards and match/player statistics.
-   A database explorer for browsing the 11 tables.
-   A protected SQL workspace for running approved SQL statements.
-   UI refresh after mutations and Realtime-driven refresh when
    subscribed data changes.

------------------------------------------------------------------------

## 2. Technology Stack

  -------------------------------------------------------------------------
  Layer                   Technology                Purpose
  ----------------------- ------------------------- -----------------------
  Frontend framework      Next.js App Router        Pages and server
                                                    endpoints

  UI                      React + TypeScript        Components, typed data,
                                                    state

  Styling                 Tailwind CSS              Responsive interface

  Animations              Framer Motion             UI transitions and
                                                    feedback

  Advanced animations     GSAP (optional)           Limited
                                                    dashboard/scoreboard
                                                    animation

  Database                Supabase PostgreSQL       Relational persistence
                                                    and SQL

  Normal application      `@supabase/supabase-js`   Queries, CRUD, Realtime
  access                                            subscriptions

  SQL workspace           Server-only `pg`          Execute authorized SQL
                          connection or controlled  
                          SQL function              

  Validation              Zod                       Validate API inputs

  SQL editor              Monaco Editor (optional)  Syntax-highlighted SQL
                                                    editor
  -------------------------------------------------------------------------

PostgreSQL is an RDBMS. SQL is the language used to query and manipulate
it; Supabase is the platform hosting the PostgreSQL database and related
services.

------------------------------------------------------------------------

## 3. Scope

### Included in the MVP

1.  Dashboard listing ongoing, upcoming, and completed matches.
2.  Match detail page with innings and scorecards.
3.  Team and player listing/detail views.
4.  Database explorer showing all 11 core tables and their rows.
5.  SQL workspace with query editor, Run action, results grid, errors,
    execution duration, and affected-row information where available.
6.  Sample query library for common DBMS operations.
7.  CRUD operations for permitted tables.
8.  Live refresh after a successful write.
9.  Realtime subscriptions for configured tables.
10. Seed data for a demonstration tournament, teams, players, venues,
    matches, innings, deliveries, umpires, and scorecards.
11. Loading, empty, validation, and database-error states.

### Out of Scope for the First MVP

-   Integration with a professional live cricket data provider.
-   Production-grade multi-tenant administration.
-   Full international cricket rules engine.
-   Automatic ball recognition or video analysis.
-   Public, unrestricted SQL access.
-   Unrestricted schema changes such as `DROP TABLE` or `TRUNCATE`.

The initial "live" demonstration uses application-entered ball events
and/or database changes. It does not imply that official external match
feeds are connected.

------------------------------------------------------------------------

## 4. Database Structure --- 11 Core Tables

The table count and entities below follow the supplied project abstract.
The abstract's relational-schema text contains a few ambiguous or
duplicated field references, especially in `Ball_Events` and
`Bowling_Scorecard`. The definitions below preserve the same 11 entities
while specifying consistent PostgreSQL columns for implementation.

Use PostgreSQL `snake_case` names for consistency. PostgreSQL folds
unquoted identifiers to lowercase, so names such as `Teams` and `teams`
are not distinct when unquoted.

### Relationship Summary

-   One tournament has many matches.
-   One venue can host many matches.
-   A team has many players.
-   A match references two teams: team 1 and team 2.
-   A match has one or more innings.
-   An innings contains many ball events.
-   A player can appear in many innings and scorecards.
-   A match can have multiple umpires, and an umpire can officiate
    multiple matches, represented by `match_umpires`.
-   Batting and bowling scorecards associate players with innings and
    store per-innings statistics.
-   A team's captain is a player. This relationship needs a deliberate
    constraint or deferred validation because `teams` references
    `players` while `players` references `teams`.

### Table 1 --- `tournaments`

**Purpose:** Store series, leagues, and tournament details.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `tournament_id`         `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `name`                  `VARCHAR(150)`                          NOT NULL, UNIQUE

  `format`                `VARCHAR(10)`                           NOT NULL; expected
                                                                  values such as T20,
                                                                  ODI, Test

  `start_date`            `DATE`                                  NOT NULL

  `end_date`              `DATE`                                  NULL allowed; must not
                                                                  precede start date
  ---------------------------------------------------------------------------------------

**Relationships:** One tournament has many matches.

### Table 2 --- `venues`

**Purpose:** Store ground details.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `venue_id`              `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `name`                  `VARCHAR(150)`                          NOT NULL

  `city`                  `VARCHAR(100)`                          NOT NULL

  `seating_capacity`      `INTEGER`                               NULL allowed; if
                                                                  supplied, must be
                                                                  non-negative
  ---------------------------------------------------------------------------------------

### Table 3 --- `teams`

**Purpose:** Store cricket teams and their current captain.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `team_id`               `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `name`                  `VARCHAR(120)`                          NOT NULL, UNIQUE

  `city`                  `VARCHAR(100)`                          NULL allowed

  `captain_id`            `BIGINT`                                Nullable foreign key to
                                                                  `players.player_id`
  ---------------------------------------------------------------------------------------

**Relationships:** One team has many players. Each match references two
teams through `team1_id` and `team2_id`.

**Implementation note:** `players.team_id` references `teams.team_id`,
while `teams.captain_id` references `players.player_id`. Create both
tables first with one of the circular foreign keys added afterward using
`ALTER TABLE`. Validate that the captain belongs to the same team using
application validation or a database trigger if required.

### Table 4 --- `players`

**Purpose:** Store player profiles.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `player_id`             `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `name`                  `VARCHAR(120)`                          NOT NULL

  `role`                  `VARCHAR(30)`                           NOT NULL; e.g. Batter,
                                                                  Bowler, All-rounder,
                                                                  Wicketkeeper

  `batting_style`         `VARCHAR(30)`                           NULL allowed

  `bowling_style`         `VARCHAR(50)`                           NULL allowed

  `team_id`               `BIGINT`                                NOT NULL; foreign key
                                                                  to `teams.team_id`
  ---------------------------------------------------------------------------------------

**Relationships:** Players are referenced by ball events, batting
scorecards, bowling scorecards, and optionally as team captains.

### Table 5 --- `matches`

**Purpose:** Store each fixture, its teams, tournament, venue, toss,
status, and result.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `match_id`              `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `tournament_id`         `BIGINT`                                NOT NULL; FK to
                                                                  `tournaments`

  `match_date`            `TIMESTAMPTZ`                           NOT NULL

  `toss_winner_id`        `BIGINT`                                NULL; FK to `teams`

  `toss_decision`         `VARCHAR(20)`                           NULL; Bat or Field

  `toss_result`           `VARCHAR(250)`                          NULL; optional
                                                                  descriptive text

  `status`                `VARCHAR(20)`                           NOT NULL; Upcoming,
                                                                  Live, Completed,
                                                                  Abandoned

  `team1_id`              `BIGINT`                                NOT NULL; FK to `teams`

  `team2_id`              `BIGINT`                                NOT NULL; FK to `teams`

  `winner_id`             `BIGINT`                                NULL; FK to `teams`

  `venue_id`              `BIGINT`                                NOT NULL; FK to
                                                                  `venues`
  ---------------------------------------------------------------------------------------

**Constraints and validation:** - `team1_id` and `team2_id` must
differ. - `winner_id`, when supplied, must be one of the two
participating teams. - Toss winner, when supplied, must be one of the
two participating teams. - A winner may be absent for upcoming,
abandoned, or tied matches.

### Table 6 --- `umpires`

**Purpose:** Store match officials.

  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- --------------
  `umpire_id`             `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key
  `name`                  `VARCHAR(120)`                          NOT NULL
  `certification_level`   `VARCHAR(80)`                           NULL allowed

### Table 7 --- `match_umpires`

**Purpose:** Resolve the many-to-many relationship between matches and
umpires, including each umpire's role in a match.

  -----------------------------------------------------------------------
  Column                  PostgreSQL type         Constraints
  ----------------------- ----------------------- -----------------------
  `match_id`              `BIGINT`                FK to
                                                  `matches.match_id`

  `umpire_id`             `BIGINT`                FK to
                                                  `umpires.umpire_id`

  `role`                  `VARCHAR(40)`           NOT NULL;
                                                  e.g. On-field, Third
                                                  Umpire, Reserve

  `PRIMARY KEY`           ---                     Composite key:
                                                  (`match_id`,
                                                  `umpire_id`)
  -----------------------------------------------------------------------

### Table 8 --- `innings`

**Purpose:** Store each innings of a match and its current or final
totals.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `inning_id`             `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `match_id`              `BIGINT`                                NOT NULL; FK to
                                                                  `matches`

  `inning_no`             `SMALLINT`                              NOT NULL; positive

  `batting_team_id`       `BIGINT`                                NOT NULL; FK to `teams`

  `bowling_team_id`       `BIGINT`                                NOT NULL; FK to `teams`

  `runs`                  `INTEGER`                               NOT NULL DEFAULT 0;
                                                                  non-negative

  `wickets`               `SMALLINT`                              NOT NULL DEFAULT 0;
                                                                  between 0 and 10

  `overs`                 `NUMERIC(5,1)`                          NOT NULL DEFAULT 0;
                                                                  display/summary value
                                                                  only
  ---------------------------------------------------------------------------------------

**Constraints and validation:** - Unique (`match_id`, `inning_no`). -
Batting and bowling teams must differ. - Both teams must be participants
in the referenced match. - For an exact ball-by-ball model, legal-ball
count is more reliable than storing overs as a decimal. The displayed
over notation should be calculated from legal deliveries (for example,
19.4 means 19 overs and 4 legal balls, not decimal 19.4).

### Table 9 --- `ball_events`

**Purpose:** Record the delivery-by-delivery event log. This table
should be the source of truth for scoring.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `ball_id`               `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `inning_id`             `BIGINT`                                NOT NULL; FK to
                                                                  `innings`

  `over_no`               `SMALLINT`                              NOT NULL; non-negative

  `ball_no`               `SMALLINT`                              NOT NULL; positive
                                                                  sequence number within
                                                                  an over

  `batter_id`             `BIGINT`                                NOT NULL; FK to
                                                                  `players`

  `bowler_id`             `BIGINT`                                NOT NULL; FK to
                                                                  `players`

  `runs_scored`           `SMALLINT`                              NOT NULL DEFAULT 0;
                                                                  non-negative batter
                                                                  runs

  `extra_runs`            `SMALLINT`                              NOT NULL DEFAULT 0;
                                                                  non-negative extras

  `extra_type`            `VARCHAR(20)`                           NULL; e.g. Wide,
                                                                  No-ball, Bye, Leg-bye,
                                                                  Penalty

  `wicket_fallen`         `BOOLEAN`                               NOT NULL DEFAULT FALSE

  `wicket_type`           `VARCHAR(30)`                           NULL; e.g. Bowled,
                                                                  Caught, Run out

  `dismissed_player_id`   `BIGINT`                                NULL; FK to `players`

  `is_legal_delivery`     `BOOLEAN`                               NOT NULL DEFAULT TRUE

  `event_time`            `TIMESTAMPTZ`                           NOT NULL DEFAULT
                                                                  `NOW()`
  ---------------------------------------------------------------------------------------

**Constraints and validation:** - Runs and extras must be
non-negative. - If `wicket_fallen` is false, `dismissed_player_id` and
`wicket_type` should be NULL. - Validate that the batter and bowler are
eligible for the innings' batting and bowling teams. - A delivery's
total team runs are generally `runs_scored + extra_runs`; the precise
rules for no-balls and byes should be implemented consistently. - Wides
and no-balls normally do not count as legal balls; byes and leg-byes
normally do. - A ball event is a delivery record, not necessarily a
legal ball. Over progression must use legal deliveries. - Decide how to
handle multiple events with the same `over_no`/`ball_no` when wides or
no-balls occur. For a simple MVP, use a monotonically increasing event
sequence per innings and store over/ball display fields consistently.

### Table 10 --- `batting_scorecard`

**Purpose:** Store per-player batting statistics for an innings.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `scorecard_id`          `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `match_id`              `BIGINT`                                NOT NULL; FK to
                                                                  `matches`

  `inning_id`             `BIGINT`                                NOT NULL; FK to
                                                                  `innings`

  `player_id`             `BIGINT`                                NOT NULL; FK to
                                                                  `players`

  `runs`                  `INTEGER`                               NOT NULL DEFAULT 0;
                                                                  non-negative

  `balls_faced`           `INTEGER`                               NOT NULL DEFAULT 0;
                                                                  non-negative

  `fours`                 `INTEGER`                               NOT NULL DEFAULT 0;
                                                                  non-negative

  `sixes`                 `INTEGER`                               NOT NULL DEFAULT 0;
                                                                  non-negative

  `strike_rate`           `NUMERIC(6,2)`                          Derived/display value
                                                                  or maintained value
  ---------------------------------------------------------------------------------------

**Constraints and validation:** - Unique (`inning_id`, `player_id`). -
Prefer calculating strike rate as `100 * runs / balls_faced`, with
division-by-zero protection, instead of trusting manually entered
values. - Ensure `match_id` corresponds to the match associated with
`inning_id`. This can be enforced by a composite foreign key if the
schema includes a corresponding unique key, or validated through a
trigger/application transaction.

### Table 11 --- `bowling_scorecard`

**Purpose:** Store per-player bowling statistics for an innings.

  ---------------------------------------------------------------------------------------
  Column                  PostgreSQL type                         Constraints
  ----------------------- --------------------------------------- -----------------------
  `scorecard_id`          `BIGINT GENERATED ALWAYS AS IDENTITY`   Primary key

  `match_id`              `BIGINT`                                NOT NULL; FK to
                                                                  `matches`

  `inning_id`             `BIGINT`                                NOT NULL; FK to
                                                                  `innings`

  `player_id`             `BIGINT`                                NOT NULL; FK to
                                                                  `players`

  `overs`                 `NUMERIC(5,1)`                          NOT NULL DEFAULT 0;
                                                                  display notation only

  `maidens`               `INTEGER`                               NOT NULL DEFAULT 0;
                                                                  non-negative

  `wickets`               `INTEGER`                               NOT NULL DEFAULT 0;
                                                                  non-negative

  `runs_conceded`         `INTEGER`                               NOT NULL DEFAULT 0;
                                                                  non-negative

  `economy_rate`          `NUMERIC(6,2)`                          Derived/display value
                                                                  or maintained value
  ---------------------------------------------------------------------------------------

**Constraints and validation:** - Unique (`inning_id`, `player_id`). -
Prefer deriving economy rate from runs conceded and legal overs, with
division-by-zero protection. - Store legal balls or calculate them from
`ball_events` for reliable over calculations. - Not every dismissal
counts as a bowler's wicket; wicket attribution must follow cricket
rules. - Ensure `match_id` corresponds to the match associated with
`inning_id`.

------------------------------------------------------------------------

## 5. Key Relationships and Foreign Keys

  -----------------------------------------------------------------------
  Parent                  Child                   Relationship
  ----------------------- ----------------------- -----------------------
  `tournaments`           `matches`               One-to-many

  `venues`                `matches`               One-to-many

  `teams`                 `players`               One-to-many

  `teams`                 `matches`               Two role-based FKs:
                                                  `team1_id`, `team2_id`

  `teams`                 `matches`               Optional
                                                  winner/toss-winner
                                                  references

  `players`               `teams`                 Optional captain
                                                  reference

  `matches`               `innings`               One-to-many

  `teams`                 `innings`               Batting team and
                                                  bowling team references

  `innings`               `ball_events`           One-to-many

  `players`               `ball_events`           Batter, bowler,
                                                  dismissed player
                                                  references

  `matches`               `match_umpires`         One-to-many

  `umpires`               `match_umpires`         One-to-many

  `innings`               `batting_scorecard`     One-to-many

  `players`               `batting_scorecard`     One-to-many

  `innings`               `bowling_scorecard`     One-to-many

  `players`               `bowling_scorecard`     One-to-many
  -----------------------------------------------------------------------

### Delete/update behavior

Use deliberate foreign-key behavior: - Prefer `ON DELETE RESTRICT` for
referenced teams, players, matches, innings, and scorecards to protect
historical match records. - Use `ON DELETE CASCADE` only for dependent
junction or event records when deleting the parent is an explicitly
allowed operation. - Prefer marking a match as abandoned or cancelled
instead of deleting a match with recorded deliveries. - Use
`ON UPDATE CASCADE` only where changing referenced primary keys is
intentionally supported; identity keys should normally remain stable.

------------------------------------------------------------------------

## 6. Normalization and Data Integrity

The supplied abstract states that the design follows Third Normal Form
(3NF). The implementation should support that goal by separating teams,
players, venues, tournaments, matches, umpires, innings, delivery
events, and per-innings scorecards into their own tables.

The implementation should demonstrate:

1.  **Primary keys:** Every core entity has a stable identifier.
2.  **Foreign keys:** Related records cannot reference nonexistent
    parent rows.
3.  **Unique constraints:** Prevent duplicate junction records and
    duplicate innings/player scorecard entries.
4.  **Check constraints:** Prevent invalid negative totals and
    impossible status values.
5.  **Transactions:** Keep a ball-event insertion and any dependent
    score updates consistent.
6.  **Derived statistics:** Calculate strike rates, economy rates,
    innings totals, and leaderboards from reliable source data where
    practical.
7.  **Indexes:** Add indexes to frequently queried foreign-key columns
    and common filters.
8.  **3NF review:** Confirm non-key attributes depend on the key, the
    whole key, and nothing but the key; document any deliberately
    duplicated summary fields and how they are kept consistent.

Recommended initial indexes: - `matches(status, match_date)` -
`matches(tournament_id)` - `matches(team1_id)` and `matches(team2_id)` -
`players(team_id)` - `innings(match_id, inning_no)` -
`ball_events(inning_id, over_no, ball_no)` -
`batting_scorecard(inning_id, player_id)` -
`bowling_scorecard(inning_id, player_id)` - `match_umpires(umpire_id)`

PostgreSQL does not automatically create indexes on every foreign-key
column, so add them where query patterns justify them.

------------------------------------------------------------------------

## 7. Application Pages

### 7.1 Dashboard --- `/`

Show: - Live matches. - Upcoming fixtures. - Recently completed
matches. - Featured match score and status. - Top run-scorers and
wicket-takers. - Quick links to the database explorer and SQL workspace.

All displayed values must come from PostgreSQL queries.

### 7.2 Match Details --- `/matches/[matchId]`

Show: - Tournament, teams, venue, date, and status. - Innings score and
wickets. - Current over notation. - Ball-by-ball commentary/events. -
Batting and bowling scorecards. - Match result when completed.

### 7.3 Teams --- `/teams`

Show team list, city, captain, and player count.

### 7.4 Team Details --- `/teams/[teamId]`

Show team details and roster. Link each player to their
profile/statistics.

### 7.5 Player Details --- `/players/[playerId]`

Show player role, team, batting statistics, bowling statistics, and
match appearances.

### 7.6 Database Explorer --- `/database`

Show all 11 tables in a sidebar or table selector. Selecting a table
should display: - Table name and approximate/actual row count. - Column
names and data types. - Rows in a paginated grid. - Search/filter
controls. - Insert/edit/delete controls where authorized. - Relationship
information where available.

### 7.7 SQL Workspace --- `/sql-workspace`

Include: - SQL editor with syntax highlighting. - Run button and running
indicator. - Query examples and query history. - Result table for
row-returning statements. - Affected-row count for mutations when
available. - Execution duration. - Clear success and error messages. -
Confirmation step for destructive or high-impact mutations. - A visible
indication of which database/environment is connected.

The SQL workspace must run against the actual hosted database, not a
local mock or simulated result set.

------------------------------------------------------------------------

## 8. SQL Workspace Execution Design

### Normal application queries

Use the Supabase client and specific API routes for known application
operations. Keep authorization and validation close to the
server/database boundary.

### Arbitrary SQL workspace

The browser should send the query text to a server endpoint such as:

`POST /api/sql/execute`

The endpoint should: 1. Authenticate the user. 2. Verify the user has
SQL-console permission. 3. Apply statement policy and execution limits.
4. Execute using a server-only PostgreSQL connection or a deliberately
constrained database function. 5. Return a structured response
containing columns/rows when available, command metadata, duration, and
errors. 6. Log the user, timestamp, statement outcome, and execution
duration without logging secrets.

### Security requirements

-   Never put database passwords, connection strings, Supabase secret
    keys, or service-role keys in client-side code.
-   Do not expose unrestricted SQL execution to anonymous users.
-   Do not treat string matching or checking whether a query begins with
    `SELECT` as a complete security control.
-   Use a restricted database role and explicit permissions.
-   Apply statement timeouts and result-size limits.
-   Consider allowing only one statement per request.
-   Disable destructive DDL in the MVP.
-   Provide a confirmation prompt for `UPDATE` or `DELETE` statements
    without a `WHERE` clause.
-   Use Row Level Security and database grants where appropriate.
-   Restrict access to the console to authenticated project
    administrators.
-   Make it clear when a mutation is permanent.

A query editor that executes arbitrary SQL is effectively a database
administration tool. The security model must be designed accordingly.

------------------------------------------------------------------------

## 9. Live UI Synchronization

The application should use two methods.

### A. Refresh after a query run

After a successful SQL mutation: 1. Display the query result. 2. Refetch
affected table rows. 3. Refetch match, innings, and scorecard data that
depend on the changed table. 4. Update React state using the fresh
server response. 5. Animate the updated values with Framer Motion if
appropriate.

This is the primary way to guarantee that a user's own SQL mutation is
reflected in the UI.

### B. Supabase Realtime

Subscribe to changes on selected tables, such as `matches`, `innings`,
and `ball_events`. Ensure the tables are configured for
Realtime/replication as required.

When a relevant change event arrives: 1. Identify which view depends on
the changed table. 2. Refetch the relevant data or invalidate its cache.
3. Recalculate displayed score values from the authoritative database
data. 4. Unsubscribe when the component is unmounted.

Realtime is a notification mechanism, not a replacement for reliable
score calculations. A change to one ball event may affect team totals,
batter statistics, bowler statistics, wickets, and over progression.

------------------------------------------------------------------------

## 10. API Route Plan

Suggested Next.js Route Handlers:

  ------------------------------------------------------------------------------------
  Method                  Endpoint                             Purpose
  ----------------------- ------------------------------------ -----------------------
  `GET`                   `/api/matches`                       List matches with
                                                               filters

  `GET`                   `/api/matches/[matchId]`             Match details, innings
                                                               and scorecards

  `GET`                   `/api/teams`                         List teams

  `GET`                   `/api/teams/[teamId]`                Team and roster details

  `GET`                   `/api/players/[playerId]`            Player statistics

  `GET`                   `/api/database/tables`               List permitted database
                                                               tables

  `GET`                   `/api/database/tables/[tableName]`   Read a permitted table
                                                               with pagination

  `POST`                  `/api/database/rows`                 Insert a permitted row

  `PATCH`                 `/api/database/rows`                 Update a permitted row

  `DELETE`                `/api/database/rows`                 Delete a permitted row

  `POST`                  `/api/sql/execute`                   Execute an authorized
                                                               SQL statement

  `GET`                   `/api/analytics/top-scorers`         Top run-scorers

  `GET`                   `/api/analytics/top-wicket-takers`   Leading wicket-takers
  ------------------------------------------------------------------------------------

The table explorer must use a server-side allowlist of table names.
Never accept arbitrary table names and interpolate them into SQL without
validation.

------------------------------------------------------------------------

## 11. Required SQL Demonstrations

The project should provide example queries for the six query categories
in the supplied abstract.

1.  Display all matches with team and venue names.
2.  Display the batting scorecard for a match.
3.  Find the highest run-scorer.
4.  Find the leading wicket-taker.
5.  Display match results.
6.  Calculate player strike rates from stored totals.

Also include examples demonstrating: - `INSERT`, `UPDATE`, and
`DELETE`. - `JOIN` across related tables. - `GROUP BY`, `HAVING`, and
aggregate functions. - Subqueries and views. - Primary-key and
foreign-key constraint failures. - A transaction that is rolled back. -
A query returning zero rows and a query producing a handled error.

Make the SQL examples match the final implemented schema and sample
data.

------------------------------------------------------------------------

## 12. Seed Data

Prepare realistic but clearly labelled demonstration data: - At least 1
tournament. - At least 4 teams. - At least 5--8 players per team. - At
least 2 venues. - At least 2 umpires. - At least 2 matches: one
completed and one upcoming or live. - At least 1 innings per match, with
two innings for a completed limited-overs match if the demo supports
it. - Enough ball events to demonstrate over progression, extras,
wickets, and score calculations. - Corresponding batting and bowling
scorecard rows, if those tables are maintained as stored summaries.

Use a consistent seeding order that respects foreign keys. Because teams
reference captains and players reference teams, seed teams and players
first, then assign captains after both exist. Seed matches before
innings, and innings before ball events and scorecards.

Clearly label all sample data as fictional/demo data if it does not
represent real match records.

------------------------------------------------------------------------

## 13. MVP Acceptance Criteria

The MVP is complete when all of the following work:

-   [ ] Supabase PostgreSQL contains the 11 core tables listed in this
    document.
-   [ ] Primary keys, foreign keys, unique constraints, and basic check
    constraints are implemented.
-   [ ] The project has a seed script or repeatable SQL seed file.
-   [ ] Dashboard match information is read from the database.
-   [ ] Match detail page shows innings and scorecards from the
    database.
-   [ ] Database explorer can browse all 11 tables.
-   [ ] Authorized users can run supported SQL statements in the SQL
    workspace.
-   [ ] A successful `INSERT` creates a persistent row visible in the
    database explorer.
-   [ ] A successful `UPDATE` changes the relevant UI data after
    refresh/refetch.
-   [ ] A successful `DELETE` removes the row when the operation is
    permitted.
-   [ ] Invalid SQL and constraint violations display readable errors.
-   [ ] Realtime changes from a second session trigger relevant UI
    refreshes.
-   [ ] Ball events update or recalculate the scoreboard consistently.
-   [ ] Anonymous users cannot access unrestricted SQL execution.
-   [ ] Database credentials and secret keys remain server-side.
-   [ ] Loading, empty, and error states are handled.
-   [ ] The application works at desktop and mobile viewport sizes.

------------------------------------------------------------------------

## 14. Suggested Build Phases

### Phase 1 --- Database foundation

-   Create the Supabase project.
-   Implement the 11-table schema and constraints.
-   Add indexes and seed data.
-   Verify foreign-key relationships with test queries.

### Phase 2 --- Backend foundation

-   Configure environment variables.
-   Implement read endpoints and authorized CRUD routes.
-   Add validation and consistent error responses.
-   Implement the protected SQL execution route.

### Phase 3 --- Core frontend

-   Build dashboard, match details, teams, players, and scorecards.
-   Connect each page to real API/database data.
-   Add loading and empty states.

### Phase 4 --- Database explorer and SQL workspace

-   Build the table browser and result grid.
-   Add SQL editor, Run button, query examples, query history, and
    errors.
-   Verify `SELECT`, `INSERT`, `UPDATE`, and `DELETE` with controlled
    test data.

### Phase 5 --- Live synchronization

-   Refetch data after mutations.
-   Configure Realtime subscriptions.
-   Test simultaneous changes from two browser sessions.
-   Ensure score calculations remain consistent.

### Phase 6 --- Testing and presentation

-   Test constraints, joins, aggregates, and transactions.
-   Verify security and database permissions.
-   Prepare a short demonstration flow.
-   Polish responsive layout and motion effects.

------------------------------------------------------------------------

## 15. Recommended Demonstration Flow

1.  Open the dashboard and select a live or completed match.
2.  Show the match score, innings, batting scorecard, and bowling
    scorecard.
3.  Open the database explorer and select `teams`, `players`, or
    `ball_events`.
4.  Run a `SELECT` query with a join and display the result grid.
5.  Run an authorized `UPDATE` against a demo row and show the changed
    value in the explorer and relevant UI.
6.  Insert a demo ball event through the approved workflow and show the
    refreshed score if the scoring logic is enabled.
7.  Demonstrate a constraint violation, such as inserting a match with a
    nonexistent team ID, and show the database error.
8.  Open a second browser session and demonstrate Realtime-driven
    refresh.
9.  Run a leaderboard query for top run-scorers or wicket-takers.
10. Explain primary keys, foreign keys, junction tables, normalization,
    transactions, and how the schema preserves integrity.

------------------------------------------------------------------------

## 16. Final Architecture Decision

Use **Next.js + TypeScript + Tailwind CSS + Framer Motion** for the
interface, **Next.js Route Handlers** for the application backend, and
**Supabase PostgreSQL** as the relational database.

Keep the 11 tables from the abstract as the core schema. Implement
scoreboards and statistics using reliable queries or transactional
updates. Treat the SQL workspace as a privileged feature, not as an
unrestricted public endpoint.

The MVP's defining workflow is:

**Write SQL → execute against PostgreSQL → display actual results →
refresh dependent UI → receive Realtime changes from other sessions.**

This delivers a demonstrable DBMS project while retaining the structure
and objectives of the supplied abstract.
