# 🥊 IMPLEMENTAÇÃO: FEATURE DE COMPARAÇÃO DE JOGADORES

## 📋 VISÃO GERAL

**Objetivo:** Adicionar uma nova tab "Comparar" no Dialog de detalhes do jogador (página de Ranking) que permite comparar 2 jogadores lado-a-lado, com estatísticas comparativas em barras visuais e probabilidade de vitória calculada.

**Localização:** `app/ranking/page.tsx` → Dialog → Nova Tab "Comparar"

**Esforço Total:** ~2.5 horas

**Status:** Pronto para implementação

---

## 🎯 ESCOPO TÉCNICO

### Dados Disponíveis ✅

```typescript
// SeasonStats (já existe em lib/types.ts)
interface SeasonStats {
  player_id: string;
  name: string;
  position: PlayerPosition;
  photo_url: string | null;
  season_id: string;
  matches_played: number;
  total_points: number;
  avg_rating: number;        // ← Para calcular odds
  goals: number;              // ← Para stats comparativas
  assists: number;
  saves: number;
  wins: number;
  draws: number;
  losses: number;
  mvp_count: number;
  dynamic_rating?: number;    // ← Para OVR do card
}

// Função de odds (já existe)
computeWinProbability(strengthA: number, strengthB: number): WinProbability
// Retorna: { pA: number, pB: number, draw: number }
```

### Componentes Reutilizáveis ✅

- ✅ `PlayerFifaCard` - Renderizar 2 cards lado-a-lado
- ✅ `WinProbabilityBar` - Mostrar odds (adaptar labels)
- ✅ `getPlayerBadges()` - Badges para cards
- ✅ Icons lucide-react - Para ícones das métricas
- ✅ Tailwind CSS - Layout responsive

---

## 📁 ESTRUTURA DE ARQUIVOS

```
components/
├── player-comparison.tsx          [NOVO] - Container principal
├── player-selector.tsx            [NOVO] - Seletor de jogador 2
├── comparison-stats-bars.tsx      [NOVO] - Stats comparativas em barras
├── player-fifa-card.tsx           [EXISTENTE] - Reusa
└── win-probability-bar.tsx        [EXISTENTE] - Reusa

app/
└── ranking/
    └── page.tsx                   [MODIFICAR] - Add nova tab + import

lib/
└── types.ts                       [VERIFY] - SeasonStats já tem tudo
```

---

## 🔧 PASSO-A-PASSO IMPLEMENTAÇÃO

### PASSO 1: Criar `components/player-selector.tsx`

**Responsabilidade:** Dropdown/Lista para selecionar o jogador 2

**Props:**
```typescript
interface PlayerSelectorProps {
  allStats: SeasonStats[];
  selectedId?: string;
  excludeId: string;              // ID do jogador 1 (para não comparar consigo mesmo)
  onSelect: (player: SeasonStats) => void;
}
```

**Comportamento:**
- Campo de search (input text) com debounce 300ms
- Lista de jogadores abaixo (scrollável, max-height 400px)
- Filtra por nome (case-insensitive)
- Exclui o jogador 1 (excludeId)
- Click em um jogador chama `onSelect()`
- Mostra: Avatar + Nome + OVR + Posição + PJ
- Badge de tier (bronze/silver/gold/legend) ao lado do OVR

**Estilos:**
```tsx
// Container
className="border border-fs-border rounded-lg bg-fs-surface p-4"

// Search input
className="w-full px-3 py-2 rounded border border-fs-border bg-fs-surface-2 text-fs-text placeholder:text-fs-text-dim focus:border-fs-accent focus:ring-2 focus:ring-fs-accent/30"

// Item jogador
className="p-3 cursor-pointer rounded transition-colors hover:bg-fs-surface-2 border-l-2 border-transparent hover:border-fs-text-dim"

// Item selecionado
className="... border-l-2 border-fs-accent bg-fs-surface-2"
```

**Lista de Jogadores:**
```
👤 Nome do Jogador
   ⭐ OVR 85  •  AG  •  10 PJ
   [com avatar pequeno à esquerda]
```

