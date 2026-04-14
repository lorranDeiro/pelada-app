# ⚡ QUICK START - Pelada App Landing Page

## O Que Já Está Pronto ✅

- ✅ **Tailwind Config** - Paleta premium dark mode (cores, gradientes, animações)
- ✅ **Landing Page** - Estrutura completa em `app/page-landing.tsx`
- ✅ **Componentes** - Biblioteca reutilizável em `components/ui-patterns.tsx`
- ✅ **Documentação** - Guias completos e exemplos
- ✅ **Ícones Component** - Wrapper pronto em `components/custom-icon.tsx`

---

## 3 Passos Para Começar

### **1️⃣ Colocar Ícones** 📁

Coloque esses 5 arquivos em `/public/icons/`:
```
logo.svg              (40x40 approx)
hero-ball.svg        (400x400 approx)
step-1-create.svg    (64x64)
step-2-match.svg     (64x64)
step-3-ranking.svg   (64x64)
```

⏭️ **Depois:** Os ícones aparecerão automaticamente na landing page

### **2️⃣ Testar Build** 🧪

```bash
npm run build
npm run dev
# Acessar: http://localhost:3000
```

### **3️⃣ Ativar Como Homepage** 🚀

Escolha uma das duas opções:

#### **Opção A: Landing como Homepage (Recomendado)**
```bash
# Terminal - Execute na pasta pelada-app/
mv app/page-landing.tsx app/page.tsx
```
✅ Landing page agora é a homepage

#### **Opção B: Landing em Rota Separada**
```bash
# Terminal - Execute na pasta pelada-app/
mkdir -p app/landing
mv app/page-landing.tsx app/landing/page.tsx
```
✅ Landing page acessível em `/landing`

---

## 📖 Documentação Principal

| Documento | Propósito |
|-----------|----------|
| [BRAND_STYLE_GUIDE.md](./BRAND_STYLE_GUIDE.md) | Visual - Cores, componentes, exemplos |
| [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) | Técnico - Como usar, customizar, deploy |
| [GUIA_ICONS_CUSTOMIZADOS.md](./GUIA_ICONS_CUSTOMIZADOS.md) | Ícones - 3 métodos de integração |
| [tailwind.config.ts](./tailwind.config.ts) | Config - Paleta de cores e animações |
| [components/ui-patterns.tsx](./components/ui-patterns.tsx) | Componentes - 8+ padrões reutilizáveis |

---

## 🎨 Cores da Paleta (Referência Rápida)

```javascript
// Background
#0f172a   ← Azul escuro profundo (main)
#1a2335   ← Cinza azulado (surfaces)

// Accents
#22c55e   ← Verde energia (primary - CTA, highlights)
#0ea5e9   ← Azul elétrico (secondary - features)

// Text
#e2e8f0   ← Branco suave (primary text)
#94a3b8   ← Cinza (secondary text)
```

---

## 💡 Exemplos Rápidos

### **Botão CTA**
```tsx
<Button variant="primary" size="lg">
  Começar Agora
</Button>
```

### **Card com Hover**
```tsx
<FeatureCard
  icon={<Trophy />}
  title="Ranking"
  description="Acompanhe evolução"
/>
```

### **Texto com Gradiente**
```tsx
<GradientText variant="dual">
  Transformação
</GradientText>
```

---

## 🔧 Customizações Comuns

### **Mudar Cor Accent (Verde)**

Edite `tailwind.config.ts`:
```javascript
colors: {
  accent: {
    DEFAULT: '#SUAS_COR_AQUI',  // Verde → Sua cor
    bright: '#OUTRA_COR',
  }
}
```

### **Adicionar Novo Button Variant**

Edite `components/ui-patterns.tsx`:
```typescript
variant: {
  primary: '...',
  secondary: '...',
  'seu-variant': 'suas classes aqui',  // ← Novo
}
```

---

## 🚨 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Build falha | `rm -rf .next && npm run dev` |
| Cores erradas | Verificar `tailwind.config.ts` existe |
| Ícones em branco | Colocar SVGs em `/public/icons/` |
| Landing não mostra | Usar `mv` command do Passo 3 |

---

## ✅ Checklist Final

- [ ] Ícones colocados em `/public/icons/` (5 arquivos)
- [ ] Executado `npm run build` (sem erros)
- [ ] Landing page ativada como homepage ou rota
- [ ] Testado em `http://localhost:3000`
- [ ] Verificado em mobile (responsivo)
- [ ] Cores ajustadas (se necessário)

---

## 🎯 Próximas Funcionalidades

Depois da landing, considere:
- [ ] Adicionar blog/news section
- [ ] SEO otimizado (meta tags)
- [ ] Analytics (Vercel Analytics)
- [ ] Email newsletter
- [ ] Dark/Light mode toggle (opcional)

---

## 📞 Links Úteis

- [Design System Guide](./BRAND_STYLE_GUIDE.md) - Cores e componentes
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md) - Guia técnico
- [Icon Integration](./GUIA_ICONS_CUSTOMIZADOS.md) - Como usar ícones
- [Component Library](./components/ui-patterns.tsx) - Código dos componentes

---

**Status:** ✅ Pronto para usar  
**Tempo estimado de setup:** 5-10 minutos  
**Suporte:** Ver documentação ou customizar conforme necessário 🚀

