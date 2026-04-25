# 🌐 Acesso Público ao Ranking e Histórico

Guia completo para compartilhar o ranking e histórico de partidas com seus amigos.

---

## **📋 O que foi criado**

✅ **Tabela `match_comments`** — Sistema de comentários em Supabase
✅ **Página Pública `/ranking`** — Ranking visualizável por qualquer pessoa
✅ **Página Pública `/historico-publico`** — Histórico com comentários
✅ **Component `CommentForm`** — Formulário para deixar comentários
✅ **Component `CommentsList`** — Exibição de comentários verificados
✅ **Funções de comentários** — `lib/comments.ts` com todas as operações
✅ **Types**  — Tipos TypeScript para comentários

---

## **🚀 Passo a Passo de Implementação**

### **Passo 1: Criar tabela de comentários no Supabase**

1. Abra **Supabase Console** → **SQL Editor**
2. Crie uma **New Query**
3. Copie TODO o conteúdo de `schema-comments.sql`
4. Clique **RUN**
5. ✅ Tabela criada com RLS habilitado!

---

### **Passo 2: Fazer commit e push**

```bash
git add .
git commit -m "feat: add public ranking, history and comments system"
git push
```

O Vercel fará deploy automaticamente.

---

### **Passo 3: Compartilhar com amigos**

Dê esses links aos seus amigos:

**Ranking Público:**

```
https://pelada-app-eight.vercel.app/ranking
```

**Histórico com Comentários:**

```
https://pelada-app-eight.vercel.app/historico-publico
```

---

## **🎯 O que seus Amigos Podem Fazer**

### **No `/ranking`**

- ✓ Ver ranking completo da temporada
- ✓ Ver notas médias de cada jogador
- ✓ Ver gols, assistências, defesas
- ✓ Ver MVPs de cada jogador
- ❌ Não podem editar nada

### **No `/historico-publico`**

- ✓ Ver todas as partidas finalizadas
- ✓ Ver resultados (placar + MVP)
- ✓ Ver anotações do admin
- ✓ **Deixar comentários** em qualquer partida
- ✓ Ver comentários que já foram aprovados
- ❌ Comentários precisam ser verificados antes de aparecer

---

## **💬 Como Funcionam os Comentários**

### **Fluxo Público → Admin**

1. **Amigo deixa comentário** (sem fazer login)

   - Preenche: nome + comentário (email opcional)
   - Texto é salvo como **`is_verified = false`**
2. **Admin vê comentário pendente** (você, logado)

   - Aparecem na dashboard (implementar depois)
   - Você aprova ou deleta
3. **Comentário aprovado aparece publicamente**

   - Amigos veem o comentário

---

## **🔐 Segurança & RLS**

Todas as permissões estão configuradas no Supabase:

| Ação                         | Público             | Autenticado        |
| ------------------------------ | -------------------- | ------------------ |
| **Ver ranking**          | ✓                   | ✓                 |
| **Ver histórico**       | ✓ (só FINISHED)    | ✓                 |
| **Deixar comentário**   | ✓ (precisa aproval) | ✓ (auto-approved) |
| **Criar/editar partida** | ❌                   | ✓ (apenas você)  |
| **Deletar comentário**  | ❌                   | ✓ (apenas admin)  |

---

## **📱 URLs Públicas**

**Links para compartilhar com seus amigos:**

| Página    | URL                                 | Descrição                      |
| ---------- | ----------------------------------- | -------------------------------- |
| Ranking    | `/ranking`                        | Ranking da temporada atual       |
| Histórico | `/historico-publico`              | Todas as partidas + comentários |
| Home       | `/`                               | Requer login                     |
| Admin      | `/elenco`, `/partida/nova`, etc | Requer login                     |

---

## **🛠️ Gerenciar Comentários (Admin)**

### **Ver comentários pendentes**

Você (autenticado) pode usar:

```typescript
import { getAllMatchComments, verifyMatchComment, deleteMatchComment } from '@/lib/comments';

// Ver todos os comentários de uma partida (inclusive não verificados)
const allComments = await getAllMatchComments(matchId);

// Aprovar um comentário
await verifyMatchComment(commentId);

// Deletar um comentário spam
await deleteMatchComment(commentId);
```

### **Dashboard de Comentários (Futuro)**

Você pode criar uma página `/admin/comentarios` que mostra:

- Comentários pendentes
- Botão "Aprovar"
- Botão "Deletar"

---

## **🎨 Customização**

### **Mudar cores das páginas públicas**

Abra `app/ranking/page.tsx` ou `app/historico-publico/page.tsx` e procure por:

- `from-green-600` → mude a cor
- `bg-gray-800` → mude o fundo
- `text-green-400` → mude o texto

### **Adicionar logo/branding**

Nos headers das páginas públicas, você pode adicionar:

```tsx
<img src="/logo.png" alt="Logo" className="h-8" />
```

---

## **📊 Estatísticas**

### **Dados Exibidos no Ranking**

Para cada jogador:

- Ranking (posição)
- Nome
- Total de pontos ⭐
- Partidas jogadas
- Nota média (6.0 - 10.0)
- Wins (vitórias)
- Gols ⚽
- Assistências 🎯
- Defesas (só goleiros) 🧤
- MVPs 👑

---

## **🔄 Updates em Tempo Real**

As páginas públicas atualizam automaticamente quando:

- Você finaliza uma partida
- Muda a temporada ativa
- Um comentário é aprovado

Os amigos não precisam atualizar manualmente (NextJS recarrega dados).

---

## **🚀 Próximos Passos (Opcional)**

1. **Dashboard Admin de Comentários**

   - Página em `/admin/comentarios`
   - Listar pendentes
   - Botões aprovar/deletar
2. **Notificações**

   - Email quando alguém comenta
   - Popup no app
3. **Filtros no Histórico**

   - Por jogador
   - Por time
   - Por período
4. **Export de Dados**

   - CSV do ranking
   - PDF das partidas

---

## **❓ FAQ**

**P: Meus amigos precisam fazer login?**
R: Não! Ranking e histórico são 100% públicos. Comentários também não precisam de login.

**P: Como removo um comentário de spam?**
R: Você (admin) pode usar `deleteMatchComment()` para deletar qualquer comentário.

**P: Os comentários aparecem automaticamente?**
R: Não, você precisa verificar antes. Comentários públicos nascem com `is_verified = false`.

**P: Posso mudar a cor da página pública?**
R: Sim! São componentes React normais com Tailwind CSS.

**P: E se quiser editar histórico de partidas?**
R: Está fora do escopo deste passo. Podemos implementar depois se quiser.

---

## **📞 Dúvidas?**

Tudo pronto para compartilhar! Qualquer dúvida, é só chamar. 🚀
