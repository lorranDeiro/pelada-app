'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Filter, RotateCcw } from 'lucide-react';

export interface HistoryFilters {
  playerId: string | null;
  team: 'all' | 'escuros' | 'coloridos';
  startDate: string;
  endDate: string;
}

interface HistoryFiltersProps {
  players: Array<{ id: string; name: string }>;
  onFilterChange: (filters: HistoryFilters) => void;
}

export function HistoryFiltersComponent({ players, onFilterChange }: HistoryFiltersProps) {
  const [filters, setFilters] = useState<HistoryFilters>({
    playerId: null,
    team: 'all',
    startDate: '',
    endDate: '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlayerChange = (value: string) => {
    const newFilters = {
      ...filters,
      playerId: value === 'all' ? null : value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTeamChange = (value: string) => {
    const newFilters = {
      ...filters,
      team: value as 'all' | 'escuros' | 'coloridos',
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = {
      ...filters,
      startDate: e.target.value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = {
      ...filters,
      endDate: e.target.value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: HistoryFilters = {
      playerId: null,
      team: 'all',
      startDate: '',
      endDate: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters =
    filters.playerId || filters.team !== 'all' || filters.startDate || filters.endDate;

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white hover:opacity-75 transition"
        >
          <Filter className="h-5 w-5" />
          Filtros Avançados
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-5 h-5 ml-2 text-xs font-bold text-white bg-blue-500 rounded-full">
              {[filters.playerId, filters.team !== 'all' ? 'team' : null, filters.startDate, filters.endDate].filter(Boolean).length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Player Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Jogador
            </label>
            <Select value={filters.playerId || 'all'} onValueChange={handlePlayerChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os jogadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os jogadores</SelectItem>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time
            </label>
            <Select value={filters.team} onValueChange={handleTeamChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os times" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os times</SelectItem>
                <SelectItem value="escuros">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-700 border border-slate-500 rounded-full"></span>
                    Escuros
                  </span>
                </SelectItem>
                <SelectItem value="coloridos">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                    Coloridos
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Data Inicial
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={handleStartDateChange}
              className="w-full"
            />
          </div>

          {/* End Date Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Data Final
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={handleEndDateChange}
              className="w-full"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
