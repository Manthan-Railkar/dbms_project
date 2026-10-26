'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Trophy,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  CircleDot,
  User,
  Sun,
  Flame,
  X,
  Edit2,
  Trash2,
  Users,
  UserPlus
} from 'lucide-react';

import {
  INITIAL_TOURNAMENTS,
  INITIAL_VENUES,
  INITIAL_TEAMS,
  INITIAL_UMPIRES,
  Tournament,
  Venue,
  Team,
  Umpire
} from '@/data/mockData';

import {
  TechTitansLogo,
  CodeStrikersLogo,
  RoleBadge,
  CricketBallFormatIcon
} from '@/components/CricketIcons';

import { supabase } from '@/lib/supabase';

export default function MatchSetupWizard() {
  const router = useRouter();

  // Step navigation (1: Match Info, 2: Teams & Squads, 3: Toss & Conditions, 4: Starting Lineup)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Lists
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [venues, setVenues] = useState<Venue[]>(INITIAL_VENUES);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [umpires, setUmpires] = useState<Umpire[]>(INITIAL_UMPIRES);

  // Step 1: Match Info state
  const [selectedTournament, setSelectedTournament] = useState<string>('1');
  const [matchFormat, setMatchFormat] = useState<'T20' | 'ODI' | 'Custom'>('T20');
  const [customOvers, setCustomOvers] = useState<number>(10);
  const [selectedVenue, setSelectedVenue] = useState<string>('1');
  const [city, setCity] = useState<string>('Mumbai');
  const [matchDate, setMatchDate] = useState<string>('2026-10-26');
  const [matchTime, setMatchTime] = useState<string>('18:30');

  // Step 2: Teams & Playing 11 state
  const [team1Id, setTeam1Id] = useState<string>('team-1'); // Tech Titans
  const [team2Id, setTeam2Id] = useState<string>('team-2'); // Code Strikers
  const [team1SelectedPlayerIds, setTeam1SelectedPlayerIds] = useState<string[]>([]);
  const [team2SelectedPlayerIds, setTeam2SelectedPlayerIds] = useState<string[]>([]);

  // Step 3: Toss & Conditions state
  const [tossWinnerId, setTossWinnerId] = useState<string>('team-2'); // Code Strikers won toss
  const [tossDecision, setTossDecision] = useState<'Bat' | 'Field'>('Bat');
  const [weather, setWeather] = useState<string>('Clear');
  const [pitchCondition, setPitchCondition] = useState<string>('Balanced');
  const [outfieldCondition, setOutfieldCondition] = useState<string>('Good');

  // Step 4: Openers & Umpires state
  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');
  const [umpire1, setUmpire1] = useState<string>('S. Iyer');
  const [umpire2, setUmpire2] = useState<string>('R. Sharma');

  // Modals state
  const [showTournamentModal, setShowTournamentModal] = useState<boolean>(false);
  const [newTournamentName, setNewTournamentName] = useState<string>('');
  const [newTournamentFormat, setNewTournamentFormat] = useState<'T20' | 'ODI' | 'Custom'>('T20');

  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamCity, setNewTeamCity] = useState<string>('');

  const [showChangeTeamModal, setShowChangeTeamModal] = useState<'team1' | 'team2' | null>(null);

  // Edit / Add Player Modal state
  const [editingPlayer, setEditingPlayer] = useState<{
    teamId: string;
    player: {
      id: string;
      number: number;
      name: string;
      role: 'Batter' | 'All-rounder' | 'Bowler' | 'Wicketkeeper';
      battingStyle?: string;
      bowlingStyle?: string;
    };
    isNew?: boolean;
  } | null>(null);

  const [editPlayerName, setEditPlayerName] = useState<string>('');
  const [editPlayerRole, setEditPlayerRole] = useState<'Batter' | 'All-rounder' | 'Bowler' | 'Wicketkeeper'>('Batter');
  const [editPlayerNumber, setEditPlayerNumber] = useState<number>(1);
  const [editBattingStyle, setEditBattingStyle] = useState<string>('Right-hand bat');
  const [editBowlingStyle, setEditBowlingStyle] = useState<string>('Right-arm medium');

  // Live Scoring View
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [liveRuns, setLiveRuns] = useState<number>(0);
  const [liveWickets, setLiveWickets] = useState<number>(0);
  const [liveLegalBalls, setLiveLegalBalls] = useState<number>(0);
  const [liveBallHistory, setLiveBallHistory] = useState<string[]>([]);

  // Initialize Playing Squad for Team 1 and Team 2 (first 11 selected by default if available)
  useEffect(() => {
    const t1 = teams.find((t) => t.id === team1Id);
    if (t1) {
      setTeam1SelectedPlayerIds(t1.players.slice(0, 11).map((p) => p.id));
    }
  }, [team1Id, teams]);

  useEffect(() => {
    const t2 = teams.find((t) => t.id === team2Id);
    if (t2) {
      setTeam2SelectedPlayerIds(t2.players.slice(0, 11).map((p) => p.id));
    }
  }, [team2Id, teams]);

  const handleVenueChange = (venueId: string) => {
    setSelectedVenue(venueId);
    const v = venues.find((item) => item.id === venueId);
    if (v) {
      setCity(v.city);
    }
  };

  const team1 = teams.find((t) => t.id === team1Id) || teams[0];
  const team2 = teams.find((t) => t.id === team2Id) || teams[1];

  const isTossWinnerTeam1 = tossWinnerId === team1.id;
  const battingTeam =
    (isTossWinnerTeam1 && tossDecision === 'Bat') || (!isTossWinnerTeam1 && tossDecision === 'Field')
      ? team1
      : team2;

  const bowlingTeam = battingTeam.id === team1.id ? team2 : team1;

  const battingPlaying11 = battingTeam.players.filter((p) =>
    battingTeam.id === team1.id
      ? team1SelectedPlayerIds.includes(p.id)
      : team2SelectedPlayerIds.includes(p.id)
  );

  const bowlingPlaying11 = bowlingTeam.players.filter((p) =>
    bowlingTeam.id === team1.id
      ? team1SelectedPlayerIds.includes(p.id)
      : team2SelectedPlayerIds.includes(p.id)
  );

  useEffect(() => {
    if (battingPlaying11.length >= 2) {
      setStrikerId(battingPlaying11[0].id);
      setNonStrikerId(battingPlaying11[1].id);
    } else if (battingPlaying11.length === 1) {
      setStrikerId(battingPlaying11[0].id);
      setNonStrikerId(battingPlaying11[0].id);
    }
    if (bowlingPlaying11.length > 0) {
      const bowler = bowlingPlaying11.find((p) => p.role === 'Bowler') || bowlingPlaying11[0];
      setBowlerId(bowler.id);
    }
  }, [battingTeam.id, bowlingTeam.id, team1SelectedPlayerIds, team2SelectedPlayerIds]);

  // Custom player selection (no hardcoded 11-player constraint)
  const togglePlayerSelection = (teamNum: 1 | 2, playerId: string) => {
    if (teamNum === 1) {
      if (team1SelectedPlayerIds.includes(playerId)) {
        setTeam1SelectedPlayerIds(team1SelectedPlayerIds.filter((id) => id !== playerId));
      } else {
        setTeam1SelectedPlayerIds([...team1SelectedPlayerIds, playerId]);
      }
    } else {
      if (team2SelectedPlayerIds.includes(playerId)) {
        setTeam2SelectedPlayerIds(team2SelectedPlayerIds.filter((id) => id !== playerId));
      } else {
        setTeam2SelectedPlayerIds([...team2SelectedPlayerIds, playerId]);
      }
    }
  };

  const selectAllPlayers = (teamNum: 1 | 2) => {
    const targetTeam = teamNum === 1 ? team1 : team2;
    const allIds = targetTeam.players.map((p) => p.id);
    if (teamNum === 1) {
      setTeam1SelectedPlayerIds(allIds);
    } else {
      setTeam2SelectedPlayerIds(allIds);
    }
  };

  const clearSelectedPlayers = (teamNum: 1 | 2) => {
    if (teamNum === 1) {
      setTeam1SelectedPlayerIds([]);
    } else {
      setTeam2SelectedPlayerIds([]);
    }
  };

  // Open Edit Player Modal
  const openEditPlayer = (teamId: string, player: { id: string; number: number; name: string; role: 'Batter' | 'All-rounder' | 'Bowler' | 'Wicketkeeper'; battingStyle?: string; bowlingStyle?: string; }) => {
    setEditingPlayer({ teamId, player, isNew: false });
    setEditPlayerName(player.name);
    setEditPlayerRole(player.role);
    setEditPlayerNumber(player.number);
    setEditBattingStyle(player.battingStyle || 'Right-hand bat');
    setEditBowlingStyle(player.bowlingStyle || 'Right-arm medium');
  };

  // Open Add Player Modal
  const openAddPlayer = (teamId: string) => {
    const targetTeam = teams.find((t) => t.id === teamId);
    const nextNumber = (targetTeam?.players.length || 0) + 1;
    const dummy = {
      id: '',
      number: nextNumber,
      name: '',
      role: 'Batter' as const,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium'
    };
    setEditingPlayer({ teamId, player: dummy, isNew: true });
    setEditPlayerName('');
    setEditPlayerRole('Batter');
    setEditPlayerNumber(nextNumber);
    setEditBattingStyle('Right-hand bat');
    setEditBowlingStyle('Right-arm medium');
  };

  // Save Player Changes (Add or Edit)
  const handleSavePlayer = () => {
    if (!editingPlayer || !editPlayerName.trim()) return;

    setTeams((prevTeams) =>
      prevTeams.map((t) => {
        if (t.id !== editingPlayer.teamId) return t;

        if (editingPlayer.isNew) {
          const newPlayer = {
            id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            number: editPlayerNumber || t.players.length + 1,
            name: editPlayerName.trim(),
            role: editPlayerRole,
            battingStyle: editBattingStyle,
            bowlingStyle: editBowlingStyle
          };

          // Auto-select newly created player
          if (editingPlayer.teamId === team1Id) {
            setTeam1SelectedPlayerIds((prev) => [...prev, newPlayer.id]);
          } else if (editingPlayer.teamId === team2Id) {
            setTeam2SelectedPlayerIds((prev) => [...prev, newPlayer.id]);
          }

          return {
            ...t,
            players: [...t.players, newPlayer]
          };
        } else {
          return {
            ...t,
            players: t.players.map((p) =>
              p.id === editingPlayer.player.id
                ? {
                    ...p,
                    number: editPlayerNumber,
                    name: editPlayerName.trim(),
                    role: editPlayerRole,
                    battingStyle: editBattingStyle,
                    bowlingStyle: editBowlingStyle
                  }
                : p
            )
          };
        }
      })
    );

    setEditingPlayer(null);
  };

  // Delete Player from Team
  const handleDeletePlayer = (teamId: string, playerId: string) => {
    setTeams((prevTeams) =>
      prevTeams.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          players: t.players.filter((p) => p.id !== playerId)
        };
      })
    );

    if (teamId === team1Id) {
      setTeam1SelectedPlayerIds((prev) => prev.filter((id) => id !== playerId));
    } else if (teamId === team2Id) {
      setTeam2SelectedPlayerIds((prev) => prev.filter((id) => id !== playerId));
    }
  };

  // Helper to compute squad formation counts
  const getFormationSummary = (team: typeof team1, selectedIds: string[]) => {
    const selected = team.players.filter((p) => selectedIds.includes(p.id));
    const batters = selected.filter((p) => p.role === 'Batter').length;
    const bowlers = selected.filter((p) => p.role === 'Bowler').length;
    const allRounders = selected.filter((p) => p.role === 'All-rounder').length;
    const keepers = selected.filter((p) => p.role === 'Wicketkeeper').length;
    return { batters, bowlers, allRounders, keepers, total: selected.length };
  };

  const renderTeamLogo = (badgeType: string, className = 'w-10 h-10') => {
    if (badgeType === 'red-lion') {
      return <CodeStrikersLogo className={className} />;
    }
    return <TechTitansLogo className={className} />;
  };

  const handleStartLiveScoring = async () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Fallback
    }

    let matchId = '1';
    let inningId = 1;

    // Identify selected openers & opening bowler
    const currentStriker = battingPlaying11.find((p) => p.id === strikerId) || battingPlaying11[0] || { id: 'p-1', name: 'Striker', role: 'Batter' };
    const currentNonStriker = battingPlaying11.find((p) => p.id === nonStrikerId) || battingPlaying11[1] || { id: 'p-2', name: 'Non-Striker', role: 'Batter' };
    const currentBowler = bowlingPlaying11.find((p) => p.id === bowlerId) || bowlingPlaying11[0] || { id: 'p-7', name: 'Opening Bowler', role: 'Bowler' };

    let strikerToUse = currentStriker;
    let nonStrikerToUse = currentNonStriker;
    let bowlerToUse = currentBowler;
    let battingSquadToUse = battingPlaying11.filter(
      (p) => p.id !== currentStriker?.id && p.id !== currentNonStriker?.id
    );
    let bowlingSquadToUse = bowlingPlaying11;

    // 1. Create real match, synchronized teams, and players in Supabase Database via API
    try {
      const selectedT1Players = team1.players.filter((p) => team1SelectedPlayerIds.includes(p.id));
      const selectedT2Players = team2.players.filter((p) => team2SelectedPlayerIds.includes(p.id));

      const res = await fetch('/api/match/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: parseInt(selectedTournament, 10) || 1,
          tournament_name: tournaments.find((t) => t.id === selectedTournament)?.name,
          venue_id: parseInt(selectedVenue, 10) || 1,
          team1_name: team1.name,
          team1_city: team1.city,
          team1_players: selectedT1Players.length > 0 ? selectedT1Players : team1.players,
          team2_name: team2.name,
          team2_city: team2.city,
          team2_players: selectedT2Players.length > 0 ? selectedT2Players : team2.players,
          toss_winner_id: tossWinnerId === team1.id ? 'team-1' : 'team-2',
          toss_decision: tossDecision,
          match_date: `${matchDate}T${matchTime}:00Z`,
          toss_result: `${tossWinnerId === team1.id ? team1.name : team2.name} won toss and elected to ${tossDecision}`,
          striker: currentStriker,
          non_striker: currentNonStriker,
          bowler: currentBowler
        })
      });

      const result = await res.json();
      if (result.success && result.matchId) {
        matchId = String(result.matchId);
        inningId = result.inningId || 1;
        if (result.striker) {
          strikerToUse = { ...currentStriker, id: String(result.striker.player_id), name: result.striker.name };
        }
        if (result.nonStriker) {
          nonStrikerToUse = { ...currentNonStriker, id: String(result.nonStriker.player_id), name: result.nonStriker.name };
        }
        if (result.bowler) {
          bowlerToUse = { ...currentBowler, id: String(result.bowler.player_id), name: result.bowler.name };
        }
        if (result.battingSquad && result.battingSquad.length > 0) {
          battingSquadToUse = result.battingSquad.map((p: any) => ({
            id: String(p.player_id || p.id),
            name: p.name,
            role: p.role
          }));
        }
        if (result.bowlingSquad && result.bowlingSquad.length > 0) {
          bowlingSquadToUse = result.bowlingSquad.map((p: any) => ({
            id: String(p.player_id || p.id),
            name: p.name,
            role: p.role
          }));
        }
      }
    } catch (err) {
      console.warn('Supabase match creation fallback:', err);
    }

    const matchData = {
      matchId,
      inningId,
      tournament: tournaments.find((t) => t.id === selectedTournament)?.name || 'SPIT Premier League 2026',
      team1,
      team2,
      battingTeamName: battingTeam.name,
      bowlingTeamName: bowlingTeam.name,
      totalOvers: matchFormat === 'T20' ? 20 : matchFormat === 'ODI' ? 50 : customOvers,
      striker: strikerToUse,
      nonStriker: nonStrikerToUse,
      bowler: bowlerToUse,
      battingSquad: battingSquadToUse,
      bowlingSquad: bowlingSquadToUse,
      totalRuns: 0,
      totalWickets: 0,
      legalBalls: 0,
      currentOverBalls: []
    };

    try {
      localStorage.setItem(`cricket_match_${matchId}`, JSON.stringify(matchData));
    } catch {}

    router.push(`/match/${matchId}`);
  };

  const recordBall = (type: '0' | '1' | '2' | '3' | '4' | '6' | 'W' | 'WD' | 'NB') => {
    if (type === 'W') {
      setLiveWickets((w) => Math.min(10, w + 1));
      setLiveLegalBalls((b) => b + 1);
      setLiveBallHistory((prev) => [...prev, 'W']);
    } else if (type === 'WD') {
      setLiveRuns((r) => r + 1);
      setLiveBallHistory((prev) => [...prev, '1wd']);
    } else if (type === 'NB') {
      setLiveRuns((r) => r + 1);
      setLiveBallHistory((prev) => [...prev, '1nb']);
    } else {
      const runs = parseInt(type, 10);
      setLiveRuns((r) => r + runs);
      setLiveLegalBalls((b) => b + 1);
      setLiveBallHistory((prev) => [...prev, type]);
    }
  };

  const currentOversText = `${Math.floor(liveLegalBalls / 6)}.${liveLegalBalls % 6}`;

  // Get current step title & subtitle
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return {
          title: 'Create & Start Match',
          subtitle: 'Set up the basic details for your match'
        };
      case 2:
        return {
          title: 'Select Teams & Playing Squads',
          subtitle: 'Choose the teams for this match and select the playing 11 for each side'
        };
      case 3:
        return {
          title: 'Toss & Match Conditions',
          subtitle: 'Set the toss result and match conditions'
        };
      case 4:
        return {
          title: 'Select Openers & Start Match',
          subtitle: 'Choose the on-field players and get ready to begin live scoring'
        };
      default:
        return { title: 'Create & Start Match', subtitle: 'Set up match details' };
    }
  };

  const { title: heroTitle, subtitle: heroSubtitle } = getStepTitle();

  return (
    <main className="min-h-screen w-full bg-[#f0f4f9] flex flex-col items-center justify-start m-0 p-0 select-none">
      {/* ========================================================================= */}
      {/* HERO SECTION WITH PANORAMIC STADIUM BACKGROUND & CRICKET BALL */}
      {/* ========================================================================= */}
      <div className="relative w-full h-[250px] sm:h-[270px] md:h-[290px] overflow-hidden select-none">
        {/* Background Image: public/stadium-bg.png positioned so the ball and floodlights frame the right side */}
        <div
          className="absolute inset-0 bg-cover bg-[position:88%_top] sm:bg-[position:90%_top] md:bg-[position:89%_top] bg-no-repeat"
          style={{ backgroundImage: `url('/stadium-bg.png')` }}
        />

        {/* Soft gradient overlay for optimal text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020b1c]/65 via-[#020b1c]/25 to-[#020b1c]/45 pointer-events-none" />

        {/* Content: Stepper at top, Title & Subtitle at bottom */}
        <div className="relative z-10 w-full max-w-[1060px] mx-auto h-full px-4 sm:px-6 pt-4 pb-12 sm:pb-14 flex flex-col justify-between">
          {/* Top Stepper Nav */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-white text-xs sm:text-sm font-medium">
            {/* Step 1: Match Info */}
            <div
              onClick={() => {
                setIsLiveActive(false);
                setCurrentStep(1);
              }}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="flex items-center gap-2 pb-1.5">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition ${currentStep === 1
                      ? 'bg-[#0066FF] text-white shadow-md'
                      : currentStep > 1
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#152744]/80 text-white/90 border border-white/25 backdrop-blur-xs'
                    }`}
                >
                  {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                </div>
                <span
                  className={`text-xs sm:text-sm tracking-wide ${currentStep === 1 ? 'font-semibold text-white' : 'font-medium text-white/80'
                    }`}
                >
                  Match Info
                </span>
              </div>
              {/* Active Underline Indicator */}
              <div
                className={`h-[2.5px] rounded-full transition-all duration-300 ${currentStep === 1 ? 'w-full bg-[#0066FF]' : 'w-0 bg-transparent'
                  }`}
              />
            </div>

            {/* Separator Line */}
            <span className="w-5 sm:w-8 h-[1px] bg-white/35 self-center -mt-2" />

            {/* Step 2: Teams & Squads */}
            <div
              onClick={() => {
                setIsLiveActive(false);
                setCurrentStep(2);
              }}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="flex items-center gap-2 pb-1.5">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition ${currentStep === 2
                      ? 'bg-[#0066FF] text-white shadow-md'
                      : currentStep > 2
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#152744]/80 text-white/90 border border-white/25 backdrop-blur-xs'
                    }`}
                >
                  {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                </div>
                <span
                  className={`text-xs sm:text-sm tracking-wide ${currentStep === 2 ? 'font-semibold text-white' : 'font-medium text-white/80'
                    }`}
                >
                  Teams & Squads
                </span>
              </div>
              <div
                className={`h-[2.5px] rounded-full transition-all duration-300 ${currentStep === 2 ? 'w-full bg-[#0066FF]' : 'w-0 bg-transparent'
                  }`}
              />
            </div>

            {/* Separator Line */}
            <span className="w-5 sm:w-8 h-[1px] bg-white/35 self-center -mt-2" />

            {/* Step 3: Toss & Conditions */}
            <div
              onClick={() => {
                setIsLiveActive(false);
                setCurrentStep(3);
              }}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="flex items-center gap-2 pb-1.5">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition ${currentStep === 3
                      ? 'bg-[#0066FF] text-white shadow-md'
                      : currentStep > 3
                        ? 'bg-emerald-500 text-white'
                        : 'bg-[#152744]/80 text-white/90 border border-white/25 backdrop-blur-xs'
                    }`}
                >
                  {currentStep > 3 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '3'}
                </div>
                <span
                  className={`text-xs sm:text-sm tracking-wide ${currentStep === 3 ? 'font-semibold text-white' : 'font-medium text-white/80'
                    }`}
                >
                  Toss & Conditions
                </span>
              </div>
              <div
                className={`h-[2.5px] rounded-full transition-all duration-300 ${currentStep === 3 ? 'w-full bg-[#0066FF]' : 'w-0 bg-transparent'
                  }`}
              />
            </div>

            {/* Separator Line */}
            <span className="w-5 sm:w-8 h-[1px] bg-white/35 self-center -mt-2" />

            {/* Step 4: Starting Lineup */}
            <div
              onClick={() => {
                setIsLiveActive(false);
                setCurrentStep(4);
              }}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="flex items-center gap-2 pb-1.5">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition ${currentStep === 4
                      ? 'bg-[#0066FF] text-white shadow-md'
                      : 'bg-[#152744]/80 text-white/90 border border-white/25 backdrop-blur-xs'
                    }`}
                >
                  4
                </div>
                <span
                  className={`text-xs sm:text-sm tracking-wide ${currentStep === 4 ? 'font-semibold text-white' : 'font-medium text-white/80'
                    }`}
                >
                  Starting Lineup
                </span>
              </div>
              <div
                className={`h-[2.5px] rounded-full transition-all duration-300 ${currentStep === 4 ? 'w-full bg-[#0066FF]' : 'w-0 bg-transparent'
                  }`}
              />
            </div>
          </div>

          {/* Hero Title & Subtitle */}
          <div className="mb-5 sm:mb-6 md:mb-7">
            <h1 className="text-2xl sm:text-3xl md:text-[34px] font-extrabold text-white tracking-tight drop-shadow-md">
              {heroTitle}
            </h1>
            <p className="text-white/90 text-xs sm:text-sm md:text-base font-normal mt-1 drop-shadow">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING WHITE FORM CARD (MATCHING REFERENCE IMAGE 1:1) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[1060px] mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 mb-10 relative z-20">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-100 p-5 sm:p-7 md:p-8">
          {/* STEP 1: MATCH INFO */}
          {currentStep === 1 && !isLiveActive && (
            <div className="space-y-4 sm:space-y-5">
              {/* 1. Tournament Card */}
              <div className="bg-[#f8fafc] border border-[#edf2f7] rounded-2xl p-4 sm:p-5 transition">
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#f0f4fd] text-[#1e3a8a] flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-[#1e3a8a]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">Tournament</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select an existing tournament or create a new one
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <select
                      value={selectedTournament}
                      onChange={(e) => setSelectedTournament(e.target.value)}
                      className="w-full appearance-none bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 cursor-pointer shadow-2xs"
                    >
                      {tournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTournamentModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl border border-[#e2e8f0] hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition shadow-2xs whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-700 stroke-[2.5]" />
                    <span>Create New Tournament</span>
                  </button>
                </div>
              </div>

              {/* 2. Match Format Card */}
              <div className="bg-[#f8fafc] border border-[#edf2f7] rounded-2xl p-4 sm:p-5 transition">
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#f0f4fd] text-[#1e3a8a] flex items-center justify-center shrink-0">
                    <CricketBallFormatIcon className="w-6 h-6 text-[#1e3a8a]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">Match Format</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select the format for this match
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* T20 (20 ov) Option Pill */}
                  <div
                    onClick={() => setMatchFormat('T20')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${matchFormat === 'T20'
                        ? 'border-2 border-blue-500 bg-[#f0f6ff] text-slate-900 shadow-2xs'
                        : 'border border-[#e2e8f0] hover:border-slate-300 text-slate-800 bg-white'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${matchFormat === 'T20' ? 'border-blue-600' : 'border-slate-400'
                        }`}
                    >
                      {matchFormat === 'T20' && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-sm font-bold">T20 (20 ov)</span>
                  </div>

                  {/* ODI (50 ov) Option Pill */}
                  <div
                    onClick={() => setMatchFormat('ODI')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${matchFormat === 'ODI'
                        ? 'border-2 border-blue-500 bg-[#f0f6ff] text-slate-900 shadow-2xs'
                        : 'border border-[#e2e8f0] hover:border-slate-300 text-slate-800 bg-white'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${matchFormat === 'ODI'
                          ? 'border-2 border-blue-600'
                          : 'border-slate-400'
                        }`}
                    >
                      {matchFormat === 'ODI' && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-sm font-bold">ODI (50 ov)</span>
                  </div>

                  {/* Custom Overs Option Pill */}
                  <div
                    onClick={() => setMatchFormat('Custom')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${matchFormat === 'Custom'
                        ? 'border-2 border-blue-500 bg-[#f0f6ff] text-slate-900 shadow-2xs'
                        : 'border border-[#e2e8f0] hover:border-slate-300 text-slate-800 bg-white'
                      }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${matchFormat === 'Custom'
                          ? 'border-2 border-blue-600'
                          : 'border-slate-400'
                        }`}
                    >
                      {matchFormat === 'Custom' && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <span className="text-sm font-bold flex items-center gap-2">
                      Custom Overs
                      {matchFormat === 'Custom' && (
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={customOvers}
                          onChange={(e) => setCustomOvers(Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-14 px-2 py-0.5 text-xs border border-blue-500 rounded-md bg-white text-center font-bold focus:outline-none"
                        />
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Venue & City and Date & Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Venue & City */}
                <div className="bg-[#f8fafc] border border-[#edf2f7] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#f0f4fd] text-[#1e3a8a] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-[#1e3a8a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Venue & City</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select the venue for the match
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <select
                        value={selectedVenue}
                        onChange={(e) => handleVenueChange(e.target.value)}
                        className="w-full appearance-none bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 pr-9 cursor-pointer shadow-2xs"
                      >
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="w-32 sm:w-36">
                      <input
                        type="text"
                        readOnly
                        value={city}
                        className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-slate-800 font-medium text-center focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="bg-[#f8fafc] border border-[#edf2f7] rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#f0f4fd] text-[#1e3a8a] flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-5 h-5 text-[#1e3a8a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Date & Time</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select match date and start time
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative flex items-center bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 shadow-2xs">
                      <span className="text-sm font-semibold text-slate-800 flex-1">
                        26 Oct 2026
                      </span>
                      <CalendarIcon className="w-4 h-4 text-slate-500" />
                    </div>

                    <div className="relative flex items-center bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 shadow-2xs">
                      <Clock className="w-4 h-4 text-slate-500 mr-2.5" />
                      <span className="text-sm font-semibold text-slate-800">
                        06:30 PM
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA Right Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer active:scale-[0.99]"
                >
                  <span>Next: Teams & Squads</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TEAMS & PLAYING SQUADS */}
          {currentStep === 2 && !isLiveActive && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                {/* VS Badge */}
                <div className="hidden lg:flex absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm items-center justify-center text-[10px] font-black text-slate-600 uppercase">
                  vs
                </div>

                {/* LEFT: Team 1 (Home) */}
                {(() => {
                  const f1 = getFormationSummary(team1, team1SelectedPlayerIds);
                  return (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          Team 1 (Home)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddPlayer(team1.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2.5 py-1 transition cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Player</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowChangeTeamModal('team1')}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                          >
                            Change Team
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 mb-4 pb-3.5 border-b border-slate-100">
                        {renderTeamLogo(team1.badgeType, 'w-12 h-12')}
                        <div className="flex-1">
                          <h4 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                            {team1.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {team1.city} • {team1.players.length} Total Squad Members
                          </p>
                        </div>
                      </div>

                      {/* Formation Summary & Quick Controls */}
                      <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>Playing Squad Lineup</span>
                          </h5>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => selectAllPlayers(1)}
                              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                            >
                              Select All
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => clearSelectedPlayers(1)}
                              className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ml-1 ${
                                team1SelectedPlayerIds.length >= 2
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {team1SelectedPlayerIds.length} Selected
                            </span>
                          </div>
                        </div>

                        {/* Dynamic Formation Breakdown Strip */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Formation:</span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-blue-900">
                            🏏 {f1.batters} Bat
                          </span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-purple-900">
                            ⚡ {f1.bowlers} Bowl
                          </span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-amber-900">
                            ✨ {f1.allRounders} AR
                          </span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-emerald-900">
                            🧤 {f1.keepers} WK
                          </span>
                        </div>
                      </div>

                      {/* Squad Table with Edit / Delete Actions */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[310px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 w-8 text-center">#</th>
                              <th className="px-3 py-2">Player Details</th>
                              <th className="px-3 py-2">Role</th>
                              <th className="px-2 py-2 text-center w-16">Edit</th>
                              <th className="px-3 py-2 w-10 text-center">Play</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {team1.players.map((player) => {
                              const isSelected = team1SelectedPlayerIds.includes(player.id);
                              return (
                                <tr
                                  key={player.id}
                                  className={`transition hover:bg-slate-50 ${
                                    isSelected ? 'bg-blue-50/25' : ''
                                  }`}
                                >
                                  <td
                                    onClick={() => togglePlayerSelection(1, player.id)}
                                    className="px-3 py-2.5 text-center text-slate-400 font-semibold cursor-pointer"
                                  >
                                    {player.number}
                                  </td>
                                  <td
                                    onClick={() => togglePlayerSelection(1, player.id)}
                                    className="px-3 py-2.5 cursor-pointer"
                                  >
                                    <div className="font-bold text-slate-900">{player.name}</div>
                                    <div className="text-[10px] text-slate-500 font-normal">
                                      {player.battingStyle || 'Right-hand bat'}
                                      {player.bowlingStyle ? ` • ${player.bowlingStyle}` : ''}
                                    </div>
                                  </td>
                                  <td
                                    onClick={() => togglePlayerSelection(1, player.id)}
                                    className="px-3 py-2.5 cursor-pointer"
                                  >
                                    <RoleBadge role={player.role} />
                                  </td>
                                  <td className="px-2 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        title="Edit player name & role"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditPlayer(team1.id, player);
                                        }}
                                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Remove player"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePlayer(team1.id, player.id);
                                        }}
                                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td
                                    onClick={() => togglePlayerSelection(1, player.id)}
                                    className="px-3 py-2.5 text-center cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                {/* RIGHT: Team 2 (Away) */}
                {(() => {
                  const f2 = getFormationSummary(team2, team2SelectedPlayerIds);
                  return (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <Shield className="w-3.5 h-3.5 text-red-600" />
                          Team 2 (Away)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAddPlayer(team2.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2.5 py-1 transition cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add Player</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowChangeTeamModal('team2')}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                          >
                            Change Team
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 mb-4 pb-3.5 border-b border-slate-100">
                        {renderTeamLogo(team2.badgeType, 'w-12 h-12')}
                        <div className="flex-1">
                          <h4 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                            {team2.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {team2.city} • {team2.players.length} Total Squad Members
                          </p>
                        </div>
                      </div>

                      {/* Formation Summary & Quick Controls */}
                      <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-red-600" />
                            <span>Playing Squad Lineup</span>
                          </h5>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => selectAllPlayers(2)}
                              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                            >
                              Select All
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => clearSelectedPlayers(2)}
                              className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ml-1 ${
                                team2SelectedPlayerIds.length >= 2
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {team2SelectedPlayerIds.length} Selected
                            </span>
                          </div>
                        </div>

                        {/* Dynamic Formation Breakdown Strip */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Formation:</span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-blue-900">
                            🏏 {f2.batters} Bat
                          </span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-purple-900">
                            ⚡ {f2.bowlers} Bowl
                          </span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-amber-900">
                            ✨ {f2.allRounders} AR
                          </span>
                          <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-emerald-900">
                            🧤 {f2.keepers} WK
                          </span>
                        </div>
                      </div>

                      {/* Squad Table with Edit / Delete Actions */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[310px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 w-8 text-center">#</th>
                              <th className="px-3 py-2">Player Details</th>
                              <th className="px-3 py-2">Role</th>
                              <th className="px-2 py-2 text-center w-16">Edit</th>
                              <th className="px-3 py-2 w-10 text-center">Play</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {team2.players.map((player) => {
                              const isSelected = team2SelectedPlayerIds.includes(player.id);
                              return (
                                <tr
                                  key={player.id}
                                  className={`transition hover:bg-slate-50 ${
                                    isSelected ? 'bg-red-50/25' : ''
                                  }`}
                                >
                                  <td
                                    onClick={() => togglePlayerSelection(2, player.id)}
                                    className="px-3 py-2.5 text-center text-slate-400 font-semibold cursor-pointer"
                                  >
                                    {player.number}
                                  </td>
                                  <td
                                    onClick={() => togglePlayerSelection(2, player.id)}
                                    className="px-3 py-2.5 cursor-pointer"
                                  >
                                    <div className="font-bold text-slate-900">{player.name}</div>
                                    <div className="text-[10px] text-slate-500 font-normal">
                                      {player.battingStyle || 'Right-hand bat'}
                                      {player.bowlingStyle ? ` • ${player.bowlingStyle}` : ''}
                                    </div>
                                  </td>
                                  <td
                                    onClick={() => togglePlayerSelection(2, player.id)}
                                    className="px-3 py-2.5 cursor-pointer"
                                  >
                                    <RoleBadge role={player.role} />
                                  </td>
                                  <td className="px-2 py-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        type="button"
                                        title="Edit player name & role"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditPlayer(team2.id, player);
                                        }}
                                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Remove player"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePlayer(team2.id, player.id);
                                        }}
                                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td
                                    onClick={() => togglePlayerSelection(2, player.id)}
                                    className="px-3 py-2.5 text-center cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (team1SelectedPlayerIds.length < 2 || team2SelectedPlayerIds.length < 2) {
                      alert('Please select at least 2 playing members for each team to proceed.');
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white font-medium px-7 py-3 rounded-xl shadow-md transition cursor-pointer active:scale-[0.99]"
                >
                  <span>Next: Toss & Conditions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TOSS & CONDITIONS */}
          {currentStep === 3 && !isLiveActive && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Who won the toss? */}
                  <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Trophy className="w-4 h-4 text-slate-700" />
                      <h4 className="font-bold text-slate-900 text-sm">Who won the toss?</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setTossWinnerId(team1.id)}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer ${tossWinnerId === team1.id
                            ? 'border-2 border-blue-600 bg-blue-50/30 text-blue-950 font-bold shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                          }`}
                      >
                        {tossWinnerId === team1.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        {renderTeamLogo(team1.badgeType, 'w-12 h-12 mb-2')}
                        <span className="text-sm">{team1.name}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTossWinnerId(team2.id)}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer ${tossWinnerId === team2.id
                            ? 'border-2 border-blue-600 bg-blue-50/30 text-blue-950 font-bold shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-800 bg-white'
                          }`}
                      >
                        {tossWinnerId === team2.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        {renderTeamLogo(team2.badgeType, 'w-12 h-12 mb-2')}
                        <span className="text-sm">{team2.name}</span>
                      </button>
                    </div>
                  </div>

                  {/* Elected to? */}
                  <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Flame className="w-4 h-4 text-slate-700" />
                      <h4 className="font-bold text-slate-900 text-sm">Elected to?</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setTossDecision('Bat')}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition cursor-pointer ${tossDecision === 'Bat'
                            ? 'border-2 border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                      >
                        <span className="text-base">🏏</span>
                        <span>Bat First</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTossDecision('Field')}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition cursor-pointer ${tossDecision === 'Field'
                            ? 'border-2 border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                      >
                        <span className="text-base">⚾</span>
                        <span>Field First</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Toss Result Summary & Conditions */}
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-200/80 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-4">
                      <Trophy className="w-4 h-4 text-emerald-600" />
                      <h4>Toss Result</h4>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-emerald-100">
                        <span className="text-slate-500 font-medium">Toss Winner</span>
                        <span className="font-bold text-slate-900">
                          {tossWinnerId === team1.id ? team1.name : team2.name}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-emerald-100">
                        <span className="text-slate-500 font-medium">Elected to</span>
                        <span className="font-bold text-slate-900">{tossDecision} First</span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                        <span className="text-slate-500 font-medium">1st Innings (Batting)</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {renderTeamLogo(battingTeam.badgeType, 'w-4 h-4')}
                          {battingTeam.name}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium">1st Innings (Bowling)</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {renderTeamLogo(bowlingTeam.badgeType, 'w-4 h-4')}
                          {bowlingTeam.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Sun className="w-4 h-4 text-slate-700" />
                      <h4 className="font-bold text-slate-900 text-sm">
                        Match Conditions{' '}
                        <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Weather
                        </label>
                        <select
                          value={weather}
                          onChange={(e) => setWeather(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Clear">☀️ Clear</option>
                          <option value="Overcast">☁️ Overcast</option>
                          <option value="Dew">💧 Dew</option>
                          <option value="Windy">💨 Windy</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Pitch Condition
                        </label>
                        <select
                          value={pitchCondition}
                          onChange={(e) => setPitchCondition(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Balanced">🏏 Balanced</option>
                          <option value="Batting Friendly">🔥 Batting</option>
                          <option value="Bowling Friendly">⚡ Bowling</option>
                          <option value="Dry Spin">🌀 Dry/Spin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Outfield Condition
                        </label>
                        <select
                          value={outfieldCondition}
                          onChange={(e) => setOutfieldCondition(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="Good">🟢 Good</option>
                          <option value="Fast">⚡ Fast</option>
                          <option value="Slow">🐌 Slow</option>
                          <option value="Wet">🌧️ Wet</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-2 bg-[#0066FF] hover:bg-[#0052cc] text-white font-medium px-7 py-3 rounded-xl shadow-md transition"
                >
                  <span>Next: Starting Lineup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: STARTING LINEUP */}
          {currentStep === 4 && !isLiveActive && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Batting Team Openers */}
                <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        {renderTeamLogo(battingTeam.badgeType, 'w-7 h-7')}
                        <h4 className="font-bold text-slate-900 text-base">
                          Batting Team - {battingTeam.name}
                        </h4>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Innings 1
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Striker (Opener 1)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                            🏏
                          </span>
                          <select
                            value={strikerId}
                            onChange={(e) => setStrikerId(e.target.value)}
                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            {battingPlaying11.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.id === nonStrikerId}>
                                {p.name} ({p.role})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Non-Striker (Opener 2)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                            🏏
                          </span>
                          <select
                            value={nonStrikerId}
                            onChange={(e) => setNonStrikerId(e.target.value)}
                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            {battingPlaying11.map((p) => (
                              <option key={p.id} value={p.id} disabled={p.id === strikerId}>
                                {p.name} ({p.role})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Bowling Team & Umpires */}
                <div className="border border-slate-100 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
                      {renderTeamLogo(bowlingTeam.badgeType, 'w-7 h-7')}
                      <h4 className="font-bold text-slate-900 text-base">
                        Bowling Team - {bowlingTeam.name}
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Opening Bowler
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                            🔴
                          </span>
                          <select
                            value={bowlerId}
                            onChange={(e) => setBowlerId(e.target.value)}
                            className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            {bowlingPlaying11.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.role})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Umpires{' '}
                          <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <span className="text-[10px] text-slate-400 block mb-1">
                              On-field Umpire 1
                            </span>
                            <div className="relative">
                              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <select
                                value={umpire1}
                                onChange={(e) => setUmpire1(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                              >
                                {umpires.map((u) => (
                                  <option key={u.id} value={u.name}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>

                          <div className="relative">
                            <span className="text-[10px] text-slate-400 block mb-1">
                              On-field Umpire 2
                            </span>
                            <div className="relative">
                              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <select
                                value={umpire2}
                                onChange={(e) => setUmpire2(e.target.value)}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                              >
                                {umpires.map((u) => (
                                  <option key={u.id} value={u.name}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartLiveScoring}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] transition text-base cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Live Scoring 🚀</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTIVATED LIVE SCORING VIEW */}
          {isLiveActive && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                      LIVE MATCH
                    </span>
                    <span className="text-xs text-slate-300">
                      • {venues.find((v) => v.id === selectedVenue)?.name}, {city}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsLiveActive(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Back to Setup Wizard
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {renderTeamLogo(battingTeam.badgeType, 'w-10 h-10')}
                      <div>
                        <h3 className="text-2xl font-black text-white">{battingTeam.name}</h3>
                        <p className="text-xs text-slate-400">1st Innings (Batting)</p>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-3 mt-4">
                      <span className="text-5xl font-black text-white">
                        {liveRuns}/{liveWickets}
                      </span>
                      <span className="text-lg font-semibold text-slate-400">
                        ({currentOversText} ov)
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded bg-blue-500/30 text-blue-300 font-semibold border border-blue-400/40">
                        CRR:{' '}
                        {liveLegalBalls > 0
                          ? ((liveRuns / liveLegalBalls) * 6).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-white/10">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        🏏 Striker:{' '}
                        <span className="text-amber-300 font-bold">
                          {battingPlaying11.find((p) => p.id === strikerId)?.name || 'Striker'} *
                        </span>
                      </span>
                      <span className="text-slate-400">On Strike</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-white/10">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        🏏 Non-Striker:{' '}
                        <span className="text-white">
                          {battingPlaying11.find((p) => p.id === nonStrikerId)?.name ||
                            'Non-Striker'}
                        </span>
                      </span>
                      <span className="text-slate-400">Runner</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        🔴 Bowler:{' '}
                        <span className="text-sky-300 font-bold">
                          {bowlingPlaying11.find((p) => p.id === bowlerId)?.name || 'Bowler'}
                        </span>
                      </span>
                      <span className="text-slate-400">
                        {Math.floor(liveLegalBalls / 6)}.{liveLegalBalls % 6} ov
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-300">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recent Ball Events:</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {liveBallHistory.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">
                        Waiting for first ball delivery...
                      </span>
                    ) : (
                      liveBallHistory.map((b, i) => (
                        <span
                          key={i}
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${b === '4'
                              ? 'bg-blue-600 text-white'
                              : b === '6'
                                ? 'bg-purple-600 text-white animate-bounce'
                                : b === 'W'
                                  ? 'bg-red-600 text-white font-black'
                                  : b.includes('wd') || b.includes('nb')
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white/20 text-white'
                            }`}
                        >
                          {b}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Scorer Controls */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Quick Scoring Controller (Simulate live deliveries)
                </h4>

                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                  <button
                    onClick={() => recordBall('0')}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    onClick={() => recordBall('1')}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    1
                  </button>
                  <button
                    onClick={() => recordBall('2')}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    2
                  </button>
                  <button
                    onClick={() => recordBall('3')}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    3
                  </button>
                  <button
                    onClick={() => recordBall('4')}
                    className="p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    4 🏏
                  </button>
                  <button
                    onClick={() => recordBall('6')}
                    className="p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    6 🚀
                  </button>
                  <button
                    onClick={() => recordBall('WD')}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    Wide
                  </button>
                  <button
                    onClick={() => recordBall('NB')}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    No-Ball
                  </button>
                  <button
                    onClick={() => recordBall('W')}
                    className="p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm transition shadow-2xs active:scale-95 cursor-pointer"
                  >
                    Wicket 🔴
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {showTournamentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-600" />
                Create New Tournament
              </h3>
              <button
                onClick={() => setShowTournamentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tournament Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai Champions Trophy 2026"
                  value={newTournamentName}
                  onChange={(e) => setNewTournamentName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Format</label>
                <select
                  value={newTournamentFormat}
                  onChange={(e) =>
                    setNewTournamentFormat(e.target.value as 'T20' | 'ODI' | 'Custom')
                  }
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="T20">T20 (20 Overs)</option>
                  <option value="ODI">ODI (50 Overs)</option>
                  <option value="Custom">Custom Overs</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTournamentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newTournamentName.trim()) {
                      const newId = String(Date.now());
                      const newTourn: Tournament = {
                        id: newId,
                        name: newTournamentName.trim(),
                        format: newTournamentFormat,
                        startDate: new Date().toISOString().split('T')[0]
                      };
                      setTournaments([...tournaments, newTourn]);
                      setSelectedTournament(newId);
                      setNewTournamentName('');
                      setShowTournamentModal(false);
                    }
                  }}
                  className="px-5 py-2.5 text-sm font-semibold bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-xl shadow-sm cursor-pointer"
                >
                  Create Tournament
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Add New Cricket Team
              </h3>
              <button
                onClick={() => setShowTeamModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pune Panthers"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Home City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune"
                  value={newTeamCity}
                  onChange={(e) => setNewTeamCity(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newTeamName.trim()) {
                      const newId = `team-${Date.now()}`;
                      const newTeam: Team = {
                        id: newId,
                        name: newTeamName.trim(),
                        city: newTeamCity.trim() || 'Local',
                        color: '#0284c7',
                        badgeType: 'blue-swoosh',
                        players: Array.from({ length: 12 }, (_, i) => ({
                          id: `p-${newId}-${i + 1}`,
                          number: i + 1,
                          name: `Player ${i + 1}`,
                          role: i < 4 ? 'Batter' : i < 6 ? 'All-rounder' : i < 7 ? 'Wicketkeeper' : 'Bowler'
                        }))
                      };
                      setTeams([...teams, newTeam]);
                      setNewTeamName('');
                      setNewTeamCity('');
                      setShowTeamModal(false);
                    }
                  }}
                  className="px-5 py-2.5 text-sm font-semibold bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-xl shadow-sm cursor-pointer"
                >
                  Add Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangeTeamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Select Team {showChangeTeamModal === 'team1' ? '1 (Home)' : '2 (Away)'}
              </h3>
              <button
                onClick={() => setShowChangeTeamModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
              {teams.map((t) => {
                const isSelected =
                  showChangeTeamModal === 'team1' ? team1Id === t.id : team2Id === t.id;
                const isOtherTeam =
                  showChangeTeamModal === 'team1' ? team2Id === t.id : team1Id === t.id;

                return (
                  <button
                    key={t.id}
                    disabled={isOtherTeam}
                    onClick={() => {
                      if (showChangeTeamModal === 'team1') {
                        setTeam1Id(t.id);
                      } else {
                        setTeam2Id(t.id);
                      }
                      setShowChangeTeamModal(null);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition cursor-pointer ${isSelected
                        ? 'border-blue-600 bg-blue-50/50'
                        : isOtherTeam
                          ? 'opacity-40 cursor-not-allowed bg-slate-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {renderTeamLogo(t.badgeType, 'w-9 h-9')}
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">{t.name}</h5>
                        <p className="text-xs text-slate-500">
                          {t.city} • {t.players.length} players
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                    {isOtherTeam && (
                      <span className="text-[10px] text-slate-400 font-semibold">Already Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD PLAYER MODAL */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {editingPlayer.isNew ? (
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                    {editingPlayer.isNew ? 'Add Squad Member' : 'Edit Player Details'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {teams.find((t) => t.id === editingPlayer.teamId)?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePlayer();
              }}
              className="space-y-4"
            >
              {/* Name & Jersey Number */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Player Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Virat Kohli"
                    value={editPlayerName}
                    onChange={(e) => setEditPlayerName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jersey #
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={editPlayerNumber}
                    onChange={(e) => setEditPlayerNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-white text-center"
                  />
                </div>
              </div>

              {/* Primary Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Playing Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Batter', 'All-rounder', 'Bowler', 'Wicketkeeper'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditPlayerRole(r)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        editPlayerRole === r
                          ? 'border-2 border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span>
                        {r === 'Batter'
                          ? '🏏'
                          : r === 'Bowler'
                          ? '⚡'
                          : r === 'All-rounder'
                          ? '✨'
                          : '🧤'}
                      </span>
                      <span>{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Batting & Bowling Styles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batting Style
                  </label>
                  <select
                    value={editBattingStyle}
                    onChange={(e) => setEditBattingStyle(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Right-hand bat">Right-hand bat</option>
                    <option value="Left-hand bat">Left-hand bat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bowling Style
                  </label>
                  <select
                    value={editBowlingStyle}
                    onChange={(e) => setEditBowlingStyle(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Right-arm fast">Right-arm fast</option>
                    <option value="Right-arm medium">Right-arm medium</option>
                    <option value="Left-arm fast">Left-arm fast</option>
                    <option value="Left-arm medium">Left-arm medium</option>
                    <option value="Right-arm off-spin">Right-arm off-spin</option>
                    <option value="Right-arm leg-spin">Right-arm leg-spin</option>
                    <option value="Slow left-arm orthodox">Slow left-arm orthodox</option>
                    <option value="None">None / Non-bowler</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editPlayerName.trim()}
                  className="px-5 py-2 text-xs sm:text-sm font-semibold bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {editingPlayer.isNew ? 'Add Player' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
