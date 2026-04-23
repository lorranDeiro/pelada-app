# Manual Team Assembly - Implementation Guide

## 📋 Overview

O **Manual Team Assembly** é uma funcionalidade que permite ao administrador montar manualmente as equipas (Equipa A vs Equipa B) em vez de usar apenas o sorteio automático balanceado.

**Fluxo de UX:**
```
Check-in (selecionar jogadores)
    ↓
Mode Selection (escolher: Automático ou Manual)
    ├→ Sorteio Automático (algoritmo balanceado)
    │   ↓
    │   Teams Preview (confirmação)
    │
    └→ Montagem Manual (seleção intuitiva)
        ↓
        Manual Team Selector (arrastar/mover jogadores)
        ↓
        Save Formation (criar partida)
```

---

## 🎯 Componentes Implementados

### 1. **ManualTeamSelector Component** (`components/manual-team-selector.tsx`)

Interface visual com três colunas:
- **⚪ Equipa A (Brancos)** - jogadores atribuídos ao lado esquerdo
- **⬇️ Não Atribuídos** - jogadores esperando atribuição (centro)
- **🔵 Equipa B (Coloridos)** - jogadores atribuídos ao lado direito

**Funcionalidades:**
- ✅ Progress bar visual (X/Total jogadores atribuídos)
- ✅ Botões para mover jogadores (setas esq/dir)
- ✅ Botão para remover da equipa (volta a "Não Atribuídos")
- ✅ Botão para trocar entre equipas instantaneamente
- ✅ Cards com nome, posição (goleiro), nível de habilidade
- ✅ Hover effects intuitivos
- ✅ Validação obrigatória (não permite salvar se houver não atribuídos)
- ✅ Estados de loading durante salvamento

**Props:**
```typescript
interface ManualTeamSelectorProps {
  players: RankedPlayer[];           // Lista de todos os jogadores
  teamA?: RankedPlayer[];            // Equipa A pré-preenchida (opcional)
  teamB?: RankedPlayer[];            // Equipa B pré-preenchida (opcional)
  onSave: (teamA, teamB) => Promise<void>;  // Callback ao salvar
  isLoading?: boolean;               // Estado de loading
}
```

---

### 2. **Team Selector Functions** (`lib/team-selector.ts`)

Funções auxiliares para persistência e validação:

#### `assignTeamsManually(matchId, teamA, teamB)`
```typescript
// Atualiza match_attendances com as atribuições manuais
// Valida contagem de jogadores
// Atualiza status da partida para LIVE
// Retorna result: { success, message, matchId, errors }
```

**Exemplo de uso:**
```typescript
const result = await assignTeamsManually(
  'match-123',
  [player1, player2, player3],  // Team A
  [player4, player5, player6]   // Team B
);

if (result.success) {
  toast.success(result.message);
}
```

#### `swapPlayerTeam(matchId, playerId, newTeam)` 
Para trocar rapidamente um jogador após a montagem:
```typescript
const result = await swapPlayerTeam('match-123', 'player-id', 2); // Mover para Team B
```

#### `validateTeamFormation(matchId)`
Validação completa com checklist:
- ✓ Ambas as equipas têm jogadores
- ✓ Todos foram atribuídos
- ✓ Distribuição de goleiros (aviso se necessário)

#### `getCurrentFormation(matchId)`
Obtém a formação atual de uma partida:
```typescript
const formation = await getCurrentFormation('match-123');
if (formation) {
  console.log(`Team A: ${formation.teamA.length}`);
  console.log(`Team B: ${formation.teamB.length}`);
}
```

---

### 3. **Page Integration** (`app/partida/nova/page.tsx`)

Nova estrutura com **novo step: `modo-selecao`**

**Type Step agora é:**
```typescript
type Step = 'checkin' | 'modo-selecao' | 'sorteio' | 'formacao-manual';
```

**Fluxo melhorado:**

1. **CheckIn** - Seleção de jogadores (existente, melhorado)
   - Botão agora é "Continuar" em vez de "Sortear"

2. **ModeSelection** - NOVO!
   - Card "Sorteio Automático" com Dice5 icon
   - Card "Montagem Manual" com Hand icon
   - Descrição visual de cada opção
   - Badges: ⚡ Rápido vs 🎯 Preciso

3. **Sorteio** (existente)
   - Teams Preview com opção de re-sortear
   - Confirmar cria partida

4. **FormacaoManual** (NOVO!)
   - Renderiza `<ManualTeamSelector />`
   - Callback `onSave` cria a partida com formação manual

---

## 🚀 Como Usar

### Para o Administrador

1. **Acessar Nova Partida** → `/partida/nova`

2. **Check-in:** Selecionar jogadores confirmados
   ```
   ☐ João Silva    ⭐⭐⭐⭐⭐
   ☑ Maria Santos  ⭐⭐⭐⭐
   ☑ Pedro Costa   ⭐⭐⭐
   ...
   ```

3. **Escolher Modo:**
   - **Sorteio Automático** → Sistema balanceia automaticamente
   - **Montagem Manual** → Você controla quem vai em cada equipa

4. **Se escolher Manual:**
   ```
   ⚪ EQUIPA A          ⬇️ NÃO ATRIBUÍDOS    🔵 EQUIPA B
   
   └─ João Silva       ├─ Maria Santos      └─ (vazio)
   └─ Pedro Costa      ├─ Ana Silva
                       └─ Carlos Oliveira
   
   Força: 12.5         ⬅️ ➡️ Move players     Força: (a atualizar)
   ```

