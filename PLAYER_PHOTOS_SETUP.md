# 📸 Guia: Fotos Locais de Jogadores

## Objetivo
Migrar de armazenamento em Supabase para **fotos locais no repositório** (`public/players/`). Isso elimina problemas de permissão do bucket e melhora a performance.

## 📂 Estrutura de Pastas

```
pelada-app/
├── public/
│   └── players/          ← CRIE ESTA PASTA
│       ├── neymar.png
│       ├── vinicius.jpg
│       ├── rodrygo.webp
│       └── ...
└── ...
```

## 🚀 Como Usar

### 1️⃣ Adicionar Fotos Localmente

1. **Salve a imagem do jogador** em uma pasta do seu computador
   - Formatos suportados: PNG, JPG, WebP
   - Tamanho recomendado: até 500KB (compacte se necessário)

2. **Copie para** `public/players/`
   ```bash
   # Exemplo (bash/PowerShell):
   cp ~/Downloads/neymar.png ./public/players/
   ```

3. **Commit no Git**
   ```bash
   git add public/players/neymar.png
   git commit -m "Add player photo: neymar.png"
   ```

### 2️⃣ Associar Foto ao Jogador

1. Abra o painel **Admin > Elenco**
2. Clique em "Editar" no jogador desejado
3. No campo **"Arquivo de Foto"**, digite:
   ```
   neymar.png
   ```
4. Clique em "Salvar"

**Dica:** O componente `PlayerAvatar` automaticamente resolve:
- `"neymar.png"` → `/players/neymar.png`
- `"path/subfolder/neymar.png"` → `/players/path/subfolder/neymar.png`

### 3️⃣ Ver a Foto

A foto aparecerá automaticamente em:
- ✅ Ranking de jogadores
- ✅ Carta FIFA
- ✅ Histórico de partidas
- ✅ Avatar em comentários

## 📋 Exemplo Prático

**Cenário:** Você quer adicionar foto do Vinicius Jr.

### Passo 1: Preparar a imagem
```bash
# Baixar ou procurar imagem de vinicius
# Salvar em: ./public/players/vinicius.jpg
```

### Passo 2: Editar no Admin
- Admin > Elenco
- Procurar "Vinicius Jr"
- Editar
- Campo "Arquivo de Foto": digitar `vinicius.jpg`
- Salvar

### Passo 3: Commit
```bash
git add public/players/vinicius.jpg
git commit -m "Add photo: Vinicius Jr"
```

## 🎨 Recomendações de Imagem

| Propriedade | Recomendação |
|---|---|
| **Formato** | PNG (melhor qualidade) ou JPG (menor tamanho) |
| **Dimensões** | 200x200px (quadrado) - ou maior, será redimensionado |
| **Tamanho** | <500KB (comprima com TinyPNG, Squoosh) |
| **Fundo** | Transparente (PNG) ou neutro |
| **Estilo** | Foto de rosto ou corpo inteiro, similar a LinkedIn/FIFA |

## 🔧 Batch Upload (Múltiplas Fotos)

Se você tiver muitas fotos para adicionar:

1. Salve todas em `public/players/`
2. Atualize cada jogador via Admin UI
3. Ou, faça um **SQL UPDATE** direto no Supabase (se conhece SQL):
   ```sql
   UPDATE players
   SET photo_url = 'neymar.png'
   WHERE name = 'Neymar';
   ```

## ⚠️ Troubleshooting

### "Foto não aparece"
- ✅ Confirmou que o arquivo está em `public/players/`?
- ✅ O nome digitado no Admin bate com o arquivo? (case-sensitive em Linux/Mac)
- ✅ Fez commit e push do arquivo?
- ✅ Recarregou a página (F5)?

### "Foto aparece pixelada"
- Aumente a resolução da imagem para 300x300px ou maior

### "Arquivo é muito grande"
- Comprima com [TinyPNG.com](https://tinypng.com) ou [Squoosh.app](https://squoosh.app)
- Alvo: <200KB por imagem

## 🎯 Checklist de Migração

- [ ] Criar pasta `public/players/` no repositório
- [ ] Copiar fotos existentes (se havia no Supabase)
- [ ] Atualizar cada jogador com o filename no Admin
- [ ] Testar que as fotos aparecem em todas as páginas
- [ ] Fazer commit de todas as fotos no Git
- [ ] Documentar novas adições no README ou aqui

---

**Dúvidas?** Veja o código em `components/player-avatar.tsx` - função `resolvePhotoUrl()`.
