// =====================================================================
// win-probability.ts — Pre-match win odds (Flashscore-style)
// =====================================================================
//
// Fórmula: logística (sigmóide) sobre a diferença de força composta.
//
//     P(A vence) = 1 / (1 + e^(-k * (S_A - S_B)))
//
// k controla a "agressividade" da curva. Com k = 0.35:
//   diff =  0  →  ~50 / 50
//   diff = +1  →  ~58 / 42
//   diff = +3  →  ~74 / 26
//   diff = +6  →  ~89 / 11
//
// Reservamos uma fatia fixa para empate (peladas 5v5 empatam com
// frequência) e impomos um piso de 3% em cada lado — sempre há ruído
// (chuva, dia inspirado, pneu murcho) e nunca queremos mostrar 0%/100%.
//
// Saída arredondada e somando exatamente 100, pra barra fechar sem gap.

export interface WinProbability {
  pA: number;   // 0..100
  pB: number;   // 0..100
  draw: number; // 0..100
}

const SCALE = 0.35;
const DRAW_RESERVE = 8;
const MIN_SIDE = 3;

export function computeWinProbability(
  strengthA: number,
  strengthB: number
): WinProbability {
  const diff = strengthA - strengthB;
  const sigmoid = 1 / (1 + Math.exp(-SCALE * diff));

  const pool = 100 - DRAW_RESERVE;
  let pA = sigmoid * pool;
  let pB = pool - pA;

  if (pA < MIN_SIDE) { pB -= MIN_SIDE - pA; pA = MIN_SIDE; }
  if (pB < MIN_SIDE) { pA -= MIN_SIDE - pB; pB = MIN_SIDE; }

  const rA = Math.round(pA);
  const rB = Math.round(pB);
  return { pA: rA, pB: rB, draw: 100 - rA - rB };
}
