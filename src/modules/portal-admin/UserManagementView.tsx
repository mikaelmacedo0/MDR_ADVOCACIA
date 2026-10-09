import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/dataService';
import {
  ManagedUser,
  StaffRole,
  MembershipStatus,
  TRADUCAO_PAPEL_STAFF,
  TRADUCAO_STATUS_MEMBRO,
} from '../../types/database';
import { formatDate } from '../../utils/formatters';
import {
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { currentUser, activeTenant } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [passwordTargetUser, setPasswordTargetUser] = useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  // Estados de Formulário
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('lawyer');
  const [formStatus, setFormStatus] = useState<MembershipStatus>('active');

  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const users = dataService.getTenantUsers(currentUser, activeTenant.id);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenCreate = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('lawyer');
    setFeedbackMsg(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const res = dataService.createTenantUser(currentUser, activeTenant.id, {
      display_name: formName,
      email: formEmail,
      password: formPassword,
      role: formRole,
    });

    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Erro ao criar usuário.' });
      return;
    }

    setFeedbackMsg({ type: 'success', text: `Usuário "${formName}" criado com sucesso!` });
    setIsCreateModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setFormName(user.display_name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormStatus(user.status);
    setFeedbackMsg(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const res = dataService.updateTenantUser(currentUser, activeTenant.id, editingUser.id, {
      display_name: formName,
      email: formEmail,
      role: formRole,
      status: formStatus,
    });

    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Erro ao atualizar usuário.' });
      return;
    }

    setFeedbackMsg({ type: 'success', text: 'Dados e permissões atualizados com sucesso!' });
    setEditingUser(null);
    setRefreshKey((k) => k + 1);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;

    if (newPasswordValue !== confirmPasswordValue) {
      setFeedbackMsg({ type: 'error', text: 'A confirmação de senha não confere.' });
      return;
    }

    const res = dataService.changeUserPassword(
      currentUser,
      activeTenant.id,
      passwordTargetUser.user_id,
      newPasswordValue
    );

    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Falha ao redefinir senha.' });
      return;
    }

    setFeedbackMsg({
      type: 'success',
      text: `Senha de ${passwordTargetUser.display_name} redefinida com sucesso!`,
    });
    setPasswordTargetUser(null);
    setNewPasswordValue('');
    setConfirmPasswordValue('');
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;

    const res = dataService.deleteTenantUser(currentUser, activeTenant.id, deletingUser.id);
    if (!res.success) {
      setFeedbackMsg({ type: 'error', text: res.error || 'Erro ao excluir usuário.' });
      setDeletingUser(null);
      return;
    }

    setFeedbackMsg({ type: 'success', text: `Usuário ${deletingUser.display_name} excluído.` });
    setDeletingUser(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div key={refreshKey} className="space-y-6">
      {/* Cabeçalho do Painel de Gestão de Usuários */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-juridico-primary uppercase tracking-wider">
              Administração de Acesso e Governança
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center space-x-2">
            <UserCheck className="h-6 w-6 text-juridico-primary" />
            <span>Gestão de Usuários e Permissões</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Controle de colaboradores vinculados ao escritório <strong>{activeTenant.name}</strong>. Todas as ações são auditadas.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 bg-juridico-primary hover:bg-juridico-dark text-white rounded-lg text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-juridico-primary outline-none bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Filtrar por Papel:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white outline-none focus:ring-2 focus:ring-juridico-primary"
          >
            <option value="all">Todos os Papéis</option>
            <option value="office_admin">Administrador do Escritório</option>
            <option value="lawyer">Advogado(a)</option>
            <option value="collaborator">Assistente / Colaborador</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários Cadastrados */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5 text-left">Nome e Identificação</th>
              <th className="px-4 py-3.5 text-left">E-mail Corporativo</th>
              <th className="px-4 py-3.5 text-left">Papel / Nível de Acesso</th>
              <th className="px-4 py-3.5 text-left">Status</th>
              <th className="px-4 py-3.5 text-left">Cadastrado em</th>
              <th className="px-4 py-3.5 text-right">Ações Administrativas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Nenhum usuário encontrado com os filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isCurrentUser = u.user_id === currentUser.user_id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {u.display_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>{u.display_name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                                Você
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {u.user_id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 font-medium">{u.email}</td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'office_admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'lawyer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {TRADUCAO_PAPEL_STAFF[u.role]}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {TRADUCAO_STATUS_MEMBRO[u.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400">{formatDate(u.created_at)}</td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Alterar permissões e dados"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setPasswordTargetUser(u)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Redefinir senha do usuário"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setDeletingUser(u)}
                          disabled={isCurrentUser}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCurrentUser
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-600 hover:text-red-700 hover:bg-red-50'
                          }`}
                          title={isCurrentUser ? 'Não é possível excluir o próprio usuário' : 'Excluir usuário'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CRIAR NOVO USUÁRIO                              */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-juridico-dark px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Cadastrar Novo Usuário</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Juliana Ferreira"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-juridico-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  placeholder="juliana@escritorio.adv.br"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-juridico-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Senha Provisória
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 6 dígitos (ou gere automaticamente)"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-juridico-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Papel & Permissões *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-juridico-primary bg-white"
                >
                  <option value="office_admin">Administrador do Escritório (Acesso total)</option>
                  <option value="lawyer">Advogado(a) (Gestão de processos e clientes)</option>
                  <option value="collaborator">Assistente / Colaborador (Consulta e andamentos)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-juridico-primary hover:bg-juridico-dark text-white rounded-lg font-bold shadow-sm"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDITAR USUÁRIO & PERMISSÕES                     */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-juridico-dark px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Edit2 className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Alterar Usuário e Permissões</h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-juridico-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-juridico-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Papel / Nível de Acesso
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-juridico-primary bg-white"
                >
                  <option value="office_admin">Administrador do Escritório</option>
                  <option value="lawyer">Advogado(a)</option>
                  <option value="collaborator">Assistente / Colaborador</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status da Conta
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as MembershipStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-juridico-primary bg-white"
                >
                  <option value="active">Ativo (Acesso Liberado)</option>
                  <option value="suspended">Suspenso (Bloqueado por RLS)</option>
                  <option value="invited">Convite Pendente</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-juridico-primary hover:bg-juridico-dark text-white rounded-lg font-bold shadow-sm"
                >
                  Atualizar Permissões
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ALTERAR SENHA                                   */}
      {/* ======================================================== */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-juridico-dark px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <KeyRound className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Redefinir Senha de Acesso</h3>
              </div>
              <button onClick={() => setPasswordTargetUser(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Redefinindo a senha do colaborador: <strong>{passwordTargetUser.display_name}</strong>
              </p>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirme a Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  value={confirmPasswordValue}
                  onChange={(e) => setConfirmPasswordValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONFIRMAÇÃO DE EXCLUSÃO DE USUÁRIO              */}
      {/* ======================================================== */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-red-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-red-200" />
                <h3 className="font-bold text-base text-white">Confirmar Exclusão de Usuário</h3>
              </div>
              <button onClick={() => setDeletingUser(null)} className="text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 text-sm">
                Tem certeza que deseja revogar o acesso e excluir o usuário{' '}
                <strong>{deletingUser.display_name}</strong> ({deletingUser.email})?
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 leading-relaxed">
                <span className="font-bold block mb-1">Aviso de Governança:</span>
                Esta operação remove o vínculo do colaborador com o escritório{' '}
                <strong>{activeTenant.name}</strong>. O histórico de auditoria preservará as ações anteriormente realizadas por ele.
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Sim, Excluir Usuário
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
