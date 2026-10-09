import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_TENANTS } from '../../services/mockData';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    loginStaff,
    loginClientWithGoogle,
    loginClientWithEmail,
    registerClient,
    switchTenant,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'client'>('admin');
  const [clientMode, setClientMode] = useState<'login' | 'register'>('login');

  // Formulário Admin / Staff
  const [staffEmail, setStaffEmail] = useState('carlos@silvaadvocacia.com.br');
  const [staffPassword, setStaffPassword] = useState('Admin@2026');
  const [staffError, setStaffError] = useState('');

  // Formulário Cliente
  const [clientEmail, setClientEmail] = useState('mariana.oliveira@gmail.com');
  const [clientPassword, setClientPassword] = useState('Cliente@2026');
  const [clientFullName, setClientFullName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientTenantId, setClientTenantId] = useState(MOCK_TENANTS[0].id);
  const [clientError, setClientError] = useState('');
  const [clientSuccess, setClientSuccess] = useState('');

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    const res = loginStaff(staffEmail, staffPassword);
    if (!res.success) {
      setStaffError(res.error || 'Credenciais inválidas.');
    }
  };

  const handleClientEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    const res = loginClientWithEmail(clientEmail, clientPassword);
    if (!res.success) {
      setClientError(res.error || 'Falha no login do cliente.');
    }
  };

  const handleGoogleLogin = () => {
    loginClientWithGoogle();
  };

  const handleClientRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    setClientSuccess('');

    if (!clientFullName.trim() || !clientEmail.trim()) {
      setClientError('Nome completo e e-mail são obrigatórios.');
      return;
    }

    switchTenant(clientTenantId);
    const res = registerClient(clientFullName, clientEmail, clientPhone, 'custom');
    if (!res.success) {
      setClientError(res.error || 'Erro ao realizar cadastro.');
      return;
    }

    setClientSuccess('Cadastro realizado com sucesso! Redirecionando...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-juridico-dark to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      {/* Cabeçalho Superior da Página */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-juridico-primary to-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-900/40 border border-blue-400/30">
          <ShieldCheck className="h-8 w-8 text-blue-100" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
          JurisAcompanha
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Acompanhamento Processual Jurídico com Isolamento Multi-Tenant Estrito
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Seletor de Tipo de Acesso (Abas) */}
        <div className="bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 flex space-x-1.5 mb-6 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'admin'
                ? 'bg-juridico-primary text-white shadow-md border border-blue-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Building2 className="h-4 w-4 text-blue-300" />
            <span>Equipe do Escritório (Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'client'
                ? 'bg-emerald-700 text-white shadow-md border border-emerald-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <span>Portal do Cliente</span>
          </button>
        </div>

        {/* Card Principal */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* ============================================================ */}
          {/* FLUXO 1: ACESSO ADMINISTRADOR / EQUIPE DO ESCRITÓRIO         */}
          {/* ============================================================ */}
          {activeTab === 'admin' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-900 px-2.5 py-1 rounded-md text-xs font-semibold mb-2">
                  <Lock className="h-3.5 w-3.5 text-blue-700" />
                  <span>Ambiente Restrito aos Advogados e Administradores</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Autenticação Corporativa
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  O administrador autenticado possui autorização para criar, alterar senhas, consultar, editar permissões e excluir usuários do seu escritório.
                </p>
              </div>

              {staffError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{staffError}</span>
                </div>
              )}

              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      placeholder="exemplo@silvaadvocacia.com.br"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-juridico-primary focus:border-juridico-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-juridico-primary focus:border-juridico-primary outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-juridico-primary hover:bg-juridico-dark text-white rounded-lg text-sm font-bold shadow-md shadow-blue-900/20 transition-all flex items-center justify-center space-x-2"
                >
                  <span>Entrar no Painel do Escritório</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Acessos Rápidos de Demonstração para Testes de Avaliação */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Contas de Demonstração Rápida (1-Clique):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffEmail('carlos@silvaadvocacia.com.br');
                      loginStaff('carlos@silvaadvocacia.com.br');
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-left transition-colors"
                  >
                    <span className="font-bold text-slate-900 block">Dr. Carlos Silva</span>
                    <span className="text-[11px] text-blue-700">Administrador Pleno</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStaffEmail('beatriz@silvaadvocacia.com.br');
                      loginStaff('beatriz@silvaadvocacia.com.br');
                    }}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg text-left transition-colors"
                  >
                    <span className="font-bold text-slate-900 block">Dra. Beatriz Lima</span>
                    <span className="text-[11px] text-slate-600">Advogada Associada</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* FLUXO 2: LOGIN E CADASTRO DO CLIENTE (GOOGLE + PERSONALIZADO) */}
          {/* ============================================================ */}
          {activeTab === 'client' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-md text-xs font-semibold mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Acesso Exclusivo para Clientes</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {clientMode === 'login'
                    ? 'Acompanhe seu Processo'
                    : 'Cadastro de Novo Cliente'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {clientMode === 'login'
                    ? 'Acesse com sua conta do Google ou e-mail cadastrado pelo escritório parceiro.'
                    : 'Crie seu acesso personalizado para acompanhar as decisões do seu caso com clareza.'}
                </p>
              </div>

              {clientError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{clientError}</span>
                </div>
              )}

              {clientSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-xs text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{clientSuccess}</span>
                </div>
              )}

              {/* Botão Oficial de Login com o Google (Exigência do Usuário) */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center space-x-3"
              >
                {/* Ícone Oficial SVG Google */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com o Google (Gmail)</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] text-slate-400 uppercase font-semibold">
                  ou acesse com e-mail
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {clientMode === 'login' ? (
                <form onSubmit={handleClientEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      E-mail do Cliente
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com.br"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={clientPassword}
                        onChange={(e) => setClientPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Entrar no Portal do Cliente</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setClientMode('register')}
                      className="text-xs text-emerald-800 hover:text-emerald-900 font-semibold"
                    >
                      Primeiro acesso? Crie seu cadastro personalizado aqui
                    </button>
                  </div>

                  {/* Acesso Rápido de Demonstração para Cliente */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Conta de Demonstração Rápida (1-Clique):
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setClientEmail('mariana.oliveira@gmail.com');
                        loginClientWithEmail('mariana.oliveira@gmail.com');
                      }}
                      className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Mariana Oliveira da Costa</span>
                        <span className="text-[11px] text-emerald-700">Cliente Multi-Escritório (Silva & Assoc. e Rocha & Mendes)</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />
                    </button>
                  </div>
                </form>
              ) : (
                /* Formulário de Criação de Novo Usuário Personalizado */
                <form onSubmit={handleClientRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={clientFullName}
                        onChange={(e) => setClientFullName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com.br"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Telefone / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="(11) 98765-4321"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Escritório de Atendimento Responsável *
                    </label>
                    <select
                      value={clientTenantId}
                      onChange={(e) => setClientTenantId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none bg-white"
                    >
                      {MOCK_TENANTS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Concluir Cadastro e Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setClientMode('login')}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Já possui cadastro? Voltar para o login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
