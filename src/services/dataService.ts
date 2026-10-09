// JurisAcompanha — Camada de Acesso a Dados com Verificação de Regras RLS
// Simula estritamente as restrições de isolamento da Migration 0001 no ambiente de desenvolvimento

import {
  Tenant,
  Case,
  CaseEvent,
  Document,
  Client,
  AuditLog,
  ActiveUserContext,
  AuditOutcome,
} from '../types/database';
import {
  MOCK_TENANTS,
  MOCK_CASES,
  MOCK_CASE_CLIENT_LINKS,
  MOCK_CASE_EVENTS,
  MOCK_DOCUMENTS,
  MOCK_CLIENTS,
  MOCK_AUDIT_LOGS,
  MOCK_MEMBERSHIPS,
  MOCK_PROFILES,
  MOCK_CLIENT_USER_LINKS,
} from './mockData';
import {
  ManagedUser,
  CreateUserPayload,
  UpdateUserPayload,
  Membership,
  Profile,
  ClientUserLink,
} from '../types/database';

class JurisDataService {
  private cases: Case[] = [...MOCK_CASES];
  private events: CaseEvent[] = [...MOCK_CASE_EVENTS];
  private documents: Document[] = [...MOCK_DOCUMENTS];
  private clients: Client[] = [...MOCK_CLIENTS];
  private auditLogs: AuditLog[] = [...MOCK_AUDIT_LOGS];
  private memberships: Membership[] = [...MOCK_MEMBERSHIPS];
  private profiles: Profile[] = [...MOCK_PROFILES];
  private clientUserLinks: ClientUserLink[] = [...MOCK_CLIENT_USER_LINKS];

