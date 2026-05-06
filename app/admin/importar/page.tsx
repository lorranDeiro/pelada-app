'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Season } from '@/lib/types';

interface CSVRow {
  name: string;
  goals: number;
  assists: number;
  saves: number;
  wins: number;
  draws: number;
  losses: number;
  total_points: number;
  avg_rating: number;
  matches_played: number;
}

export default function AdminImportPage() {
  return (
    <RequireAuth>
      <AdminImportContent />
    </RequireAuth>
  );
}

function AdminImportContent() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [seasonName, setSeasonName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  if (!loading && !isAdmin) {
    router.replace('/jogador');
    return null;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview([]);
    setImportResult(null);

    // Parse CSV preview
    setParsing(true);
    try {
      const text = await selectedFile.text();
      const rows = text.trim().split('\n');
      const headers = rows[0]
        ?.split(',')
        .map((h) => h.trim().toLowerCase()) || [];

      const data: CSVRow[] = rows.slice(1, 6).map((row) => {
        const cells = row.split(',').map((c) => c.trim());
        return {
          name: cells[headers.indexOf('name')] || '',
          goals: parseInt(cells[headers.indexOf('goals')]) || 0,
          assists: parseInt(cells[headers.indexOf('assists')]) || 0,
          saves: parseInt(cells[headers.indexOf('saves')]) || 0,
          wins: parseInt(cells[headers.indexOf('wins')]) || 0,
          draws: parseInt(cells[headers.indexOf('draws')]) || 0,
          losses: parseInt(cells[headers.indexOf('losses')]) || 0,
          total_points: parseInt(cells[headers.indexOf('total_points')]) || 0,
          avg_rating: parseFloat(cells[headers.indexOf('avg_rating')]) || 0,
          matches_played: parseInt(cells[headers.indexOf('matches_played')]) || 0,
        };
      });

      setPreview(data);
    } catch (err) {
      toast.error('Erro ao ler arquivo', {
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !seasonName.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const rows = text.trim().split('\n');
      const headers = rows[0]
        ?.split(',')
        .map((h) => h.trim().toLowerCase()) || [];

      // Create or fetch season
      let season: Season | null = null;

      const { data: existingSeason } = await supabase
        .from('seasons')
        .select('*')
        .eq('name', seasonName.trim())
        .maybeSingle();

      if (existingSeason) {
        season = existingSeason;
      } else {
        const { data: newSeason, error: createError } = await supabase
          .from('seasons')
          .insert({
            name: seasonName.trim(),
            start_date: new Date().toISOString().slice(0, 10),
            end_date: new Date().toISOString().slice(0, 10),
            active: false,
          })
          .select()
          .single();

        if (createError) throw createError;
        season = newSeason;
      }

      if (!season) {
        throw new Error('Não foi possível obter a temporada de destino.');
      }

      // Get all players
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, name');

      if (playersError) throw playersError;

      const playersByName = new Map(players?.map((p) => [p.name.toLowerCase(), p.id]) || []);

      // Insert/update stats
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.trim()) continue;

        const cells = row.split(',').map((c) => c.trim());
        const playerName = cells[headers.indexOf('name')] || '';

        if (!playerName) {
          failed++;
          errors.push(`Linha ${i + 1}: Jogador sem nome`);
          continue;
        }

        const playerId = playersByName.get(playerName.toLowerCase());

        if (!playerId) {
          failed++;
          errors.push(`Linha ${i + 1}: Jogador "${playerName}" não encontrado`);
          continue;
        }

        const seasonStats = {
          player_id: playerId,
          season_id: season.id,
          goals: parseInt(cells[headers.indexOf('goals')]) || 0,
          assists: parseInt(cells[headers.indexOf('assists')]) || 0,
          saves: parseInt(cells[headers.indexOf('saves')]) || 0,
          wins: parseInt(cells[headers.indexOf('wins')]) || 0,
          draws: parseInt(cells[headers.indexOf('draws')]) || 0,
          losses: parseInt(cells[headers.indexOf('losses')]) || 0,
          total_points: parseInt(cells[headers.indexOf('total_points')]) || 0,
          avg_rating: parseFloat(cells[headers.indexOf('avg_rating')]) || 0,
          matches_played: parseInt(cells[headers.indexOf('matches_played')]) || 0,
        };

        // Insert or update
        const { error } = await supabase
          .from('player_season_stats')
          .upsert(seasonStats, {
            onConflict: 'player_id,season_id',
          });

        if (error) {
          failed++;
          errors.push(`Linha ${i + 1}: ${error.message}`);
        } else {
          success++;
        }
      }

      setImportResult({ success, failed, errors: errors.slice(0, 5) });
      
      if (success > 0) {
        toast.success(`Importados ${success} registros com sucesso!`);
        setTimeout(() => router.push('/admin'), 2000);
      }
    } catch (err) {
      toast.error('Erro na importação', {
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setImporting(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        Carregando…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-premium text-text-primary">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        {/* Header */}
        <Link
          href="/admin"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-text-secondary transition hover:text-accent-bright"
        >
          <ArrowLeft className="size-4" /> Voltar ao painel
        </Link>

        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Importar Estatísticas (CSV)</h1>
          <p className="text-text-secondary">
            Importe dados de temporadas passadas através de um arquivo CSV
          </p>
        </header>

        {/* Instructions Card */}
        <Card className="mb-8 p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Formato do CSV</h3>
          <p className="text-sm text-blue-800 mb-3">
            O arquivo deve ter as seguintes colunas (na ordem):
          </p>
          <code className="block bg-white p-2 rounded text-xs text-gray-700 overflow-x-auto mb-3">
            name,goals,assists,saves,wins,draws,losses,total_points,avg_rating,matches_played
          </code>
          <p className="text-sm text-blue-800">
            <strong>Exemplo:</strong>
          </p>
          <code className="block bg-white p-2 rounded text-xs text-gray-700 overflow-x-auto">
            Neymar,5,3,0,4,1,0,45,8.5,5
          </code>
        </Card>

        {/* Import Form */}
        <Card className="p-6 space-y-6">
          {/* File Input */}
          <div className="space-y-2">
            <Label>Arquivo CSV *</Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={parsing || importing}
              />
            </div>
            {file && <p className="text-xs text-text-secondary">📄 {file.name}</p>}
          </div>

          {/* Season Name */}
          <div className="space-y-2">
            <Label>Nome da Temporada *</Label>
            <Input
              placeholder="Ex: 2024/1 - Passada"
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              disabled={importing}
            />
            <p className="text-xs text-text-secondary">
              Ex: "2024/1" ou "Temporada Passada"
            </p>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Prévia dos dados:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-2 py-1">Nome</th>
                      <th className="text-right px-1 py-1">G</th>
                      <th className="text-right px-1 py-1">A</th>
                      <th className="text-right px-1 py-1">D</th>
                      <th className="text-right px-1 py-1">V</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="text-left px-2 py-1">{row.name}</td>
                        <td className="text-right px-1 py-1">{row.goals}</td>
                        <td className="text-right px-1 py-1">{row.assists}</td>
                        <td className="text-right px-1 py-1">{row.saves}</td>
                        <td className="text-right px-1 py-1">{row.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div
              className={`p-4 rounded-lg border ${
                importResult.failed === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex gap-2 mb-2">
                {importResult.failed === 0 ? (
                  <CheckCircle className="size-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="size-5 text-yellow-600 shrink-0" />
                )}
                <div>
                  <p
                    className={
                      importResult.failed === 0
                        ? 'text-green-900 font-semibold'
                        : 'text-yellow-900 font-semibold'
                    }
                  >
                    {importResult.success} importados
                    {importResult.failed > 0 && `, ${importResult.failed} com erro`}
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="text-xs mt-2 space-y-1">
                      {importResult.errors.map((err, i) => (
                        <li
                          key={i}
                          className="text-yellow-700"
                        >
                          • {err}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Link href="/admin">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button
              onClick={handleImport}
              disabled={!file || !seasonName.trim() || importing}
              className="gap-2"
            >
              <Upload className="size-4" />
              {importing ? 'Importando…' : 'Importar'}
            </Button>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 p-4 bg-gray-50">
          <h4 className="font-semibold mb-2">💡 Dicas</h4>
          <ul className="text-sm space-y-1 text-text-secondary">
            <li>
              • Certifique-se de que todos os jogadores no CSV já existem na base
            </li>
            <li>
              • O matching de nomes é case-insensitive, mas deve ser exato
            </li>
            <li>
              • Números devem ser inteiros, exceto "avg_rating" que pode ter decimais
            </li>
            <li>
              • Você pode reimportar a mesma temporada para atualizar dados
            </li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