5. **Atribuir Jogadores:**
   - Clique em `⬅️` para mover para Equipa A
   - Clique em `➡️` para mover para Equipa B
   - Clique em `🔄` para remover de uma equipa
   - Clique em `⬅️/➡️` nos cards das equipas para trocar entre elas

6. **Salvar Formação:**
   - Botão só ativa quando **todos** os jogadores estão atribuídos
   - Sistema cria a partida e leva para `/partida/{id}`

---

## 🔌 Integração com Banco de Dados

### Tabela: `match_attendances`
```sql
-- Antes: team = 1 ou 2 atribuído automaticamente pelo sorteio
-- Agora: team pode ser atribuído manualmente

UPDATE match_attendances
SET team = 1  -- 1=Equipa A, 2=Equipa B
WHERE match_id = 'match-123' AND player_id = 'player-456';
```

### Estado da Partida
```sql
-- Ao criar e confirmar a formação
UPDATE matches
SET status = 'LIVE'  -- Pronto para começar
WHERE id = 'match-123' AND status = 'DRAFT';
```

---

## 🎨 Design System Integration

O componente usa obrigatoriamente o **BRAND_STYLE_GUIDE.md:**

- ✅ Cores: `bg-surface`, `bg-accent`, `text-text-primary`, etc.
- ✅ Cards: `rounded-xl`, `border-surface-border`, `hover:border-accent/50`
- ✅ Botões: Gradient `from-accent to-accent-bright`
- ✅ Typography: Heading 2/3, body text com `text-text-secondary`
- ✅ Badges: Badges com variants `outline` e cores customizadas
- ✅ Dark mode: Totalmente suportado (design nativo em dark)

---

## 📱 Responsividade

O componente é **fully responsive:**

```
MOB: 1 coluna (stack vertical)
├─ Equipa A
├─ Não Atribuídos
└─ Equipa B

TAB/DESK: 3 colunas (grid-cols-3)
├─ Equipa A | Não Atribuídos | Equipa B
```

---

## 🔐 Permissões & RLS

A funcionalidade respeita as **Row Level Security policies** do Supabase:

```sql
-- Qualquer authenticated user pode:
✓ Atualizar team em match_attendances
✓ Criar/editar match_edit_log para auditoria
✓ Ler dados da partida

-- Dados sensíveis:
✓ Admin apenas → update em matches FINISHED
✓ Public ranking → SELECT apenas
```

---

## 🧪 Testando Localmente

```bash
# 1. Build
npm run build

# 2. Dev server
npm run dev

# 3. Acessar
http://localhost:3000/partida/nova

# 4. Testar fluxo
- Check-in (selecionar 4+ jogadores)
- Clicar "Continuar"
- Escolher "Montagem Manual"
- Distribua os jogadores
- Salvar Formação
```

---

## 🤝 Boas Práticas

### Para Admins
1. ✅ Sempre validar **todos os jogadores foram atribuídos** antes de salvar
2. ✅ Considerar distribuição de **goleiros** entre as equipas
3. ✅ Usar "Trocar" (`⬅️/➡️`) para ajustes rápidos em vez de remover/readicionar
4. ✅ Se precisar de grandes mudanças, voltar e escolher "Sorteio Automático"

### Para Desenvolvedores
1. ✅ Usar `assignTeamsManually()` apenas após criar a partida
2. ✅ Sempre chamar `validateTeamFormation()` antes de iniciar a partida
3. ✅ Usar `swapPlayerTeam()` para ajustes pós-criação (admin de última hora)
4. ✅ Loguear mudanças em `match_edit_log` para auditoria

---

## 📚 Exemplo Completo de Integração

```typescript
// No componente de Nova Partida

const [mode, setMode] = useState<'auto' | 'manual'>('auto');

async function handleModeSelection(selectedMode: 'auto' | 'manual') {
  const season = await getOrCreateActiveSeason();
  const ranked = await fetchRankedPlayers(season.id, Array.from(selected));
  
  if (selectedMode === 'manual') {
    setMode('manual');
    setRankedPlayers(ranked);
  } else {
    // Auto mode
    const balanced = balanceTeams(ranked);
    setTeams(balanced);
  }
}

async function handleManualSave(teamA: RankedPlayer[], teamB: RankedPlayer[]) {
  // 1. Criar partida
  const match = await supabase.from('matches').insert({...}).single();
  
  // 2. Atribuir equipas manualmente
  const result = await assignTeamsManually(match.id, teamA, teamB);
  
  if (result.success) {
    // 3. Validar (opcional)
    const validation = await validateTeamFormation(match.id);
    
    // 4. Navegar para partida
    router.push(`/partida/${match.id}`);
  }
}
```

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Botão Salvar desativado" | Verifique se **todos** os jogadores estão em A ou B (sem "Não Atribuídos") |
| "Erro ao salvar: Número de jogadores não corresponde" | Verifique se click em "Continuar" carregou todos os jogadores corretos |
| "RLS policy error" | Verifique autenticação do usuário e se está em `authenticated` role |
| Layout bugado em mobile | Refresh a página ou limpe cache do navegador |

---

## ✨ Funcionalidades Futuras

- 🔜 Drag-and-drop avançado (reorder dentro das colunas)
- 🔜 Undo/Redo para as mudanças
- 🔜 Preset formations (salvadas do histórico)
- 🔜 Análise de força das equipas em tempo real
- 🔜 Sugestões automáticas de balanceamento
- 🔜 Sync com app mobile em tempo real

---

**Documentação atualizada em:** Abril 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para Produção
