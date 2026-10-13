import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/formatters';
import { NewCaseModal } from '../../components/NewCaseModal';
import { NewEventModal } from '../../components/NewEventModal';
import { UserManagementView } from './UserManagementView';
import {
  TRADUCAO_STATUS_PROCESSO,
  TRADUCAO_STATUS_CLIENTE,
  TRADUCAO_VISIBILIDADE,
  TRADUCAO_SCAN_STATUS,
  TRADUCAO_PAPEL_STAFF,
} from '../../types/database';
import {
  Briefcase,
  Users,
  Clock,
  FileText,
  Plus,
  Eye,
  EyeOff,
  Building2,
  Lock,
  Shield,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { currentUser, activeTenant } = useAuth();

  const [activeTab, setActiveTab] = useState<'cases' | 'clients' | 'timeline' | 'documents' | 'users'>('cases');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const role = currentUser.membership?.role;
  const isOfficeAdmin = role === 'office_admin';
  const canCreateCase = isOfficeAdmin || role === 'lawyer';

  // Carrega dados da camada de serviço com isolamento do tenant ativo
  const cases = dataService.getCases(currentUser, activeTenant.id);
  const clients = dataService.getClients(currentUser, activeTenant.id);
  const tenantUsers = isOfficeAdmin ? dataService.getTenantUsers(currentUser, activeTenant.id) : [];

  // Coleta todos os eventos de todos os processos do tenant para a aba Timeline Geral
  const allEvents = cases.flatMap((c) => dataService.getCaseEvents(currentUser, activeTenant.id, c.id));
  allEvents.sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());

  // Coleta todos os documentos
  const allDocuments = cases.flatMap((c) => dataService.getDocuments(currentUser, activeTenant.id, c.id));

  // Filtro de processos
  const filteredCases = cases.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.case_number && c.case_number.includes(searchTerm)) ||
      (c.subject && c.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div key={refreshKey} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner de Identificação do Escritório */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-juridico-primary uppercase tracking-wider">
              Painel de Gestão Jurídica
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
              ID: {activeTenant.id.slice(0, 8)}...
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{activeTenant.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Operando como: <strong className="text-slate-800">{currentUser.display_name}</strong> • Papel:{' '}
            <span className="font-semibold text-blue-700">
              {role ? TRADUCAO_PAPEL_STAFF[role] : 'Colaborador'}
            </span>
          </p>
        </div>

        {/* Botões de Ação do Escritório */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNewEventOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-300"
          >
            <Clock className="h-4 w-4 text-slate-600" />
            <span>Novo Andamento</span>
          </button>

          {canCreateCase ? (
            <button
              onClick={() => setIsNewCaseOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-juridico-primary hover:bg-juridico-dark text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Processo</span>
            </button>
          ) : (
            <div
              title="Apenas Advogados e Administradores do Escritório podem cadastrar novos processos."
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed border border-slate-200"
            >
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Novo Processo (Acesso Restrito)</span>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Métricas e KPIs do Escritório */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-juridico-primary rounded-lg">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Processos Ativos</p>
            <p className="text-lg font-bold text-slate-900">{cases.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Clientes Cadastrados</p>
            <p className="text-lg font-bold text-slate-900">{clients.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Andamentos Registrados</p>
            <p className="text-lg font-bold text-slate-900">{allEvents.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Documentos em Custódia</p>
            <p className="text-lg font-bold text-slate-900">{allDocuments.length}</p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2 sm:gap-6">
        <button
          onClick={() => setActiveTab('cases')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'cases'
              ? 'border-juridico-primary text-juridico-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>Processos ({cases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'clients'
              ? 'border-juridico-primary text-juridico-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Clientes ({clients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'timeline'
              ? 'border-juridico-primary text-juridico-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Andamentos & Linha do Tempo ({allEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'documents'
              ? 'border-juridico-primary text-juridico-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Documentos ({allDocuments.length})</span>
        </button>

        {/* Aba Exclusiva de Gestão de Usuários (Administrador) */}
        {isOfficeAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'border-purple-700 text-purple-700 font-bold'
                : 'border-transparent text-purple-800/80 hover:text-purple-900'
            }`}
          >
            <Shield className="h-4 w-4 text-purple-600" />
            <span>Gestão de Usuários & Permissões ({tenantUsers.length})</span>
          </button>
        )}
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Buscar processo por título, CNJ ou assunto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm w-full max-w-md focus:ring-2 focus:ring-juridico-primary outline-none bg-white"
            />
          </div>

          {filteredCases.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center border border-slate-200 text-slate-500 text-sm">
              Nenhum processo encontrado para este escritório com os filtros informados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCases.map((c) => {
                const caseEvs = dataService.getCaseEvents(currentUser, activeTenant.id, c.id);
                const caseDocs = dataService.getDocuments(currentUser, activeTenant.id, c.id);

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {c.case_class || 'Procedimento Comum'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {formatDate(c.created_at)}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-2">{c.title}</h3>

                      {c.case_number ? (
                        <p className="text-xs font-mono font-medium text-blue-700 mt-1">
                          CNJ: {c.case_number}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">Sem número CNJ cadastrado</p>
                      )}

                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <p className="flex items-center">
                          <Building2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          <span>{c.court || 'Tribunal não informado'}</span>
                        </p>
                        {c.venue && <p className="text-slate-500 pl-5">{c.venue}</p>}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{caseEvs.length} andamentos</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>{caseDocs.length} documentos</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[11px] text-slate-700">
                        {TRADUCAO_STATUS_PROCESSO[c.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Nome Completo</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Cadastrado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {clients.map((cl) => (
                <tr key={cl.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{cl.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{cl.email || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{cl.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      {TRADUCAO_STATUS_CLIENTE[cl.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(cl.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Linha do Tempo Completa do Escritório ({activeTenant.name})
          </h2>
          <div className="space-y-4">
            {allEvents.map((ev) => (
              <div key={ev.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{ev.title}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {ev.event_type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {ev.visibility === 'client' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <Eye className="w-3 h-3 mr-1" />
                        Visível ao Cliente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Apenas Interno (Confidencial)
                      </span>
                    )}
                    <span className="text-slate-400">{formatDateTime(ev.event_at)}</span>
                  </div>
                </div>

                {ev.description && <p className="text-slate-600">{ev.description}</p>}

                {ev.plain_explanation && (
                  <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded text-blue-900 font-medium">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-blue-700 mb-0.5">
                      Explicação enviada ao cliente em linguagem simples:
                    </span>
                    {ev.plain_explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Arquivo</th>
                <th className="px-4 py-3 text-left">Tamanho</th>
                <th className="px-4 py-3 text-left">Visibilidade</th>
                <th className="px-4 py-3 text-left">Status de Verificação</th>
                <th className="px-4 py-3 text-left">Data de Juntada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {allDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>{doc.original_filename}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatFileSize(doc.byte_size)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.visibility === 'client'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {TRADUCAO_VISIBILIDADE[doc.visibility]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.scan_status === 'clean'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {TRADUCAO_SCAN_STATUS[doc.scan_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(doc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aba de Gestão de Usuários do Administrador */}
      {activeTab === 'users' && isOfficeAdmin && <UserManagementView />}

      {/* Modais */}
      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        onSuccess={handleRefresh}
      />

      <NewEventModal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        onSuccess={handleRefresh}
        cases={cases}
      />
    </div>
  );
};
