# 🚀 Implementação: PWA + RLS Público

Guia prático para transformar o Pelada App em PWA e abrir o ranking para acesso público.

---

## **PARTE 1: PWA (Progressive Web App)**

### **Objetivo**
Transformar a web app em um aplicativo instalável no celular (funciona offline também).

### **O que foi feito**

1. **`next.config.ts`** ✅
   - Integrado o `next-pwa` com configurações otimizadas
   - Cache de fontes Google e CDNs
   - Service worker automático

2. **`public/manifest.json`** ✅
   - Metadados da app (nome, ícones, cores, shortcuts)
   - Configuração de ícones adaptáveis (maskable icons)

3. **`app/layout.tsx`** ✅
   - Metatags PWA no `<head>`
   - Viewport otimizado
   - Apple Web App support

4. **`components/pwa-installer.tsx`** ✅ (Opcional)
   - Componente que mostra prompt de instalação
   - Design: card no bottom com botões

---

### **PASSO A PASSO - Implementar no seu projeto**

#### **Passo 1: Verificar instalação de dependências**
```bash
cd pelada-app
npm list next-pwa
# Deve aparecer: next-pwa@5.6.0 (ou similar)
```

Se não estiver instalado:
```bash
npm install next-pwa
```

---

#### **Passo 2: Criar ícones (.png)**

A aplicação precisa dos seguintes ícones em `public/icons/`:

```
public/icons/
├── icon-192.png          (192x192 px - ícone padrão)
├── icon-512.png          (512x512 px - ícone grande)
├── maskable-192.png      (192x192 px - para Android adaptável)
├── maskable-512.png      (512x512 px - para Android adaptável)
└── screenshot-192.png    (192x192 px - print da app [OPCIONAL])
```

**Gerador rápido de ícones:**
- Ir em: https://www.favicon-generator.org/
- Upload do logo/imagem
- Download dos ícones en PNG
- Renomear e colocar em `public/icons/`

**Ou usar um ícone temporário:**
- Copie qualquer imagem PNG 192x192 para `public/icons/icon-192.png`
- Aumente para 512x512 e salve como `public/icons/icon-512.png`
- Copie os mesmos para `maskable-*.png`

---

#### **Passo 3: Atualizar `.env.local` (Supabase)**

Adicione/confirme que tem:
```env
NEXT_PUBLIC_SUPABASE_URL=seu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
```

---

#### **Passo 4: Build e teste local**

```bash
npm run build
npm start
```

**Teste em um celular (mobile):**
1. Abra o navegador no celular
2. Acesse `http://seu-ip-local:3000`
3. Deve aparecer um banner "Instalar" (com o componente `PwaInstaller`)
4. Clique em "Instalar"
5. App aparece na home do celular! 🎉

**Ou manualmente (Chrome Mobile):**
1. Menu (3 pontinhos) → "Instalar aplicativo"

---

#### **Passo 5 (Opcional): Usar PwaInstaller**

Se quiser o prompt bonito de instalação, adicione o componente ao layout principal:

Abra [app/layout.tsx](app/layout.tsx#L30) e adicione:

```tsx
import { PwaInstaller } from '@/components/pwa-installer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" ...>
      <head>
        {/* metatags PWA */}
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <PwaInstaller />  {/* ← Adicione aqui */}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
```

---

### **✅ PWA Pronto!**

Agora a aplicação:
- ✓ É instalável como app nativo
- ✓ Funciona offline (com cache inteligente)
- ✓ Tem splash screen no iOS/Android
- ✓ Tem ícone na home do celular

---

## **PARTE 2: RLS - Acesso Público ao Ranking**

### **Objetivo**
Permitir que QUALQUER PESSOA (não autenticada) veja:
- ✓ Ranking de jogadores
- ✓ Histórico de partidas
- ✓ Detalhes dos eventos
- ✗ Partidas em DRAFT ou LIVE (apenas autenticados veem)

---

### **PASSO A PASSO - Implementar RLS**

#### **Passo 1: Abrir Supabase Console**

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá para: **SQL Editor** (ícone de database)

---

#### **Passo 2: Copiar o script SQL**

Abra o arquivo: [schema-rls-public.sql](schema-rls-public.sql)

**Copie TODO o conteúdo** (de `-- ===...` até o final)

---

#### **Passo 3: Executar no Supabase**

1. **SQL Editor** → **New Query**
2. Cole o script completo
3. Clique em **RUN** (botão azul)
4. Aguarde ✅ (deve sair "Executed successfully")

---

#### **Passo 4: Verificar no Painel RLS (Opcional)**

Para confirmar visualmente:

1. Vá para: **Authentication** → **Policies** (lado esquerdo)
2. Selecione cada tabela (players, matches, etc.)
3. Deve aparecer as políticas como:
   - ✓ `read_public_*` (anon)
   - ✓ `read_authenticated_*` (auth)
   - ✓ `write_authenticated_*` (auth)

---

### **🔒 Segurança: O que cada grupo vê**

| Quem | O que vê | Pode editar |
|------|----------|------------|
| **Não autenticado (anon)** | Partidas FINISHED, jogadores ativos, histórico | ❌ Não |
| **Autenticados** | Tudo (DRAFT, LIVE, FINISHED) | ✅ Sim |

---

### **✅ RLS Pronto!**

Agora:
- ✓ Qualquer pessoa com o link vê o ranking
- ✓ Dados sensíveis (em progresso) ficam ocultos
- ✓ Segurança mantida: apenas auth pode editar

---

## **🎯 PRÓXIMOS PASSOS (Fora do escopo desta iteração)**

1. Criar link público para compartilhar ranking
2. Página pública de ranking (sem login obrigatório)
3. Gráficos de forma (Recharts)
4. Gerenciamento de seasons
5. Edição de partidas finalizadas

---

## **⚠️ Troubleshooting**

### **"Não consigo instalar a app no celular"**
- [ ] Certificar que é **HTTPS** ou **localhost** (HTTP local ok)
- [ ] Testar em navegador móvel moderno (Chrome, Safari, Firefox)
- [ ] Ícones em `public/icons/` existem?

### **"Não vejo o prompt de instalação"**
- [ ] Verificar se `PwaInstaller` foi adicionado ao layout
- [ ] Testar em modo anônimo/incógnito
- [ ] Esperar 30s (browser pode demorar para disparar evento)

### **"Público não vê o ranking mesmo após RLS"**
- [ ] Executou o script SQL completamente?
- [ ] Verificar se RLS está **habilitado** nas tabelas ([Authentication → Policies](https://app.supabase.com))
- [ ] Recarregar a página no navegador (Ctrl+Shift+Del cache)
- [ ] Testar em modo anônimo no Supabase

### **"O service worker não está cachando"**
- [ ] Verificar: DevTools → Application → Service Workers
- [ ] Cache está em: Application → Cache Storage
- [ ] Limpar cache: `rm -rf .next` → `npm run build`

---

## **📚 Referências**

- [Next.js PWA Documentation](https://nextjs.org/docs#pwa)
- [next-pwa GitHub](https://github.com/shadowwalker/next-pwa)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

## **✨ Dúvidas?**

Se tiver alguma dúvida durante a implementação, é só chamar! 🚀
