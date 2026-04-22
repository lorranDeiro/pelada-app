'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Table2 } from 'lucide-react';
import { toast } from 'sonner';

interface DataExportProps {
  exportType?: 'ranking' | 'matches' | 'both';
}

export function DataExport({ exportType = 'ranking' }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      // Server handles CSV generation and automatic download
      window.location.href = '/api/export/ranking-csv';
      toast.success('Download iniciado...');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      // Reset after delay to ensure download starts
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <div className="flex gap-2">
      {(exportType === 'ranking' || exportType === 'both') && (
        <Button
          onClick={handleExportCSV}
          disabled={isExporting}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? 'Exportando...' : 'CSV Ranking'}
        </Button>
      )}
    </div>
  );
}
