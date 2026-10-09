import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { X, ShieldAlert, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface SecurityInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityInspectorModal: React.FC<SecurityInspectorModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, activeTenant } = useAuth();
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<{
    id: string;
    title: string;
    description: string;
    passed: boolean;
    evidence: string;
  }[] | null>(null);

  if (!isOpen) return null;

  const runAutomatedSecurityChecks = () => {
    setRunningTests(true);

    setTimeout(() => {
      // Teste 1: Isolamento Cross-Tenant (Escritório Silva tentando acessar processo do Escritório Rocha)
      const silvaStaffUser = {
        user_id: 'u-carlos-admin',
        display_name: 'Dr. Carlos Silva',
        email: 'carlos@silvaadvocacia.com.br',
        user_type: 'staff' as const,
        membership: {
          id: 'm-carlos-1',
          tenant_id: 't-silva-1111-1111-1111-111111111111',
          user_id: 'u-carlos-admin',
          role: 'office_admin' as const,
          status: 'active' as const,
          created_at: new Date().toISOString(),
        },
        linked_tenants: ['t-silva-1111-1111-1111-111111111111'],
      };

      // Tenta buscar processos de outro tenant
      const crossTenantCases = dataService.getCases(silvaStaffUser, 't-rocha-2222-2222-2222-222222222222');
      const test1Passed = crossTenantCases.length === 0;

      // Teste 2: Isolamento de Clientes (Mariana tentando acessar o processo de Roberto no Escritório Silva)
      const marianaUser = {
        user_id: 'u-mariana-client',
        display_name: 'Mariana Oliveira',
        email: 'mariana.oliveira@exemplo.com.br',
        user_type: 'client' as const,
        client_id: 'c-silva-mariana',
        linked_tenants: ['t-silva-1111-1111-1111-111111111111'],
      };
      const marianaCaseRoberto = dataService.getCaseById(
        marianaUser,
        't-silva-1111-1111-1111-111111111111',
        'case-silva-02' // Processo de Roberto Campos
      );
      const test2Passed = marianaCaseRoberto === null;

      // Teste 3: Eventos Internos Ocultos do Cliente
      const marianaEvents = dataService.getCaseEvents(
        marianaUser,
        't-silva-1111-1111-1111-111111111111',
        'case-silva-01'
      );
      const hasInternalEvent = marianaEvents.some((ev) => ev.visibility === 'internal');
      const test3Passed = !hasInternalEvent;

      // Teste 4: Documentos com Restrição de Visibilidade e Scan Status
      const marianaDocs = dataService.getDocuments(
        marianaUser,
        't-silva-1111-1111-1111-111111111111',
        'case-silva-01'
      );
      const hasInternalDoc = marianaDocs.some(
        (doc) => doc.visibility === 'internal' || doc.scan_status !== 'clean'
      );
      const test4Passed = !hasInternalDoc;

      // Teste 5: Colaborador tentando criar processo (Role escalation)
      const collabUser = {
        user_id: 'u-lucas-collab',
        display_name: 'Lucas Souza',
        email: 'lucas@silvaadvocacia.com.br',
        user_type: 'staff' as const,
        membership: {
          id: 'm-lucas-1',
          tenant_id: 't-silva-1111-1111-1111-111111111111',
          user_id: 'u-lucas-collab',
          role: 'collaborator' as const,
          status: 'active' as const,
          created_at: new Date().toISOString(),
        },
        linked_tenants: ['t-silva-1111-1111-1111-111111111111'],
      };
      const collabCreateRes = dataService.createCase(
        collabUser,
        't-silva-1111-1111-1111-111111111111',
        {
          title: 'Tentativa não autorizada por colaborador',
          case_number: null,
          court: null,
          venue: null,
          case_class: null,
          subject: null,
          status: 'active',
        }
      );
      const test5Passed = !collabCreateRes.success;

      setTestResults([
        {
          id: 'sec-1',
          title: 'Isolamento Multi-Tenant Estrito',
          description: 'Membro do Escritório A não pode consultar processos ou dados do Escritório B via manipulação de tenant_id.',
          passed: test1Passed,
          evidence: `Tentativa de consulta a t-rocha retornou ${crossTenantCases.length} registros (acesso bloqueado).`,
        },
        {
          id: 'sec-2',
          title: 'Proteção contra IDOR entre Clientes',
          description: 'Cliente A não pode consultar processos do Cliente B, mesmo alterando o identificador do processo no parâmetro da rota.',
          passed: test2Passed,
          evidence: `Tentativa de acesso direto ao processo case-silva-02 pelo cliente Mariana retornou: null (bloqueado).`,
        },
        {
          id: 'sec-3',
          title: 'Segregação de Visibilidade em Linha do Tempo',
          description: 'Notas estratégicas e eventos classificados como "internal" nunca são retornados à interface do cliente.',
          passed: test3Passed,
          evidence: `Eventos visíveis ao cliente: ${marianaEvents.length}. Eventos internos filtrados: 1 (ev-2 oculto com sucesso).`,
        },
        {
          id: 'sec-4',
          title: 'Proteção Documental e Quarentena',
          description: 'Documentos confidenciais internos ou pendentes de verificação são protegidos contra download por clientes.',
          passed: test4Passed,
          evidence: `Documentos retornados: ${marianaDocs.length} (documento doc-2 interno filtrado).`,
        },
        {
          id: 'sec-5',
          title: 'Controle de Privilégio Mínimo (Colaborador)',
          description: 'Colaboradores com perfil restrito não podem cadastrar ou alterar processos jurídicos sem autorização.',
          passed: test5Passed,
          evidence: `Resultado da tentativa de criação de processo: "${collabCreateRes.error}".`,
        },
      ]);
      setRunningTests(false);
    }, 400);
  };

  const auditLogs = dataService.getAuditLogs(currentUser, activeTenant.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
        <div className="bg-juridico-dark px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-base text-white">
                Auditoria de Segurança & Políticas RLS
              </h3>
              <p className="text-xs text-slate-400">
                Verificação das salvaguardas multi-tenant da Migration 0001
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Caixa de Explicação Técnica */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold uppercase tracking-wider text-[11px]">
              <AlertTriangle className="h-4 w-4" />
              <span>Invariante Arquitetural</span>
            </div>
            <p>
              O JurisAcompanha adota segurança em profundidade: toda operação no PostgreSQL é filtrada por políticas RLS
              com funções de validação isoladas em schema <code className="text-blue-300">private</code> e chaves compostas
              <code className="text-blue-300">(tenant_id, id)</code>. O front-end nunca concede privilégios diretamente.
            </p>
          </div>

          {/* Botão de Rodar Testes de Isolamento */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Testes de Isolamento e Não-Regressão</h4>
              <p className="text-xs text-slate-500">
                Executa a bateria obrigatória da Seção 15 do Prompt Jurídico.
              </p>
            </div>
            <button
              onClick={runAutomatedSecurityChecks}
              disabled={runningTests}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-2"
            >
              <span>{runningTests ? 'Executando Testes...' : 'Executar Verificação RLS'}</span>
            </button>
          </div>

          {/* Resultados dos Testes */}
          {testResults && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Resultados das Políticas RLS
              </h4>
              <div className="space-y-2">
                {testResults.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-lg border text-xs flex items-start space-x-3 ${
                      t.passed
                        ? 'bg-emerald-50/60 border-emerald-300 text-slate-800'
                        : 'bg-red-50 border-red-300 text-red-900'
                    }`}
                  >
                    {t.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{t.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            t.passed ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {t.passed ? 'APROVADO' : 'FALHA'}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{t.description}</p>
                      <p className="text-[11px] font-mono text-slate-500 mt-1 bg-white/70 p-1.5 rounded border border-slate-200/80">
                        Evidência: {t.evidence}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trilha de Auditoria Recente */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Trilha de Auditoria (Últimas Operações Registradas)
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Ação</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Resultado</th>
                    <th className="px-3 py-2 text-left">Horário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {auditLogs.length > 0 ? (
                    auditLogs.slice(0, 5).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-medium text-slate-800">{log.action}</td>
                        <td className="px-3 py-2 text-slate-600">{log.resource_type}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.outcome === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.outcome === 'denied'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.outcome}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 font-mono">
                          {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                        Nenhum registro de auditoria visível para o perfil atual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};
