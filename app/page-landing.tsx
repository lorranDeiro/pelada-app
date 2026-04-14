'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Trophy, Users, Target, Star } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-premium text-text-primary overflow-hidden">
      {/* ============================================
          NAVBAR / HEADER
          ============================================ */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* PLACEHOLDER: Seu ícone de logo aqui
                Caminho esperado: /public/icons/logo.svg
                Documentação: Ver seção "Usando Ícones Customizados" abaixo
            */}
            <div className="w-10 h-10 bg-accent-secondary rounded-lg flex items-center justify-center">
              ⚽
            </div>
            <span className="text-xl font-bold text-white">Pelada App</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-text-secondary">
            <Link href="#como-funciona" className="hover:text-accent-bright transition">
              Como Funciona
            </Link>
            <Link href="#features" className="hover:text-accent-bright transition">
              Features
            </Link>
            <Link href="/ranking" className="hover:text-accent-bright transition">
              Ranking
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" className="border-surface-border hover:bg-surface">
                Login
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-accent hover:bg-accent-bright text-black font-semibold">
                Começar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-1/4 w-96 h-96 bg-accent-secondary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8 animate-slide-up">
              <div className="space-y-4">
                <div className="inline-block">
                  <span className="px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-accent text-sm font-semibold">
                    ⚡ Gestão de Peladas Inteligente
                  </span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Transforme suas <span className="text-accent-bright">Peladas</span> em <span className="text-accent-secondary">Competição</span>
                </h1>
                <p className="text-lg text-text-secondary max-w-lg">
                  Gerencie partidas, acompanhe rankings em tempo real, e descubra os melhores jogadores da sua galera com precisão e elegância.
                </p>
              </div>

              {/* CTA Primary */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-accent to-accent-bright hover:from-accent-bright hover:to-accent text-black font-bold text-base gap-2"
                  >
                    Começar Agora <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/ranking" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full border-surface-border hover:bg-surface text-text-primary"
                  >
                    Ver Ranking Público
                  </Button>
                </Link>
              </div>

              {/* Social Proof / Stats */}
              <div className="flex gap-8 pt-8 border-t border-surface-border">
                <div>
                  <div className="text-2xl font-bold text-accent">1K+</div>
                  <p className="text-text-secondary text-sm">Peladas Gerenciadas</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">500+</div>
                  <p className="text-text-secondary text-sm">Jogadores Ativos</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">⭐ 4.9</div>
                  <p className="text-text-secondary text-sm">Rating Médio</p>
                </div>
              </div>
            </div>

            {/* Right: Hero Image/Icon */}
            <div className="relative h-96 lg:h-full min-h-96 animate-fade-in">
              {/* PLACEHOLDER: Seu ícone hero aqui
                  Caminho esperado: /public/icons/hero-ball.svg ou /public/icons/hero-field.svg
                  
                  Opções:
                  1. Usando next/image com SVG:
                     <Image 
                       src="/icons/hero-ball.svg" 
                       alt="Football" 
                       fill 
                       className="object-contain" 
                     />
                  
                  2. Ou importar como componente SVG:
                     import HeroBall from '@/public/icons/hero-ball.svg';
                     <HeroBall className="w-full h-full" />
              */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent-secondary/20 rounded-3xl border border-surface-border backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Trophy className="w-32 h-32 text-accent mx-auto animate-pulse-accent" />
                  <p className="text-text-secondary">Seu ícone hero aqui</p>
                  <p className="text-xs text-text-muted">Coloque em: /public/icons/hero-*.svg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          COMO FUNCIONA SECTION
          ============================================ */}
      <section id="como-funciona" className="py-20 lg:py-32 bg-surface/30 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <span className="inline-block px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-accent text-sm font-semibold">
              FUNCIONALIDADE
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Como Funciona
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Três passos simples para gerenciar suas peladas como um profissional
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative p-8 bg-surface border border-surface-border rounded-2xl hover:border-accent/50 transition space-y-6">
                {/* Icon Placeholder */}
                <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition">
                  {/* PLACEHOLDER: Ícone do Step 1
                      Caminho: /public/icons/step-1-create.svg
                      ou use componente lucide: <Users className="w-8 h-8 text-accent" />
                  */}
                  <Users className="w-8 h-8 text-accent" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold">
                    01 • Cadastre Jogadores
                  </h3>
                  <p className="text-text-secondary">
                    Adicione todos os jogadores da sua galera ao sistema com informações básicas como nome e nível de habilidade.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative p-8 bg-surface border border-surface-border rounded-2xl hover:border-accent/50 transition space-y-6">
                {/* Icon Placeholder */}
                <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition">
                  {/* PLACEHOLDER: Ícone do Step 2
                      Caminho: /public/icons/step-2-match.svg
                  */}
                  <Target className="w-8 h-8 text-accent" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold">
                    02 • Registre Partidas
                  </h3>
                  <p className="text-text-secondary">
                    Crie uma nova partida, adicione os jogadores, marque os gols, defesas e outras ações durante o jogo.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative p-8 bg-surface border border-surface-border rounded-2xl hover:border-accent/50 transition space-y-6">
                {/* Icon Placeholder */}
                <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition">
                  {/* PLACEHOLDER: Ícone do Step 3
                      Caminho: /public/icons/step-3-ranking.svg
                  */}
                  <Trophy className="w-8 h-8 text-accent" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold">
                    03 • Veja o Ranking
                  </h3>
                  <p className="text-text-secondary">
                    Acompanhe rankings em tempo real com estatísticas detalhadas: rating, gols, vitórias, MVP e muito mais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURES SECTION
          ============================================ */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <span className="inline-block px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-accent text-sm font-semibold">
              CAPACIDADES
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Tudo que você precisa
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Recursos poderosos e intuitivos para gerenciar suas peladas profissionalmente
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-surface border border-surface-border rounded-2xl space-y-4 hover:border-accent/50 transition">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Ranking em Tempo Real</h3>
                  <p className="text-text-secondary">
                    Estatísticas atualizadas instantaneamente após cada partida com cálculo automático de ratings.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-surface border border-surface-border rounded-2xl space-y-4 hover:border-accent/50 transition">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Trophy className="w-6 h-6 text-accent-secondary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">MVP Automático</h3>
                  <p className="text-text-secondary">
                    Sistema de votação para escolher o melhor jogador de cada partida com histórico de MVPs.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-surface border border-surface-border rounded-2xl space-y-4 hover:border-accent/50 transition">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Balanceamento de Times</h3>
                  <p className="text-text-secondary">
                    Algoritmo inteligente para dividir jogadores de forma equilibrada em dois times.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-8 bg-surface border border-surface-border rounded-2xl space-y-4 hover:border-accent/50 transition">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Star className="w-6 h-6 text-accent-secondary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Comentários e Feedback</h3>
                  <p className="text-text-secondary">
                    Deixe comentários nas partidas e veja o histórico completo de cada jogo com análises.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION
          ============================================ */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-accent/10 via-accent-secondary/10 to-accent/10 border-y border-surface-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">
              Pronto para organizar <span className="text-accent-bright">suas peladas?</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Comece agora mesmo. É grátis e leva menos de 1 minuto para se cadastrar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button 
                size="lg" 
                className="px-8 bg-gradient-to-r from-accent to-accent-bright hover:from-accent-bright hover:to-accent text-black font-bold text-base"
              >
                Criar Conta Grátis
              </Button>
            </Link>
            <Link href="/ranking">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 border-surface-border hover:bg-surface"
              >
                Ver Ranking Primeiro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="border-t border-surface-border bg-background/50 backdrop-blur py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">Pelada App</span>
              </div>
              <p className="text-text-secondary text-sm">
                Gestão profissional de peladas para sua galera.
              </p>
            </div>

            {/* Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Produto</h4>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li>
                  <Link href="#como-funciona" className="hover:text-accent-bright transition">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="hover:text-accent-bright transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/ranking" className="hover:text-accent-bright transition">
                    Ranking
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Empresa</h4>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li>
                  <a href="#" className="hover:text-accent-bright transition">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent-bright transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent-bright transition">
                    Contato
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-text-secondary text-sm">
                <li>
                  <a href="#" className="hover:text-accent-bright transition">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-accent-bright transition">
                    Termos
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-surface-border pt-8 flex flex-col md:flex-row justify-between items-center text-text-secondary text-sm">
            <p>&copy; 2026 Pelada App. Todos os direitos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-accent-bright transition">Twitter</a>
              <a href="#" className="hover:text-accent-bright transition">Instagram</a>
              <a href="#" className="hover:text-accent-bright transition">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
