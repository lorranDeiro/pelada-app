import type { SeasonStats, RankedPlayer } from './types';
import { computeWinProbability } from './win-probability';

export interface TeamSectors {
  attack: number;
  defense: number;
  stamina: number;
}

export interface SimulationMoment {
  minute: number;
  type: 'GOAL' | 'SAVE' | 'TACTICAL' | 'WHISTLE';
  team: 1 | 2;
  player_name?: string;
  description: string;
}

export interface MatchSimulation {
  scoreA: number;
  scoreB: number;
  winProbA: number;
  winProbB: number;
  sectorsA: TeamSectors;
  sectorsB: TeamSectors;
  timeline: SimulationMoment[];
  keyBattle: {
    playerA: SeasonStats | RankedPlayer;
    playerB: SeasonStats | RankedPlayer;
    labelA: string;
    labelB: string;
  };
}

function calculatePlayerSectors(p: SeasonStats | any) {
  const mp = p.matches_played || p.matches_played_season || 1;
  const attack = ((p.goals || 0) + (p.assists || 0) * 0.4) / mp;
  const defense = (p.saves || 0) / mp;
  const stamina = (p.avg_rating || p.skill_level || 3) / 5;

  return { attack, defense, stamina };
}

export function simulateMatch(
  teamA: (SeasonStats | RankedPlayer)[],
  teamB: (SeasonStats | RankedPlayer)[]
): MatchSimulation {
  // Defensive check: ensure teams are not empty to prevent crashes
  const safeTeamA = teamA.length > 0 ? teamA : [{ name: 'Equipa A', avg_rating: 3, skill_level: 3, position: 'JOGADOR' } as any];
  const safeTeamB = teamB.length > 0 ? teamB : [{ name: 'Equipa B', avg_rating: 3, skill_level: 3, position: 'JOGADOR' } as any];

  // 1. Sector Strengths
  const sectorsA = { attack: 0, defense: 0, stamina: 0 };
  const sectorsB = { attack: 0, defense: 0, stamina: 0 };

  safeTeamA.forEach((p) => {
    const s = calculatePlayerSectors(p);
    sectorsA.attack += s.attack;
    sectorsA.defense += s.defense;
    sectorsA.stamina += s.stamina;
  });

  safeTeamB.forEach((p) => {
    const s = calculatePlayerSectors(p);
    sectorsB.attack += s.attack;
    sectorsB.defense += s.defense;
    sectorsB.stamina += s.stamina;
  });

  // Normalize sectors (0-100 scale for UI)
  const normalize = (val: number, max: number) => Math.min(Math.round((val / (max || 1)) * 100), 100);
  const normSectorsA = {
    attack: normalize(sectorsA.attack, 2.5),
    defense: normalize(sectorsA.defense, 1.5),
    stamina: normalize(sectorsA.stamina, 5),
  };
  const normSectorsB = {
    attack: normalize(sectorsB.attack, 2.5),
    defense: normalize(sectorsB.defense, 1.5),
    stamina: normalize(sectorsB.stamina, 5),
  };

  // 2. Probabilities
  const strengthA = safeTeamA.reduce((acc, p) => acc + (p.avg_rating || (p as any).skill_level || 3), 0);
  const strengthB = safeTeamB.reduce((acc, p) => acc + (p.avg_rating || (p as any).skill_level || 3), 0);
  const { pA, pB } = computeWinProbability(strengthA, strengthB);

  // 3. Projected Score
  const baseExpectation = 6;
  const scoreA = Math.max(0, Math.round(baseExpectation * (pA / 100) + (Math.random() - 0.5)));
  const scoreB = Math.max(0, Math.round(baseExpectation * (pB / 100) + (Math.random() - 0.5)));

  // 4. Timeline
  const timeline: SimulationMoment[] = [];
  
  // Distribute goals
  for (let i = 0; i < scoreA; i++) {
    const minute = Math.floor(Math.random() * 85) + 5;
    const scorer = safeTeamA[Math.floor(Math.random() * safeTeamA.length)];
    timeline.push({
      minute,
      type: 'GOAL',
      team: 1,
      player_name: scorer.name,
      description: `Golo previsto para ${scorer.name}. Finalização precisa após jogada coletiva.`,
    });
  }

  for (let i = 0; i < scoreB; i++) {
    const minute = Math.floor(Math.random() * 85) + 5;
    const scorer = safeTeamB[Math.floor(Math.random() * safeTeamB.length)];
    timeline.push({
      minute,
      type: 'GOAL',
      team: 2,
      player_name: scorer.name,
      description: `Golo previsto para ${scorer.name}. Aproveitou a brecha na defesa adversária.`,
    });
  }

  // Add some saves
  const gkA = safeTeamA.find(p => p.position === 'GOLEIRO_FIXO') || safeTeamA[0];
  const gkB = safeTeamB.find(p => p.position === 'GOLEIRO_FIXO') || safeTeamB[0];

  timeline.push({
    minute: 44,
    type: 'SAVE',
    team: 1,
    player_name: gkA.name,
    description: `Defesa crítica de ${gkA.name} antes do intervalo.`,
  });

  timeline.push({
    minute: 76,
    type: 'TACTICAL',
    team: 2,
    description: `Mudança tática: Equipa 2 recua linhas para segurar o resultado.`,
  });

  timeline.sort((a, b) => a.minute - b.minute);

  // 5. Key Battle
  const playerA = [...safeTeamA].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))[0];
  const playerB = [...safeTeamB].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))[0];

  return {
    scoreA,
    scoreB,
    winProbA: pA,
    winProbB: pB,
    sectorsA: normSectorsA,
    sectorsB: normSectorsB,
    timeline,
    keyBattle: {
      playerA,
      playerB,
      labelA: 'Principal Atacante',
      labelB: 'Referência Técnica',
    },
  };
}
