# 🚀 Guia de Implementação - Design System

**Status:** ✅ Completo e pronto para usar  
**Paleta:** Premium Dark Mode  
**Framework:** Next.js 16 + Tailwind CSS 4 + TypeScript

---

## 📁 Estrutura de Arquivos Criados

```
pelada-app/
├── tailwind.config.ts                 ✅ Configuração de cores/gradientes/animações
├── BRAND_STYLE_GUIDE.md               ✅ Documentação visual (cores, componentes, exemplos)
├── GUIA_ICONS_CUSTOMIZADOS.md         ✅ Como integrar ícones customizados
├── app/
│   ├── page.tsx                       📍 Dashboard autenticado (mantém como está)
│   ├── page-landing.tsx               ✅ Landing page nova (pronta para usar)
│   └── layout.tsx                     ✅ Layout principal
├── components/
│   ├── custom-icon.tsx                ✅ Component para SVG customizados
│   ├── ui-patterns.tsx                ✅ Biblioteca de componentes reutilizáveis (NEW)
│   ├── ui/                            
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...outros                  (Existentes - ainda usáveis)
│   └── app-nav.tsx
└── public/
    └── icons/                         ⏳ Coloque seus SVGs aqui
        ├── logo.svg
        ├── hero-ball.svg
        ├── step-1-create.svg
        ├── step-2-match.svg
        └── step-3-ranking.svg
```

---

## 🎯 Próximos Passos (Para o Usuário)

### **Passo 1: Colocar Ícones Customizados** 📁

1. Vá para `/public/icons/`
2. Coloque seus 5 ícones SVG:
   - `logo.svg` (40x40 approx)
   - `hero-ball.svg` (400x400 approx)
   - `step-1-create.svg` (64x64)
   - `step-2-match.svg` (64x64)
   - `step-3-ranking.svg` (64x64)

**Dica:** [Ver guia completo em GUIA_ICONS_CUSTOMIZADOS.md](./GUIA_ICONS_CUSTOMIZADOS.md)

### **Passo 2: Ativar Landing Page** 🚀

Escolha **UMA** das opções:

#### **Opção A: Landing Page como Homepage** (Recomendado)
```bash
# 1. Renomear página existente
mv app/page.tsx app/dashboard.tsx

# 2. Renomear landing page
mv app/page-landing.tsx app/page.tsx

# 3. Criar rota /dashboard
mkdir -p app/dashboard
mv app/dashboard.tsx app/dashboard/page.tsx

# 4. (Opcional) Proteger dashboard com auth
# Veja require-auth.tsx para implementação
```

#### **Opção B: Landing Page em Rota Separada**
```bash
# 1. Criar pasta landing
mkdir -p app/landing

# 2. Mover página
mv app/page-landing.tsx app/landing/page.tsx

# 3. Página atual (página.tsx) continua como homepage
# HomePage agora mostra landing ou dashboard baseado em autenticação
```

**Minha recomendação:** Opção A (landing como homepage, dashboard em `/dashboard`)

### **Passo 3: Testar Build & Deploy** ✅

```bash
# Instalar dependências (se nova paleta requer packages)
npm install

# Build
npm run build

# Dev
npm run dev

# Acessar
open http://localhost:3000
```

---

## 🎨 Como Usar os Componentes Novos

### **Importar Componentes**

```tsx
import {
  Button,
  Badge,
  Card,
  FeatureCard,
  SectionHeader,
  Step,
  CTASection,
  GradientText,
  Container,
  Section,
} from '@/components/ui-patterns';
```

### **Exemplo 1: Seção com Features**

```tsx
import { Section, Container, SectionHeader, FeatureCard } from '@/components/ui-patterns';
import { Trophy, Zap, Users, Star } from 'lucide-react';

export default function FeaturesSection() {
  return (
    <Section className="bg-background">
      <Container>
        <SectionHeader
          tag="🎯 Recursos"
          title="Tudo que você precisa"
          subtitle="Ferramentas completas para gerenciar suas peladas"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <FeatureCard
            icon={<Trophy className="w-6 h-6" />}
            title="Ranking Dinâmico"
            description="Acompanhe a evolução de cada jogador"
            badge="Popular"
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="MVP em Tempo Real"
            description="Sistema de votação instantâneo"
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Balanceamento"
            description="Equipes justas automaticamente"
          />
          <FeatureCard
            icon={<Star className="w-6 h-6" />}
            title="Comentários"
            description="Comunidade envolvida"
          />
        </div>
      </Container>
    </Section>
  );
}
```

