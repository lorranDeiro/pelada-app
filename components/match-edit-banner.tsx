import { AlertCircle } from 'lucide-react';

interface MatchEditBannerProps {
  isEditing: boolean;
}

export function MatchEditBanner({ isEditing }: MatchEditBannerProps) {
  if (!isEditing) return null;

  return (
    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-amber-600">
        <p className="font-semibold">Editando partida finalizada</p>
        <p className="mt-1">As mudanças vão recalcular o nível de todos os jogadores ao salvar.</p>
      </div>
    </div>
  );
}
