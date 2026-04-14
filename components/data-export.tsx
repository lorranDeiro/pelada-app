'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table2 } from 'lucide-react';
import { toast } from 'sonner';

interface DataExportProps {
  exportType: 'ranking' | 'matches' | 'both';
  data?: any;
}

/**
 * Utility functions for data export
 */

function downloadCSV(data: any[], filename: string) {
  // Get headers from first object
  if (data.length === 0) {
    toast.error('Nenhum dado para exportar');
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle strings with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success(`Arquivo "${filename}" baixado com sucesso!`);
}

function downloadPDF(htmlContent: string, filename: string) {
  // For a more complete PDF solution, you'd want to install a library like jsPDF
  // For now, provide alternative or simple implementation

  // Simple approach: print to PDF
  const printWindow = window.open('', '', 'height=600,width=800');
  if (printWindow) {
    printWindow.document.write(
      `<html><head><title>Export</title><style>body { font-family: Arial, sans-serif; }</style></head><body>`
    );
    printWindow.document.write(htmlContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }

  toast.success('Documento enviado para impressão/PDF');
}

export function DataExport({ exportType = 'both', data }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);

      if (exportType === 'ranking' || exportType === 'both') {
        // Fetch ranking data from API or use provided data
        const response = await fetch('/api/export/ranking-csv');
        const csvData = await response.json();

        if (csvData.error) {
          toast.error(csvData.error);
          return;
        }

        downloadCSV(csvData.data, `ranking-${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // Fetch matches data for PDF
      const response = await fetch('/api/export/matches-pdf');
      const pdfData = await response.json();

      if (pdfData.error) {
        toast.error(pdfData.error);
        return;
      }

      // Generate HTML content
      const htmlContent = generateMatchesHTML(pdfData.data);
      const filename = `partidas-${new Date().toISOString().split('T')[0]}.pdf`;

      downloadPDF(htmlContent, filename);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {(exportType === 'ranking' || exportType === 'both') && (
        <Button
          onClick={handleExportCSV}
          disabled={isExporting}
          variant="outline"
          className="gap-2"
        >
          <Table2 className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'CSV Ranking'}
        </Button>
      )}

      {(exportType === 'matches' || exportType === 'both') && (
        <Button
          onClick={handleExportPDF}
          disabled={isExporting}
          variant="outline"
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {isExporting ? 'Exportando...' : 'PDF Partidas'}
        </Button>
      )}
    </div>
  );
}

/**
 * Generate HTML content for PDF export (matches)
 */
function generateMatchesHTML(matches: any[]) {
  const html = `
    <h1>Histórico de Partidas</h1>
    <p>Exportado em: ${new Date().toLocaleString('pt-BR')}</p>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ddd; padding: 8px;">Data</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Time A</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Placar</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Time B</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Duração</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${matches
          .map(
            (match) => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${new Date(match.date).toLocaleDateString('pt-BR')}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Brancos</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${match.team_a_score} x ${match.team_b_score}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Coloridos</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${match.duration_minutes || '-'} min</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${match.status === 'FINISHED' ? 'Finalizada' : 'Em Progresso'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  return html;
}