---

### PASSO 2: Criar `components/comparison-stats-bars.tsx`

**Responsabilidade:** Renderizar 6 métricas em barras comparativas

**Props:**
```typescript
interface ComparisonStatsBarsProps {
  player1: SeasonStats;
  player2: SeasonStats;
}
```

**Métricas (ordem):**
1. ⚽ GOLS (goals)
2. 🤝 ASSISTÊNCIAS (assists)
3. 🛡️ DEFESAS (saves)
4. 🏆 VITÓRIAS (wins)
5. ⭐ RATING MÉDIO (avg_rating)
6. 👑 MVPs (mvp_count)

**Estrutura de cada métrica:**
```
┌──────────────────────────────────────┐
│ ⚽ GOLS                               │
│ João (5)  ████████░░░░░░░░░░░░  (8) Pedro  │
│                                      │
└──────────────────────────────────────┘
```

**Lógica de cores:**
```typescript
const isPlayer1Better = player1[metric] > player2[metric];

// Left bar (player 1)
leftColor = isPlayer1Better 
  ? 'from-accent-bright to-accent'      // Verde se ganhou
  : 'from-slate-600 to-slate-500';      // Cinza se perdeu

// Right bar (player 2)
rightColor = !isPlayer1Better 
  ? 'from-pink-500 to-pink-700'         // Rosa se ganhou
  : 'from-pink-300 to-pink-500';        // Rosa claro se perdeu
```

**Estilos:**
```tsx
// Container principal
className="rounded-lg border border-fs-border bg-fs-surface p-4"

// Header (ícone + label)
className="mb-3 flex items-center gap-2"

// Label
className="text-xs font-semibold uppercase tracking-wider text-fs-text-dim"

// Barra container
className="relative h-2 w-full overflow-hidden rounded-full bg-fs-surface-2"

// Left segment
className="absolute inset-y-0 left-0 bg-gradient-to-r transition-[width] duration-500"

// Right segment
className="absolute inset-y-0 right-0 bg-gradient-to-l transition-[width] duration-500"

// Valores
className="mt-1 flex items-center justify-between text-xs font-medium"
leftValue: className={isPlayer1Better ? 'text-accent-bright' : 'text-slate-400'}
rightValue: className={!isPlayer1Better ? 'text-pink-400' : 'text-pink-300'}
```

**Cálculo da barra:**
```typescript
const maxValue = Math.max(player1[metric], player2[metric]);
const percent1 = (player1[metric] / maxValue) * 100;
const percent2 = (player2[metric] / maxValue) * 100;
```

---

### PASSO 3: Criar `components/player-comparison.tsx`

**Responsabilidade:** Container principal, gerencia state e layout

**Props:**
```typescript
interface PlayerComparisonProps {
  player1: SeasonStats;
  allStats: SeasonStats[];
  seasonId: string;
}
```

**State:**
```typescript
const [player2, setPlayer2] = useState<SeasonStats | null>(null);
const [searchQuery, setSearchQuery] = useState('');
```

**Layout Desktop (≥768px):**
```
┌──────────────────────┬─────────────────────────────────┐
│                      │                                 │
│    [Card 1]          │   [PlayerSelector]              │
│   (max-w-280px)      │   [Seletor dropdown/list]       │
│                      │                                 │
│                      │   [Card 2 - após seleção]       │
│                      │   (max-w-280px)                 │
│                      │                                 │
└──────────────────────┴─────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│            [ComparisonStatsBars]                        │
│  ⚽ GOLS, 🤝 ASSIST, 🛡️ DEFESAS, 🏆 VIT, ⭐ RATING, 👑 MVP│
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│            [WinProbabilityBar]                          │
│  ⚡ QUEM VENCE? Player1 45% | Draw 7% | Player2 48%    │
└─────────────────────────────────────────────────────────┘
```

