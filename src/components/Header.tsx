import React from 'react';
import { useAuth, PRESET_PERSONAS } from '../contexts/AuthContext';
import { ShieldCheck, Building2, UserCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenSecurityInspector: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSecurityInspector }) => {
  const { currentPersona, switchPersona, activeTenant, availableTenants, switchTenant } = useAuth();

  return (
    <header className="bg-juridico-dark text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-juridico-primary to-blue-500 flex items-center justify-center text-white shadow-inner">
              <ShieldCheck className="h-6 w-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">JurisAcompanha</span>
                <span className="text-[10px] font-semibold tracking-wider bg-blue-900/80 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50 uppercase">
                  v0.1.0 • RLS Ativo
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Plataforma de Acompanhamento Processual Multi-Tenant
              </p>
            </div>
          </div>

          {/* Controles de Simulação & Multi-Tenancy */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Seletor de Escritório (se o usuário tiver mais de um disponível, como clientes multi-escritório) */}
            {availableTenants.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                <Building2 className="h-4 w-4 text-amber-400" />
                <span className="text-slate-400 hidden md:inline">Escritório:</span>
                <select
                  value={activeTenant.id}
                  onChange={(e) => switchTenant(e.target.value)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                >
                  {availableTenants.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Persona Switcher Interativo para Testes */}
            <div className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-xs transition-colors">
              <UserCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium">Perfil em Simulação:</span>
                <select
                  value={currentPersona.id}
                  onChange={(e) => switchPersona(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
                >
                  {PRESET_PERSONAS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} ({p.userType === 'client' ? 'Cliente' : p.context.membership?.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botão de Auditoria / Inspector RLS */}
            <button
              onClick={onOpenSecurityInspector}
              className="flex items-center space-x-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
              title="Inspecionar isolamento multi-tenant e regras RLS"
            >
              <ShieldAlert className="h-4 w-4 text-blue-400" />
              <span className="hidden lg:inline">Auditoria RLS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-barra de Status do Tenant Ativo */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 sm:px-8 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-300">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>Tenant Atual:</span>
          <span className="font-semibold text-white">{activeTenant.name}</span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            ({activeTenant.slug})
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {currentPersona.userType === 'client' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/50">
              <Sparkles className="w-3 h-3 mr-1 text-emerald-400" />
              Portal do Cliente Ativo
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950 text-blue-300 border border-blue-800/50">
              Painel Administrativo ({currentPersona.context.membership?.role})
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