### **Exemplo 2: Heroic CTA**

```tsx
import { CTASection, Button } from '@/components/ui-patterns';

export default function CTAHero() {
  return (
    <CTASection
      title="Pronto para começar?"
      subtitle="Junte-se a milhares de jogadores que já estão transformando suas partidas"
      primaryButton={{
        label: "Começar Agora",
        onClick: () => window.location.href = '/signup'
      }}
      secondaryButton={{
        label: "Ver Demo",
        onClick: () => window.location.href = '/demo'
      }}
    />
  );
}
```

### **Exemplo 3: Hero Section**

```tsx
import { Section, Container, GradientText, Button } from '@/components/ui-patterns';

export default function Hero() {
  return (
    <Section className="bg-gradient-premium py-32 flex items-center">
      <Container>
        <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
          Transforme suas <GradientText variant="dual">Peladas</GradientText> em
          <GradientText>Competição</GradientText>
        </h1>

        <p className="mt-6 text-xl text-text-secondary max-w-2xl">
          Gerencie partidas, acompanhe rankings e desfrute de uma comunidade desportiva
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button variant="primary" size="lg">
            Começar Agora
          </Button>
          <Button variant="outline" size="lg">
            Ver Ranking
          </Button>
        </div>

        {/* Social Proof */}
        <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl">
          <div>
            <div className="text-3xl font-bold text-accent">1K+</div>
            <div className="text-sm text-text-secondary">Partidas</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">500+</div>
            <div className="text-sm text-text-secondary">Jogadores</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">4.9★</div>
            <div className="text-sm text-text-secondary">Avaliação</div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
```

### **Exemplo 4: Como Funciona**

```tsx
import { Section, Container, SectionHeader, Step } from '@/components/ui-patterns';

export default function HowItWorks() {
  return (
    <Section>
      <Container>
        <SectionHeader
          tag="⚙️ Processo"
          title="Como Funciona"
          subtitle="3 passos simples para começar"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Step
            number={1}
            icon="📝"
            title="Cadastre Jogadores"
            description="Adicione seus amigos à plataforma e crie sua comunidade"
            connectedToNext
          />
          <Step
            number={2}
            icon="⚽"
            title="Registre Partidas"
            description="Crie partidas, marque gols e acompanhe o jogo em tempo real"
            connectedToNext
          />
          <Step
            number={3}
            icon="🏆"
            title="Veja Rankings"
            description="Conheça os melhores jogadores e compare performances"
          />
        </div>
      </Container>
    </Section>
  );
}
```

### **Exemplo 5: Button Variants**

```tsx
import { Button } from '@/components/ui-patterns';

export default function ButtonShowcase() {
  return (
    <div className="space-y-4 p-8">
      <Button variant="primary" size="lg">Primary Button</Button>
      <Button variant="secondary" size="lg">Secondary Button</Button>
      <Button variant="outline" size="lg">Outline Button</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="danger">Danger Button</Button>
      
      {/* Com ícones */}
      <Button variant="primary" icon="🚀" iconPosition="left">
        Com Ícone
      </Button>
      
      {/* Full Width */}
      <Button variant="primary" size="lg" fullWidth>
        Full Width Button
      </Button>
    </div>
  );
}
```

---

## 🎨 Modificar Cores (Customizações)

Se quiser ajustar as cores, edite `tailwind.config.ts`:

