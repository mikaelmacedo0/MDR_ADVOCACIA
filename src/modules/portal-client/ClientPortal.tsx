import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/formatters';
import {
  FileText,
  Clock,
  Download,
  Building2,
  Phone,
  Mail,
  HelpCircle,
} from 'lucide-react';

export const ClientPortal: React.FC = () => {
  const { currentUser, activeTenant, availableTenants, switchTenant } = useAuth();
  const cases = dataService.getCases(currentUser, activeTenant.id);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const events = activeCase ? dataService.getCaseEvents(currentUser, activeTenant.id, activeCase.id) : [];
  const documents = activeCase ? dataService.getDocuments(currentUser, activeTenant.id, activeCase.id) : [];

  const handleDownload = (docName: string) => {
    alert(`[JurisAcompanha] Gerando URL assinada temporária (validade: 15 minutos) para download seguro de: "${docName}"`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner de Boas-Vindas em Linguagem Clara */}
      <div className="bg-gradient-to-r from-juridico-dark to-juridico-primary rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold border border-blue-400/30">
            <span>Portal do Cliente • Acompanhamento Descomplicado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {currentUser.display_name.split(' ')[0]}!
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Aqui você acompanha os passos do seu processo de forma clara, transparente e segura. 
            Todas as novidades importantes são explicadas em linguagem simples para você entender cada etapa.
          </p>
        </div>

        {/* Notificação de Multi-Escritório se aplicável */}
        {availableTenants.length > 1 && (
          <div className="mt-6 pt-4 border-t border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-blue-200">
              <Building2 className="h-4 w-4 text-amber-300" />
              <span>Você possui processos em mais de um escritório parceiro:</span>
            </div>
            <div className="flex items-center gap-2">
              {availableTenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTenant(t.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    t.id === activeTenant.id
                      ? 'bg-white text-juridico-dark font-bold shadow-md'
                      : 'bg-blue-900/60 text-blue-200 hover:bg-blue-800/80 border border-blue-700/50'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {cases.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <FileText className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Nenhum processo ativo encontrado</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Não há processos associados ao seu cadastro neste escritório ({activeTenant.name}) no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Lista de Processos do Cliente */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Seus Processos ({cases.length})</span>
            </h2>

            <div className="space-y-3">
              {cases.map((c) => {
                const isSelected = c.id === activeCase?.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${
                      isSelected
                        ? 'bg-blue-50/70 border-juridico-primary shadow-md ring-1 ring-juridico-primary'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Em Andamento
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDate(c.created_at)}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-2">
                      {c.title}
                    </h3>

                    {c.case_number && (
                      <p className="text-xs font-mono text-slate-500 mt-1">
                        CNJ: {c.case_number}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 mt-2 flex items-center">
                      <Building2 className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      {c.court || 'Tribunal de Justiça'}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Cartão de Ajuda e Contato do Escritório */}
            <div className="bg-slate-100/80 rounded-xl p-4 border border-slate-200 text-xs space-y-3">
              <div className="flex items-center space-x-2 text-slate-800 font-bold">
                <HelpCircle className="h-4 w-4 text-juridico-primary" />
                <span>Precisa de esclarecimentos?</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Nossa equipe jurídica está à disposição para tirar dúvidas sobre o seu processo.
              </p>
              <div className="space-y-1 pt-1 text-slate-700">
                <div className="flex items-center space-x-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-medium">(11) 3456-7890</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <span className="font-medium">contato@{activeTenant.slug}.com.br</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 2 e 3: Linha do Tempo Simplificada e Documentos Autorizados */}
          <div className="lg:col-span-2 space-y-6">
            {activeCase && (
              <>
                {/* Resumo do Processo Selecionado */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div>
                      <span className="text-xs font-bold text-juridico-primary uppercase tracking-wider">
                        {activeCase.case_class || 'Ação Judicial'}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                        {activeCase.title}
                      </h2>
                    </div>
                    {activeCase.case_number && (
                      <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 text-right">
                        <span className="text-[10px] text-slate-400 block font-sans">Número do Processo</span>
                        {activeCase.case_number}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700 block">Vara / Juízo:</span>
                      <span>{activeCase.venue || 'Vara Cível'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 block">Assunto Principal:</span>
                      <span>{activeCase.subject || 'Indenização / Obrigações'}</span>
                    </div>
                  </div>
                </div>

                {/* Linha do Tempo em Linguagem Simples */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-juridico-primary" />
                      <span>Andamento do Processo (Explicado para Você)</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      {events.length} atualizações liberadas
                    </span>
                  </div>

                  {events.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Nenhuma atualização publicada ainda para este processo.
                    </div>
                  ) : (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                      {events.map((ev, index) => (
                        <div key={ev.id} className="relative flex items-start space-x-4 pl-1">
                          {/* Marcador */}
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white z-10 ${
                              index === 0
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                              <span className="font-bold text-slate-900 text-sm">
                                {ev.title}
                              </span>
                              <span className="text-slate-400 font-medium">
                                {formatDateTime(ev.event_at)}
                              </span>
                            </div>

                            {/* Destaque para a explicação simplificada */}
                            {ev.plain_explanation ? (
                              <div className="mt-2.5 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-950 text-xs sm:text-sm font-medium leading-relaxed">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block mb-0.5">
                                  O que isto significa na prática:
                                </span>
                                {ev.plain_explanation}
                              </div>
                            ) : null}

                            {/* Descrição técnica adicional */}
                            {ev.description && (
                              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                {ev.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documentos Liberados para o Cliente */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-juridico-primary" />
                      <span>Documentos Disponíveis para Download</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      {documents.length} documentos verificados
                    </span>
                  </div>

                  {documents.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3">
                      Nenhum documento público liberado para este processo até o momento.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                            <div>
                              <p className="font-semibold text-slate-800">{doc.original_filename}</p>
                              <p className="text-[11px] text-slate-400">
                                {formatFileSize(doc.byte_size)} • {formatDate(doc.created_at)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(doc.original_filename)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-juridico-primary font-medium rounded-lg transition-colors border border-blue-200"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Baixar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
