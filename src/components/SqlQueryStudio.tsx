'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Terminal,
  Play,
  Copy,
  Check,
  RotateCcw,
  Download,
  Table,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  History,
  Trash2,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

export interface PrebuiltQuery {
  id: string;
  title: string;
  category: string;
  description: string;
  sql: string;
}

const DEFAULT_PREBUILT_QUERIES: PrebuiltQuery[] = [
  {
    id: 'q1',
    title: 'Query 1: All Matches with Team & Venue (JOINs)',
    category: 'DBMS Demonstration',
    description: 'Displays all match fixtures with teams, venue, city, status and winner using 4-table JOINs.',
    sql: `SELECT 
    m.match_id,
    t1.name AS team1,
    t2.name AS team2,
    v.name AS venue,
    v.city,
    m.match_date,
    m.status,
    COALESCE(w.name, 'Match Pending / Live') AS winner
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
    category: 'DBMS Demonstration',
    description: 'Displays player batting performance with runs, balls, boundaries, and strike rates.',
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
    title: 'Query 3: Top Run-Scorers (Aggregation & GROUP BY)',
    category: 'DBMS Demonstration',
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
    category: 'DBMS Demonstration',
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
    category: 'DBMS Demonstration',
    description: 'Displays fixtures, match status, winner outcome, and toss results for all recorded matches.',
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
    title: 'Query 6: Dynamic Strike Rate (CASE Expression)',
    category: 'DBMS Demonstration',
    description: 'Dynamically calculates batter strike rates on-the-fly using conditional expressions.',
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
    title: 'Table Roster & Records Count',
    category: 'Database Metadata',
    description: 'Lists all 11 core tables and row counts in your PostgreSQL database.',
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
    title: 'Live Ball-by-Ball Events Audit',
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

const KNOWN_TABLES = [
  'matches',
  'innings',
  'ball_events',
  'batting_scorecard',
  'bowling_scorecard',
  'teams',
  'players',
  'venues',
  'tournaments',
  'umpires',
  'match_umpires'
];

interface QueryResult {
  success: boolean;
  command?: string;
  rowCount?: number;
  fields?: { name: string; dataTypeID?: number }[];
  rows?: Record<string, unknown>[];
  executionTimeMs?: number;
  error?: string;
  code?: string;
  position?: string;
  detail?: string;
  hint?: string;
  executedQuery?: string;
}

interface SqlQueryStudioProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function SqlQueryStudio({ onClose, isModal = false }: SqlQueryStudioProps) {
  const [query, setQuery] = useState<string>(DEFAULT_PREBUILT_QUERIES[0].sql);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [tables, setTables] = useState<string[]>(KNOWN_TABLES);
  const [prebuiltQueries, setPrebuiltQueries] = useState<PrebuiltQuery[]>(DEFAULT_PREBUILT_QUERIES);
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('sql_query_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'templates' | 'tables'>('editor');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load tables & prebuilt queries from API
  useEffect(() => {
    fetch('/api/query')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.tables?.length) {
          setTables(data.tables);
        }
        if (data.prebuiltQueries?.length) {
          setPrebuiltQueries(data.prebuiltQueries);
        }
      })
      .catch(() => {
        // Fallback to static lists
      });
  }, []);

  const handleExecute = async (sqlToRun?: string) => {
    const targetSql = (sqlToRun ?? query).trim();
    if (!targetSql || isRunning) return;

    setIsRunning(true);
    setResult(null);

    // Save to history
    setHistory((prev) => {
      const updated = [targetSql, ...prev.filter((q) => q !== targetSql)].slice(0, 15);
      try {
        localStorage.setItem('sql_query_history', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetSql })
      });
      const data: QueryResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reach database query engine.';
      setResult({
        success: false,
        error: errorMsg,
        executedQuery: targetSql
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter or Cmd+Enter to execute
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleSelectPrebuilt = (item: PrebuiltQuery) => {
    setQuery(item.sql);
    setActiveTab('editor');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSelectTable = (tbl: string) => {
    const sql = `SELECT * FROM ${tbl} LIMIT 20;`;
    setQuery(sql);
    setActiveTab('editor');
    handleExecute(sql);
  };

  const handleExportCsv = () => {
    if (!result?.rows || result.rows.length === 0) return;
    const columns = result.fields?.map((f) => f.name) || Object.keys(result.rows[0]);
    const csvRows = [
      columns.join(','),
      ...result.rows.map((row) =>
        columns
          .map((col) => {
            const val = row[col];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `query_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJson = () => {
    if (!result?.rows) return;
    navigator.clipboard.writeText(JSON.stringify(result.rows, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col bg-[#0b1120] text-slate-100 font-sans ${
        isModal
          ? isFullScreen
            ? 'fixed inset-0 z-50 rounded-none'
            : 'fixed inset-2 sm:inset-6 md:inset-10 z-50 rounded-2xl shadow-2xl border border-slate-700/60 overflow-hidden backdrop-blur-xl'
          : 'w-full min-h-screen rounded-xl border border-slate-800'
      }`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* HEADER BAR */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0f172a] border-b border-slate-800 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                SQL Query Console
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Execute raw SQL queries, examine relational schemas, and test live database views
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Recent History Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            title="Query History"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">History</span>
            {history.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>

          {/* Full Screen Toggle (in modal mode) */}
          {isModal && (
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Close button (if modal) */}
          {isModal && onClose && (
            <button
              onClick={onClose}
              title="Close Console"
              className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TABS & QUICK CONTROLS BAR */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 bg-[#0a0f1d] border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Query Editor
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Demonstration Queries
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              6 MVP
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              activeTab === 'tables'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-indigo-400" />
            Tables ({tables.length})
          </button>
        </div>

        {/* Quick query chips */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-[550px] py-0.5">
          {prebuiltQueries.slice(0, 4).map((pq, idx) => (
            <button
              key={pq.id}
              onClick={() => handleSelectPrebuilt(pq)}
              title={pq.title}
              className="px-2.5 py-1 text-[11px] rounded-md bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60 truncate transition"
            >
              Q{idx + 1}: {pq.title.split(':')[1]?.trim() || pq.title}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* HISTORY DRAWER POPUP */}
      {/* --------------------------------------------------------------------- */}
      {showHistory && (
        <div className="px-4 sm:px-6 py-3 bg-[#0d1527] border-b border-slate-800 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-400" /> Recent Queries
            </span>
            {history.length > 0 && (
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('sql_query_history');
                }}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear History
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-slate-500 py-2">No queries executed yet in this session.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {history.map((h, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setQuery(h);
                    setShowHistory(false);
                    setActiveTab('editor');
                  }}
                  className="flex items-center justify-between p-2 rounded bg-slate-800/60 hover:bg-slate-800 cursor-pointer text-slate-300 hover:text-white transition font-mono text-[11px]"
                >
                  <span className="truncate max-w-[85%]">{h.replace(/\s+/g, ' ')}</span>
                  <span className="text-blue-400 text-[10px] uppercase font-semibold flex items-center gap-0.5">
                    Load <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MAIN BODY AREA */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* TEMPLATES TAB */}
        {activeTab === 'templates' && (
          <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Pre-built DBMS Project Queries
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click on any query below to inspect its SQL, load it into the editor, and execute it live.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {prebuiltQueries.map((pq) => (
                <div
                  key={pq.id}
                  className="bg-[#111c35] border border-slate-700/60 hover:border-blue-500/60 rounded-xl p-4 flex flex-col justify-between transition group shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        {pq.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">SQL</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition">
                      {pq.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {pq.description}
                    </p>
                    <div className="mt-3 p-2 rounded-lg bg-[#080d1a] border border-slate-800 text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto select-text">
                      <pre className="whitespace-pre-wrap">{pq.sql}</pre>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSelectPrebuilt(pq)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                      Load into Editor
                    </button>
                    <button
                      onClick={() => {
                        setQuery(pq.sql);
                        setActiveTab('editor');
                        handleExecute(pq.sql);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABLES TAB */}
        {activeTab === 'tables' && (
          <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-400" /> Database Schema (11 Tables in 3NF)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any table to generate a SELECT query and view its records.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tables.map((tbl) => (
                <div
                  key={tbl}
                  onClick={() => handleSelectTable(tbl)}
                  className="bg-[#111c35] border border-slate-700/60 hover:border-indigo-500/80 rounded-xl p-3.5 cursor-pointer transition hover:scale-[1.01] group flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Table className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition font-mono">
                        {tbl}
                      </h4>
                      <span className="text-[10px] text-slate-400">public schema</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDITOR & RESULTS TAB */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-[500px]">
            {/* LEFT / TOP: SQL QUERY INPUT */}
            <div className="lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0d1424]">
              {/* Editor Header Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#090e1a] border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span>query.sql</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-500">PostgreSQL syntax</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuery('')}
                    title="Clear editor"
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(query);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    title="Copy SQL"
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="relative flex-1 p-3 min-h-[220px] lg:min-h-0 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="-- Write any SQL query here...&#10;SELECT * FROM matches LIMIT 10;"
                  spellCheck={false}
                  className="w-full flex-1 bg-[#090d18] text-emerald-300 placeholder-slate-600 font-mono text-xs sm:text-sm p-3.5 rounded-xl border border-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none leading-relaxed"
                />
              </div>

              {/* Editor Bottom Actions */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0a0f1d] border-t border-slate-800">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Press</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                    Ctrl
                  </kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                    Enter
                  </kbd>
                  <span>to run</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExecute()}
                    disabled={isRunning || !query.trim()}
                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/25 flex items-center gap-2 transition active:scale-95"
                  >
                    {isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Executing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-white" />
                        <span>Execute Query</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT / BOTTOM: QUERY RESULTS */}
            <div className="lg:w-1/2 flex flex-col bg-[#0b1120] min-h-[300px]">
              {/* Results Status Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#090e1a] border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Results</span>
                  {result && (
                    <>
                      {result.success ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {result.rowCount ?? result.rows?.length ?? 0} {result.rowCount === 1 ? 'row' : 'rows'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Query Failed
                        </span>
                      )}

                      {result.executionTimeMs !== undefined && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {result.executionTimeMs} ms
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Export options */}
                {result?.success && result.rows && result.rows.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCsv}
                      title="Download as CSV"
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                    >
                      <Download className="w-3 h-3 text-blue-400" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={handleCopyJson}
                      title="Copy rows as JSON"
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                    >
                      <Copy className="w-3 h-3 text-emerald-400" />
                      <span>JSON</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Results View Container */}
              <div className="flex-1 overflow-auto p-4 flex flex-col justify-start">
                {/* 1. Loading State */}
                {isRunning && (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                    <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
                    <p className="text-sm font-semibold text-slate-300">Executing SQL query...</p>
                    <p className="text-xs text-slate-500 mt-1">Connecting to live PostgreSQL database</p>
                  </div>
                )}

                {/* 2. Error State */}
                {!isRunning && result && !result.success && (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-rose-300">SQL Execution Error</h4>
                        <p className="text-xs font-mono text-rose-200/90 whitespace-pre-wrap">
                          {result.error}
                        </p>
                        {result.code && (
                          <p className="text-[11px] text-rose-400 font-mono">
                            Postgres Error Code: {result.code}
                            {result.position && ` (Position: ${result.position})`}
                          </p>
                        )}
                        {result.hint && (
                          <p className="text-xs text-amber-300/90 mt-2 bg-amber-950/40 p-2 rounded border border-amber-500/30">
                            <strong>Hint:</strong> {result.hint}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Empty / Initial State */}
                {!isRunning && !result && (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
                      <Terminal className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">Ready to execute query</p>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Type your SQL query on the left or select a pre-built DBMS query, then press Execute.
                    </p>
                  </div>
                )}

                {/* 4. Success Results Table */}
                {!isRunning && result && result.success && (
                  <div className="flex-1">
                    {(!result.rows || result.rows.length === 0) ? (
                      <div className="p-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-white">Query executed successfully</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Statement completed ({result.command}). 0 rows returned.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#090e1a]">
                        <div className="overflow-x-auto max-h-[500px]">
                          <table className="w-full text-left border-collapse text-xs font-mono">
                            <thead>
                              <tr className="bg-[#10192e] text-slate-300 border-b border-slate-800 sticky top-0 z-10">
                                <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 w-12 text-center border-r border-slate-800/80">
                                  #
                                </th>
                                {(result.fields?.map((f) => f.name) || Object.keys(result.rows[0])).map((col) => (
                                  <th
                                    key={col}
                                    className="py-2.5 px-3 text-[11px] font-bold text-blue-300 tracking-wider whitespace-nowrap border-r border-slate-800/80 last:border-r-0"
                                  >
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {result.rows.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-slate-800/40 transition group even:bg-slate-900/30"
                                >
                                  <td className="py-2 px-3 text-[11px] text-slate-500 text-center border-r border-slate-800/60">
                                    {idx + 1}
                                  </td>
                                  {(result.fields?.map((f) => f.name) || Object.keys(row)).map((col) => {
                                    const val = row[col];
                                    const isNull = val === null || val === undefined;
                                    const isNumeric = typeof val === 'number' || (!isNaN(Number(val)) && val !== '');

                                    return (
                                      <td
                                        key={col}
                                        className={`py-2 px-3 whitespace-nowrap border-r border-slate-800/60 last:border-r-0 ${
                                          isNull
                                            ? 'text-slate-600 italic'
                                            : isNumeric
                                            ? 'text-amber-300/90'
                                            : 'text-slate-200'
                                        }`}
                                      >
                                        {isNull ? 'NULL' : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