**Layout Mobile (<768px):**
```
[Card 1 - w-full]
    ↓
[Seletor dropdown]
    ↓
[Card 2 - w-full]
    ↓
[ComparisonStatsBars - w-full]
    ↓
[WinProbabilityBar - w-full]
```

**Estrutura JSX:**
```tsx
export function PlayerComparison({ player1, allStats, seasonId }: PlayerComparisonProps) {
  const [player2, setPlayer2] = useState<SeasonStats | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🥊</span>
        <h3 className="text-sm font-semibold text-fs-text">
          Comparação de Jogadores
        </h3>
      </div>

      {/* Cards Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Card 1 */}
        <div>
          <PlayerFifaCard
            stats={player1}
            badges={getPlayerBadges(player1, allStats)}
            hideDownload={true}
          />
        </div>

        {/* Card 2 + Seletor */}
        <div className="space-y-3">
          <PlayerSelector
            allStats={allStats}
            selectedId={player2?.player_id}
            excludeId={player1.player_id}
            onSelect={setPlayer2}
          />

          {player2 && (
            <div className="animate-fade-in">
              <PlayerFifaCard
                stats={player2}
                badges={getPlayerBadges(player2, allStats)}
                hideDownload={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Comparativas */}
      {player2 && (
        <div className="animate-fade-in">
          <ComparisonStatsBars player1={player1} player2={player2} />
        </div>
      )}

      {/* Odds */}
      {player2 && (
        <div className="animate-fade-in">
          <div className="rounded-lg border border-fs-border bg-fs-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h4 className="text-sm font-semibold text-fs-text">
                Quem Vence?
              </h4>
            </div>

            <p className="mb-3 text-xs text-fs-text-dim text-center">
              {player1.name} ({player1.avg_rating.toFixed(1)}) vs{' '}
              {player2.name} ({player2.avg_rating.toFixed(1)})
            </p>

            <WinProbabilityBar
              strengthA={player1.avg_rating}
              strengthB={player2.avg_rating}
              labelA={player1.name}
              labelB={player2.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Imports necessários:**
```typescript
'use client';

import { useState } from 'react';
import { PlayerFifaCard } from '@/components/player-fifa-card';
import { PlayerSelector } from '@/components/player-selector';
import { ComparisonStatsBars } from '@/components/comparison-stats-bars';
import { WinProbabilityBar } from '@/components/win-probability-bar';
import { getPlayerBadges } from '@/lib/achievements';
import type { SeasonStats } from '@/lib/types';
```

---

### PASSO 4: Integrar no Dialog (`app/ranking/page.tsx`)

**Localização:** Onde está o Dialog com as Tabs

**Mudanças:**

1. **Import do novo componente:**
```tsx
import { PlayerComparison } from '@/components/player-comparison';
```

2. **Atualizar TabsList (adicionar 5ª tab):**

```tsx
// ANTES:
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="card">Carta</TabsTrigger>
  <TabsTrigger value="radar">Radar</TabsTrigger>
  <TabsTrigger value="stats">Stats</TabsTrigger>
  <TabsTrigger value="progress">Evolução</TabsTrigger>
</TabsList>

// DEPOIS:
<TabsList className="grid w-full grid-cols-5">
  <TabsTrigger value="card">Carta</TabsTrigger>
  <TabsTrigger value="radar">Radar</TabsTrigger>
  <TabsTrigger value="stats">Stats</TabsTrigger>
  <TabsTrigger value="progress">Evolução</TabsTrigger>
  <TabsTrigger value="compare">🥊 Comparar</TabsTrigger>
</TabsList>
```

3. **Adicionar nova TabsContent:**

```tsx
<TabsContent value="compare">
  <PlayerComparison
    player1={cardStats}
    allStats={displayStats}
    seasonId={selectedTab}
  />
</TabsContent>
```

4. **Expandir Dialog (opcional, para mais espaço em desktop):**

```tsx
// ANTES:
<DialogContent className="sm:max-w-md">

