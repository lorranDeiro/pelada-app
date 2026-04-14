# 🎯 Guia de Integração de Ícones Customizados

## 📁 Estrutura de Pastas para Ícones

```
public/
├── icons/
│   ├── logo.svg                    # Logo principal (navbar)
│   ├── hero-ball.svg               # Ícone hero section (maior)
│   ├── hero-field.svg              # Alternativa: campo de futebol
│   ├── step-1-create.svg           # Step 1: Cadastrar jogadores
│   ├── step-2-match.svg            # Step 2: Registrar partidas
│   ├── step-3-ranking.svg          # Step 3: Ver ranking
│   ├── feature-speed.svg           # Feature: Velocidade
│   ├── feature-balance.svg         # Feature: Balanceamento
│   └── ...outros ícones
```

## 🛠️ Opção 1: Usar next/image com SVG (Recomendado para SEO)

**Vantagens:**
- ✅ Otimização automática com Next.js
- ✅ Lazy loading
- ✅ Responsive
- ✅ Melhor para SEO

**Implementação:**

```tsx
import Image from 'next/image';

export default function HeroSection() {
  return (
    <div>
      <Image
        src="/icons/hero-ball.svg"
        alt="Football"
        width={400}
        height={400}
        className="w-full h-auto"
        priority // Use para hero images (acima da fold)
      />
    </div>
  );
}
```

## 🛠️ Opção 2: Importar SVG como Componente React (Recommended para Customização)

**Vantagens:**
- ✅ Controle total sobre props (cores, tamanho)
- ✅ Animações CSS/Tailwind diretas no SVG
- ✅ Dinâmico com estados

**Passo 1:** Configure next.config.ts para importar SVG como componente:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... outras configs
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

export default nextConfig;
```

**Passo 2:** Instale @svgr/webpack:

```bash
npm install --save-dev @svgr/webpack
```

**Passo 3:** Importe e use como componente:

```tsx
import HeroBall from '@/public/icons/hero-ball.svg';

export default function HeroSection() {
  return (
    <HeroBall 
      className="w-96 h-96 text-accent animate-pulse-accent" 
    />
  );
}
```

## 🛠️ Opção 3: Componente Wrapper Custom (Best Practice Profissional)

Crie um componente reutilizável em `components/CustomIcon.tsx`:

```tsx
import Image from 'next/image';

interface CustomIconProps {
  name: string; // 'hero-ball', 'step-1-create', etc
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  animated?: boolean;
}

export function CustomIcon({
  name,
  alt,
  width = 400,
  height = 400,
  className = 'w-full h-auto',
  priority = false,
  animated = false,
}: CustomIconProps) {
  return (
    <Image
      src={`/icons/${name}.svg`}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${animated ? 'animate-pulse-accent' : ''}`}
      priority={priority}
    />
  );
}
```

**Uso:**

```tsx
import { CustomIcon } from '@/components/CustomIcon';

export default function HeroSection() {
  return (
    <CustomIcon
      name="hero-ball"
      alt="Football"
      width={400}
      height={400}
      animated
      className="w-96 h-96"
    />
  );
}
```

## 🎨 Dicas de Design para SVGs em Tailwind

### 1. **Ícones com Cores Dinâmicas**

```tsx
// SVG com classes Tailwind aplicadas
<svg className="w-32 h-32 text-accent hover:text-accent-bright transition">
  <circle className="fill-current" cx="50" cy="50" r="40" />
</svg>
```

### 2. **Animações com Tailwind**

```tsx
// Use as animações customizadas do tailwind.config.ts
<CustomIcon
  name="hero-ball"
  alt="Ball"
  className="w-96 h-96 animate-slide-up" // slide-up definida em tailwind config
/>
```

### 3. **SVGs Responsivos**

```tsx
// Usar viewBox para escalabilidade automática
<Image
  src="/icons/logo.svg"
  alt="Logo"
  width={40}
  height={40}
  className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16"
/>
```

## 🔄 Procurando Ativar a Landing Page?

A Landing Page está pronta em `app/page-landing.tsx`, mas a página atual (`app/page.tsx`) é o dashboard autenticado.

**Para usar a Landing Page como homepage:**

### Opção A: Substituir a página atual (Remove proteção de auth)
```bash
# Backup da atual
mv app/page.tsx app/page-dashboard.tsx

# Usar a landing como homepage
mv app/page-landing.tsx app/page.tsx
```

### Opção B: Criar rota preview (Manter ambas)
```
app/
├── page.tsx              # Landing Page (pública)
├── dashboard/
│   └── page.tsx         # Dashboard (protegido - move app-dashboard aqui)
```

## 🎬 Exemplo Prático Completo

**1. Colocar seu SVG em** `/public/icons/hero-ball.svg`

**2. Em** `app/page-landing.tsx`, **substituir:**

```tsx
// Antes (placeholder):
<div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent-secondary/20 rounded-3xl border border-surface-border backdrop-blur-sm flex items-center justify-center">
  <Trophy className="w-32 h-32 text-accent mx-auto animate-pulse-accent" />
</div>

// Depois (com seu ícone):
<CustomIcon
  name="hero-ball"
  alt="Football"
  width={400}
  height={400}
  priority
  animated
  className="w-96 h-auto"
/>
```

**3. Não esqueça de importar:**

```tsx
import { CustomIcon } from '@/components/CustomIcon';
```

## 📋 Checklist de Ícones Necessários

- [ ] `logo.svg` - Logo para navbar (40x40px aprox)
- [ ] `hero-ball.svg` - Ícone hero section (400x400px aprox)
- [ ] `step-1-create.svg` - Ícone step 1 (64x64px)
- [ ] `step-2-match.svg` - Ícone step 2 (64x64px)
- [ ] `step-3-ranking.svg` - Ícone step 3 (64x64px)

**Observação:** Os outros ícones usam lucide-react (que está pré-instalado) - você só precisa dos acima!

## 🎨 Cores Tailwind Disponíveis

Use estas classes no seu CSS/SVG:

```
text-accent           # Verde brilhante (#22c55e)
text-accent-bright    # Verde mais claro (#4ade80)
text-accent-secondary # Azul elétrico (#0ea5e9)
fill-current          # Usa a cor do parent
```

## ❓ Troubleshooting

**Ícone não aparece?**
1. Verifique o caminho: `/public/icons/nome.svg`
2. Verifique a extensão: `.svg` (minúscula)
3. Check CORS: SVGs em `/public` não têm problema

**SVG fica pixelado?**
- Use `width` e `height` no `<Image>` tag
- Garanta que o SVG tem `viewBox` atributo

**Quer animar o SVG?**
- Use classes Tailwind como `animate-pulse-accent`, `animate-slide-up`
- Ou crie animações CSS custom no seu SVG interno
