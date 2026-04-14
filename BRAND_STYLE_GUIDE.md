# 🎨 Brand Style Guide - Pelada App

## Paleta de Cores Premium

### **Cores Primárias**

```
┌─────────────────────────────────────────────────────────┐
│ Background Principal: #0f172a (Azul Escuro Profundo)    │
│ • Usado para: Main background, hero sections            │
│ • Sensação: Elegante, premium, futuristico              │
│ Tailwind: bg-background                                 │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ Accent Principal: #22c55e (Verde Energia)               │
│ • Usado para: CTA buttons, highlights, accents          │
│ • Sensação: Vitrante, dinâmico, desportivo              │
│ Tailwind: text-accent, bg-accent                        │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│ Accent Secundário: #0ea5e9 (Azul Elétrico)              │
│ • Usado para: Features, secondary accents               │
│ • Sensação: Moderno, tech-forward                       │
│ Tailwind: text-accent-secondary, bg-accent-secondary    │
└─────────────────────────────────────────────────────────┘
```

### **Cores de Superfícies**

| Nome | Cor | Hex | Uso |
|------|-----|-----|-----|
| Background | ![#0f172a](https://via.placeholder.com/50/0f172a/0f172a) | `#0f172a` | Main BG |
| Surface | ![#1a2335](https://via.placeholder.com/50/1a2335/1a2335) | `#1a2335` | Cards, containers |
| Surface Hover | ![#232f42](https://via.placeholder.com/50/232f42/232f42) | `#232f42` | Hover states |
| Surface Border | ![#3a4a62](https://via.placeholder.com/50/3a4a62/3a4a62) | `#3a4a62` | Borders |
| Muted BG | ![#0d1117](https://via.placeholder.com/50/0d1117/0d1117) | `#0d1117` | Subtle bg |

### **Greens (Main Accent)**

| Nível | Cor | Hex | Uso |
|-------|-----|-----|-----|
| Dark | ![#16a34a](https://via.placeholder.com/50/16a34a/16a34a) | `#16a34a` | Hover states |
| **Default** | ![#22c55e](https://via.placeholder.com/50/22c55e/22c55e) | `#22c55e` | **Primary** |
| Bright | ![#4ade80](https://via.placeholder.com/50/4ade80/4ade80) | `#4ade80` | Highlights |

### **Secondary Accent (Blue)**

| Nível | Cor | Hex | Uso |
|-------|-----|-----|-----|
| Default | ![#0ea5e9](https://via.placeholder.com/50/0ea5e9/0ea5e9) | `#0ea5e9` | Features |

### **Text Colors**

| Tipo | Cor | Hex | Contrast |
|------|-----|-----|----------|
| Primary | ![#e2e8f0](https://via.placeholder.com/50/e2e8f0/e2e8f0) | `#e2e8f0` | ✅ WCAG AAA |
| Secondary | ![#94a3b8](https://via.placeholder.com/50/94a3b8/94a3b8) | `#94a3b8` | ✅ WCAG AA |
| Muted | ![#64748b](https://via.placeholder.com/50/64748b/64748b) | `#64748b` | ⚠️ WCAG AA (medium) |

---

## 🎯 Componentes & Padrões

### **Buttons**

#### Primary CTA
```tsx
<Button 
  className="bg-gradient-to-r from-accent to-accent-bright 
             hover:from-accent-bright hover:to-accent 
             text-black font-bold"
>
  Começar Agora
</Button>
```
**Aparência:** Gradiente verde vibrante, transição suave
**Tamanho**: lg (padding maior para destaque)

#### Secondary Button
```tsx
<Button 
  variant="outline"
  className="border-surface-border hover:bg-surface text-text-primary"
>
  Ver Ranking
</Button>
```
**Aparência:** Border sutil, fundo ao hover
**Tamanho**: lg

---

### **Cards**

#### Padrão Card
```tsx
<div className="p-8 bg-surface border border-surface-border rounded-2xl 
                hover:border-accent/50 transition space-y-6">
  {/* Conteúdo */}
</div>
```

#### Card com Hover Effect
```tsx
<div className="group relative">
  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent 
                  rounded-2xl opacity-0 group-hover:opacity-100 transition"></div>
  <div className="relative p-8 bg-surface border border-surface-border 
                  rounded-2xl hover:border-accent/50 transition">
    {/* Conteúdo */}
  </div>
</div>
```

---

### **Typography**

#### Heading 1 (H1)
```tsx
<h1 className="text-5xl lg:text-6xl font-bold leading-tight">
  Transforme suas <span className="text-accent-bright">Peladas</span>
</h1>
```
- Size: 3rem (48px) mobile, 3.75rem (60px) desktop
- Weight: Bold (700)
- Color: text-primary + accent highlights

#### Heading 2 (H2)
```tsx
<h2 className="text-4xl lg:text-5xl font-bold">
  Como Funciona
</h2>
```
- Size: 2.25rem (36px) mobile, 3rem (48px) desktop
- Weight: Bold (700)

#### Heading 3 (H3)
```tsx
<h3 className="text-xl font-bold">
  01 • Cadastre Jogadores
</h3>
```
- Size: 1.25rem (20px)
- Weight: Bold (700)

#### Body Text
```tsx
<p className="text-lg text-text-secondary">
  Gerencie partidas, acompanhe rankings...
</p>
```
- Size: 1.125rem (18px)
- Color: text-secondary
- Line Height: relaxed

#### Small Text / Meta
```tsx
<p className="text-text-secondary text-sm">
  Ranking Público
</p>
```
- Size: 0.875rem (14px)
- Color: text-secondary

---

### **Badges & Labels**

#### Feature Badge (Pequena)
```tsx
<span className="px-4 py-2 bg-accent/10 border border-accent/30 
                 rounded-full text-accent text-sm font-semibold">
  ⚡ Gestão de Peladas
</span>
```

---

### **Gradientes Customizados**

#### Hero Gradient
```tsx
className="bg-gradient-to-br from-accent/10 to-accent-secondary/10"
```

#### Accent Gradient
```tsx
className="bg-gradient-to-r from-accent to-accent-bright"
```

#### Background Gradient
```tsx
className="bg-gradient-premium" // Linear, 135deg, 0f172a -> 1a2335
```

---

### **Shadows**

```tsx
// Premium shadow (cards)
className="shadow-premium"  // 0 20px 25px -5px rgba(0,0,0,0.5)

// Large shadow (modals, overlays)
className="shadow-premium-lg"  // 0 25px 50px -12px rgba(0,0,0,0.6)

// Accent glow (ícones, destaques)
className="shadow-accent"  // 0 10px 15px -3px rgba(34,197,94,0.2)

// Subtle glow
className="shadow-glow"  // 0 0 20px rgba(34,197,94,0.15)
```

---

## 📐 Spacing & Layout

### **Breakpoints**
- Mobile: < 640px (default)
- Tablet: 640px - 1024px (md:)
- Desktop: > 1024px (lg:)

### **Max Width Containers**
```tsx
// Standard container
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"

// Narrow container
className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
```

### **Spacing Scale**
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 2.5rem (40px)
- ... até 3xl, 4xl, etc

---

## ✨ Animações

### **Fade In**
```tsx
className="animate-fade-in"
```
Duration: 0.5s

### **Slide Up**
```tsx
className="animate-slide-up"
```
Duration: 0.6s, ease-out

### **Pulse Accent**
```tsx
className="animate-pulse-accent"
```
Duration: 2s, suave pulsação

---

## 🎬 Exemplos de Uso Combinado

### **Hero Section**
```tsx
<div className="bg-gradient-premium py-20">
  <h1 className="text-5xl font-bold text-white">
    Transforme suas <span className="text-accent-bright">Peladas</span>
  </h1>
  <p className="text-lg text-text-secondary mt-4">
    Descrição...
  </p>
  <Button className="bg-gradient-to-r from-accent to-accent-bright 
                     text-black font-bold mt-6">
    Começar
  </Button>
</div>
```

### **Feature Card Hover**
```tsx
<div className="group p-8 bg-surface border border-surface-border 
                rounded-2xl hover:border-accent/50 transition">
  <div className="absolute inset-0 bg-gradient-to-br from-accent/10 
                  to-transparent rounded-2xl opacity-0 
                  group-hover:opacity-100 transition"></div>
  <Icon className="w-6 h-6 text-accent" />
  <h3 className="font-bold mt-4">Feature</h3>
  <p className="text-text-secondary mt-2">Descrição...</p>
</div>
```

---

## 🌙 Dark Mode

A aplicação é **dark-first**. Todos os componentes já têm contrast adequado para dark mode.

Se desejar adicionar light mode no futuro, as cores precisarão ser invertidas (usar Tailwind's `dark:` prefix).

---

## ✅ Checklist de Implementação

- [x] Tailwind config com paleta customizada
- [x] Fondos elegantes (blues escuros)
- [x] Accents vibrantes (greens/blues)
- [x] Typography hierarchy
- [x] Shadows premium
- [x] Animações smooth
- [ ] Testar contrast (WCAG AA/AAA)
- [ ] Validar em devices reais
- [ ] Otimizar performance

---

## 📚 Referências de Inspiração

- **Sofascore**: Dark mode elegante, accents vibrantes
- **Betclic**: Sports premium, typography clara
- **Stripe**: Gradientes sofisticados, spacing generoso
- **Figma**: Dark mode sofisticado, border accents

