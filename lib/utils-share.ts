import type { BalancedTeams } from './team-balancer';

export function formatTeamsForWhatsApp(teams: BalancedTeams): string {
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
Escurecidos: ${teams.debug.winProbA.toFixed(0)}%
Coloridos: ${teams.debug.winProbB.toFixed(0)}%

_Gerado pelo Pelada App_ 🛡️
  `.trim();

  return encodeURIComponent(text);
}

export function shareTeamsToWhatsApp(teams: BalancedTeams) {
  const text = formatTeamsForWhatsApp(teams);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}