// DEPOIS:
<DialogContent className="sm:max-w-2xl md:max-w-4xl">
```

---

## 🎨 DESIGN SYSTEM

### Paleta de Cores

```typescript
// Backgrounds
bg-fs-surface           // #1a2335
bg-fs-surface-2         // #232f42 (hover)

// Text
text-fs-text            // #e2e8f0 (primary)
text-fs-text-dim        // #94a3b8 (secondary)

// Borders
border-fs-border        // #3a4a62
border-fs-accent        // #22c55e (active)

// Stat Bars
from-slate-600          // #475569 (Player 1)
from-slate-500          // #64748b (Player 1 light)
from-pink-500           // #ec4899 (Player 2)
from-pink-700           // #be185d (Player 2 dark)

// Draw
amber-400               // #fbbf24
```

### Tipografia

```
Header (⚽ GOLS):        text-xs font-semibold uppercase
Valores (5, 8):         text-sm font-medium
Meta info:              text-xs text-fs-text-dim
```

### Spacing

```
Gap entre cards:        gap-6 (24px)
Gap entre seções:       space-y-6
Padding containers:     p-4
```

### Animações

```typescript
// Fade in (quando player2 selecionado)
className="animate-fade-in"

// Width das barras (já existe no tailwind)
className="transition-[width] duration-500"

// Deve adicionar em tailwind.config.ts se não existir:
animation: {
  'fade-in': 'fadeIn 0.3s ease-out',
}

