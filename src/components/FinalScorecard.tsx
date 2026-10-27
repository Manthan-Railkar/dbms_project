'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  MapPin,
  Calendar,
  ArrowLeft,
  Terminal,
  Share2,
  Printer,
  ChevronRight,
  Activity,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

export interface BatterScorecardRow {
  id: string;
  name: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
}

export interface BowlerScorecardRow {
  id: string;
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: string;
  dots?: number;
}

export interface InningsScorecardData {
  inningNo: 1 | 2;
  teamName: string;
  totalRuns: number;
  totalWickets: number;
  oversFormatted: string;
  runRate: string;
  batters: BatterScorecardRow[];
  bowlers: BowlerScorecardRow[];
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  didNotBat?: string[];
  fallOfWickets?: Array<{
    wicketNo: number;
    score: number;
    over: string;
    batterName: string;
  }>;
}

export interface FinalScorecardProps {
  tournamentName?: string;
  matchNumberText?: string;
  venueName?: string;
  matchDate?: string;
  tossResult?: string;
  innings1: InningsScorecardData;
  innings2?: InningsScorecardData | null;
  onOpenQueryStudio?: () => void;
  onReturnToLive?: () => void;
  onNewMatch?: () => void;
}

export default function FinalScorecard({
  tournamentName = 'SPIT PREMIER LEAGUE 2026',
  matchNumberText = 'MATCH 1',
  venueName = 'Wankhede Stadium, Mumbai',
  matchDate = 'October 27, 2026',
  tossResult,
  innings1,
  innings2,
  onOpenQueryStudio,
  onReturnToLive,
  onNewMatch
}: FinalScorecardProps) {
  const [activeTab, setActiveTab] = useState<'inn1' | 'inn2' | 'stats'>(
    innings2 ? 'inn2' : 'inn1'
  );
  const [copied, setCopied] = useState(false);

  // Determine winner and margin
  const inn1Score = innings1.totalRuns;
  const inn2Score = innings2?.totalRuns ?? 0;
  const inn2Wickets = innings2?.totalWickets ?? 0;

  let resultHeading = '';
  let winnerTeamName = '';

  if (!innings2) {
    resultHeading = `${innings1.teamName} completed 1st Innings: ${innings1.totalRuns}/${innings1.totalWickets}`;
    winnerTeamName = innings1.teamName;
  } else if (inn2Score > inn1Score) {
    const wicketsRemaining = Math.max(1, 10 - inn2Wickets);
    resultHeading = `${innings2.teamName} won by ${wicketsRemaining} wicket${wicketsRemaining > 1 ? 's' : ''}`;
    winnerTeamName = innings2.teamName;
  } else if (inn1Score > inn2Score) {
    const runDiff = inn1Score - inn2Score;
    resultHeading = `${innings1.teamName} won by ${runDiff} run${runDiff > 1 ? 's' : ''}`;
    winnerTeamName = innings1.teamName;
  } else {
    resultHeading = 'Match Tied (Scores Level)';
    winnerTeamName = 'Tied';
  }

  // Find Player of the Match candidate (highest runs or most wickets across both innings)
  const allBatters = [
    ...innings1.batters.map((b) => ({ ...b, team: innings1.teamName })),
    ...(innings2 ? innings2.batters.map((b) => ({ ...b, team: innings2.teamName })) : [])
  ];
  const allBowlers = [
    ...innings1.bowlers.map((bw) => ({ ...bw, team: innings1.teamName === innings1.teamName ? (innings2?.teamName || '') : innings1.teamName })),
    ...(innings2 ? innings2.bowlers.map((bw) => ({ ...bw, team: innings1.teamName })) : [])
  ];

  const topRunScorer = allBatters.reduce(
    (max, b) => (b.runs > (max?.runs || 0) ? b : max),
    allBatters[0] || null
  );
  const topWicketTaker = allBowlers.reduce(
    (max, bw) => (bw.wickets > (max?.wickets || 0) ? bw : max),
    allBowlers[0] || null
  );

  const currentInningsData = activeTab === 'inn1' ? innings1 : (innings2 || innings1);

  const handleShareSummary = () => {
    const text = `🏆 ${tournamentName} • ${matchNumberText}\nResult: ${resultHeading}\n${innings1.teamName}: ${innings1.totalRuns}/${innings1.totalWickets} (${innings1.oversFormatted} ov)\n${innings2 ? `${innings2.teamName}: ${innings2.totalRuns}/${innings2.totalWickets} (${innings2.oversFormatted} ov)` : ''}\nVenue: ${venueName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="w-full max-w-[1040px] mx-auto space-y-5 animate-in fade-in duration-300 select-none font-sans pb-16">
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP RESULT & BROADCAST PRESENTATION BANNER */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-[#070e1e] text-white">
        {/* Subtle backdrop overlay */}
        <div
          className="absolute inset-0 bg-cover bg-[position:center_top] opacity-40 bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url('/stadium-bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070e1e]/90 via-[#070e1e]/80 to-[#070e1e]/95 pointer-events-none" />

        <div className="relative z-10 p-5 sm:p-7 space-y-5">
          {/* Top Bar: Tournament Title, Match Pill & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                <Trophy className="w-3.5 h-3.5" />
                <span>Match Concluded</span>
              </span>
              <span className="text-xs font-bold text-slate-300 tracking-wide">
                {tournamentName} &bull; {matchNumberText}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareSummary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                title="Copy match summary"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied' : 'Share'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                title="Print scorecard"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print</span>
              </button>

              {onOpenQueryStudio && (
                <button
                  onClick={onOpenQueryStudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 border border-blue-400/30 transition cursor-pointer"
                  title="Query database tables"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>SQL Query</span>
                </button>
              )}
            </div>
          </div>

          {/* Winner Headline Proclamation */}
          <div className="text-center sm:text-left py-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span>{resultHeading}</span>
              <span className="text-amber-400 animate-bounce">🏆</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 mt-2 font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {venueName}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {matchDate}
              </span>
              {tossResult && (
                <>
                  <span>&bull;</span>
                  <span className="text-slate-300">{tossResult}</span>
                </>
              )}
            </div>
          </div>

          {/* Side-by-Side Team Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Team 1 Score Summary */}
            <div
              className={`p-4 rounded-2xl border transition ${
                winnerTeamName === innings1.teamName
                  ? 'bg-gradient-to-br from-[#0c1e3d] to-[#09152b] border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'bg-[#0d1627] border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center font-bold text-blue-300 text-xs">
                    {innings1.teamName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                      {innings1.teamName}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">
                      1st Innings
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none font-mono">
                    {innings1.totalRuns}/{innings1.totalWickets}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-1">
                    {innings1.oversFormatted} ov &bull; CRR {innings1.runRate}
                  </div>
                </div>
              </div>
            </div>

            {/* Team 2 Score Summary */}
            {innings2 ? (
              <div
                className={`p-4 rounded-2xl border transition ${
                  winnerTeamName === innings2.teamName
                    ? 'bg-gradient-to-br from-[#0c1e3d] to-[#09152b] border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-[#0d1627] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-600/30 border border-rose-400/40 flex items-center justify-center font-bold text-rose-300 text-xs">
                      {innings2.teamName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                        {innings2.teamName}
                      </h3>
                      <span className="text-[10px] font-semibold uppercase text-slate-400">
                        2nd Innings
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none font-mono">
                      {innings2.totalRuns}/{innings2.totalWickets}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-400 mt-1">
                      {innings2.oversFormatted} ov &bull; CRR {innings2.runRate}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-800 bg-[#0a1120] flex items-center justify-center text-slate-500 text-xs font-semibold">
                2nd Innings not recorded yet
              </div>
            )}
          </div>

          {/* Key Performers Spotlight Row */}
          {(topRunScorer || topWicketTaker) && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-3">
                {topRunScorer && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-amber-400">Top Batter</span>
                    <span className="font-bold text-white">{topRunScorer.name}</span>
                    <span className="text-amber-300 font-mono font-semibold">
                      {topRunScorer.runs} ({topRunScorer.balls})
                    </span>
                  </div>
                )}
                {topWicketTaker && topWicketTaker.wickets > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-blue-400">Top Bowler</span>
                    <span className="font-bold text-white">{topWicketTaker.name}</span>
                    <span className="text-blue-300 font-mono font-semibold">
                      {topWicketTaker.wickets}/{topWicketTaker.runs} ({topWicketTaker.overs})
                    </span>
                  </div>
                )}
              </div>

              {onReturnToLive && (
                <button
                  onClick={onReturnToLive}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <span>Review Live Scorer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. SCORECARD NAVIGATION TABS */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inn1')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'inn1'
                ? 'bg-[#0066FF] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            1st Innings &bull; {innings1.teamName} ({innings1.totalRuns}/{innings1.totalWickets})
          </button>

          {innings2 && (
            <button
              onClick={() => setActiveTab('inn2')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'inn2'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              2nd Innings &bull; {innings2.teamName} ({innings2.totalRuns}/{innings2.totalWickets})
            </button>
          )}

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#0066FF] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Match Comparison
          </button>
        </div>

        {onNewMatch && (
          <button
            onClick={onNewMatch}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Match</span>
          </button>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. INNINGS SCORECARD DETAIL VIEW (Batting + Bowling) */}
      {/* --------------------------------------------------------------------- */}
      {(activeTab === 'inn1' || activeTab === 'inn2') && (
        <div className="space-y-4">
          {/* Batting Scorecard Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">
                  {currentInningsData.teamName} Batting Scorecard
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600">
                {currentInningsData.totalRuns}/{currentInningsData.totalWickets} ({currentInningsData.oversFormatted} Ov)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4 sm:px-6">Batter</th>
                    <th className="py-3 px-3">Dismissal</th>
                    <th className="py-3 px-3 text-right font-black text-slate-700">R</th>
                    <th className="py-3 px-3 text-right">B</th>
                    <th className="py-3 px-3 text-right">4s</th>
                    <th className="py-3 px-3 text-right">6s</th>
                    <th className="py-3 px-4 sm:px-6 text-right font-mono">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentInningsData.batters.map((b) => {
                    const isNotOut = b.dismissal.toLowerCase().includes('not out');
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 sm:px-6 font-bold text-slate-900 flex items-center gap-2">
                          <span>{b.name}</span>
                          {isNotOut && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">
                              *
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {isNotOut ? (
                            <span className="font-semibold text-emerald-600">not out</span>
                          ) : (
                            <span>{b.dismissal}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900 text-sm font-mono">
                          {b.runs}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-mono">
                          {b.balls}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-mono">
                          {b.fours}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-mono">
                          {b.sixes}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right text-slate-700 font-semibold font-mono">
                          {b.strikeRate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Extras & Total Summary Lines */}
            <div className="bg-slate-50/60 border-t border-slate-200 px-5 py-3 space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600">Extras</span>
                <span className="font-mono font-bold text-slate-800">
                  {currentInningsData.extras.total}{' '}
                  <span className="font-normal text-slate-500 text-[11px]">
                    (w {currentInningsData.extras.wides}, nb {currentInningsData.extras.noBalls}, b {currentInningsData.extras.byes}, lb {currentInningsData.extras.legByes})
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-bold">
                <span className="text-slate-800">Total Score</span>
                <span className="font-mono text-sm text-slate-900">
                  {currentInningsData.totalRuns}/{currentInningsData.totalWickets} ({currentInningsData.oversFormatted} Overs, RR: {currentInningsData.runRate})
                </span>
              </div>
            </div>

            {/* Did Not Bat List */}
            {currentInningsData.didNotBat && currentInningsData.didNotBat.length > 0 && (
              <div className="px-5 py-2.5 bg-white border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500 text-[11px] uppercase mr-1">Yet to Bat:</span>
                {currentInningsData.didNotBat.map((p, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            {/* Fall of Wickets Timeline */}
            {currentInningsData.fallOfWickets && currentInningsData.fallOfWickets.length > 0 && (
              <div className="px-5 py-3 bg-slate-50/40 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-500 text-[11px] uppercase block mb-1.5">
                  Fall of Wickets
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {currentInningsData.fallOfWickets.map((fow) => (
                    <span
                      key={fow.wicketNo}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs"
                    >
                      <strong>{fow.wicketNo}-{fow.score}</strong> ({fow.batterName}, {fow.over} ov)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bowling Scorecard Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">
                  Bowling Figures
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200">
                    <th className="py-3 px-4 sm:px-6">Bowler</th>
                    <th className="py-3 px-3 text-right">O</th>
                    <th className="py-3 px-3 text-right">M</th>
                    <th className="py-3 px-3 text-right">R</th>
                    <th className="py-3 px-3 text-right font-black text-slate-700">W</th>
                    <th className="py-3 px-4 sm:px-6 text-right font-mono">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentInningsData.bowlers.map((bw) => (
                    <tr key={bw.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 sm:px-6 font-bold text-slate-900">
                        {bw.name}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {bw.overs}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {bw.maidens}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 font-semibold">
                        {bw.runs}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm font-mono">
                        {bw.wickets}
                      </td>
                      <td className="py-3 px-4 sm:px-6 text-right font-mono text-slate-700 font-semibold">
                        {bw.economy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. MATCH COMPARISON & KEY STATS TAB */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Match Head-to-Head Comparison
            </h3>
            <span className="text-xs text-slate-500 font-medium">Both Innings Analysis</span>
          </div>

          <div className="space-y-5">
            {/* Run Rate comparison bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>{innings1.teamName} ({innings1.runRate} rpo)</span>
                <span className="uppercase text-[11px] text-slate-400">Run Rate</span>
                <span>{innings2?.teamName || 'Team 2'} ({innings2?.runRate || '0.00'} rpo)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full transition-all"
                  style={{
                    width: `${
                      (parseFloat(innings1.runRate) /
                        (parseFloat(innings1.runRate) + parseFloat(innings2?.runRate || '0.01'))) *
                      100
                    }%`
                  }}
                />
                <div
                  className="bg-red-500 h-full transition-all"
                  style={{
                    width: `${
                      (parseFloat(innings2?.runRate || '0.01') /
                        (parseFloat(innings1.runRate) + parseFloat(innings2?.runRate || '0.01'))) *
                      100
                    }%`
                  }}
                />
              </div>
            </div>

            {/* Total Boundaries comparison */}
            {(() => {
              const inn1Fours = innings1.batters.reduce((acc, b) => acc + b.fours, 0);
              const inn1Sixes = innings1.batters.reduce((acc, b) => acc + b.sixes, 0);
              const inn2Fours = innings2?.batters.reduce((acc, b) => acc + b.fours, 0) || 0;
              const inn2Sixes = innings2?.batters.reduce((acc, b) => acc + b.sixes, 0) || 0;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">4s (Fours)</span>
                    <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
                      {inn1Fours} vs {inn2Fours}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">6s (Sixes)</span>
                    <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
                      {inn1Sixes} vs {inn2Sixes}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Extras Conceded</span>
                    <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
                      {innings1.extras.total} vs {innings2?.extras.total ?? 0}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Wickets Lost</span>
                    <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
                      {innings1.totalWickets} vs {innings2?.totalWickets ?? 0}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. BOTTOM QUICK ACTIONS */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 shadow-2xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Match Setup Home</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {onOpenQueryStudio && (
            <button
              onClick={onOpenQueryStudio}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Verify Database Queries</span>
            </button>
          )}

          {onNewMatch && (
            <button
              onClick={onNewMatch}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Start New Match</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
