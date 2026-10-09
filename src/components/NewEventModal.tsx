import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { Case, VisibilityType } from '../types/database';
import { X, Clock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cases: Case[];
  initialCaseId?: string;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  cases,
  initialCaseId,
}) => {
  const { currentUser, activeTenant } = useAuth();

  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId || cases[0]?.id || '');
  const [eventType, setEventType] = useState('Petição Protocolada');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plainExplanation, setPlainExplanation] = useState('');
  const [visibility, setVisibility] = useState<VisibilityType>('client');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCaseId) {
      setErrorMsg('Selecione um processo.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('O título do andamento é obrigatório.');
      return;
    }

    const res = dataService.addCaseEvent(currentUser, activeTenant.id, {
      case_id: selectedCaseId,
      event_type: eventType,
      title: title.trim(),
      description: description.trim() || null,
      plain_explanation: visibility === 'client' ? plainExplanation.trim() || null : null,
      visibility,
      event_at: new Date().toISOString(),
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao registrar evento.');
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        <div className="bg-juridico-dark px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-base text-white">Novo Andamento / Movimentação</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Processo Vinculado *
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
              required
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.case_number || 'Sem CNJ'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Registro
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
              >
                <option value="Petição Protocolada">Petição Protocolada</option>
                <option value="Decisão Judicial">Decisão Judicial / Despacho</option>
                <option value="Audiência Realizada">Audiência Realizada</option>
                <option value="Documentação Juntada">Documentação Juntada</option>
                <option value="Nota Interna do Escritório">Nota Interna do Escritório</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visibilidade RLS *
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <button
                  type="button"
                  onClick={() => setVisibility('client')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                    visibility === 'client'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Liberar ao Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('internal')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                    visibility === 'internal'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Apenas Interno</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Título do Evento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Juntada de Petição de Réplica"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descrição Técnica (Jurídica)
            </label>
            <textarea
              rows={2}
              placeholder="Descreva os detalhes processuais técnicos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
            />
          </div>

          {visibility === 'client' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">
                Explicação em Linguagem Simples (Visível ao Cliente)
              </label>
              <textarea
                rows={2}
                placeholder="Explique o andamento de forma clara e acessível, sem juridiquês desnecessário..."
                value={plainExplanation}
                onChange={(e) => setPlainExplanation(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-blue-700 mt-1">
                Esta explicação será exibida no Portal do Cliente com destaque amigável.
              </p>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-juridico-primary hover:bg-juridico-dark text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              Registrar Andamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