keyframes: {
  fadeIn: {
    '0%': { opacity: '0', transform: 'translateY(-10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Componentes

- [ ] `components/player-selector.tsx` (120 linhas)
- [ ] `components/comparison-stats-bars.tsx` (100 linhas)
- [ ] `components/player-comparison.tsx` (150 linhas)

### Integração

- [ ] `app/ranking/page.tsx` - Adicionar import PlayerComparison
- [ ] `app/ranking/page.tsx` - Adicionar TabsTrigger "Comparar"
- [ ] `app/ranking/page.tsx` - Adicionar TabsContent value="compare"
- [ ] `app/ranking/page.tsx` - Expandir DialogContent (optional)

### Verificações

- [ ] Dialog abre/fecha normalmente
- [ ] Tab "Comparar" renderiza player1 card
- [ ] PlayerSelector renderiza lista de jogadores
- [ ] Click em jogador da lista atualiza player2
- [ ] ComparisonStatsBars renderiza 6 stats
- [ ] WinProbabilityBar calcula odds corretamente
- [ ] Animações funcionam (fade-in, width)
- [ ] Mobile: layout stacked corretamente
- [ ] Desktop: layout 2 colunas correto
- [ ] Search no seletor funciona (debounce)
- [ ] Jouador 1 é excluído da lista de seleção

### Testes

- [ ] Abrir ranking → click em jogador → tab comparar
- [ ] Selecionar outro jogador
- [ ] Verificar cores das barras (verde vs rosa)
- [ ] Verificar cálculo de odds (avg_rating)
- [ ] Mobile responsiveness (<768px)
- [ ] Desktop responsiveness (≥768px)

---

## 🔄 WORKFLOW DETALHADO

### Passo 1: Criar PlayerSelector
1. Create file `components/player-selector.tsx`
2. Implement search input com debounce
3. Implement list rendering com filter
4. Style com tailwind
5. Test com mock data

### Passo 2: Criar ComparisonStatsBars
1. Create file `components/comparison-stats-bars.tsx`
2. Define array de 6 metrics (goals, assists, saves, wins, avg_rating, mvp_count)
3. Implement bar rendering con colores dinâmicas
4. Implement lógica de cores (isPlayer1Better)
5. Test com dados do ranking

### Passo 3: Criar PlayerComparison
1. Create file `components/player-comparison.tsx`
2. Implement state management (player2)
3. Implement layout grid (1 col mobile, 2 col desktop)
4. Render PlayerSelector + Card 1 + Card 2
5. Render ComparisonStatsBars (condicional)
6. Render WinProbabilityBar (condicional)
7. Test rendering com 2 players

### Passo 4: Integrar no Ranking Page
1. Open `app/ranking/page.tsx`
2. Add import: `import { PlayerComparison } from '@/components/player-comparison';`
3. Find TabsList component
4. Update grid-cols-4 → grid-cols-5
5. Add new TabsTrigger: `<TabsTrigger value="compare">🥊 Comparar</TabsTrigger>`
6. Find TabsContent section
7. Add new TabsContent:
```tsx
<TabsContent value="compare">
  <PlayerComparison
    player1={cardStats}
    allStats={displayStats}
    seasonId={selectedTab}
  />
</TabsContent>
```
8. (Optional) Expand DialogContent className

### Passo 5: Testar Tudo
1. npm run dev
2. Go to /ranking
3. Click on player
4. Click "Comparar" tab
5. Verify rendering
6. Select another player
7. Verify stats appear
8. Test mobile (< 640px)
9. Test desktop (>= 768px)

---

## 🚨 CONSIDERAÇÕES IMPORTANTES

### Performance

- ✅ Dados já carregados em `displayStats` (todas as SeasonStats)
- ✅ Sem queries adicionais necessárias
- ✅ Sem chamadas API extras
- ✅ Search debounce previne re-renders excessivos

### Acessibilidade

- ✅ Use semantic HTML (`<button>`, `<input>`)
- ✅ Add aria-labels em ícones
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Focus states visíveis (ring-2 ring-fs-accent)

### Mobile Responsiveness

- Mobile first approach
- Grid: `grid-cols-1 md:grid-cols-2`
- Cards: `w-full` mobile, `max-w-280px` desktop
- Seletor: input full-width, list scrollável
- Stats barras: full-width

### Estado Vazio

```tsx
{!player2 && (
  <div className="rounded-lg border border-fs-border bg-fs-surface p-4 text-center text-xs text-fs-text-dim">
    Selecione um adversário para comparar
  </div>
)}
```

---

## 📚 REFERÊNCIAS

### Arquivos Existentes
- `lib/win-probability.ts` - Função computeWinProbability
- `lib/achievements.ts` - getPlayerBadges, getCardTier
- `components/player-fifa-card.tsx` - Reutilizar
- `components/win-probability-bar.tsx` - Reutilizar
- `tailwind.config.ts` - Checar se fade-in animation existe
- `lib/types.ts` - SeasonStats interface

### Componentes Reutilizáveis
```tsx
// CardTier
const tier = getCardTier(player.dynamic_rating);
const badges = getPlayerBadges(player, allStats);

// PlayerFifaCard
<PlayerFifaCard stats={player} badges={badges} hideDownload={true} />

// WinProbabilityBar
const { pA, pB, draw } = computeWinProbability(player1.avg_rating, player2.avg_rating);
<WinProbabilityBar strengthA={...} strengthB={...} labelA={...} labelB={...} />
```

---

## 🎯 RESULTADO ESPERADO

Após implementação, quando um usuário:

1. **Abre ranking** → clica em um jogador
2. **Clica na tab "Comparar"** → vê:
   - Card 1 (jogador selecionado)
   - Seletor com lista de outros jogadores
   - Possa digitar para buscar
3. **Seleciona outro jogador** → vê aparacer:
   - Card 2 (fade-in animation)
   - 6 métricas em barras comparativas (com cores dinâmicas)
   - Odds de vitória calculadas
4. **Muda de jogador** → tudo re-renderiza suavemente
5. **Em mobile** → scroll vertical, cards full-width
6. **Em desktop** → layout 2 colunas, sidebar com lista

**Feature completa, responsiva, performática e divertida para "zoar amigos"** ✅

---

## 📝 NOTAS FINAIS

- Este documento é um prompt estruturado para Claude Opus
- Siga os passos 1-5 na ordem
- Teste após cada passo
- Se houver dúvidas, refira-se às seções de Design System e Referências
- O código deve seguir o padrão do projeto existente (shadcn/ui, Tailwind, types)
- Nenhuma mudança na database necessária
- Nenhuma mudança na API necessária
