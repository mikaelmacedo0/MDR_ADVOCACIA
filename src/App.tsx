import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { AdminDashboard } from './modules/portal-admin/AdminDashboard';
import { ClientPortal } from './modules/portal-client/ClientPortal';
import { SecurityInspectorModal } from './components/SecurityInspectorModal';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [isSecurityInspectorOpen, setIsSecurityInspectorOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header onOpenSecurityInspector={() => setIsSecurityInspectorOpen(true)} />

      <main className="flex-1">
        {currentUser.user_type === 'client' ? (
          <ClientPortal />
        ) : (
          <AdminDashboard />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 px-4 sm:px-8 text-xs mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">JurisAcompanha</span>
            <span>— Segurança Jurídica & Isolamento Multi-Tenant</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span className="inline-flex items-center text-[11px] text-slate-300">
              <Lock className="h-3 w-3 mr-1 text-blue-400" />
              PostgreSQL RLS Habilitado
            </span>
            <span>•</span>
            <span className="text-[11px]">Conformidade LGPD</span>
            <span>•</span>
            <button
              onClick={() => setIsSecurityInspectorOpen(true)}
              className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center"
            >
              <span>Relatório de Ameaças & RLS</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </footer>

      <SecurityInspectorModal
        isOpen={isSecurityInspectorOpen}
        onClose={() => setIsSecurityInspectorOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
