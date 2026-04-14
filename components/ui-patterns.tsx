import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ============================================================================
// 🎨 BUTTON VARIANTS - Padrões reutilizáveis
// ============================================================================

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-accent to-accent-bright text-black hover:shadow-lg hover:from-accent-bright hover:to-accent',
        secondary: 'bg-accent-secondary text-white hover:bg-accent-secondary/90',
        outline: 'border-2 border-surface-border text-text-primary hover:bg-surface hover:border-accent/50',
        ghost: 'text-text-primary hover:bg-surface/50',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        xs: 'px-3 py-1.5 text-sm',
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3 text-lg',
        xl: 'px-10 py-4 text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    icon,
    iconPosition = 'left',
    children,
    ...props
  }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="mr-2 flex items-center">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="ml-2 flex items-center">{icon}</span>
      )}
    </button>
  )
);
Button.displayName = 'Button';

// ============================================================================
// 🎨 BADGE VARIANTS
// ============================================================================

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent/10 text-accent border border-accent/30',
        secondary: 'bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/30',
        success: 'bg-green-500/10 text-green-400 border border-green-500/30',
        warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        danger: 'bg-red-500/10 text-red-400 border border-red-500/30',
        subtle: 'bg-surface text-text-secondary border border-surface-border',
      },
      size: {
        sm: 'px-3 py-1 text-xs',
        md: 'px-4 py-1.5 text-sm',
        lg: 'px-5 py-2 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <span className="mr-1.5 flex items-center">{icon}</span>}
      {children}
    </div>
  )
);
Badge.displayName = 'Badge';

// ============================================================================
// 🎨 CARD VARIANTS - Com hover effects
// ============================================================================

const cardVariants = cva(
  'rounded-2xl border transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-surface border-surface-border hover:border-accent/50',
        elevated: 'bg-surface border-surface-border shadow-premium hover:shadow-premium-lg hover:border-accent/50',
        gradient: 'bg-gradient-to-br from-accent/5 to-transparent border-surface-border hover:border-accent/50',
        glowing: 'bg-surface border-accent/30 shadow-accent hover:shadow-lg',
      },
      interactive: {
        true: 'cursor-pointer hover:scale-105',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

// ============================================================================
// 🎨 STATS SHOWCASE COMPONENT
// ============================================================================

interface StatProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
}

export const Stat: React.FC<StatProps> = ({ value, label, icon, trend }) => (
  <div className="flex flex-col items-center gap-2 text-center">
    {icon && <div className="text-3xl text-accent">{icon}</div>}
    <div className="text-3xl font-bold text-text-primary">{value}</div>
    <div className="text-sm text-text-secondary">{label}</div>
    {trend && (
      <div className={trend === 'up' ? 'text-green-400 text-xs' : 'text-red-400 text-xs'}>
        {trend === 'up' ? '↑' : '↓'} Crescendo
      </div>
    )}
  </div>
);

// ============================================================================
// 🎨 FEATURE CARD COM HOVER GRADIENT
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  badge,
}) => (
  <div className="group relative">
    {/* Background glow on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent-secondary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    {/* Card content */}
    <Card
      variant="elevated"
      className="relative p-8 group-hover:border-accent transition-all duration-300"
    >
      {badge && (
        <Badge size="sm" className="mb-4">
          {badge}
        </Badge>
      )}

      {/* Icon with glow */}
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-2xl group-hover:bg-accent/20 group-hover:shadow-accent transition-all duration-300">
        {icon}
      </div>

      {/* Title */}
      <h3 className="mt-4 text-xl font-bold text-text-primary group-hover:text-accent transition-colors">
        {title}
      </h3>

      {/* Description */}
      <p className="mt-2 text-text-secondary leading-relaxed">
        {description}
      </p>

      {/* Arrow indicator on hover */}
      <div className="mt-4 flex items-center text-accent opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-sm font-semibold">Saiba mais</span>
        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Card>
  </div>
);

// ============================================================================
// 🎨 SECTION HEADER - Padrão para seções
// ============================================================================

interface SectionHeaderProps {
  tag?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  tag,
  title,
  subtitle,
  centered = true,
}) => (
  <div className={centered ? 'text-center' : 'text-left'}>
    {tag && (
      <Badge size="sm" className="mx-auto mb-4">
        {tag}
      </Badge>
    )}

    <h2 className="text-4xl lg:text-5xl font-bold text-text-primary">
      {title.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < title.split('\n').length - 1 && <br />}
        </React.Fragment>
      ))}
    </h2>

    {subtitle && (
      <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto lg:mx-0">
        {subtitle}
      </p>
    )}
  </div>
);

// ============================================================================
// 🎨 STEP COMPONENT - Para "Como Funciona"
// ============================================================================