  // ==========================================
  // Helper de Auditoria
  // ==========================================
  private logAudit(
    tenantId: string | null,
    actorId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    outcome: AuditOutcome,
    metadata: Record<string, unknown> = {}
  ) {
    const entry: AuditLog = {
      id: this.auditLogs.length + 1,
      tenant_id: tenantId,
      actor_user_id: actorId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      outcome,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
  }

  // ==========================================
  // Tenants
  // ==========================================
  public getTenants(user: ActiveUserContext): Tenant[] {
    if (user.user_type === 'staff') {
      const allowedTenantId = user.membership?.tenant_id;
      return MOCK_TENANTS.filter((t) => t.id === allowedTenantId);
    }
    // Cliente acessa apenas escritórios aos quais está vinculado em client_user_links
    return MOCK_TENANTS.filter((t) => user.linked_tenants.includes(t.id));
  }

  // ==========================================
  // Processos (Cases) - RLS Simulation
  // ==========================================
  public getCases(user: ActiveUserContext, activeTenantId: string): Case[] {
    // Regra: Tenant isolado
    const tenantCases = this.cases.filter((c) => c.tenant_id === activeTenantId);

    if (user.user_type === 'staff') {
      // Membro do escritório visualiza todos os processos do seu tenant
      if (user.membership?.tenant_id !== activeTenantId) {
        this.logAudit(
          activeTenantId,
          user.user_id,
          'CASES_SELECT',
          'case',
          null,
          'denied',
          { reason: 'Staff does not belong to active tenant' }
        );
        return [];
      }
      return tenantCases;
    }

    // Se for Cliente: apenas processos com vínculo explícito em case_client_links
    // e com o client_id vinculado ao usuário no tenant específico!
    const linkedCaseIds = MOCK_CASE_CLIENT_LINKS.filter(
      (ccl) => ccl.tenant_id === activeTenantId && ccl.client_id === user.client_id
    ).map((ccl) => ccl.case_id);

    return tenantCases.filter((c) => linkedCaseIds.includes(c.id));
  }

  public getCaseById(user: ActiveUserContext, activeTenantId: string, caseId: string): Case | null {
    const c = this.cases.find((item) => item.id === caseId && item.tenant_id === activeTenantId);
    if (!c) {
      this.logAudit(activeTenantId, user.user_id, 'CASE_GET_BY_ID', 'case', caseId, 'denied', {
        reason: 'Case not found or wrong tenant',
      });
      return null;
    }

    if (user.user_type === 'client') {
      const isLinked = MOCK_CASE_CLIENT_LINKS.some(
        (link) =>
          link.tenant_id === activeTenantId &&
          link.case_id === caseId &&
          link.client_id === user.client_id
      );
      if (!isLinked) {
        this.logAudit(activeTenantId, user.user_id, 'CASE_GET_BY_ID', 'case', caseId, 'denied', {
          reason: 'Client not linked to case (IDOR prevented)',
        });
        return null;
      }
    }

    return c;
  }

  public createCase(
    user: ActiveUserContext,
    activeTenantId: string,
    caseData: Omit<Case, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by'>
  ): { success: boolean; data?: Case; error?: string } {
    // RLS: Apenas office_admin e lawyer podem criar processo
    if (user.user_type !== 'staff' || !['office_admin', 'lawyer'].includes(user.membership?.role || '')) {
      this.logAudit(activeTenantId, user.user_id, 'CASE_INSERT', 'case', null, 'denied', {
        role: user.membership?.role,
      });
      return { success: false, error: 'Apenas Advogados e Administradores podem cadastrar processos.' };
    }

    const newCase: Case = {
      ...caseData,
      id: `case-${Date.now()}`,
      tenant_id: activeTenantId,
      created_by: user.user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.cases.unshift(newCase);
    this.logAudit(activeTenantId, user.user_id, 'CASE_INSERT', 'case', newCase.id, 'success');
    return { success: true, data: newCase };
  }

  // ==========================================
  // Timeline e Eventos - RLS Simulation
  // ==========================================
  public getCaseEvents(user: ActiveUserContext, activeTenantId: string, caseId: string): CaseEvent[] {
    const caseEvents = this.events.filter(
      (ev) => ev.tenant_id === activeTenantId && ev.case_id === caseId
    );

    if (user.user_type === 'staff') {
      // Staff vê eventos internos e eventos visíveis para clientes
      return caseEvents.sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
    }

    // Cliente: SOMENTE eventos com visibility === 'client'
    // E apenas se tiver vínculo com o processo
    const isLinked = MOCK_CASE_CLIENT_LINKS.some(
      (link) =>
        link.tenant_id === activeTenantId &&
        link.case_id === caseId &&
        link.client_id === user.client_id
    );

    if (!isLinked) return [];

    return caseEvents
      .filter((ev) => ev.visibility === 'client')
      .sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime());
  }

  public addCaseEvent(
    user: ActiveUserContext,
    activeTenantId: string,
    eventData: Omit<CaseEvent, 'id' | 'tenant_id' | 'created_at' | 'created_by'>
  ): { success: boolean; data?: CaseEvent; error?: string } {
    // Staff de qualquer função ativa pode adicionar evento
    if (user.user_type !== 'staff' || user.membership?.tenant_id !== activeTenantId) {
      return { success: false, error: 'Operação não autorizada. Apenas colaboradores do escritório podem registrar eventos.' };
    }

    const newEvent: CaseEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
      tenant_id: activeTenantId,
      created_by: user.user_id,
      created_at: new Date().toISOString(),
    };

    this.events.unshift(newEvent);
    this.logAudit(activeTenantId, user.user_id, 'EVENT_INSERT', 'case_event', newEvent.id, 'success', {
      visibility: newEvent.visibility,
    });
    return { success: true, data: newEvent };
  }

  // ==========================================
  // Documentos - RLS Simulation
  // ==========================================
  public getDocuments(user: ActiveUserContext, activeTenantId: string, caseId: string): Document[] {
    const docs = this.documents.filter(
      (d) => d.tenant_id === activeTenantId && d.case_id === caseId
    );

    if (user.user_type === 'staff') {
      return docs;
    }

    // Cliente: somente visibility === 'client' E scan_status === 'clean'
    return docs.filter((d) => d.visibility === 'client' && d.scan_status === 'clean');
  }

