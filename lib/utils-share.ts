import type { BalancedTeams } from './team-balancer';
import { computeWinProbability } from './win-probability';

export function formatTeamsForWhatsApp(teams: BalancedTeams): string {
  const { pA, pB } = computeWinProbability(
    teams.debug.strengthA,
    teams.debug.strengthB
  );

  const formatTeam = (name: string, players: any[]) => {
    const list = players
      .map((p) => {
        const icon = p.position === 'GOLEIRO_FIXO' ? '🧤 ' : '';
        const stars = '★'.repeat(p.skill_level);
        return `• ${icon}${p.name} (${stars})`;
      })
      .join('\n');
    return `*${name}*\n${list}`;
  };

  const text = `
⚽ *CONVOCAÇÃO PARA A PELADA* ⚽

${formatTeam('ESCURECIDOS', teams.teamA)}

${formatTeam('COLORIDOS', teams.teamB)}

📊 *Probabilidade de Vitória:*
Escurecidos: ${pA.toFixed(0)}%
Coloridos: ${pB.toFixed(0)}%

_Gerado pelo Pelada App_ 🛡️
  `.trim();

  return encodeURIComponent(text);
}

export function shareTeamsToWhatsApp(teams: BalancedTeams) {
  const text = formatTeamsForWhatsApp(teams);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}
