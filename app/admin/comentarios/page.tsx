'use client';

import { RequireAuth } from '@/components/require-auth';
import { AdminCommentsManagement } from '@/components/admin-comments-management';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminCommentsPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 mb-4">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard de Comentários
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gerenciar comentários de partidas
              </p>
            </div>
          </div>

          {/* Instructions Card */}
          <Card className="p-4 mb-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>ℹ️ Como funciona:</strong> Comentários de usuários públicos aparecem como
              "Pendentes" e precisam ser aprovados antes de serem visíveis. Aprove bons comentários
              e delete spam/ofensas.
            </p>
          </Card>

          {/* Main Content */}
          <AdminCommentsManagement />
        </div>
      </div>
    </RequireAuth>
  );
}