  // ==========================================
  // Clientes do Escritório
  // ==========================================
  public getClients(user: ActiveUserContext, activeTenantId: string): Client[] {
    if (user.user_type !== 'staff') {
      // Cliente não pode listar a tabela geral de clientes
      return [];
    }
    return this.clients.filter((c) => c.tenant_id === activeTenantId);
  }

  // ==========================================
  // Auditoria
  // ==========================================
  public getAuditLogs(user: ActiveUserContext, activeTenantId: string): AuditLog[] {
    // Conforme a Migration 0001: audit_logs não é exposta a clientes
    if (user.user_type !== 'staff' || user.membership?.role !== 'office_admin') {
      return [];
    }
    return this.auditLogs.filter((a) => a.tenant_id === activeTenantId);
  }

  // ==========================================
  // Gestão de Usuários (Administrador do Escritório)
  // ==========================================
  public getTenantUsers(user: ActiveUserContext, activeTenantId: string): ManagedUser[] {
    // Apenas Administradores do Escritório podem gerenciar usuários
    if (user.user_type !== 'staff' || user.membership?.tenant_id !== activeTenantId) {
      return [];
    }

    const tenantMemberships = this.memberships.filter((m) => m.tenant_id === activeTenantId);
    return tenantMemberships.map((m) => {
      const prof = this.profiles.find((p) => p.user_id === m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        tenant_id: m.tenant_id,
        display_name: prof?.display_name || 'Usuário Sem Nome',
        email: prof ? `${m.user_id.replace('u-', '')}@${MOCK_TENANTS.find((t) => t.id === activeTenantId)?.slug}.com.br` : 'usuario@escritorio.adv.br',
        role: m.role,
        status: m.status,
        created_at: m.created_at,
        last_login: 'Hoje às 14:10',
      };
    });
  }

