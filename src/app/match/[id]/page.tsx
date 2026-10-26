'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  RotateCcw,
  Flag,
  ChevronRight,
  ChevronDown,
  Play,
  ArrowLeftRight,
  Check,
  X,
  Users,
  BarChart3,
  Flame,
  Trophy,
  ArrowLeft,
  Sparkles,
  Shield,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '@/lib/supabase';

// Types
export interface BatterScore {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isStriker: boolean;
  isOut?: boolean;
}

export interface BowlerScore {
  id: string;
  name: string;
  overs: string;
  legalBalls: number;
  maidens: number;
  runs: number;
  wickets: number;
}

export interface BallHistoryItem {
  ballId: string;
  ballText: string;
  runs: number;
  isExtra: boolean;
  extraType?: 'WD' | 'NB' | 'B' | 'LB';
  isWicket: boolean;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  overNo: number;
  ballInOver: number;
  previousSnapshot: {
    totalRuns: number;
    totalWickets: number;
    legalBalls: number;
    striker: BatterScore;
    nonStriker: BatterScore;
    bowler: BowlerScore;
    currentOverBalls: string[];
    isOverComplete: boolean;
  };
}

export default function MatchLivePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f0f4f9] flex items-center justify-center font-bold text-slate-500">
          Loading live match...
        </div>
      }
    >
      <MatchLiveContent />
    </Suspense>
  );
}

