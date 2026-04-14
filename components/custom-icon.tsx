'use client';

import Image from 'next/image';

interface CustomIconProps {
  /**
   * Nome do ícone (sem extensão .svg)
   * Exemplo: 'hero-ball', 'step-1-create'
   * Caminho esperado: /public/icons/{name}.svg
   */
  name: string;
  
  /**
   * Texto alternativo (acessibilidade)
   */
  alt: string;
  
  /**
   * Largura em pixels (usado por next/image)
   * @default 400
   */
  width?: number;
  
  /**
   * Altura em pixels (usado por next/image)
   * @default 400
   */
  height?: number;
  
  /**
   * Classes Tailwind CSS customizadas
   * @default 'w-full h-auto'
   */
  className?: string;
  
  /**
   * Prioritiza carregamento (para hero images acima da fold)
   * @default false
   */
  priority?: boolean;
  
  /**
   * Aplica animação de pulse de acento
   * @default false
   */
  animated?: boolean;
  
  /**
   * Callback ao clicar na imagem
   */
  onClick?: () => void;
}

/**
 * Componente wrapper para ícones customizados SVG
 * 
 * @example
 * ```tsx
 * <CustomIcon
 *   name="hero-ball"
 *   alt="Football"
 *   width={400}
 *   height={400}
 *   priority
 *   animated
 *   className="w-96 h-auto"
 * />
 * ```
 * 
 * @see GUIA_ICONS_CUSTOMIZADOS.md para más detalles
 */
export function CustomIcon({
  name,
  alt,
  width = 400,
  height = 400,
  className = 'w-full h-auto',
  priority = false,
  animated = false,
  onClick,
}: CustomIconProps) {
  return (
    <Image
      src={`/icons/${name}.svg`}
      alt={alt}
      width={width}
      height={height}
      className={`
        ${className}
        ${animated ? 'animate-pulse-accent' : ''}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition' : ''}
      `}
      priority={priority}
      onClick={onClick}
    />
  );
}

/**
 * Variações customizadas de ícones para casos de uso específicos
 */

export function LogoIcon({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <CustomIcon
      name="logo"
      alt="Pelada App Logo"
      width={40}
      height={40}
      className={className}
    />
  );
}

export function HeroBallIcon({ 
  animated = true,
  className = 'w-96 h-auto'
}: { animated?: boolean; className?: string }) {
  return (
    <CustomIcon
      name="hero-ball"
      alt="Football Ball"
      width={400}
      height={400}
      priority
      animated={animated}
      className={className}
    />
  );
}

export function StepIcon({
  step,
  className = 'w-16 h-16'
}: {
  step: 1 | 2 | 3;
  className?: string;
}) {
  const stepMap = {
    1: { name: 'step-1-create', alt: 'Cadastrar Jogadores' },
    2: { name: 'step-2-match', alt: 'Registrar Partidas' },
    3: { name: 'step-3-ranking', alt: 'Ver Ranking' },
  };

  const step_config = stepMap[step];

  return (
    <CustomIcon
      name={step_config.name}
      alt={step_config.alt}
      width={64}
      height={64}
      className={className}
    />
  );
}