```javascript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        // Mudar verde principal
        accent: {
          DEFAULT: '#22c55e',  // ← ajuste aqui
          bright: '#4ade80',   // ← e aqui
        },
        
        // Mudar background
        background: {
          DEFAULT: '#0f172a',  // ← ajuste aqui
          secondary: '#1a2335',
        },
        
        // Mudar azul secundário
        accent: {
          secondary: '#0ea5e9', // ← ajuste aqui
        },
      },
    },
  },
};
```

Depois:
```bash
npm run dev  # Tailwind recompila automaticamente
```

---

## 🔄 Substituir Ícones Lucide por Customizados

Quando tiver os ícones SVG prontos:

### **Opção 1: Usar CustomIcon Component**

```tsx
// Antes (usando lucide)
import { Trophy } from 'lucide-react';

export default function Feature() {
  return <Trophy className="w-6 h-6" />;
}

// Depois (usando CustomIcon)
import { CustomIcon } from '@/components/custom-icon';

export default function Feature() {
  return <CustomIcon name="step-1-create" alt="Create" width={64} height={64} />;
}
```

### **Opção 2: Import como Componente (se usar @svgr/webpack)**

```tsx
import { ReactComponent as LogoBall } from '@/public/icons/hero-ball.svg';

export default function Hero() {
  return <LogoBall className="w-96 h-auto" />;
}
```

**Veja detalhes em:** [GUIA_ICONS_CUSTOMIZADOS.md](./GUIA_ICONS_CUSTOMIZADOS.md)

---

## ✅ Checklist de Implementação

### **Configuração** (Já feito ✅)
- [x] `tailwind.config.ts` criado
- [x] Paleta de cores definida
- [x] `tailwind.config.ts` aplicada globalmente

### **Componentes** (Já feito ✅)
- [x] `page-landing.tsx` criado
- [x] `custom-icon.tsx` criado
- [x] `ui-patterns.tsx` criado com 8+ componentes reutilizáveis
- [x] `BRAND_STYLE_GUIDE.md` documentado

### **Guias** (Já feito ✅)
- [x] `GUIA_ICONS_CUSTOMIZADOS.md` criado
- [x] Exemplos de uso em código

### **Próximas Ações** (Para fazer)
- [ ] Colocar ícones em `/public/icons/`
- [ ] Escolher opção de ativação (Opção A ou B)
- [ ] Testar `npm run build`
- [ ] Refinar cores baseado em feedback
- [ ] Atualizar `page.tsx` ou `layout.tsx` se necessário
- [ ] Testar em mobile (responsividade)
- [ ] Validar contrast (WCAG AA)

---

## 🚀 Comandos Rápidos

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Verificar erros TypeScript
npm run type-check

# Build e deploy
npm run build && npm start

# Limpar cache
rm -rf .next && npm run dev
```

---

## 📚 Referências

- **Tailwind Docs:** https://tailwindcss.com
- **CVA (class-variance-authority):** https://cva.style
- **Next.js Image:** https://nextjs.org/docs/app/api-reference/components/image
- **Lucide Icons:** https://lucide.dev

---

## 🆘 Troubleshooting

### **Problema: Cores não estão aplicando**
**Solução:**
```bash
# 1. Limpar cache
rm -rf .next
npm run dev

# 2. Verificar tailwind.config.ts existe
ls tailwind.config.ts

# 3. Reiniciar Dev Server
# Ctrl+C e npm run dev novamente
```

### **Problema: Ícones não aparecem**
**Solução:**
1. Verificar se arquivo existe: `/public/icons/nome.svg`
2. Verificar nome exato no component
3. Ver console do browser (F12) para erros
4. [Ver guia completo em GUIA_ICONS_CUSTOMIZADOS.md](./GUIA_ICONS_CUSTOMIZADOS.md)

### **Problema: Build falha**
**Solução:**
```bash
# 1. Verificar erros
npm run type-check

# 2. Limpar deps
rm -rf node_modules package-lock.json
npm install

# 3. Build fresh
npm run build
```

---

## 📞 Suporte & Customizações

Se precisar: - Ajustar paleta de cores
- Adicionar novos variants de Button
- Criar novos componentes seguindo o padrão
- Integrar ícones customizados

Todos os arquivos estão bem documentados e prontos para customização! 🎉