function MatchLiveContent() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const matchId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '5';

  // Match Information
  const [tournamentName, setTournamentName] = useState('SPIT PREMIER LEAGUE 2026');
  const [matchNumberText, setMatchNumberText] = useState(`MATCH ${matchId === '5' ? '5' : matchId}`);
  const [battingTeamName, setBattingTeamName] = useState('Tech Titans');
  const [bowlingTeamName, setBowlingTeamName] = useState('Code Strikers');
  const [totalOvers, setTotalOvers] = useState(20);
  const [inningsNo, setInningsNo] = useState(1);
  const [spectatorCount, setSpectatorCount] = useState(128);
  const [isLiveSynced, setIsLiveSynced] = useState(true);

  // Score State (Default matches reference image: 84/2 at 9.3 ov)
  const [totalRuns, setTotalRuns] = useState(84);
  const [totalWickets, setTotalWickets] = useState(2);
  const [legalBalls, setLegalBalls] = useState(57); // 9.3 overs = 9 * 6 + 3 = 57 balls

  // Players on crease & Bowler
  const [striker, setStriker] = useState<BatterScore>({
    id: 'p-aarav',
    name: 'Aarav Mehta',
    runs: 34,
    balls: 21,
    fours: 4,
    sixes: 1,
    isStriker: true
  });

  const [nonStriker, setNonStriker] = useState<BatterScore>({
    id: 'p-rohan',
    name: 'Rohan Sharma',
    runs: 18,
    balls: 14,
    fours: 2,
    sixes: 0,
    isStriker: false
  });

  const [bowler, setBowler] = useState<BowlerScore>({
    id: 'p-kunal',
    name: 'Kunal Verma',
    overs: '1.3',
    legalBalls: 9,
    maidens: 0,
    runs: 12,
    wickets: 1
  });

  // Available Players for batting team (bench / yet to bat)
  const [battingSquad, setBattingSquad] = useState<Array<{ id: string; name: string; role: string }>>([
    { id: 'p-rohit', name: 'Rohit Desai', role: 'Batter' },
    { id: 'p-aditya', name: 'Aditya Patil', role: 'All-rounder' },
    { id: 'p-tanmay', name: 'Tanmay Joshi', role: 'All-rounder' },
    { id: 'p-shivam', name: 'Shivam Kadam', role: 'Bowler' },
    { id: 'p-varun', name: 'Varun Nair', role: 'Bowler' },
    { id: 'p-mohit', name: 'Mohit Rao', role: 'Bowler' }
  ]);

  // Available Bowling Options
  const [bowlingSquad, setBowlingSquad] = useState<Array<{ id: string; name: string; role: string }>>([
    { id: 'p-kunal', name: 'Kunal Verma', role: 'Bowler' },
    { id: 'p-yash', name: 'Yash Vardhan', role: 'Bowler' },
    { id: 'p-vikram', name: 'Vikram Seth', role: 'All-rounder' },
    { id: 'p-hardik', name: 'Hardik Shah', role: 'Bowler' },
    { id: 'p-chirag', name: 'Chirag Shinde', role: 'Bowler' }
  ]);

  // Current Over Ball slots (shows up to 6 balls, defaults to [1, 0, 4] for 9.3 ov)
  const [currentOverBalls, setCurrentOverBalls] = useState<string[]>(['1', '0', '4']);
  const [fullBallHistory, setFullBallHistory] = useState<BallHistoryItem[]>([]);

  // Controls UI state
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(false);

  // Wicket Details State
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [dismissalType, setDismissalType] = useState<string>('Bowled');
  const [selectedNextBatterId, setSelectedNextBatterId] = useState<string>('p-rohit');
  const [runOutBatter, setRunOutBatter] = useState<'striker' | 'nonStriker'>('striker');
  const [runOutRunsCompleted, setRunOutRunsCompleted] = useState<number>(0);

  // Extra (WD / NB / Byes) Modal State
  const [extraModalType, setExtraModalType] = useState<'WD' | 'NB' | 'Bye' | 'Leg-Bye' | null>(null);
  const [selectedExtraRuns, setSelectedExtraRuns] = useState<number>(0);
  const [nbRunsSource, setNbRunsSource] = useState<'bat' | 'byes'>('bat');

  // Over Management
  const [isOverComplete, setIsOverComplete] = useState(false);
  const [selectedNextBowlerId, setSelectedNextBowlerId] = useState<string>('p-yash');

  // Innings Management
  const [isEndInningsModalOpen, setIsEndInningsModalOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Load setup data if coming from wizard
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cricket_match_${matchId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tournament) setTournamentName(parsed.tournament);
        if (parsed.team1 && parsed.team2) {
          setBattingTeamName(parsed.battingTeamName || parsed.team1.name);
          setBowlingTeamName(parsed.bowlingTeamName || parsed.team2.name);
        }
        if (parsed.totalOvers) setTotalOvers(parsed.totalOvers);
        if (parsed.striker) setStriker((prev) => ({ ...prev, name: parsed.striker.name, id: parsed.striker.id }));
        if (parsed.nonStriker) setNonStriker((prev) => ({ ...prev, name: parsed.nonStriker.name, id: parsed.nonStriker.id }));
        if (parsed.bowler) setBowler((prev) => ({ ...prev, name: parsed.bowler.name, id: parsed.bowler.id }));
        if (parsed.battingSquad && parsed.battingSquad.length > 0) {
          setBattingSquad(parsed.battingSquad);
          setSelectedNextBatterId(parsed.battingSquad[0].id);
        }
        if (parsed.bowlingSquad && parsed.bowlingSquad.length > 0) {
          setBowlingSquad(parsed.bowlingSquad);
          const next = parsed.bowlingSquad.find((b: any) => b.id !== parsed.bowler?.id) || parsed.bowlingSquad[0];
          setSelectedNextBowlerId(next.id);
        }
      }
    } catch {
      // Fallback to default
    }
  }, [matchId]);

  // Minor spectator fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setSpectatorCount((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Flash notification helper
  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Calculations
  const oversFormatted = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  const crr = legalBalls > 0 ? ((totalRuns / legalBalls) * 6).toFixed(2) : '0.00';
  const projectedScore = legalBalls > 0 ? Math.round((totalRuns / legalBalls) * (totalOvers * 6)) : totalRuns;

  // Current Over Stats
  const legalBallsInCurrentOver = currentOverBalls.filter(
    (b) => !b.toLowerCase().includes('wd') && !b.toLowerCase().includes('nb')
  ).length;

  const runsInCurrentOver = currentOverBalls.reduce((acc, curr) => {
    if (curr === 'W') return acc;
    if (curr.includes('wd')) {
      const match = curr.match(/\d+/);
      return acc + (match ? parseInt(match[0], 10) : 1);
    }
    if (curr.includes('nb')) {
      const match = curr.match(/\d+/);
      return acc + (match ? parseInt(match[0], 10) : 1);
    }
    const n = parseInt(curr, 10);
    return isNaN(n) ? acc : acc + n;
  }, 0);

  const wicketsInCurrentOver = currentOverBalls.filter((b) => b === 'W' || b.startsWith('W')).length;

  // Snapshot generator for undo
  const createSnapshot = () => ({
    totalRuns,
    totalWickets,
    legalBalls,
    striker: { ...striker },
    nonStriker: { ...nonStriker },
    bowler: { ...bowler },
    currentOverBalls: [...currentOverBalls],
    isOverComplete
  });

  // Record a standard run ball (0, 1, 2, 3, 4, 6)
  const handleScoreRuns = (runs: number) => {
    const snapshot = createSnapshot();
    const ballText = runs.toString();

    const newTotalRuns = totalRuns + runs;
    const newLegalBalls = legalBalls + 1;
    const newCurrentOverBalls = [...currentOverBalls, ballText];

    // Update striker
    const newStriker = {
      ...striker,
      runs: striker.runs + runs,
      balls: striker.balls + 1,
      fours: runs === 4 ? striker.fours + 1 : striker.fours,
      sixes: runs === 6 ? striker.sixes + 1 : striker.sixes
    };

    // Update bowler
    const bowlerLegal = bowler.legalBalls + 1;
    const bowlerOvers = `${Math.floor(bowlerLegal / 6)}.${bowlerLegal % 6}`;
    const newBowler = {
      ...bowler,
      legalBalls: bowlerLegal,
      overs: bowlerOvers,
      runs: bowler.runs + runs
    };

    // Save to undo history
    const historyItem: BallHistoryItem = {
      ballId: `b-${Date.now()}`,
      ballText,
      runs,
      isExtra: false,
      isWicket: false,
      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler.id,
      overNo: Math.floor(legalBalls / 6) + 1,
      ballInOver: (legalBalls % 6) + 1,
      previousSnapshot: snapshot
    };
    setFullBallHistory((prev) => [...prev, historyItem]);

    // Check boundary fanfare
    if (runs === 4 || runs === 6) {
      try {
        confetti({
          particleCount: runs === 6 ? 90 : 50,
          spread: runs === 6 ? 70 : 45,
          origin: { y: 0.7 }
        });
      } catch {}
    }

    setTotalRuns(newTotalRuns);
    setLegalBalls(newLegalBalls);
    setCurrentOverBalls(newCurrentOverBalls);
    setBowler(newBowler);

    // Strike rotation logic
    const legalBallsThisOver = newCurrentOverBalls.filter(
      (b) => !b.toLowerCase().includes('wd') && !b.toLowerCase().includes('nb')
    ).length;

    if (legalBallsThisOver >= 6) {
      setIsOverComplete(true);
      // Even runs on ball 6 rotates strike for the new over; odd runs stays
      if (runs % 2 === 0) {
        setStriker({ ...nonStriker, isStriker: true });
        setNonStriker({ ...newStriker, isStriker: false });
      } else {
        setStriker({ ...newStriker, isStriker: true });
        setNonStriker({ ...nonStriker, isStriker: false });
      }
    } else {
      // Mid-over rotation on odd runs (1, 3)
      if (runs % 2 !== 0) {
        setStriker({ ...nonStriker, isStriker: true });
        setNonStriker({ ...newStriker, isStriker: false });
      } else {
        setStriker(newStriker);
      }
    }

    syncBallToSupabase(ballText, runs, false, false);
  };

  // Open Extra configuration modal
  const handleOpenExtraModal = (type: 'WD' | 'NB' | 'Bye' | 'Leg-Bye') => {
    setExtraModalType(type);
    setSelectedExtraRuns(0);
    setNbRunsSource('bat');
  };

  // Confirm Extra (WD / NB / Bye / Leg-Bye with additional runs)
  const handleConfirmExtra = () => {
    if (!extraModalType) return;
    const snapshot = createSnapshot();

    let extraName = extraModalType;
    let additionalRuns = selectedExtraRuns;
    let totalBallRuns = 0;
    let isLegalBall = false;
    let ballDisplay = '';
    let rotateStrike = false;

    let updatedStriker = { ...striker };
    let updatedNonStriker = { ...nonStriker };
    let updatedBowler = { ...bowler };

    if (extraName === 'WD') {
      // Wide: 1 penalty run + additional running/bye runs
      totalBallRuns = 1 + additionalRuns;
      isLegalBall = false;
      ballDisplay = additionalRuns > 0 ? `${1 + additionalRuns}wd` : 'WD';
      // Wide runs are charged to bowler as extras
      updatedBowler.runs += totalBallRuns;

      // In Wide, runs are extras (not credited to batter). If odd running runs, strike rotates!
      if (additionalRuns % 2 !== 0) {
        rotateStrike = true;
      }
      showNotification(`Wide ball recorded (+${totalBallRuns} runs)`);
    } else if (extraName === 'NB') {
      // No-Ball: 1 penalty run + runs off bat or byes
      totalBallRuns = 1 + additionalRuns;
      isLegalBall = false;
      ballDisplay = additionalRuns > 0 ? `${1 + additionalRuns}nb` : 'NB';

      updatedBowler.runs += totalBallRuns;

      if (nbRunsSource === 'bat') {
        // Runs credited to batsman
        updatedStriker.runs += additionalRuns;
        updatedStriker.balls += 1;
        if (additionalRuns === 4) updatedStriker.fours += 1;
        if (additionalRuns === 6) updatedStriker.sixes += 1;
      }

      // Odd runs rotate strike
      if (additionalRuns % 2 !== 0) {
        rotateStrike = true;
      }
      showNotification(`No-ball recorded (+${totalBallRuns} runs${additionalRuns > 0 ? `, ${additionalRuns} to ${striker.name}` : ''})`);
    } else {
      // Bye or Leg-Bye (Legal ball)
      totalBallRuns = Math.max(1, additionalRuns);
      isLegalBall = true;
      ballDisplay = extraName === 'Bye' ? `${totalBallRuns}B` : `${totalBallRuns}LB`;

      // Bowler conceded does NOT include byes/leg-byes
      const bowlerLegal = bowler.legalBalls + 1;
      const bowlerOvers = `${Math.floor(bowlerLegal / 6)}.${bowlerLegal % 6}`;
      updatedBowler.legalBalls = bowlerLegal;
      updatedBowler.overs = bowlerOvers;

      // Batter ball count increments
      updatedStriker.balls += 1;

      // Odd byes rotate strike
      if (totalBallRuns % 2 !== 0) {
        rotateStrike = true;
      }
      showNotification(`${extraName} recorded (+${totalBallRuns} runs)`);
    }

    const newTotalRuns = totalRuns + totalBallRuns;
    const newLegalBalls = isLegalBall ? legalBalls + 1 : legalBalls;
    const newCurrentOverBalls = [...currentOverBalls, ballDisplay];

    // Undo History item
    const historyItem: BallHistoryItem = {
      ballId: `b-${Date.now()}`,
      ballText: ballDisplay,
      runs: totalBallRuns,
      isExtra: true,
      extraType: extraName as any,
      isWicket: false,
      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler.id,
      overNo: Math.floor(legalBalls / 6) + 1,
      ballInOver: (legalBalls % 6) + (isLegalBall ? 1 : 0),
      previousSnapshot: snapshot
    };
    setFullBallHistory((prev) => [...prev, historyItem]);

    setTotalRuns(newTotalRuns);
    setLegalBalls(newLegalBalls);
    setCurrentOverBalls(newCurrentOverBalls);
    setBowler(updatedBowler);

    // Check if over finished (only if legal ball)
    if (isLegalBall) {
      const legalBallsThisOver = newCurrentOverBalls.filter(
        (b) => !b.toLowerCase().includes('wd') && !b.toLowerCase().includes('nb')
      ).length;

      if (legalBallsThisOver >= 6) {
        setIsOverComplete(true);
        // Over end logic
        if (!rotateStrike) {
          setStriker({ ...updatedNonStriker, isStriker: true });
          setNonStriker({ ...updatedStriker, isStriker: false });
        } else {
          setStriker({ ...updatedStriker, isStriker: true });
          setNonStriker({ ...updatedNonStriker, isStriker: false });
        }
      } else {
        if (rotateStrike) {
          setStriker({ ...updatedNonStriker, isStriker: true });
          setNonStriker({ ...updatedStriker, isStriker: false });
        } else {
          setStriker(updatedStriker);
          setNonStriker(updatedNonStriker);
        }
      }
    } else {
      if (rotateStrike) {
        setStriker({ ...updatedNonStriker, isStriker: true });
        setNonStriker({ ...updatedStriker, isStriker: false });
      } else {
        setStriker(updatedStriker);
        setNonStriker(updatedNonStriker);
      }
    }

    setExtraModalType(null);
    syncBallToSupabase(ballDisplay, totalBallRuns, true, false);
  };

  // Open Wicket Modal
  const handleOpenWicket = () => {
    setIsWicketModalOpen(true);
  };

  // Confirm Wicket (supports Bowled, Caught, LBW, Stumped, Hit Wicket, and Run Out)
  const handleConfirmWicket = () => {
    const snapshot = createSnapshot();
    const isRunOut = dismissalType === 'Run Out';
    const ballText = isRunOut && runOutRunsCompleted > 0 ? `W+${runOutRunsCompleted}` : 'W';

    const newTotalWickets = totalWickets + 1;
    const newLegalBalls = legalBalls + 1;
    const newCurrentOverBalls = [...currentOverBalls, ballText];
    const newTotalRuns = totalRuns + (isRunOut ? runOutRunsCompleted : 0);

    // Bowler stats (Bowler does NOT get credit for run out)
    const bowlerLegal = bowler.legalBalls + 1;
    const bowlerOvers = `${Math.floor(bowlerLegal / 6)}.${bowlerLegal % 6}`;
    const newBowler = {
      ...bowler,
      legalBalls: bowlerLegal,
      overs: bowlerOvers,
      runs: bowler.runs + (isRunOut ? runOutRunsCompleted : 0),
      wickets: isRunOut ? bowler.wickets : bowler.wickets + 1
    };

    // Pick next incoming batter
    const nextBatter = battingSquad.find((p) => p.id === selectedNextBatterId) || {
      id: `p-${Date.now()}`,
      name: 'Next Batter',
      role: 'Batter'
    };

    let updatedStriker: BatterScore;
    let updatedNonStriker: BatterScore;

    if (isRunOut && runOutBatter === 'nonStriker') {
      // Non-striker is out!
      const dismissedName = nonStriker.name;
      updatedStriker = {
        ...striker,
        runs: striker.runs + runOutRunsCompleted,
        balls: striker.balls + 1
      };
      updatedNonStriker = {
        id: nextBatter.id,
        name: nextBatter.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isStriker: false
      };
      showNotification(`Wicket! ${dismissedName} Run Out!`);
    } else {
      // Striker is out (Standard or Run Out)
      const dismissedName = striker.name;
      updatedStriker = {
        id: nextBatter.id,
        name: nextBatter.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isStriker: true
      };
      updatedNonStriker = { ...nonStriker };
      showNotification(`Wicket! ${dismissedName} dismissed (${dismissalType}).`);
    }

    // Remove chosen next batter from available bench
    setBattingSquad((prev) => prev.filter((p) => p.id !== nextBatter.id));

    // Save undo history
    const historyItem: BallHistoryItem = {
      ballId: `b-${Date.now()}`,
      ballText,
      runs: isRunOut ? runOutRunsCompleted : 0,
      isExtra: false,
      isWicket: true,
      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler.id,
      overNo: Math.floor(legalBalls / 6) + 1,
      ballInOver: (legalBalls % 6) + 1,
      previousSnapshot: snapshot
    };
    setFullBallHistory((prev) => [...prev, historyItem]);

    setTotalRuns(newTotalRuns);
    setTotalWickets(newTotalWickets);
    setLegalBalls(newLegalBalls);
    setCurrentOverBalls(newCurrentOverBalls);
    setBowler(newBowler);
    setStriker(updatedStriker);
    setNonStriker(updatedNonStriker);
    setIsWicketModalOpen(false);

    // Over completion check
    const legalBallsThisOver = newCurrentOverBalls.filter(
      (b) => !b.toLowerCase().includes('wd') && !b.toLowerCase().includes('nb')
    ).length;

    if (legalBallsThisOver >= 6) {
      setIsOverComplete(true);
    }

    syncBallToSupabase(ballText, isRunOut ? runOutRunsCompleted : 0, false, true);
  };

  // Undo Last Ball
  const handleUndoLastBall = () => {
    if (fullBallHistory.length === 0) {
      showNotification('No previous balls to undo in this session.');
      return;
    }

    const lastItem = fullBallHistory[fullBallHistory.length - 1];
    const prev = lastItem.previousSnapshot;

    setTotalRuns(prev.totalRuns);
    setTotalWickets(prev.totalWickets);
    setLegalBalls(prev.legalBalls);
    setStriker(prev.striker);
    setNonStriker(prev.nonStriker);
    setBowler(prev.bowler);
    setCurrentOverBalls(prev.currentOverBalls);
    setIsOverComplete(prev.isOverComplete);

    setFullBallHistory((items) => items.slice(0, -1));
    showNotification(`Reverted last ball (${lastItem.ballText}).`);
  };

  // Swap Strike manually
  const handleSwapStrike = () => {
    const s = { ...striker, isStriker: false };
    const ns = { ...nonStriker, isStriker: true };
    setStriker(ns);
    setNonStriker(s);
    showNotification(`Strike swapped: ${ns.name} is now on strike.`);
  };

  // Start Next Over
  const handleStartNextOver = () => {
    const chosenBowler = bowlingSquad.find((b) => b.id === selectedNextBowlerId) || {
      id: selectedNextBowlerId,
      name: 'Next Bowler',
      role: 'Bowler'
    };

    setBowler({
      id: chosenBowler.id,
      name: chosenBowler.name,
      overs: '0.0',
      legalBalls: 0,
      maidens: 0,
      runs: 0,
      wickets: 0
    });

    setCurrentOverBalls([]);
    setIsOverComplete(false);
    showNotification(`Over ${Math.floor(legalBalls / 6) + 1} started! Bowler: ${chosenBowler.name}`);
  };

  // Supabase background sync
  const syncBallToSupabase = async (
    ballText: string,
    runs: number,
    isExtra: boolean,
    isWicket: boolean
  ) => {
    try {
      setIsLiveSynced(true);
      await supabase.from('ball_events').insert([
        {
          inning_id: 1,
          over_no: Math.floor(legalBalls / 6) + 1,
          ball_no: (legalBalls % 6) + 1,
          runs_batter: isExtra ? 0 : runs,
          runs_extras: isExtra ? runs : 0,
          extra_type: isExtra ? ballText : null,
          is_wicket: isWicket
        }
      ]);
    } catch {
      // Supabase table insertion fallback
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    if (!keyboardShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWicketModalOpen || isEndInningsModalOpen || extraModalType !== null) return;

      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'select') return;

      if (e.key === '0') handleScoreRuns(0);
      else if (e.key === '1') handleScoreRuns(1);
      else if (e.key === '2') handleScoreRuns(2);
      else if (e.key === '3') handleScoreRuns(3);
      else if (e.key === '4') handleScoreRuns(4);
      else if (e.key === '6') handleScoreRuns(6);
      else if (e.key.toLowerCase() === 'w') handleOpenWicket();
      else if (e.key.toLowerCase() === 'd') handleOpenExtraModal('WD');
      else if (e.key.toLowerCase() === 'n') handleOpenExtraModal('NB');
      else if (e.key.toLowerCase() === 's') handleSwapStrike();
      else if (e.key.toLowerCase() === 'u') handleUndoLastBall();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    keyboardShortcutsEnabled,
    isWicketModalOpen,
    isEndInningsModalOpen,
    extraModalType,
    striker,
    nonStriker,
    bowler,
    legalBalls,
    totalRuns
  ]);

  return (
    <div className="min-h-screen w-full bg-[#f0f4f9] text-slate-800 flex flex-col items-center justify-start pb-16 select-none font-sans">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-5 z-50 bg-slate-900/95 backdrop-blur-md text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          {notificationMsg}
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[1040px] px-3 sm:px-6 pt-3 sm:pt-5 space-y-4">
        {/* ========================================================================= */}
        {/* 1. TOP HERO SCORE HEADER BANNER (EXACT REPLICATION) */}
        {/* ========================================================================= */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-[#0f1f3d] bg-[#020b1c] text-white">
          {/* Background image: stadium lights & night sky atmosphere */}
          <div
            className="absolute inset-0 bg-cover bg-[position:center_top] bg-no-repeat opacity-90"
            style={{ backgroundImage: `url('/stadium-bg.png')` }}
          />

          {/* Deep royal night gradient & stadium glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020b1c]/80 via-[#04122d]/65 to-[#020b1c]/85 pointer-events-none" />

          {/* Banner Content */}
          <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-between">
            {/* Top Bar: Live Badge, Match Title, Supabase Sync & Spectators */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 sm:pb-5">
              {/* Left: LIVE pill */}
              <div className="inline-flex items-center gap-2 bg-[#dc2626] text-white px-3 py-1 rounded-full text-xs font-bold shadow-md shadow-red-900/40">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>LIVE • {inningsNo === 1 ? '1st Innings' : '2nd Innings'}</span>
              </div>

              {/* Center: Tournament & Match Details */}
              <div className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-slate-200 drop-shadow">
                {tournamentName} • {matchNumberText}
              </div>

              {/* Right: Live Synced via Supabase & Watching */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-[#032e1e]/85 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Synced via Supabase</span>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 bg-black/40 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{spectatorCount} watching</span>
                </div>
              </div>
            </div>

            {/* Middle Teams & Big Score Display */}
            <div className="flex items-center justify-between py-2 sm:py-3">
              {/* Batting Team (Left) with Blue Underline */}
              <div className="flex-1 text-left">
                <div className="inline-block">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                    {battingTeamName}
                  </h2>
                  <div className="h-1 sm:h-1.5 w-full bg-[#0066FF] rounded-full mt-1.5 shadow-md shadow-blue-500/50" />
                </div>
              </div>

              {/* Center Huge Score & Over */}
              <div className="flex flex-col items-center justify-center px-2 sm:px-6">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-300/80 mb-0.5">
                  VS
                </span>

                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-lg leading-none font-sans">
                    {totalRuns}/{totalWickets}
                  </span>
                  <span className="text-lg sm:text-2xl font-bold text-slate-200 drop-shadow">
                    ({oversFormatted} ov)
                  </span>
                </div>

                {/* Bottom pill: CRR and Projected Score */}
                <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-200">
                  <span>CRR {crr}</span>
                  <span className="text-slate-500">|</span>
                  <span>
                    Projected {projectedScore} ({totalOvers} ov)
                  </span>
                </div>
              </div>

              {/* Bowling Team (Right) with Red Underline */}
              <div className="flex-1 text-right">
                <div className="inline-block">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                    {bowlingTeamName}
                  </h2>
                  <div className="h-1 sm:h-1.5 w-full bg-[#ef4444] rounded-full mt-1.5 shadow-md shadow-red-500/50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. TOP ACTION BUTTONS BAR (Undo Last Ball & End Innings) */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Match Setup</span>
          </Link>

          <div className="flex items-center gap-2.5">
            {/* Undo Last Ball */}
            <button
              type="button"
              onClick={handleUndoLastBall}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-slate-600" />
              <span>Undo Last Ball</span>
            </button>

            {/* End Innings */}
            <button
              type="button"
              onClick={() => setIsEndInningsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-[#ff3b30] hover:bg-[#e03126] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
            >
              <Flag className="w-4 h-4 fill-white" />
              <span>End Innings</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. PLAYERS TRIO CARDS (Striker, Non-Striker, Bowler + Clean Dedicated Swap Strike) */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row items-stretch gap-3 sm:gap-3.5">
          {/* STRIKER CARD */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] px-2.5 py-0.5 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  Striker
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {striker.name}
              </h3>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-sans">
                  {striker.runs}*
                </span>
                <span className="text-sm font-bold text-slate-500">
                  ({striker.balls}b)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2">
              <span className="bg-[#ede9fe] border border-[#ddd6fe] text-[#6d28d9] px-2.5 py-0.5 rounded-lg text-xs font-bold">
                {striker.fours} x 4
              </span>
              <span className="bg-[#fef3c7] border border-[#fde68a] text-[#b45309] px-2.5 py-0.5 rounded-lg text-xs font-bold">
                {striker.sixes} x 6
              </span>
            </div>
          </div>

          {/* NON-STRIKER CARD */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Non-Striker
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {nonStriker.name}
              </h3>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-sans">
                  {nonStriker.runs}*
                </span>
                <span className="text-sm font-bold text-slate-500">
                  ({nonStriker.balls}b)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-2">
              <span className="bg-[#ede9fe] border border-[#ddd6fe] text-[#6d28d9] px-2.5 py-0.5 rounded-lg text-xs font-bold">
                {nonStriker.fours} x 4
              </span>
            </div>
          </div>

          {/* DEDICATED SWAP STRIKE COLUMN (Clean, no overlap) */}
          <div className="hidden md:flex flex-col items-center justify-center shrink-0 self-center px-1">
            <button
              type="button"
              onClick={handleSwapStrike}
              title="Swap Strike between batters"
              className="w-12 h-12 rounded-full bg-[#334155] hover:bg-[#1e293b] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <ArrowLeftRight className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-black text-slate-600 mt-1 uppercase tracking-tight text-center leading-tight">
              Swap<br />Strike
            </span>
          </div>

          {/* BOWLER CARD */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] px-2.5 py-0.5 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                  Bowler
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                {bowler.name}
              </h3>

              <div className="mt-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {bowler.overs} - {bowler.maidens} - {bowler.runs} - {bowler.wickets}
                </div>
                <div className="flex justify-between max-w-[210px] text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mt-1 px-1">
                  <span>Ov</span>
                  <span>M</span>
                  <span>R</span>
                  <span>W</span>
                </div>
              </div>
            </div>

            {/* Mobile Swap Strike trigger */}
            <div className="flex md:hidden justify-end pt-2">
              <button
                type="button"
                onClick={handleSwapStrike}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Swap Strike</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CURRENT OVER STRIP (6 BALL SLOTS) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                Current Over
              </span>
              <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-bold text-slate-700">
                <span>{Math.floor(legalBalls / 6) + 1}th Over</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500">
              <span>{legalBallsInCurrentOver} legal balls</span>
              <span className="mx-1.5">•</span>
              <span>{runsInCurrentOver} runs</span>
              <span className="mx-1.5">•</span>
              <span>{wicketsInCurrentOver} wickets</span>
            </div>
          </div>

          {/* 6 Ball Slots */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: 6 }).map((_, index) => {
              const ballVal = currentOverBalls[index];
              const isFilled = ballVal !== undefined;

              // Color styles matching reference image
              let ballStyle = 'bg-white border-2 border-slate-200 text-slate-900';
              if (ballVal === '4') {
                ballStyle = 'bg-[#10b981] border-2 border-[#059669] text-white shadow-xs';
              } else if (ballVal === '6') {
                ballStyle = 'bg-[#f59e0b] border-2 border-[#d97706] text-white shadow-xs';
              } else if (ballVal === 'W' || (ballVal && ballVal.startsWith('W'))) {
                ballStyle = 'bg-[#ef4444] border-2 border-[#dc2626] text-white shadow-xs';
              } else if (ballVal && (ballVal.includes('wd') || ballVal.includes('WD') || ballVal.includes('nb') || ballVal.includes('NB'))) {
                ballStyle = 'bg-[#3b82f6] border-2 border-[#2563eb] text-white text-xs sm:text-sm';
              }

              return (
                <div
                  key={index}
                  className={`h-12 sm:h-14 rounded-xl flex items-center justify-center font-black text-base sm:text-lg transition ${
                    isFilled
                      ? ballStyle
                      : 'bg-slate-100/80 border border-slate-200/80 text-slate-300'
                  }`}
                >
                  {isFilled ? ballVal : '•'}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. MAIN SCORING CONTROLS & WICKET DETAILS PANEL */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* SCORING CONTROLS (7 Cols on desktop) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3.5">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Scoring Controls
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Keyboard shortcuts
                  </span>
                  <button
                    type="button"
                    onClick={() => setKeyboardShortcutsEnabled(!keyboardShortcutsEnabled)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition cursor-pointer ${
                      keyboardShortcutsEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>

              {/* Run Buttons Grid */}
              <div className="space-y-2.5">
                {/* Row 1: 0, 1, 2, 3 */}
                <div className="grid grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleScoreRuns(0)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex flex-col items-center justify-center transition cursor-pointer active:scale-95"
                  >
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">0</span>
                    <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Dot Ball</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScoreRuns(1)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-center transition cursor-pointer active:scale-95"
                  >
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScoreRuns(2)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-center transition cursor-pointer active:scale-95"
                  >
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">2</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScoreRuns(3)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex items-center justify-center transition cursor-pointer active:scale-95"
                  >
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">3</span>
                  </button>
                </div>

                {/* Row 2: 4 (Four) & 6 (Six) - 2 wide buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleScoreRuns(4)}
                    className="bg-[#10b981] hover:bg-[#059669] text-white rounded-xl py-3 px-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition cursor-pointer active:scale-95"
                  >
                    <span className="text-3xl sm:text-4xl font-black leading-none">4</span>
                    <span className="text-xs font-bold uppercase tracking-wider mt-0.5">Four</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScoreRuns(6)}
                    className="bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-xl py-3 px-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition cursor-pointer active:scale-95"
                  >
                    <span className="text-3xl sm:text-4xl font-black leading-none">6</span>
                    <span className="text-xs font-bold uppercase tracking-wider mt-0.5">Six</span>
                  </button>
                </div>

                {/* Row 3: WD, NB, Bye, Leg-Bye (with custom extra runs support!) */}
                <div className="grid grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenExtraModal('WD')}
                    className="bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#1e40af] border border-[#bfdbfe] rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center transition cursor-pointer active:scale-95 group relative"
                  >
                    <span className="text-base sm:text-lg font-black leading-none">WD</span>
                    <span className="text-[10px] font-bold mt-0.5">Wide + Runs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenExtraModal('NB')}
                    className="bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#1e40af] border border-[#bfdbfe] rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center transition cursor-pointer active:scale-95 group relative"
                  >
                    <span className="text-base sm:text-lg font-black leading-none">NB</span>
                    <span className="text-[10px] font-bold mt-0.5">No-ball + Runs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenExtraModal('Bye')}
                    className="bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#5b21b6] border border-[#ddd6fe] rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center transition cursor-pointer active:scale-95"
                  >
                    <span className="text-sm sm:text-base font-black leading-none">Bye</span>
                    <span className="text-[10px] font-bold mt-0.5">Byes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenExtraModal('Leg-Bye')}
                    className="bg-[#ede9fe] hover:bg-[#ddd6fe] text-[#5b21b6] border border-[#ddd6fe] rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center transition cursor-pointer active:scale-95"
                  >
                    <span className="text-sm sm:text-base font-black leading-none">Leg-Bye</span>
                    <span className="text-[10px] font-bold mt-0.5">Leg-Byes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Big OUT / WICKET Button */}
            <button
              type="button"
              onClick={handleOpenWicket}
              className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-black text-base sm:text-lg py-3 sm:py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {/* Cricket Stumps Icon */}
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="4" x2="19" y2="4" />
                <line x1="8" y1="4" x2="8" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="16" y1="4" x2="16" y2="20" />
              </svg>
              <span>OUT / WICKET</span>
            </button>
          </div>

          {/* WICKET DETAILS PANEL (5 Cols on desktop - matching the right card in the reference image) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Wicket Details
                </h3>
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                  Wicket #{totalWickets + 1}
                </span>
              </div>

              {/* Dismissal Type 6-buttons grid */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Dismissal Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDismissalType(type)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                          dismissalType === type
                            ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* If Run Out: Choose who was dismissed & runs completed */}
                {dismissalType === 'Run Out' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-700 mb-1">
                        Which batter is Run Out?
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRunOutBatter('striker')}
                          className={`py-1.5 px-2 text-xs font-bold rounded-lg border text-center transition cursor-pointer ${
                            runOutBatter === 'striker'
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          Striker ({striker.name})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRunOutBatter('nonStriker')}
                          className={`py-1.5 px-2 text-xs font-bold rounded-lg border text-center transition cursor-pointer ${
                            runOutBatter === 'nonStriker'
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-white border-slate-300 text-slate-700'
                          }`}
                        >
                          Non-Striker ({nonStriker.name})
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-slate-700 mb-1">
                        Runs completed before run out:
                      </span>
                      <div className="flex gap-2">
                        {[0, 1, 2].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRunOutRunsCompleted(r)}
                            className={`flex-1 py-1 text-xs font-bold rounded-lg border transition ${
                              runOutRunsCompleted === r
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            +{r} {r === 1 ? 'run' : 'runs'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Select Next Batter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Next Batter
                  </label>
                  <div className="relative">
                    <select
                      value={selectedNextBatterId}
                      onChange={(e) => setSelectedNextBatterId(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs pr-9"
                    >
                      {battingSquad.map((batter) => (
                        <option key={batter.id} value={batter.id}>
                          {batter.name} ({batter.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Wicket Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWicketModalOpen(false)}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmWicket}
                className="px-5 py-2 text-xs sm:text-sm font-bold bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-xl shadow-md transition cursor-pointer active:scale-95"
              >
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. OVER SUMMARY CARD (Bottom Green Tinted Card) */}
        {/* ========================================================================= */}
        <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-[#16a34a]" />
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {isOverComplete ? 'Over Complete!' : 'Over In Progress'}
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                {runsInCurrentOver} runs from the over (
                {currentOverBalls.length > 0 ? currentOverBalls.join(', ') : 'Waiting for ball'}
                )
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                Next Bowler
              </span>
              <div className="relative">
                <select
                  value={selectedNextBowlerId}
                  onChange={(e) => setSelectedNextBowlerId(e.target.value)}
                  className="w-full sm:w-44 appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer pr-7 shadow-2xs"
                >
                  {bowlingSquad
                    .filter((b) => b.id !== bowler.id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartNextOver}
              className="mt-4 sm:mt-3.5 inline-flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Next Over</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. EXTRAS MODAL (Wide / No-Ball / Byes with Additional Runs) */}
      {/* ========================================================================= */}
      {extraModalType && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  {extraModalType === 'WD' ? 'WD' : extraModalType === 'NB' ? 'NB' : 'B'}
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                    {extraModalType === 'WD'
                      ? 'Wide Ball (WD)'
                      : extraModalType === 'NB'
                      ? 'No-Ball (NB)'
                      : extraModalType === 'Bye'
                      ? 'Byes'
                      : 'Leg-Byes'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {extraModalType === 'WD' || extraModalType === 'NB'
                      ? '1 Penalty run awarded. Select additional runs scored:'
                      : 'Select runs completed by batters:'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExtraModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* If No-Ball: Choose whether runs were off the bat or byes */}
              {extraModalType === 'NB' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Source of Additional Runs
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNbRunsSource('bat')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                        nbRunsSource === 'bat'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🏏 Off the Bat (To {striker.name})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNbRunsSource('byes')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                        nbRunsSource === 'byes'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      👟 Byes / Running
                    </button>
                  </div>
                </div>
              )}

              {/* Run Selector Options */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {extraModalType === 'WD' || extraModalType === 'NB'
                    ? 'Additional Runs Scored'
                    : 'Total Runs'}
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(extraModalType === 'WD'
                    ? [
                        { runs: 0, label: '0 Runs (1 total)', sub: 'Standard Wide' },
                        { runs: 1, label: '+1 Run (2 total)', sub: 'Strike Rotates' },
                        { runs: 2, label: '+2 Runs (3 total)', sub: 'Batter Stays' },
                        { runs: 3, label: '+3 Runs (4 total)', sub: 'Strike Rotates' },
                        { runs: 4, label: '+4 Runs (5 total)', sub: 'Wide Boundary' }
                      ]
                    : extraModalType === 'NB'
                    ? [
                        { runs: 0, label: '0 Runs (1 total)', sub: 'Standard NB' },
                        { runs: 1, label: '+1 Run (2 total)', sub: 'Strike Rotates' },
                        { runs: 2, label: '+2 Runs (3 total)', sub: 'Batter Stays' },
                        { runs: 3, label: '+3 Runs (4 total)', sub: 'Strike Rotates' },
                        { runs: 4, label: '+4 Runs (5 total)', sub: 'Four off Bat!' },
                        { runs: 6, label: '+6 Runs (7 total)', sub: 'Six off Bat!' }
                      ]
                    : [
                        { runs: 1, label: '1 Run', sub: 'Strike Rotates' },
                        { runs: 2, label: '2 Runs', sub: 'Batter Stays' },
                        { runs: 3, label: '3 Runs', sub: 'Strike Rotates' },
                        { runs: 4, label: '4 Runs', sub: 'Boundary Byes' }
                      ]
                  ).map((opt) => (
                    <button
                      key={opt.runs}
                      type="button"
                      onClick={() => setSelectedExtraRuns(opt.runs)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                        selectedExtraRuns === opt.runs
                          ? 'border-2 border-blue-600 bg-blue-50/70 text-blue-950 font-black shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] text-slate-500 font-medium mt-0.5">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rule Hint */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  {extraModalType === 'WD' || extraModalType === 'NB'
                    ? `${extraModalType === 'WD' ? 'Wide' : 'No-Ball'} does not count as a legal ball. Free hit follows No-Balls.`
                    : 'Byes count as legal balls and do not count against the bowler’s bowling figures.'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtraModalType(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtra}
                  className="px-5 py-2 text-xs sm:text-sm font-bold bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-xl shadow-md transition cursor-pointer active:scale-95"
                >
                  Record Extra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. END INNINGS CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isEndInningsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                <Flag className="w-5 h-5 fill-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
                  End {inningsNo === 1 ? '1st Innings' : '2nd Innings'}?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {battingTeamName} scored {totalRuns}/{totalWickets} in {oversFormatted} overs.
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-5">
              {inningsNo === 1
                ? `Target for ${bowlingTeamName} will be ${totalRuns + 1} runs in ${totalOvers} overs.`
                : 'This will conclude the match and record final scorecards.'}
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEndInningsModalOpen(false)}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Continue Scoring
              </button>

              <button
                type="button"
                onClick={() => {
                  if (inningsNo === 1) {
                    setInningsNo(2);
                    // Swap teams
                    const temp = battingTeamName;
                    setBattingTeamName(bowlingTeamName);
                    setBowlingTeamName(temp);
                    setTotalRuns(0);
                    setTotalWickets(0);
                    setLegalBalls(0);
                    setCurrentOverBalls([]);
                    setIsEndInningsModalOpen(false);
                    showNotification(`Innings 2 started! Target: ${totalRuns + 1} runs.`);
                  } else {
                    setIsEndInningsModalOpen(false);
                    router.push('/');
                  }
                }}
                className="px-5 py-2 text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition cursor-pointer"
              >
                Confirm End Innings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