  public createTenantUser(
    adminUser: ActiveUserContext,
    activeTenantId: string,
    payload: CreateUserPayload
  ): { success: boolean; data?: ManagedUser; error?: string } {
    if (adminUser.user_type !== 'staff' || adminUser.membership?.role !== 'office_admin') {
      this.logAudit(activeTenantId, adminUser.user_id, 'USER_CREATE_ATTEMPT', 'membership', null, 'denied', {
        reason: 'Apenas Administradores do Escritório podem criar novos usuários.',
      });
      return { success: false, error: 'Apenas Administradores têm permissão para criar usuários.' };
    }

    if (!payload.display_name.trim() || !payload.email.trim()) {
      return { success: false, error: 'Nome e e-mail são obrigatórios.' };
    }

    const newUserId = `u-${Date.now()}`;
    const newMembershipId = `m-${Date.now()}`;

    const newProfile: Profile = {
      user_id: newUserId,
      display_name: payload.display_name.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newMembership: Membership = {
      id: newMembershipId,
      tenant_id: activeTenantId,
      user_id: newUserId,
      role: payload.role,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    this.profiles.push(newProfile);
    this.memberships.push(newMembership);

    this.logAudit(activeTenantId, adminUser.user_id, 'USER_CREATED', 'membership', newMembershipId, 'success', {
      email: payload.email,
      role: payload.role,
    });

    const createdUser: ManagedUser = {
      id: newMembershipId,
      user_id: newUserId,
      tenant_id: activeTenantId,
      display_name: newProfile.display_name,
      email: payload.email.trim(),
      role: newMembership.role,
      status: newMembership.status,
      created_at: newMembership.created_at,
      last_login: 'Recém criado',
    };

    return { success: true, data: createdUser };
  }

  public updateTenantUser(
    adminUser: ActiveUserContext,
    activeTenantId: string,
    membershipId: string,
    payload: UpdateUserPayload
  ): { success: boolean; error?: string } {
    if (adminUser.user_type !== 'staff' || adminUser.membership?.role !== 'office_admin') {
      return { success: false, error: 'Apenas Administradores podem alterar usuários e permissões.' };
    }

    const membership = this.memberships.find((m) => m.id === membershipId && m.tenant_id === activeTenantId);
    if (!membership) {
      return { success: false, error: 'Usuário não encontrado neste escritório.' };
    }

    // Atualiza permissão/papel e status
    membership.role = payload.role;
    membership.status = payload.status;

    // Atualiza perfil
    const prof = this.profiles.find((p) => p.user_id === membership.user_id);
    if (prof) {
      prof.display_name = payload.display_name.trim();
      prof.updated_at = new Date().toISOString();
    }

    this.logAudit(activeTenantId, adminUser.user_id, 'USER_UPDATED', 'membership', membershipId, 'success', {
      new_role: payload.role,
      new_status: payload.status,
    });

    return { success: true };
  }

  public changeUserPassword(
    adminUser: ActiveUserContext,
    activeTenantId: string,
    targetUserId: string,
    newPassword?: string
  ): { success: boolean; error?: string } {
    if (adminUser.user_type !== 'staff' || adminUser.membership?.role !== 'office_admin') {
      return { success: false, error: 'Apenas Administradores podem redefinir senhas.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A senha deve possuir no mínimo 6 caracteres.' };
    }

    this.logAudit(activeTenantId, adminUser.user_id, 'PASSWORD_RESET', 'auth.users', targetUserId, 'success', {
      changed_by_admin: adminUser.user_id,
    });

    return { success: true };
  }

  public deleteTenantUser(
    adminUser: ActiveUserContext,
    activeTenantId: string,
    membershipId: string
  ): { success: boolean; error?: string } {
    if (adminUser.user_type !== 'staff' || adminUser.membership?.role !== 'office_admin') {
      return { success: false, error: 'Apenas Administradores podem excluir usuários.' };
    }

    const membership = this.memberships.find((m) => m.id === membershipId && m.tenant_id === activeTenantId);
    if (!membership) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    // Regra de segurança: Não permitir autoexclusão do próprio administrador logado
    if (membership.user_id === adminUser.user_id) {
      return { success: false, error: 'Ação bloqueada: você não pode excluir a sua própria conta de administrador.' };
    }

    this.memberships = this.memberships.filter((m) => m.id !== membershipId);
    this.logAudit(activeTenantId, adminUser.user_id, 'USER_DELETED', 'membership', membershipId, 'success', {
      deleted_user_id: membership.user_id,
      deleted_role: membership.role,
    });

    return { success: true };
  }

  // ==========================================
  // Cadastro e Autenticação de Clientes
  // ==========================================
  public registerClient(
    activeTenantId: string,
    payload: {
      full_name: string;
      email: string;
      phone?: string;
      authProvider: 'google' | 'custom';
    }
  ): { success: boolean; userContext?: ActiveUserContext; error?: string } {
    if (!payload.full_name.trim() || !payload.email.trim()) {
      return { success: false, error: 'Nome e e-mail são obrigatórios para cadastro.' };
    }

    const newUserId = `u-client-${Date.now()}`;
    const newClientId = `c-client-${Date.now()}`;

    // Cria registro de cliente no escritório
    const newClient: Client = {
      id: newClientId,
      tenant_id: activeTenantId,
      full_name: payload.full_name.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.clients.push(newClient);

    // Cria profile
    const newProfile: Profile = {
      user_id: newUserId,
      display_name: newClient.full_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.push(newProfile);

    // Cria vínculo client_user_link
    const newLink: ClientUserLink = {
      id: `cul-${Date.now()}`,
      tenant_id: activeTenantId,
      client_id: newClientId,
      user_id: newUserId,
      created_at: new Date().toISOString(),
    };
    this.clientUserLinks.push(newLink);

    this.logAudit(activeTenantId, newUserId, 'CLIENT_ACCOUNT_REGISTERED', 'client_user_links', newLink.id, 'success', {
      auth_provider: payload.authProvider,
      email: payload.email,
    });

    const userContext: ActiveUserContext = {
      user_id: newUserId,
      display_name: newClient.full_name,
      email: newClient.email || payload.email,
      user_type: 'client',
      client_id: newClientId,
      linked_tenants: [activeTenantId],
    };

    return { success: true, userContext };
  }
}

export const dataService = new JurisDataService();
