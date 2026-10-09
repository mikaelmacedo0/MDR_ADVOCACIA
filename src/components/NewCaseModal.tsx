import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/dataService';
import { formatCNJ, validateCNJ } from '../utils/cnjValidator';
import { CaseStatus } from '../types/database';
import { X, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser, activeTenant } = useAuth();

  const [title, setTitle] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [court, setCourt] = useState('Tribunal de Justiça de São Paulo');
  const [venue, setVenue] = useState('');
  const [caseClass, setCaseClass] = useState('Procedimento Comum Cível');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState<CaseStatus>('active');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const cnjValidation = caseNumber ? validateCNJ(caseNumber) : null;

  const handleCnjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNJ(e.target.value);
    setCaseNumber(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('O título do processo é obrigatório.');
      return;
    }

    if (caseNumber && cnjValidation && !cnjValidation.isValid) {
      setErrorMsg(`Número CNJ inválido: ${cnjValidation.error}`);
      return;
    }

    const res = dataService.createCase(currentUser, activeTenant.id, {
      title: title.trim(),
      case_number: caseNumber ? caseNumber.trim() : null,
      court: court.trim() || null,
      venue: venue.trim() || null,
      case_class: caseClass.trim() || null,
      subject: subject.trim() || null,
      status,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Falha ao registrar processo.');
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="bg-juridico-dark px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-base text-white">Novo Processo Judicial</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1 transition-colors"
          >
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
              Título / Identificação da Ação *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Ação Revisional de Contrato Bancário"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary focus:border-juridico-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Número CNJ (20 Dígitos)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="NNNNNNN-DD.AAAA.J.TR.OOOO"
                value={caseNumber}
                onChange={handleCnjChange}
                maxLength={25}
                className={`w-full px-3 py-2 font-mono text-sm border rounded-lg outline-none ${
                  cnjValidation
                    ? cnjValidation.isValid
                      ? 'border-emerald-500 focus:ring-emerald-500'
                      : 'border-amber-400 focus:ring-amber-500'
                    : 'border-slate-300 focus:ring-juridico-primary'
                }`}
              />
              {cnjValidation && (
                <div className="absolute right-3 top-2.5">
                  {cnjValidation.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  )}
                </div>
              )}
            </div>
            {cnjValidation && (
              <p
                className={`text-xs mt-1 font-medium ${
                  cnjValidation.isValid ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {cnjValidation.isValid
                  ? `CNJ Válido: ${cnjValidation.details?.court} • Ano ${cnjValidation.details?.year}`
                  : cnjValidation.error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tribunal
              </label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Vara / Comarca
              </label>
              <input
                type="text"
                placeholder="Ex: 5ª Vara Cível - Foro Central"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Classe Processual
              </label>
              <input
                type="text"
                value={caseClass}
                onChange={(e) => setCaseClass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assunto
              </label>
              <input
                type="text"
                placeholder="Ex: Obrigações / Espécies de Contratos"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status Processual
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CaseStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-juridico-primary outline-none"
            >
              <option value="active">Em Andamento (Ativo)</option>
              <option value="suspended">Suspenso</option>
              <option value="archived">Arquivado</option>
              <option value="concluded">Concluído / Julgado</option>
            </select>
          </div>

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
              Salvar Processo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