interface StepProps {
  number: number | string;
  icon: React.ReactNode;
  title: string;
  description: string;
  connectedToNext?: boolean;
}

export const Step: React.FC<StepProps> = ({
  number,
  icon,
  title,
  description,
  connectedToNext,
}) => (
  <div className="relative flex flex-col items-center">
    {/* Number badge */}
    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-accent to-accent-bright text-black font-bold text-xl mb-4 shadow-lg">
      {number}
    </div>

    {/* Icon */}
    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 text-4xl mb-4 shadow-accent">
      {icon}
    </div>

    {/* Content */}
    <h3 className="font-bold text-xl text-text-primary text-center">{title}</h3>
    <p className="mt-2 text-text-secondary text-center text-sm leading-relaxed max-w-xs">
      {description}
    </p>

    {/* Connection line to next step */}
    {connectedToNext && (
      <div className="hidden lg:block absolute top-full left-1/2 w-0.5 h-12 bg-gradient-to-b from-accent/50 to-transparent transform -translate-x-1/2 mt-4" />
    )}
  </div>
);

// ============================================================================
// 🎨 CTA SECTION - Padrão final
// ============================================================================

interface CTASectionProps {
  title: string;
  subtitle?: string;
  primaryButton: {
    label: string;
    onClick?: () => void;
  };
  secondaryButton?: {
    label: string;
    onClick?: () => void;
  };
}

export const CTASection: React.FC<CTASectionProps> = ({
  title,
  subtitle,
  primaryButton,
  secondaryButton,
}) => (
  <div className="bg-gradient-to-r from-accent/10 via-accent-secondary/5 to-accent/10 py-20 px-4 rounded-3xl border border-accent/20 shadow-accent text-center">
    <h2 className="text-4xl lg:text-5xl font-bold text-text-primary mb-4">
      {title}
    </h2>

    {subtitle && (
      <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
        {subtitle}
      </p>
    )}

    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        variant="primary"
        size="lg"
        onClick={primaryButton.onClick}
      >
        {primaryButton.label}
      </Button>

      {secondaryButton && (
        <Button
          variant="outline"
          size="lg"
          onClick={secondaryButton.onClick}
        >
          {secondaryButton.label}
        </Button>
      )}
    </div>
  </div>
);

// ============================================================================
// 🎨 GRADIENT TEXT COMPONENT
// ============================================================================

interface GradientTextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'dual' | 'rainbow';
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  variant = 'primary',
}) => {
  const gradients = {
    primary: 'bg-gradient-to-r from-accent to-accent-bright',
    dual: 'bg-gradient-to-r from-accent to-accent-secondary',
    rainbow: 'bg-gradient-to-r from-accent via-accent-secondary to-accent-bright',
  };

  return (
    <span className={`${gradients[variant]} bg-clip-text text-transparent`}>
      {children}
    </span>
  );
};

// ============================================================================
// 🎨 CONTAINER COMPONENTS
// ============================================================================

export const Container: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', className)} {...props} />
);

export const Section: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <section className={cn('py-20 lg:py-32', className)} {...props} />
);

// ============================================================================
// 📚 EXEMPLOS DE USO
// ============================================================================

/**
 * EXEMPLO 1: Hero com Buttons
 * 
 * <Section className="bg-gradient-premium py-32">
 *   <Container>
 *     <h1 className="text-6xl font-bold">Transforme suas Peladas em <GradientText>Competição</GradientText></h1>
 *     <div className="mt-8 flex gap-4">
 *       <Button variant="primary" size="lg">Começar</Button>
 *       <Button variant="outline" size="lg">Ver Demo</Button>
 *     </div>
 *   </Container>
 * </Section>
 */

/**
 * EXEMPLO 2: Features Grid
 * 
 * <Section>
 *   <Container>
 *     <SectionHeader 
 *       tag="Recursos"
 *       title="Tudo que você precisa"
 *       subtitle="Ferramentas completas para gerenciar suas peladas"
 *     />
 *     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
 *       <FeatureCard icon="⚽" title="Gestão" description="Crie e gerencie partidas facilmente" />
 *       <FeatureCard icon="📊" title="Rankings" description="Acompanhe performance dos jogadores" />
 *       ...
 *     </div>
 *   </Container>
 * </Section>
 */

/**
 * EXEMPLO 3: Como Funciona
 * 
 * <Section>
 *   <Container>
 *     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 *       <Step number={1} icon="📝" title="Cadastre" description="Adicione seus jogadores" connectedToNext />
 *       <Step number={2} icon="⚽" title="Participe" description="Entre em partidas" connectedToNext />
 *       <Step number={3} icon="🏆" title="Suba" description="Melhore seu ranking" />
 *     </div>
 *   </Container>
 * </Section>
 */
